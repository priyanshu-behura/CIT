import os
import json
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.security import hash_password
from app.core.config import settings

DB_PATH = Path(__file__).resolve().parent.parent.parent / "tech_zephyr.db"


def get_db_connection() -> sqlite3.Connection:
    """Create a thread-safe sqlite3 connection with row dictionary access."""
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db():
    """Initialize database tables and seed required data."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL, -- admin, coordinator, faculty, club
        department TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 2. Bookings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        requester_name TEXT NOT NULL,
        requester_email TEXT,
        role TEXT NOT NULL,
        requested_category TEXT NOT NULL,
        effective_category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        attendance INTEGER NOT NULL,
        duration_periods INTEGER NOT NULL,
        windows TEXT NOT NULL, -- JSON
        room_types TEXT NOT NULL, -- JSON
        needs TEXT NOT NULL, -- JSON
        mandatory_for_groups TEXT NOT NULL, -- JSON
        preferred_room_id TEXT,
        status TEXT NOT NULL, -- pending, approved, rejected, alternative_offered, cancelled
        assigned_room_id TEXT,
        assigned_day TEXT,
        assigned_start_period INTEGER,
        assigned_end_period INTEGER,
        decision_reason TEXT,
        decided_by TEXT,
        decided_at TEXT,
        submitted_at TEXT NOT NULL
    );
    """)

    # 3. Schedules table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_type TEXT NOT NULL, -- baseline, disruption
        created_at TEXT NOT NULL,
        status TEXT NOT NULL, -- optimal, feasible, infeasible, error
        solver_duration REAL DEFAULT 0.0,
        schedule_json TEXT NOT NULL,
        validator_report TEXT,
        hard_violations INTEGER DEFAULT 0,
        soft_penalty INTEGER DEFAULT 0
    );
    """)

    # 4. Disruptions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS disruptions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        changes TEXT NOT NULL, -- JSON
        status TEXT NOT NULL, -- pending, applied, rejected
        created_at TEXT NOT NULL,
        rescheduled_json TEXT, -- JSON
        stability_metrics TEXT, -- JSON
        approved_by TEXT,
        approved_at TEXT
    );
    """)

    # 5. Notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_role TEXT,
        target_email TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """)

    # 6. Audit logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL
    );
    """)

    conn.commit()

    # Seed Demo Users if not present
    seed_demo_users(conn)

    # Seed Initial Spectra Bookings from cit_public.json
    seed_spectra_bookings(conn)

    # Seed default sample disruption
    seed_sample_disruption(conn)

    conn.close()


def seed_demo_users(conn: sqlite3.Connection):
    """Seed the 4 required role accounts with known passwords."""
    cursor = conn.cursor()
    users = [
        ("admin@cit.edu", "Admin@123", "Dr. Rajeshwar Jena (Dean & Chief Admin)", "admin", "ADMIN"),
        ("coordinator.cse@cit.edu", "Coord@123", "Prof. Ananya Patra (Coordinator)", "coordinator", "CSE"),
        ("faculty.sm@cit.edu", "Faculty@123", "Dr. Smruti Mohapatra (Associate Prof)", "faculty", "CSE"),
        ("club.robotics@cit.edu", "Club@123", "Rohan Das (Robotics & AI Club Lead)", "club", "CLUBS"),
    ]

    now = datetime.now(timezone.utc).isoformat()
    for email, pwd, name, role, dept in users:
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if not cursor.fetchone():
            pwd_hash = hash_password(pwd)
            cursor.execute(
                "INSERT INTO users (email, password_hash, full_name, role, department, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (email, pwd_hash, name, role, dept, now)
            )
    conn.commit()


def seed_spectra_bookings(conn: sqlite3.Connection):
    """Seed the 25 official Spectra Week requests from the verified dataset."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM bookings")
    if cursor.fetchone()[0] > 0:
        return  # Already seeded

    # Load dataset
    data_file = Path(settings.DATASET_PATH)
    if not data_file.exists():
        return

    with open(data_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    cancelled_ids = {c["request_id"] for c in data.get("cancellations", [])}
    requests = data.get("booking_requests", [])
    order = data.get("priority_order", [])
    role_cap = data.get("role_category_cap", {})

    for req in requests:
        req_id = req["id"]
        role = req.get("role", "club")
        requested_cat = req.get("requested_category", "club_event")
        cap = role_cap.get(role, "club_event")
        
        # Effective category
        req_idx = order.index(requested_cat) if requested_cat in order else len(order) - 1
        cap_idx = order.index(cap) if cap in order else len(order) - 1
        effective_cat = order[max(req_idx, cap_idx)]

        is_cancelled = req_id in cancelled_ids
        status = "cancelled" if is_cancelled else "pending"

        # Find preferred room if first in room_types or mentioned
        preferred_room = None
        if "LH" in req["title"] or "Lecture" in req["title"]:
            preferred_room = "LH-1"
        elif "Auditorium" in req["title"] or req.get("attendance", 0) > 300:
            preferred_room = "AUD"

        cursor.execute("""
        INSERT INTO bookings (
            id, requester_name, requester_email, role, requested_category,
            effective_category, title, description, attendance, duration_periods,
            windows, room_types, needs, mandatory_for_groups, preferred_room_id,
            status, decision_reason, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            req_id,
            req.get("requester", "Unknown Requester"),
            f"{role}@cit.edu",
            role,
            requested_cat,
            effective_cat,
            req.get("title", f"Event {req_id}"),
            req.get("title", ""),
            req.get("attendance", 50),
            req.get("duration_periods", 2),
            json.dumps(req.get("windows", [])),
            json.dumps(req.get("room_types", [])),
            json.dumps(req.get("needs", [])),
            json.dumps(req.get("mandatory_for_groups", [])),
            preferred_room,
            status,
            "Officially cancelled by requester" if is_cancelled else None,
            req.get("submitted_at", "2026-02-01T10:00:00")
        ))
    conn.commit()


def seed_sample_disruption(conn: sqlite3.Connection):
    """Seed the official sample disruption if available."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM disruptions")
    if cursor.fetchone()[0] > 0:
        return

    sample_dis = Path(settings.WORKSPACE_ROOT) / "CrunchWeek_StarterPack (1)" / "CrunchWeek_StarterPack" / "examples" / "sample_disruption.json"
    if sample_dis.exists():
        with open(sample_dis, "r", encoding="utf-8") as f:
            dis = json.load(f)
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
        INSERT INTO disruptions (id, title, description, changes, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            dis.get("id", "sample-disruption"),
            "Semester Mid-Term Disruption (F07 leave + CR-102 leak)",
            dis.get("description", "Official CIT practice disruption scenario"),
            json.dumps(dis.get("changes", [])),
            "pending",
            now
        ))
        conn.commit()

