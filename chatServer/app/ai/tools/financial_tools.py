"""
Financial Tools for LangChain
Pure functions decorated with @tool — compatible with LangChain tool binding.

Design rules:
  - Each tool is a module-level function (NOT a static method).
    Mixing @staticmethod with @tool causes descriptor binding issues at runtime.
  - Tools are stateless and side-effect-free (pure computation).
  - FINANCIAL_TOOLS list at the bottom is the single export for agent registration.
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from langchain_core.tools import tool

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@tool
def analyze_spending_pattern(transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyse spending patterns from a list of transactions.

    Args:
        transactions: List of transaction dicts (must contain 'amount', 'category', 'date', 'type').

    Returns:
        Dict with total_transactions, total_amount, average_transaction, categories, daily_trends.
    """
    if not transactions:
        return {"error": "No transactions provided"}

    try:
        categories: Dict[str, Dict[str, Any]] = {}
        daily_totals: Dict[str, float] = {}

        for tx in transactions:
            # --- category breakdown ---
            cat = tx.get("category", "Other")
            entry = categories.setdefault(cat, {"count": 0, "total": 0.0})
            entry["count"] += 1
            entry["total"] += tx.get("amount", 0)

            # --- daily breakdown ---
            raw_date = tx.get("date", datetime.now())
            date_key = (
                raw_date.date().isoformat()
                if isinstance(raw_date, datetime)
                else str(raw_date)
            )
            daily_totals[date_key] = daily_totals.get(date_key, 0) + tx.get("amount", 0)

        total = sum(tx.get("amount", 0) for tx in transactions)
        avg = total / len(transactions)

        return {
            "total_transactions": len(transactions),
            "total_amount": round(total, 2),
            "average_transaction": round(avg, 2),
            "categories": categories,
            "daily_trends": daily_totals,
        }

    except Exception as e:
        logger.error("analyze_spending_pattern error: %s", e)
        return {"error": str(e)}


@tool
def calculate_goal_progress(current: float, target: float) -> Dict[str, Any]:
    """
    Calculate progress towards a financial goal.

    Args:
        current: Amount saved so far.
        target:  Target amount.

    Returns:
        Dict with current, target, remaining, progress_percent, is_complete.
    """
    if target <= 0:
        return {"error": "Target must be a positive number"}

    try:
        progress_percent = (current / target) * 100
        return {
            "current": round(current, 2),
            "target": round(target, 2),
            "remaining": round(max(0.0, target - current), 2),
            "progress_percent": round(min(100.0, progress_percent), 2),
            "is_complete": current >= target,
        }
    except Exception as e:
        logger.error("calculate_goal_progress error: %s", e)
        return {"error": str(e)}


@tool
def estimate_savings_timeline(
    current_savings: float,
    monthly_savings: float,
    target: float,
) -> Dict[str, Any]:
    """
    Estimate the date by which a savings goal will be reached.

    Args:
        current_savings: Savings already accumulated.
        monthly_savings: Expected additional savings per month.
        target:          Total savings target.

    Returns:
        Dict with months_needed, estimated_completion, remaining_amount, or a status/warning.
    """
    if monthly_savings <= 0:
        return {"warning": "Monthly savings must be positive to project a timeline"}

    try:
        remaining = target - current_savings
        if remaining <= 0:
            return {"status": "goal_achieved", "message": "Target already reached"}

        months_needed = remaining / monthly_savings
        estimated_date = datetime.now() + timedelta(days=months_needed * 30.44)

        return {
            "months_needed": round(months_needed, 1),
            "estimated_completion": estimated_date.strftime("%Y-%m-%d"),
            "remaining_amount": round(remaining, 2),
            "monthly_savings_required": round(monthly_savings, 2),
        }
    except Exception as e:
        logger.error("estimate_savings_timeline error: %s", e)
        return {"error": str(e)}


