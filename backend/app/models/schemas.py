from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    project_name: str
    version: str
    ortools_available: bool
    ortools_version: Optional[str] = None
    dataset_loaded: bool
    dataset_id: Optional[str] = None


class DatasetCounts(BaseModel):
    rooms: int = Field(..., description="Total available rooms")
    faculty: int = Field(..., description="Total faculty members")
    student_groups: int = Field(..., description="Total student groups/cohorts")
    courses: int = Field(..., description="Total distinct courses")
    sessions: int = Field(..., description="Total sessions to schedule")
    total_teaching_hours: int = Field(..., description="Total weekly teaching hours (sum of session durations)")
    booking_requests: int = Field(..., description="Total Spectra week booking requests submitted")
    cancellations: int = Field(..., description="Total booking cancellations")
    active_booking_requests: int = Field(..., description="Active (non-cancelled) booking requests")
    exams: int = Field(..., description="Total midsem exams to schedule")
    room_unavailability: int = Field(..., description="Configured room unavailability blocks")


class DatasetSummary(BaseModel):
    dataset_id: str
    institute: str
    counts: DatasetCounts
    priority_order: List[str]
    role_category_cap: Dict[str, str]
    room_types: Dict[str, int]
    session_kinds: Dict[str, int]
    faculty_departments: Dict[str, int]
    student_group_years: Dict[str, int]
    calendar: Dict[str, Any]


class RoomItem(BaseModel):
    id: str
    name: str
    building: str
    type: str
    capacity: int
    features: List[str]
    accessible: bool
    allowed_uses: List[str]


class FacultyItem(BaseModel):
    id: str
    name: str
    department: str
    max_hours_per_day: int
    needs_accessible: bool
    unavailable: List[Dict[str, Any]]
    preferences: List[Dict[str, Any]]


class StudentGroupItem(BaseModel):
    id: str
    name: str
    year: int
    department: str
    size: int
    needs_accessible: bool


class CourseItem(BaseModel):
    id: str
    title: str
    department: str
    year: int
    lecture_hours: int
    tutorial_hours: int
    lab_blocks: int


class SessionItem(BaseModel):
    id: str
    course_id: str
    kind: str
    groups: List[str]
    faculty_id: str
    size: int
    duration: int
    room_types: List[str]
    needs_accessible: bool
    basket_slot: Optional[str] = None
    fixed_slot: Optional[Dict[str, Any]] = None


class BookingRequestItem(BaseModel):
    id: str
    submitted_at: str
    requester: str
    role: str
    department: Optional[str] = None
    requested_category: str
    title: str
    attendance: int
    duration_periods: int
    windows: List[Dict[str, Any]]
    room_types: List[str]
    needs: List[str]
    requested_room: Optional[str] = None
    mandatory_for_groups: List[str]
    series_id: Optional[str] = None
    raw_text: str
    is_cancelled: bool = False


class ExamItem(BaseModel):
    id: str
    course_ids: List[str]
    groups: List[str]
    size: int
    duration_hours: int

