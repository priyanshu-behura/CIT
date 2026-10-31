# Tech-Zephyr API Contract & Interface Specification

This document defines the formal API contract for the Tech-Zephyr Timetable & Disruption Management backend.

- **Base URL (Local)**: `http://127.0.0.1:8000`
- **API Prefix**: `/api/v1`
- **Interactive Documentation**: Swagger UI at `/docs`, ReDoc at `/redoc`

---

## PART 1: EXISTING IMPLEMENTED ENDPOINTS

The following endpoints are currently implemented, validated, and covered by automated tests.

### 1. Root / Service Info
- **Method**: `GET`
- **URL**: `/`
- **Purpose**: Service discovery and API entry point.
- **Parameters**: None.
- **Success Response (200 OK)**:
  ```json
  {
    "app": "Tech-Zephyr Timetable Management System",
    "version": "0.1.0",
    "docs_url": "/docs",
    "api_v1": "/api/v1"
  }
  ```
- **Possible Errors**: `500 Internal Server Error` (if application fails to start).

---

### 2. System Health & Solver Status
- **Method**: `GET`
- **URL**: `/api/health` and `/api/v1/health`
- **Purpose**: Verifies server health, OR-Tools solver library availability, and dataset file loading.
- **Parameters**: None.
- **Success Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "project_name": "Tech-Zephyr Timetable Management System",
    "version": "0.1.0",
    "ortools_available": true,
    "ortools_version": "9.15.6755",
    "dataset_loaded": true,
    "dataset_id": "cit-public-v1"
  }
  ```
- **Possible Errors**:
  - `500 Internal Server Error`: If dataset fails to load or critical environment error occurs.

---

### 3. Dataset Summary Metrics
- **Method**: `GET`
- **URL**: `/api/v1/dataset/summary`
- **Purpose**: Computes and returns actual dataset counts, constraint rules, calendar configuration, and categorical breakdowns directly from `cit_public.json`.
- **Parameters**: None.
- **Success Response (200 OK)**:
  ```json
  {
    "dataset_id": "cit-public-v1",
    "institute": "Chilika Institute of Technology (fictional)",
    "counts": {
      "rooms": 27,
      "faculty": 40,
      "student_groups": 14,
      "courses": 62,
      "sessions": 189,
      "total_teaching_hours": 243,
      "booking_requests": 25,
      "cancellations": 1,
      "active_booking_requests": 24,
      "exams": 41,
      "room_unavailability": 2
    },
    "priority_order": [
      "exam",
      "regular_session",
      "institute_event",
      "guest_lecture",
      "department_event",
      "club_event"
    ],
    "role_category_cap": {
      "admin": "institute_event",
      "faculty": "guest_lecture",
      "department_coordinator": "department_event",
      "club": "club_event"
    },
    "room_types": {
      "lecture_hall": 5,
      "classroom": 10,
      "auditorium": 1,
      "seminar_hall": 2,
      "outdoor": 1,
      "workshop": 1,
      "lab_cs": 3,
      "lab_elec": 1,
      "lab_phy": 1,
      "lab_civil": 2
    },
    "session_kinds": {
      "lecture": 139,
      "tutorial": 36,
      "lab": 14
    },
    "faculty_departments": {
      "Mathematics": 4,
      "Physics": 4,
      "Computer Science & Engineering": 10,
      "Electronics & Communication": 8,
      "Mechanical Engineering": 7,
      "Civil Engineering": 5,
      "Humanities & Social Sciences": 2
    },
    "student_group_years": {
      "1": 4,
      "2": 5,
      "3": 5
    },
    "calendar": {
      "days": ["MON", "TUE", "WED", "THU", "FRI"],
      "periods": [...],
      "lunch": { "after_period": 5, "start": "13:00", "end": "14:00" },
      "lab_start_periods": [2, 6],
      "event_only_periods": [10, 11, 12, 13],
      "fest_week": "Week 7 (Spectra '27)",
      "exam_week": {
        "days": ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
        "sessions": [
          { "id": "AM", "start": "09:30", "end": "11:30" },
          { "id": "PM", "start": "14:00", "end": "16:00" }
        ]
      }
    }
  }
  ```
- **Possible Errors**: `500 Internal Server Error` (if dataset file is missing or corrupted).

---

### 4. Campus Rooms List
- **Method**: `GET`
- **URL**: `/api/v1/dataset/rooms`
- **Purpose**: Returns all 27 campus rooms with architectural properties, capacities, and allowed uses.
- **Parameters**: None.
- **Success Response (200 OK)**: Array of 27 items:
  ```json
  [
    {
      "id": "LH-1",
      "name": "Lecture Hall 1",
      "building": "Aryabhata Bhavan",
      "type": "lecture_hall",
      "capacity": 200,
      "features": ["projector", "audio_system", "ac"],
      "accessible": true,
      "allowed_uses": ["lecture", "tutorial", "exam", "event"]
    }
  ]
  ```
- **Possible Errors**: `500 Internal Server Error`.

---

### 5. Faculty Directory List
- **Method**: `GET`
- **URL**: `/api/v1/dataset/faculty`
- **Purpose**: Returns all 40 faculty members with daily teaching caps, accessibility needs, unavailabilities, and avoidance preferences.
- **Parameters**: None.
- **Success Response (200 OK)**: Array of 40 items:
  ```json
  [
    {
      "id": "F01",
      "name": "Prof. A. Sharma",
      "department": "Computer Science & Engineering",
      "max_hours_per_day": 4,
      "needs_accessible": false,
      "unavailable": [
        { "day": "WED", "periods": [1, 2], "reason": "Department Head Meeting" }
      ],
      "preferences": [
        { "type": "avoid", "days": ["FRI"], "periods": [8, 9], "note": "Prefers no late Friday classes" }
      ]
    }
  ]
  ```
- **Possible Errors**: `500 Internal Server Error`.

---

### 6. Student Groups / Cohorts List
- **Method**: `GET`
- **URL**: `/api/v1/dataset/groups`
- **Purpose**: Returns all 14 student groups (Y1 sections A-D, Y2 & Y3 cohorts across 5 departments).
- **Parameters**: None.
- **Success Response (200 OK)**: Array of 14 items:
  ```json
  [
    {
      "id": "Y1-A",
      "name": "First Year Section A",
      "year": 1,
      "department": "General Engineering",
      "size": 90,
      "needs_accessible": false
    }
  ]
  ```
- **Possible Errors**: `500 Internal Server Error`.

---

### 7. Academic Courses List
- **Method**: `GET`
- **URL**: `/api/v1/dataset/courses`
- **Purpose**: Returns all 62 academic course specifications with weekly credit breakdown.
- **Parameters**: None.
- **Success Response (200 OK)**: Array of 62 items:
  ```json
  [
    {
      "id": "CS101",
      "title": "Introduction to Programming",
      "department": "Computer Science & Engineering",
      "year": 1,
      "lecture_hours": 3,
      "tutorial_hours": 1,
      "lab_blocks": 1
    }
  ]
  ```
- **Possible Errors**: `500 Internal Server Error`.

---

### 8. Teaching Sessions to Schedule
- **Method**: `GET`
- **URL**: `/api/v1/dataset/sessions`
- **Purpose**: Returns all 189 teaching sessions requiring timetable placement (243 hours total).
- **Parameters**: None.
- **Success Response (200 OK)**: Array of 189 items:
  ```json
  [
    {
      "id": "MA101-AB-L1",
      "course_id": "MA101",
      "kind": "lecture",
      "groups": ["Y1-A", "Y1-B"],
      "faculty_id": "F19",
      "size": 180,
      "duration": 1,
      "room_types": ["classroom", "lecture_hall", "auditorium"],
      "needs_accessible": false,
      "basket_slot": null,
      "fixed_slot": null
    }
  ]
  ```
- **Possible Errors**: `500 Internal Server Error`.

---

### 9. Spectra Week Booking Requests
- **Method**: `GET`
- **URL**: `/api/v1/dataset/bookings`
- **Purpose**: Returns all 25 submitted booking requests, with cancellation status flagged for `BR-04`.
- **Parameters**: None.
- **Success Response (200 OK)**: Array of 25 items:
  ```json
  [
    {
      "id": "BR-01",
      "submitted_at": "2027-01-25T10:00:00+05:30",
      "requester": "Dean of Student Affairs",
      "role": "admin",
      "department": null,
      "requested_category": "institute_event",
      "title": "Inauguration Ceremony - Spectra '27",
      "attendance": 500,
      "duration_periods": 2,
      "windows": [{ "day": "MON", "from_period": 4, "to_period": 5 }],
      "room_types": ["auditorium"],
      "needs": ["stage", "audio_system"],
      "requested_room": "AUD",
      "mandatory_for_groups": [],
      "series_id": null,
      "raw_text": "Dean Student Affairs booking for Inauguration in AUD Monday 11am-1pm",
      "is_cancelled": false
    }
  ]
  ```
- **Possible Errors**: `500 Internal Server Error`.

---

### 10. Midsem Examinations List
- **Method**: `GET`
- **URL**: `/api/v1/dataset/exams`
- **Purpose**: Returns all 41 midsem exams with cohort and sizing specifications.
- **Parameters**: None.
- **Success Response (200 OK)**: Array of 41 items:
  ```json
  [
    {
      "id": "EX-MA101",
      "course_ids": ["MA101"],
      "groups": ["Y1-A", "Y1-B", "Y1-C", "Y1-D"],
      "size": 360,
      "duration_hours": 2
    }
  ]
  ```
- **Possible Errors**: `500 Internal Server Error`.

---

## PART 2: PROPOSED FUTURE ENDPOINTS (ROADMAP SPECIFICATION)

*Note: The following endpoints are designed for Phase 2 through Phase 8. They do not exist in the codebase yet.*

### 1. Timetable Generation & Management (Phase 2 & 3)

#### `POST /api/v1/timetable/solve`
- **Purpose**: Triggers Google OR-Tools CP-SAT solver to generate zero-hard-violation timetable.
- **Request Body**:
  ```json
  {
    "time_limit_seconds": 60,
    "weights": { "S1": 2, "S2": 1, "S3": 3, "S4": 3, "S5": 1, "S6": 1 },
    "seed": 42
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "status": "OPTIMAL",
    "solve_time_seconds": 4.12,
    "hard_violations": 0,
    "soft_penalty_total": 42,
    "soft_penalties": { "S1": 12, "S2": 18, "S3": 0, "S4": 6, "S5": 4, "S6": 2 },
    "scheduled_sessions_count": 189
  }
  ```

#### `GET /api/v1/timetable`
- **Purpose**: Retrieves currently solved regular timetable assignments.
- **Query Parameters**:
  - `day` (optional, enum: `MON`..`FRI`)
  - `group_id` (optional, filter by student cohort)
  - `faculty_id` (optional, filter by teacher)
  - `room_id` (optional, filter by room)
- **Success Response (200 OK)**:
  ```json
  {
    "sessions": [
      { "session_id": "MA101-AB-L1", "day": "MON", "start_period": 2, "room_id": "LH-1" }
    ]
  }
  ```

#### `PUT /api/v1/timetable/sessions/{session_id}`
- **Purpose**: Manual override/move of a session by admin/coordinator.
- **Request Body**:
  ```json
  {
    "day": "TUE",
    "start_period": 3,
    "room_id": "LH-2"
  }
  ```
- **Possible Errors**:
  - `400 Bad Request`: If move creates a hard constraint violation (H1-H14).

---

### 2. Faculty & Room Availability Management (Phase 3 & 4)

#### `POST /api/v1/faculty/{faculty_id}/unavailability`
- **Purpose**: Add emergency leave or administrative blackout for faculty member.
- **Request Body**:
  ```json
  {
    "day": "THU",
    "periods": [6, 7],
    "reason": "Doctor appointment"
  }
  ```

#### `POST /api/v1/rooms/{room_id}/unavailability`
- **Purpose**: Log maintenance blackout for a room (e.g., AV repair, AC servicing).
- **Request Body**:
  ```json
  {
    "days": ["WED", "THU"],
    "periods": [1, 2, 3],
    "reason": "Projector replacement"
  }
  ```

---

### 3. Booking Requests & Approval Workflow (Phase 4)

#### `POST /api/v1/bookings`
- **Purpose**: Submit a new booking request for Spectra Week or general venue booking.
- **Request Body**: Matches booking request schema (requester, role, category, attendance, windows, needs).
- **Role Check**: Automatically applies `role_category_cap` (e.g. Club capped at `club_event`).

#### `POST /api/v1/bookings/{request_id}/decision`
- **Purpose**: Administrator or Coordinator issues approval, rejection, or alternative venue offer.
- **Request Body**:
  ```json
  {
    "status": "approved",
    "room_id": "AUD",
    "day": "MON",
    "start_period": 4,
    "end_period": 5,
    "reason": "Institute event with priority"
  }
  ```
- **Validation**: Enforces no priority inversions, no double booking, no class clash for mandatory groups.

---

### 4. Midsem Exam Scheduling (Phase 2 & 3)

#### `POST /api/v1/exams/solve`
- **Purpose**: Generates midsem examination timetable (Monday to Saturday, AM & PM slots, $\lfloor\text{capacity}/2\rfloor$).
- **Success Response (200 OK)**:
  ```json
  {
    "status": "OPTIMAL",
    "scheduled_exams": 41,
    "soft_penalty": 0,
    "exams": [
      { "exam_id": "EX-MA101", "day": "MON", "session": "AM", "rooms": ["AUD", "LH-1", "LH-2"] }
    ]
  }
  ```

---

### 5. Live Conflict & Violation Detection (Phase 3 & 8)

#### `POST /api/v1/validator/check`
- **Purpose**: Programmatically runs `validator.py` logic against active in-memory or submitted schedule.
- **Request Body**: Full `schedule.json` payload.
- **Success Response (200 OK)**:
  ```json
  {
    "valid": true,
    "hard_violation_count": 0,
    "hard_violations": [],
    "soft_total": 48,
    "soft_penalties": { "S1": 10, "S2": 20, "S3": 0, "S4": 12, "S5": 4, "S6": 2 },
    "booking_score": 68.0,
    "priority_inversions": []
  }
  ```

---

### 6. Disruption Management & Rescheduling (Phase 5)

#### `POST /api/v1/disruption/apply`
- **Purpose**: Ingests disruption payload (e.g. `sample_disruption.json`) and runs stability-maximizing repair.
- **Request Body**: Disruption schema with changes array.
- **Success Response (200 OK)**:
  ```json
  {
    "status": "REPAIRED",
    "sessions_moved": 4,
    "time_changed": 1,
    "room_only_changed": 3,
    "hard_violations": 0
  }
  ```

---

### 7. Export Delivery (Phase 8)

#### `GET /api/v1/export/schedule.json`
- **Purpose**: Downloads valid, validator-compliant master timetable, exams, and fest bookings.

#### `GET /api/v1/export/schedule_after.json`
- **Purpose**: Downloads post-disruption repaired timetable meeting hackathon submission criteria.

