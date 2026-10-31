import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.database import get_db_connection
from app.api.auth import create_access_token

client = TestClient(app)


def get_token_for(email: str, role: str) -> str:
    return create_access_token({"sub": email, "role": role})


def test_admin_reset_anonymous_unauthorized():
    res = client.post("/api/v1/admin/reset")
    assert res.status_code == 401
    assert "detail" in res.json()


def test_admin_reset_non_admin_forbidden():
    token_faculty = get_token_for("faculty.sm@cit.edu", "faculty")
    res = client.post("/api/v1/admin/reset", headers={"Authorization": f"Bearer {token_faculty}"})
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]

    token_club = get_token_for("club.robotics@cit.edu", "club")
    res_club = client.post("/api/v1/admin/reset", headers={"Authorization": f"Bearer {token_club}"})
    assert res_club.status_code == 403


def test_admin_reset_active_job_conflict(monkeypatch):
    import app.api.admin as admin_module
    from app.api.timetable import GENERATION_LOCK

    token = get_token_for("admin@cit.edu", "admin")

    with GENERATION_LOCK:
        res = client.post("/api/v1/admin/reset", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 409
        assert "in progress" in res.json()["detail"].lower()


def test_admin_reset_success_lifecycle():
    token = get_token_for("admin@cit.edu", "admin")

    # 1. Dirty the database by adding demo notifications, dirty booking decision, and simulated disruption
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("INSERT INTO notifications (target_role, target_email, title, message, type, created_at) VALUES ('club', 'club.robotics@cit.edu', 'Test Dirty', 'Dirty Notification', 'info', '2026-11-01T00:00:00Z')")
    c.execute("UPDATE bookings SET status = 'approved', decision_reason = 'dirty decision' WHERE id = 'BR-15'")
    c.execute("INSERT INTO schedules (id, schedule_type, created_at, status, solver_duration, schedule_json, hard_violations, soft_penalty) VALUES (999, 'baseline', '2026-11-01T00:00:00Z', 'optimal', 1.0, '{}', 0, 999)")
    conn.commit()
    conn.close()

    # 2. Call admin reset
    res = client.post("/api/v1/admin/reset", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["baseline_restored"]["soft_penalty"] == 232
    assert data["baseline_restored"]["hard_violations"] == 0

    # 3. Assert database state
    conn = get_db_connection()
    c = conn.cursor()

    # Notifications cleared
    c.execute("SELECT COUNT(*) FROM notifications")
    assert c.fetchone()[0] == 0

    # Disruptions cleared
    c.execute("SELECT COUNT(*) FROM disruptions")
    assert c.fetchone()[0] == 0

    # Users preserved
    c.execute("SELECT COUNT(*) FROM users")
    assert c.fetchone()[0] >= 4

    # Schedules has exactly 1 row (row 1, baseline snapshot)
    c.execute("SELECT id, schedule_type, status, soft_penalty, hard_violations FROM schedules")
    schedules = c.fetchall()
    assert len(schedules) == 1
    assert schedules[0][0] == 1
    assert schedules[0][1] == "baseline"
    assert schedules[0][2] == "optimal"
    assert schedules[0][3] == 232
    assert schedules[0][4] == 0

    # Bookings has exactly 25 official requests
    c.execute("SELECT id, status FROM bookings ORDER BY id ASC")
    bookings = c.fetchall()
    assert len(bookings) == 25
    b_dict = {b[0]: b[1] for b in bookings}
    assert b_dict["BR-04"] == "cancelled"
    assert b_dict["BR-15"] == "pending"  # reset from 'approved' back to clean state
    assert "BR-05a" in b_dict
    assert "BR-05e" in b_dict
    assert "BR-11a" in b_dict
    assert "BR-11b" in b_dict
    assert "BR-21" not in b_dict
    conn.close()

    # 4. Assert /timetable/current serves the restored baseline snapshot
    tt_res = client.get("/api/v1/timetable/current")
    assert tt_res.status_code == 200
    tt_data = tt_res.json()
    assert tt_data["total_scheduled"] == 189
    assert len(tt_data["sessions"]) == 189

    # 5. Assert /export/schedule.json is byte-for-byte equal to disk file
    export_res = client.get("/api/v1/export/schedule.json")
    assert export_res.status_code == 200
    disk_file = Path(settings.WORKSPACE_ROOT) / "exports" / "schedule.json"
    with open(disk_file, "rb") as f:
        disk_bytes = f.read()
    assert export_res.content == disk_bytes
