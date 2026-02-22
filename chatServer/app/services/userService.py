"""
User Service - Handles user authentication and data access
Connects to the same MongoDB database used by Node.js auth service
"""
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.userModel import UserModel, UserPublic

logger = logging.getLogger(__name__)


class UserService:
    """
    Service for user operations
    Reads from the same 'users' collection as Node.js auth service
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.users_collection = db["users"]  # Must match Node.js collection name
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserModel]:
        """
        Get user by ID from MongoDB
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            UserModel if found, None otherwise
        """
        try:
            if not ObjectId.is_valid(user_id):
                logger.warning(f"Invalid user_id format: {user_id}")
                return None
            
            user_doc = await self.users_collection.find_one({"_id": ObjectId(user_id)})
            
            if not user_doc:
                logger.info(f"User not found: {user_id}")
                return None
            
            # Convert ObjectId to string for Pydantic
            if "_id" in user_doc:
                user_doc["_id"] = str(user_doc["_id"])
            
            user = UserModel(**user_doc)
            logger.info(f"✅ User found: {user.username} ({user.email})")
            return user
            
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}", exc_info=True)
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[UserModel]:
        """
        Get user by email from MongoDB
        
        Args:
            email: User's email address
            
        Returns:
            UserModel if found, None otherwise
        """
        try:
            email = email.lower().strip()
            user_doc = await self.users_collection.find_one({"email": email})
            
            if not user_doc:
                logger.info(f"User not found with email: {email}")
                return None
            
            # Convert ObjectId to string
            if "_id" in user_doc:
                user_doc["_id"] = str(user_doc["_id"])
            
            user = UserModel(**user_doc)
            logger.info(f"✅ User found by email: {user.username}")
            return user
            
        except Exception as e:
            logger.error(f"Error getting user by email: {e}", exc_info=True)
            return None
    
    async def get_user_by_username(self, username: str) -> Optional[UserModel]:
        """
        Get user by username from MongoDB
        
        Args:
            username: User's username
            
        Returns:
            UserModel if found, None otherwise
        """
        try:
            user_doc = await self.users_collection.find_one({"username": username})
            
            if not user_doc:
                logger.info(f"User not found with username: {username}")
                return None
            
            # Convert ObjectId to string
            if "_id" in user_doc:
                user_doc["_id"] = str(user_doc["_id"])
            
            user = UserModel(**user_doc)
            logger.info(f"✅ User found by username: {user.username}")
            return user
            
        except Exception as e:
            logger.error(f"Error getting user by username: {e}", exc_info=True)
            return None
    
    async def update_last_login(self, user_id: str, provider: str = "email") -> bool:
        """
        Update user's last login timestamp
        
        Args:
            user_id: User's MongoDB ObjectId as string
            provider: Authentication provider ('email' or 'google')
            
        Returns:
            True if successful, False otherwise
        """
        try:
            from datetime import datetime
            
            result = await self.users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "lastLoginAt": datetime.utcnow(),
                        "lastLoginProvider": provider
                    }
                }
            )
            
            if result.modified_count > 0:
                logger.info(f"✅ Updated last login for user: {user_id}")
                return True
            else:
                logger.warning(f"No update performed for user: {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating last login: {e}", exc_info=True)
            return False
    
    async def get_user_public_info(self, user_id: str) -> Optional[UserPublic]:
        """
        Get public user info (safe to share)
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            UserPublic if found, None otherwise
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
        
        return UserPublic(
            _id=user.id,
            username=user.username,
            email=user.email,
            role=user.role,
            isActive=user.isActive,
            authProvider=user.authProvider,
            preferences=user.preferences,
            createdAt=user.createdAt,
            lastLoginAt=user.lastLoginAt
        )
    
    async def verify_user_exists(self, user_id: str) -> bool:
        """
        Check if user exists in database
        
        Args:
            user_id: User's MongoDB ObjectId as string
            
        Returns:
            True if user exists, False otherwise
        """
        try:
            if not ObjectId.is_valid(user_id):
                return False
            
            count = await self.users_collection.count_documents(
                {"_id": ObjectId(user_id)},
                limit=1
            )
            return count > 0
            
        except Exception as e:
            logger.error(f"Error verifying user exists: {e}", exc_info=True)
            return False


# Singleton pattern for user service
_user_service: Optional[UserService] = None


def init_user_service(db: AsyncIOMotorDatabase) -> UserService:
    """
    Initialize user service with database connection
    
    Args:
        db: MongoDB database instance
        
    Returns:
        UserService instance
    """
    global _user_service
    _user_service = UserService(db)
    logger.info("✅ User service initialized")
    return _user_service


def get_user_service() -> Optional[UserService]:
    """
    Get user service instance
    
    Returns:
        UserService instance or None if not initialized
    """
    return _user_service