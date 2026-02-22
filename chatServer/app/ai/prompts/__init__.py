"""Prompts Module Initialization"""
from app.ai.prompts.template import (
    PromptBuilder,
    AuthenticatedPromptBuilder,
    AUTHENTICATED_CHAT_TEMPLATE,
    AUTHENTICATED_SYSTEM_PROMPT,
)
from app.ai.prompts.guestTemplate import (
    GuestPromptBuilder,
    GUEST_CHAT_TEMPLATE,
    GUEST_SYSTEM_PROMPT,
    GUEST_SIGNIN_PROMPT,
    DATA_DEPENDENT_MESSAGE,
)

__all__ = [
    "PromptBuilder",
    "AuthenticatedPromptBuilder",
    "AUTHENTICATED_CHAT_TEMPLATE",
    "AUTHENTICATED_SYSTEM_PROMPT",
    "GuestPromptBuilder",
    "GUEST_CHAT_TEMPLATE",
    "GUEST_SYSTEM_PROMPT",
    "GUEST_SIGNIN_PROMPT",
    "DATA_DEPENDENT_MESSAGE",
]
