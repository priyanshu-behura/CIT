# Campus Scheduling and Venue Management Platform for Chilika Institute of Technology (CIT)

**Team:** Tech Zephyr 4.0 | **Institution:** Chilika Institute of Technology (CIT)

This platform is a complete, production-grade academic scheduling, timetable optimization, venue management, and disruption recovery system engineered for the **Chilika Institute of Technology (CIT)** dataset during CrunchWeek.

Powered by **Google OR-Tools CP-SAT constraint programming**, **FastAPI**, **SQLite**, and **React 19 + TypeScript + Vite + Tailwind CSS**, the platform delivers deterministic, zero-violation timetables, conflict-free examination schedules, intelligent venue allocation with strict priority policies, and minimal-movement disruption recovery.

---

## Live System URLs

| Service | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Application** | [http://localhost:5173](http://localhost:5173) | Interactive Light Design System dashboard & landing page |
| **Backend REST API** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Python 3.12 + FastAPI asynchronous API server |
| **Interactive API Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Swagger UI for all REST endpoints |
| **Backend Health Check** | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) | Reports database, dataset, and OR-Tools status |

---

## Demo Role Credentials (One-Click Login in UI)

The platform provides 4 distinct role-based portals with role-tailored dashboards and strict permission boundaries:

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@cit.edu` | `Admin@123` | Full system control, solver execution, disruption commit, booking approvals, global analytics |
| **Department Coordinator** | `coordinator.cse@cit.edu` | `Coord@123` | Department timetable view, exam schedules, departmental venue bookings, conflict monitoring |
| **Faculty Member** | `faculty.sm@cit.edu` | `Faculty@123` | Personal weekly timetable, assigned teaching hours, leave submissions, room availability checks |
| **Club Representative** | `club.robotics@cit.edu` | `Club@123` | Spectra week fest requests, natural-language booking drafts, venue capacity & amenity discovery |

> **Note:** The login screen (`/login`) includes 4 **One-Click Demo Login Cards** that pre-fill credentials for instant access.

---

## Official `validator.py` Verification Results

The official CrunchWeek validator (`validator.py`) was executed directly against both generated schedules using `cit_public.json`:

### 1. Baseline Schedule (`exports/schedule.json`)
```bash
python validator.py --data "CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" --schedule exports/schedule.json
```
```
Dataset: cit-public-v1   Schedule says: cit-public-v1   Team: Tech Zephyr 4.0
Hard violations: 0  {}
Soft penalty: 221  {'S1': 0, 'S2': 116, 'S3': 21, 'S4': 84, 'S5': 0, 'S6': 0}
Bookings: score 64.5 | approved 21, alternatives 2, rejected 2, session overrides 0, priority inversions 0
Exam soft penalty: 0
```
- **Hard Violations:** **0** (H1–H14 satisfied 100%)
- **Booking Score:** **64.5 / 70.0** (21 Approved, 2 Alternatives, 2 Rejected, 0 Inversions)
- **Exam Soft Penalty:** **0** (All exam constraints satisfied)

### 2. Disruption Schedule (`exports/schedule_after.json`)
```bash
python validator.py --data "CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" --schedule exports/schedule_after.json --baseline exports/schedule.json --disruption "CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/examples/sample_disruption.json"
```
```
Dataset: cit-public-v1   Schedule says: cit-public-v1   Team: Tech Zephyr 4.0
Hard violations: 0  {}
Soft penalty: 232  {'S1': 2, 'S2': 119, 'S3': 21, 'S4': 84, 'S5': 4, 'S6': 2}
Bookings: score 64.5 | approved 21, alternatives 2, rejected 2, session overrides 0, priority inversions 0
Exam soft penalty: 0
Stability: 13 sessions moved (1 changed time, 12 room only)
```
- **Hard Violations:** **0**
- **Disruption Recovery:** Minimal movement penalty achieved (only 1 session changed time; 12 sessions reallocated rooms).
- **Priority Inversions:** **0**

---

## Key Features & Architecture

### 1. Public Landing Page (`/`)
- Professional hero banner with live dataset statistics (27 venues, 40 faculty, 189 sessions, 41 midsem exams).
- Interactive problem-solution matrix contrasting legacy spreadsheet chaos against the platform's CP-SAT engine.
- 6 feature showcase cards, 4 role portal overviews, workflow diagram, and direct demo access.

### 2. Google OR-Tools CP-SAT Timetable Engine (`/timetable`)
- Formulates and solves all 189 teaching sessions (243 hours total) across Monday–Friday, Periods P1–P9.
- **Strictly satisfies hard constraints H1–H14:**
  - Mandatory lunch break after Period 5 (13:00–14:00) with zero sessions scheduled.
  - Multi-period lab sessions (2-hour blocks) locked to either morning (P2–P3) or afternoon (P6–P7).
  - Open elective / basket slots (e.g., `OEB-1`) perfectly synchronized across parallel student groups.
  - Faculty daily workload capped at a maximum of 4 teaching hours.
  - Room capacities strictly enforced with equipment compatibility (lab vs. lecture hall).
  - Department room locality prioritized (S2).

### 3. Midsem Examination Scheduler (`/exams`)
- Schedules 41 midsem exams across Monday–Saturday in morning (AM: 09:00–11:00) and afternoon (PM: 14:00–16:00) slots.
- **Enforces the halved room capacity rule:** $\lfloor \text{Capacity} / 2 \rfloor$ per venue during examinations to ensure anti-cheating spacing.
- Prevents multi-exam clashes for students belonging to the same academic groups.

### 4. Venues & Rooms Directory (`/venues`)
- Comprehensive directory of all 27 campus rooms across 5 blocks (Academic Block A/B/C, Admin Block, Science Block).
- Displays room type, seating capacity, exam capacity, wheelchair accessibility status, and installed equipment.
- Interactive **"View Live Schedule" modal** showing the weekly occupancy timetable for any selected venue.

### 5. Spectra Week Booking & Priority Management (`/spectra`, `/bookings`)
- Evaluates 25 festival booking requests for the annual cultural and technical fest (Spectra Week).
- Enforces the strict **6-tier institutional priority hierarchy**:
  `Exam (1) > Regular Academic (2) > Institute Event (3) > Guest Lecture (4) > Department Event (5) > Club Activity (6)`.
- Automatically recognizes and processes the cancellation of `BR-04` by the Robotics Club.
- **Strict Self-Approval Prevention:** Prevents administrative users from approving their own submitted requests (returns `403 Forbidden` and creates an audit log entry).

### 6. Natural-Language Booking Assistant (`/assistant`)
- Supports free-form **English and Hinglish** booking prompts, such as:
  - *"Mujhe Kal Auditorium chahiye 2 baje se 4 baje tak RoboClub meeting ke liye, capacity 150 log"*
  - *"Need Seminar Hall B on Friday morning for CSE Guest Lecture, 60 students"*
  - *"Book LH-101 on Wednesday P3 to P5 for urgent departmental seminar"*
- Automatically extracts date, start/end period, preferred room, attendee count, category, and purpose into an editable booking form before submission.

### 7. Disruption Management & Minimal-Movement Rescheduling (`/disruptions`)
- Simulates real campus disruptions (e.g., faculty medical leave + room water leak/maintenance).
- Formulates a constrained displacement penalty in OR-Tools to solve rescheduling while minimizing student and faculty schedule disruption.
- Provides an interactive **Before vs. After comparison table** highlighting moved sessions, period shifts, and room changes.
- Commits approved disruption resolutions to `exports/schedule_after.json`.

### 8. Campus Analytics & Intelligence (`/analytics`)
- Interactive Recharts visual dashboard:
  - Hourly room utilization heatmap and % capacity usage.
  - Department faculty teaching load distribution.
  - Student group weekly workload progression (Mon–Fri).
  - Booking approval breakdown and category distribution.

### 9. Grounded AI Campus Assistant (`/chat`)
- Natural-language Q&A interface grounded strictly in CIT campus data and operational rules.
- Answers inquiries regarding room facilities, faculty schedules, lunch period timings, Spectra week policies, and room capacities without hallucination.

### 10. Official Reports & Validator Integration (`/reports`)
- One-click downloads of official competition exports:
  - `exports/schedule.json` (Full baseline schedule + bookings + exams).
  - `exports/schedule_after.json` (Disruption recovered schedule).
  - `cit_timetable.csv` (Tabular format for academic administration).
- In-browser execution of `validator.py` with real-time terminal stdout and score display.

---

## Premium Light Design System

The platform strictly uses a light enterprise theme:
- **Canvas Background:** `#F5F8FF` (Ultra-light airy slate-blue)
- **Surfaces & Cards:** `#FFFFFF` (Pure white cards with subtle `#E2E8F0` borders and soft shadows)
- **Primary Typography:** `#172033` (High-contrast slate dark)
- **Muted Typography:** `#64748B` (Secondary descriptions and metadata)
- **Primary Accent:** `#2563EB` (Electric Blue)
- **Brand Navy:** `#172554` (Deep navy headers, topbar, and primary actions)
- **Cyan Accent:** `#06B6D4` (Highlights, indicators, and feature badges)

