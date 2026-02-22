from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from bson import ObjectId

from app.models.base import PyObjectId  # single shared definition


class ReminderModel(BaseModel):
    """Reminder model matching the MongoDB schema."""

    id: Optional[str] = Field(None, alias="_id")
    userId: str
    title: str = Field(..., max_length=100)
    date: datetime
    calendarEventId: Optional[str] = None
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


class ReminderCreate(BaseModel):
    """Schema for creating a new reminder."""

    userId: str
    title: str = Field(..., max_length=100)
    date: datetime
    calendarEventId: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class ReminderUpdate(BaseModel):
    """Schema for updating an existing reminder."""

    title: Optional[str] = Field(None, max_length=100)
    date: Optional[datetime] = None
    calendarEventId: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class ReminderCount(BaseModel):
    """Count of reminders by temporal status."""

    total: int = 0
    today: int = 0
    upcoming: int = 0
    overdue: int = 0


class ReminderResponse(BaseModel):
    """Enhanced reminder response with server-calculated status fields."""

    id: str
    userId: str
    title: str
    date: datetime
    calendarEventId: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    # Virtual / calculated fields
    isOverdue: bool
    isToday: bool
    daysUntil: int
    daysOverdue: int

    model_config = ConfigDict(populate_by_name=True)