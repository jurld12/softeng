"""
Medication routes: CRUD operations for patient medications
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))
from app.models.schemas import MedicationCreate, MedicationUpdate, MedicationResponse
from app.database import get_database
from app.middleware.auth import get_current_patient


router = APIRouter()


@router.get("/me/medications", response_model=List[MedicationResponse])
async def get_medications(
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get all medications for the current patient
    """
    user_id = str(current_user["_id"])
    
    cursor = db.medications.find({"user_id": user_id}).sort("created_at", -1)
    
    medications = []
    async for med in cursor:
        med_id = str(med["_id"])
        med["id"] = med_id
        med["_id"] = med_id
        medications.append(med)
    
    return medications


@router.post("/me/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(
    medication: MedicationCreate,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Create a new medication entry
    """
    user_id = str(current_user["_id"])
    
    medication_doc = {
        "user_id": user_id,
        "name": medication.name,
        "dosage": medication.dosage,
        "frequency": medication.frequency,
        "time_of_day": medication.time_of_day,
        "instructions": medication.instructions,
        "start_date": medication.start_date,
        "end_date": medication.end_date,
        "active": medication.active,
        "created_at": datetime.utcnow()
    }
    
    result = await db.medications.insert_one(medication_doc)
    med_id = str(result.inserted_id)
    medication_doc["id"] = med_id
    medication_doc["_id"] = med_id
    
    return medication_doc


@router.get("/me/medications/{medication_id}", response_model=MedicationResponse)
async def get_medication(
    medication_id: str,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Get a specific medication by ID
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId format
    try:
        obj_id = ObjectId(medication_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid medication ID format"
        )
    
    medication = await db.medications.find_one({
        "_id": obj_id,
        "user_id": user_id
    })
    
    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    med_id = str(medication["_id"])
    medication["id"] = med_id
    medication["_id"] = med_id
    return medication


@router.put("/me/medications/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    medication_id: str,
    medication_update: MedicationUpdate,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Update a medication
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId format
    try:
        obj_id = ObjectId(medication_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid medication ID format"
        )
    
    # Check if medication exists and belongs to user
    existing = await db.medications.find_one({
        "_id": obj_id,
        "user_id": user_id
    })
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    # Build update document
    update_doc = {}
    if medication_update.name is not None:
        update_doc["name"] = medication_update.name
    if medication_update.dosage is not None:
        update_doc["dosage"] = medication_update.dosage
    if medication_update.frequency is not None:
        update_doc["frequency"] = medication_update.frequency
    if medication_update.time_of_day is not None:
        update_doc["time_of_day"] = medication_update.time_of_day
    if medication_update.instructions is not None:
        update_doc["instructions"] = medication_update.instructions
    if medication_update.start_date is not None:
        update_doc["start_date"] = medication_update.start_date
    if medication_update.end_date is not None:
        update_doc["end_date"] = medication_update.end_date
    if medication_update.active is not None:
        update_doc["active"] = medication_update.active
    
    if not update_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No updates provided"
        )
    
    # Update medication
    await db.medications.update_one(
        {"_id": obj_id, "user_id": user_id},
        {"$set": update_doc}
    )
    
    # Return updated medication
    updated_med = await db.medications.find_one({"_id": obj_id})
    med_id = str(updated_med["_id"])
    updated_med["id"] = med_id
    updated_med["_id"] = med_id
    
    return updated_med


@router.delete("/me/medications/{medication_id}")
async def delete_medication(
    medication_id: str,
    current_user: dict = Depends(get_current_patient),
    db = Depends(get_database)
):
    """
    Delete a medication
    """
    user_id = str(current_user["_id"])
    
    # Validate ObjectId format
    try:
        obj_id = ObjectId(medication_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid medication ID format"
        )
    
    # Check if medication exists and belongs to user
    medication = await db.medications.find_one({
        "_id": obj_id,
        "user_id": user_id
    })
    
    if not medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medication not found"
        )
    
    # Delete medication
    await db.medications.delete_one({"_id": obj_id, "user_id": user_id})
    
    return {"message": "Medication deleted successfully"}
