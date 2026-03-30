"""
Doctor-specific routes: view patients, patient details, reports
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import re
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


@router.get("/appointments")
async def get_doctor_appointments(
    status_filter: Optional[str] = Query(None, description="Filter by upcoming or past"),
    current_user: dict = Depends(get_current_doctor),
    db = Depends(get_database)
):
    """
    Get appointments associated with the current doctor.
    Supports both name-based doctor assignment and assigned_doctor_id.
    """
    doctor_id = str(current_user["_id"])
    doctor_name = (current_user.get("name") or "").strip()

    query_conditions = [{"assigned_doctor_id": doctor_id}]
    if doctor_name:
        escaped_name = re.escape(doctor_name)
        query_conditions.append({"doctor": {"$regex": f"^{escaped_name}$", "$options": "i"}})

    query = {"$or": query_conditions}
    appointments = await db.appointments.find(query).sort([("date", 1), ("time", 1)]).to_list(length=None)

    patient_lookup = {}
    patient_object_ids = []
    for appointment in appointments:
        parsed = None
        if appointment.get("user_id"):
            try:
                parsed = parse_object_id(appointment.get("user_id"), "patient")
            except HTTPException:
                parsed = None
        if parsed is not None:
            patient_object_ids.append(parsed)

    if patient_object_ids:
        unique_ids = list({item for item in patient_object_ids})
        users = db.users.find({"_id": {"$in": unique_ids}}, {"name": 1, "email": 1})
        async for user in users:
            patient_lookup[str(user["_id"])] = {
                "name": user.get("name") or "Unknown patient",
                "email": user.get("email") or ""
            }

    today = datetime.utcnow().date()
    formatted = []

    for appointment in appointments:
        appointment_date = None
        raw_date = appointment.get("date")
        if isinstance(raw_date, str):
            try:
                appointment_date = datetime.fromisoformat(raw_date).date()
            except ValueError:
                try:
                    appointment_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
                except ValueError:
                    appointment_date = None

        status_value = appointment.get("status") or "upcoming"
        is_past = status_value in ["completed", "cancelled"]
        if appointment_date and appointment_date < today:
            is_past = True

        if status_filter == "upcoming" and is_past:
            continue
        if status_filter == "past" and not is_past:
            continue

        patient = patient_lookup.get(str(appointment.get("user_id")), {})

        item = {
            "id": str(appointment.get("_id")),
            "user_id": str(appointment.get("user_id", "")),
            "patient_name": patient.get("name", "Unknown patient"),
            "patient_email": patient.get("email", ""),
            "title": appointment.get("title") or "Appointment",
            "type": appointment.get("type") or "other",
            "date": appointment.get("date"),
            "time": appointment.get("time") or "",
            "doctor": appointment.get("doctor") or doctor_name,
            "location": appointment.get("location"),
            "notes": appointment.get("notes"),
            "status": status_value,
            "is_past": is_past
        }

        if appointment.get("created_at") is not None:
            item["created_at"] = appointment["created_at"].isoformat() if hasattr(appointment["created_at"], "isoformat") else appointment["created_at"]
        if appointment.get("updated_at") is not None:
            item["updated_at"] = appointment["updated_at"].isoformat() if hasattr(appointment["updated_at"], "isoformat") else appointment["updated_at"]

        formatted.append(item)

    upcoming_count = len([row for row in formatted if not row["is_past"]])
    past_count = len(formatted) - upcoming_count

    return {
        "appointments": formatted,
        "total": len(formatted),
        "upcoming_count": upcoming_count,
        "past_count": past_count
    }


@router.patch("/appointments/{appointment_id}/status")
async def update_doctor_appointment_status(
    appointment_id: str,
    status_value: str,
    current_user: dict = Depends(get_current_doctor),
    db = Depends(get_database)
):
    """
    Allow a doctor to update status for appointments associated with their account.
    """
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid appointment ID"
        )

    allowed_statuses = {"upcoming", "completed", "cancelled"}
    if status_value not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status"
        )

    doctor_id = str(current_user["_id"])
    doctor_name = (current_user.get("name") or "").strip()

    query_conditions = [{"assigned_doctor_id": doctor_id}]
    if doctor_name:
        escaped_name = re.escape(doctor_name)
        query_conditions.append({"doctor": {"$regex": f"^{escaped_name}$", "$options": "i"}})

    appointment = await db.appointments.find_one({
        "_id": ObjectId(appointment_id),
        "$or": query_conditions
    })

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {
            "$set": {
                "status": status_value,
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {
        "message": "Appointment status updated successfully",
        "appointment_id": appointment_id,
        "status": status_value
    }
