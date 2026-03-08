"""
shared/schemas.py
Pydantic models shared across all import parsers (PDF, CSV, Excel).

Design: all fields on ExtractedTransaction are optional / have blank defaults
so that parsers can return partial data and the user fills in missing fields
on the preview/review page before saving.
"""

from typing import Optional
from pydantic import BaseModel, field_validator

CATEGORIES_INCOME = [
    "Salary", "Freelance", "Bonus", "Investment", "Other Income"
]
CATEGORIES_EXPENSE = [
    "Food", "Transportation", "Shopping", "Entertainment", "Utilities",
    "Healthcare", "Education", "Travel", "Insurance", "Rent", "Other Expense"
]
ALL_CATEGORIES = CATEGORIES_INCOME + CATEGORIES_EXPENSE

PAYMENT_METHODS = [
    "Cash", "Credit Card", "Debit Card", "Bank Transfer", "Digital Wallet", "Other"
]


class ExtractedTransaction(BaseModel):
    # All fields optional — blank means "user must fill this in on preview page"
    description:   str            = ""       # blank → user fills in
    amount:        Optional[float] = None    # None  → user fills in
    type:          str            = ""       # ""    → user selects Income/Expense
    category:      str            = ""       # ""    → user selects category
    date:          str            = ""       # ""    → user picks date
    paymentMethod: str            = ""       # ""    → user selects payment method

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        # Allow blank — frontend will show a required selector
        if v and v not in ("Income", "Expense"):
            return ""   # invalid value → blank, user fixes it
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        # Allow blank — frontend will show a required selector
        if v and v not in ALL_CATEGORIES:
            return ""   # unrecognised category → blank, user picks one
        return v

    @field_validator("paymentMethod")
    @classmethod
    def validate_payment_method(cls, v: str) -> str:
        if v and v not in PAYMENT_METHODS:
            return ""
        return v


class ImportResponse(BaseModel):
    success:        bool
    count:          int
    transactions:   list[ExtractedTransaction]
    message:        str  = ""
    needs_password: bool = False   # True when PDF is encrypted and no password supplied