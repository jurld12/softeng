"""
Authentication and authorization middleware
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from bson import ObjectId
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))
from app.utils.auth import decode_access_token
from app.database import get_database


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_database)
):
    """
    Dependency to get current authenticated user from JWT token
    """
    print("🔐 Auth middleware triggered!")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    print(f"🔐 Token received: {token[:50]}...")
    
    payload = decode_access_token(token)
    print(f"🔐 Payload decoded: {payload}")
    
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Get user from database - convert string ID to ObjectId
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception as e:
        # Invalid ObjectId format
        print(f"❌ Error looking up user: {e}")
        raise credentials_exception
    
    if user is None:
        print(f"❌ User not found with ID: {user_id}")
        raise credentials_exception
    
    if not user.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def require_role(required_roles: list[str]):
    """
    Dependency factory to require specific roles
    Usage: Depends(require_role(["patient", "doctor"]))
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        
        if user_role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(required_roles)}"
            )
        
        return current_user
    
    return role_checker


# Convenience dependencies for specific roles
async def get_current_patient(current_user: dict = Depends(get_current_user)):
    """Require patient role"""
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patient access required"
        )
    return current_user


async def get_current_doctor(current_user: dict = Depends(get_current_user)):
    """Require doctor role"""
    if current_user.get("role") != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor access required"
        )
    return current_user


async def get_current_admin(current_user: dict = Depends(get_current_user)):
    """Require admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
