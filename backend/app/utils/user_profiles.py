"""
Helpers for user profile serialization and doctor assignment validation
"""
from typing import Any, Optional

from bson import ObjectId
from fastapi import HTTPException, status


def normalize_doctor_specialty(specialty: Any) -> Optional[str]:
    """Normalize a doctor specialty label."""
    if specialty is None:
        return None

    cleaned_specialty = str(specialty).strip()
    return cleaned_specialty or None


def normalize_emergency_contact(emergency_contact: Any) -> Optional[dict]:
    """Normalize emergency contact data to a consistent object shape."""
    if not emergency_contact:
        return None

    if isinstance(emergency_contact, str):
        cleaned_name = emergency_contact.strip()
        return {"name": cleaned_name, "relationship": None, "phone": None} if cleaned_name else None

    if isinstance(emergency_contact, dict):
        normalized = {
            "name": (emergency_contact.get("name") or "").strip() or None,
            "relationship": (emergency_contact.get("relationship") or "").strip() or None,
            "phone": (emergency_contact.get("phone") or "").strip() or None,
        }
        if any(normalized.values()):
            return normalized

    return None


def normalize_profile(profile: Optional[dict]) -> dict:
    """Normalize user profile payloads for API responses."""
    profile = profile or {}
    return {
        "date_of_birth": profile.get("date_of_birth") or None,
        "gender": profile.get("gender") or None,
        "address": profile.get("address") or None,
        "blood_type": profile.get("blood_type") or None,
        "height": profile.get("height"),
        "weight": profile.get("weight"),
        "allergies": [entry for entry in (profile.get("allergies") or []) if entry],
        "emergency_contact": normalize_emergency_contact(profile.get("emergency_contact")),
    }


def serialize_doctor_reference(doctor: Optional[dict]) -> Optional[dict]:
    """Serialize a doctor document for lightweight selection payloads."""
    if not doctor:
        return None

    return {
        "_id": str(doctor["_id"]),
        "name": doctor.get("name", "Doctor"),
        "email": doctor.get("email", ""),
        "specialty": normalize_doctor_specialty(doctor.get("specialty")),
    }


def serialize_user_profile(user: dict, assigned_doctor: Optional[dict] = None) -> dict:
    """Serialize a user document with normalized profile information."""
    return {
        "_id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "patient"),
        "active": user.get("active", True),
        "created_at": user.get("created_at"),
        "phone": user.get("phone"),
        "specialty": normalize_doctor_specialty(user.get("specialty")),
        "profile": normalize_profile(user.get("profile")),
        "assigned_doctor_id": str(user.get("assigned_doctor_id")) if user.get("assigned_doctor_id") else None,
        "assigned_doctor": assigned_doctor,
    }


async def resolve_doctor_assignment(db, doctor_id: Optional[str]) -> tuple[Optional[str], Optional[dict]]:
    """Validate a doctor assignment and return the canonical doctor id and serialized reference."""
    if not doctor_id:
        return None, None

    if not ObjectId.is_valid(doctor_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid doctor selection"
        )

    doctor = await db.users.find_one(
        {"_id": ObjectId(doctor_id), "role": "doctor", "active": True},
        {"name": 1, "email": 1, "specialty": 1}
    )

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected doctor not found"
        )

    return str(doctor["_id"]), serialize_doctor_reference(doctor)


def parse_object_id(raw_id: str, label: str) -> ObjectId:
    """Parse a string id into ObjectId or raise an HTTP 400 error."""
    if not ObjectId.is_valid(raw_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {label} ID"
        )

    return ObjectId(raw_id)