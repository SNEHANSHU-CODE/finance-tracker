"""
Socket.IO Server
Main WebSocket server handling real-time chat communication
"""
import socketio
import logging
from typing import Optional

from app.websocket.handlers import SocketEventHandlers

logger = logging.getLogger(__name__)


class SocketServer:
    """
    Socket.IO Server for real-time chat
    """
    
    def __init__(self, cors_origins: Optional[list] = None):
        # Create Socket.IO server with async mode
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins=cors_origins or ['*'],
            logger=True,
            engineio_logger=False,
            ping_timeout=60,
            ping_interval=25,
        )
        
        # Create event handlers
        self.handlers = SocketEventHandlers(self.sio)
        
        # Register event handlers
        self._register_handlers()
        
        logger.info("Socket.IO server initialized")
    
    def _register_handlers(self):
        """
        Register all socket event handlers
        """
        
        @self.sio.event
        async def connect(sid, environ):
            """Handle client connection"""
            return await self.handlers.handle_connect(sid, environ)
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            await self.handlers.handle_disconnect(sid)
        
        @self.sio.event
        async def authenticate(sid, data):
            """Handle authentication"""
            await self.handlers.handle_authenticate(sid, data)
        
        @self.sio.event
        async def send_message(sid, data):
            """Handle incoming message"""
            await self.handlers.handle_send_message(sid, data)
        
        @self.sio.event
        async def get_suggestions(sid, data):
            """Handle suggestions request"""
            await self.handlers.handle_get_suggestions(sid, data)
        
        @self.sio.event
        async def rate_message(sid, data):
            """Handle message rating"""
            await self.handlers.handle_rate_message(sid, data)
        
        @self.sio.event
        async def clear_chat(sid, data):
            """Handle clear chat request"""
            await self.handlers.handle_clear_chat(sid, data)
        
        @self.sio.event
        async def verify_auth(sid, data):
            """Verify authentication status"""
            await self.handlers.handle_verify_auth(sid, data)
    
    def get_asgi_app(self):
        """
        Get ASGI application for mounting in FastAPI
        """
        return socketio.ASGIApp(self.sio)
    
    def get_sio(self):
        """
        Get Socket.IO server instance
        """
        return self.sio


# Singleton instance
socket_server: Optional[SocketServer] = None


def init_socket_server(cors_origins: Optional[list] = None) -> SocketServer:
    """
    Initialize Socket.IO server
    """
    global socket_server
    
    if socket_server is None:
        socket_server = SocketServer(cors_origins=cors_origins)
        logger.info("Socket.IO server instance created")
    
    return socket_server


def get_socket_server() -> Optional[SocketServer]:
    """
    Get Socket.IO server instance
    """
    return socket_server