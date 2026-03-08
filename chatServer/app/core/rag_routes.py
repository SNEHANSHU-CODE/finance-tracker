"""
RAG API Routes
Exposes:
  GET  /api/rag/vaults  — list user's processed vaults (for toggle)
  POST /api/rag/query   — direct REST RAG query (optional, websocket is primary)
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.database import Database
from app.ai.llm.ragQueryService import RAGQueryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.get("/vaults")
async def get_processed_vaults(user_id: str):
    """
    Return list of vault documents that have embeddings ready.
    Called by VaultRAGToggle component on mount.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    try:
        vaults = await RAGQueryService.get_user_processed_vaults(user_id)
        return {"vaults": vaults, "count": len(vaults)}
    except Exception as e:
        logger.error("Error fetching processed vaults: %s", e)
        raise HTTPException(status_code=500, detail=str(e))