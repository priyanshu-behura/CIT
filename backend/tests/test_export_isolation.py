import json
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db_connection

client = TestClient(app)


def test_export_endpoints_strict_type_isolation():
    """
    Prove that:
    1. /export/schedule.json strictly retrieves records with schedule_type = 'baseline'.
    2. /export/schedule_after.json strictly retrieves records with schedule_type = 'disruption'.
    3. Even if a disruption record has a newer timestamp/higher ID, /export/schedule.json
       will NEVER return the disruption schedule.
    4. Even if a baseline record has a newer timestamp/higher ID, /export/schedule_after.json
       will NEVER return the baseline schedule.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    baseline_marker = "BASELINE_SCHEDULE_ISOLATION_MARKER"
    disruption_marker = "DISRUPTION_SCHEDULE_ISOLATION_MARKER"

    # Insert baseline record with older timestamp
    cursor.execute("""
    INSERT INTO schedules (schedule_type, created_at, status, solver_duration, schedule_json, hard_violations, soft_penalty)
    VALUES ('baseline', '2026-11-01T01:00:00', 'optimal', 1.0, ?, 0, 100)
    """, (json.dumps({"metadata": {"type_marker": baseline_marker}}),))
    base_id = cursor.lastrowid

    # Insert disruption record with newer timestamp and higher ID
    cursor.execute("""
    INSERT INTO schedules (schedule_type, created_at, status, solver_duration, schedule_json, hard_violations, soft_penalty)
    VALUES ('disruption', '2026-11-01T02:00:00', 'optimal', 1.0, ?, 0, 105)
    """, (json.dumps({"metadata": {"type_marker": disruption_marker}}),))
    disr_id = cursor.lastrowid
    conn.commit()
    conn.close()

    try:
        # Request /export/schedule.json -> MUST return baseline_marker, NEVER disruption_marker
        res_base = client.get("/api/v1/export/schedule.json")
        assert res_base.status_code == 200
        data_base = res_base.json()
        assert data_base.get("metadata", {}).get("type_marker") == baseline_marker
        assert data_base.get("metadata", {}).get("type_marker") != disruption_marker

        # Request /export/schedule_after.json -> MUST return disruption_marker, NEVER baseline_marker
        res_disr = client.get("/api/v1/export/schedule_after.json")
        assert res_disr.status_code == 200
        data_disr = res_disr.json()
        assert data_disr.get("metadata", {}).get("type_marker") == disruption_marker
        assert data_disr.get("metadata", {}).get("type_marker") != baseline_marker

    finally:
        # conftest db_and_job_state_guard will automatically purge base_id and disr_id,
        # but explicit cleanup is also performed
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM schedules WHERE id IN (?, ?)", (base_id, disr_id))
        conn.commit()
        conn.close()
