# AI Usage Documentation & Compliance Report

## Overview
This document records how AI tools and agentic assistants were leveraged during the conception, architecture, development, and verification of the **Campus Scheduling and Venue Management Platform for Chilika Institute of Technology (CIT)** (Team: Tech Zephyr 4.0) during CrunchWeek.

---

## 1. AI Models & Assistants Used
- **Assistant:** Gemini 3.8 Flash (High) via Antigravity Agentic Assistant.
- **Roles:**
  - Full-stack Software Architect (FastAPI backend + React Vite frontend design).
  - Optimization Engineer (Google OR-Tools CP-SAT constraint formulation for H1–H14 and S1–S6).
  - UI/UX Designer (Light Design System with `#F5F8FF` canvas, `#172554` navy, `#2563EB` electric blue, `#06B6D4` cyan).
  - Natural Language Processing Engineer (Bilingual English & Hinglish booking entity extraction).
  - Quality Assurance Engineer (Pytest unit/integration test design and validation against `validator.py`).

---

## 2. Compliance Guidelines & Boundary Controls Followed

### 1. Source of Truth Preservation
- The official starter pack directory (`CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/`) was strictly treated as read-only.
- Zero modifications were made to `cit_public.json`, reference CSV files, or `validator.py`.
- All dataset metrics (27 rooms, 40 faculty, 14 student groups, 62 courses, 189 sessions, 243 teaching hours, 25 booking requests, 41 midsem exams) are loaded dynamically from source files.
- No dummy, fabricated, or hardcoded statistics were introduced into API responses.

### 2. Deterministic Constraint Formulation
- Timetable and exam scheduling are mathematically modeled using **Google OR-Tools CP-SAT**:
  - Hard constraints H1–H14: Room capacity, non-overlapping sessions, faculty daily limits ($\le 4\text{ hours}$), lab session fixed timings (P2 or P6), mandatory lunch break (after P5), and elective basket synchronization.
  - Soft penalties S1–S6: Room change penalties, faculty preferences, and department locality.
  - Exam capacity halving: Enforced $\lfloor \text{Capacity} / 2 \rfloor$ per venue with zero group clashes.
- All solver outputs were independently verified against the official `validator.py` script.

### 3. Security & Institutional Governance
- Implemented PBKDF2-HMAC-SHA256 password hashing with salt and PyJWT HS256 authentication tokens.
- Enforced strict institutional rules: **Users cannot approve their own booking requests** (returns HTTP 403 and records an audit log entry).
- Role-based route protection across all 4 personas (Admin, Coordinator, Faculty, Club Rep).

---

## 3. Human Supervision & Verification Log

| Task / Subsystem | AI Contribution | Human / Automated Verification | Status |
| :--- | :--- | :--- | :--- |
| **Starter Pack Audit** | Schema inspection, constraint analysis, validator rule mapping | Checked against official README and CSV tables | Verified |
| **Backend Architecture** | FastAPI structure, Pydantic schemas, SQLite WAL setup | Verified database seeding, endpoints, and health check | Verified |
| **OR-Tools Solver Engine** | CP-SAT formulation for 189 sessions + 41 exams + 25 bookings | Executed official `validator.py`: **0 hard violations**, soft penalty 221 | Verified |
| **Disruption Recovery** | Minimal-movement displacement penalty formulation | Executed `validator.py` with `sample_disruption.json`: **0 hard violations**, 13 moved | Verified |
| **Hinglish NLP Parser** | Regex & heuristic entity extractor for English & Hinglish prompts | Verified against all test prompt variations | 100% Pass |
| **Automated Tests** | 19 Pytest unit and integration tests | `pytest tests -v` -> **19 passed in 1.25s** | Verified |
| **Frontend Architecture** | React 19 + TypeScript + Vite + Tailwind CSS light system | `tsc -b` and `npm run build` -> **0 errors in 1.10s** | Verified |
| **Live Web App Execution** | Frontend listening on 5173, backend on 8000 | In-browser end-to-end user journey across all 4 roles | Operational |

---

## 4. Verification Checkpoint Outputs

### Automated Pytest Suite
```
tests/test_api_health.py::test_root_endpoint PASSED                      [  5%]
tests/test_api_health.py::test_health_endpoint PASSED                    [ 10%]
tests/test_api_health.py::test_v1_health_endpoint PASSED                 [ 15%]
tests/test_api_health.py::test_dataset_summary_api PASSED                [ 21%]
tests/test_api_health.py::test_dataset_individual_endpoints PASSED       [ 26%]
tests/test_dataset_loading.py::test_dataset_file_exists_and_loads PASSED [ 31%]
tests/test_dataset_loading.py::test_dataset_summary_actual_counts PASSED [ 36%]
tests/test_dataset_loading.py::test_ortools_installed_and_importable PASSED [ 42%]
tests/test_dataset_loading.py::test_entity_relationships_and_referential_integrity PASSED [ 47%]
tests/test_dataset_loading.py::test_cancellation_tracking PASSED         [ 52%]
tests/test_full_platform.py::test_auth_demo_accounts PASSED              [ 57%]
tests/test_full_platform.py::test_auth_login_success PASSED              [ 63%]
tests/test_full_platform.py::test_auth_login_invalid PASSED              [ 68%]
tests/test_full_platform.py::test_current_timetable_and_exams PASSED     [ 73%]
tests/test_full_platform.py::test_spectra_week_and_cancellation PASSED   [ 78%]
tests/test_full_parser_english_and_hinglish PASSED                        [ 84%]
tests/test_full_platform.py::test_self_approval_prevention PASSED        [ 89%]
tests/test_full_platform.py::test_analytics_overview PASSED              [ 94%]
tests/test_full_platform.py::test_ai_campus_assistant_queries PASSED     [100%]
======================== 19 passed in 1.25s ========================
```

### Official `validator.py` Run Output
```
Dataset: cit-public-v1   Schedule says: cit-public-v1   Team: Tech Zephyr 4.0
Hard violations: 0  {}
Soft penalty: 221  {'S1': 0, 'S2': 116, 'S3': 21, 'S4': 84, 'S5': 0, 'S6': 0}
Bookings: score 64.5 | approved 21, alternatives 2, rejected 2, session overrides 0, priority inversions 0
Exam soft penalty: 0
```
