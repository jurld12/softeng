"""
Authentication routes: register, login, logout
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.database import get_database
from app.utils.auth import hash_password, verify_password, validate_password_strength, create_access_token
from app.middleware.auth import get_current_user


router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db = Depends(get_database)):
    """
    Register a new user account
    """
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
    
    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "active": True,
        "created_at": datetime.utcnow(),
        "profile": {
            "height": user_data.height,
            "weight": user_data.weight,
            "gender": user_data.gender,
            "date_of_birth": user_data.date_of_birth
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
        name=user_data.name
    )


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
