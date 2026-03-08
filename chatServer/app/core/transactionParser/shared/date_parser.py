"""
shared/date_parser.py
Parses raw date strings from bank statements into YYYY-MM-DD.
Used by all parsers (PDF, CSV, Excel).

Supported formats:
  DD/MM/YYYY   DD-MM-YYYY                 (Indian standard)
  DD/MM/YY     DD-MM-YY                   (short year, 2000-2049 assumed)
  YYYY-MM-DD   YYYY/MM/DD                 (ISO)
  DD Mon YYYY  DD Mon, YYYY               (e.g. 01 Feb 2025)
  DD-Mon-YYYY                             (Axis/HDFC: 04-Feb-2025)
  Mon DD, YYYY                            (US: Feb 01, 2025)
"""

import re
from datetime import datetime
from typing import Optional

_MONTHS = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"


def _try(fmt: str, s: str) -> Optional[str]:
    try:
        return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
    except ValueError:
        return None


def parse_date(raw: str) -> Optional[str]:
    """
    Try every known bank date format.
    Returns YYYY-MM-DD string or None if unparseable.
    """
    raw = raw.strip()
    if not raw:
        return None

    # ── DD/MM/YYYY or DD-MM-YYYY ─────────────────────────────────────────────
    m = re.match(r"^(\d{2})[/\-](\d{2})[/\-](\d{4})$", raw)
    if m:
        result = _try("%d/%m/%Y", f"{m.group(1)}/{m.group(2)}/{m.group(3)}")
        if result:
            return result

    # ── YYYY-MM-DD or YYYY/MM/DD ─────────────────────────────────────────────
    m = re.match(r"^(\d{4})[/\-](\d{2})[/\-](\d{2})$", raw)
    if m:
        result = _try("%Y-%m-%d", f"{m.group(1)}-{m.group(2)}-{m.group(3)}")
        if result:
            return result

    # ── DD/MM/YY or DD-MM-YY (short year) ────────────────────────────────────
    # 00-49 → 2000s, 50-99 → 1900s
    m = re.match(r"^(\d{1,2})[/\-](\d{2})[/\-](\d{2})$", raw)
    if m:
        yr = int(m.group(3))
        full_yr = 2000 + yr if yr < 50 else 1900 + yr
        try:
            return datetime(full_yr, int(m.group(2)), int(m.group(1))).strftime("%Y-%m-%d")
        except ValueError:
            pass

    # ── DD Mon YYYY  or  DD Mon, YYYY  (space-separated) ─────────────────────
    m = re.match(
        rf"^(\d{{1,2}})\s+({_MONTHS})[a-z]*[\s,]+(\d{{4}})$",
        raw, re.IGNORECASE
    )
    if m:
        result = _try("%d %b %Y", f"{int(m.group(1)):02d} {m.group(2)[:3].capitalize()} {m.group(3)}")
        if result:
            return result

    # ── DD-Mon-YYYY  (dash-separated, e.g. 04-Feb-2025) ──────────────────────
    m = re.match(
        rf"^(\d{{1,2}})-({_MONTHS})[a-z]*-(\d{{4}})$",
        raw, re.IGNORECASE
    )
    if m:
        result = _try("%d %b %Y", f"{int(m.group(1)):02d} {m.group(2)[:3].capitalize()} {m.group(3)}")
        if result:
            return result

    # ── Mon DD, YYYY  (US format, e.g. Feb 01, 2025) ─────────────────────────
    m = re.match(
        rf"^({_MONTHS})[a-z]*\s+(\d{{1,2}}),?\s+(\d{{4}})$",
        raw, re.IGNORECASE
    )
    if m:
        result = _try("%b %d %Y", f"{m.group(1)[:3].capitalize()} {int(m.group(2)):02d} {m.group(3)}")
        if result:
            return result

    return None


def today_iso() -> str:
    return datetime.today().strftime("%Y-%m-%d")