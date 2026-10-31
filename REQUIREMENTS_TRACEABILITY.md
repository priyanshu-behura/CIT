# Requirements Traceability & Compliance Matrix
## Campus Scheduling and Venue Management Platform for Chilika Institute of Technology (CIT)

**Date of Audit:** November 1, 2026  
**Status Taxonomy:**
- `PASS`: Verified by executed test or command with documented output.
- `PARTIAL`: Implemented and functional with minor stated gaps.
- `FAIL`: Tested and failed to meet requirement.
- `NOT TESTED`: Implementation exists but was not executed in this pass.
- `PENDING`: Deferral of substantial new development to future milestone.

---

### 1. Core Scheduling Engine Requirements

| ID | Requirement | Status | Evidence / Verification Notes |
| :--- | :--- | :---: | :--- |
| **SCH-01** | All 189 teaching sessions scheduled | **PASS** | `exports/schedule.json` contains exactly 189 sessions. Validator reports 0 unassigned. |
| **SCH-02** | Formulated using Google OR-Tools CP-SAT | **PASS** | Solved via `ortools.sat.python.cp_model` with multi-worker portfolio search (`backend/app/services/scheduler_service.py`). |
| **SCH-03** | Midsem exam scheduling (41 exams) | **PASS** | 41 exams scheduled across MON–SAT AM/PM slots in `exports/schedule.json`. Verified with zero student group clashes. |
| **SCH-04** | Exam venue capacity halving ($\lfloor C / 2 \rfloor$) | **PASS** | `solve_exams()` enforces `r.capacity // 2` for all exam allocations. Validator reports 0 exam violations. |
| **SCH-05** | Baseline schedule validator compliance | **PASS** | Official `validator.py`: **0 hard violations**, soft penalty **232**, bookings score **63.0 / 70.0**. |
| **SCH-06** | Disruption schedule minimal-movement recovery | **PASS** | Official `validator.py`: **0 hard violations**, soft penalty **238**, exactly **8 sessions moved** (2 time, 6 room only). |
| **SCH-07** | Timetable filtering by student group, faculty, room | **PASS** | Implemented in `GET /api/v1/timetable/current?group=&faculty_id=&room_id=`. Verified in test suite. |

---

### 2. Hard & Soft Constraint Compliance (H1–H14 & S1–S6)

| ID | Constraint Definition | Status | Evidence / Verification Notes |
| :--- | :--- | :---: | :--- |
| **H1** | Exactly one assignment per session | **PASS** | `model.AddExactlyOne(s_vars)` verified. 0 unscheduled sessions. |
| **H2** | No faculty double-booking | **PASS** | Pairwise faculty period conflict constraints. `validator.py` hard violations: `{}`. |
| **H3** | No student group double-booking | **PASS** | Group period constraints with elective basket synchronization. |
| **H4** | No room double-booking | **PASS** | Room period occupancy constraints. 0 overlaps reported by validator. |
| **H5** | Room capacity $\ge$ session size | **PASS** | Filtered during domain construction. 0 capacity violations. |
| **H6** | Room equipment & type compatibility | **PASS** | Labs allocated strictly to `lab_cs`, `lab_elec`, or `workshop`. |
| **H7** | Wheelchair accessibility compliance | **PASS** | Accessible rooms assigned whenever `needs_accessible` is requested. |
| **H8** | Multi-period lab sessions contiguous | **PASS** | Lab sessions locked to period blocks starting at P2 or P6. |
| **H9** | Mandatory lunch break (after P5) | **PASS** | Zero teaching sessions scheduled during Period 5–6 boundary (13:00–14:00). |
| **H10**| Faculty availability calendar respected | **PASS** | Unavailability slots blocked in domain initialization. |
| **H11**| Midsem exam slots reserved and non-overlapping | **PASS** | 41 exams scheduled in dedicated exam week slots without overlap. |
| **H12**| Exam capacity halving | **PASS** | Verified via `validator.py` exam check. |
| **H13**| Minimal movement during disruption | **PASS** | Rescheduling penalizes time and room changes; 8 displacements achieved. |
| **H14**| Spectra Week fest requests conflict-free | **PASS** | Allocated in Week 7 without classroom/academic clashes. |
| **S1–S6**| Soft optimization (preferences, gaps, overloads) | **PASS** | Evaluated by `validator.py` (soft penalty: 232 baseline, 238 disruption). |

