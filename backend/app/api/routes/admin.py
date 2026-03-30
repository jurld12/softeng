"""
Admin-specific routes: user management, system statistics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import AdminDoctorCreateRequest, UserResponse, UserUpdateRequest, SystemStats
from app.database import get_database
from app.middleware.auth import get_current_admin
from app.utils.auth import hash_password, validate_password_strength
from app.utils.user_profiles import normalize_doctor_specialty, parse_object_id


router = APIRouter()


@router.post("/doctors", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor_account(
    doctor_data: AdminDoctorCreateRequest,
    current_user: dict = Depends(get_current_admin),
    db = Depends(get_database)
):
    """Create a doctor account from the admin workspace."""
    is_valid, error_msg = validate_password_strength(doctor_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    existing_user = await db.users.find_one({"email": doctor_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    normalized_specialty = normalize_doctor_specialty(doctor_data.specialty)
    if not normalized_specialty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor specialty is required"
        )

    doctor_doc = {
        "name": doctor_data.name.strip(),
        "email": doctor_data.email,
        "phone": doctor_data.phone.strip() if doctor_data.phone else None,
        "password_hash": hash_password(doctor_data.password),
        "role": "doctor",
        "specialty": normalized_specialty,
        "active": True,
        "created_at": datetime.utcnow(),
        "profile": {}
    }

    result = await db.users.insert_one(doctor_doc)
    created_doctor = await db.users.find_one({"_id": result.inserted_id})
    created_doctor["_id"] = str(created_doctor["_id"])
    return created_doctor


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
    user_object_id = parse_object_id(user_id, "user")
    user = await db.users.find_one({"_id": user_object_id})
    
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
    user_object_id = parse_object_id(user_id, "user")
    user = await db.users.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prepare update document
    update_doc = {}

    if updates.name is not None:
        update_doc["name"] = updates.name.strip()

    if updates.email is not None:
        existing_user = await db.users.find_one({
            "email": updates.email,
            "_id": {"$ne": user_object_id}
        })
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        update_doc["email"] = updates.email

    if updates.phone is not None:
        normalized_phone = str(updates.phone).strip()
        update_doc["phone"] = normalized_phone or None

    if updates.role is not None:
        update_doc["role"] = updates.role
        if updates.role != "doctor":
            update_doc["specialty"] = None
    if updates.active is not None:
        update_doc["active"] = updates.active

    if updates.specialty is not None:
        next_role = updates.role or user.get("role")
        if next_role != "doctor":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only doctor accounts can have a specialty"
            )

        update_doc["specialty"] = normalize_doctor_specialty(updates.specialty)
    
    if not update_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No updates provided"
        )
    
    # Update user
    await db.users.update_one(
        {"_id": user_object_id},
        {"$set": update_doc}
    )
    
    # Fetch updated user
    updated_user = await db.users.find_one({"_id": user_object_id})
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
    user_object_id = parse_object_id(user_id, "user")
    user = await db.users.find_one({"_id": user_object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    user_id_str = str(user_object_id)

    if str(current_user["_id"]) == user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Delete user and related data
    await db.users.delete_one({"_id": user_object_id})
    await db.biometrics.delete_many({"user_id": user_id_str})
    await db.alerts.delete_many({"user_id": user_id_str})
    await db.achievements.delete_many({"user_id": user_id_str})
    
    return {"message": f"User {user_id_str} deleted successfully"}


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
