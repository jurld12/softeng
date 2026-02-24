"""
Reminder routes: CRUD operations for patient reminders
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import ReminderCreate, ReminderUpdate, ReminderResponse, ReminderHistoryEntry
from app.database import get_database
from app.middleware.auth import get_current_patient


router = APIRouter()


@router.get("/me/reminders", response_model=List[ReminderResponse])
async def get_reminders(
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get all reminders for the current patient
    """
    user_id = str(current_user["_id"])
    
    cursor = db.reminders.find({"user_id": user_id}).sort("created_at", -1)
    
    reminders = []
    async for reminder in cursor:
        reminder_id = str(reminder["_id"])
        reminder["id"] = reminder_id
        reminder["_id"] = reminder_id
        # Ensure history field exists
        if "history" not in reminder:
            reminder["history"] = []
        reminders.append(reminder)
    
    return reminders


@router.post("/me/reminders", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    reminder: ReminderCreate,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Create a new reminder entry
    """
    user_id = str(current_user["_id"])
    
    reminder_doc = {
        "user_id": user_id,
        "title": reminder.title,
        "description": reminder.description,
        "time": reminder.time,
        "frequency": reminder.frequency,
        "category": reminder.category,
        "active": reminder.active,
        "history": [],
        "created_at": datetime.utcnow()
    }
    
    result = await db.reminders.insert_one(reminder_doc)
    reminder_id = str(result.inserted_id)
    reminder_doc["id"] = reminder_id
    reminder_doc["_id"] = reminder_id
    
    return reminder_doc


@router.get("/me/reminders/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get a specific reminder by ID
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId format
    try:
        obj_id = ObjectId(reminder_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reminder ID format"
        )
    
    reminder = await db.reminders.find_one({
        "_id": obj_id,
        "user_id": user_id
    })
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    reminder_id = str(reminder["_id"])
    reminder["id"] = reminder_id
    reminder["_id"] = reminder_id
    # Ensure history field exists
    if "history" not in reminder:
        reminder["history"] = []
    return reminder


@router.put("/me/reminders/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(
    reminder_id: str,
    reminder_update: ReminderUpdate,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Update a reminder
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId format
    try:
        obj_id = ObjectId(reminder_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reminder ID format"
        )
    
    # Check if reminder exists and belongs to user
    existing = await db.reminders.find_one({
        "_id": obj_id,
        "user_id": user_id
    })
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    # Build update document
    update_doc = {}
    if reminder_update.title is not None:
        update_doc["title"] = reminder_update.title
    if reminder_update.description is not None:
        update_doc["description"] = reminder_update.description
    if reminder_update.time is not None:
        update_doc["time"] = reminder_update.time
    if reminder_update.frequency is not None:
        update_doc["frequency"] = reminder_update.frequency
    if reminder_update.category is not None:
        update_doc["category"] = reminder_update.category
    if reminder_update.active is not None:
        update_doc["active"] = reminder_update.active
    
    if not update_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No updates provided"
        )
    
    # Update reminder
    await db.reminders.update_one(
        {"_id": obj_id, "user_id": user_id},
        {"$set": update_doc}
    )
    
    # Return updated reminder
    updated_reminder = await db.reminders.find_one({"_id": obj_id})
    reminder_id = str(updated_reminder["_id"])
    updated_reminder["id"] = reminder_id
    updated_reminder["_id"] = reminder_id
    # Ensure history field exists
    if "history" not in updated_reminder:
        updated_reminder["history"] = []
    
    return updated_reminder


@router.put("/me/reminders/{reminder_id}/toggle")
async def toggle_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Toggle reminder active/inactive status
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId format
    try:
        obj_id = ObjectId(reminder_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reminder ID format"
        )
    
    # Check if reminder exists and belongs to user
    reminder = await db.reminders.find_one({
        "_id": obj_id,
        "user_id": user_id
    })
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    # Toggle active status
    new_status = not reminder.get("active", True)
    await db.reminders.update_one(
        {"_id": obj_id, "user_id": user_id},
        {"$set": {"active": new_status}}
    )
    
    return {
        "message": f"Reminder {'activated' if new_status else 'deactivated'} successfully",
        "active": new_status
    }


@router.post("/me/reminders/{reminder_id}/history")
async def add_reminder_history(
    reminder_id: str,
    history_entry: ReminderHistoryEntry,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Add or update a completion history entry for a reminder
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId format
    try:
        obj_id = ObjectId(reminder_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reminder ID format"
        )
    
    # Check if reminder exists and belongs to user
    reminder = await db.reminders.find_one({
        "_id": obj_id,
        "user_id": user_id
    })
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    # Check if entry for this date already exists
    existing_history = reminder.get("history", [])
    date_exists = False
    
    for i, h in enumerate(existing_history):
        if h.get("date") == history_entry.date:
            # Update existing entry
            existing_history[i] = {
                "date": history_entry.date,
                "completed": history_entry.completed
            }
            date_exists = True
            break
    
    if date_exists:
        # Replace entire history array with updated one
        await db.reminders.update_one(
            {"_id": obj_id, "user_id": user_id},
            {"$set": {"history": existing_history}}
        )
    else:
        # Add new history entry
        history_dict = {
            "date": history_entry.date,
            "completed": history_entry.completed
        }
        
        await db.reminders.update_one(
            {"_id": obj_id, "user_id": user_id},
            {"$push": {"history": history_dict}}
        )
    
    return {
        "message": "History entry added/updated successfully",
        "entry": {
            "date": history_entry.date,
            "completed": history_entry.completed
        }
    }


@router.delete("/me/reminders/{reminder_id}")
async def delete_reminder(
    reminder_id: str,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Delete a reminder
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId format
    try:
        obj_id = ObjectId(reminder_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reminder ID format"
        )
    
    # Check if reminder exists and belongs to user
    reminder = await db.reminders.find_one({
        "_id": obj_id,
        "user_id": user_id
    })
    
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )
    
    # Delete reminder
    await db.reminders.delete_one({"_id": obj_id, "user_id": user_id})
    
    return {"message": "Reminder deleted successfully"}
