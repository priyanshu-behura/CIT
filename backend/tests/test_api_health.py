import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "app" in data
    assert data["docs_url"] == "/docs"


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ortools_available"] is True
    assert data["ortools_version"] is not None
    assert data["dataset_loaded"] is True
    assert data["dataset_id"] == "cit-public-v1"


def test_v1_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_dataset_summary_api():
    response = client.get("/api/v1/dataset/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["dataset_id"] == "cit-public-v1"
    counts = data["counts"]
    assert counts["rooms"] == 27
    assert counts["faculty"] == 40
    assert counts["student_groups"] == 14
    assert counts["courses"] == 62
    assert counts["sessions"] == 189
    assert counts["total_teaching_hours"] == 243
    assert counts["booking_requests"] == 25
    assert counts["cancellations"] == 1
    assert counts["active_booking_requests"] == 24
    assert counts["exams"] == 41
    assert counts["room_unavailability"] == 2


def test_dataset_individual_endpoints():
    endpoints = {
        "/api/v1/dataset/rooms": 27,
        "/api/v1/dataset/faculty": 40,
        "/api/v1/dataset/groups": 14,
        "/api/v1/dataset/courses": 62,
        "/api/v1/dataset/sessions": 189,
        "/api/v1/dataset/bookings": 25,
        "/api/v1/dataset/exams": 41,
    }
    for endpoint, expected_count in endpoints.items():
        res = client.get(endpoint)
        assert res.status_code == 200, f"Endpoint {endpoint} failed with status {res.status_code}"
        items = res.json()
        assert len(items) == expected_count, f"{endpoint} returned {len(items)}, expected {expected_count}"

