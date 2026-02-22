"""
Memory Management for Chat History
Handles conversation context and history storage
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId


logger = logging.getLogger(__name__)


class ChatMemory:
    """
    Manages chat conversation memory and history
    Can store in memory or MongoDB
    """
    
    def __init__(self, user_id: str, db: Optional[AsyncIOMotorDatabase] = None, max_messages: int = 50):
        """
        Initialize chat memory
        
        Args:
            user_id: User ID for this conversation
            db: MongoDB database connection (optional)
            max_messages: Maximum messages to keep in memory
        """
        self.user_id = user_id
        self.db = db
        self.max_messages = max_messages
        self.in_memory_messages: List[BaseMessage] = []
        self.collection_name = "chat_history"
    
    async def add_message(
        self,
        content: str,
        message_type: str = "human",
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Add message to memory
        
        Args:
            content: Message content
            message_type: "human" or "ai"
            metadata: Additional metadata
        """
        try:
            # Create appropriate message type
            if message_type == "human":
                message = HumanMessage(content=content, metadata=metadata or {})
            else:
                message = AIMessage(content=content, metadata=metadata or {})
            
            # Add to in-memory storage
            self.in_memory_messages.append(message)
            
            # Trim if exceeds max
            if len(self.in_memory_messages) > self.max_messages:
                self.in_memory_messages = self.in_memory_messages[-self.max_messages:]
            
            # Optionally store in database
            if self.db is not None:
                await self._persist_message(message, message_type, metadata)
            
            logger.debug(f"Message added to memory for user {self.user_id}")
            
        except Exception as e:
            logger.error(f"Error adding message to memory: {e}")
    
    async def get_conversation_history(self) -> List[BaseMessage]:
        """
        Get current conversation history
        
        Returns:
            List of messages in conversation
        """
        return self.in_memory_messages
    
    async def get_conversation_summary(self, max_tokens: int = 2000) -> str:
        """
        Generate a summary of the conversation
        Useful for context window management
        
        Args:
            max_tokens: Maximum tokens for summary
            
        Returns:
            Summary string
        """
        if not self.in_memory_messages:
            return "No conversation history"
        
        # Simple summarization: take first, middle, and last messages
        messages = self.in_memory_messages
        summary_parts = []
        
        # First message
        if len(messages) > 0:
            summary_parts.append(f"Start: {messages[0].content[:100]}...")
        
        # Middle message
        if len(messages) > 2:
            mid_idx = len(messages) // 2
            summary_parts.append(f"Middle: {messages[mid_idx].content[:100]}...")
        
        # Last message
        if len(messages) > 1:
            summary_parts.append(f"Recent: {messages[-1].content[:100]}...")
        
        return " | ".join(summary_parts)
    
    async def clear_history(self) -> None:
        """Clear conversation history"""
        self.in_memory_messages = []
        if self.db is not None:
            await self._clear_persisted_history()
        logger.info(f"Chat history cleared for user {self.user_id}")
    
    async def _persist_message(
        self,
        message: BaseMessage,
        message_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Persist message to MongoDB
        
        Args:
            message: Message to persist
            message_type: Type of message
            metadata: Additional metadata
        """
        try:
            if self.db is None:
                return
            
            chat_collection = self.db[self.collection_name]
            
            doc = {
                "userId": ObjectId(self.user_id) if ObjectId.is_valid(self.user_id) else self.user_id,
                "type": message_type,
                "content": message.content,
                "metadata": metadata or {},
                "createdAt": datetime.now(),
            }
            
            await chat_collection.insert_one(doc)
            
        except Exception as e:
            logger.error(f"Error persisting message to database: {e}")
    
    async def _clear_persisted_history(self) -> None:
        """Clear persisted chat history from database"""
        try:
            if self.db is None:
                return
            
            chat_collection = self.db[self.collection_name]
            await chat_collection.delete_many({"userId": self.user_id})
            
        except Exception as e:
            logger.error(f"Error clearing database history: {e}")
    
    async def get_persisted_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get persisted chat history from database
        
        Args:
            limit: Maximum messages to retrieve
            
        Returns:
            List of messages from database
        """
        try:
            if self.db is None:
                return []
            
            chat_collection = self.db[self.collection_name]
            messages = await chat_collection.find(
                {"userId": self.user_id}
            ).sort("createdAt", -1).limit(limit).to_list(limit)
            
            return list(reversed(messages))  # Reverse to get chronological order
            
        except Exception as e:
            logger.error(f"Error retrieving persisted history: {e}")
            return []


class ConversationBuffer:
    """
    Buffer for managing conversation context
    Implements token-aware window management
    """
    
    def __init__(self, max_tokens: int = 4096):
        """
        Initialize conversation buffer
        
        Args:
            max_tokens: Maximum tokens for context window
        """
        self.max_tokens = max_tokens
        self.current_tokens = 0
        self.messages: List[BaseMessage] = []
    
    def add_message(self, message: BaseMessage, token_estimate: int = 100) -> bool:
        """
        Add message to buffer if within token limit
        
        Args:
            message: Message to add
            token_estimate: Estimated tokens for message
            
        Returns:
            True if added, False if would exceed limit
        """
        if self.current_tokens + token_estimate > self.max_tokens:
            # Remove oldest message and try again
            if self.messages:
                removed = self.messages.pop(0)
                self.current_tokens -= token_estimate
                logger.debug("Removed oldest message to fit new message")
            else:
                return False
        
        self.messages.append(message)
        self.current_tokens += token_estimate
        return True
    
    def get_messages(self) -> List[BaseMessage]:
        """Get all messages in buffer"""
        return self.messages
    
    def clear(self) -> None:
        """Clear buffer"""
        self.messages = []
        self.current_tokens = 0
