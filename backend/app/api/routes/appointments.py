"""
Appointment routes for managing patient appointments
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse, AppointmentListResponse
from app.database import get_database
from app.middleware.auth import get_current_patient


router = APIRouter()


@router.get("", response_model=AppointmentListResponse)
async def get_appointments(
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get all appointments for the current patient
    Optional filter by status (upcoming, completed, cancelled)
    """
    user_id = str(current_user["_id"])
    
    # Build query
    query = {"user_id": user_id}
    if status_filter:
        query["status"] = status_filter
    
    # Fetch appointments
    appointments_cursor = db.appointments.find(query).sort("date", 1)
    appointments = await appointments_cursor.to_list(length=None)
    
    # Convert ObjectId and datetime to JSON-serializable format
    for apt in appointments:
        apt["id"] = str(apt["_id"])
        del apt["_id"]
        apt["user_id"] = str(apt["user_id"])
        if "created_at" in apt:
            apt["created_at"] = apt["created_at"].isoformat()
        if "updated_at" in apt:
            apt["updated_at"] = apt["updated_at"].isoformat()
    
    return {
        "appointments": appointments,
        "total": len(appointments)
    }


@router.post("", response_model=AppointmentResponse)
async def create_appointment(
    appointment: AppointmentCreate,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Create a new appointment
    """
    user_id = str(current_user["_id"])
    
    # Prepare appointment document
    appointment_doc = {
        "user_id": user_id,
        "title": appointment.title,
        "type": appointment.type,
        "date": appointment.date,
        "time": appointment.time,
        "doctor": appointment.doctor,
        "location": appointment.location,
        "notes": appointment.notes,
        "reminder": appointment.reminder,
        "status": "upcoming",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert into database
    result = await db.appointments.insert_one(appointment_doc)
    
    # Fetch the created appointment
    created_appointment = await db.appointments.find_one({"_id": result.inserted_id})
    
    # Convert to JSON-serializable format
    created_appointment["id"] = str(created_appointment["_id"])
    del created_appointment["_id"]
    created_appointment["user_id"] = str(created_appointment["user_id"])
    created_appointment["created_at"] = created_appointment["created_at"].isoformat()
    created_appointment["updated_at"] = created_appointment["updated_at"].isoformat()
    
    return {
        "message": "Appointment created successfully",
        "appointment": created_appointment
    }


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get a specific appointment by ID
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid appointment ID"
        )
    
    # Fetch appointment
    appointment = await db.appointments.find_one({
        "_id": ObjectId(appointment_id),
        "user_id": user_id
    })
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Convert ObjectId and datetime to JSON-serializable format
    appointment["id"] = str(appointment["_id"])
    del appointment["_id"]
    appointment["user_id"] = str(appointment["user_id"])
    if "created_at" in appointment:
        appointment["created_at"] = appointment["created_at"].isoformat()
    if "updated_at" in appointment:
        appointment["updated_at"] = appointment["updated_at"].isoformat()
    
    return {
        "message": "Appointment retrieved successfully",
        "appointment": appointment
    }


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    appointment_update: AppointmentUpdate,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Update an existing appointment
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid appointment ID"
        )
    
    # Check if appointment exists and belongs to user
    existing = await db.appointments.find_one({
        "_id": ObjectId(appointment_id),
        "user_id": user_id
    })
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Prepare update document (only update provided fields)
    update_data = appointment_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    # Update appointment
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": update_data}
    )
    
    # Fetch updated appointment
    updated_appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    
    # Convert ObjectId and datetime to JSON-serializable format
    updated_appointment["id"] = str(updated_appointment["_id"])
    del updated_appointment["_id"]
    updated_appointment["user_id"] = str(updated_appointment["user_id"])
    if "created_at" in updated_appointment:
        updated_appointment["created_at"] = updated_appointment["created_at"].isoformat()
    if "updated_at" in updated_appointment:
        updated_appointment["updated_at"] = updated_appointment["updated_at"].isoformat()
    
    return {
        "message": "Appointment updated successfully",
        "appointment": updated_appointment
    }


@router.delete("/{appointment_id}")
async def delete_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Delete an appointment
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid appointment ID"
        )
    
    # Check if appointment exists and belongs to user
    existing = await db.appointments.find_one({
        "_id": ObjectId(appointment_id),
        "user_id": user_id
    })
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Delete appointment
    await db.appointments.delete_one({"_id": ObjectId(appointment_id)})
    
    return {
        "message": "Appointment deleted successfully",
        "appointment_id": appointment_id
    }


@router.patch("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: str,
    status: str,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Update appointment status (upcoming, completed, cancelled)
    """
    user_id = str(current_user["_id"])
    
    # Validate status
    if status not in ["upcoming", "completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be 'upcoming', 'completed', or 'cancelled'"
        )
    
    # Validate ObjectId
    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid appointment ID"
        )
    
    # Check if appointment exists and belongs to user
    existing = await db.appointments.find_one({
        "_id": ObjectId(appointment_id),
        "user_id": user_id
    })
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Update status
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    return {
        "message": f"Appointment status updated to {status}",
        "appointment_id": appointment_id,
        "status": status
    }
