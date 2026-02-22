from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class Database:
    """MongoDB Database Manager"""
    
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_db(cls):
        """Create database connection"""
        try:
            logger.info("Connecting to MongoDB...")
            cls.client = AsyncIOMotorClient(settings.MONGO_URI)
            
            # Test the connection
            await cls.client.admin.command('ping')
            logger.info("✅ Successfully connected to MongoDB")
            
            # Get database name from URI or use default
            if settings.MONGO_DB_NAME:
                db_name = settings.MONGO_DB_NAME
            else:
                db_name = settings.MONGO_URI.split('/')[-1].split('?')[0] or 'finace-tracker'
            
            logger.info(f"Using database: {db_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        """Close database connection"""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        if not cls.client:
            raise Exception("Database not initialized. Call connect_db() first.")
        
        # Extract database name
        if settings.MONGO_DB_NAME:
            db_name = settings.MONGO_DB_NAME
        else:
            db_name = settings.MONGO_URI.split('/')[-1].split('?')[0] or 'financial-tracker'
        
        return cls.client[db_name]


# Dependency to get database instance
async def get_database():
    """Dependency to get database instance for FastAPI"""
    return Database.get_db()