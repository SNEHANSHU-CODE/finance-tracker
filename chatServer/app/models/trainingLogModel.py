"""
TrainingLogModel — append-only log of every message for SLM fine-tuning.
One document per message. Never updated or deleted.
Python owns this collection entirely.

Schema:
{
    "userId":       "string",
    "role":         "human" | "ai",
    "content":      "...",
    "provider":     "grok" | "gemini" | null,
    "isRag":        false,
    "documentName": null,
    "timestamp":    ISODate
}
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

from app.models.base import PyObjectId


class TrainingLogModel(BaseModel):
    """
    Read model for a training_logs document.
    One document per message — immutable after insert.
    """

    id: Optional[str] = Field(None, alias="_id")
    userId: str
    role: Literal["human", "ai"]
    content: str
    provider: Optional[str] = None          # which LLM produced this (ai rows only)
    isRag: bool = False                      # True if answered via RAG pipeline
    documentName: Optional[str] = None      # vault document name if isRag=True
    timestamp: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )

    @field_validator("userId", "id", mode="before")
    @classmethod
    def coerce_objectid_to_str(cls, v):
        return str(v) if isinstance(v, ObjectId) else v


class TrainingLogInsert(BaseModel):
    """
    Schema used when inserting a training log entry.
    No id / _id — MongoDB generates it.
    """

    userId: str
    role: Literal["human", "ai"]
    content: str
    provider: Optional[str] = None
    isRag: bool = False
    documentName: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)