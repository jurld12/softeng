"""
Gamification service for points, badges, streaks, and achievements
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional


# Define badge configuration
BADGES = {
    "first_entry": {
        "name": "First Steps",
        "description": "Logged your first health data entry",
        "icon": "🎯",
        "points": 10
    },
    "week_streak": {
        "name": "Week Warrior",
        "description": "Logged data for 7 consecutive days",
        "icon": "🔥",
        "points": 50
    },
    "month_streak": {
        "name": "Monthly Champion",
        "description": "Logged data for 30 consecutive days",
        "icon": "🏆",
        "points": 200
    },
    "consistent_tracker": {
        "name": "Consistent Tracker",
        "description": "Logged 50 total entries",
        "icon": "📊",
        "points": 100
    },
    "data_master": {
        "name": "Data Master",
        "description": "Logged 100 total entries",
        "icon": "⭐",
        "points": 250
    },
    "heart_health": {
        "name": "Heart Health Guardian",
        "description": "Logged heart rate 20 times",
        "icon": "❤️",
        "points": 75
    },
    "step_crusher": {
        "name": "Step Crusher",
        "description": "Logged 10,000+ steps in a single day",
        "icon": "👟",
        "points": 50
    },
    "sleep_champion": {
        "name": "Sleep Champion",
        "description": "Logged 8+ hours of sleep",
        "icon": "😴",
        "points": 30
    },
    "wellness_warrior": {
        "name": "Wellness Warrior",
        "description": "Logged all metric types at least once",
        "icon": "💪",
        "points": 100
    }
}


# Points awarded for actions
POINTS_CONFIG = {
    "data_entry": 5,
    "complete_profile": 20,
    "daily_login": 2,
    "streak_day": 3
}


async def award_points(db, user_id: str, action: str, amount: Optional[int] = None) -> int:
    """
    Award points to a user for an action
    Returns the new total points
    """
    points = amount if amount else POINTS_CONFIG.get(action, 0)
    
    # Get or create user points record
    user_points = await db.user_points.find_one({"user_id": user_id})
    
    if not user_points:
        # Create new points record
        points_doc = {
            "user_id": user_id,
            "total_points": points,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.user_points.insert_one(points_doc)
        total_points = points
    else:
        # Update existing points
        new_total = user_points["total_points"] + points
        await db.user_points.update_one(
            {"user_id": user_id},
            {
                "$set": {"total_points": new_total, "updated_at": datetime.utcnow()}
            }
        )
        total_points = new_total
    
    # Log the point transaction
    transaction = {
        "user_id": user_id,
        "action": action,
        "points": points,
        "timestamp": datetime.utcnow()
    }
    await db.points_history.insert_one(transaction)
    
    return total_points


async def get_user_streak(db, user_id: str) -> int:
    """
    Calculate current streak (consecutive days with at least one entry)
    """
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Check if user has entry today or yesterday (grace period)
    yesterday = today - timedelta(days=1)
    recent_entry = await db.biometrics.find_one({
        "user_id": user_id,
        "timestamp": {"$gte": yesterday}
    })
    
    if not recent_entry:
        return 0
    
    # Count consecutive days backward
    streak = 0
    check_date = today
    
    for _ in range(365):  # Check up to 1 year back
        day_start = check_date
        day_end = check_date + timedelta(days=1)
        
        entry = await db.biometrics.find_one({
            "user_id": user_id,
            "timestamp": {"$gte": day_start, "$lt": day_end}
        })
        
        if entry:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    return streak


async def check_and_award_badges(db, user_id: str) -> List[Dict]:
    """
    Check if user has earned any new badges
    Returns list of newly awarded badges
    """
    newly_awarded = []
    
    # Get existing badges
    existing_badges = await db.user_badges.find({"user_id": user_id}).to_list(100)
    existing_badge_ids = [b["badge_id"] for b in existing_badges]
    
    # Get user statistics
    total_entries = await db.biometrics.count_documents({"user_id": user_id})
    current_streak = await get_user_streak(db, user_id)
    
    # Check each badge condition
    
    # First entry badge
    if "first_entry" not in existing_badge_ids and total_entries >= 1:
        await _award_badge(db, user_id, "first_entry")
        newly_awarded.append(BADGES["first_entry"])
    
    # Week streak badge
    if "week_streak" not in existing_badge_ids and current_streak >= 7:
        await _award_badge(db, user_id, "week_streak")
        newly_awarded.append(BADGES["week_streak"])
    
    # Month streak badge
    if "month_streak" not in existing_badge_ids and current_streak >= 30:
        await _award_badge(db, user_id, "month_streak")
        newly_awarded.append(BADGES["month_streak"])
    
    # Consistent tracker badge (50 entries)
    if "consistent_tracker" not in existing_badge_ids and total_entries >= 50:
        await _award_badge(db, user_id, "consistent_tracker")
        newly_awarded.append(BADGES["consistent_tracker"])
    
    # Data master badge (100 entries)
    if "data_master" not in existing_badge_ids and total_entries >= 100:
        await _award_badge(db, user_id, "data_master")
        newly_awarded.append(BADGES["data_master"])
    
    # Heart health badge (20 heart rate entries)
    heart_rate_count = await db.biometrics.count_documents({
        "user_id": user_id,
        "metric": "heart_rate"
    })
    if "heart_health" not in existing_badge_ids and heart_rate_count >= 20:
        await _award_badge(db, user_id, "heart_health")
        newly_awarded.append(BADGES["heart_health"])
    
    # Step crusher badge (10k+ steps in one day)
    high_steps = await db.biometrics.find_one({
        "user_id": user_id,
        "metric": "steps",
        "value": {"$gte": 10000}
    })
    if "step_crusher" not in existing_badge_ids and high_steps:
        await _award_badge(db, user_id, "step_crusher")
        newly_awarded.append(BADGES["step_crusher"])
    
    # Sleep champion badge (8+ hours sleep)
    good_sleep = await db.biometrics.find_one({
        "user_id": user_id,
        "metric": "sleep_hours",
        "value": {"$gte": 8}
    })
    if "sleep_champion" not in existing_badge_ids and good_sleep:
        await _award_badge(db, user_id, "sleep_champion")
        newly_awarded.append(BADGES["sleep_champion"])
    
    # Wellness warrior badge (all metric types logged)
    metric_types = ["heart_rate", "steps", "calories", "blood_glucose", "sleep_hours"]
    all_metrics_logged = True
    for metric in metric_types:
        count = await db.biometrics.count_documents({
            "user_id": user_id,
            "metric": metric
        })
        if count == 0:
            all_metrics_logged = False
            break
    
    if "wellness_warrior" not in existing_badge_ids and all_metrics_logged:
        await _award_badge(db, user_id, "wellness_warrior")
        newly_awarded.append(BADGES["wellness_warrior"])
    
    return newly_awarded


async def _award_badge(db, user_id: str, badge_id: str):
    """
    Award a badge to a user
    """
    badge_info = BADGES.get(badge_id)
    if not badge_info:
        return

    awarded_at = datetime.utcnow()
    
    badge_doc = {
        "user_id": user_id,
        "badge_id": badge_id,
        "name": badge_info["name"],
        "description": badge_info["description"],
        "icon": badge_info["icon"],
        "date_awarded": awarded_at
    }
    
    await db.user_badges.insert_one(badge_doc)

    achievement_doc = {
        "user_id": user_id,
        "type": "badge_unlock",
        "title": badge_info["name"],
        "description": badge_info["description"],
        "points": badge_info["points"],
        "badge_id": badge_id,
        "date_awarded": awarded_at
    }

    await db.achievements.insert_one(achievement_doc)
    
    # Award points for the badge
    await award_points(db, user_id, f"badge_{badge_id}", badge_info["points"])


async def get_user_points(db, user_id: str) -> Dict:
    """
    Get user's total points and rank
    """
    user_points = await db.user_points.find_one({"user_id": user_id})
    
    if not user_points:
        return {
            "total_points": 0,
            "rank": 0,
            "level": 1
        }
    
    total = user_points["total_points"]
    
    # Calculate rank (number of users with more points)
    rank = await db.user_points.count_documents({
        "total_points": {"$gt": total}
    }) + 1
    
    # Calculate level (every 100 points = 1 level)
    level = (total // 100) + 1
    
    return {
        "total_points": total,
        "rank": rank,
        "level": level
    }


async def get_user_badges(db, user_id: str) -> List[Dict]:
    """
    Get all badges earned by user
    """
    cursor = db.user_badges.find({"user_id": user_id}).sort("date_awarded", -1)
    
    badges = []
    async for badge in cursor:
        badge["_id"] = str(badge["_id"])
        badges.append(badge)
    
    return badges


async def get_gamification_summary(db, user_id: str) -> Dict:
    """
    Get complete gamification summary for user
    """
    points_info = await get_user_points(db, user_id)
    badges = await get_user_badges(db, user_id)
    streak = await get_user_streak(db, user_id)
    total_entries = await db.biometrics.count_documents({"user_id": user_id})
    
    return {
        "points": points_info,
        "badges": badges,
        "current_streak": streak,
        "total_entries": total_entries,
        "badges_earned": len(badges),
        "total_badges_available": len(BADGES)
    }
