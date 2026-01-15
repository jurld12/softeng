"""
Admin-specific routes: user management, system statistics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import UserResponse, UserUpdateRequest, SystemStats
from app.database import get_database
from app.middleware.auth import get_current_admin


router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """
    Get list of all users (admin only)
    """
    cursor = db.users.find({}).sort("created_at", -1)
    
    users = []
    async for user in cursor:
        user["_id"] = str(user["_id"])
        users.append(user)
    
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """
    Get specific user details (admin only)
    """
    user = await db.users.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user["_id"] = str(user["_id"])
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    updates: UserUpdateRequest,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """
    Update user role or active status (admin only)
    """
    # Check if user exists
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prepare update document
    update_doc = {}
    if updates.role is not None:
        update_doc["role"] = updates.role
    if updates.active is not None:
        update_doc["active"] = updates.active
    
    if not update_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No updates provided"
        )
    
    # Update user
    await db.users.update_one(
        {"_id": user_id},
        {"$set": update_doc}
    )
    
    # Fetch updated user
    updated_user = await db.users.find_one({"_id": user_id})
    updated_user["_id"] = str(updated_user["_id"])
    
    return updated_user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """
    Delete a user (admin only)
    WARNING: This permanently deletes user and their data
    """
    # Check if user exists
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if str(current_user["_id"]) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Delete user and related data
    await db.users.delete_one({"_id": user_id})
    await db.biometrics.delete_many({"user_id": user_id})
    await db.alerts.delete_many({"user_id": user_id})
    await db.achievements.delete_many({"user_id": user_id})
    
    return {"message": f"User {user_id} deleted successfully"}


@router.get("/stats", response_model=SystemStats)
async def get_system_statistics(
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """
    Get system-wide statistics (admin only)
    """
    # Count users by role
    total_users = await db.users.count_documents({})
    total_patients = await db.users.count_documents({"role": "patient"})
    total_doctors = await db.users.count_documents({"role": "doctor"})
    total_admins = await db.users.count_documents({"role": "admin"})
    active_users = await db.users.count_documents({"active": True})
    
    # Count biometric entries
    total_biometric_entries = await db.biometrics.count_documents({})
    
    # Count alerts
    total_alerts = await db.alerts.count_documents({})
    
    return SystemStats(
        total_users=total_users,
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_admins=total_admins,
        active_users=active_users,
        total_biometric_entries=total_biometric_entries,
        total_alerts=total_alerts
    )
