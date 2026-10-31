import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from collections import Counter
from app.core.config import settings
from app.models.schemas import (
    DatasetSummary,
    DatasetCounts,
    RoomItem,
    FacultyItem,
    StudentGroupItem,
    CourseItem,
    SessionItem,
    BookingRequestItem,
    ExamItem,
)


class DatasetService:
    _instance: Optional["DatasetService"] = None

    def __init__(self, data_path: Optional[str] = None):
        self.data_path = Path(data_path or settings.DATASET_PATH)
        self._raw_data: Optional[Dict[str, Any]] = None
        self.load_data()

    @classmethod
    def get_instance(cls) -> "DatasetService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load_data(self) -> Dict[str, Any]:
        """Loads and parses cit_public.json directly from the verified source of truth."""
        if not self.data_path.exists():
            raise FileNotFoundError(f"Dataset file not found at: {self.data_path}")
        with open(self.data_path, "r", encoding="utf-8") as f:
            self._raw_data = json.load(f)
        return self._raw_data

    @property
    def raw_data(self) -> Dict[str, Any]:
        if self._raw_data is None:
            return self.load_data()
        return self._raw_data

    def get_summary(self) -> DatasetSummary:
        """Computes comprehensive dataset summary with actual counts and distributions."""
        data = self.raw_data
        
        rooms = data.get("rooms", [])
        faculty = data.get("faculty", [])
        student_groups = data.get("student_groups", [])
        courses = data.get("courses", [])
        sessions = data.get("sessions", [])
        booking_requests = data.get("booking_requests", [])
        cancellations = data.get("cancellations", [])
        exams = data.get("exams", [])
        room_unavailability = data.get("room_unavailability", [])

        # Total teaching hours: sum of durations of all scheduled sessions
        total_teaching_hours = sum(s.get("duration", 1) for s in sessions)
        
        # Room types distribution
        room_types = dict(Counter(r.get("type", "unknown") for r in rooms))
        
        # Session kinds distribution (lecture, tutorial, lab)
        session_kinds = dict(Counter(s.get("kind", "unknown") for s in sessions))
        
        # Faculty department distribution
        faculty_departments = dict(Counter(f.get("department", "unknown") for f in faculty))
        
        # Student groups by year
        student_group_years = dict(Counter(str(g.get("year", "unknown")) for g in student_groups))

        counts = DatasetCounts(
            rooms=len(rooms),
            faculty=len(faculty),
            student_groups=len(student_groups),
            courses=len(courses),
            sessions=len(sessions),
            total_teaching_hours=total_teaching_hours,
            booking_requests=len(booking_requests),
            cancellations=len(cancellations),
            active_booking_requests=len(booking_requests) - len(cancellations),
            exams=len(exams),
            room_unavailability=len(room_unavailability),
        )

        return DatasetSummary(
            dataset_id=data.get("dataset_id", "unknown"),
            institute=data.get("institute", "Unknown Institute"),
            counts=counts,
            priority_order=data.get("priority_order", []),
            role_category_cap=data.get("role_category_cap", {}),
            room_types=room_types,
            session_kinds=session_kinds,
            faculty_departments=faculty_departments,
            student_group_years=student_group_years,
            calendar=data.get("calendar", {}),
        )

    def get_rooms(self) -> List[RoomItem]:
        return [RoomItem(**r) for r in self.raw_data.get("rooms", [])]

    def get_faculty(self) -> List[FacultyItem]:
        return [FacultyItem(**f) for f in self.raw_data.get("faculty", [])]

    def get_student_groups(self) -> List[StudentGroupItem]:
        return [StudentGroupItem(**g) for g in self.raw_data.get("student_groups", [])]

    def get_courses(self) -> List[CourseItem]:
        return [CourseItem(**c) for c in self.raw_data.get("courses", [])]

    def get_sessions(self) -> List[SessionItem]:
        return [SessionItem(**s) for s in self.raw_data.get("sessions", [])]

    def get_booking_requests(self) -> List[BookingRequestItem]:
        cancelled_ids = {c.get("request_id") for c in self.raw_data.get("cancellations", [])}
        items = []
        for req in self.raw_data.get("booking_requests", []):
            item_dict = dict(req)
            item_dict["is_cancelled"] = item_dict["id"] in cancelled_ids
            items.append(BookingRequestItem(**item_dict))
        return items

    def get_exams(self) -> List[ExamItem]:
        return [ExamItem(**e) for e in self.raw_data.get("exams", [])]


# Singleton instance accessor
dataset_service = DatasetService.get_instance()

