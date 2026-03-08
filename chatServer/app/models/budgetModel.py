from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from app.models.base import PyObjectId  # single shared definition


class CategoryLimitModel(BaseModel):
    """Category budget limit within a budget."""
    
    name: str = Field(..., max_length=50)
    limit: float = Field(..., gt=0)

    model_config = ConfigDict(populate_by_name=True)


class BudgetModel(BaseModel):
    """Budget model matching the MongoDB schema."""

    id: Optional[str] = Field(None, alias="_id")
    userId: str
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)
    categories: List[CategoryLimitModel] = Field(default_factory=list)
    totalBudget: float = Field(..., ge=0)
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    v: Optional[int] = Field(None, alias="__v")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )

    @field_validator("userId", mode="before")
    @classmethod
    def coerce_objectid_to_str(cls, v):
        return str(v) if isinstance(v, ObjectId) else v


class BudgetCreate(BaseModel):
    """Schema for creating a new budget."""

    userId: str
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)
    categories: List[CategoryLimitModel] = Field(default_factory=list)
    totalBudget: float = Field(..., ge=0)

    model_config = ConfigDict(populate_by_name=True)


class BudgetUpdate(BaseModel):
    """Schema for updating an existing budget."""

    categories: Optional[List[CategoryLimitModel]] = None
    totalBudget: Optional[float] = Field(None, ge=0)

    model_config = ConfigDict(populate_by_name=True)


class BudgetSummary(BaseModel):
    """Summary statistics for budgets."""

    totalBudget: float = 0
    totalSpent: float = 0
    remaining: float = 0
    utilizationPercentage: float = 0


class BudgetResponse(BaseModel):
    """Enhanced budget response with server-calculated fields."""

    id: str
    userId: str
    month: int
    year: int
    categories: List[CategoryLimitModel]
    totalBudget: float
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    # Virtual / calculated fields
    remaining: float
    utilizationPercentage: float

    model_config = ConfigDict(populate_by_name=True)
