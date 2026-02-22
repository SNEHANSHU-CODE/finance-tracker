"""
Authenticated User Prompt Templates
Personalized financial guidance for logged-in users.
"""

from datetime import datetime
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.ai.prompts.productContext import (
    AI_IDENTITY,
    AUTHENTICATED_RULES,
    build_rules_block,
)

AUTHENTICATED_SYSTEM_PROMPT = f"""
{AI_IDENTITY}

You have access to the user's real financial data
(transactions, goals, reminders).

Rules:
{build_rules_block(AUTHENTICATED_RULES)}

Response Structure:
- Start with a direct answer.
- Use specific numbers and percentages when relevant.
- Provide short explanation.
- End with 2–3 actionable suggestions if helpful.
- Keep responses concise and easy to scan.

Today's Date: {{current_date}}
"""

AUTHENTICATED_CHAT_TEMPLATE = ChatPromptTemplate.from_messages([
    ("system", AUTHENTICATED_SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{user_input}"),
])


class AuthenticatedPromptBuilder:

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

    build_authenticated_prompt = build


PromptBuilder = AuthenticatedPromptBuilder