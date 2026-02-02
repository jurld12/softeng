"""
Healio Backend - Main Application Entry Point
FastAPI REST API for health monitoring system
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from config import settings
from app.database import Database
from app.api.routes import auth, patients, doctors, admin, medications


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print(f"🚀 Healio Backend starting...")
    print(f"📦 Environment: {settings.environment}")
    print(f"🔌 Backend Port: {settings.backend_port}")
    print(f"🗄️  MongoDB: {settings.mongodb_database}")
    print(f"🔐 JWT Expiration: {settings.jwt_expiration_hours} hours")
    
    # Initialize database connection
    await Database.connect_db()
    
    yield
    
    # Shutdown
    print("👋 Healio Backend shutting down...")
    await Database.close_db()


# Create FastAPI app
app = FastAPI(
    title="Healio API",
    description="REST API for Virtual Health Companion System",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS
origins = settings.allowed_origins.split(",")
# Allow null origin for file:// protocol during development
if settings.environment == "development":
    origins.append("null")
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """Check if the API is running"""
    return {
        "status": "healthy",
        "service": "Healio Backend",
        "version": "0.1.0",
        "environment": settings.environment
    }


@app.get("/", tags=["System"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to Healio API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }


# Include API routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/patients", tags=["Patients"])
app.include_router(doctors.router, prefix="/doctor", tags=["Doctors"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(medications.router, prefix="/patients", tags=["Medications"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=settings.backend_port,
        reload=True
    )
