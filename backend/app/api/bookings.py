from fastapi import APIRouter, HTTPException, Depends, Query, Header
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List, Union
from app.services.booking_service import booking_service
from app.services.nlp_booking_service import nlp_booking_service
from app.api.auth import get_current_user

router = APIRouter(prefix="/bookings", tags=["Venue Bookings & Spectra Week"])


class CreateBookingRequest(BaseModel):
    title: str = Field(..., min_length=3)
    description: Optional[str] = ""
    requested_category: str = Field(default="club_event")
    attendance: int = Field(..., gt=0, description="Estimated attendance (must be greater than 0)")
    duration_periods: Optional[int] = Field(default=None, ge=1, le=12)
    day: str = Field(default="MON")
    start_period: int = Field(default=6, ge=1, le=13)
    end_period: int = Field(default=8, ge=1, le=13)
    room_types: List[str] = Field(default=["classroom"])
    needs: List[str] = Field(default=[])
    preferred_room_id: Optional[str] = None
    mandatory_for_groups: Optional[List[str]] = []

    @field_validator("start_period", "end_period", mode="before")
    @classmethod
    def parse_period_int(cls, v: Any) -> int:
        if isinstance(v, str):
            clean = v.upper().replace("P", "").strip()
            try:
                return int(clean)
            except ValueError:
                raise ValueError(f"Invalid period format: '{v}'")
        return int(v)


class BookingDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(approved|rejected|alternative_offered)$")
    reason: str = Field(..., min_length=3)
    assigned_room_id: Optional[str] = None
    assigned_day: Optional[str] = None
    assigned_start_period: Optional[int] = None
    assigned_end_period: Optional[int] = None


class NLPParseRequest(BaseModel):
    prompt: str = Field(..., min_length=5)
    reference_date: Optional[str] = Field(default=None, description="ISO format YYYY-MM-DD reference date for resolving relative days like kal, aaj, parso")



@router.get("")
def list_bookings(
    status: Optional[str] = Query(None),
    role: Optional[str] = Query(None)
):
    """Retrieve all booking requests from SQLite database."""
    return booking_service.get_all_bookings(status=status, role=role)


@router.post("")
def create_booking(
    req: CreateBookingRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Submit a new booking request.
    Strictly requires authentication. Identity is derived strictly from the verified JWT token.
    Calculates effective category by applying server-side role caps.
    """
    user_name = current_user["full_name"]
    user_email = current_user["email"]
    user_role = current_user["role"]

    if req.end_period < req.start_period:
        raise HTTPException(status_code=422, detail="End period cannot be earlier than start period")

    day_clean = req.day.upper().strip()
    valid_days = {"MON", "TUE", "WED", "THU", "FRI", "SAT"}
    if day_clean not in valid_days:
        raise HTTPException(status_code=422, detail=f"Invalid day '{req.day}'. Must be one of {sorted(list(valid_days))}")

    duration = req.duration_periods
    if duration is None:
        duration = max(1, req.end_period - req.start_period + 1)

    res = booking_service.create_booking(
        requester_name=user_name,
        requester_email=user_email,
        role=user_role,
        title=req.title,
        description=req.description or "",
        requested_category=req.requested_category,
        attendance=req.attendance,
        duration_periods=duration,
        day=day_clean,
        start_period=req.start_period,
        end_period=req.end_period,
        room_types=req.room_types,
        needs=req.needs,
        preferred_room_id=req.preferred_room_id,
        mandatory_for_groups=req.mandatory_for_groups
    )
    return res


@router.post("/{booking_id}/decision")
def make_decision(
    booking_id: str,
    req: BookingDecisionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Approve, reject, or offer alternative for a booking request.
    STRICTLY ENFORCES NO SELF-APPROVAL: users cannot approve their own requests.
    Only Admin or Department Coordinator can execute approvals.
    """
    try:
        res = booking_service.process_decision(
            booking_id=booking_id,
            decision=req.decision,
            decided_by_email=current_user["email"],
            decided_by_role=current_user["role"],
            reason=req.reason,
            assigned_room_id=req.assigned_room_id,
            assigned_day=req.assigned_day,
            assigned_start_period=req.assigned_start_period,
            assigned_end_period=req.assigned_end_period
        )
        return res
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/nlp-parse")
def parse_natural_language_booking(req: NLPParseRequest):
    """
    Parse English or Hinglish natural-language prompt and extract structured booking parameters.
    User reviews and confirms draft in the UI before submission.
    """
    extracted = nlp_booking_service.parse_booking_prompt(req.prompt, req.reference_date)
    return extracted


@router.get("/spectra")
def get_spectra_week_bookings():
    """
    Retrieve all 25 official Spectra Week booking requests from cit_public.json
    with official priority ranks, cancelled status for BR-04, and decisions.
    """
    bookings = booking_service.get_all_bookings()
    official_ids = {r["id"] for r in booking_service.dataset.get("booking_requests", [])}
    spectra = [b for b in bookings if str(b["id"]) in official_ids]
    # Sort by official order in dataset
    order_map = {r["id"]: i for i, r in enumerate(booking_service.dataset.get("booking_requests", []))}
    spectra.sort(key=lambda x: order_map.get(x["id"], 999))

    return {
        "fest_week": "Week 7 (Spectra '27)",
        "total_requests": len(spectra),
        "cancelled_count": sum(1 for b in spectra if b["status"] == "cancelled"),
        "active_count": sum(1 for b in spectra if b["status"] != "cancelled"),
        "bookings": spectra
    }


@router.get("/alternatives")
def find_alternatives(
    attendance: int = Query(..., gt=0),
    room_types: str = Query("classroom,lecture_hall"),
    needs: Optional[str] = Query(""),
    day: str = Query("MON"),
    start_period: int = Query(6),
    end_period: int = Query(8)
):
    """Find compatible alternate campus venues for a specified slot."""
    rtypes = [t.strip() for t in room_types.split(",") if t.strip()]
    needs_list = [n.strip() for n in needs.split(",") if n.strip()] if needs else []
    return booking_service.find_alternative_venues(attendance, rtypes, needs_list, day, start_period, end_period)