---

### 3. User Roles, Security & Governance

| ID | Requirement | Status | Evidence / Verification Notes |
| :--- | :--- | :---: | :--- |
| **AUTH-01** | 4 User Roles (Admin, Coordinator, Faculty, Club) | **PASS** | Verified in `test_auth_demo_accounts()`. 4 demo credentials available. |
| **AUTH-02** | JWT Token authentication (no hardcoded secrets) | **PASS** | `security.py` uses `CIT_SECRET_KEY` env var with ephemeral fallback. Verified in `test_jwt_security.py`. |
| **AUTH-03** | Mandatory authentication on booking creation | **PASS** | `POST /api/v1/bookings` returns 401 for unauthenticated requests (`test_booking_auth.py`). |
| **AUTH-04** | Role-based category capping | **PASS** | Club users capped at `club_event` regardless of payload claims (`test_booking_role_capping_club`). |
| **AUTH-05** | Prevention of self-approval | **PASS** | Users attempting to approve their own booking receive HTTP 403 Forbidden (`test_booking_self_approval_and_permissions`). |
| **AUTH-06** | Club cancellation of own booking | **PASS** | Club user can cancel their own pending booking (`test_club_cancellation_own_request`). |
| **AUTH-07** | Coordinator departmental approval scope | **PASS** | Coordinator can approve departmental bookings; cross-department requires Admin. |

---

### 4. Venue Booking & Spectra Week Fest Workflow

| ID | Requirement | Status | Evidence / Verification Notes |
| :--- | :--- | :---: | :--- |
| **BKG-01** | Official booking requests count equals 25 | **PASS** | Database contains exactly 25 official requests (BR-01 to BR-20 with sub-IDs). |
| **BKG-02** | Official cancellation of BR-04 | **PASS** | BR-04 ("Line-follower robot workshop") has status `cancelled` in DB and `cit_public.json`. |
| **BKG-03** | Priority-based booking decisions | **PASS** | High-priority institutional events allocated before club requests. Zero priority inversions in validator. |
| **BKG-04** | Venue alternative discovery | **PASS** | `GET /api/v1/bookings/alternatives` returns compatible available rooms. |

---

### 5. Natural Language Processing (NLP) Parser

| ID | Requirement | Status | Evidence / Verification Notes |
| :--- | :--- | :---: | :--- |
| **NLP-01** | Bilingual English & Hinglish parsing | **PASS** | Tested on 23 sample prompts (`test_parser_detailed_accuracy.py`). |
| **NLP-02** | Parser honesty & missing field flagging | **PASS** | Missing essential fields flag `needs_input=True` and generate follow-up questions. |
| **NLP-03** | Room code parsing isolation (no attendance misparsing) | **PASS** | CR-101, SH-1, LH-2 correctly parsed as venue, never parsed as attendance (`test_room_codes_not_parsed_as_attendance`). |
| **NLP-04** | Hinglish time range with morning/afternoon hints | **PASS** | `"somwar subah 10 se 1 baje"` resolves to 10:00–13:00 (P3–P5) (`test_parser_a_time_range_hinglish_morning_to_afternoon`). |
| **NLP-05** | Multi-day requests preserve both days | **PASS** | `"every Monday and Wednesday"` preserves `['MON', 'WED']` and flags recurrence confirmation (`test_parser_b_multiple_days_recurring_series`). |
| **NLP-06** | Unknown room requests flag room-not-found | **PASS** | Hall 999 and Room 5000 produce room-not-found message with valid campus alternatives (`test_parser_c_unknown_rooms_not_silently_substituted`). |
| **NLP-07** | Invalid times (< 08:00 or > 22:00) rejected | **PASS** | 3 AM request triggers operating hours warning and asks for valid window (`test_parser_d_invalid_operating_hours`). |
| **NLP-08** | Relative dates with Asia/Kolkata zoneinfo | **PASS** | `aaj`, `kal`, `parso` resolve against Asia/Kolkata reference date and require user confirmation (`test_parser_e_relative_dates_asia_kolkata`). |
| **NLP-09** | In-memory draft safety | **PASS** | Parser never saves bookings; user must review, edit, and click submit. |

---

### 6. Background Jobs & Export Isolation

