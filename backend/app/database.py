"""
Database connection and utilities for MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
from typing import Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))
from config import settings


class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        try:
            cls.client = AsyncIOMotorClient(settings.mongodb_url)
            # Test connection
            await cls.client.admin.command('ping')
            print(f"✅ Connected to MongoDB: {settings.mongodb_database}")
            
            # Create indexes
            await cls.create_indexes()
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            print("👋 Disconnected from MongoDB")
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        if cls.client is None:
            raise Exception("Database not connected. Call connect_db() first.")
        return cls.client[settings.mongodb_database]
    
    @classmethod
    async def create_indexes(cls):
        """Create database indexes for performance"""
        db = cls.get_db()
        
        # Users collection indexes
        await db.users.create_index([("email", ASCENDING)], unique=True)
        await db.users.create_index([("role", ASCENDING)])
        
        # Biometrics collection indexes
        await db.biometrics.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
        await db.biometrics.create_index([("metric", ASCENDING)])
        
        # Alerts collection indexes
        await db.alerts.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
        await db.alerts.create_index([("acknowledged", ASCENDING)])
        
        # Achievements collection indexes
        await db.achievements.create_index([("user_id", ASCENDING)])
        
        print("✅ Database indexes created")


# Dependency to get database
async def get_database():
    """FastAPI dependency to get database"""
    return Database.get_db()
