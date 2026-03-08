"""
Notification Poller
Polls MongoDB every N seconds for unemitted notifications
and pushes them to connected authenticated users via Socket.IO.

Architecture:
- Runs as an APScheduler job alongside the RAG pipeline watcher
- Gets connected user IDs from handlers.sessions (passed in at init)
- Uses notificationService to query + mark emitted
- Emits 'notification' event to the correct socket room (sid)

Separation of concerns:
- Does NOT know about chat, LLM, or any other feature
- Only reads from sessions map (read-only reference)
- Only writes isPushSent=True on notificationService
"""
import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)


class NotificationPoller:
    """
    Polls MongoDB for pending notifications and emits them via Socket.IO.
    Instantiated once and stored as a singleton (see init/get below).
    """

    def __init__(self, sio, sessions: Dict[str, Dict[str, Any]]):
        """
        Args:
            sio:      The socketio.AsyncServer instance (from SocketServer.sio)
            sessions: Reference to SocketEventHandlers.sessions dict
                      { sid: { user_id, is_authenticated, ... } }
                      This is a live reference — always reflects current state.
        """
        self.sio = sio
        self.sessions = sessions  # live reference, never copied
        self._running = False

    # ------------------------------------------------------------------
    # Main poll cycle — called by APScheduler
    # ------------------------------------------------------------------

    async def poll(self):
        """
        One poll cycle:
        1. Collect authenticated user_ids from live sessions
        2. Ask notificationService which of those have pending notifications
        3. For each pending user, fetch their notifications
        4. Emit each one to the correct socket room
        5. Mark batch as push-sent
        """
        if self._running:
            logger.debug("[poller] Previous poll still running, skipping")
            return

        self._running = True
        try:
            from app.services.notificationService import get_notification_service
            svc = get_notification_service()

            # --- Step 1: build user_id → [sid] map from live sessions ----------
            # A user can have multiple tabs open (multiple sids)
            user_to_sids: Dict[str, list] = {}
            for sid, session in list(self.sessions.items()):
                if session.get("is_authenticated") and session.get("user_id"):
                    uid = session["user_id"]
                    user_to_sids.setdefault(uid, []).append(sid)

            if not user_to_sids:
                return  # nobody connected

            connected_user_ids = list(user_to_sids.keys())

            # --- Step 2: single aggregation — who has pending notifications? ---
            users_with_pending = await svc.get_connected_users_with_pending(
                connected_user_ids
            )

            if not users_with_pending:
                return

            # --- Step 3-5: per user, fetch → emit → mark sent -----------------
            for user_id in users_with_pending:
                sids = user_to_sids.get(user_id, [])
                if not sids:
                    continue

                notifications = await svc.get_unemitted_for_user(user_id)
                if not notifications:
                    continue

                emitted_ids = []
                for notification in notifications:
                    payload = self._serialize(notification)
                    # Emit to every tab the user has open
                    for sid in sids:
                        try:
                            await self.sio.emit("notification", payload, room=sid)
                            logger.info(
                                "[poller] Emitted '%s' to user %s (sid=%s)",
                                notification.get("type"), user_id, sid
                            )
                        except Exception as e:
                            logger.error(
                                "[poller] Failed to emit to sid %s: %s", sid, e
                            )
                    emitted_ids.append(notification["_id"])

                # Mark whole batch as push-sent in one DB call
                if emitted_ids:
                    await svc.mark_as_push_sent(emitted_ids)

        except Exception as e:
            logger.error("[poller] Unexpected error in poll cycle: %s", e, exc_info=True)
        finally:
            self._running = False

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _serialize(doc: dict) -> dict:
        """
        Return only the fields the frontend NotificationBell needs.
        Strips internal flags (isPushSent, isEmailSent) before sending.
        """
        return {
            "_id":       str(doc.get("_id", "")),
            "userId":    str(doc.get("userId", "")),
            "type":      doc.get("type", "system_update"),
            "priority":  doc.get("priority", "Medium"),
            "title":     doc.get("title", ""),
            "message":   doc.get("message", ""),
            "data":      doc.get("data"),
            "isRead":    doc.get("isRead", False),
            "actionUrl": doc.get("actionUrl"),
            "actionText":doc.get("actionText"),
            "createdAt": doc.get("createdAt").isoformat()
                         if isinstance(doc.get("createdAt"), datetime)
                         else doc.get("createdAt"),
        }


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_poller_instance = None


def init_notification_poller(sio, sessions: Dict[str, Dict[str, Any]]) -> NotificationPoller:
    """Called once at startup from main.py lifespan."""
    global _poller_instance
    _poller_instance = NotificationPoller(sio, sessions)
    logger.info("✅ NotificationPoller initialised")
    return _poller_instance


def get_notification_poller() -> NotificationPoller:
    if _poller_instance is None:
        raise RuntimeError(
            "NotificationPoller not initialised. "
            "Call init_notification_poller() at startup."
        )
    return _poller_instance