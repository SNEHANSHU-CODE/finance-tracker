"""
parsers/pdf_parser.py
Extracts transactions from bank statement PDFs.

Uses PyMuPDF 1.23+ spatial APIs — consistent output on ALL platforms
(Windows, Linux, Mac) because it works from coordinates, not text stream order.

Extraction pipeline (per page):
  1. page.find_tables()  — detects table structure spatially, returns clean 2D rows.
                           Handles every PDF layout without regex or mode switching.
  2. get_text("words") + Y-grouping  — fallback for PDFs with no detectable tables
                           (e.g. plain-text statements). Words are sorted by their
                           X coordinate so rows are always reconstructed correctly
                           regardless of OS or MuPDF version.

Supported bank statement formats (both paths):
  • Explicit type column  : Date | Desc | Category | income/expense | Amount
  • Single amount+balance : Date | Desc | Amount | Balance
  • Debit/Credit columns  : Date | Desc | Debit | Credit | Balance
  • Dr/Cr suffix          : Date | Desc | Amount Dr/Cr
  • UPI format            : Date | UPI/DR|CR/ref/Payee/... | - | col1 | col2 | Balance

Password-protected PDFs supported via optional password argument.
"""

import re
import logging
from collections import defaultdict
from typing import Optional

from ..shared.schemas import ExtractedTransaction
from app.utils.PdfOcrService import PDFOCRService, OCRError  # OCR fallback for scanned pages
from ..shared.classifier import classify_transaction
from ..shared.date_parser import parse_date, today_iso

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Custom exception
# ---------------------------------------------------------------------------

class PDFPasswordError(Exception):
    """Raised when PDF is encrypted and the supplied password is wrong/missing."""
    pass


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Words within this many pixels vertically = same line
_Y_TOLERANCE = 3

# Lines that signal the end of the transaction section
_SECTION_STOP_RE = re.compile(
    r"^(summary|total income|total expenses|net savings|savings rate"
    r"|goal name|target date|target \(|metric\s+\w"
    r"|in progress|completed|on track)",
    re.IGNORECASE,
)

# Header rows to skip
_HEADER_ROWS = frozenset([
    "date",
    "date description category type amount",
    "date description debit credit balance",
    "date narration debit credit balance",
    "date particulars debit credit balance",
    "value date transaction details debit credit balance",
    "txn date description withdrawal deposit balance",
    "date description debit ($) credit ($) balance ($)",
    "description debit ($) credit ($) balance ($)",
    "debit ($) credit ($) balance ($)",
])

# Metadata phrases — skip any line containing these
_SKIP_PHRASES = frozenset([
    "opening balance", "closing balance",
    "account statement", "bank statement",
    "account no", "account number", "account holder",
    "ifsc code", "branch name", "branch address",
    "customer id", "customer name",
    "statement period", "statement date",
    "page no", "page of",
])

# Bullet / icon characters that appear in non-transaction tables (goals, status)
_JUNK_CHARS_RE = re.compile(r"[•►▶●■□✅✗\u2022\u25cf\u2714]")

# Income indicator keywords for description-based type inference
_INCOME_KW = frozenset([
    "credit", "salary", "received", "refund", "cashback",
    "interest earned", "dividend", "freelance", "bonus",
    "inward", "deposit", "transfer in",
    "neft in", "imps in", "rtgs in", "online transfer",
])

# Category column words — stripped from description when they appear as a trailing word
_CAT_LABELS = {
    "salary", "housing", "food", "transport", "transportation", "entertainment",
    "utilities", "shopping", "healthcare", "investment", "education", "health",
    "travel", "insurance", "rent", "balance", "other", "category", "income",
}

_SKIP_DESCS = {"opening balance", "closing balance"}

_NIL = {"-", "0", "0.0", "0.00", ""}

# Amount pattern — used when parsing reconstructed text lines
# Minimum chars from pymupdf per page before OCR fallback is attempted
_OCR_MIN_CHARS_PER_PAGE = 20

_AMT_RE = re.compile(r"[₹$€£]?[+\-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?")

# Type keywords
_TYPE_KW = frozenset(["income", "expense", "debit", "credit"])


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _clean(raw: str) -> Optional[float]:
    """Parse a currency string to float. Returns None on failure."""
    try:
        return float(re.sub(r"[₹$€£,\s]", "", raw.strip()))
    except (ValueError, AttributeError):
        return None


