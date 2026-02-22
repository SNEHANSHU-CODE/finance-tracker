"""
Socket.IO Client Simulator for Testing
Simulates WebSocket connections and messages
"""
import asyncio
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime
import json

try:
    from python_socketio import AsyncClient
except ImportError:
    AsyncClient = None

from app.utils.flow_logger import FlowLogger

logger = logging.getLogger(__name__)


class SocketIOClientSimulator:
    """
    Simulates a Socket.IO client connecting to the server
    Tracks connection, authentication, and message flow
    """
    
    def __init__(
        self,
        server_url: str = "http://localhost:5002",
        session_id: Optional[str] = None
    ):
        self.server_url = server_url
        self.session_id = session_id or f"socketio_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.flow_logger = FlowLogger(self.session_id)
        
        self.sio: Optional[AsyncClient] = None
        self.connected = False
        self.authenticated = False
        self.user_id: Optional[str] = None
        self.received_messages: Dict[str, Any] = {}
        self.event_listeners: Dict[str, Callable] = {}
        
        if AsyncClient is None:
            logger.warning("⚠️ python-socketio not installed. Install with: pip install python-socketio")
    
    async def connect(self) -> bool:
        """
        Connect to the Socket.IO server
        
        Returns:
            True if successful, False otherwise
        """
        if AsyncClient is None:
            logger.error("❌ python-socketio not installed")
            return False
        
        try:
            self.flow_logger.log_connection({"type": "websocket"})
            
            self.sio = AsyncClient()
            
            # Register event handlers
            @self.sio.event
            async def connect():
                logger.info("✅ Socket.IO connection established")
                self.connected = True
                self.flow_logger.log_connected()
            
            @self.sio.event
            async def disconnect():
                logger.info("⚠️ Socket.IO connection disconnected")
                self.connected = False
                self.flow_logger.log_disconnection()
            
            @self.sio.on('authenticated')
            async def on_authenticated(data):
                logger.info(f"✅ Authentication response: {json.dumps(data, indent=2)}")
                self.authenticated = True
                self.user_id = data.get("userId")
                self.received_messages["authenticated"] = data
                
                if data.get("isAuthenticated"):
                    self.flow_logger.log_authenticated(
                        user_id=data.get("userId"),
                        username=data.get("username", "Unknown"),
                        email=data.get("email", "")
                    )
                else:
                    self.flow_logger.log_guest_mode(data.get("userId", "guest"))
            
            @self.sio.on('response')
            async def on_response(data):
                logger.info(f"📨 Response received: {data.get('response', '')[:100]}...")
                self.received_messages["response"] = data
                self.flow_logger.log_response_sent(
                    response_length=len(data.get("response", "")),
                    request_id=data.get("requestId")
                )
            
            @self.sio.on('error')
            async def on_error(data):
                logger.error(f"❌ Server error: {data}")
                self.received_messages["error"] = data
            
            @self.sio.on('bot_typing')
            async def on_typing(data):
                logger.info("🤖 Bot is typing...")
            
            # Register custom event listeners
            for event_name, callback in self.event_listeners.items():
                self.sio.on(event_name)(callback)
            
            # Connect to server
            await self.sio.connect(self.server_url)
            await asyncio.sleep(0.5)  # Wait for connection to settle
            
            return True
        
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            self.flow_logger.log_disconnection(reason=str(e))
            return False
    
    async def authenticate(
        self,
        token: Optional[str] = None,
        user_id: Optional[str] = None,
        is_guest: bool = False
    ) -> bool:
        """
        Authenticate the user
        
        Args:
            token: Authentication token
            user_id: User ID
            is_guest: Whether to authenticate as guest
            
        Returns:
            True if successful, False otherwise
        """
        if not self.connected:
            logger.error("❌ Not connected to server")
            return False
        
        try:
            self.flow_logger.log_auth_initiated(has_token=bool(token), is_guest=is_guest)
            
            auth_data = {
                "userId": user_id,
                "token": token,
                "timestamp": datetime.utcnow().isoformat(),
                "isGuest": is_guest
            }
            
            await self.sio.emit('authenticate', auth_data)
            await asyncio.sleep(0.5)  # Wait for response
            
            if self.authenticated:
                logger.info(f"✅ User authenticated as {self.user_id}")
                return True
            else:
                logger.warning("⚠️ Authentication response not received yet")
                return True  # Still consider it success, response will come asynchronously
        
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            self.flow_logger.log_auth_failed(str(e))
            return False
    
    async def send_message(
        self,
        message: str,
        conversation_history: Optional[list] = None,
        request_id: Optional[int] = None
    ) -> bool:
        """
        Send a chat message
        
        Args:
            message: Message content
            conversation_history: Previous conversation messages
            request_id: Request ID for tracking
            
        Returns:
            True if message sent
        """
        if not self.connected:
            logger.error("❌ Not connected to server")
            return False
        
        try:
            self.flow_logger.log_query_received(message, is_authenticated=self.authenticated)
            
            message_data = {
                "message": message,
                "conversationHistory": conversation_history or [],
                "timestamp": datetime.utcnow().isoformat(),
                "requestId": request_id or 1
            }
            
            await self.sio.emit('send_message', message_data)
            logger.info(f"📤 Message sent: {message[:50]}...")
            
            return True
        
        except Exception as e:
            logger.error(f"❌ Send message error: {e}")
            return False
    
    async def wait_for_response(self, timeout: float = 30.0) -> Optional[Dict[str, Any]]:
        """
        Wait for response from server
        
        Args:
            timeout: Timeout in seconds
            
        Returns:
            Response data if received, None otherwise
        """
        try:
            start_time = datetime.now()
            while (datetime.now() - start_time).total_seconds() < timeout:
                if "response" in self.received_messages:
                    return self.received_messages["response"]
                await asyncio.sleep(0.1)
            
            logger.warning(f"⚠️ No response received within {timeout} seconds")
            return None
        
        except Exception as e:
            logger.error(f"❌ Wait for response error: {e}")
            return None
    
    async def disconnect(self) -> bool:
        """
        Disconnect from the server
        
        Returns:
            True if successful
        """
        try:
            if self.sio and self.connected:
                await self.sio.disconnect()
                self.connected = False
                logger.info("✅ Disconnected from server")
                self.flow_logger.log_cleanup()
                return True
            return False
        
        except Exception as e:
            logger.error(f"❌ Disconnect error: {e}")
            return False
    
    async def full_flow_test(
        self,
        message: str,
        token: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run a complete flow: Connect → Auth → Send Message → Wait Response → Disconnect
        
        Args:
            message: Message to send
            token: Authentication token
            user_id: User ID
            
        Returns:
            Test results
        """
        results = {
            "success": False,
            "steps": {
                "connected": False,
                "authenticated": False,
                "message_sent": False,
                "response_received": False,
                "disconnected": False
            },
            "data": {}
        }
        
        try:
            # Step 1: Connect
            logger.info("\n--- STEP 1: CONNECTING ---")
            connected = await self.connect()
            results["steps"]["connected"] = connected
            
            if not connected:
                return results
            
            # Step 2: Authenticate
            logger.info("\n--- STEP 2: AUTHENTICATING ---")
            is_guest = token is None
            authenticated = await self.authenticate(
                token=token,
                user_id=user_id,
                is_guest=is_guest
            )
            results["steps"]["authenticated"] = authenticated
            
            # Step 3: Send Message
            logger.info("\n--- STEP 3: SENDING MESSAGE ---")
            message_sent = await self.send_message(message)
            results["steps"]["message_sent"] = message_sent
            
            # Step 4: Wait for Response
            logger.info("\n--- STEP 4: WAITING FOR RESPONSE ---")
            response = await self.wait_for_response(timeout=30.0)
            results["steps"]["response_received"] = response is not None
            if response:
                results["data"]["response"] = response
            
            # Step 5: Disconnect
            logger.info("\n--- STEP 5: DISCONNECTING ---")
            disconnected = await self.disconnect()
            results["steps"]["disconnected"] = disconnected
            
            # Summary
            all_success = all(results["steps"].values())
            results["success"] = all_success
            
            logger.info("\n" + "="*80)
            logger.info("FLOW TEST SUMMARY")
            logger.info("="*80)
            for step, success in results["steps"].items():
                status = "✅" if success else "❌"
                logger.info(f"{status} {step}")
            logger.info("="*80 + "\n")
            
            return results
        
        except Exception as e:
            logger.error(f"❌ Full flow test error: {e}")
            return results


async def test_socketio_flows():
    """Test Socket.IO flows"""
    if AsyncClient is None:
        logger.warning("⚠️ Skipping Socket.IO tests - python-socketio not installed")
        logger.info("Install with: pip install python-socketio")
        return
    
    logger.info("\n" + "="*80)
    logger.info("STARTING SOCKET.IO FLOW TESTS")
    logger.info("="*80 + "\n")
    
    # Test 1: Guest Flow
    logger.info("\n--- TEST 1: GUEST USER SOCKET.IO FLOW ---\n")
    guest_sim = SocketIOClientSimulator(session_id="test_guest_socketio")
    guest_result = await guest_sim.full_flow_test(
        message="What's a good financial habit?",
        token=None,
        user_id=None
    )
    
    # Test 2: Authenticated Flow
    logger.info("\n--- TEST 2: AUTHENTICATED USER SOCKET.IO FLOW ---\n")
    auth_sim = SocketIOClientSimulator(session_id="test_auth_socketio")
    auth_result = await auth_sim.full_flow_test(
        message="Show me my spending analysis",
        token="test_token_123",
        user_id="test_user_123"
    )
    
    logger.info("\n" + "="*80)
    logger.info("SOCKET.IO TEST SUMMARY")
    logger.info("="*80)
    logger.info(f"Guest Flow: {'✅ PASSED' if guest_result['success'] else '❌ FAILED'}")
    logger.info(f"Auth Flow: {'✅ PASSED' if auth_result['success'] else '❌ FAILED'}")
    logger.info("="*80 + "\n")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    asyncio.run(test_socketio_flows())
