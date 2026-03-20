"""
Authentication routes: register, login, logout
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import UserRegister, UserLogin, ChangePasswordRequest, TokenResponse, UserResponse, DoctorOptionResponse
from app.database import get_database
from app.utils.user_profiles import normalize_doctor_specialty, normalize_emergency_contact, resolve_doctor_assignment, serialize_doctor_reference
from app.utils.auth import hash_password, verify_password, validate_password_strength, create_access_token
from app.middleware.auth import get_current_user


router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db = Depends(get_database)):
    """
    Register a new user account
    """
    if user_data.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is only available for patient accounts"
        )

    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    assigned_doctor_id = None
    if user_data.role == "patient":
        assigned_doctor_id, _ = await resolve_doctor_assignment(db, user_data.assigned_doctor_id)
    
    # Create user document
    user_doc = {
        "name": user_data.full_name,
        "email": user_data.email,
        "phone": user_data.phone,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "specialty": normalize_doctor_specialty(user_data.specialty) if user_data.role == "doctor" else None,
        "active": True,
        "created_at": datetime.utcnow(),
        "assigned_doctor_id": assigned_doctor_id,
        "profile": {
            "date_of_birth": user_data.date_of_birth,
            "gender": user_data.gender,
            "address": user_data.address,
            "blood_type": user_data.blood_type,
            "height": user_data.height,
            "weight": user_data.weight,
            "allergies": user_data.allergies or [],
            "emergency_contact": normalize_emergency_contact(
                user_data.emergency_contact.model_dump(exclude_none=True) if user_data.emergency_contact else None
            )
        }
    }
    
    # Insert user
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user_id, "role": user_data.role}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user_id,
        role=user_data.role,
        name=user_data.full_name
    )


@router.get("/doctors", response_model=List[DoctorOptionResponse])
async def get_public_doctor_directory(db = Depends(get_database)):
    """Get the list of active doctors available for patient selection."""
    cursor = db.users.find(
        {"role": "doctor", "active": True},
        {"name": 1, "email": 1, "specialty": 1}
    ).sort("name", 1)

    doctors = []
    async for doctor in cursor:
        doctors.append(serialize_doctor_reference(doctor))

    return doctors


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db = Depends(get_database)):
    """
    Login with email and password
    """
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account is active
    if not user.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # Create access token
    user_id = str(user["_id"])
    access_token = create_access_token(
        data={"sub": user_id, "role": user["role"]}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user_id,
        role=user["role"],
        name=user["name"]
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout (client should delete token)
    With JWT, logout is handled client-side by deleting the token
    """
    return {
        "message": "Logged out successfully",
        "detail": "Please delete your access token from local storage"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information
    """
    current_user["_id"] = str(current_user["_id"])
    return current_user


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Change password for authenticated user
    """
    stored_password_hash = current_user.get("password_hash")

    # Verify current password first
    if not stored_password_hash or not verify_password(password_data.current_password, stored_password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Prevent reusing the same password
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    # Reuse global password strength policy
    is_valid, error_msg = validate_password_strength(password_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    result = await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "password_hash": hash_password(password_data.new_password),
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {"message": "Password updated successfully"}
