"""
Patient-specific routes: dashboard, biometrics, alerts, achievements
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta
from typing import Optional, List
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import BiometricEntry, BiometricResponse, DashboardSummary, AlertResponse, AchievementResponse
from app.database import get_database
from app.middleware.auth import get_current_patient
from app.services.alerts import check_and_create_alert


router = APIRouter()


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
