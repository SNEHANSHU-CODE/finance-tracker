"""
ChatHistoryModel — one document per user in the `chat_history` collection.
Python owns this collection entirely (Node.js does not touch it).

Schema:
{
    "userId": "string",
    "messages": [
        {
            "role": "human" | "ai",
            "content": "...",
            "provider": "grok" | "gemini" | null,
            "isRag": false,
            "documentName": null,
            "timestamp": ISODate
        }
    ],
    "createdAt": ISODate,
    "updatedAt": ISODate
}
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Literal
from datetime import datetime
from bson import ObjectId

from app.models.base import PyObjectId


# ── Message inside the messages array ─────────────────────────────────────

class ChatMessage(BaseModel):
    """A single message inside a ChatHistory document."""

    role: Literal["human", "ai"]
    content: str
    provider: Optional[str] = None          # "grok" | "gemini" | null
    isRag: bool = False                      # True if answered via RAG pipeline
    documentName: Optional[str] = None      # vault document name if isRag=True
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)


# ── Full chat history document ─────────────────────────────────────────────

class ChatHistoryModel(BaseModel):
    """
    Read model for a chat_history document.
    One document per user — messages array grows via $push.
    """

    id: Optional[str] = Field(None, alias="_id")
    userId: str
    messages: List[ChatMessage] = Field(default_factory=list)
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )

    @field_validator("userId", "id", mode="before")
    @classmethod
    def coerce_objectid_to_str(cls, v):
        return str(v) if isinstance(v, ObjectId) else v


# ── Insert schema (no id / timestamps — MongoDB fills those) ──────────────

class ChatMessageInsert(BaseModel):
    """Schema for a single message being pushed into the messages array."""

    role: Literal["human", "ai"]
    content: str
    provider: Optional[str] = None
    isRag: bool = False
    documentName: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(populate_by_name=True)


# ── Display schema (returned to frontend) ─────────────────────────────────

class ChatMessageDisplay(BaseModel):
    """Lightweight shape sent to the frontend on get_chat_history."""

    role: str
    content: str
    provider: Optional[str] = None
    isRag: bool = False
    documentName: Optional[str] = None
    timestamp: str                          # ISO string for JSON serialisation

    model_config = ConfigDict(populate_by_name=True)