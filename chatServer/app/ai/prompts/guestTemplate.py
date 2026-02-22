"""
Guest User Prompt Templates
General financial guidance for unauthenticated users.
"""

from datetime import datetime
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.ai.prompts.productContext import (
    AI_IDENTITY,
    GUEST_RULES,
    FEATURE_SUMMARY,
    build_rules_block,
)

GUEST_SYSTEM_PROMPT = f"""
{AI_IDENTITY}

The user is not signed in.

App Overview:
{FEATURE_SUMMARY}

Rules:
{build_rules_block(GUEST_RULES)}

Response Style:
- Clear and beginner-friendly.
- Short paragraphs.
- Practical advice.
- Encourage sign-in when personalization is needed.

Today's Date: {{current_date}}
"""

GUEST_CHAT_TEMPLATE = ChatPromptTemplate.from_messages([
    ("system", GUEST_SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{user_input}"),
])


GUEST_SIGNIN_PROMPT = (
    "👋 To access personalized insights based on your real transactions, goals, "
    "and reminders, please sign in.\n\n"
    "Once signed in, I can analyze your spending patterns, track savings progress, "
    "and provide tailored financial recommendations."
)


DATA_DEPENDENT_MESSAGE = "This feature requires user authentication."


class GuestPromptBuilder:

    @staticmethod
    def build(
        user_input: str,
        chat_history: list | None = None,
        current_date: str | None = None,
    ) -> dict:
        return {
            "user_input": user_input,
            "chat_history": chat_history or [],
            "current_date": current_date or datetime.now().strftime("%B %d, %Y"),
        }

    build_guest_prompt = build

    @staticmethod
    def build_signin_response() -> str:
        return GUEST_SIGNIN_PROMPT