@tool
def categorize_expenses(categories: Dict[str, float]) -> Dict[str, Any]:
    """
    Rank expense categories by amount and compute percentage share.

    Args:
        categories: Mapping of category name → total amount spent.

    Returns:
        Dict with total, per-category breakdown (amount + percentage), and largest_category.
    """
    if not categories:
        return {"error": "No categories provided"}

    try:
        total = sum(categories.values())
        breakdown = {
            cat: {
                "amount": round(amount, 2),
                "percentage": round((amount / total * 100) if total > 0 else 0, 1),
            }
            for cat, amount in sorted(categories.items(), key=lambda x: x[1], reverse=True)
        }
        return {
            "total": round(total, 2),
            "categories": breakdown,
            "largest_category": max(categories, key=categories.get) if categories else None,
        }
    except Exception as e:
        logger.error("categorize_expenses error: %s", e)
        return {"error": str(e)}


@tool
def generate_financial_summary(
    transactions: List[Dict[str, Any]],
    goals: List[Dict[str, Any]],
    reminders: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Generate a comprehensive cross-domain financial snapshot.

    Args:
        transactions: List of transaction dicts.
        goals:        List of goal dicts (expects savedAmount, targetAmount, status).
        reminders:    List of reminder dicts (expects isOverdue field).

    Returns:
        Dict with finances, goals, and reminders sub-summaries.
    """
    try:
        total_income = sum(
            t.get("amount", 0) for t in transactions if t.get("type") == "Income"
        )
        total_expense = sum(
            t.get("amount", 0) for t in transactions if t.get("type") == "Expense"
        )

        total_goal_target = sum(g.get("targetAmount", 0) for g in goals)
        total_goal_saved = sum(g.get("savedAmount", 0) for g in goals)

        return {
            "finances": {
                "total_income": round(total_income, 2),
                "total_expense": round(total_expense, 2),
                "net": round(total_income - total_expense, 2),
                "transaction_count": len(transactions),
            },
            "goals": {
                "total_goals": len(goals),
                "completed": sum(1 for g in goals if g.get("status") == "Completed"),
                "active": sum(1 for g in goals if g.get("status") == "Active"),
                "total_target": round(total_goal_target, 2),
                "total_saved": round(total_goal_saved, 2),
                "overall_progress": round(
                    (total_goal_saved / total_goal_target * 100) if total_goal_target > 0 else 0,
                    2,
                ),
            },
            "reminders": {
                "total": len(reminders),
                "overdue": sum(1 for r in reminders if r.get("isOverdue")),
                "today": sum(1 for r in reminders if r.get("isToday")),
                "upcoming": sum(
                    1 for r in reminders if not r.get("isOverdue") and not r.get("isToday")
                ),
            },
        }
    except Exception as e:
        logger.error("generate_financial_summary error: %s", e)
        return {"error": str(e)}


@tool
def provide_savings_recommendation(
    income: float,
    expenses: float,
    savings_goal: float,
) -> Dict[str, Any]:
    """
    Provide personalised savings recommendations based on current cash flow.

    Args:
        income:       Monthly income.
        expenses:     Monthly expenses.
        savings_goal: Total amount to save.

    Returns:
        Dict with monthly_surplus, savings_rate, tiered recommendations, months_to_goal.
    """
    try:
        surplus = income - expenses

        if surplus <= 0:
            return {
                "status": "warning",
                "message": "Monthly expenses meet or exceed income",
                "suggestion": "Consider reducing discretionary expenses or increasing income",
            }

        savings_rate = (surplus / income * 100) if income > 0 else 0
        months_to_goal = savings_goal / surplus if surplus > 0 else float("inf")

        return {
            "monthly_surplus": round(surplus, 2),
            "current_savings_rate": round(savings_rate, 1),
            "recommendations": {
                "conservative": round(income * 0.10, 2),   # 10 % rule
                "standard": round(income * 0.20, 2),       # 50/30/20 rule
                "aggressive": round(income * 0.30, 2),     # FIRE-style saving
            },
            "months_to_goal": round(months_to_goal, 1) if months_to_goal != float("inf") else None,
        }
    except Exception as e:
        logger.error("provide_savings_recommendation error: %s", e)
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# Tool registry — import this in the agent / chain setup
# ---------------------------------------------------------------------------

FINANCIAL_TOOLS = [
    analyze_spending_pattern,
    calculate_goal_progress,
    estimate_savings_timeline,
    categorize_expenses,
    generate_financial_summary,
    provide_savings_recommendation,
]