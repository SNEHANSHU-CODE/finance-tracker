from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import warnings

from app.core.config import settings
from app.core.database import Database
from app.core.logging import setup_logging
from app.core.chat_routes import router as chat_router
from app.websocket import init_socket_server
from app.ai.orchestrator import get_orchestrator
from app.services.userService import init_user_service

# Suppress Pydantic V1 warning for Python 3.14+
warnings.filterwarnings('ignore', category=UserWarning, message='.*Pydantic V1 functionality.*')

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Security check: Warn about default SECRET_KEY
if settings.SECRET_KEY == "your-secret-key-change-in-production":
    logger.warning("⚠️  WARNING: Using default SECRET_KEY! Change this in production by setting SECRET_KEY in .env file")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Server will be available at: http://{settings.HOST}:{settings.PORT}")
    logger.info(f"WebSocket endpoint: ws://{settings.HOST}:{settings.PORT}/socket.io/")
    
    await Database.connect_db()
    logger.info("✅ Database connected")
    
    # Initialize UserService
    try:
        db = Database.get_db()
        init_user_service(db)
        logger.info("✅ UserService initialized")
    except Exception as e:
        logger.error(f"⚠️ UserService initialization failed: {e}")
    
    # Initialize AI Orchestrator
    try:
        db = Database.get_db()
        orchestrator = await get_orchestrator(db)
        logger.info("✅ AI Orchestrator initialized")
    except Exception as e:
        logger.error(f"⚠️ AI Orchestrator initialization failed: {e}")
        logger.info("Chat functionality may be limited")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await Database.close_db()
    logger.info("Shutdown complete")


# Parse CORS origins
cors_origins_list = ["*"] if settings.CORS_ORIGINS == "*" else settings.CORS_ORIGINS.split(",")

# Initialize Socket.IO server BEFORE creating FastAPI app
socket_server = init_socket_server(cors_origins=cors_origins_list)
logger.info("✅ Socket.IO server initialized")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered financial chat server with MongoDB integration and Socket.IO",
    lifespan=lifespan,
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO application
# This allows Socket.IO to handle WebSocket connections at /socket.io
if socket_server:
    app.mount("/socket.io", socket_server.get_asgi_app())
    logger.info("✅ Socket.IO mounted at /socket.io")
else:
    logger.error("❌ Failed to initialize Socket.IO server!")

# Include chat routes
app.include_router(chat_router)
logger.info("✅ Chat routes registered at /api/chat")


# Health check endpoints
@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "websocket": f"ws://{settings.HOST}:{settings.PORT}/socket.io/",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected" if Database.client else "disconnected",
        "websocket": "initialized" if socket_server else "not initialized",
        "port": settings.PORT
    }

#Keep my server alive
@app.get("/api/ping")
def ping():
    return "pong"


# This is only used when running directly: python app/main.py
# You're using run.py instead, which is fine
if __name__ == "__main__":
    import uvicorn
    logger.info(f"🚀 Starting server on {settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )