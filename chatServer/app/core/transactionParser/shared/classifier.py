"""
shared/classifier.py
Rule-based transaction classifier.
Given a description string and raw amount, returns (type, category).
Used by all parsers (PDF, CSV, Excel).
"""

from typing import Optional

# ── Income signal keywords ────────────────────────────────────────────────────
# If any of these appear in the description, we lean toward Income
INCOME_SIGNALS: list[str] = [
    "salary", "payroll", "wages", "pay slip", "payslip",
    "freelance", "consulting fee", "contract pay",
    "bonus", "incentive", "commission",
    "dividend", "interest earned", "investment return",
    "refund", "cashback", "reimbursement",
    "direct deposit", "credit from",
]

# ── Category keyword map ──────────────────────────────────────────────────────
# Order matters: first match wins, so put specific keywords before generic ones.
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    # ── Income ────────────────────────────────────────────────────────────────
    "Salary": [
        "salary", "payroll", "wages", "pay slip", "payslip", "employer", "direct deposit"
    ],
    "Freelance": [
        "freelance", "upwork", "fiverr", "consulting", "contract pay", "project payment"
    ],
    "Bonus": [
        "bonus", "incentive", "reward", "commission", "performance pay"
    ],
    "Investment": [
        "dividend", "interest earned", "mutual fund", "stock", "returns", "investment credit"
    ],
    "Other Income": [
        "refund", "cashback", "credit", "reimbursement", "reversal"
    ],

    # ── Expense ───────────────────────────────────────────────────────────────
    "Food": [
        "swiggy", "zomato", "restaurant", "cafe", "coffee", "pizza", "food", "burger",
        "grocery", "supermarket", "bakery", "diner", "kitchen", "eatery",
        "starbucks", "dunkin", "mcdonald", "kfc", "subway", "dominos", "blinkit",
        "bigbasket", "zepto", "instamart",
    ],
    "Transportation": [
        "uber", "ola", "lyft", "taxi", "cab", "metro", "bus", "train", "railway",
        "flight", "airline", "petrol", "fuel", "toll", "parking", "transport",
        "rapido", "redbus", "irctc",
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "ajio", "meesho", "walmart", "target",
        "shopping", "store", "mall", "retail", "ebay", "shopify", "nykaa",
        "decathlon", "ikea", "purchase",
    ],
    "Entertainment": [
        "netflix", "spotify", "youtube", "prime", "hotstar", "disney", "hulu",
        "cinema", "movie", "theatre", "gaming", "steam", "playstation", "xbox",
        "bookmyshow", "pvr", "inox",
    ],
    "Utilities": [
        "electricity", "water bill", "gas bill", "internet", "broadband", "wifi",
        "phone bill", "mobile bill", "telecom", "utility", "recharge", "postpaid",
        "airtel", "jio", "vodafone", "bsnl", "tata sky",
    ],
    "Healthcare": [
        "hospital", "clinic", "pharmacy", "medical", "doctor", "dentist",
        "medicine", "health", "apollo", "medplus", "lab", "diagnostic",
        "practo", "1mg", "pharmeasy",
    ],
    "Education": [
        "school fee", "college fee", "university fee", "tuition", "course",
        "udemy", "coursera", "education", "training", "byju", "unacademy",
        "coaching",
    ],
    "Travel": [
        "hotel", "hostel", "airbnb", "resort", "booking.com", "makemytrip",
        "goibibo", "travel", "trip", "holiday", "tour", "oyo",
    ],
    "Insurance": [
        "insurance", "lic", "policy premium", "hdfc life", "bajaj allianz",
        "icici prudential", "star health",
    ],
    "Rent": [
        "rent", "lease", "maintenance charge", "society fee", "housing",
        "pg rent", "hostel rent",
    ],
    "Other Expense": [
        "atm withdrawal", "atm", "withdrawal", "charge", "fee", "fine",
        "penalty", "miscellaneous", "debit",
    ],
}

# Income categories (used to avoid cross-contamination in matching)
_INCOME_CATS  = {"Salary", "Freelance", "Bonus", "Investment", "Other Income"}
_EXPENSE_CATS = {
    "Food", "Transportation", "Shopping", "Entertainment", "Utilities",
    "Healthcare", "Education", "Travel", "Insurance", "Rent", "Other Expense",
}


def classify_transaction(description: str, raw_amount: float) -> tuple[str, str]:
    """
    Returns (type, category).

    type  : "Income" or "Expense"
    category: one of the 16 valid categories
    """
    desc_lower = description.lower()

    # ── 1. Determine type ────────────────────────────────────────────────────
    txn_type: Optional[str] = None
    for signal in INCOME_SIGNALS:
        if signal in desc_lower:
            txn_type = "Income"
            break

    if txn_type is None:
        txn_type = "Income" if raw_amount > 0 else "Expense"

    # ── 2. Determine category ────────────────────────────────────────────────
    for category, keywords in CATEGORY_KEYWORDS.items():
        # Skip cross-type matches
        if txn_type == "Income"  and category in _EXPENSE_CATS:
            continue
        if txn_type == "Expense" and category in _INCOME_CATS:
            continue

        for kw in keywords:
            if kw in desc_lower:
                return txn_type, category

    # ── 3. Fallback ──────────────────────────────────────────────────────────
    fallback = "Other Income" if txn_type == "Income" else "Other Expense"
    return txn_type, fallback