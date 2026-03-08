"""
Embedding Service
Uses Google gemini-embedding-001 via google-genai SDK.
Output: dim vectors.
"""
import asyncio
import logging
from typing import List

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:

    _client: genai.Client | None = None

    @classmethod
    def init(cls):
        if cls._client is None:
            if not settings.GEMINI_API_KEY:
                raise RuntimeError("GEMINI_API_KEY is not set in .env")
            cls._client = genai.Client(api_key=settings.GEMINI_API_KEY)
            logger.info(
                "✅ Google embedding ready — model=%s dim=%d",
                settings.EMBEDDING_MODEL,
                settings.EMBEDDING_DIMENSIONS,
            )

    @classmethod
    def _get_client(cls) -> genai.Client:
        if cls._client is None:
            raise RuntimeError("EmbeddingService not initialised. Call EmbeddingService.init() first.")
        return cls._client

    @classmethod
    async def embed_chunks(cls, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        client = cls._get_client()
        loop = asyncio.get_event_loop()
        all_embeddings: List[List[float]] = []

        BATCH_SIZE = 100
        for i in range(0, len(texts), BATCH_SIZE):
            batch = texts[i: i + BATCH_SIZE]

            response = await loop.run_in_executor(
                None,
                lambda b=batch: client.models.embed_content(
                    model=settings.EMBEDDING_MODEL,
                    contents=b,
                    config=types.EmbedContentConfig(
                        task_type="retrieval_document",
                    ),
                )
            )

            for emb in response.embeddings:
                all_embeddings.append(emb.values)

            logger.debug("Embedded batch %d-%d", i, i + len(batch))

        logger.info("Embedded %d chunks total", len(all_embeddings))
        return all_embeddings

    @classmethod
    async def embed_query(cls, query: str) -> List[float]:
        client = cls._get_client()
        loop = asyncio.get_event_loop()

        response = await loop.run_in_executor(
            None,
            lambda: client.models.embed_content(
                model=settings.EMBEDDING_MODEL,
                contents=query,
                config=types.EmbedContentConfig(
                    task_type="retrieval_query",
                ),
            )
        )

        return response.embeddings[0].values