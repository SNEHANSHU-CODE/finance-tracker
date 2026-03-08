"""
test_pdf_parser.py
Run from your chatServer directory:

    python test_pdf_parser.py path/to/your.pdf
    python test_pdf_parser.py path/to/your.pdf mypassword
"""

import sys, os, re
from collections import defaultdict

print("=" * 60)
print("PDF PARSER DIAGNOSTIC TEST")
print("=" * 60)

import platform
print(f"\n[1] Python  : {sys.version.split()[0]}")
print(f"    Platform: {platform.system()}")

print("\n[2] Checking PyMuPDF...")
try:
    import fitz
    print(f"    OK  version {fitz.version[0]}")
    # find_tables added in 1.23.0
    has_find_tables = tuple(int(x) for x in fitz.version[0].split(".")) >= (1, 23, 0)
    print(f"    find_tables() available: {'YES' if has_find_tables else 'NO (upgrade to 1.23+)'}")
except ImportError:
    print("    FAIL  pip install PyMuPDF")
    sys.exit(1)

pdf_path = sys.argv[1] if len(sys.argv) > 1 else None
if not pdf_path:
    print("\nUsage: python test_pdf_parser.py path/to/file.pdf [password]")
    sys.exit(1)
if not os.path.exists(pdf_path):
    print(f"\nFAIL  File not found: {pdf_path}")
    sys.exit(1)

print(f"\n[3] PDF: {pdf_path} ({os.path.getsize(pdf_path):,} bytes)")

doc = fitz.open(pdf_path)
print(f"    Pages    : {len(doc)}")
print(f"    Encrypted: {doc.is_encrypted}")
if doc.is_encrypted:
    pwd = sys.argv[2] if len(sys.argv) > 2 else ""
    ok = doc.authenticate(pwd)
    print(f"    Password : {'OK' if ok else 'FAIL - wrong password'}")
    if not ok: sys.exit(1)

# ── Check pdf_parser.py on disk ───────────────────────────────────────────────
print("\n[4] Locating pdf_parser.py...")
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in ("node_modules","venv",".venv",".git")]
    for f in files:
        if f == "pdf_parser.py":
            p = os.path.join(root, f)
            content = open(p, encoding="utf-8").read()
            has_spatial = "find_tables" in content and "get_text" in content and "words" in content
            print(f"    Found : {p}")
            print(f"    Spatial API : {'OK (find_tables + word-grouping)' if has_spatial else 'FAIL needs replacing'}")

# ── Check stale cache ─────────────────────────────────────────────────────────
stale = []
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in ("node_modules","venv",".venv",".git")]
    for f in files:
        if "pdf_parser" in f and f.endswith(".pyc"):
            stale.append(os.path.join(root, f))
if stale:
    print(f"\n[5] WARN  Stale cache found - delete before restarting server:")
    for s in stale: print(f"      {s}")
    print('    Fix: Get-ChildItem -Recurse -Filter "__pycache__" | Remove-Item -Recurse -Force')
else:
    print("\n[5] OK  No stale cache")

# ── Run extraction ────────────────────────────────────────────────────────────

_Y_TOL = 3
_INCOME_KW = frozenset([
    "credit","salary","received","refund","cashback","interest earned","dividend",
    "freelance","bonus","inward","deposit","transfer in","neft in","imps in",
    "rtgs in","online transfer",
])
_SKIP_PH = frozenset([
    "opening balance","closing balance","account statement","bank statement",
    "account no","account number","account holder","ifsc code","branch name",
    "customer id","customer name","statement period","statement date","page no",
])
_HEADERS = frozenset([
    "date","date description category type amount",
    "date description debit credit balance","date narration debit credit balance",
    "date description debit ($) credit ($) balance ($)",
    "description debit ($) credit ($) balance ($)",
])
_SECTION_STOP = re.compile(
    r"^(summary|total income|total expenses|net savings|savings rate"
    r"|goal name|target date|target \(|metric\s+\w|in progress|completed)",
    re.IGNORECASE,
)
_CAT_LABELS = {
    "salary","housing","food","transport","transportation","entertainment",
    "utilities","shopping","healthcare","investment","education","health",
    "travel","insurance","rent","balance","other","category","income",
}
_SKIP_DESCS  = {"opening balance","closing balance"}
_JUNK_RE     = re.compile(r"[•►▶●■□✅✗\u2022\u25cf\u2714]")
_TYPE_KW     = frozenset(["income","expense","debit","credit"])

def clean(raw):
    try: return float(re.sub(r"[₹$€£,\s]","",str(raw).strip()))
    except: return None

def infer_type(desc):
    lower = desc.lower()
    return "Income" if any(k in lower for k in _INCOME_KW) else "Expense"

