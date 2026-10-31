import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_async_generation_endpoints_lifecycle():
    """
    Test background job lifecycle:
    1. POST /api/v1/timetable/generate-async returns job_id immediately with 200/202 status.
    2. GET /api/v1/timetable/jobs/{job_id} returns the job state, stage, and progress.
    3. GET /api/v1/timetable/jobs/invalid-id returns 404.
    """
    # 1. Invalid job returns 404
    non_existent = client.get("/api/v1/timetable/jobs/non-existent-job-xyz")
    assert non_existent.status_code == 404

    # 2. Start async job
    res = client.post("/api/v1/timetable/generate-async")
    assert res.status_code == 200
    data = res.json()
    assert "job_id" in data
    job_id = data["job_id"]
    assert data["status"] in ("pending", "running")
    assert "progress" in data
    assert "stage" in data

    # 3. Poll job status
    poll_res = client.get(f"/api/v1/timetable/jobs/{job_id}")
    assert poll_res.status_code == 200
    poll_data = poll_res.json()
    assert poll_data["job_id"] == job_id
    assert poll_data["status"] in ("pending", "running", "completed")
    assert 0 <= poll_data["progress"] <= 100
