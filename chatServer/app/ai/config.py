"""
LLM Configuration for LangChain
Manages API keys and LLM model initialization
"""
import logging
from typing import Literal
from pydantic_settings import BaseSettings


logger = logging.getLogger(__name__)


class LLMSettings(BaseSettings):
    """LLM configuration settings"""
    
    # Groq Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    GROQ_TEMPERATURE: float = 0.7
    GROQ_MAX_TOKENS: int = 1024
    
    # Gemini Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    GEMINI_TEMPERATURE: float = 0.7
    GEMINI_MAX_TOKENS: int = 1024
    
    # Default LLM
    DEFAULT_LLM: Literal["groq", "gemini"] = "groq"
    
    # LLM Settings
    ENABLE_STREAMING: bool = True
    TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


class IntentConfig:
    """Intent classifier configuration"""
    
    # Default intent configuration
    DEFAULT_INTENTS = {
        "transactions": True,
        "goals": True,
        "reminders": True,
    }
    
    # Data duration for each intent
    INTENT_DURATIONS = {
        "transactions": "30 days",
        "goals": "all",
        "reminders": "all",
    }
    
    # Minimum confidence score for intent classification
    MIN_CONFIDENCE: float = 0.6


# Load settings
llm_settings = LLMSettings()