def strip_cat(desc):
    words = desc.strip().split()
    if len(words) > 1 and words[-1].lower() in _CAT_LABELS:
        return " ".join(words[:-1]).strip()
    return desc.strip()

def skip_line(line):
    lower = line.lower().strip()
    if re.match(r"^[-=\s]{4,}$", line): return True
    if lower in _HEADERS: return True
    if re.match(r"^(total|summary|net savings|savings rate|running balance)", lower): return True
    return any(p in lower for p in _SKIP_PH)

def parse_row(cells, fallback):
    cells = [str(c).strip() if c else "" for c in cells]
    if len(cells) < 2: return None
    from datetime import datetime
    def try_date(s):
        for fmt in ("%Y-%m-%d","%d/%m/%Y","%d-%m-%Y","%d %b %Y","%d-%b-%Y","%d %B %Y"):
            try: return datetime.strptime(s.strip(), fmt).strftime("%Y-%m-%d")
            except: pass
        return None
    date_str = try_date(cells[0])
    if not date_str: return None

    if "UPI/" in cells[1].upper():
        amounts = [clean(c) for c in cells[2:] if clean(c) is not None]
        amount = amounts[-2] if len(amounts) >= 2 else (amounts[0] if amounts else None)
        if not amount: return None
        upi_type = "CR" if "/CR/" in cells[1].upper() else "DR"
        tp = "Income" if upi_type=="CR" else "Expense"
        return (date_str, cells[1][:40], tp, amount, "UPI")

    desc_parts = []; type_val = ""; num_cells = []
    for i, cell in enumerate(cells[1:], 1):
        amt = clean(cell)
        if cell.lower() in _TYPE_KW: type_val = cell.lower()
        elif amt is not None: num_cells.append((i, amt))
        elif cell and not desc_parts: desc_parts.append(cell)
        elif cell and cell.lower() not in _CAT_LABELS and not type_val:
            desc_parts.append(cell)

    desc = strip_cat(" ".join(desc_parts).strip())
    if not desc or desc.lower() in _SKIP_DESCS: return None
    if _JUNK_RE.search(desc): return None
    if not num_cells: return None

    if   len(num_cells) >= 3: amount = num_cells[-2][1]
    elif len(num_cells) == 2: amount = num_cells[0][1]
    else:                     amount = num_cells[0][1]

    if not amount or amount <= 0: return None
    if type_val in ("income","credit"): tp = "Income"
    elif type_val in ("expense","debit"): tp = "Expense"
    else: tp = infer_type(desc)
    return (date_str, desc[:40], tp, amount, "row")

results  = []
path1_pages = 0
path2_pages = 0

print("\n[6] Extracting transactions...")

for pg_num, page in enumerate(doc):
    # Path 1: find_tables
    used_tables = False
    if has_find_tables:
        try:
            tabs = page.find_tables()
            for table in tabs.tables:
                data = table.extract()
                if not data: continue
                for row in data:
                    cells = [str(c).strip() if c else "" for c in row]
                    line = " ".join(cells).lower().strip()
                    if line in _HEADERS or skip_line(line): continue
                    if _SECTION_STOP.match(line): break
                    r = parse_row(cells, "")
                    if r:
                        results.append(r + (pg_num,))
                        used_tables = True
        except Exception as e:
            print(f"    find_tables error page {pg_num}: {e}")

    if used_tables:
        path1_pages += 1
        continue

    # Path 2: word grouping
    path2_pages += 1
    words = page.get_text("words")
    buckets = defaultdict(list)
    for w in words:
        y_key = round(w[1] / _Y_TOL) * _Y_TOL
        buckets[y_key].append((w[0], w[4]))
    for y_key in sorted(buckets.keys()):
        line = " ".join(w[1] for w in sorted(buckets[y_key])).strip()
        if len(line) < 8: continue
        if _SECTION_STOP.match(line): break
        if skip_line(line): continue
        if not re.match(r"^\d{1,4}[/\-\s]", line): continue
        r = parse_row(line.split(), "")
        if r: results.append(r + (pg_num,))

doc.close()

print(f"    Pages via find_tables() : {path1_pages}")
print(f"    Pages via word-grouping : {path2_pages}")
print(f"\n[7] RESULT: {len(results)} transactions\n")

for r in results:
    date, desc, tp, amt, pat, pg = r
    print(f"    pg{pg} [{pat:<4}] {date} | {desc:<32} | {tp:<8} | {amt:>12,.2f}")

print("\n" + "="*60)
if results:
    print(f"OK  {len(results)} transactions extracted")
    if stale:
        print("WARN  Delete __pycache__ and restart server before testing")
else:
    print("FAIL  0 transactions - share this output for further diagnosis")
print("="*60)