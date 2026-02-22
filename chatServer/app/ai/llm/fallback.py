"""
Fallback Messages Module
Default responses when LLM is unavailable or errors occur
"""
from typing import Literal

# Fallback messages for different scenarios
FALLBACK_MESSAGES = {
    "authenticated": {
        "default": (
            "I'm having trouble processing your request right now. "
            "Please try again in a moment."
        ),
        "network_error": (
            "It seems I'm experiencing connection issues. "
            "Please check your internet connection and try again."
        ),
        "timeout": (
            "Your request is taking longer than expected. "
            "Please try again with a shorter question."
        ),
        "rate_limit": (
            "I'm receiving too many requests. Please wait a moment before trying again."
        ),
    },
    "guest": {
        "default": (
            "I'm here to help with general financial questions! 👋\n\n"
            "For personalized advice based on your actual accounts and spending patterns, "
            "please sign in.\n\n"
            "In the meantime, I can help with general financial concepts and best practices."
        ),
        "network_error": (
            "I'm temporarily unavailable right now. "
            "For personalized guidance, please sign in and try again later."
        ),
        "timeout": (
            "Your request took too long to process. "
            "Please sign in for more robust financial guidance."
        ),
        "rate_limit": (
            "I'm handling many requests. Please wait a moment before trying again."
        ),
    }
}


def get_fallback_message(
    user_type: Literal["authenticated", "guest"],
    error_type: str = "default"
) -> dict:
    """
    Get fallback message for given user type and error
    
    Args:
        user_type: "authenticated" or "guest"
        error_type: type of error (default/network_error/timeout/rate_limit)
    
    Returns:
        dict with fallback response
    """
    messages = FALLBACK_MESSAGES.get(user_type, FALLBACK_MESSAGES["guest"])
    message_text = messages.get(error_type, messages["default"])
    
    return {
        "text": message_text,
        "provider": "fallback",
        "metadata": {
            "error": True,
            "error_type": error_type,
            "response_type": user_type,
            "is_fallback": True
        }
    }
