import pytest
import sqlite3
from pathlib import Path
from app.api import timetable

DB_PATH = Path(__file__).resolve().parent.parent / "tech_zephyr.db"


@pytest.fixture(autouse=True)
def db_and_job_state_guard():
    """
    Automatic test hygiene fixture:
    1. Snapshots existing booking, schedule, and disruption IDs prior to each test.
    2. Clears in-memory job registry and releases any generation lock.
    3. Guarantees that any booking, schedule, or disruption row created during the test
       is deterministically deleted during teardown, leaving the database completely unchanged.
    """
    # Pre-test snapshot
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id FROM bookings")
    initial_booking_ids = set(r[0] for r in cur.fetchall())

    cur.execute("SELECT id FROM schedules")
    initial_schedule_ids = set(r[0] for r in cur.fetchall())

    cur.execute("SELECT id FROM disruptions")
    initial_disruption_ids = set(r[0] for r in cur.fetchall())
    conn.close()

    # Reset in-memory solver jobs
    timetable.GENERATION_JOBS.clear()
    timetable.ACTIVE_JOB_ID = None

    yield

    # Teardown: purge any rows created by tests
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id FROM bookings")
    current_booking_ids = set(r[0] for r in cur.fetchall())
    new_bookings = current_booking_ids - initial_booking_ids
    if new_bookings:
        placeholders = ",".join("?" for _ in new_bookings)
        cur.execute(f"DELETE FROM bookings WHERE id IN ({placeholders})", list(new_bookings))

    cur.execute("SELECT id FROM schedules")
    current_schedule_ids = set(r[0] for r in cur.fetchall())
    new_schedules = current_schedule_ids - initial_schedule_ids
    if new_schedules:
        placeholders = ",".join("?" for _ in new_schedules)
        cur.execute(f"DELETE FROM schedules WHERE id IN ({placeholders})", list(new_schedules))

    cur.execute("SELECT id FROM disruptions")
    current_disruption_ids = set(r[0] for r in cur.fetchall())
    new_disruptions = current_disruption_ids - initial_disruption_ids
    if new_disruptions:
        placeholders = ",".join("?" for _ in new_disruptions)
        cur.execute(f"DELETE FROM disruptions WHERE id IN ({placeholders})", list(new_disruptions))

    conn.commit()
    conn.close()

    # Reset in-memory solver jobs
    timetable.GENERATION_JOBS.clear()
    timetable.ACTIVE_JOB_ID = None
