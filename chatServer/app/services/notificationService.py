"""
Notification Service (Chat Server)
Read-only access to the shared MongoDB notifications collection.
Follows the init/get singleton pattern used by userService.

Responsibilities:
- Fetch unread notifications per user (for poller)
- Mark notifications as emitted via isPushSent flag
  (so the poller doesn't re-emit the same notification)

Does NOT create notifications — that is the main server's job.
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton state
# ---------------------------------------------------------------------------
_service_instance: Optional["NotificationService"] = None


def init_notification_service(db: AsyncIOMotorDatabase) -> "NotificationService":
    """Initialise the singleton. Called once at app startup from main.py."""
    global _service_instance
    _service_instance = NotificationService(db)
    logger.info("✅ NotificationService initialised")
    return _service_instance


def get_notification_service() -> "NotificationService":
    """Return the singleton. Raises if not yet initialised."""
    if _service_instance is None:
        raise RuntimeError(
            "NotificationService not initialised. "
            "Call init_notification_service(db) at startup."
        )
    return _service_instance


# ---------------------------------------------------------------------------
# Service class
# ---------------------------------------------------------------------------

class NotificationService:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.collection = db["notifications"]

    async def get_unemitted_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Return notifications that have NOT yet been push-emitted to this user.
        Used by the poller to find pending socket emissions.

        Query:
          - userId matches
          - isRead: false  (user hasn't seen it yet)
          - isPushSent: false  (we haven't emitted it over socket yet)
          - not expired
        """
        try:
            cursor = self.collection.find(
                {
                    "userId": ObjectId(user_id),
                    "isRead": False,
                    "isPushSent": False,
                }
            ).sort("createdAt", 1)  # oldest first so client sees them in order

            docs = await cursor.to_list(length=50)  # cap at 50 per poll cycle

            # Convert ObjectIds to strings for serialisation
            result = []
            for doc in docs:
                doc["_id"] = str(doc["_id"])
                doc["userId"] = str(doc["userId"])
                # Convert nested ObjectId refs in data if present
                if doc.get("data"):
                    for key in ("budgetId", "goalId", "transactionId"):
                        if isinstance(doc["data"].get(key), ObjectId):
                            doc["data"][key] = str(doc["data"][key])
                result.append(doc)

            return result

        except Exception as e:
            logger.error(
                "Error fetching unemitted notifications for user %s: %s", user_id, e
            )
            return []

    async def mark_as_push_sent(self, notification_ids: List[str]) -> int:
        """
        Set isPushSent=True on a batch of notifications after emitting them.
        Returns the count of documents updated.
        """
        if not notification_ids:
            return 0
        try:
            result = await self.collection.update_many(
                {"_id": {"$in": [ObjectId(nid) for nid in notification_ids]}},
                {"$set": {"isPushSent": True, "updatedAt": datetime.utcnow()}},
            )
            logger.debug(
                "Marked %d notifications as push-sent", result.modified_count
            )
            return result.modified_count

        except Exception as e:
            logger.error("Error marking notifications as push-sent: %s", e)
            return 0

    async def get_unread_count(self, user_id: str) -> int:
        """
        Return the count of unread notifications for a user.
        Used for badge count sync after connection.
        """
        try:
            return await self.collection.count_documents(
                {"userId": ObjectId(user_id), "isRead": False}
            )
        except Exception as e:
            logger.error(
                "Error getting unread count for user %s: %s", user_id, e
            )
            return 0

    async def get_connected_users_with_pending(
        self, connected_user_ids: List[str]
    ) -> List[str]:
        """
        From a list of connected user IDs, return only those who have
        unemitted notifications. Avoids querying MongoDB per-user in the poller.
        Single aggregation query for the whole connected pool.
        """
        if not connected_user_ids:
            return []
        try:
            pipeline = [
                {
                    "$match": {
                        "userId": {
                            "$in": [ObjectId(uid) for uid in connected_user_ids]
                        },
                        "isRead": False,
                        "isPushSent": False,
                    }
                },
                {"$group": {"_id": "$userId"}},
            ]
            docs = await self.collection.aggregate(pipeline).to_list(length=None)
            return [str(doc["_id"]) for doc in docs]

        except Exception as e:
            logger.error(
                "Error finding users with pending notifications: %s", e
            )
            return []