def _infer_type(desc: str) -> str:
    lower = desc.lower()
    return "Income" if any(kw in lower for kw in _INCOME_KW) else "Expense"


def _strip_cat_label(desc: str) -> str:
    """Remove trailing category column word from description."""
    words = desc.strip().split()
    if len(words) > 1 and words[-1].lower() in _CAT_LABELS:
        return " ".join(words[:-1]).strip()
    return desc.strip()


def _should_skip_line(line: str) -> bool:
    lower = line.lower().strip()
    if re.match(r"^[-=\s]{4,}$", line):
        return True
    if lower in _HEADER_ROWS:
        return True
    if re.match(r"^(total|summary|net savings|savings rate|running balance)", lower):
        return True
    return any(ph in lower for ph in _SKIP_PHRASES)


def _is_section_stop(line: str) -> bool:
    return bool(_SECTION_STOP_RE.match(line.strip()))


def _build(
    desc: str,
    amount: Optional[float],
    txn_type: str,
    category: str,
    date_str: str,
) -> ExtractedTransaction:
    return ExtractedTransaction(
        description   = desc[:100] if desc else "",
        amount        = round(abs(amount), 2) if amount is not None else None,
        type          = txn_type,
        category      = category,
        date          = date_str,
        paymentMethod = "",
    )


# ---------------------------------------------------------------------------
# Row parser — given a clean list of cell strings, produce a transaction
# ---------------------------------------------------------------------------

def _parse_row(cells: list[str], fallback_date: str) -> Optional[ExtractedTransaction]:
    """
    Parse a table row (list of cell strings) into an ExtractedTransaction.
    Works for rows from both find_tables() and word-grouped text.

    Handles layouts:
      [date, desc, category, type, amount]          ← Type-keyword format
      [date, desc, amount, balance]                  ← Single amount + balance
      [date, desc, debit, credit, balance]           ← Two-column SBI style
      [date, desc, amount Dr/Cr]                     ← Dr/Cr suffix
      [date, UPI/DR|CR/..., -, col1, col2, balance] ← UPI
    """
    # Clean cells: strip whitespace, drop empty-only cells
    cells = [str(c).strip() if c is not None else "" for c in cells]

    # Need at least date + description + one amount
    if len(cells) < 2:
        return None

    # ── Date ─────────────────────────────────────────────────────────────────
    date_str = parse_date(cells[0]) or fallback_date
    if not date_str:
        return None

    # ── UPI ──────────────────────────────────────────────────────────────────
    if len(cells) > 1 and "UPI/" in cells[1].upper():
        desc_raw = cells[1]
        upi_type = "CR" if "/CR/" in desc_raw.upper() else "DR"
        # Last two non-empty numeric cells = col_amount, balance
        amounts = [_clean(c) for c in cells[2:] if _clean(c) is not None]
        if len(amounts) >= 2:
            amount = amounts[-2]
        elif amounts:
            amount = amounts[-1]
        else:
            return None
        txn_type = "Income" if upi_type == "CR" else "Expense"
        parts = desc_raw.split("/")
        payee = parts[3].strip() if len(parts) > 3 else ""
        desc  = f"{payee} ({'/'.join(parts[:3])})" if payee else desc_raw
        _, cat = classify_transaction(desc, amount if txn_type == "Income" else -amount)
        return _build(desc, amount, txn_type, cat, date_str)

    # ── Collect description and numeric cells ─────────────────────────────────
    # Description = cells[1] (and sometimes cells[2] if it's not a number/type)
    desc_parts = []
    type_val   = ""
    num_cells  = []   # (index, float_value)

    for i, cell in enumerate(cells[1:], start=1):
        cell_lower = cell.lower()
        amt = _clean(cell)

        if cell_lower in _TYPE_KW:
            type_val = cell_lower
        elif amt is not None:
            num_cells.append((i, amt))
        elif cell and not desc_parts:
            desc_parts.append(cell)
        elif cell and cell not in _NIL:
            # Could be a secondary desc word or category label — add to desc
            if cell_lower not in _CAT_LABELS and not type_val:
                desc_parts.append(cell)

    desc = " ".join(desc_parts).strip()
    desc = _strip_cat_label(desc)

    if not desc or desc.lower() in _SKIP_DESCS:
        return None
    if _JUNK_CHARS_RE.search(desc):
        return None

    if not num_cells:
        return None

    # ── Determine transaction amount ──────────────────────────────────────────
    # Layout: [..., tx_amount, balance]  → second-to-last numeric = tx amount
    # Layout: [..., debit, credit, bal]  → look for non-zero debit or credit
    # Layout: [..., tx_amount]           → only one number

    # Check for debit/credit two-column layout:
    # Pattern: exactly 3 numeric cells where one of first two might be 0/nil
    amount    = None
    txn_type  = ""

    if len(num_cells) >= 3:
        # Three or more numbers: likely [debit, credit, balance] or [amt, ?, bal]
        # Take second-to-last as transaction amount
        tx_val = num_cells[-2][1]
        amount = tx_val if tx_val > 0 else None
    elif len(num_cells) == 2:
        # Two numbers: [amount, balance] — first is transaction
        amount = num_cells[0][1] if num_cells[0][1] > 0 else None
    elif len(num_cells) == 1:
        amount = num_cells[0][1] if num_cells[0][1] > 0 else None

    if amount is None or amount <= 0:
        return None

    # ── Determine type ────────────────────────────────────────────────────────
    if type_val in ("income", "credit"):
        txn_type = "Income"
    elif type_val in ("expense", "debit"):
        txn_type = "Expense"
    else:
        txn_type = _infer_type(desc)

    _, cat = classify_transaction(desc, amount if txn_type == "Income" else -amount)
    return _build(desc, amount, txn_type, cat, date_str)


