"""
Patient-specific routes: dashboard, biometrics, alerts, achievements
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List
import sys
from pathlib import Path
import io

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import BiometricEntry, BiometricResponse, DashboardSummary, AlertResponse, AchievementResponse, PatientProfileUpdate, UserProfileResponse
from app.database import get_database
from app.middleware.auth import get_current_patient
from app.services.alerts import check_and_create_alert
from app.services.export import generate_csv_report, generate_pdf_report
from app.services import gamification
from app.utils.user_profiles import normalize_emergency_contact, parse_object_id, serialize_doctor_reference, serialize_user_profile, resolve_doctor_assignment


router = APIRouter()


@router.get("/me/profile", response_model=UserProfileResponse)
async def get_patient_profile(
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """Get the authenticated patient's full profile including doctor assignment."""
    assigned_doctor = None
    assigned_doctor_id = str(current_user.get("assigned_doctor_id")) if current_user.get("assigned_doctor_id") else None

    if assigned_doctor_id and ObjectId.is_valid(assigned_doctor_id):
        doctor = await db.users.find_one(
            {"_id": ObjectId(assigned_doctor_id), "role": "doctor", "active": True},
            {"name": 1, "email": 1, "specialty": 1}
        )
        assigned_doctor = serialize_doctor_reference(doctor)

    return serialize_user_profile(current_user, assigned_doctor)


