import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print(f"""
    ================================================
    {settings.APP_NAME:-^48}
    
    Server: http://{settings.HOST}:{settings.PORT}
    Docs:   http://{settings.HOST}:{settings.PORT}/docs
    Health: http://{settings.HOST}:{settings.PORT}/api/v1/health
    ================================================
    """)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )