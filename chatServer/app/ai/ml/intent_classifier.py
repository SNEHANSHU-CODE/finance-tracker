"""
Intent Classifier Module - Text-Based
Classifies user queries into intent categories using weighted keyword matching.
No LLM calls - fast, deterministic, zero latency.
"""
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field


logger = logging.getLogger(__name__)


@dataclass
class IntentResult:
    """Result from intent classification"""
    primary_intent: str
    confidence: float
    secondary_intents: List[Tuple[str, float]]
    keywords: List[str]
    reasoning: str = ""

    def to_dict(self) -> Dict:
        return {
            "primary_intent": self.primary_intent,
            "confidence": self.confidence,
            "secondary_intents": self.secondary_intents,
            "keywords": self.keywords,
            "reasoning": self.reasoning,
        }


class IntentClassifier:
    """
    Text-based intent classifier for financial queries.
    Uses weighted keyword matching with phrase prioritization.
    Fast, deterministic, no external dependencies.
    """

    VALID_INTENTS = ["transactions", "goals", "reminders", "general"]

    # Broad analytical phrases → fetch ALL data (transactions + goals + reminders).
    # These queries clearly need full context but contain no specific keywords.
    FETCH_ALL_PHRASES = [
        "analyse", "analyze", "analysis",
        "performance", "overview", "summary", "report",
        "how am i doing", "how i am doing",
        "how are my finances", "financial health",
        "financial status", "financial situation",
        "give me a summary", "full picture",
        "overall", "everything", "all my",
        "am i doing well", "am i doing good",
        "how is my", "review my",
        "check my finances", "check my financial",
        "assess", "assessment", "evaluate", "evaluation",
        "dashboard", "snapshot",
    ]

    # Multi-intent phrases → fetch specific combination of data types.
    # Key = phrase, Value = list of intents to activate.
    MULTI_INTENT_PHRASES = {
        # needs transactions + goals
        "am i saving enough":       ["transactions", "goals"],
        "saving enough":            ["transactions", "goals"],
        "what should i focus on":   ["transactions", "goals"],
        "where should i focus":     ["transactions", "goals"],
        "am i on track":            ["transactions", "goals"],
        "how close am i":           ["transactions", "goals"],
        "can i afford":             ["transactions", "goals"],
        "afford":                   ["transactions", "goals"],
        "reach my goal":            ["transactions", "goals"],
        "meet my goal":             ["transactions", "goals"],
        "achieve my goal":          ["transactions", "goals"],
        "budget vs":                ["transactions", "goals"],
        # needs goals + reminders
        "upcoming goals":           ["goals", "reminders"],
        "goal deadlines":           ["goals", "reminders"],
        # needs transactions + reminders
        "pending bills":            ["transactions", "reminders"],
        "bills and expenses":       ["transactions", "reminders"],
        "overdue payments":         ["transactions", "reminders"],
    }

    # Time-related patterns
    TIME_PATTERNS = {
        "today": 0,
        "yesterday": 1,
        "this week": 7,
        "last week": 14,
        "this month": 30,
        "last month": 60,
        "this quarter": 90,
        "last quarter": 180,
        "this year": 365,
        "last year": 730,
        "all": None,
        "forever": None,
    }

    # Weighted keyword definitions per intent.
    # Each entry is (keyword_or_phrase, weight).
    # Phrases (multi-word) carry higher weight since they are more specific.
    INTENT_KEYWORDS: Dict[str, List[Tuple[str, float]]] = {
        "transactions": [
            # High-signal phrases
            ("how much did i spend", 3.0),
            ("transaction history", 3.0),
            ("account balance", 3.0),
            ("payment history", 3.0),
            ("show me my expenses", 3.0),
            ("recent transactions", 3.0),
            ("total spending", 2.5),
            ("total expenses", 2.5),
            ("how much have i", 2.5),
            ("what did i spend", 2.5),
            ("money spent", 2.0),
            ("cash flow", 2.0),
            # Single keywords
            ("transaction", 1.5),
            ("transactions", 1.5),
            ("expense", 1.5),
            ("expenses", 1.5),
            ("spending", 1.5),
            ("spent", 1.2),
            ("income", 1.5),
            ("payment", 1.2),
            ("payments", 1.2),
            ("receipt", 1.2),
            ("receipts", 1.2),
            ("charge", 1.0),
            ("charges", 1.0),
            ("debit", 1.2),
            ("credit", 1.0),
            ("transfer", 1.2),
            ("balance", 1.2),
            ("purchase", 1.2),
            ("purchases", 1.2),
            ("bought", 1.0),
            ("buy", 0.8),
            ("paid", 1.0),
            ("cost", 0.8),
            ("cash", 0.8),
            ("card", 0.8),
            ("total", 0.8),
            ("sum", 0.8),
            ("account", 0.8),
            ("history", 0.8),
            ("money", 0.7),
        ],
        "goals": [
            # High-signal phrases
            ("savings goal", 3.0),
            ("financial goal", 3.0),
            ("saving for", 2.5),
            ("how much have i saved", 2.5),
            ("goal progress", 2.5),
            ("savings target", 2.5),
            ("budget plan", 2.0),
            ("financial plan", 2.0),
            ("am i on track", 2.0),
            ("how close am i", 2.0),
            ("reach my goal", 2.0),
            # Single keywords
            ("goal", 1.5),
            ("goals", 1.5),
            ("target", 1.2),
            ("save", 1.2),
            ("saving", 1.2),
            ("savings", 1.2),
            ("milestone", 1.5),
            ("objective", 1.2),
            ("achievement", 1.0),
            ("accumulate", 1.2),
            ("fund", 1.0),
            ("budget", 1.2),
            ("plan", 0.8),
            ("progress", 1.0),
            ("track", 0.8),
            ("invest", 0.8),
            ("investment", 0.8),
            ("retire", 1.0),
            ("retirement", 1.2),
            ("emergency fund", 2.0),
        ],
        "reminders": [
            # High-signal phrases
            ("set a reminder", 3.0),
            ("set reminder", 3.0),
            ("remind me", 3.0),
            ("create an alert", 3.0),
            ("send me a notification", 3.0),
            ("payment due", 2.5),
            ("bill due", 2.5),
            ("upcoming payment", 2.5),
            ("payment reminder", 3.0),
            ("due date", 2.0),
            ("don't let me forget", 2.0),
            ("notify me", 2.0),
            ("alert me", 2.0),
            # Single keywords
            ("reminder", 2.0),
            ("reminders", 2.0),
            ("remind", 1.5),
            ("alert", 1.2),
            ("alerts", 1.2),
            ("notification", 1.5),
            ("notifications", 1.5),
            ("notify", 1.2),
            ("schedule", 1.0),
            ("alarm", 1.2),
            ("upcoming", 1.0),
            ("due", 0.8),
            ("overdue", 1.2),
            ("recurring", 1.0),
            ("subscription", 1.0),
        ],
    }

    def __init__(self) -> None:
        self.default_intents = {
            "transactions": True,
            "goals": True,
            "reminders": True,
        }

    def get_intents_for_fetch(self, query: str) -> Dict[str, bool]:
        """
        Main method used by orchestrator.
        Returns a simple dict of {intent: bool} for data fetching.

        Priority order:
        1. FETCH_ALL_PHRASES match → fetch everything
        2. MULTI_INTENT_PHRASES match → fetch specific combination
        3. Weighted keyword classify → fetch matched intents + secondary if close
        4. No match → fetch everything (safe default for personal queries)
        """
        q = query.lower()

        # Priority 1: Broad analytical query → fetch all
        if any(phrase in q for phrase in self.FETCH_ALL_PHRASES):
            logger.info("Intent: FETCH_ALL (broad analytical phrase matched)")
            return {"needs_transactions": True, "needs_goals": True, "needs_reminders": True}

        # Priority 2: Multi-intent phrase → fetch specific combination
        for phrase, intents in self.MULTI_INTENT_PHRASES.items():
            if phrase in q:
                result = {"needs_transactions": False, "needs_goals": False, "needs_reminders": False}
                for intent in intents:
                    result[f"needs_{intent}"] = True
                logger.info("Intent: MULTI (%s) for phrase '%s'", intents, phrase)
                return result

        # Priority 3: Weighted keyword classification
        intent_result = self.classify(query)

        if intent_result.primary_intent == "general":
            # No clear match — safe default is fetch everything for authenticated users
            logger.info("Intent: FETCH_ALL (general fallback for personal query)")
            return {"needs_transactions": True, "needs_goals": True, "needs_reminders": True}

        # Build result from primary + any strong secondary intents
        result = {"needs_transactions": False, "needs_goals": False, "needs_reminders": False}
        result[f"needs_{intent_result.primary_intent}"] = True

        # Include secondary intents that are reasonably strong (>25% of signal)
        for secondary_intent, secondary_confidence in intent_result.secondary_intents:
            if secondary_confidence > 0.25 and secondary_intent in ("transactions", "goals", "reminders"):
                result[f"needs_{secondary_intent}"] = True
                logger.info("Also fetching secondary intent: %s (confidence %.2f)", secondary_intent, secondary_confidence)

        return result

    def classify(self, query: str) -> IntentResult:
        """
        Classify user query using weighted keyword matching.

        Scoring strategy:
        - Phrases (multi-word) are matched first and carry higher weights.
        - Single keywords add their individual weight.
        - Confidence is the ratio of the top score to the total score across
          all intents, giving a sense of how decisive the match is.
        - Falls back to 'general' when no intent clears the threshold.

        Args:
            query: User query string

        Returns:
            IntentResult with classification details
        """
        query_lower = query.lower()
        intent_scores: Dict[str, float] = {intent: 0.0 for intent in self.INTENT_KEYWORDS}
        found_keywords: List[str] = []

        for intent, keyword_weights in self.INTENT_KEYWORDS.items():
            for keyword, weight in keyword_weights:
                if keyword in query_lower:
                    intent_scores[intent] += weight
                    if keyword not in found_keywords:
                        found_keywords.append(keyword)

        total_score = sum(intent_scores.values())
        max_score = max(intent_scores.values())

        if total_score == 0 or max_score == 0:
            return IntentResult(
                primary_intent="general",
                confidence=0.5,
                secondary_intents=[],
                keywords=[],
                reasoning="No keyword matches found; defaulting to general.",
            )

        # Normalize each intent score as a fraction of total score
        # so confidence reflects how dominant the primary intent is
        normalized: Dict[str, float] = {
            intent: score / total_score for intent, score in intent_scores.items()
        }

        primary_intent = max(normalized, key=normalized.get)  # type: ignore[arg-type]
        confidence = normalized[primary_intent]

        # Secondary intents: all others with any score, sorted descending
        secondary_intents = sorted(
            [(intent, round(score, 4)) for intent, score in normalized.items()
             if intent != primary_intent and score > 0],
            key=lambda x: x[1],
            reverse=True,
        )

        # Low confidence → fall back to general
        # Threshold of 0.4 means the top intent must account for at least 40%
        # of the total keyword signal to be considered reliable.
        CONFIDENCE_THRESHOLD = 0.4
        if confidence < CONFIDENCE_THRESHOLD:
            reasoning = (
                f"Top intent '{primary_intent}' confidence {confidence:.2f} "
                f"below threshold {CONFIDENCE_THRESHOLD}; defaulting to general."
            )
            primary_intent = "general"
            confidence = round(confidence, 4)
        else:
            reasoning = (
                f"Matched keywords {found_keywords} with intent '{primary_intent}' "
                f"scoring {round(max_score, 2)} (confidence {confidence:.2f})."
            )

        logger.info(
            "Intent classification - Primary: %s (confidence: %.2f), "
            "Secondary: %s, Keywords: %s",
            primary_intent, confidence, secondary_intents, found_keywords,
        )

        return IntentResult(
            primary_intent=primary_intent,
            confidence=round(confidence, 4),
            secondary_intents=secondary_intents,
            keywords=found_keywords,
            reasoning=reasoning,
        )

    def extract_time_range(self, query: str) -> Tuple[Optional[datetime], Optional[datetime]]:
        """
        Extract time range from query using TIME_PATTERNS.

        Args:
            query: User query string

        Returns:
            Tuple of (start_date, end_date). start_date is None for 'all time'.
        """
        query_lower = query.lower()
        now = datetime.now()

        for pattern, days in self.TIME_PATTERNS.items():
            if pattern in query_lower:
                if days is None:
                    return None, now
                return now - timedelta(days=days), now

        # Default to last 30 days
        return now - timedelta(days=30), now

    def should_include_intent(self, intent: str) -> bool:
        """Check if intent should be included in data fetching."""
        return self.default_intents.get(intent, False)

    def get_intent_duration(self, intent: str) -> str:
        """Return the default data fetch duration for the given intent."""
        duration_map = {
            "transactions": "30 days",
            "goals": "all",
            "reminders": "all",
        }
        return duration_map.get(intent, "30 days")


# Global intent classifier instance
intent_classifier = IntentClassifier()