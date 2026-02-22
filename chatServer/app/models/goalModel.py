from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

from app.models.base import PyObjectId  # single shared definition


class GoalModel(BaseModel):
    """Goal model matching the MongoDB schema."""

    id: Optional[str] = Field(None, alias="_id")
    userId: str
    name: str = Field(..., max_length=50)
    category: Literal[
        "Savings", "Travel", "Transportation", "Technology", "Emergency",
        "Investment", "Home", "Education", "Health", "Other"
    ]
    priority: Literal["High", "Medium", "Low"] = "Medium"
    targetAmount: float = Field(..., ge=0)
    savedAmount: float = Field(default=0, ge=0)
    targetDate: datetime
    status: Literal["Active", "Completed", "Paused"] = "Active"
    completedDate: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=200)
    isGuestMigrated: bool = False
    migratedAt: Optional[datetime] = None
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


class GoalCreate(BaseModel):
    """Schema for creating a new goal."""

    userId: str
    name: str = Field(..., max_length=50)
    category: Literal[
        "Savings", "Travel", "Transportation", "Technology", "Emergency",
        "Investment", "Home", "Education", "Health", "Other"
    ]
    priority: Literal["High", "Medium", "Low"] = "Medium"
    targetAmount: float = Field(..., ge=0)
    savedAmount: float = Field(default=0, ge=0)
    targetDate: datetime
    description: Optional[str] = Field(None, max_length=200)

    model_config = ConfigDict(populate_by_name=True)


class GoalUpdate(BaseModel):
    """Schema for updating an existing goal."""

    name: Optional[str] = Field(None, max_length=50)
    category: Optional[Literal[
        "Savings", "Travel", "Transportation", "Technology", "Emergency",
        "Investment", "Home", "Education", "Health", "Other"
    ]] = None
    priority: Optional[Literal["High", "Medium", "Low"]] = None
    targetAmount: Optional[float] = Field(None, ge=0)
    savedAmount: Optional[float] = Field(None, ge=0)
    targetDate: Optional[datetime] = None
    status: Optional[Literal["Active", "Completed", "Paused"]] = None
    description: Optional[str] = Field(None, max_length=200)

    model_config = ConfigDict(populate_by_name=True)


class GoalSummary(BaseModel):
    """Summary statistics for goals."""

    totalGoals: int = 0
    activeGoals: int = 0
    completedGoals: int = 0
    pausedGoals: int = 0
    totalTargetAmount: float = 0
    totalSavedAmount: float = 0
    overallProgress: float = 0


class GoalResponse(BaseModel):
    """Enhanced goal response with server-calculated virtual fields."""

    id: str
    userId: str
    name: str
    category: str
    priority: str
    targetAmount: float
    savedAmount: float
    targetDate: datetime
    status: str
    completedDate: Optional[datetime] = None
    description: Optional[str] = None
    isGuestMigrated: bool
    migratedAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    # Virtual / calculated fields
    progressPercentage: int
    remainingAmount: float
    daysRemaining: int
    isOverdue: bool

    model_config = ConfigDict(populate_by_name=True)