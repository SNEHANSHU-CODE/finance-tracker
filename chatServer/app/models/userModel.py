"""
User Model for Python - Mirrors Node.js userModel.js
Connects to the same MongoDB database used by Node.js auth service
"""
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2"""
    
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.str_schema(),
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


class RefreshTokenModel(BaseModel):
    """Refresh token sub-document"""
    token: str
    device: Optional[str] = None
    ip: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(
        populate_by_name=True
    )


class UserPreferencesModel(BaseModel):
    """User preferences sub-document"""
    currency: Literal["INR", "USD", "EUR", "GBP", "CAD", "AUD"] = "INR"
    language: Literal["en", "hi", "es", "fr", "de", "it"] = "en"
    theme: Literal["light", "dark", "auto"] = "light"

    model_config = ConfigDict(
        populate_by_name=True
    )


class UserModel(BaseModel):
    """
    User model matching the Node.js Mongoose schema
    This allows Python to read users from the same MongoDB collection
    """
    id: Optional[str] = Field(None, alias="_id")
    username: str = Field(..., min_length=3, max_length=30)
    email: str  # Changed from EmailStr to str
    password: Optional[str] = Field(None, exclude=True)  # Never return password
    refreshTokens: List[RefreshTokenModel] = Field(default_factory=list)
    lastLoginAt: Optional[datetime] = None
    lastLoginProvider: Optional[Literal["email", "google"]] = "email"
    role: Literal["user", "admin"] = "user"
    isActive: bool = True
    googleId: Optional[str] = None
    googleRefreshToken: Optional[str] = Field(None, exclude=True)  # Never return
    authProvider: Literal["email", "google"] = "email"
    authMethods: List[Literal["email", "google"]] = Field(default_factory=lambda: ["email"])
    preferences: UserPreferencesModel = Field(default_factory=UserPreferencesModel)
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    v: Optional[int] = Field(None, alias="__v")

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    @field_validator('id', mode='before')
    @classmethod
    def convert_objectid_to_str(cls, v):
        """Convert ObjectId to string for id field"""
        if isinstance(v, ObjectId):
            return str(v)
        return v


class UserInDB(UserModel):
    """User model with password hash (for internal use only)"""
    password: str

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )


class UserPublic(BaseModel):
    """Public user info (safe to return to clients)"""
    id: str = Field(..., alias="_id")
    username: str
    email: str  # Changed from EmailStr to str
    role: Literal["user", "admin"]
    isActive: bool
    authProvider: Literal["email", "google"]
    preferences: UserPreferencesModel
    createdAt: Optional[datetime] = None
    lastLoginAt: Optional[datetime] = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )