"""
Alert Generation Service
Checks biometric values against thresholds and creates alerts
"""
from datetime import datetime
from typing import Optional
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))
from config import settings


# Default thresholds for each metric
METRIC_THRESHOLDS = {
    "heart_rate": {
        "min": settings.alert_heart_rate_min,
        "max": settings.alert_heart_rate_max,
        "unit": "bpm"
    },
    "blood_pressure_systolic": {
        "max": settings.alert_blood_pressure_systolic_max,
        "unit": "mmHg"
    },
    "blood_pressure_diastolic": {
        "max": settings.alert_blood_pressure_diastolic_max,
        "unit": "mmHg"
    },
    "blood_glucose": {
        "min": settings.alert_blood_glucose_min,
        "max": settings.alert_blood_glucose_max,
        "unit": "mg/dL"
    },
    # Steps, calories, sleep_hours typically don't need alerts for high values
    # but we can add them if needed
}


async def check_and_create_alert(
    db,
    user_id: str,
    metric: str,
    value: float,
    timestamp: datetime
) -> Optional[dict]:
    """
    Check if biometric value exceeds thresholds and create alert if needed
    
    Args:
        db: Database connection
        user_id: User ID
        metric: Metric type (heart_rate, blood_glucose, etc.)
        value: Measured value
        timestamp: When measurement was taken
    
    Returns:
        Alert document if created, None otherwise
    """
    # Check if this metric has thresholds
    if metric not in METRIC_THRESHOLDS:
        return None
    
    thresholds = METRIC_THRESHOLDS[metric]
    alert_triggered = False
    threshold_exceeded = None
    severity = None
    message = None
    
    # Check minimum threshold
    if "min" in thresholds and value < thresholds["min"]:
        alert_triggered = True
        threshold_exceeded = thresholds["min"]
        severity = _calculate_severity(value, thresholds["min"], is_below=True)
        message = f"⚠️ {metric.replace('_', ' ').title()} is below normal range: {value} {thresholds['unit']} (minimum: {thresholds['min']} {thresholds['unit']})"
    
    # Check maximum threshold
    elif "max" in thresholds and value > thresholds["max"]:
        alert_triggered = True
        threshold_exceeded = thresholds["max"]
        severity = _calculate_severity(value, thresholds["max"], is_below=False)
        message = f"⚠️ {metric.replace('_', ' ').title()} is above normal range: {value} {thresholds['unit']} (maximum: {thresholds['max']} {thresholds['unit']})"
    
    # Create alert if threshold was exceeded
    if alert_triggered:
        alert_doc = {
            "user_id": user_id,
            "metric": metric,
            "value": value,
            "threshold": threshold_exceeded,
            "severity": severity,
            "message": message,
            "acknowledged": False,
            "created_at": timestamp
        }
        
        result = await db.alerts.insert_one(alert_doc)
        alert_doc["_id"] = str(result.inserted_id)
        
        print(f"🚨 Alert created for user {user_id}: {message}")
        return alert_doc
    
    return None


def _calculate_severity(value: float, threshold: float, is_below: bool) -> str:
    """
    Calculate alert severity based on how far value deviates from threshold
    
    Args:
        value: Measured value
        threshold: Threshold value
        is_below: True if value is below threshold, False if above
    
    Returns:
        Severity level: "low", "medium", or "high"
    """
    if is_below:
        deviation_percent = ((threshold - value) / threshold) * 100
    else:
        deviation_percent = ((value - threshold) / threshold) * 100
    
    # Severity levels based on deviation percentage
    if deviation_percent >= 30:
        return "high"
    elif deviation_percent >= 15:
        return "medium"
    else:
        return "low"


async def get_user_thresholds(db, user_id: str) -> dict:
    """
    Get custom thresholds for a user (if they exist)
    Falls back to default thresholds
    
    Args:
        db: Database connection
        user_id: User ID
    
    Returns:
        Dictionary of thresholds for each metric
    """
    # Check if user has custom thresholds
    user_settings = await db.user_settings.find_one({"user_id": user_id})
    
    if user_settings and "alert_thresholds" in user_settings:
        # Merge custom thresholds with defaults
        custom_thresholds = user_settings["alert_thresholds"]
        merged = METRIC_THRESHOLDS.copy()
        
        for metric, thresholds in custom_thresholds.items():
            if metric in merged:
                merged[metric].update(thresholds)
        
        return merged
    
    return METRIC_THRESHOLDS


async def acknowledge_alert(db, alert_id: str, acknowledged_by: str) -> bool:
    """
    Mark an alert as acknowledged
    
    Args:
        db: Database connection
        alert_id: Alert ID
        acknowledged_by: User ID who acknowledged
    
    Returns:
        True if successful, False otherwise
    """
    result = await db.alerts.update_one(
        {"_id": alert_id},
        {
            "$set": {
                "acknowledged": True,
                "acknowledged_at": datetime.utcnow(),
                "acknowledged_by": acknowledged_by
            }
        }
    )
    
    return result.modified_count > 0


async def get_critical_alerts(db, user_id: str, limit: int = 10) -> list:
    """
    Get unacknowledged high-severity alerts for a user
    
    Args:
        db: Database connection
        user_id: User ID
        limit: Maximum number of alerts to return
    
    Returns:
        List of critical alert documents
    """
    cursor = db.alerts.find({
        "user_id": user_id,
        "acknowledged": False,
        "severity": "high"
    }).sort("created_at", -1).limit(limit)
    
    alerts = []
    async for alert in cursor:
        alert["_id"] = str(alert["_id"])
        alerts.append(alert)
    
    return alerts
