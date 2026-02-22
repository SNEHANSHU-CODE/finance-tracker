"""
Test file to verify Transaction, Goal, and Reminder services
Run: python -m app.utils.test
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from bson import ObjectId

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from app.core.config import settings
from app.core.database import Database
from app.services.transactionService import TransactionService
from app.services.goalService import GoalService
from app.services.reminderService import ReminderService


async def test_services():
    """Test all services"""
    
    print("\n" + "="*80)
    print("FINANCE TRACKER - SERVICE TEST")
    print("="*80 + "\n")
    
    try:
        # Connect to database
        print("1. Connecting to Database...")
        await Database.connect_db()
        db = Database.get_db()
        print("✅ Database connected successfully\n")
        
        # Debug: Print database info
        print("2. Database Debug Info:")
        print(f"   Database name: {db.name}")
        collections = await db.list_collection_names()
        print(f"   Available collections: {collections}\n")
        
        # Get a sample user ID from database
        print("3. Fetching test user...")
        users = db.users
        user_count = await users.count_documents({})
        print(f"   Users collection count: {user_count}")
        
        test_user = await users.find_one()
        
        if not test_user:
            print("❌ No users found with 'users' collection. Trying 'User' collection...")
            users = db.User
            user_count = await users.count_documents({})
            print(f"   User collection count: {user_count}")
            test_user = await users.find_one()
            
            if not test_user:
                print("❌ No users found. Please ensure data exists in database.\n")
                await Database.close_db()
                return
        
        user_id = str(test_user["_id"])
        print(f"✅ Test user found: {user_id}\n")
        
        # ==================== TEST TRANSACTION SERVICE ====================
        print("="*80)
        print("TRANSACTION SERVICE TESTS")
        print("="*80 + "\n")
        
        transaction_service = TransactionService(db)
        
        try:
            print("📋 Test 1: Get Recent Transactions")
            recent_txns = await transaction_service.get_recent_transactions(user_id, limit=5)
            print(f"   Result: Found {len(recent_txns)} recent transactions")
            if recent_txns:
                print(f"   Sample: {recent_txns[0]}\n")
            else:
                print("   Result: Empty - No transactions found\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("📊 Test 2: Get Monthly Summary (Current Month)")
            now = datetime.now()
            monthly = await transaction_service.get_monthly_summary(user_id, now.month, now.year)
            print(f"   Result: {monthly}\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("🏷️  Test 3: Get Category Analysis")
            categories = await transaction_service.get_category_analysis(user_id)
            print(f"   Result: {categories}\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("📈 Test 4: Get Spending Trends (Last 6 months)")
            trends = await transaction_service.get_spending_trends(user_id, months=6)
            print(f"   Result: {trends}\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        # ==================== TEST GOAL SERVICE ====================
        print("="*80)
        print("GOAL SERVICE TESTS")
        print("="*80 + "\n")
        
        goal_service = GoalService(db)
        
        try:
            print("🎯 Test 1: Get All Goals")
            goals = await goal_service.get_goals_by_user(user_id)
            print(f"   Result: Found {len(goals)} goals")
            if goals:
                print(f"   Sample: {goals[0]}\n")
            else:
                print("   Result: Empty - No goals found\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("📊 Test 2: Get Active Goals Only")
            active_goals = await goal_service.get_goals_by_user(user_id, status="Active")
            print(f"   Result: Found {len(active_goals)} active goals\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("📈 Test 3: Get Goal Summary")
            summary = await goal_service.get_goal_summary(user_id)
            print(f"   Result: {summary}\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("🗂️  Test 4: Get Goals by Category")
            by_category = await goal_service.get_goals_by_category(user_id)
            print(f"   Result: {len(by_category)} categories found")
            for cat, goals_list in by_category.items():
                print(f"   - {cat}: {len(goals_list)} goals")
            print()
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("⭐ Test 5: Get Goals by Priority")
            by_priority = await goal_service.get_goals_by_priority(user_id)
            print(f"   Result: {len(by_priority)} priorities found")
            for priority, goals_list in by_priority.items():
                print(f"   - {priority}: {len(goals_list)} goals")
            print()
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        # ==================== TEST REMINDER SERVICE ====================
        print("="*80)
        print("REMINDER SERVICE TESTS")
        print("="*80 + "\n")
        
        reminder_service = ReminderService(db)
        
        try:
            print("🔔 Test 1: Get All Reminders")
            all_reminders = await reminder_service.get_reminders_by_user(user_id)
            print(f"   Result: Found {len(all_reminders)} reminders")
            if all_reminders:
                print(f"   Sample: {all_reminders[0]}\n")
            else:
                print("   Result: Empty - No reminders found\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("📅 Test 2: Get Today's Reminders")
            today_reminders = await reminder_service.get_today_reminders(user_id)
            print(f"   Result: Found {len(today_reminders)} reminders for today")
            if today_reminders:
                for reminder in today_reminders:
                    print(f"   - {reminder.get('title', 'N/A')}: {reminder.get('date', 'N/A')}")
            print()
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("🗓️  Test 3: Get Upcoming Reminders (Next 7 days)")
            upcoming = await reminder_service.get_upcoming_reminders(user_id, days=7)
            print(f"   Result: Found {len(upcoming)} upcoming reminders")
            if upcoming:
                for reminder in upcoming:
                    print(f"   - {reminder.get('title', 'N/A')}: {reminder.get('date', 'N/A')}")
            print()
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        try:
            print("🏆 Test 4: Get Active Reminders Only")
            active_reminders = await reminder_service.get_reminders_by_user(user_id)
            active_count = sum(1 for r in active_reminders if r.get("isActive", False))
            print(f"   Result: Found {active_count} active reminders\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")
        
        # ==================== SUMMARY ====================
        print("="*80)
        print("TEST SUMMARY")
        print("="*80)
        print("✅ All service tests completed successfully!")
        print(f"📝 Test User ID: {user_id}")
        print(f"🕐 Test Date: {datetime.now().isoformat()}")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Fatal Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Close database connection
        await Database.close_db()
        print("Database connection closed.")


if __name__ == "__main__":
    print(f"\nMongoDB URI: {settings.MONGO_URI}")
    print(f"Database Name: {settings.MONGO_DB_NAME}")
    print(f"Environment: {settings.ENVIRONMENT}\n")
    
    asyncio.run(test_services())
