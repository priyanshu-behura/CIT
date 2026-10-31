import time
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.api import timetable

client = TestClient(app)


def test_async_generation_endpoints_lifecycle():
    """
    Test background job lifecycle:
    1. POST /api/v1/timetable/generate-async returns job_id immediately with 200.
    2. GET /api/v1/timetable/jobs/{job_id} returns the job state, stage, and progress.
    3. GET /api/v1/timetable/jobs/invalid-id returns 404.
    """
    # 1. Invalid job returns 404
    non_existent = client.get("/api/v1/timetable/jobs/non-existent-job-xyz")
    assert non_existent.status_code == 404

    # 2. Simulate worker without triggering heavy 40-second solver in tests
    def fast_worker(job_id):
        job = timetable.GENERATION_JOBS.get(job_id)
        if job:
            job["status"] = "running"
            job["progress"] = 50
            job["stage"] = "Running test solve..."
            time.sleep(0.05)
            job["status"] = "completed"
            job["progress"] = 100
            job["stage"] = "Completed test solve"

    with patch.object(timetable, "_execute_generation_job", side_effect=fast_worker):
        res = client.post("/api/v1/timetable/generate-async")
        assert res.status_code == 200
        data = res.json()
        assert "job_id" in data
        job_id = data["job_id"]
        assert data["status"] == "pending"

        # Allow thread to finish
        time.sleep(0.1)

        # 3. Poll job status
        poll_res = client.get(f"/api/v1/timetable/jobs/{job_id}")
        assert poll_res.status_code == 200
        poll_data = poll_res.json()
        assert poll_data["job_id"] == job_id
        assert poll_data["status"] == "completed"
        assert poll_data["progress"] == 100


def test_async_generation_concurrency_lock():
    """
    Test that only ONE generation can run at a time.
    A second request while a job is running returns HTTP 409 Conflict with the active job id.
    """
    # Simulate a slow running job
    def slow_worker(job_id):
        job = timetable.GENERATION_JOBS.get(job_id)
        if job:
            job["status"] = "running"
            job["progress"] = 40
            job["stage"] = "Solving timetable..."
        time.sleep(0.2)
        if job:
            job["status"] = "completed"
        timetable.ACTIVE_JOB_ID = None

    with patch.object(timetable, "_execute_generation_job", side_effect=slow_worker):
        # 1. Start Job 1
        res1 = client.post("/api/v1/timetable/generate-async")
        assert res1.status_code == 200
        job1_id = res1.json()["job_id"]

        # 2. Attempt to start Job 2 while Job 1 is running -> 409 Conflict
        res2 = client.post("/api/v1/timetable/generate-async")
        assert res2.status_code == 409
        err_data = res2.json()["detail"]
        assert "already running" in err_data["message"]
        assert err_data["active_job_id"] == job1_id

        # 3. Attempt to call synchronous solve while Job 1 is running -> 409 Conflict
        res_sync = client.post("/api/v1/timetable/generate")
        assert res_sync.status_code == 409
        assert "already running" in res_sync.json()["detail"]["message"]

        # Wait for Job 1 to finish and verify lock release
        time.sleep(0.3)
        assert timetable.ACTIVE_JOB_ID is None
