"""
Diagnostic script to find where data is stored across all databases
Run: python -m app.utils.diagnose
"""

import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from app.core.config import settings


async def diagnose():
    """Scan all databases and find where data is"""
    
    print("\n" + "="*80)
    print("DATABASE DIAGNOSTIC SCAN")
    print("="*80 + "\n")
    
    print(f"🔗 Connecting to: {settings.MONGO_URI}\n")
    
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI)
        
        # Get all databases
        database_names = await client.list_database_names()
        print(f"📊 Databases found: {database_names}\n")
        
        print("="*80)
        print("SCANNING ALL DATABASES FOR DATA")
        print("="*80 + "\n")
        
        for db_name in database_names:
            if db_name in ['admin', 'config', 'local']:
                print(f"⏭️  Skipping system database: {db_name}\n")
                continue
            
            db = client[db_name]
            collections = await db.list_collection_names()
            
            print(f"📁 Database: {db_name}")
            print(f"   Collections: {collections}")
            
            # Check each collection for data
            has_data = False
            for collection_name in collections:
                collection = db[collection_name]
                count = await collection.count_documents({})
                if count > 0:
                    has_data = True
                    print(f"   ✅ {collection_name}: {count} documents")
                    
                    # Show sample
                    sample = await collection.find_one()
                    print(f"      Sample keys: {list(sample.keys()) if sample else 'N/A'}\n")
            
            if not has_data:
                print(f"   ❌ No data in this database\n")
        
        print("="*80)
        print("RECOMMENDATIONS")
        print("="*80 + "\n")
        print("✋ Based on the scan above:")
        print("   1. Identify which database contains your data")
        print("   2. Update chatServer/.env with correct database name:")
        print("      MONGO_URI=mongodb+srv://...mongodb.net/{DATABASE_NAME}")
        print("      MONGO_DB_NAME={DATABASE_NAME}")
        print("   3. Restart chatServer and run test again\n")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(diagnose())
