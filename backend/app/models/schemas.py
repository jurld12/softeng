"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


# User Schemas
class UserRegister(BaseModel):
    """User registration request"""
    full_name: str = Field(..., min_length=2, max_length=100, alias="name")
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: Optional[str] = None
    role: Literal["patient", "doctor", "admin"] = "patient"
    
    # Personal information
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    
    # Medical information
    blood_type: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    allergies: Optional[list[str]] = None
    
    # Emergency contact
    emergency_contact: Optional[str] = None
    
    class Config:
        populate_by_name = True


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response (without password)"""
    id: str = Field(alias="_id")
    name: str
    email: str
    role: str
    active: bool
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str


# Biometric Schemas
class BiometricEntry(BaseModel):
    """Biometric data entry request"""
    metric: Literal["heart_rate", "steps", "calories", "blood_pressure_systolic", 
                    "blood_pressure_diastolic", "blood_glucose", "sleep_hours"]
    value: float = Field(..., gt=0)
    unit: Optional[str] = None
    notes: Optional[str] = None
    timestamp: Optional[datetime] = None
    
    @field_validator('timestamp', mode='before')
    def set_timestamp(cls, v):
        return v or datetime.utcnow()


class BiometricResponse(BaseModel):
    """Biometric data response"""
    id: str = Field(alias="_id")
    user_id: str
    metric: str
    value: float
    unit: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


# Alert Schemas
class AlertResponse(BaseModel):
    """Alert response"""
    id: str = Field(alias="_id")
    user_id: str
    metric: str
    value: float
    threshold: float
    severity: Literal["low", "medium", "high"]
    message: str
    acknowledged: bool
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


# Dashboard Schemas
class DashboardSummary(BaseModel):
    """Patient dashboard summary"""
    latest_metrics: dict
    weekly_averages: dict
    monthly_averages: dict
    recent_alerts: list[AlertResponse] = []
    total_achievements: int


# Achievement Schemas
class AchievementResponse(BaseModel):
    """Achievement response"""
    id: str = Field(alias="_id")
    user_id: str
    type: str
    title: str
    description: str
    points: int
    date_awarded: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


# Admin Schemas
class UserUpdateRequest(BaseModel):
    """Admin user update request"""
    role: Optional[Literal["patient", "doctor", "admin"]] = None
    active: Optional[bool] = None


class SystemStats(BaseModel):
    """System statistics for admin"""
    total_users: int
    total_patients: int
    total_doctors: int
    total_admins: int
    active_users: int
    total_biometric_entries: int
    total_alerts: int