| ID | Requirement | Status | Evidence / Verification Notes |
| :--- | :--- | :---: | :--- |
| **JOB-01** | Asynchronous generation job execution | **PASS** | `POST /timetable/generate-async` returns job ID immediately. Verified in `test_async_job.py`. |
| **JOB-02** | Concurrency thread lock (Single solver run) | **PASS** | Second request receives HTTP 409 Conflict with active job ID (`test_async_generation_concurrency_lock`). |
| **JOB-03** | Status and progress polling | **PASS** | `GET /timetable/jobs/{id}` returns stage and percentage (0% to 100%). |
| **JOB-04** | Atomic DB persistence on completion | **PASS** | Schedule saved to SQLite only upon successful solver completion and validation. |
| **JOB-05** | Dynamic baseline export endpoint | **PASS** | `GET /export/schedule.json` serves current baseline record from SQLite (`test_export_dynamic.py`). |
| **JOB-06** | Strict export type isolation | **PASS** | Baseline export cannot return disruption schedule, and disruption export cannot return baseline (`test_export_isolation.py`). |
| **JOB-07** | Protection of submission files on disk | **PASS** | SHA256 hashes of `exports/*.json` remain identical before and after all runs. |

---

### 7. Explicitly Deferred Large Tasks (Pending Future Milestones)

| Deferred Task | Rationale & Recommendation | Status |
| :--- | :--- | :---: |
| **Admin Demo Data Reset UI** | Resetting database to seed state can be done via re-seed script; implementing a destructive UI endpoint requires role safeguards and audit trail. | **PENDING** |
| **Disruption JSON File Upload UI** | Existing system accepts disruptions via API and built-in scenarios. File upload with custom JSON schema validation is deferred to avoid runtime regressions. | **PENDING** |
| **Deterministic Infeasibility Explanation System** | Basic conflicting session reporting is enabled; generating multi-variable constraint conflict proofs (e.g., Farkas lemma/minimal unsatisfiable core) requires significant solver instrumentation. | **PENDING** |
| **Grounded LLM Session Explanations** | All explanations are currently rule-based and deterministic. Integrating an external LLM for conversational summaries was deferred to maintain zero external network dependency. | **PENDING** |
| **Full 4-Role Cross-Browser Matrix QA** | Desktop (1440px) and mobile (390px) responsive layouts and critical auth/generation browser journeys were tested with Playwright; exhaustive manual QA across Safari/Firefox is deferred. | **PENDING** |
| **Process Crash Mid-Job Browser Recovery** | Documented in README that in-memory job terminates on process kill and UI offers Retry. Automated SIGKILL fault-injection browser test deferred. | **PENDING** |
| **Production Multi-Worker Task Queue** | Running single-worker (`--workers 1`) is verified and documented. Transitioning to Celery/Redis for multi-process worker clusters is deferred. | **PENDING** |

---

### 8. Defect Log & Severity Assessment

| ID | Defect Description | Severity | Status / Resolution |
| :--- | :--- | :---: | :--- |
| **DEF-01** | Anonymous users previously able to submit booking requests | High | **RESOLVED** (`fa3b096`): Enforced JWT authentication on `POST /api/v1/bookings`. |
| **DEF-02** | Hardcoded default JWT secret fallback in `security.py` | Medium | **RESOLVED** (`7541496`): Replaced with `CIT_SECRET_KEY` and ephemeral startup token. |
| **DEF-03** | Room codes (CR-101, SH-1) parsed as attendance numbers | Medium | **RESOLVED** (`fe26807`): Added room code pre-sanitization before digit matching. |
| **DEF-04** | Stale export download if `exports/schedule.json` exists | Medium | **RESOLVED** (`47b0213`): Changed export endpoints to query active SQLite table first. |
| **DEF-05** | Concurrent generation requests could race on CPU | Medium | **RESOLVED** (`eb1d676`): Implemented `GENERATION_LOCK` returning HTTP 409 on second call. |
| **DEF-06** | Test suite orphaned temporary booking rows on failure | Low | **RESOLVED** (`eb1d676`): Added automatic DB state snapshot & purge fixture in `conftest.py`. |
| **DEF-07** | Relative days silently mapped without reference date | Low | **RESOLVED** (`a7fd8d2`): Mapped via Asia/Kolkata timezone with explicit reference date. |