@router.put("/me/profile", response_model=UserProfileResponse)
async def update_patient_profile(
    profile_data: PatientProfileUpdate,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """Update the authenticated patient's profile and doctor assignment."""
    user_object_id = parse_object_id(str(current_user["_id"]), "user")

    if profile_data.email != current_user.get("email"):
        existing_user = await db.users.find_one({
            "email": profile_data.email,
            "_id": {"$ne": user_object_id}
        })

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

    assigned_doctor_id, assigned_doctor = await resolve_doctor_assignment(db, profile_data.assigned_doctor_id)

    profile_doc = {
        "date_of_birth": profile_data.date_of_birth or None,
        "gender": profile_data.gender or None,
        "address": profile_data.address.strip() if profile_data.address else None,
        "blood_type": profile_data.blood_type or None,
        "height": profile_data.height,
        "weight": profile_data.weight,
        "allergies": [entry.strip() for entry in profile_data.allergies if entry and entry.strip()],
        "emergency_contact": normalize_emergency_contact(
            profile_data.emergency_contact.model_dump(exclude_none=True) if profile_data.emergency_contact else None
        )
    }

    await db.users.update_one(
        {"_id": user_object_id},
        {
            "$set": {
                "name": profile_data.name.strip(),
                "email": profile_data.email,
                "phone": profile_data.phone.strip() if profile_data.phone else None,
                "assigned_doctor_id": assigned_doctor_id,
                "profile": profile_doc
            }
        }
    )

    updated_user = await db.users.find_one({"_id": user_object_id})
    return serialize_user_profile(updated_user, assigned_doctor)


@router.get("/me/dashboard", response_model=DashboardSummary)
async def get_patient_dashboard(
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get patient dashboard summary with latest metrics, averages, and alerts
    """
    user_id = str(current_user["_id"])
    
    # Get latest metrics (most recent entry for each metric type)
    latest_metrics = {}
    metric_types = ["heart_rate", "steps", "calories", "blood_pressure_systolic", 
                    "blood_pressure_diastolic", "blood_glucose", "sleep_hours"]
    
    for metric in metric_types:
        latest = await db.biometrics.find_one(
            {"user_id": user_id, "metric": metric},
            sort=[("timestamp", -1)]
        )
        if latest:
            latest_metrics[metric] = {
                "value": latest["value"],
                "timestamp": latest["timestamp"]
            }
    
    # Calculate weekly averages (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_averages = await _calculate_averages(db, user_id, week_ago)
    
    # Calculate monthly averages (last 30 days)
    month_ago = datetime.utcnow() - timedelta(days=30)
    monthly_averages = await _calculate_averages(db, user_id, month_ago)
    
    # Get recent alerts (last 10 unacknowledged)
    alerts_cursor = db.alerts.find(
        {"user_id": user_id, "acknowledged": False}
    ).sort("created_at", -1).limit(10)
    
    recent_alerts = []
    async for alert in alerts_cursor:
        alert["_id"] = str(alert["_id"])
        recent_alerts.append(alert)
    
    # Count achievements
    total_achievements = await db.achievements.count_documents({"user_id": user_id})
    
    return DashboardSummary(
        latest_metrics=latest_metrics,
        weekly_averages=weekly_averages,
        monthly_averages=monthly_averages,
        recent_alerts=recent_alerts,
        total_achievements=total_achievements
    )


@router.post("/me/biometrics", response_model=BiometricResponse, status_code=status.HTTP_201_CREATED)
async def add_biometric_entry(
    entry: BiometricEntry,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Add a new biometric data entry
    """
    user_id = str(current_user["_id"])
    
    biometric_doc = {
        "user_id": user_id,
        "metric": entry.metric,
        "value": entry.value,
        "unit": entry.unit,
        "notes": entry.notes,
        "timestamp": entry.timestamp or datetime.utcnow()
    }
    
    result = await db.biometrics.insert_one(biometric_doc)
    biometric_doc["_id"] = str(result.inserted_id)
    
    # Check for alerts based on thresholds
    await check_and_create_alert(
        db, 
        user_id, 
        entry.metric, 
        entry.value, 
        biometric_doc["timestamp"]
    )
    
    # Award points for data entry
    await gamification.award_points(db, user_id, "data_entry")
    
    # Check and award badges
    newly_awarded_badges = await gamification.check_and_award_badges(db, user_id)
    
    # Add badge info to response (optional)
    if newly_awarded_badges:
        biometric_doc["badges_earned"] = newly_awarded_badges
    
    return biometric_doc


@router.get("/me/biometrics", response_model=List[BiometricResponse])
async def get_biometric_entries(
    metric: Optional[str] = Query(None, description="Filter by metric type"),
    from_date: Optional[datetime] = Query(None, description="Start date"),
    to_date: Optional[datetime] = Query(None, description="End date"),
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get biometric entries with optional filters
    """
    user_id = str(current_user["_id"])
    
    # Build query
    query = {"user_id": user_id}
    
    if metric:
        query["metric"] = metric
    
    if from_date or to_date:
        query["timestamp"] = {}
        if from_date:
            query["timestamp"]["$gte"] = from_date
        if to_date:
            query["timestamp"]["$lte"] = to_date
    
    # Fetch entries
    cursor = db.biometrics.find(query).sort("timestamp", -1).limit(limit)
    
    entries = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        entries.append(doc)
    
    return entries


@router.get("/me/alerts", response_model=List[AlertResponse])
async def get_patient_alerts(
    acknowledged: Optional[bool] = Query(None),
    severity: Optional[str] = Query(None, description="Filter by severity: low, medium, high"),
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get patient alerts with optional filters
    """
    user_id = str(current_user["_id"])
    
    query = {"user_id": user_id}
    if acknowledged is not None:
        query["acknowledged"] = acknowledged
    if severity:
        query["severity"] = severity
    
    cursor = db.alerts.find(query).sort("created_at", -1).limit(50)
    
    alerts = []
    async for alert in cursor:
        alert["_id"] = str(alert["_id"])
        alerts.append(alert)
    
    return alerts


@router.patch("/me/alerts/{alert_id}/acknowledge")
async def acknowledge_alert_endpoint(
    alert_id: str,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Acknowledge an alert
    """
    from app.services.alerts import acknowledge_alert
    
    user_id = str(current_user["_id"])
    
    # Verify alert belongs to current user
    alert = await db.alerts.find_one({"_id": alert_id})
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    if alert["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot acknowledge another user's alert"
        )
    
    success = await acknowledge_alert(db, alert_id, user_id)
    
    if success:
        return {"message": "Alert acknowledged successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to acknowledge alert"
        )
    alerts = []
    async for alert in cursor:
        alert["_id"] = str(alert["_id"])
        alerts.append(alert)
    
    return alerts


@router.get("/me/achievements", response_model=List[AchievementResponse])
async def get_patient_achievements(
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get patient achievements
    """
    user_id = str(current_user["_id"])
    
    cursor = db.achievements.find({"user_id": user_id}).sort("date_awarded", -1)
    
    achievements = []
    async for achievement in cursor:
        achievement["_id"] = str(achievement["_id"])
        achievements.append(achievement)
    
    return achievements


@router.get("/me/gamification")
async def get_gamification_summary(
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get complete gamification summary including points, badges, streaks
    """
    user_id = str(current_user["_id"])
    summary = await gamification.get_gamification_summary(db, user_id)
    return summary


@router.get("/me/points")
async def get_user_points(
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get user's points, rank, and level
    """
    user_id = str(current_user["_id"])
    points_info = await gamification.get_user_points(db, user_id)
    return points_info


@router.get("/me/badges")
async def get_user_badges(
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get all badges earned by user
    """
    user_id = str(current_user["_id"])
    badges = await gamification.get_user_badges(db, user_id)
    return {"badges": badges}


@router.get("/me/streak")
async def get_user_streak(
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get user's current streak (consecutive days with entries)
    """
    user_id = str(current_user["_id"])
    streak = await gamification.get_user_streak(db, user_id)
    return {"current_streak": streak}


@router.get("/me/export")
async def export_health_report(
    format: str = Query(..., description="Export format: csv or pdf"),
    from_date: Optional[datetime] = Query(None, description="Start date"),
    to_date: Optional[datetime] = Query(None, description="End date"),
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Export health report in CSV or PDF format
    """
    user_id = str(current_user["_id"])
    user_name = current_user.get("name", "Patient")
    
    # Validate format
    if format.lower() not in ['csv', 'pdf']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Must be 'csv' or 'pdf'"
        )
    
    # Build query for biometric data
    query = {"user_id": user_id}
    if from_date or to_date:
        query["timestamp"] = {}
        if from_date:
            query["timestamp"]["$gte"] = from_date
        if to_date:
            query["timestamp"]["$lte"] = to_date
    
    # Fetch biometric data
    cursor = db.biometrics.find(query).sort("timestamp", -1).limit(1000)
    biometrics = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        biometrics.append(doc)
    
    # Generate report based on format
    if format.lower() == 'csv':
        csv_content = generate_csv_report(biometrics, user_name)
        
        # Create filename with date range
        filename = f"healio_report_{user_name.replace(' ', '_')}"
        if from_date:
            filename += f"_from_{from_date.strftime('%Y%m%d')}"
        if to_date:
            filename += f"_to_{to_date.strftime('%Y%m%d')}"
        filename += ".csv"
        
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    else:  # PDF
        from_date_str = from_date.strftime('%Y-%m-%d') if from_date else None
        to_date_str = to_date.strftime('%Y-%m-%d') if to_date else None
        
        pdf_content = generate_pdf_report(biometrics, user_name, from_date_str, to_date_str)
        
        # Create filename with date range
        filename = f"healio_report_{user_name.replace(' ', '_')}"
        if from_date:
            filename += f"_from_{from_date.strftime('%Y%m%d')}"
        if to_date:
            filename += f"_to_{to_date.strftime('%Y%m%d')}"
        filename += ".pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )


# Helper function
async def _calculate_averages(db, user_id: str, from_date: datetime) -> dict:
    """Calculate average values for each metric since from_date"""
    averages = {}
    
    metric_types = ["heart_rate", "steps", "calories", "blood_glucose", "sleep_hours"]
    
    for metric in metric_types:
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "metric": metric,
                    "timestamp": {"$gte": from_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "average": {"$avg": "$value"},
                    "count": {"$sum": 1}
                }
            }
        ]
        
        result = await db.biometrics.aggregate(pipeline).to_list(1)
        
        if result:
            averages[metric] = {
                "average": round(result[0]["average"], 2),
                "count": result[0]["count"]
            }
    
    return averages
