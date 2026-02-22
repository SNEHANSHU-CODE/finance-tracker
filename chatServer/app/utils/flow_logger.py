"""
Flow Tracing Utilities for Chat System
Provides detailed logging throughout the entire chat flow
"""
import logging
import json
from datetime import datetime
from typing import Any, Dict, Optional
from enum import Enum


class FlowEvent(Enum):
    """Events tracked in the chat flow"""
    # Connection
    CLIENT_CONNECTED = "CLIENT_CONNECTED"
    CONNECTION_ESTABLISHED = "CONNECTION_ESTABLISHED"
    
    # Authentication
    AUTH_INITIATED = "AUTH_INITIATED"
    AUTH_TOKEN_VERIFIED = "AUTH_TOKEN_VERIFIED"
    USER_AUTHENTICATED = "USER_AUTHENTICATED"
    GUEST_MODE_ACTIVATED = "GUEST_MODE_ACTIVATED"
    AUTH_FAILED = "AUTH_FAILED"
    
    # Query Processing
    QUERY_RECEIVED = "QUERY_RECEIVED"
    INTENT_CLASSIFIED = "INTENT_CLASSIFIED"
    INTENT_CLASSIFICATION_FAILED = "INTENT_CLASSIFICATION_FAILED"
    
    # Data Fetching
    DATA_FETCH_INITIATED = "DATA_FETCH_INITIATED"
    DATA_FETCH_SUCCESSFUL = "DATA_FETCH_SUCCESSFUL"
    DATA_FETCH_FAILED = "DATA_FETCH_FAILED"
    
    # LLM Processing
    LLM_CALL_INITIATED = "LLM_CALL_INITIATED"
    LLM_RESPONSE_RECEIVED = "LLM_RESPONSE_RECEIVED"
    LLM_CALL_FAILED = "LLM_CALL_FAILED"
    
    # Response
    RESPONSE_GENERATED = "RESPONSE_GENERATED"
    RESPONSE_SENT = "RESPONSE_SENT"
    
    # Disconnection
    CLIENT_DISCONNECTED = "CLIENT_DISCONNECTED"
    SESSION_CLEANUP = "SESSION_CLEANUP"


