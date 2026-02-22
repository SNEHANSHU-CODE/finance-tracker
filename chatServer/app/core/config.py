from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "Financial Chat Server"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Server
    HOST: str = "localhost"
    PORT: int = 5002
    RELOAD: bool = True
    WORKERS: int = 1
    
    # Database
    MONGO_URI: str
    MONGO_DB_NAME: str = 'finace-tracker'
    
    # AI/LLM Configuration
    GROK_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEFAULT_LLM: str = "grok"  # "grok" or "gemini" - reads from .env, defaults to grok
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 1024
    
    # Security - MUST match Node.js JWT_SECRET for token verification to work!
    # Node.js uses: process.env.JWT_SECRET || 'your-secret-key'
    SECRET_KEY: str = "your-secret-key"  # MATCHES Node.js default
    ALGORITHM: str = "HS256"  # MUST be HS256 to match jsonwebtoken default
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: str = "*"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields in .env without error


# Global settings instance
settings = Settings()