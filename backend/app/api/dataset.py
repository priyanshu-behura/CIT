from typing import List
from fastapi import APIRouter
from app.models.schemas import (
    DatasetSummary,
    RoomItem,
    FacultyItem,
    StudentGroupItem,
    CourseItem,
    SessionItem,
    BookingRequestItem,
    ExamItem,
)
from app.services.dataset_service import dataset_service

router = APIRouter(prefix="/dataset", tags=["Dataset"])


@router.get("/summary", response_model=DatasetSummary)
def get_dataset_summary() -> DatasetSummary:
    """Returns actual counts and structural distribution metrics of CIT dataset."""
    return dataset_service.get_summary()


@router.get("/rooms", response_model=List[RoomItem])
def get_rooms() -> List[RoomItem]:
    """Returns list of campus rooms."""
    return dataset_service.get_rooms()


@router.get("/faculty", response_model=List[FacultyItem])
def get_faculty() -> List[FacultyItem]:
    """Returns list of faculty members with workload limits and preferences."""
    return dataset_service.get_faculty()


@router.get("/groups", response_model=List[StudentGroupItem])
def get_student_groups() -> List[StudentGroupItem]:
    """Returns list of student cohorts/groups."""
    return dataset_service.get_student_groups()


@router.get("/courses", response_model=List[CourseItem])
def get_courses() -> List[CourseItem]:
    """Returns list of academic courses."""
    return dataset_service.get_courses()


@router.get("/sessions", response_model=List[SessionItem])
def get_sessions() -> List[SessionItem]:
    """Returns list of all 189 teaching sessions to schedule."""
    return dataset_service.get_sessions()


@router.get("/bookings", response_model=List[BookingRequestItem])
def get_bookings() -> List[BookingRequestItem]:
    """Returns list of Spectra week booking requests."""
    return dataset_service.get_booking_requests()


@router.get("/exams", response_model=List[ExamItem])
def get_exams() -> List[ExamItem]:
    """Returns list of midsem exams."""
    return dataset_service.get_exams()