---

## Directory Structure

```
Tech-Zephyr/
├── CrunchWeek_StarterPack (1)/       # Official competition pack (PRESERVED AS SOURCE OF TRUTH)
│   └── CrunchWeek_StarterPack/
│       ├── validator.py              # Ground-truth verification engine
│       ├── data/cit_public.json      # Master dataset
│       └── examples/                 # sample_disruption.json, schedule.example.json
│
├── backend/                          # Python 3.12 + FastAPI backend
│   ├── app/
│   │   ├── api/                      # REST endpoints (auth, timetable, bookings, disruptions, etc.)
│   │   ├── core/                     # Security (PBKDF2, PyJWT), SQLite DB, settings
│   │   ├── models/                   # Pydantic schemas
│   │   ├── services/                 # Scheduler (OR-Tools), NLP parser, disruptions, AI chat
│   │   └── main.py                   # FastAPI lifespan application factory
│   ├── tests/                        # 19 automated pytest test cases
│   ├── tech_zephyr.db               # SQLite database with WAL mode
│   └── requirements.txt              # FastAPI, OR-Tools, PyJWT, pytest
│
├── frontend/                         # React 19 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/               # Navbar, Sidebar, Topbar, Search, Notifications
│   │   ├── pages/                    # 13 dedicated application pages
│   │   ├── services/api.ts           # Axios-based typed client with JWT interceptor
│   │   ├── types/dataset.ts          # Complete TypeScript interfaces for CIT entities
│   │   ├── App.tsx                   # Master router with role guard
│   │   └── index.css                 # Premium Light Design System Tailwind styling
│   ├── tailwind.config.js            # Light theme color palette and styling tokens
│   └── vite.config.ts                # Vite config with backend proxy on port 8000
│
├── exports/                          # Official competition deliverables
│   ├── schedule.json                 # Baseline schedule (0 hard violations, 64.5 booking score)
│   └── schedule_after.json           # Disruption schedule (0 hard violations, 13 moved)
│
├── docs/                             # Architecture & specification documentation
│   ├── API_CONTRACT.md               # Complete REST API contract
│   ├── ROLE_PERMISSIONS.md           # Role-based access control matrix
│   └── FINAL_COMPLETION_REPORT.md    # Competition submission summary
│
├── AI_USAGE.md                       # AI usage & prompt documentation
├── THIRD_PARTY.md                    # Open-source licenses & dependency list
└── README.md                         # Project documentation
```

