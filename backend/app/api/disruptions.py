from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.services.disruption_service import disruption_service
from app.api.auth import get_current_user

router = APIRouter(prefix="/disruptions", tags=["Disruption Management & Rescheduling"])


class CreateDisruptionRequest(BaseModel):
    id: str = Field(..., min_length=3)
    title: str = Field(..., min_length=5)
    description: str = Field(default="")
    changes: List[Dict[str, Any]] = Field(...)


@router.get("")
def list_disruptions():
    """Retrieve all logged campus disruptions and their rescheduling proposals."""
    return disruption_service.get_all_disruptions()


@router.post("")
def create_disruption(req: CreateDisruptionRequest, current_user: Optional[Dict[str, Any]] = None):
    """Log a new disruption scenario (e.g. faculty sudden leave or room closure)."""
    return disruption_service.create_disruption(
        disruption_id=req.id,
        title=req.title,
        description=req.description,
        changes=req.changes
    )


@router.post("/{disruption_id}/simulate")
def simulate_rescheduling(disruption_id: str):
    """
    Simulate minimal-movement rescheduling using Google OR-Tools CP-SAT.
    Calculates exact session movements, time/room diffs, and affected cohorts.
    Does NOT alter the live active schedule until Admin approval.
    """
    try:
        return disruption_service.simulate_rescheduling(disruption_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{disruption_id}/approve")
def approve_and_commit(
    disruption_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Admin-only action to commit a proposed rescheduling into the active timetable.
    Exports to exports/schedule_after.json and broadcasts notifications.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized: Only an Administrator can approve and commit a revised schedule.")

    try:
        res = disruption_service.approve_and_commit(disruption_id, current_user["email"])
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