# ---------------------------------------------------------------------------
# Path 1 — find_tables() (PyMuPDF 1.23+)
# ---------------------------------------------------------------------------

def _extract_via_tables(page) -> list[list[str]]:
    """
    Use page.find_tables() to extract all table rows from this page.
    Returns list of cell lists. Skips header rows.
    """
    rows = []
    try:
        tabs = page.find_tables()
    except Exception:
        return rows

    for table in tabs.tables:
        data = table.extract()
        if not data:
            continue
        for row in data:
            cells = [str(c).strip() if c else "" for c in row]
            line  = " ".join(cells).lower().strip()
            # Skip header rows and section-stop rows
            if line in _HEADER_ROWS:
                continue
            if _is_section_stop(line):
                break
            if _should_skip_line(line):
                continue
            rows.append(cells)

    return rows


# ---------------------------------------------------------------------------
# Path 2 — get_text("words") + Y-coordinate grouping
# ---------------------------------------------------------------------------

def _extract_via_words(page) -> list[str]:
    """
    Use get_text("words") to get every word with its bounding box.
    Group words by Y coordinate into lines, sort each line left-to-right.
    Returns list of reconstructed line strings.

    This is platform-independent — the coordinates are always correct
    regardless of OS or MuPDF version, unlike get_text() stream order.
    """
    words = page.get_text("words")  # (x0, y0, x1, y1, text, block, line, word)
    if not words:
        return []

    # Bucket words by Y position (within tolerance)
    buckets: dict[int, list[tuple[float, str]]] = defaultdict(list)
    for w in words:
        x0, y0, text = w[0], w[1], w[4]
        y_key = round(y0 / _Y_TOLERANCE) * _Y_TOLERANCE
        buckets[y_key].append((x0, text))

    lines = []
    for y_key in sorted(buckets.keys()):
        # Sort words left-to-right by X coordinate
        row_words = sorted(buckets[y_key], key=lambda x: x[0])
        line = " ".join(w[1] for w in row_words).strip()
        if line:
            lines.append(line)

    return lines


