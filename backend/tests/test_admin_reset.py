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
    from app.core.mongo import get_mongo_db
    mongo_db = get_mongo_db()

    # 1. Dirty MongoDB Atlas demo state
    mongo_db.notifications.insert_one({"target_role": "club", "title": "Test Dirty", "message": "Dirty", "type": "info"})
    mongo_db.disruptions.insert_one({"id": "dirty-disruption", "title": "Dirty Disruption", "status": "pending"})
    mongo_db.schedules.insert_one({"schedule_type": "disruption", "status": "applied", "schedule_json": "{}"})

    # Record SQLite state prior to reset to verify SQLite remains 100% untouched
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM schedules")
    sqlite_sched_count_before = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM users")
    sqlite_users_count_before = c.fetchone()[0]
    conn.close()

    # 2. Call admin reset
    res = client.post("/api/v1/admin/reset", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["baseline_restored"]["soft_penalty"] == 232
    assert data["baseline_restored"]["hard_violations"] == 0

    # 3. Assert MongoDB database state (MongoDB is primary live database)
    # Notifications cleared
    assert mongo_db.notifications.count_documents({}) == 0

    # Disruptions cleared
    assert mongo_db.disruptions.count_documents({}) == 0

    # Baseline schedule restored in MongoDB
    base_docs = list(mongo_db.schedules.find({"schedule_type": "baseline"}))
    assert len(base_docs) >= 1
    assert base_docs[0]["status"] == "optimal"
    assert base_docs[0]["hard_violations"] == 0
    assert base_docs[0]["soft_penalty"] == 232

    # Disruption schedule cleared from MongoDB
    assert mongo_db.schedules.count_documents({"schedule_type": "disruption"}) == 0

    # 4. Assert SQLite historical archive was strictly read-only and preserved
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM schedules")
    assert c.fetchone()[0] == sqlite_sched_count_before
    c.execute("SELECT COUNT(*) FROM users")
    assert c.fetchone()[0] == sqlite_users_count_before
    conn.close()

    # 5. Assert /timetable/current serves the restored baseline snapshot
    tt_res = client.get("/api/v1/timetable/current")
    assert tt_res.status_code == 200
    tt_data = tt_res.json()
    assert tt_data["total_scheduled"] == 189
    assert len(tt_data["sessions"]) == 189

    # 6. Assert /export/schedule.json is byte-for-byte equal to disk file
    export_res = client.get("/api/v1/export/schedule.json")
    assert export_res.status_code == 200
    disk_file = Path(settings.WORKSPACE_ROOT) / "exports" / "schedule.json"
    with open(disk_file, "rb") as f:
        disk_bytes = f.read()
    assert export_res.content == disk_bytes
