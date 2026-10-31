import io
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.api.auth import create_access_token

client = TestClient(app)


def get_token_for(email: str, role: str) -> str:
    return create_access_token({"sub": email, "role": role})


def test_disruption_upload_anonymous_unauthorized():
    res = client.post("/api/v1/disruptions/upload")
    assert res.status_code == 401


def test_disruption_upload_malformed_json():
    token = get_token_for("coordinator.cse@cit.edu", "coordinator")
    file_bytes = b"This is not JSON at all {"
    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("bad.json", file_bytes, "application/json")}
    )
    assert res.status_code == 400
    assert "Malformed JSON" in res.json()["detail"]


def test_disruption_upload_missing_keys():
    token = get_token_for("coordinator.cse@cit.edu", "coordinator")
    payload = {"title": "Missing id and changes"}
    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("missing.json", json.dumps(payload).encode("utf-8"), "application/json")}
    )
    assert res.status_code == 400
    assert "Invalid disruption id" in res.json()["detail"]


def test_disruption_upload_wrong_data_types():
    token = get_token_for("coordinator.cse@cit.edu", "coordinator")
    payload = {"id": "test-types", "changes": "not-a-list"}
    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("types.json", json.dumps(payload).encode("utf-8"), "application/json")}
    )
    assert res.status_code == 400
    assert "'changes' key: must be a non-empty list" in res.json()["detail"]


def test_disruption_upload_unknown_faculty_id():
    token = get_token_for("coordinator.cse@cit.edu", "coordinator")
    payload = {
        "id": "unknown-fac",
        "changes": [
            {"type": "faculty_unavailable", "faculty_id": "F999", "days": ["MON"], "periods": [1, 2]}
        ]
    }
    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("unknown_fac.json", json.dumps(payload).encode("utf-8"), "application/json")}
    )
    assert res.status_code == 400
    assert "Unknown faculty ID 'F999'" in res.json()["detail"]


def test_disruption_upload_unknown_room_id():
    token = get_token_for("coordinator.cse@cit.edu", "coordinator")
    payload = {
        "id": "unknown-room",
        "changes": [
            {"type": "room_unavailable", "room_id": "ROOM-NONEXISTENT", "days": ["MON"], "periods": [1, 2]}
        ]
    }
    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("unknown_room.json", json.dumps(payload).encode("utf-8"), "application/json")}
    )
    assert res.status_code == 400
    assert "Unknown room ID 'ROOM-NONEXISTENT'" in res.json()["detail"]


def test_disruption_upload_unknown_session_id():
    token = get_token_for("coordinator.cse@cit.edu", "coordinator")
    payload = {
        "id": "unknown-session",
        "changes": [
            {"type": "remove_session", "session_id": "CS999-L1"}
        ]
    }
    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("unknown_sess.json", json.dumps(payload).encode("utf-8"), "application/json")}
    )
    assert res.status_code == 400
    assert "Unknown session ID 'CS999-L1'" in res.json()["detail"]


def test_disruption_upload_oversized_file():
    token = get_token_for("coordinator.cse@cit.edu", "coordinator")
    large_payload = {"id": "large", "data": "A" * (1024 * 1024 + 10)}
    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("huge.json", json.dumps(large_payload).encode("utf-8"), "application/json")}
    )
    assert res.status_code == 400
    assert "exceeds maximum allowable size" in res.json()["detail"]


def test_disruption_non_admin_approval_blocked():
    token_coord = get_token_for("coordinator.cse@cit.edu", "coordinator")
    res = client.post("/api/v1/disruptions/sample-disruption/approve", headers={"Authorization": f"Bearer {token_coord}"})
    assert res.status_code == 403
    assert "Unauthorized" in res.json()["detail"]


def test_disruption_upload_valid_sample_lifecycle():
    token_admin = get_token_for("admin@cit.edu", "admin")
    sample_path = Path(settings.WORKSPACE_ROOT) / "CrunchWeek_StarterPack (1)" / "CrunchWeek_StarterPack" / "examples" / "sample_disruption.json"
    assert sample_path.exists()

    with open(sample_path, "rb") as f:
        file_bytes = f.read()

    # 1. Upload valid sample disruption file
    res = client.post(
        "/api/v1/disruptions/upload",
        headers={"Authorization": f"Bearer {token_admin}"},
        files={"file": ("sample_disruption.json", file_bytes, "application/json")}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # 2. Simulate rescheduling
    sim_res = client.post(
        "/api/v1/disruptions/sample-disruption/simulate",
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["status"] == "success"
    assert sim_data["stability"]["sessions_moved"] == 8
    assert sim_data["hard_violations"] == 0
    assert sim_data["soft_total"] in (237, 238)

    # 3. Non-admin approval is rejected
    token_club = get_token_for("club.robotics@cit.edu", "club")
    app_fail = client.post(
        "/api/v1/disruptions/sample-disruption/approve",
        headers={"Authorization": f"Bearer {token_club}"}
    )
    assert app_fail.status_code == 403

    # 4. Admin approval succeeds
    app_ok = client.post(
        "/api/v1/disruptions/sample-disruption/approve",
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert app_ok.status_code == 200
    assert app_ok.json()["status"] == "applied"
