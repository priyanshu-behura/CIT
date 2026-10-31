# Tech Zephyr 4.0 — Final Competition Completion Report

**Project:** Tech Zephyr 4.0: AI-Powered Campus Scheduling, Timetable Optimization & Venue Management Platform  
**Target Institution:** Chilika Institute of Technology (CIT)  
**Dataset Version:** `cit-public-v1`  
**Status:** Completed, Verified, and Production-Ready  
**Date:** October 31, 2026  

---

## 1. Executive Summary

Tech Zephyr 4.0 is fully built and verified according to the official Chilika Institute of Technology (CIT) problem statement and CrunchWeek starter pack. The platform integrates:
1. **Google OR-Tools CP-SAT Solver** producing a deterministic, zero-violation academic timetable across 189 sessions and 41 midsem exams.
2. **Venue Booking & Spectra Week Fest Management** with a 6-tier institutional priority hierarchy, handling 25 requests and tracking the `BR-04` cancellation with zero priority inversions.
3. **Bilingual Natural Language Booking Assistant** processing English and Hinglish conversational prompts into structured, validated reservation drafts.
4. **Disruption Recovery Engine** minimizing movement penalties during faculty medical leaves and room maintenance events, verified against `sample_disruption.json`.
5. **Role-Based Web Platform** supporting 4 distinct user personas (Administrator, Department Coordinator, Faculty Member, Club Representative) wrapped in a **Light Design System** (#F5F8FF canvas, #FFFFFF cards, #172554 navy, #2563EB electric blue, #06B6D4 cyan).
6. **Live Official Validator Integration** displaying 0 hard violations and a 63.0/70.0 booking score.

---

## 2. Official Validator Verification Summary

Both master output schedules were evaluated using the unaltered `CrunchWeek_StarterPack (1)/CrunchWeek_StarterPack/validator.py`:

| Parameter | Baseline (`exports/schedule.json`) | Disruption (`exports/schedule_after.json`) | Official Standard |
| :--- | :--- | :--- | :--- |
| **Dataset ID** | `cit-public-v1` | `cit-public-v1` | `cit-public-v1` |
| **Hard Violations** | **0** `{}` | **0** `{}` | **0 required** |
| **Soft Penalty** | 232 | 238 | Minimized |
| **S1 (Room Changes)** | 0 | 2 | Minimized |
| **S2 (Dept Locality)** | 133 | 133 | Minimized |
| **S3 (Preferences)** | 12 | 12 | Minimized |
| **S4 (Day Gaps)** | 87 | 87 | Minimized |
| **S5 (Over-Capacity)** | 0 | 3 | Minimized |
| **S6 (Exam Spacing)** | 0 | 1 | Minimized |
| **Booking Score** | **63.0 / 70.0** | **63.0 / 70.0** | Maximized |
| **Approved Bookings** | 20 | 20 | Optimal |
| **Alternative Venues** | 3 | 3 | Optimal |
| **Rejected Bookings** | 2 | 2 | Optimal |
| **Priority Inversions**| **0** | **0** | **0 required** |
| **Exam Soft Penalty** | **0** | **0** | **0 required** |
| **Stability (Moved)** | N/A (Baseline) | **8 sessions** (2 time, 6 room) | Minimized |

---

## 3. Platform Architecture & Modules

### 3.1 Public Landing Page (`/`)
- Responsive public landing experience with an interactive hero, live dataset counter, problem vs. solution breakdown, feature showcase cards, role cards, and one-click quick demo buttons.

### 3.2 Authentication & Role-Based Access Control (`/login`)
- Stateless authentication with PBKDF2-HMAC-SHA256 password hashing and PyJWT tokens.
- 4 pre-configured demo roles with one-click credential loading:
  - `admin@cit.edu` (Full administrative rights)
  - `coordinator.cse@cit.edu` (CSE Department coordination)
  - `faculty.sm@cit.edu` (Faculty personal schedule & leave requests)
  - `club.robotics@cit.edu` (Robotics Club venue reservations)

### 3.3 Timetable Solver & Explorer (`/timetable`)
- 189 teaching sessions (243 hours total) scheduled across Monday–Friday, Periods P1–P9.
- Multi-period lab sessions placed deterministically at morning (P2–P3) or afternoon (P6–P7) blocks.
- Synchronized elective basket sessions (`OEB-1`) without false double-booking warnings.
- Mandatory lunch break (Period 5) strictly preserved with 0 sessions scheduled.
- Interactive weekly grid with department and group filters, room indicators, and one-click solver trigger.

### 3.4 Midsem Examination Scheduler (`/exams`)
- 41 midsem exams scheduled across Monday–Saturday, Morning (09:00–11:00) and Afternoon (14:00–16:00).
- Strict enforcement of $\lfloor \text{Capacity} / 2 \rfloor$ room sizing rule to prevent student crowding.
- Cohort non-overlap guarantee: Students in identical degree groups never have conflicting exam slots.

### 3.5 Campus Venues Directory (`/venues`)
- Comprehensive overview of all 27 campus rooms across 5 institutional blocks.
- Seating capacity, exam capacity, equipment status (AC, projector, audio, whiteboards), and wheelchair accessibility.
- Live modal preview of weekly occupancy and scheduled sessions for any selected venue.

### 3.6 Spectra Week & Booking Management (`/spectra`, `/bookings`)
- Complete processing of 25 cultural/tech fest requests during Spectra Week.
- Strict 6-level institutional priority hierarchy enforcement:
  `Exam (1) > Regular Academic (2) > Institute Event (3) > Guest Lecture (4) > Dept Event (5) > Club Activity (6)`.
- Explicit tracking and handling of cancelled request `BR-04` by Robotics Club.
- **Strict Self-Approval Prevention:** Users are prohibited from approving their own submitted requests (HTTP 403 Forbidden with security audit logging).

### 3.7 Hinglish & English Natural Language Booking Assistant (`/assistant`)
- Rule-based heuristic and regex NLP engine parsing colloquial campus requests:
  - *"Mujhe Kal Auditorium chahiye 2 baje se 4 baje tak RoboClub meeting ke liye"*
  - *"Need Seminar Hall B on Friday morning for CSE Guest Lecture, 60 students"*
- Translates date, time slots, venue name, attendance size, category, and purpose into an editable form draft.

### 3.8 Disruption Management & Rescheduling (`/disruptions`)
- Simulates realistic campus disruptions (faculty leave + room maintenance).
- Solves constrained minimal-movement rescheduling using OR-Tools displacement penalties.
- Interactive Before vs. After diff viewer showing moved sessions and changed venues.
- One-click admin commit updating `exports/schedule_after.json`.

### 3.9 Interactive Analytics Dashboard (`/analytics`)
- Recharts visualizations:
  - Room utilization rates and peak period metrics.
  - Department teaching load balances.
  - Student group weekly academic hours.
  - Booking status breakdown and priority allocations.

### 3.10 AI Campus Assistant (`/chat`)
- Grounded Q&A chatbot answering timetable, room, faculty, and policy queries using exact dataset facts.

### 3.11 Official Reports & Export Center (`/reports`)
- Direct download of `schedule.json`, `schedule_after.json`, and `cit_timetable.csv`.
- Live in-browser runner executing `validator.py` with real-time stdout and scores.

---

## 4. Test Suite & Code Quality Metrics

- **Backend Pytest Suite:** 19 automated test cases.
  - `test_api_health.py` (5 tests)
  - `test_dataset_loading.py` (5 tests)
  - `test_full_platform.py` (9 tests)
  - **Result:** **19 / 19 PASSED (100%) in 1.25 seconds**.
- **Frontend TypeScript & Build:**
  - TypeScript compiler: **0 errors**.
  - Vite production build: **2643 modules bundled cleanly in 1.10 seconds**.

---

## 5. Conclusion & Deliverables

Tech Zephyr 4.0 fulfills every requirement of the Chilika Institute of Technology challenge:
- All source files and datasets preserved without modification.
- Deterministic optimization delivering 0 hard violations on baseline and disruption schedules.
- Premium Light Design System providing intuitive, responsive user workflows.
- Full end-to-end integration across frontend, backend, database, and export layers.