def _parse_text_line(line: str, fallback_date: str) -> Optional[ExtractedTransaction]:
    """
    Parse a reconstructed text line using the row parser.
    Splits the line into cells by whitespace-runs, then calls _parse_row.
    """
    # Quick date check — line must start with something date-like
    if not re.match(
        r"^\d{1,2}[/\-]\d{2}[/\-]\d{2,4}"
        r"|\d{4}[/\-]\d{2}[/\-]\d{2}"
        r"|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)",
        line, re.IGNORECASE
    ):
        return None

    # Split into tokens — keep multi-word descriptions intact is hard here,
    # so we pass each whitespace-delimited token as a cell.
    # _parse_row handles joining consecutive non-numeric tokens as description.
    cells = line.split()
    return _parse_row(cells, fallback_date)


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def parse_pdf(
    pdf_bytes: bytes,
    password: Optional[str] = None,
) -> list[ExtractedTransaction]:
    """
    Accept raw PDF bytes, return list[ExtractedTransaction].

    Pipeline:
      1. Open PDF, handle password if needed.
      2. For each page, try find_tables() first (structured PDFs).
         If no table rows found, fall back to get_text("words") + Y-grouping.
      3. Parse each row/line through _parse_row / _parse_text_line.
      4. Deduplicate and return.

    Both extraction paths use spatial coordinates from PyMuPDF,
    so output is identical on Windows, Linux, and Mac.

    Raises:
        ImportError:      PyMuPDF (fitz) not installed.
        PDFPasswordError: PDF encrypted; password missing or wrong.
        ValueError:       PDF has no extractable text (scanned image PDF).
    """
    try:
        import fitz
    except ImportError:
        raise ImportError("PyMuPDF (fitz) is required. Run: pip install PyMuPDF")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    # ── Password handling ─────────────────────────────────────────────────────
    if doc.is_encrypted:
        ok = doc.authenticate("")          # try blank / owner password first
        if not ok:
            pwd = (password or "").strip()
            if pwd:
                ok = doc.authenticate(pwd)
        if not ok:
            doc.close()
            if (password or "").strip():
                raise PDFPasswordError("Incorrect password. Please try again.")
            raise PDFPasswordError(
                "This PDF is password protected. Please enter the password."
            )

    # ── Extract transactions page by page (with per-page OCR fallback) ─────────
    fallback     = today_iso()
    transactions: list[ExtractedTransaction] = []
    seen: set[tuple]                         = set()
    ocr_service  = None   # lazy-init — only created if a scanned page is found

    for page_num, page in enumerate(doc):
        sample_text = page.get_text().strip()

        if len(sample_text) >= _OCR_MIN_CHARS_PER_PAGE:
            # ✅ Good text — process normally
            page_txns = _process_page(page, fallback)
        else:
            # ⚠️ Page has little/no text — likely scanned image, try OCR
            logger.info(
                "pdf_parser: page %d has only %d chars — attempting OCR fallback",
                page_num + 1, len(sample_text),
            )
            ocr_text = ""
            try:
                if ocr_service is None:
                    ocr_service = PDFOCRService()

                # Render this single page to PDF bytes for OCR
                single_doc = fitz.open()
                single_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
                single_page_bytes = single_doc.tobytes()
                single_doc.close()

                ocr_text = ocr_service.extract_text_from_bytes(
                    single_page_bytes,
                    filename=f"page_{page_num + 1}.pdf",
                ).strip()
                logger.info(
                    "pdf_parser: OCR extracted %d chars from page %d",
                    len(ocr_text), page_num + 1,
                )
            except OCRError as e:
                logger.warning("pdf_parser: OCR failed for page %d: %s — skipping", page_num + 1, e)
            except Exception as e:
                logger.warning("pdf_parser: OCR unavailable for page %d: %s — skipping", page_num + 1, e)

            if ocr_text:
                # Parse OCR text line by line using the text-line parser
                page_txns = []
                for line in ocr_text.splitlines():
                    line = line.strip()
                    if len(line) < 8 or _is_section_stop(line) or _should_skip_line(line):
                        continue
                    txn = _parse_text_line(line, fallback)
                    if txn:
                        page_txns.append(txn)
            else:
                page_txns = []

        for txn in page_txns:
            key = (txn.date, txn.description, txn.amount)
            if key not in seen:
                seen.add(key)
                transactions.append(txn)

    if ocr_service is not None:
        ocr_service.close()

    doc.close()
    logger.info("pdf_parser: extracted %d transactions total", len(transactions))
    return transactions


def _process_page(page, fallback_date: str) -> list[ExtractedTransaction]:
    """
    Extract transactions from a single page.
    Tries find_tables() first; falls back to word-grouping.
    """
    results: list[ExtractedTransaction] = []

    # ── Path 1: find_tables() ─────────────────────────────────────────────────
    table_rows = _extract_via_tables(page)

    if table_rows:
        logger.debug("pdf_parser: page using find_tables (%d rows)", len(table_rows))
        for cells in table_rows:
            txn = _parse_row(cells, fallback_date)
            if txn:
                results.append(txn)
        return results

    # ── Path 2: word-grouping fallback ────────────────────────────────────────
    logger.debug("pdf_parser: page using word-grouping fallback")
    lines = _extract_via_words(page)

    for line in lines:
        if len(line) < 8:
            continue
        if _is_section_stop(line):
            break
        if _should_skip_line(line):
            continue
        txn = _parse_text_line(line, fallback_date)
        if txn:
            results.append(txn)

    return results