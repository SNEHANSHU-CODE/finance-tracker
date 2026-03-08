"""
parsers/csv_parser.py
Extracts transactions from a CSV bank export.

Responsibilities:
  - Accept raw CSV bytes
  - Auto-detect column names (date, description, amount / debit+credit)
  - Return list[ExtractedTransaction]

Supported column name variations are defined in _COLUMN_ALIASES below.
Add more aliases there when you encounter a new bank format.
"""

import io
import csv
import logging
from typing import Optional

from ..shared.schemas import ExtractedTransaction
from ..shared.classifier import classify_transaction
from ..shared.date_parser import parse_date, today_iso

logger = logging.getLogger(__name__)

# ── Column name aliases ───────────────────────────────────────────────────────
# Maps canonical name → list of possible CSV header values (lowercased)
_COLUMN_ALIASES: dict[str, list[str]] = {
    "date":        ["date", "txn date", "transaction date", "value date", "posting date", "trans date"],
    "description": ["description", "narration", "particulars", "details", "remarks", "memo", "transaction"],
    "amount":      ["amount", "transaction amount", "net amount"],
    "debit":       ["debit", "withdrawal", "dr", "debit amount", "withdrawal amt"],
    "credit":      ["credit", "deposit", "cr", "credit amount", "deposit amt"],
}


def _resolve_columns(headers: list[str]) -> dict[str, Optional[int]]:
    """Map canonical column name → column index (or None if not found)."""
    lowered = [h.strip().lower() for h in headers]
    result: dict[str, Optional[int]] = {}
    for canonical, aliases in _COLUMN_ALIASES.items():
        result[canonical] = next(
            (lowered.index(a) for a in aliases if a in lowered), None
        )
    return result


def _safe_float(value: str) -> Optional[float]:
    cleaned = value.strip().replace(",", "").replace("₹", "").replace("$", "").replace("£", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_csv(csv_bytes: bytes, encoding: str = "utf-8") -> list[ExtractedTransaction]:
    """
    Accept raw CSV bytes, return list[ExtractedTransaction].
    Tries utf-8 then falls back to latin-1 if decoding fails.
    """
    try:
        text = csv_bytes.decode(encoding)
    except UnicodeDecodeError:
        text = csv_bytes.decode("latin-1")

    reader    = csv.reader(io.StringIO(text))
    rows      = list(reader)
    fallback  = today_iso()

    if len(rows) < 2:
        raise ValueError("CSV has no data rows.")

    # First non-empty row is treated as header
    headers  = rows[0]
    col      = _resolve_columns(headers)

    if col["date"] is None or col["description"] is None:
        raise ValueError(
            "Could not detect required columns (date, description) in CSV. "
            f"Found headers: {headers}"
        )

    transactions: list[ExtractedTransaction] = []

    for row_num, row in enumerate(rows[1:], start=2):
        if not any(cell.strip() for cell in row):
            continue  # skip blank rows

        try:
            raw_date = row[col["date"]].strip() if col["date"] is not None else ""
            desc     = row[col["description"]].strip() if col["description"] is not None else ""

            if not desc:
                continue

            date_str = parse_date(raw_date) or fallback

            # ── Amount resolution ─────────────────────────────────────────
            amount: Optional[float] = None

            if col["amount"] is not None:
                raw_amt = row[col["amount"]].strip() if col["amount"] < len(row) else ""
                amount  = _safe_float(raw_amt)

            elif col["debit"] is not None or col["credit"] is not None:
                debit_val  = _safe_float(row[col["debit"]].strip())  if col["debit"]  is not None and col["debit"]  < len(row) else None
                credit_val = _safe_float(row[col["credit"]].strip()) if col["credit"] is not None and col["credit"] < len(row) else None

                if credit_val and credit_val > 0:
                    amount = credit_val
                elif debit_val and debit_val > 0:
                    amount = -debit_val

            if amount is None:
                logger.debug(f"csv_parser: skipping row {row_num} — could not resolve amount")
                continue

            txn_type, category = classify_transaction(desc, amount)

            transactions.append(ExtractedTransaction(
                description   = desc[:100],
                amount        = round(abs(amount), 2),
                type          = txn_type,
                category      = category,
                date          = date_str,
                paymentMethod = "Other",
            ))

        except (IndexError, ValueError) as e:
            logger.debug(f"csv_parser: skipping row {row_num} — {e}")
            continue

    logger.info(f"csv_parser: extracted {len(transactions)} transactions")
    return transactions