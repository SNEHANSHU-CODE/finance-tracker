"""
WebSocket Socket.IO Event Handlers (Simplified)
Responsibilities:
1. Handle client connections/disconnections
2. JWT authentication
3. Dispatch user queries to LLM response handler
4. Send response-related messages only (connection/network status)

Does NOT handle:
- Business logic responses (handled by response_handler.py)
- User data responses
"""
import logging
from typing import Dict, Any
from datetime import datetime

from app.core.jwt import authenticate_user, get_auth_method_from_user
from app.services.userService import get_user_service
from app.websocket.logger import WebSocketLogger
from app.websocket.response_handler import MessageResponseHandler

logger = logging.getLogger(__name__)


class SocketEventHandlers:
    """
    Simplified Socket.IO event handlers
    - Only handles connection/network concerns
    - Delegates response generation to response_handler module
    """
    
    def __init__(self, sio):
        self.sio = sio
        # Store session data: sid -> {user_id, is_authenticated, username, conversation_history}
        self.sessions: Dict[str, Dict[str, Any]] = {}
    
    def get_session(self, sid: str) -> Dict[str, Any]:
        """Get or create session data for a socket"""
        if sid not in self.sessions:
            self.sessions[sid] = {
                "user_id": None,
                "is_authenticated": False,
                "username": None,
                "connected_at": datetime.utcnow().isoformat(),
            }
        return self.sessions[sid]
    
    def cleanup_session(self, sid: str):
        """Remove session data when socket disconnects"""
        if sid in self.sessions:
            del self.sessions[sid]
    
    # ===== CONNECTION HANDLERS =====
    
    async def handle_connect(self, sid: str, environ: dict):
        """
        Handle new socket connection
        Accepts all connections (authenticated and guest)
        Auto-authenticates if token provided
        
        RESPONSE: Only connection confirmation
        """
        logger.info(f"🔌 Client connecting: {sid}")
        
        # Initialize session (as guest by default)
        session = self.get_session(sid)
        
        # Try to auto-authenticate from token in query or headers
        try:
            query_string = environ.get('QUERY_STRING', '')
            headers = environ.get('HTTP_AUTHORIZATION', '')
            
            # Extract token from query string or Authorization header
            token = None
            if 'token=' in query_string:
                import urllib.parse
                query_params = urllib.parse.parse_qs(query_string)
                token = query_params.get('token', [None])[0]
            
            if not token and headers and headers.startswith('Bearer '):
                token = headers[7:]
            
            # Try to authenticate with token
            if token:
                user_service = get_user_service()
                is_authenticated, user_data = await authenticate_user(
                    token=token,
                    provided_user_id=None,
                    user_service=user_service
                )
                
                if is_authenticated:
                    session["is_authenticated"] = True
                    session["user_id"] = user_data["user_id"]
                    session["username"] = user_data["username"]
                    WebSocketLogger.log_user_connected(user_data["username"], True)
                    logger.info(f"✅ Auto-authenticated: {sid} → {user_data['username']}")
                else:
                    logger.warning(f"⚠️ Token validation failed for {sid}, treating as guest")
                    WebSocketLogger.log_user_connected("guest", False)
            else:
                WebSocketLogger.log_user_connected("guest", False)
                
        except Exception as e:
            logger.warning(f"⚠️ Error during connect-time auth: {e}")
            WebSocketLogger.log_user_connected("guest", False)
        
        return True  # Accept connection
    
    async def handle_disconnect(self, sid: str):
        """
        Handle socket disconnection
        Logs disconnection with user type
        """
        session = self.get_session(sid)
        is_authenticated = session.get("is_authenticated", False)
        username = session.get("username", "unknown")
        
        WebSocketLogger.log_user_disconnected(username, is_authenticated)
        self.cleanup_session(sid)
    
    # ===== AUTHENTICATION HANDLER =====
    
    async def handle_authenticate(self, sid: str, data: dict):
        """
        Handle authentication request
        
        Client sends: {userId: str|null, token: str|null}
        
        RESPONSE: Only {isAuthenticated: bool, username: str}
        """
        token = data.get("token")
        provided_user_id = data.get("userId")
        
        user_service = get_user_service()
        
        # Authenticate user
        is_authenticated, user_data = await authenticate_user(
            token=token,
            provided_user_id=provided_user_id,
            user_service=user_service
        )
        
        # Update session
        session = self.get_session(sid)
        session["is_authenticated"] = is_authenticated
        session["user_id"] = user_data["user_id"]
        session["username"] = user_data.get("username", "guest")
        
        # Log authentication
        if is_authenticated:
            username = user_data["username"]
            WebSocketLogger.log_user_connected(username, True)
            logger.info(f"✅ Authenticated: {sid} → {username}")
        else:
            WebSocketLogger.log_user_connected("guest", False)
            logger.info(f"👤 Guest: {sid}")
        
        # Send ONLY connection status (not user data)
        response = {
            "isAuthenticated": is_authenticated,
            "username": session["username"],
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        await self.sio.emit('authenticated', response, room=sid)
    
    # ===== MESSAGE HANDLER =====
    
    async def handle_send_message(self, sid: str, data: dict):
        """
        Handle incoming message
        Dispatches to response handler for LLM processing
        
        RESPONSE: Only typing status and bot response
        """
        try:
            message = data.get("message", "").strip()
            conversation_history = data.get("conversationHistory", [])
            request_id = data.get("requestId")
            vault_id = data.get("vault_id") or None  # RAG mode if set
            
            # Validate message
            if not message:
                await self.sio.emit('error', {
                    "message": "Empty message",
                    "code": "INVALID_MESSAGE",
                    "timestamp": datetime.utcnow().isoformat(),
                }, room=sid)
                return
            
            # Get session
            session = self.get_session(sid)
            is_authenticated = session.get("is_authenticated", False)
            user_id = session.get("user_id")
            username = session.get("username", "guest")
            
            # Send typing indicator
            await self.sio.emit('bot_typing', {
                "isTyping": True,
                "timestamp": datetime.utcnow().isoformat(),
            }, room=sid)
            
            # Get response from handler
            try:
                if is_authenticated and vault_id:
                    # RAG mode — user asking about a specific PDF
                    response = await MessageResponseHandler.handle_rag_message(
                        user_id=user_id,
                        username=username,
                        message=message,
                        vault_id=vault_id,
                    )
                elif is_authenticated:
                    response = await MessageResponseHandler.handle_authenticated_message(
                        user_id=user_id,
                        username=username,
                        message=message,
                        conversation_history=conversation_history
                    )
                else:
                    response = await MessageResponseHandler.handle_guest_message(message)
                
                # Stop typing
                await self.sio.emit('bot_typing', {
                    "isTyping": False,
                    "timestamp": datetime.utcnow().isoformat(),
                }, room=sid)
                
                # Send response
                response_data = {
                    "messageId": f"msg-{datetime.utcnow().timestamp()}-{request_id}",
                    "message": response["text"],
                    "provider": response.get("provider", "gemini"),
                    "metadata": response.get("metadata", {}),
                    "timestamp": datetime.utcnow().isoformat(),
                }
                
                await self.sio.emit('bot_response', response_data, room=sid)
                
                # Chat history is persisted in MongoDB by ChatMemory — no RAM storage needed
                
            except Exception as e:
                logger.error(f"❌ Error generating response: {e}", exc_info=True)
                
                await self.sio.emit('bot_typing', {"isTyping": False}, room=sid)
                await self.sio.emit('bot_response', {
                    "messageId": f"error-{datetime.utcnow().timestamp()}",
                    "message": "I'm having trouble processing your request. Please try again.",
                    "provider": "fallback",
                    "metadata": {"error": True, "response_type": "error"},
                    "timestamp": datetime.utcnow().isoformat(),
                }, room=sid)
        
        except Exception as e:
            logger.error(f"❌ Error handling message: {e}", exc_info=True)
            await self.sio.emit('error', {
                "message": "Failed to process message",
                "code": "MESSAGE_ERROR",
                "timestamp": datetime.utcnow().isoformat(),
            }, room=sid)
    
    # ===== UTILITY HANDLERS =====

    
    async def handle_get_chat_history(self, sid: str, data: dict = None):
        """
        Emit last 50 messages from DB to the requesting client.
        Frontend calls this right after authentication to restore chat on page load.
        """
        try:
            session = self.get_session(sid)
            user_id = session.get("user_id")

            if not user_id or not session.get("is_authenticated"):
                await self.sio.emit("chat_history", {
                    "messages": [],
                    "timestamp": datetime.utcnow().isoformat(),
                }, room=sid)
                return

            from app.ai.orchestrator import get_orchestrator
            from app.core.database import Database
            db = Database.get_db()
            orchestrator = await get_orchestrator(db)
            messages = await orchestrator.get_chat_history(user_id)

            await self.sio.emit("chat_history", {
                "messages": messages,
                "timestamp": datetime.utcnow().isoformat(),
            }, room=sid)

            logger.info(f"📜 Sent {len(messages)} history messages to user {user_id}")

        except Exception as e:
            logger.error(f"❌ Error fetching chat history: {e}", exc_info=True)
            await self.sio.emit("chat_history", {
                "messages": [],
                "error": "Failed to load history",
                "timestamp": datetime.utcnow().isoformat(),
            }, room=sid)

    async def handle_get_suggestions(self, sid: str, data: dict):
        """Handle request for smart suggestions"""
        try:
            session = self.get_session(sid)
            is_authenticated = session.get("is_authenticated", False)
            user_data = session.get("user_data", {})
            
            logger.info(f"💡 Suggestions requested ({'AUTH' if is_authenticated else 'GUEST'})")
            
            # Different suggestions for auth vs guest
            if is_authenticated:
                suggestions = [
                    "Review your portfolio performance",
                    "Update your investment goals",
                    "Check your retirement savings progress",
                    "Analyze your spending patterns"
                ]
            else:
                suggestions = [
                    "How can I create a monthly budget?",
                    "What's the best way to save for retirement?",
                    "Should I invest in stocks or bonds?",
                    "How do I build an emergency fund?"
                ]
            
            await self.sio.emit('suggestions_update', {
                "suggestions": suggestions,
                "timestamp": datetime.utcnow().isoformat(),
            }, room=sid)
            
        except Exception as e:
            logger.error(f"❌ Error generating suggestions: {e}", exc_info=True)
    
    async def handle_rate_message(self, sid: str, data: dict):
        """Handle message rating"""
        try:
            message_id = data.get("messageId")
            rating = data.get("rating")
            
            session = self.get_session(sid)
            user_id = session.get("user_data", {}).get("user_id")
            
            logger.info(f"⭐ Rating from {user_id}: {message_id} → {rating}")
            
            # TODO: Store rating in database
            
            await self.sio.emit('rating_received', {
                "messageId": message_id,
                "rating": rating,
                "success": True,
                "timestamp": datetime.utcnow().isoformat(),
            }, room=sid)
        
        except Exception as e:
            logger.error(f"❌ Error handling rating: {e}", exc_info=True)
    
    async def handle_clear_chat(self, sid: str, data: dict):
        """Handle clear chat history request — clears DB messages array"""
        try:
            session = self.get_session(sid)
            user_id = session.get("user_id")

            if user_id:
                from app.ai.orchestrator import get_orchestrator
                from app.core.database import Database
                db = Database.get_db()
                orchestrator = await get_orchestrator(db)
                await orchestrator.clear_chat_history(user_id)
                logger.info(f"🗑️ Chat history cleared in DB for user {user_id}")

            await self.sio.emit('chat_cleared', {
                "success": True,
                "timestamp": datetime.utcnow().isoformat(),
            }, room=sid)

        except Exception as e:
            logger.error(f"❌ Error clearing chat: {e}", exc_info=True)
    
    async def handle_verify_auth(self, sid: str, data: dict = None):
        """
        Verify current authentication status
        RESPONSE: Only {isAuthenticated, username}
        """
        try:
            session = self.get_session(sid)
            is_authenticated = session.get("is_authenticated", False)
            username = session.get("username", "guest")
            
            response = {
                "isAuthenticated": is_authenticated,
                "username": username,
                "timestamp": datetime.utcnow().isoformat(),
            }
            
            logger.info(f"🔍 Auth verification: {username} (authenticated={is_authenticated})")
            
            await self.sio.emit('auth_status', response, room=sid)
        
        except Exception as e:
            logger.error(f"❌ Error verifying auth: {e}", exc_info=True)
            await self.sio.emit('auth_status', {
                "isAuthenticated": False,
                "username": "guest",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }, room=sid)