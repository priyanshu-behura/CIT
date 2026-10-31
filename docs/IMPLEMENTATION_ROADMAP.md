# Tech-Zephyr Implementation Roadmap

This roadmap defines the step-by-step engineering plan for Tech-Zephyr, organized into focused phases leading to the final hackathon submission.

---

## Roadmap Milestones at a Glance

| Phase | Title | Primary Objective | Output Deliverable |
| :---: | :--- | :--- | :--- |
| **Phase 1** | **Project Foundation** | Scaffold frontend/backend & ingest dataset | *Completed (10/10 tests)* |
| **Phase 1.5** | **Backend Readiness** | Architecture, API contracts & role models | *Completed (docs created)* |
| **Phase 2** | **OR-Tools Solver Engine** | CP-SAT formulation for H1–H14 & S1–S6 | Zero hard-violation timetable |
| **Phase 3** | **Timetable UI & Management** | Interactive multi-view schedule grids | Group/Faculty/Room grid views |
| **Phase 4** | **Booking Workflow** | Priority engine & inversion protection | Spectra Week event schedule |
| **Phase 5** | **Disruption Engine** | Stability-maximizing replanning | `schedule_after.json` generation |
| **Phase 6** | **Role-Based Portals** | Admin, Coordinator, Faculty & Club views | Anti-self-approval workflows |
| **Phase 7** | **AI Booking Assistant** | NLP parser with deterministic safety | Plain-language request parser |
| **Phase 8** | **Validation & Exports** | Full compatibility with `validator.py` | Official export files verified |
| **Phase 9** | **Submission & Packaging** | Final verification, docs & packaging | Competition submission |

---

## Detailed Phase Breakdown

### Phase 2: Scheduling Engine using Google OR-Tools
- **Objective**: Implement exact constraint programming model using `ortools.sat.python.cp_model`.
- **Hard Constraints Implementation**:
  - $H1$: Every session placed once in a valid day ($1..5$) and period ($1..9$).
  - $H2, H3, H4$: Non-overlapping interval constraints for Faculty, Student Groups, and Rooms.
  - $H5$: Venue capacity constraint ($\text{size} \le \text{capacity}$).
  - $H6$: Room type matching ($r.\text{type} \in s.\text{room\_types}$).
  - $H7, H8$: Hard unavailabilities for faculty and rooms.
  - $H9$: Lunch break barrier (no session spans P5 to P6) and lab starts strictly at P2 or P6.
  - $H10$: Accessibility compliance for students and faculty.
  - $H11$: Parallel synchronization of elective baskets (`OE301`, `OE302`, `OE303`).
  - $H12$: Faculty maximum daily teaching limit ($\le 4\text{h}$).
  - $H14$: Fixed slot pinning.
- **Soft Objective Formulation**:
  - Minimize total penalty $Z = 2 \cdot S1 + 1 \cdot S2 + 3 \cdot S3 + 3 \cdot S4 + 1 \cdot S5 + 1 \cdot S6$.
- **Midsem Exam Solver**:
  - Monday–Saturday schedule with AM/PM sessions, half room capacity rule ($\lfloor C/2 \rfloor$), multi-room allocation, and group exam spread.

---

### Phase 3: Timetable Visualization & Management
- **Objective**: Develop interactive visualization matrices with instant feedback.
- **Components**:
  - Cohort Timetable View (by Student Group).
  - Faculty Schedule View (teaching load & free slots).
  - Room Utilization Heatmap (capacity utilization & availability).
  - Manual Move / Drag-and-Drop Editor with live pre-flight constraint validation (refusing any move creating $H1$–$H14$ violations).

---

### Phase 4: Booking Request & Approval Workflow
- **Objective**: Implement Spectra Week (Week 7) booking allocation algorithm.
- **Features**:
  - Role-based priority ranking: $\text{exam} \succ \text{regular} \succ \text{institute} \succ \text{guest} \succ \text{dept} \succ \text{club}$.
  - Category cap enforcement (`role_category_cap`) and timestamp tie-breaking.
  - Automatic detection and prevention of **Priority Inversions**.
  - Alternative venue and time slot generation algorithm for displaced or rejected requests.
  - `session_overrides` generator for approved institute events.

---

### Phase 5: Disruption Handling & Rescheduling
- **Objective**: Implement rapid recovery solver when disruptions occur.
- **Supported Disruption Types**:
  - `faculty_unavailable`: Teacher sick leave / conference travel.
  - `room_unavailable`: Room maintenance or water leak.
  - `add_faculty`, `add_session`, `remove_session`.
- **Stability Metrics**:
  - Minimize total sessions moved ($\Delta \text{sessions}$).
  - Prioritize room-only changes over time changes ($\text{penalty}_{\text{time}} \gg \text{penalty}_{\text{room}}$).

---

### Phase 6: Role-Based Dashboards & Authentication
- **Objective**: Role-segregated views with governance controls.
- **Features**:
  - Admin portal with solver controls and global overrides.
  - Department Coordinator portal with departmental session management.
  - Faculty portal for setting preferences and booking guest lectures.
  - Club Representative portal for event request submissions.
  - **Strict Anti-Self-Approval enforcement**.

---

### Phase 7: AI Assistant with Deterministic Validation
- **Objective**: Plain-language request parser supporting natural inputs (including Hinglish e.g. "kal shaam 6 baje").
- **Safety Boundary**:
  - AI parses input text into structured booking candidate JSON.
  - Structured candidate is passed to deterministic rule validator before any state mutation.
  - Clarification generator when essential information (e.g. attendance, window) is missing.

---

### Phase 8: Testing, Official Validator Integration & Exports
- **Objective**: Rigorous regression testing against official `validator.py`.
- **Deliverables**:
  - `exports/schedule.json`: Generated full baseline schedule.
  - `exports/schedule_after.json`: Repaired schedule after applying `sample_disruption.json`.
  - Automated CI test validating both files report **0 Hard Violations**.

---

### Phase 9: Deployment & Hackathon Packaging
- **Objective**: Final submission preparation.
- **Checklist**:
  - Full README documentation with one-line startup commands.
  - Clean git commit history.
  - Verification on clean environment with zero manual steps.

