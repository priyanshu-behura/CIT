import pytest
from app.services.dataset_service import DatasetService


def test_dataset_file_exists_and_loads():
    service = DatasetService()
    raw = service.raw_data
    assert raw is not None
    assert raw.get("dataset_id") == "cit-public-v1"
    assert "Chilika Institute of Technology" in raw.get("institute", "")


def test_dataset_summary_actual_counts():
    service = DatasetService()
    summary = service.get_summary()

    # Exact expected counts according to official CIT dataset specification
    assert summary.counts.rooms == 27
    assert summary.counts.faculty == 40
    assert summary.counts.student_groups == 14
    assert summary.counts.courses == 62
    assert summary.counts.sessions == 189
    assert summary.counts.total_teaching_hours == 243
    assert summary.counts.booking_requests == 25
    assert summary.counts.cancellations == 1
    assert summary.counts.active_booking_requests == 24
    assert summary.counts.exams == 41
    assert summary.counts.room_unavailability == 2


def test_ortools_installed_and_importable():
    """Verify Google OR-Tools is properly installed for the upcoming scheduling engine."""
    import ortools
    from ortools.sat.python import cp_model
    assert ortools.__version__ is not None
    model = cp_model.CpModel()
    assert model is not None


def test_entity_relationships_and_referential_integrity():
    service = DatasetService()
    raw = service.raw_data

    faculty_ids = {f["id"] for f in raw["faculty"]}
    room_types = {r["type"] for r in raw["rooms"]}
    group_ids = {g["id"] for g in raw["student_groups"]}
    course_ids = {c["id"] for c in raw["courses"]}

    # All sessions reference valid faculty, groups, courses, and allowed room types
    for s in raw["sessions"]:
        assert s["faculty_id"] in faculty_ids, f"Unknown faculty {s['faculty_id']} in session {s['id']}"
        assert s["course_id"] in course_ids, f"Unknown course {s['course_id']} in session {s['id']}"
        for g in s["groups"]:
            assert g in group_ids, f"Unknown group {g} in session {s['id']}"
        for rt in s["room_types"]:
            assert rt in room_types, f"Session {s['id']} requests room type {rt} which is not among campus room types"


def test_cancellation_tracking():
    service = DatasetService()
    requests = service.get_booking_requests()
    assert len(requests) == 25
    cancelled = [r for r in requests if r.is_cancelled]
    assert len(cancelled) == 1
    assert cancelled[0].id == "BR-04"
