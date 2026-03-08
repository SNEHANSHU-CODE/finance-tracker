"""
RAG Debug Script
Run this from your project root:
    python debug_rag.py

It will tell you EXACTLY why vector search returns 0 results.
"""
import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

USER_ID  = "69a566199b89c08f2500003d"
VAULT_ID = "69a9c01a8f077f6546f31701"

async def main():
    from app.core.database import Database
    from app.core.config import settings
    from app.ai.llm.embeddingService import EmbeddingService

    await Database.connect_db()
    col = Database.embeddings_collection()

    print("\n======== RAG DEBUG ========\n")

    # 1. Total docs
    total = await col.count_documents({})
    print(f"[1] Total docs in '{settings.EMBEDDINGS_COLLECTION}': {total}")
    if total == 0:
        print("    ❌ Collection is EMPTY — pipeline never ran or inserted to wrong collection")
        return

    # 2. Sample doc — check field types
    doc = await col.find_one({})
    print(f"\n[2] Sample doc field types:")
    print(f"    userId  = {repr(doc.get('userId'))}  → type: {type(doc.get('userId')).__name__}")
    print(f"    vaultId = {repr(doc.get('vaultId'))} → type: {type(doc.get('vaultId')).__name__}")
    print(f"    embedding length = {len(doc.get('embedding', []))}")

    # 3. Match by userId string
    by_str = await col.count_documents({"userId": USER_ID})
    print(f"\n[3] Docs matching userId as STRING '{USER_ID}': {by_str}")

    # 4. Match by vaultId string
    by_vault = await col.count_documents({"vaultId": VAULT_ID})
    print(f"[4] Docs matching vaultId as STRING '{VAULT_ID}': {by_vault}")

    # 5. Match both
    both = await col.count_documents({"userId": USER_ID, "vaultId": VAULT_ID})
    print(f"[5] Docs matching BOTH userId+vaultId as strings: {both}")

    if both == 0:
        print("\n    ❌ NO MATCH — check if userId/vaultId stored as ObjectId vs string")
        # Try ObjectId match
        from bson import ObjectId
        try:
            by_oid = await col.count_documents({"userId": ObjectId(USER_ID)})
            print(f"    Trying ObjectId match for userId: {by_oid} docs found")
            if by_oid > 0:
                print("    ⚠️  userId is stored as ObjectId in DB — fix EmbeddingInsert to str()")
        except Exception as e:
            print(f"    ObjectId match failed: {e}")
        return

    # 6. Test actual vector search pipeline
    print(f"\n[6] Testing $vectorSearch pipeline...")
    EmbeddingService.init()
    query_vector = await EmbeddingService.embed_query("test query summarize document")
    print(f"    Query vector length: {len(query_vector)}")

    pipeline = [
        {
            "$vectorSearch": {
                "index": settings.VECTOR_INDEX_NAME,
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 100,
                "limit": 100,
            }
        },
        {"$match": {"userId": USER_ID, "vaultId": VAULT_ID}},
        {"$limit": 5},
        {"$project": {"text": 1, "score": {"$meta": "vectorSearchScore"}, "userId": 1, "vaultId": 1}},
    ]

    try:
        results = []
        async for r in col.aggregate(pipeline):
            results.append(r)
        print(f"    $vectorSearch returned: {len(results)} results")
        if results:
            print(f"    ✅ First result score: {results[0].get('score')}")
            print(f"    ✅ Text preview: {results[0].get('text', '')[:100]}")
        else:
            print("    ❌ Still 0 results — Atlas vector index may not exist or wrong index name")
            print(f"    Index name used: '{settings.VECTOR_INDEX_NAME}'")
            print("    → Go to Atlas UI → Search Indexes and verify the index name exactly")
    except Exception as e:
        print(f"    ❌ $vectorSearch threw exception: {e}")
        print("    → This usually means the vector index does NOT exist in Atlas UI")

    # 7. Fallback — plain text search to confirm data is readable
    print(f"\n[7] Fallback plain find (no vector search):")
    plain = await col.find(
        {"userId": USER_ID, "vaultId": VAULT_ID},
        {"text": 1, "chunkIndex": 1}
    ).limit(3).to_list(None)
    print(f"    Plain find returned {len(plain)} docs")
    for p in plain:
        print(f"    chunk {p.get('chunkIndex')}: {p.get('text','')[:80]}...")

    print("\n======== END DEBUG ========\n")

asyncio.run(main())