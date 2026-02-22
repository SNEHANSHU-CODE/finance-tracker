"""
Helper utilities for MongoDB operations with Pydantic models
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


def convert_mongo_document(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert MongoDB document to Pydantic-compatible format
    Converts ObjectId fields to strings
    
    Args:
        doc: MongoDB document
        
    Returns:
        Converted document with ObjectIds as strings
    """
    if doc is None:
        return None
    
    # Convert _id
    if "_id" in doc and isinstance(doc["_id"], ObjectId):
        doc["_id"] = str(doc["_id"])
    
    # Convert userId
    if "userId" in doc and isinstance(doc["userId"], ObjectId):
        doc["userId"] = str(doc["userId"])
    
    # Convert goalId (for transactions)
    if "goalId" in doc and isinstance(doc["goalId"], ObjectId):
        doc["goalId"] = str(doc["goalId"])
    
    return doc


def convert_mongo_documents(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert list of MongoDB documents to Pydantic-compatible format
    
    Args:
        docs: List of MongoDB documents
        
    Returns:
        List of converted documents
    """
    return [convert_mongo_document(doc) for doc in docs]


def prepare_for_mongo(data: Dict[str, Any], user_id: str = None) -> Dict[str, Any]:
    """
    Prepare Pydantic model data for MongoDB insertion
    Converts string IDs to ObjectIds where appropriate
    
    Args:
        data: Dictionary from Pydantic model
        user_id: Optional user ID to add
        
    Returns:
        MongoDB-ready document
    """
    doc = data.copy()
    
    # Remove None values
    doc = {k: v for k, v in doc.items() if v is not None}
    
    # Remove id field if present (MongoDB will generate _id)
    if "id" in doc:
        del doc["id"]
    
    # Convert userId to ObjectId if it's a string
    if user_id:
        doc["userId"] = ObjectId(user_id) if isinstance(user_id, str) else user_id
    elif "userId" in doc and isinstance(doc["userId"], str):
        doc["userId"] = ObjectId(doc["userId"])
    
    # Convert goalId to ObjectId if present and is string
    if "goalId" in doc and doc["goalId"] and isinstance(doc["goalId"], str):
        doc["goalId"] = ObjectId(doc["goalId"])
    
    return doc


def calculate_goal_virtuals(goal: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate virtual fields for a goal document
    
    Args:
        goal: Goal document
        
    Returns:
        Goal with calculated virtual fields
    """
    # Progress percentage
    if goal.get("targetAmount", 0) > 0:
        progress = (goal.get("savedAmount", 0) / goal["targetAmount"]) * 100
        goal["progressPercentage"] = round(progress)
    else:
        goal["progressPercentage"] = 0
    
    # Remaining amount
    goal["remainingAmount"] = max(0, goal.get("targetAmount", 0) - goal.get("savedAmount", 0))
    
    # Days remaining
    if goal.get("targetDate"):
        today = datetime.now()
        target_date = goal["targetDate"]
        if isinstance(target_date, str):
            target_date = datetime.fromisoformat(target_date.replace("Z", "+00:00"))
        diff = target_date - today
        goal["daysRemaining"] = diff.days
        goal["isOverdue"] = diff.days < 0 and goal.get("status") != "Completed"
    else:
        goal["daysRemaining"] = 0
        goal["isOverdue"] = False
    
    return goal


def calculate_reminder_virtuals(reminder: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate virtual fields for a reminder document
    
    Args:
        reminder: Reminder document
        
    Returns:
        Reminder with calculated virtual fields
    """
    if reminder.get("date"):
        today = datetime.now()
        reminder_date = reminder["date"]
        if isinstance(reminder_date, str):
            reminder_date = datetime.fromisoformat(reminder_date.replace("Z", "+00:00"))
        
        # Check if today
        reminder["isToday"] = reminder_date.date() == today.date()
        
        # Calculate days until
        diff = reminder_date - today
        reminder["daysUntil"] = diff.days
        
        # Check if overdue
        reminder["isOverdue"] = diff.days < 0
    else:
        reminder["isToday"] = False
        reminder["daysUntil"] = 0
        reminder["isOverdue"] = False
    
    return reminder


class MongoDBHelper:
    """Helper class for MongoDB operations"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.goals = db["goals"]
        self.reminders = db["reminders"]
        self.transactions = db["transactions"]
    
    # Goal Operations
    async def get_user_goals(self, user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all goals for a user"""
        query = {"userId": ObjectId(user_id)}
        if status:
            query["status"] = status
        
        cursor = self.goals.find(query).sort("targetDate", 1)
        goals = await cursor.to_list(length=None)
        goals = convert_mongo_documents(goals)
        return [calculate_goal_virtuals(goal) for goal in goals]
    
    async def get_goal_by_id(self, goal_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific goal by ID"""
        goal = await self.goals.find_one({
            "_id": ObjectId(goal_id),
            "userId": ObjectId(user_id)
        })
        if goal:
            goal = convert_mongo_document(goal)
            goal = calculate_goal_virtuals(goal)
        return goal
    
    async def create_goal(self, goal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new goal"""
        goal_doc = prepare_for_mongo(goal_data)
        result = await self.goals.insert_one(goal_doc)
        created_goal = await self.goals.find_one({"_id": result.inserted_id})
        created_goal = convert_mongo_document(created_goal)
        return calculate_goal_virtuals(created_goal)
    
    async def update_goal(self, goal_id: str, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a goal"""
        update_doc = {k: v for k, v in update_data.items() if v is not None}
        update_doc["updatedAt"] = datetime.now()
        
        result = await self.goals.find_one_and_update(
            {"_id": ObjectId(goal_id), "userId": ObjectId(user_id)},
            {"$set": update_doc},
            return_document=True
        )
        if result:
            result = convert_mongo_document(result)
            result = calculate_goal_virtuals(result)
        return result
    
    async def delete_goal(self, goal_id: str, user_id: str) -> bool:
        """Delete a goal"""
        result = await self.goals.delete_one({
            "_id": ObjectId(goal_id),
            "userId": ObjectId(user_id)
        })
        return result.deleted_count > 0
    
    # Reminder Operations
    async def get_user_reminders(self, user_id: str, upcoming_only: bool = False) -> List[Dict[str, Any]]:
        """Get all reminders for a user"""
        query = {"userId": ObjectId(user_id)}
        if upcoming_only:
            query["date"] = {"$gte": datetime.now()}
        
        cursor = self.reminders.find(query).sort("date", 1)
        reminders = await cursor.to_list(length=None)
        reminders = convert_mongo_documents(reminders)
        return [calculate_reminder_virtuals(reminder) for reminder in reminders]
    
    async def get_reminder_by_id(self, reminder_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific reminder by ID"""
        reminder = await self.reminders.find_one({
            "_id": ObjectId(reminder_id),
            "userId": ObjectId(user_id)
        })
        if reminder:
            reminder = convert_mongo_document(reminder)
            reminder = calculate_reminder_virtuals(reminder)
        return reminder
    
    async def create_reminder(self, reminder_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new reminder"""
        reminder_doc = prepare_for_mongo(reminder_data)
        result = await self.reminders.insert_one(reminder_doc)
        created_reminder = await self.reminders.find_one({"_id": result.inserted_id})
        created_reminder = convert_mongo_document(created_reminder)
        return calculate_reminder_virtuals(created_reminder)
    
    # Transaction Operations
    async def get_user_transactions(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        transaction_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get transactions for a user with optional filters"""
        query = {"userId": ObjectId(user_id)}
        
        if start_date or end_date:
            query["date"] = {}
            if start_date:
                query["date"]["$gte"] = start_date
            if end_date:
                query["date"]["$lte"] = end_date
        
        if transaction_type:
            query["type"] = transaction_type
        
        cursor = self.transactions.find(query).sort("date", -1).limit(limit)
        transactions = await cursor.to_list(length=None)
        return convert_mongo_documents(transactions)
    
    async def get_transaction_by_id(self, transaction_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific transaction by ID"""
        transaction = await self.transactions.find_one({
            "_id": ObjectId(transaction_id),
            "userId": ObjectId(user_id)
        })
        return convert_mongo_document(transaction) if transaction else None
    
    async def create_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new transaction"""
        transaction_doc = prepare_for_mongo(transaction_data)
        result = await self.transactions.insert_one(transaction_doc)
        created_transaction = await self.transactions.find_one({"_id": result.inserted_id})
        return convert_mongo_document(created_transaction)
    
    async def get_transaction_summary(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get transaction summary for a user"""
        query = {"userId": ObjectId(user_id)}
        
        if start_date or end_date:
            query["date"] = {}
            if start_date:
                query["date"]["$gte"] = start_date
            if end_date:
                query["date"]["$lte"] = end_date
        
        # Aggregate pipeline
        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": "$type",
                    "total": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results = await self.transactions.aggregate(pipeline).to_list(length=None)
        
        summary = {
            "totalIncome": 0,
            "totalExpenses": 0,
            "netSavings": 0,
            "savingsRate": 0,
            "transactionCount": 0
        }
        
        for result in results:
            if result["_id"] == "Income":
                summary["totalIncome"] = result["total"]
            elif result["_id"] == "Expense":
                summary["totalExpenses"] = result["total"]
            summary["transactionCount"] += result["count"]
        
        summary["netSavings"] = summary["totalIncome"] - summary["totalExpenses"]
        if summary["totalIncome"] > 0:
            summary["savingsRate"] = round((summary["netSavings"] / summary["totalIncome"]) * 100, 2)
        
        return summary