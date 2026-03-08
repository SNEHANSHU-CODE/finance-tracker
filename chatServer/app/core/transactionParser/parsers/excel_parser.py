"""
parsers/excel_parser.py
Extracts transactions from an Excel bank export (.xlsx / .xls).

Responsibilities:
  - Accept raw Excel bytes
  - Auto-detect the header row (scans first 10 rows)
  - Auto-detect column names using PARTIAL matching (contains/startswith)
    so headers like "Amount (₹)" or "Transaction Amount" still match.
  - Honour explicit Type (income/expense) and Category columns when present
  - Return list[ExtractedTransaction]

Requires: openpyxl (already pulls in with many data stacks)
Install:  pip install openpyxl
"""

import io
import logging
from typing import Optional
from datetime import datetime, date

from ..shared.schemas import ExtractedTransaction, ALL_CATEGORIES, CATEGORIES_INCOME, CATEGORIES_EXPENSE
from ..shared.classifier import classify_transaction
from ..shared.date_parser import parse_date, today_iso

logger = logging.getLogger(__name__)

_MAX_HEADER_SCAN_ROWS = 10

# ── Column alias map ─────────────────────────────────────────────────────────
# Each canonical name maps to a list of substrings to look for (lowercased).
# Matching uses `startswith` first, then `in` (contains), so "amount (₹)"
# matches the "amount" alias even though it's not an exact match.
_COLUMN_ALIASES: dict[str, list[str]] = {
    "date":        ["date", "txn date", "transaction date", "value date", "posting date", "trans date"],
    "description": ["description", "narration", "particulars", "details", "remarks", "memo"],
    "amount":      ["amount", "transaction amount", "net amount", "debit/credit"],
    "debit":       ["debit", "withdrawal", "dr amount", "withdrawal amt"],
    "credit":      ["credit", "deposit", "cr amount", "deposit amt"],
    # optional columns — used when present, ignored when absent
    "type":        ["type"],
    "category":    ["category", "categories"],
}

# Categories accepted by the backend (must match schemas.py exactly)
_VALID_EXPENSE_CATS = set(CATEGORIES_EXPENSE)
_VALID_INCOME_CATS  = set(CATEGORIES_INCOME)

# Map common bank-statement category names → our canonical names
_CATEGORY_REMAP: dict[str, str] = {
    "housing":       "Rent",
    "rent":          "Rent",
    "food":          "Food",
    "groceries":     "Food",
    "grocery":       "Food",
    "transport":     "Transportation",
    "transportation":"Transportation",
    "entertainment": "Entertainment",
    "utilities":     "Utilities",
    "utility":       "Utilities",
    "healthcare":    "Healthcare",
    "health":        "Healthcare",
    "medical":       "Healthcare",
    "education":     "Education",
    "travel":        "Travel",
    "insurance":     "Insurance",
    "shopping":      "Shopping",
    "salary":        "Salary",
    "freelance":     "Freelance",
    "bonus":         "Bonus",
    "investment":    "Investment",
    "savings":       "Investment",
    "sip":           "Investment",
    "other income":  "Other Income",
    "other expense": "Other Expense",
    "other":         "Other Expense",
    "miscellaneous": "Other Expense",
    "misc":          "Other Expense",
    "balance":       None,   # skip "Opening Balance" type rows
}


def _resolve_columns(header_row: list) -> dict[str, Optional[int]]:
    """
    Match column headers using partial string matching.
    Tries startswith first (more specific), then `in` (contains).
    Returns canonical → column index (or None if not found).
    """
    lowered = [str(c).strip().lower() if c is not None else "" for c in header_row]
    result: dict[str, Optional[int]] = {}

    for canonical, aliases in _COLUMN_ALIASES.items():
        found = None
        # 1. Exact match
        for alias in aliases:
            if alias in lowered:
                found = lowered.index(alias)
                break
        # 2. Startswith match (e.g. "amount (₹)" starts with "amount")
        if found is None:
            for alias in aliases:
                for idx, h in enumerate(lowered):
                    if h.startswith(alias):
                        found = idx
                        break
                if found is not None:
                    break
        # 3. Contains match (e.g. "net amount paid" contains "amount")
        if found is None:
            for alias in aliases:
                for idx, h in enumerate(lowered):
                    if alias in h:
                        found = idx
                        break
                if found is not None:
                    break

        result[canonical] = found

    return result


def _cell_str(row_list: list, idx: Optional[int]) -> str:
    """Safely get a cell value as string."""
    if idx is None or idx >= len(row_list):
        return ""
    v = row_list[idx]
    if v is None:
        return ""
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    return str(v).strip()


