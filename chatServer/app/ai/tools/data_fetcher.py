"""
Data Fetcher Module
Fetches financial data based on intent classification result.
Uses asyncio.gather() for parallel fetching when multiple intents are requested.
"""
import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.transactionService import TransactionService
from app.services.goalService import GoalService
from app.services.reminderService import ReminderService

logger = logging.getLogger(__name__)

# Maximum documents fetched per intent to keep LLM context lean
MAX_CONTEXT_ITEMS = 10


class DataFetcher:
    """
    Fetches financial data based on classified user intent.
    Acts as the bridge between intent classification and LLM context building.
    """

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.transaction_service = TransactionService(db)
        self.goal_service = GoalService(db)
        self.reminder_service = ReminderService(db)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def fetch_intent_data(
        self,
        user_id: str,
        intent: str,
        time_range: Tuple[Optional[datetime], Optional[datetime]],
        query: str = "",
    ) -> Dict[str, Any]:
        """
        Fetch data for a single intent.

        Args:
            user_id:    MongoDB user ID string.
            intent:     One of 'transactions', 'goals', 'reminders', 'general'.
            time_range: (start_date, end_date) tuple; either value may be None.
            query:      Original user query text (used for text search in transactions).

        Returns:
            Dict with keys: intent, user_id, timestamp, data, and optionally error.
        """
        result: Dict[str, Any] = {
            "intent": intent,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "data": {},
        }

        try:
            start_date, end_date = time_range
            fetchers = {
                "transactions": lambda: self._fetch_transactions(
                    user_id, start_date, end_date, query
                ),
                "goals": lambda: self._fetch_goals(user_id),
                "reminders": lambda: self._fetch_reminders(user_id),
                "general": lambda: self._fetch_general(user_id, start_date, end_date),
            }

            fetch_fn = fetchers.get(intent)
            if fetch_fn is None:
                logger.warning("Unknown intent '%s'; returning empty data.", intent)
                return result

            result["data"] = await fetch_fn()
            logger.info("Fetched '%s' data for user %s.", intent, user_id)

        except Exception as e:
            logger.error("Error fetching '%s' data for user %s: %s", intent, user_id, e)
            result["error"] = str(e)

        return result

    async def fetch_multi_intent_data(
        self,
        user_id: str,
        intents: List[str],
        time_range: Tuple[Optional[datetime], Optional[datetime]],
        query: str = "",
    ) -> Dict[str, Any]:
        """
        Fetch data for multiple intents IN PARALLEL using asyncio.gather().

        Args:
            user_id:    MongoDB user ID string.
            intents:    List of intent strings to fetch concurrently.
            time_range: Shared (start_date, end_date) tuple.
            query:      Original user query text.

        Returns:
            Dict with keys: query, user_id, timestamp, intents_data (dict keyed by intent).
        """
        tasks = [
            self.fetch_intent_data(user_id, intent, time_range, query)
            for intent in intents
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        intents_data: Dict[str, Any] = {}
        for intent, result in zip(intents, results):
            if isinstance(result, Exception):
                logger.error("Parallel fetch failed for intent '%s': %s", intent, result)
                intents_data[intent] = {"error": str(result)}
            else:
                intents_data[intent] = result

        return {
            "query": query,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "intents_data": intents_data,
        }

    # ------------------------------------------------------------------
    # Private fetch helpers
    # ------------------------------------------------------------------

    async def _fetch_transactions(
        self,
        user_id: str,
        start_date: Optional[datetime],
        end_date: Optional[datetime],
        query: str = "",
    ) -> Dict[str, Any]:
        """Fetch recent transactions plus a quick client-side summary."""
        try:
            transactions = await self.transaction_service.get_transactions_by_user(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                search_text=query or None,
                limit=MAX_CONTEXT_ITEMS,
            )

            total_income = sum(
                t["amount"] for t in transactions if t.get("type") == "Income"
            )
            total_expense = sum(
                t["amount"] for t in transactions if t.get("type") == "Expense"
            )

            # Build category breakdown in a single pass
            categories: Dict[str, Dict[str, Any]] = {}
            for t in transactions:
                cat = t.get("category", "Other")
                entry = categories.setdefault(cat, {"count": 0, "amount": 0.0})
                entry["count"] += 1
                entry["amount"] += t.get("amount", 0)

            return {
                "transactions": transactions,
                "summary": {
                    "total_transactions": len(transactions),
                    "total_income": round(total_income, 2),
                    "total_expense": round(total_expense, 2),
                    "net": round(total_income - total_expense, 2),
                    "categories": categories,
                    "date_range": {
                        "start": start_date.isoformat() if start_date else None,
                        "end": end_date.isoformat() if end_date else None,
                    },
                },
            }
        except Exception as e:
            logger.error("Error in _fetch_transactions: %s", e)
            return {"error": str(e), "transactions": [], "summary": {}}

    async def _fetch_goals(self, user_id: str) -> Dict[str, Any]:
        """Fetch all goals with pre-calculated virtual fields."""
        try:
            # GoalService._enrich() already computes progressPercentage,
            # remainingAmount, daysRemaining, isOverdue — use those field names.
            goals = await self.goal_service.get_goals_by_user(user_id)
            summary = await self.goal_service.get_goal_summary(user_id)

            # Trim to context limit after fetching (summary uses full list)
            goals_ctx = goals[:MAX_CONTEXT_ITEMS]

            return {"goals": goals_ctx, "summary": summary}
        except Exception as e:
            logger.error("Error in _fetch_goals: %s", e)
            return {"error": str(e), "goals": [], "summary": {}}

    async def _fetch_reminders(self, user_id: str) -> Dict[str, Any]:
        """Fetch all reminders categorised by temporal status."""
        try:
            # ReminderService._enrich() attaches isOverdue, isToday, daysUntil.
            reminders = await self.reminder_service.get_reminders_by_user(user_id)
            counts = await self.reminder_service.count_reminders(user_id)

            upcoming = [r for r in reminders if not r["isOverdue"] and not r["isToday"]]
            today = [r for r in reminders if r["isToday"]]
            overdue = [r for r in reminders if r["isOverdue"]]

            return {
                "reminders": {
                    "today": today[:MAX_CONTEXT_ITEMS],
                    "upcoming": upcoming[:MAX_CONTEXT_ITEMS],
                    "overdue": overdue[:MAX_CONTEXT_ITEMS],
                },
                "summary": counts,
            }
        except Exception as e:
            logger.error("Error in _fetch_reminders: %s", e)
            return {
                "error": str(e),
                "reminders": {"today": [], "upcoming": [], "overdue": []},
                "summary": {},
            }

    async def _fetch_general(
        self,
        user_id: str,
        start_date: Optional[datetime],
        end_date: Optional[datetime],
    ) -> Dict[str, Any]:
        """
        For 'general' intent: fetch a lightweight cross-domain overview
        (recent transactions + goal summary + reminder counts) IN PARALLEL.
        """
        try:
            transactions_task = self.transaction_service.get_transactions_by_user(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                limit=5,
            )
            goal_summary_task = self.goal_service.get_goal_summary(user_id)
            reminder_counts_task = self.reminder_service.count_reminders(user_id)

            transactions, goal_summary, reminder_counts = await asyncio.gather(
                transactions_task, goal_summary_task, reminder_counts_task
            )

            return {
                "recent_transactions": transactions,
                "goal_summary": goal_summary,
                "reminder_summary": reminder_counts,
            }
        except Exception as e:
            logger.error("Error in _fetch_general: %s", e)
            return {"error": str(e)}