"""
Central configuration file for Healio Backend
All port numbers and configurable values are stored here
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # MongoDB Configuration
    mongodb_url: str = "mongodb://admin:healio_dev_password@localhost:27017/healio?authSource=admin"
    mongodb_database: str = "healio"
    
    # JWT Configuration
    jwt_secret_key: str = "your-super-secret-jwt-key-change-this-in-production-32chars-minimum"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # Server Ports (CENTRALIZED - Edit here to change ports)
    backend_port: int = 5000
    frontend_port: int = 3000
    mongodb_port: int = 27017
    
    # Environment
    environment: str = "development"
    
    # CORS - Allowed Origins
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000"
    
    # Password Requirements
    min_password_length: int = 8
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_numbers: bool = True
    require_special_chars: bool = True
    
    # Alert Thresholds (defaults)
    alert_heart_rate_min: int = 60
    alert_heart_rate_max: int = 100
    alert_blood_pressure_systolic_max: int = 140
    alert_blood_pressure_diastolic_max: int = 90
    alert_blood_glucose_min: int = 70
    alert_blood_glucose_max: int = 140
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Dependency function to get settings"""
    return settings


# Port access helpers
def get_backend_url() -> str:
    """Returns the full backend URL"""
    return f"http://127.0.0.1:{settings.backend_port}"


def get_frontend_url() -> str:
    """Returns the full frontend URL"""
    return f"http://localhost:{settings.frontend_port}"


def get_mongodb_url() -> str:
    """Returns MongoDB connection URL"""
    return settings.mongodb_url


# Export commonly used settings
__all__ = [
    'settings',
    'get_settings',
    'get_backend_url',
    'get_frontend_url',
    'get_mongodb_url'
]
