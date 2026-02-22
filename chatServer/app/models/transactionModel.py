from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
from bson import ObjectId

from app.models.base import PyObjectId  # single shared definition


class LocationModel(BaseModel):
    name: Optional[str] = None
    coordinates: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(populate_by_name=True)


class RecurringPatternModel(BaseModel):
    frequency: Optional[Literal["Daily", "Weekly", "Monthly", "Yearly"]] = None
    nextDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    parentTransactionId: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class MetadataModel(BaseModel):
    source: Literal["manual", "import", "api", "recurring", "guest-migration"] = "manual"
    deviceInfo: Optional[str] = None
    ipAddress: Optional[str] = None
    isGuestMigrated: bool = False
    migratedAt: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


class TransactionModel(BaseModel):
    """Transaction model matching the MongoDB schema."""

    id: Optional[str] = Field(None, alias="_id")
    userId: str
    description: str = Field(..., max_length=100)
    amount: float
    type: Literal["Income", "Expense"]
    category: Literal[
        "Salary", "Freelance", "Bonus", "Investment", "Other Income",
        "Food", "Transportation", "Shopping", "Entertainment", "Utilities",
        "Healthcare", "Education", "Travel", "Insurance", "Rent", "Other Expense",
    ]
    date: datetime = Field(default_factory=datetime.now)
    paymentMethod: Literal[
        "Cash", "Credit Card", "Debit Card", "Bank Transfer", "Digital Wallet", "Other"
    ] = "Other"
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=200)
    goalId: Optional[str] = None
    location: Optional[LocationModel] = None
    receiptUrl: Optional[str] = None
    isRecurring: bool = False
    recurringPattern: Optional[RecurringPatternModel] = None
    metadata: MetadataModel = Field(default_factory=MetadataModel)
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    v: Optional[int] = Field(None, alias="__v")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )

    @field_validator("userId", "goalId", mode="before")
    @classmethod
    def coerce_objectid_to_str(cls, v):
        return str(v) if isinstance(v, ObjectId) else v


class TransactionCreate(BaseModel):
    """Schema for creating a new transaction."""

    userId: str
    description: str = Field(..., max_length=100)
    amount: float
    type: Literal["Income", "Expense"]
    category: Literal[
        "Salary", "Freelance", "Bonus", "Investment", "Other Income",
        "Food", "Transportation", "Shopping", "Entertainment", "Utilities",
        "Healthcare", "Education", "Travel", "Insurance", "Rent", "Other Expense",
    ]
    date: datetime = Field(default_factory=datetime.now)
    paymentMethod: Literal[
        "Cash", "Credit Card", "Debit Card", "Bank Transfer", "Digital Wallet", "Other"
    ] = "Other"
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(None, max_length=200)
    goalId: Optional[str] = None
    location: Optional[LocationModel] = None
    receiptUrl: Optional[str] = None
    isRecurring: bool = False
    recurringPattern: Optional[RecurringPatternModel] = None
    metadata: MetadataModel = Field(default_factory=MetadataModel)

    model_config = ConfigDict(populate_by_name=True)


class TransactionUpdate(BaseModel):
    """Schema for partially updating an existing transaction."""

    description: Optional[str] = Field(None, max_length=100)
    amount: Optional[float] = None
    type: Optional[Literal["Income", "Expense"]] = None
    category: Optional[Literal[
        "Salary", "Freelance", "Bonus", "Investment", "Other Income",
        "Food", "Transportation", "Shopping", "Entertainment", "Utilities",
        "Healthcare", "Education", "Travel", "Insurance", "Rent", "Other Expense",
    ]] = None
    date: Optional[datetime] = None
    paymentMethod: Optional[Literal[
        "Cash", "Credit Card", "Debit Card", "Bank Transfer", "Digital Wallet", "Other"
    ]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = Field(None, max_length=200)
    goalId: Optional[str] = None
    location: Optional[LocationModel] = None
    receiptUrl: Optional[str] = None
    isRecurring: Optional[bool] = None
    recurringPattern: Optional[RecurringPatternModel] = None

    model_config = ConfigDict(populate_by_name=True)


class TransactionSummary(BaseModel):
    totalIncome: float = 0
    totalExpenses: float = 0
    netSavings: float = 0
    savingsRate: float = 0
    transactionCount: int = 0
    averageTransactionAmount: float = 0
    dailyAverage: float = 0

    model_config = ConfigDict(populate_by_name=True)


class CategoryAnalysis(BaseModel):
    category: str
    amount: float
    percentage: float
    transactionCount: int = 0

    model_config = ConfigDict(populate_by_name=True)


class SpendingTrend(BaseModel):
    month: str
    year: int
    monthYear: str
    totalIncome: float
    totalExpenses: float
    netSavings: float
    savingsRate: float
    transactionCount: int
    averageTransactionAmount: float
    monthOverMonthChange: Optional[float] = None

    model_config = ConfigDict(populate_by_name=True)


class TransactionFilter(BaseModel):
    """Filter parameters for querying transactions."""

    userId: str
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    type: Optional[Literal["Income", "Expense"]] = None
    category: Optional[str] = None
    minAmount: Optional[float] = None
    maxAmount: Optional[float] = None
    paymentMethod: Optional[str] = None
    tags: Optional[List[str]] = None
    goalId: Optional[str] = None
    isRecurring: Optional[bool] = None

    model_config = ConfigDict(populate_by_name=True)