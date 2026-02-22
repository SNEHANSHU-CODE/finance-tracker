"""
WebSocket package
"""
from app.websocket.server import init_socket_server, get_socket_server

__all__ = ['init_socket_server', 'get_socket_server']