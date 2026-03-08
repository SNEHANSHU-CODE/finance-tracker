"""
RAG Prompt Template
Used when user asks questions about an uploaded PDF document.
Completely separate from authenticated/guest financial templates.
"""
from datetime import datetime
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.ai.prompts.productContext import AI_IDENTITY, APP_NAME

RAG_SYSTEM_PROMPT = f"""
{AI_IDENTITY}

The user is asking a question about an uploaded document from their Vault.
You have been given relevant excerpts from that document as context below.

CRITICAL — BEFORE YOU ANSWER:
Ask yourself: "Is the exact answer to this question written in the DOCUMENT CONTEXT below?"
- If YES → answer using only the facts from the context.
- If NO  → write this single sentence only, nothing more:
  "I couldn't find that in the document. Try rephrasing your question."

Strict Rules:
1. ONLY use information explicitly present in the DOCUMENT CONTEXT. Zero exceptions.
2. If you cannot point to the exact text in the context that answers the question — say not found.
3. Do NOT use your training knowledge to fill gaps, guess, or infer steps not written in the context.
4. Do NOT say "however", "also", "it mentions", or add anything extra after a not-found response.
5. Do NOT fabricate steps, instructions, or procedures — if the document doesn't describe them, say not found.
6. Do NOT answer how-to questions about app features (adding transactions, goals, reminders) from your own knowledge.
7. Cite the page number when available (e.g. "On page 3...").
8. Keep answers concise and direct.
9. Do NOT mix financial account data (transactions, goals, budgets) with document content.

Document Name: {{document_name}}
Today's Date: {{current_date}}

--- DOCUMENT CONTEXT ---
{{rag_context}}
--- END CONTEXT ---
"""

RAG_CHAT_TEMPLATE = ChatPromptTemplate.from_messages([
    ("system", RAG_SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{user_input}"),
])


class RAGPromptBuilder:

    @staticmethod
    def build(
        user_input: str,
        rag_context: str,
        document_name: str = "Uploaded Document",
        chat_history: list | None = None,
        current_date: str | None = None,
    ) -> dict:
        return {
            "user_input": user_input,
            "rag_context": rag_context,
            "document_name": document_name,
            "chat_history": chat_history or [],
            "current_date": current_date or datetime.now().strftime("%B %d, %Y"),
        }