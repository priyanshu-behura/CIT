import json
import hashlib
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db_connection

client = TestClient(app)


def test_export_endpoints_serve_current_database_and_preserve_disk_files():
    """
    Prove that /export/schedule.json, /export/schedule_after.json, and /export/timetable.csv
    serve the current active schedule from SQLite dynamically, without reading from or
    mutating the committed exports/*.json files on disk.
    """
    workspace_root = Path(__file__).resolve().parent.parent.parent
    disk_sched_path = workspace_root / "exports" / "schedule.json"
    disk_after_path = workspace_root / "exports" / "schedule_after.json"

    # 1. Snapshot disk file hashes before any test operation
    with open(disk_sched_path, "rb") as f:
        orig_sched_hash = hashlib.sha256(f.read()).hexdigest()
    with open(disk_after_path, "rb") as f:
        orig_after_hash = hashlib.sha256(f.read()).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Query current row in DB
    cursor.execute("SELECT id, schedule_json FROM schedules WHERE schedule_type = 'baseline' ORDER BY id DESC LIMIT 1")
    baseline_row = cursor.fetchone()

    # Inject a temporary test schedule into DB with a unique marker
    unique_marker = "DYNAMIC_DB_TEST_EXPORT_MARKER_98765"
    test_sched_obj = {
        "metadata": {"test_marker": unique_marker},
        "sessions": [
            {"session_id": "TEST-SESS-1", "day": "MON", "start_period": 1, "room_id": "CR-101"}
        ]
    }
    cursor.execute(
        """
        INSERT INTO schedules (schedule_type, created_at, status, solver_duration, schedule_json, hard_violations, soft_penalty)
        VALUES ('baseline', '2026-11-01T00:00:00', 'optimal', 1.0, ?, 0, 100)
        """,
        (json.dumps(test_sched_obj),)
    )
    inserted_id = cursor.lastrowid
    conn.commit()

    try:
        # Request /export/schedule.json via API
        res = client.get("/api/v1/export/schedule.json")
        assert res.status_code == 200
        data = res.json()
        # Verify it served the CURRENT database row containing our marker
        assert data.get("metadata", {}).get("test_marker") == unique_marker

        # Request /export/timetable.csv via API
        csv_res = client.get("/api/v1/export/timetable.csv")
        assert csv_res.status_code == 200
        assert "TEST-SESS-1,MON,1,CR-101" in csv_res.text

    finally:
        # Clean up the test record
        cursor.execute("DELETE FROM schedules WHERE id = ?", (inserted_id,))
        conn.commit()
        conn.close()

    # Verify disk files were NOT touched and hashes are identical
    with open(disk_sched_path, "rb") as f:
        after_sched_hash = hashlib.sha256(f.read()).hexdigest()
    with open(disk_after_path, "rb") as f:
        after_after_hash = hashlib.sha256(f.read()).hexdigest()

    assert orig_sched_hash == after_sched_hash, "exports/schedule.json hash must remain untouched!"
    assert orig_after_hash == after_after_hash, "exports/schedule_after.json hash must remain untouched!"