---

## Installation & Running Instructions

### Prerequisites
- **Python 3.12+**
- **Node.js 18+** (Node 20+ recommended)
- **Git**

### 1. Backend Setup & Startup

```bash
# Navigate to the backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest tests -v

# Start backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000` (docs at `http://127.0.0.1:8000/docs`).

> [!IMPORTANT]
> **Environment Configuration & Deployment Secret:**  
> Copy `.env.example` to `.env`. In local development/test mode, an ephemeral random 256-bit+ secret is automatically generated at startup if unset. For production deployments (`APP_ENV=production`), setting a real secret key via `CIT_SECRET_KEY` is strictly required (generate using `python -c "import secrets; print(secrets.token_urlsafe(48))"`).  
> The 4 demo credentials listed above (`admin@cit.edu`, `coordinator.cse@cit.edu`, `faculty.sm@cit.edu`, `club.robotics@cit.edu`) are documented strictly for demo access and evaluator testing.

### 2. Frontend Setup & Startup

```bash
# In a separate terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Build for production (verifies TypeScript types & CSS)
npm run build

# Start Vite development server
npm run dev
```
The frontend is now available at `http://localhost:5173`.

---

## Verification & Testing Commands

### Run All Backend Automated Tests
```bash
cd backend
pytest tests -v
```
**Result:** 19/19 tests pass in ~1.3s covering API health, dataset integrity, auth, timetable, NLP parser, self-approval prevention, disruptions, and AI chat.

### Run Official Validator on Baseline Schedule
```bash
python "CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py" --data "CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" --schedule exports/schedule.json
```

### Run Official Validator on Disruption Recovery Schedule
```bash
python "CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py" --data "CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/data/cit_public.json" --schedule exports/schedule_after.json --baseline exports/schedule.json --disruption "CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/examples/sample_disruption.json"
```

---

## License & Attribution

- **Developed for:** CrunchWeek Hackathon (Team: Tech Zephyr 4.0).
- **Dataset:** Chilika Institute of Technology (CIT) Public v1 (`cit_public.json`).
- **Core Optimization Engine:** Google OR-Tools (Apache 2.0).
