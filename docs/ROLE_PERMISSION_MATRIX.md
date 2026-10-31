# Tech-Zephyr Role and Permission Architecture

This document specifies the authorization hierarchy, access control rules, and approval workflows across the four user roles at Chilika Institute of Technology (CIT).

---

## 1. User Roles & Institutional Authority

### 1.1 System Administrator (`admin`)
- **Authority**: Campus-wide system management, timetable solver execution, conflict resolution, and final approval for Institute-level events.
- **Category Cap**: `institute_event` (highest event priority).
- **Key Responsibilities**:
  - Run solver engine for regular timetable, midsem exams, and disruption handling.
  - Approve or reject booking requests campus-wide.
  - Authority to approve session displacement (`session_overrides`) for approved institute events.
  - Manage global campus settings, room master records, and blackout periods.

### 1.2 Department Coordinator (`department_coordinator`)
- **Authority**: Department-level timetable curation, faculty workload monitoring, and department event scheduling.
- **Category Cap**: `department_event`.
- **Key Responsibilities**:
  - Request departmental bookings (e.g., industry speaker sessions, department farewells).
  - Review department faculty availability and schedule adjustments within the department.
  - Cannot displace institute events or sessions of other departments.

### 1.3 Faculty Member (`faculty`)
- **Authority**: Individual availability management, teaching preference definition, and guest lecture booking.
- **Category Cap**: `guest_lecture`.
- **Key Responsibilities**:
  - View assigned course sessions and group timetables.
  - Submit avoidance preferences (soft penalty S1) and hard unavailability windows.
  - Request guest lecture venue bookings.
  - Report emergency leave/unavailability for disruption engine replanning.

### 1.4 Club Representative (`club`)
- **Authority**: Student club event planning and venue requests during Spectra Week and event periods (P10–P13).
- **Category Cap**: `club_event` (capped even if requesting higher category).
- **Key Responsibilities**:
  - Submit booking requests with attendance numbers, stage/AV needs, and time windows.
  - Accept or decline alternative venue/time offers.
  - Withdraw/cancel requests (e.g., `BR-04`).

---

## 2. Role-to-Category Mapping & Priority Order

The official priority order from `cit_public.json` determines precedence when resolving competing resource requests:

$$\text{exam} \succ \text{regular\_session} \succ \text{institute\_event} \succ \text{guest\_lecture} \succ \text{department\_event} \succ \text{club\_event}$$

### Role Category Cap Enforcement
A user's claimed category is capped at submission time by their institutional role:
- An Admin request claiming `institute_event` $\to$ effective category: `institute_event`.
- A Faculty request claiming `institute_event` $\to$ capped at: `guest_lecture`.
- A Coordinator claiming `institute_event` $\to$ capped at: `department_event`.
- A Club claiming `institute_event` $\to$ capped at: `club_event`.

Ties between requests of identical effective category are broken strictly by **submission timestamp** (`submitted_at`).

---

## 3. Operations & Approval Requirements Matrix

| Operation | Admin | Department Coordinator | Faculty | Club Representative | Approval Required? | Approving Authority |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **View Timetable & Room Directory** | Full | Full | Full | Full | No | N/A |
| **Run Automated Timetable Solver** | Full | View Only | View Only | No Access | No | Admin Only |
| **Submit Institute Event Request** | Yes | No | No | No | **Yes** | Dual Admin Review |
| **Submit Department Event Request** | Yes | Yes (Own Dept) | No | No | **Yes** | Admin |
| **Submit Guest Lecture Request** | Yes | Yes | Yes (Own) | No | **Yes** | Coordinator / Admin |
| **Submit Club Event Request** | Yes | No | No | Yes (Own Club) | **Yes** | Coordinator / Admin |
| **Approve / Reject Booking Request** | Full | Dept Level Only | No Access | No Access | **Yes** | Strict Enforcement |
| **Displace Regular Session (Week 7)** | Full | No Access | No Access | No Access | **Yes** | Admin (Institute Events Only) |
| **Declare Faculty Emergency Leave** | Full | Dept Level | Own Profile | No Access | **Yes** | Coordinator / Admin |
| **Declare Room Maintenance Blackout** | Full | Dept Labs Only | No Access | No Access | **Yes** | Admin |
| **Trigger Disruption Rescheduler** | Full | No Access | No Access | No Access | **Yes** | Admin Only |
| **Export Official schedule.json** | Full | View / Download | View Only | No Access | No | Admin Only |

---

## 4. Critical Governance & Anti-Corruption Rules

### 4.1 Strict Prohibition on Self-Approval
- **Rule**: **No user may approve, reject, or offer alternatives for their own submitted request.**
- **Enforcement**:
  - If a Department Coordinator submits a request for a departmental seminar, that request must be approved by an Admin or a peer Coordinator from an independent department.
  - If an Admin submits an event request (e.g. Dean of Student Affairs requesting `AUD` for `BR-01`), the decision must be executed by a designated secondary Administrator.
  - Club representatives and individual faculty members have zero approval privileges.

### 4.2 Priority Inversion Prevention
- **Rule**: If a higher-priority request is rejected when an overlapping slot was granted to a lower-priority request that could fit the higher request, the system flags a **Priority Inversion (H13/B1 warning)**.
- Any decision that creates a priority inversion must be rejected by the API validation middleware.

### 4.3 Mandatory Displaced Session Preservation
- **Rule**: In Week 7 (Spectra Week), only approved `institute_event` bookings may displace regular teaching sessions.
- Displaced sessions must be relocated to another valid slot via `session_overrides`, never deleted or dropped.
- Displaced sessions must be verified against hard constraints H1–H14.