def _safe_float(value) -> Optional[float]:
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = str(value).strip().replace(",", "").replace("₹", "").replace("$", "").replace("£", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _map_category(raw_cat: str, txn_type: str) -> Optional[str]:
    """
    Map a raw category string from the file to our canonical category.
    Returns None if the row should be skipped (e.g. "Balance" rows).
    """
    if not raw_cat:
        return None

    lower = raw_cat.strip().lower()

    # Explicit skip
    if lower in _CATEGORY_REMAP and _CATEGORY_REMAP[lower] is None:
        return None   # signal to skip

    # Direct remap
    if lower in _CATEGORY_REMAP:
        return _CATEGORY_REMAP[lower]

    # Already a valid category?
    if raw_cat in ALL_CATEGORIES:
        return raw_cat

    return None   # will fall back to classifier


def parse_excel(excel_bytes: bytes) -> list[ExtractedTransaction]:
    """
    Accept raw .xlsx bytes, return list[ExtractedTransaction].
    Raises ImportError if openpyxl is not installed.
    Raises ValueError if no usable data found.
    """
    try:
        import openpyxl
    except ImportError:
        raise ImportError("openpyxl is required for Excel imports. Run: pip install openpyxl")

    workbook = openpyxl.load_workbook(io.BytesIO(excel_bytes), read_only=True, data_only=True)
    sheet    = workbook.active
    all_rows = list(sheet.iter_rows(values_only=True))
    workbook.close()

    if not all_rows:
        raise ValueError("Excel file is empty.")

    # ── Find header row ───────────────────────────────────────────────────────
    header_idx: Optional[int] = None
    col: dict[str, Optional[int]] = {}

    for idx, row in enumerate(all_rows[:_MAX_HEADER_SCAN_ROWS]):
        candidate = _resolve_columns(list(row))
        if candidate["date"] is not None and candidate["description"] is not None:
            header_idx = idx
            col        = candidate
            break

    if header_idx is None:
        raise ValueError(
            "Could not detect required columns (date, description) in Excel file. "
            "Expected headers like: Date, Description/Narration, Amount/Debit/Credit."
        )

    logger.info(
        "excel_parser: header row %d | columns: %s",
        header_idx,
        {k: v for k, v in col.items() if v is not None},
    )

    fallback     = today_iso()
    transactions: list[ExtractedTransaction] = []

    for row_num, row in enumerate(all_rows[header_idx + 1:], start=header_idx + 2):
        row_list = list(row)

        # Skip entirely blank rows
        if not any(cell is not None and str(cell).strip() for cell in row_list):
            continue

        try:
            raw_date = _cell_str(row_list, col["date"])
            desc     = _cell_str(row_list, col["description"])

            if not desc:
                continue

            date_str = parse_date(raw_date) or fallback

            # ── Amount resolution ─────────────────────────────────────────
            amount: Optional[float] = None

            if col["amount"] is not None and col["amount"] < len(row_list):
                amount = _safe_float(row_list[col["amount"]])
            elif col["debit"] is not None or col["credit"] is not None:
                debit_val  = _safe_float(row_list[col["debit"]])  if col["debit"]  is not None and col["debit"]  < len(row_list) else None
                credit_val = _safe_float(row_list[col["credit"]]) if col["credit"] is not None and col["credit"] < len(row_list) else None
                if credit_val and credit_val > 0:
                    amount = credit_val
                elif debit_val and debit_val > 0:
                    amount = -debit_val

            if amount is None or amount == 0:
                logger.debug("excel_parser: skipping row %d — no amount", row_num)
                continue

            # ── Type resolution ───────────────────────────────────────────
            # Prefer explicit "Type" column; fall back to classifier
            raw_type = _cell_str(row_list, col.get("type")).lower()
            if raw_type in ("income", "credit"):
                txn_type = "Income"
            elif raw_type in ("expense", "debit"):
                txn_type = "Expense"
            else:
                # Infer from classifier
                _, _ = classify_transaction(desc, amount)
                txn_type, _ = classify_transaction(desc, amount)
                # Negative amount → expense
                if amount < 0:
                    txn_type = "Expense"

            # ── Category resolution ───────────────────────────────────────
            # Prefer explicit "Category" column; re-classify if invalid
            raw_cat   = _cell_str(row_list, col.get("category"))
            mapped    = _map_category(raw_cat, txn_type)

            if mapped is None and raw_cat:
                # raw_cat had a value but mapped to None → skip row (e.g. "Balance")
                logger.debug("excel_parser: skipping row %d — category '%s' signals non-transaction", row_num, raw_cat)
                continue

            if mapped is not None:
                # Validate that the mapped category belongs to the right type
                if txn_type == "Income" and mapped not in _VALID_INCOME_CATS:
                    mapped = None
                elif txn_type == "Expense" and mapped not in _VALID_EXPENSE_CATS:
                    mapped = None

            if mapped is None:
                # Fall back to keyword classifier
                txn_type, mapped = classify_transaction(desc, amount if txn_type == "Income" else -abs(amount))

            transactions.append(ExtractedTransaction(
                description   = desc[:100],
                amount        = round(abs(amount), 2),
                type          = txn_type,
                category      = mapped,
                date          = date_str,
                paymentMethod = "Other",
            ))

        except (IndexError, ValueError, TypeError) as e:
            logger.debug("excel_parser: skipping row %d — %s", row_num, e)
            continue

    logger.info("excel_parser: extracted %d transactions", len(transactions))
    return transactions