"""
Doctor-specific routes: view patients, patient details, reports
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import UserResponse, BiometricResponse
from app.database import get_database
from app.middleware.auth import get_current_doctor
from app.utils.user_profiles import parse_object_id



router = APIRouter()


@router.get("/patients", response_model=List[UserResponse])
async def get_doctor_patients(
    search: Optional[str] = Query(None, description="Search by name or email"),
    current_user: dict = Depends(get_current_doctor),
    db = Depends(get_database)
):
    """
    Get list of patients assigned to the current doctor
    """
    doctor_id = str(current_user["_id"])
    query = {"role": "patient", "assigned_doctor_id": doctor_id}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = db.users.find(query).limit(100)
    
    patients = []
    async for patient in cursor:
        patient["_id"] = str(patient["_id"])
        patients.append(patient)
    
    return patients


@router.get("/patients/{patient_id}", response_model=UserResponse)
async def get_patient_details(
    patient_id: str,
    current_user: dict = Depends(get_current_doctor),
    db = Depends(get_database)
):
    """
    Get detailed information about an assigned patient
    """
    doctor_id = str(current_user["_id"])
    patient_object_id = parse_object_id(patient_id, "patient")
    patient = await db.users.find_one({
        "_id": patient_object_id,
        "role": "patient",
        "assigned_doctor_id": doctor_id
    })
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    patient["_id"] = str(patient["_id"])
    return patient


@router.get("/patients/{patient_id}/biometrics", response_model=List[BiometricResponse])
async def get_patient_biometrics(
    patient_id: str,
    metric: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_doctor),
    db = Depends(get_database)
):
    """
    Get biometric data for an assigned patient
    """
    doctor_id = str(current_user["_id"])
    patient_object_id = parse_object_id(patient_id, "patient")

    # Verify patient exists and is assigned to the doctor
    patient = await db.users.find_one({
        "_id": patient_object_id,
        "role": "patient",
        "assigned_doctor_id": doctor_id
    })
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Build query
    query = {"user_id": str(patient_object_id)}
    
    if metric:
        query["metric"] = metric
    
    if from_date or to_date:
        query["timestamp"] = {}
        if from_date:
            query["timestamp"]["$gte"] = from_date
        if to_date:
            query["timestamp"]["$lte"] = to_date
    
    # Fetch biometrics
    cursor = db.biometrics.find(query).sort("timestamp", -1).limit(limit)
    
    biometrics = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        biometrics.append(doc)
    
    return biometrics


@router.get("/patients/{patient_id}/summary")
async def get_patient_summary(
    patient_id: str,
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_doctor),
    db = Depends(get_database)
):
    """
    Get summary statistics for an assigned patient over specified days
    """
    doctor_id = str(current_user["_id"])
    patient_object_id = parse_object_id(patient_id, "patient")
    patient_id_str = str(patient_object_id)

    # Verify patient exists and is assigned to the doctor
    patient = await db.users.find_one({
        "_id": patient_object_id,
        "role": "patient",
        "assigned_doctor_id": doctor_id
    })
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    from_date = datetime.utcnow() - timedelta(days=days)
    
    # Calculate averages for each metric
    metric_types = ["heart_rate", "steps", "calories", "blood_glucose", "sleep_hours"]
    summary = {}
    
    for metric in metric_types:
        pipeline = [
            {
                "$match": {
                    "user_id": patient_id_str,
                    "metric": metric,
                    "timestamp": {"$gte": from_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "average": {"$avg": "$value"},
                    "min": {"$min": "$value"},
                    "max": {"$max": "$value"},
                    "count": {"$sum": 1}
                }
            }
        ]
        
        result = await db.biometrics.aggregate(pipeline).to_list(1)
        
        if result:
            summary[metric] = {
                "average": round(result[0]["average"], 2),
                "min": result[0]["min"],
                "max": result[0]["max"],
                "count": result[0]["count"]
            }
    
    # Count alerts
    alert_count = await db.alerts.count_documents({
        "user_id": patient_id_str,
        "created_at": {"$gte": from_date}
    })
    
    return {
        "patient_id": patient_id_str,
        "patient_name": patient["name"],
        "period_days": days,
        "from_date": from_date,
        "metrics": summary,
        "alert_count": alert_count
    }