class FlowLogger:
    """
    Comprehensive logger for chat flow tracing
    Logs all important events with timestamps and context
    """
    
    def __init__(self, session_id: str, user_id: Optional[str] = None):
        self.session_id = session_id
        self.user_id = user_id
        self.logger = logging.getLogger(f"flow.{session_id}")
        self.events: Dict[str, Dict[str, Any]] = {}
        self.start_time = datetime.now()
        
        # Create file handler for this session
        self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup logging handlers for this session"""
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.DEBUG)
        
        # Formatter with colored output
        formatter = logging.Formatter(
            f'[%(asctime)s] [SID: {self.session_id[:8]}...] [%(levelname)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(formatter)
        
        if not self.logger.handlers:
            self.logger.addHandler(console_handler)
            self.logger.setLevel(logging.DEBUG)
    
    def log_event(
        self,
        event: FlowEvent,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        level: str = "INFO"
    ):
        """
        Log a flow event
        
        Args:
            event: FlowEvent enum
            message: Human readable message
            data: Additional context data
            level: Log level (DEBUG, INFO, WARNING, ERROR)
        """
        timestamp = datetime.now().isoformat()
        elapsed = (datetime.now() - self.start_time).total_seconds()
        
        # Store event
        event_key = f"{event.value}_{elapsed:.2f}"
        self.events[event_key] = {
            "event": event.value,
            "message": message,
            "timestamp": timestamp,
            "elapsed_seconds": elapsed,
            "data": data or {},
            "level": level
        }
        
        # Log to file/console
        log_method = getattr(self.logger, level.lower())
        
        # Format message with event
        full_message = f"[{event.value}] {message}"
        
        if data:
            full_message += f" | {json.dumps(data, default=str)}"
        
        log_method(full_message)
    
    def log_connection(self, client_info: Dict[str, Any]):
        """Log client connection"""
        self.log_event(
            FlowEvent.CLIENT_CONNECTED,
            "Client connecting to chat server",
            {"client_info": client_info}
        )
    
    def log_connected(self):
        """Log successful connection"""
        self.log_event(
            FlowEvent.CONNECTION_ESTABLISHED,
            "✅ Connection established successfully"
        )
    
    def log_auth_initiated(self, has_token: bool, is_guest: bool):
        """Log authentication initiation"""
        auth_type = "token-based" if has_token else ("guest" if is_guest else "unknown")
        self.log_event(
            FlowEvent.AUTH_INITIATED,
            f"🔐 Authentication initiated ({auth_type})",
            {"has_token": has_token, "is_guest": is_guest}
        )
    
    def log_auth_verified(self, user_id: str, username: str, auth_provider: str):
        """Log token verification"""
        self.user_id = user_id
        self.log_event(
            FlowEvent.AUTH_TOKEN_VERIFIED,
            f"🔑 Token verified for {username}",
            {"user_id": user_id, "username": username, "provider": auth_provider}
        )
    
    def log_authenticated(self, user_id: str, username: str, email: str):
        """Log successful authentication"""
        self.log_event(
            FlowEvent.USER_AUTHENTICATED,
            f"✅ User authenticated: {username} ({email})",
            {
                "user_id": user_id,
                "username": username,
                "email": email,
                "auth_type": "authenticated"
            }
        )
    
    def log_guest_mode(self, guest_id: str):
        """Log guest mode activation"""
        self.log_event(
            FlowEvent.GUEST_MODE_ACTIVATED,
            f"👤 Guest mode activated (ID: {guest_id})",
            {"guest_id": guest_id, "auth_type": "guest"}
        )
    
    def log_auth_failed(self, reason: str):
        """Log authentication failure"""
        self.log_event(
            FlowEvent.AUTH_FAILED,
            f"❌ Authentication failed: {reason}",
            {"reason": reason},
            level="WARNING"
        )
    
    def log_query_received(self, query: str, is_authenticated: bool):
        """Log query receipt"""
        user_type = "AUTH" if is_authenticated else "GUEST"
        self.log_event(
            FlowEvent.QUERY_RECEIVED,
            f"📨 Query received from {user_type} user",
            {
                "query": query[:100],
                "query_length": len(query),
                "is_authenticated": is_authenticated
            }
        )
    
    def log_intent_classified(self, primary_intent: str, confidence: float, intents: Dict[str, Any]):
        """Log intent classification"""
        self.log_event(
            FlowEvent.INTENT_CLASSIFIED,
            f"🎯 Intent classified: {primary_intent} (confidence: {confidence:.2%})",
            {
                "primary_intent": primary_intent,
                "confidence": confidence,
                "intents": intents
            }
        )
    
    def log_intent_classification_failed(self, error: str):
        """Log intent classification failure"""
        self.log_event(
            FlowEvent.INTENT_CLASSIFICATION_FAILED,
            f"❌ Intent classification failed: {error}",
            {"error": error},
            level="ERROR"
        )
    
    def log_data_fetch_initiated(self, intents: Dict[str, Any], time_range: Optional[str] = None):
        """Log data fetching initiation"""
        self.log_event(
            FlowEvent.DATA_FETCH_INITIATED,
            f"🔍 Data fetching initiated for intents: {list(intents.keys())}",
            {"intents": intents, "time_range": time_range}
        )
    
    def log_data_found(self, intent: str, count: int, summary: Optional[Dict[str, Any]] = None):
        """Log successful data fetch"""
        self.log_event(
            FlowEvent.DATA_FETCH_SUCCESSFUL,
            f"✅ Data fetched for {intent}: {count} items",
            {"intent": intent, "count": count, "summary": summary}
        )
    
    def log_data_fetch_failed(self, intent: str, error: str):
        """Log data fetch failure"""
        self.log_event(
            FlowEvent.DATA_FETCH_FAILED,
            f"❌ Data fetch failed for {intent}: {error}",
            {"intent": intent, "error": error},
            level="ERROR"
        )
    
    def log_llm_call_initiated(self, provider: str, model: str):
        """Log LLM call initiation"""
        self.log_event(
            FlowEvent.LLM_CALL_INITIATED,
            f"🤖 LLM call initiated ({provider}:{model})",
            {"provider": provider, "model": model}
        )
    
    def log_llm_response_received(self, provider: str, response_length: int, tokens_used: Optional[int] = None):
        """Log LLM response receipt"""
        self.log_event(
            FlowEvent.LLM_RESPONSE_RECEIVED,
            f"✅ LLM response received ({response_length} chars)",
            {
                "provider": provider,
                "response_length": response_length,
                "tokens_used": tokens_used
            }
        )
    
    def log_llm_call_failed(self, provider: str, error: str):
        """Log LLM call failure"""
        self.log_event(
            FlowEvent.LLM_CALL_FAILED,
            f"❌ LLM call failed ({provider}): {error}",
            {"provider": provider, "error": error},
            level="ERROR"
        )
    
    def log_response_generated(self, response_type: str, response_preview: str):
        """Log response generation"""
        self.log_event(
            FlowEvent.RESPONSE_GENERATED,
            f"📝 Response generated ({response_type})",
            {
                "response_type": response_type,
                "preview": response_preview[:100],
                "length": len(response_preview)
            }
        )
    
    def log_response_sent(self, response_length: int, request_id: Optional[str] = None):
        """Log response being sent"""
        self.log_event(
            FlowEvent.RESPONSE_SENT,
            f"📤 Response sent to client ({response_length} chars)",
            {"response_length": response_length, "request_id": request_id}
        )
    
    def log_disconnection(self, reason: str = "unknown"):
        """Log client disconnection"""
        self.log_event(
            FlowEvent.CLIENT_DISCONNECTED,
            f"⚠️  Client disconnected ({reason})",
            {"reason": reason}
        )
    
    def log_cleanup(self):
        """Log session cleanup"""
        total_time = (datetime.now() - self.start_time).total_seconds()
        self.log_event(
            FlowEvent.SESSION_CLEANUP,
            f"🧹 Session cleaned up (duration: {total_time:.2f}s)",
            {"total_duration_seconds": total_time, "events_count": len(self.events)}
        )
    
    def get_summary(self) -> Dict[str, Any]:
        """Get session summary"""
        total_time = (datetime.now() - self.start_time).total_seconds()
        
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "start_time": self.start_time.isoformat(),
            "end_time": datetime.now().isoformat(),
            "total_duration_seconds": total_time,
            "total_events": len(self.events),
            "events": self.events
        }
    
    def print_summary(self):
        """Print session summary"""
        summary = self.get_summary()
        self.logger.info("\n" + "="*80)
        self.logger.info("SESSION SUMMARY")
        self.logger.info("="*80)
        self.logger.info(f"Session ID: {summary['session_id']}")
        self.logger.info(f"User ID: {summary['user_id']}")
        self.logger.info(f"Duration: {summary['total_duration_seconds']:.2f}s")
        self.logger.info(f"Total Events: {summary['total_events']}")
        self.logger.info("="*80 + "\n")
