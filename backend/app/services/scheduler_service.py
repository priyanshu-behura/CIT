import time
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
from collections import defaultdict
from ortools.sat.python import cp_model
from app.core.config import settings

DAYS = ["MON", "TUE", "WED", "THU", "FRI"]
MAX_PERIOD = 13
LAST_TEACHING = 9
EXAM_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
EXAM_SESSIONS = ["AM", "PM"]


class SchedulerService:
    def __init__(self, data_path: Optional[str] = None):
        self.data_path = Path(data_path or settings.DATASET_PATH)
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

        self.rooms = {r["id"]: r for r in self.data["rooms"]}
        self.faculty = {f["id"]: f for f in self.data["faculty"]}
        self.student_groups = {g["id"]: g for g in self.data["student_groups"]}
        self.sessions = {s["id"]: s for s in self.data["sessions"]}
        self.days = self.data["calendar"]["days"]
        self.lab_starts = set(self.data["calendar"]["lab_start_periods"])
        self.lunch = self.data["calendar"]["lunch"]["after_period"]

        # Precompute unavailabilities
        self.fac_un = defaultdict(set)
        for f in self.data["faculty"]:
            for u in f.get("unavailable", []):
                for p in u["periods"]:
                    self.fac_un[f["id"]].add((u["day"], p))

        self.room_un = defaultdict(set)
        for u in self.data.get("room_unavailability", []):
            for p in u["periods"]:
                self.room_un[u["room_id"]].add((u["day"], p))

    def solve_timetable(
        self,
        custom_data: Optional[Dict[str, Any]] = None,
        baseline_assign: Optional[Dict[str, Tuple[str, int, str]]] = None,
        max_time_seconds: int = 35
    ) -> Dict[str, Any]:
        """
        Solves the CIT 189-session timetable using Google OR-Tools CP-SAT.
        Enforces all hard constraints (H1 - H12, H14) with zero violations.
        If baseline_assign is provided (e.g. during a disruption), penalizes movements
        from the baseline to achieve minimal-movement rescheduling.
        """
        data = custom_data or self.data
        sessions = data["sessions"]
        rooms = {r["id"]: r for r in data["rooms"]}
        faculty = {f["id"]: f for f in data["faculty"]}
        days = data["calendar"]["days"]
        lab_starts = set(data["calendar"]["lab_start_periods"])
        lunch = data["calendar"]["lunch"]["after_period"]

        fac_un = defaultdict(set)
        for f in data["faculty"]:
            for u in f.get("unavailable", []):
                for p in u["periods"]:
                    fac_un[f["id"]].add((u["day"], p))

        room_un = defaultdict(set)
        for u in data.get("room_unavailability", []):
            for p in u["periods"]:
                room_un[u["room_id"]].add((u["day"], p))

        model = cp_model.CpModel()
        start_time = time.time()

        # Decision variables: X[s_id, day, start_p, room_id] = 1 if session is assigned there
        X = {}
        # Mapping to look up which variables cover a specific period (d, p)
        room_period_vars = defaultdict(list)
        fac_period_vars = defaultdict(list)
        group_period_vars = defaultdict(list)  # (group, day, p) -> list of (basket_slot or sid, var)
        basket_day_start_vars = defaultdict(lambda: defaultdict(list))  # basket -> (day, start) -> list of vars
        fac_day_vars = defaultdict(list)  # (fac, day) -> list of (dur, var)

        for s in sessions:
            sid = s["id"]
            dur = s["duration"]
            kind = s["kind"]
            fx = s.get("fixed_slot")
            bs = s.get("basket_slot")
            fac_id = s["faculty_id"]
            groups = s["groups"]

            # Candidate days
            allowed_days = [fx["day"]] if fx else days

            # Candidate start periods
            if fx:
                allowed_starts = [fx["start_period"]]
            elif kind == "lab":
                allowed_starts = [p for p in lab_starts if p + dur - 1 <= LAST_TEACHING]
            else:
                allowed_starts = []
                for p in range(1, LAST_TEACHING - dur + 2):
                    # Must not cross lunch
                    if p <= lunch < p + dur:
                        continue
                    allowed_starts.append(p)

            # Candidate rooms
            allowed_rooms = []
            for r in rooms.values():
                if r["capacity"] < s["size"]:
                    continue
                if r["type"] not in s["room_types"]:
                    continue
                if s.get("needs_accessible") and not r.get("accessible"):
                    continue
                allowed_rooms.append(r["id"])

            s_vars = []
            for d in allowed_days:
                for sp in allowed_starts:
                    covered_periods = list(range(sp, sp + dur))

                    # Check faculty availability
                    if any((d, p) in fac_un[fac_id] for p in covered_periods):
                        continue

                    for rid in allowed_rooms:
                        # Check room availability
                        if any((d, p) in room_un[rid] for p in covered_periods):
                            continue

                        var = model.NewBoolVar(f"x_{sid}_{d}_{sp}_{rid}")
                        X[(sid, d, sp, rid)] = var
                        s_vars.append(var)

                        # Track period occupancy
                        for p in covered_periods:
                            room_period_vars[(rid, d, p)].append(var)
                            fac_period_vars[(fac_id, d, p)].append(var)
                            for g in groups:
                                key = bs if bs else sid
                                group_period_vars[(g, d, p)].append((key, var))

                        fac_day_vars[(fac_id, d)].append((dur, var))

                        if bs:
                            basket_day_start_vars[bs][(d, sp)].append(var)

            # Hard Constraint H1: Exactly one assignment per session
            if not s_vars:
                return {
                    "status": "infeasible",
                    "error": f"No valid slot/room exists for session {sid} satisfying all hard constraints.",
                    "solver_duration": time.time() - start_time
                }
            model.AddExactlyOne(s_vars)

        # Hard Constraint H4: No room double-booking
        for (rid, d, p), vlist in room_period_vars.items():
            if len(vlist) > 1:
                model.Add(sum(vlist) <= 1)

        # Hard Constraint H2: No faculty double-booking
        for (fac_id, d, p), vlist in fac_period_vars.items():
            if len(vlist) > 1:
                model.Add(sum(vlist) <= 1)

        # Hard Constraint H3: No student group double-booking (except same basket slot)
        for (g, d, p), item_list in group_period_vars.items():
            by_key = defaultdict(list)
            for key, var in item_list:
                by_key[key].append(var)

            if len(by_key) > 1:
                key_indicators = []
                for key, kvars in by_key.items():
                    k_ind = model.NewBoolVar(f"grp_{g}_{d}_{p}_{key}")
                    for kv in kvars:
                        model.Add(kv <= k_ind)
                    key_indicators.append(k_ind)
                model.Add(sum(key_indicators) <= 1)

        # Hard Constraint H11: Basket slot synchronization
        # All sessions in basket B must start at the exact same (day, start_period)
        basket_sessions = defaultdict(list)
        for s in sessions:
            if s.get("basket_slot"):
                basket_sessions[s["basket_slot"]].append(s["id"])

        for bs, sids in basket_sessions.items():
            if len(sids) > 1:
                # Find all (d, sp) that appear for any session in this basket
                all_dsp = set()
                for sid in sids:
                    for (sid_k, d, sp, rid) in X.keys():
                        if sid_k == sid:
                            all_dsp.add((d, sp))

                for (d, sp) in all_dsp:
                    b_ind = model.NewBoolVar(f"bstart_{bs}_{d}_{sp}")
                    for sid in sids:
                        dsp_vars = [X[(sid, d, sp, rid)] for (sid_k, d_k, sp_k, rid), var in X.items()
                                    if sid_k == sid and d_k == d and sp_k == sp]
                        model.Add(sum(dsp_vars) == b_ind)

        # Hard Constraint H12: Faculty daily max hours
        for (fac_id, d), items in fac_day_vars.items():
            mx = faculty[fac_id].get("max_hours_per_day", 4)
            model.Add(sum(dur * var for dur, var in items) <= mx)

        # Soft Constraints & Objective
        objective_terms = []

        # If baseline given: minimal movement penalty
        if baseline_assign:
            for (sid, d, sp, rid), var in X.items():
                if sid in baseline_assign:
                    base_d, base_sp, base_rid = baseline_assign[sid]
                    if (d, sp) != (base_d, base_sp):
                        # Moving day or time: weight 20
                        objective_terms.append(20 * var)
                    elif rid != base_rid:
                        # Changing room only: weight 3
                        objective_terms.append(3 * var)
        else:
            # S1: Faculty avoid preferences
            for (sid, d, sp, rid), var in X.items():
                s = self.sessions[sid]
                f_prefs = faculty[s["faculty_id"]].get("preferences", [])
                covered = list(range(sp, sp + s["duration"]))
                for pref in f_prefs:
                    if pref.get("type") == "avoid" and d in pref.get("days", days):
                        avoid_periods = set(pref.get("periods", []))
                        overlap_count = sum(1 for p in covered if p in avoid_periods)
                        if overlap_count > 0:
                            objective_terms.append(2 * overlap_count * var)

                # S5: Room under-utilization (< 40%)
                cap = rooms[rid]["capacity"]
                if cap > 0 and s["size"] / cap < 0.4:
                    objective_terms.append(1 * var)

                # S6: P9 late period usage
                if LAST_TEACHING in covered:
                    objective_terms.append(1 * var)

        if objective_terms:
            model.Minimize(sum(objective_terms))

        # Callback to capture solutions immediately as they are discovered
        class SolutionPrinter(cp_model.CpSolverSolutionCallback):
            def __init__(self, x_dict):
                super().__init__()
                self.x_dict = x_dict
                self.has_solution = False
                self.best_assign = {}
                self.best_sessions = []

            def on_solution_callback(self):
                self.has_solution = True
                self.best_assign = {}
                self.best_sessions = []
                for (sid, d, sp, rid), var in self.x_dict.items():
                    if self.Value(var) == 1:
                        self.best_sessions.append({
                            "session_id": sid,
                            "day": d,
                            "start_period": sp,
                            "room_id": rid
                        })
                        self.best_assign[sid] = (d, sp, rid)

        cb = SolutionPrinter(X)
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = float(max_time_seconds)
        solver.parameters.num_search_workers = 8

        status = solver.Solve(model, cb)
        duration = time.time() - start_time

        if not cb.has_solution:
            return {
                "status": "infeasible",
                "error": "CP-SAT solver returned infeasible with the given constraints.",
                "solver_duration": duration
            }

        scheduled_sessions = cb.best_sessions
        assign_dict = cb.best_assign

        # Sort nicely by day, start_period, room_id
        day_order = {d: i for i, d in enumerate(days)}
        scheduled_sessions.sort(key=lambda x: (day_order.get(x["day"], 99), x["start_period"], x["room_id"]))

        return {
            "status": "optimal" if status == cp_model.OPTIMAL else "feasible",
            "sessions": scheduled_sessions,
            "assign_dict": assign_dict,
            "solver_duration": round(duration, 3),
            "objective_value": solver.ObjectiveValue() if objective_terms and status in (cp_model.OPTIMAL, cp_model.FEASIBLE) else 0
        }

    def solve_exams(self) -> List[Dict[str, Any]]:
        """
        Solves the 41 midsem exams into MON-SAT AM/PM slots.
        Halves effective room capacity (r.capacity // 2).
        Guarantees no room or student group conflict in any slot.
        """
        exams = self.data.get("exams", [])
        cal = self.data["calendar"]["exam_week"]
        days = cal["days"]  # MON..SAT
        sessions_list = [s["id"] for s in cal["sessions"]]  # AM, PM

        # Filter rooms allowed for exams
        exam_rooms = [r for r in self.data["rooms"] if "exam" in r.get("allowed_uses", [])]
        # Sort rooms by capacity descending for efficient packing
        exam_rooms.sort(key=lambda r: r["capacity"], reverse=True)

        model = cp_model.CpModel()

        # Decision variables:
        # For each exam e, slot (d, s), room r: Y[e, d, s, r] = 1 if exam e uses room r in slot (d, s)
        # S[e, d, s] = 1 if exam e is held in slot (d, s)
        Y = {}
        S = {}
        slot_list = [(d, s) for d in days for s in sessions_list]

        for e in exams:
            eid = e["id"]
            slot_vars = []
            for d, s in slot_list:
                s_var = model.NewBoolVar(f"slot_{eid}_{d}_{s}")
                S[(eid, d, s)] = s_var
                slot_vars.append(s_var)

                for r in exam_rooms:
                    y_var = model.NewBoolVar(f"y_{eid}_{d}_{s}_{r['id']}")
                    Y[(eid, d, s, r["id"])] = y_var

                    # y_var can only be 1 if s_var is 1
                    model.Add(y_var <= s_var)

                # If exam in this slot, sum of effective room capacities >= exam size
                model.Add(
                    sum((r["capacity"] // 2) * Y[(eid, d, s, r["id"])] for r in exam_rooms) >= e["size"] * s_var
                )

            # Each exam scheduled in exactly one slot
            model.AddExactlyOne(slot_vars)

        # No room double-booking in any slot
        for d, s in slot_list:
            for r in exam_rooms:
                model.Add(sum(Y[(e["id"], d, s, r["id"])] for e in exams) <= 1)

        # No student group conflict in any slot
        for d, s in slot_list:
            group_exams = defaultdict(list)
            for e in exams:
                for g in e["groups"]:
                    group_exams[g].append(S[(e["id"], d, s)])

            for g, g_vars in group_exams.items():
                if len(g_vars) > 1:
                    model.Add(sum(g_vars) <= 1)

        # Soft objective: minimize student group having > 1 exam on the same day
        day_penalties = []
        for d in days:
            for g in self.student_groups.keys():
                day_g_vars = [S[(e["id"], d, s)] for e in exams if g in e["groups"] for s in sessions_list]
                if len(day_g_vars) > 1:
                    extra = model.NewIntVar(0, len(day_g_vars), f"pen_{g}_{d}")
                    model.Add(extra >= sum(day_g_vars) - 1)
                    day_penalties.append(5 * extra)

        if day_penalties:
            model.Minimize(sum(day_penalties))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 20.0
        status = solver.Solve(model)

        scheduled_exams = []
        for e in exams:
            eid = e["id"]
            for d, s in slot_list:
                if solver.Value(S[(eid, d, s)]) == 1:
                    used_rooms = [r["id"] for r in exam_rooms if solver.Value(Y[(eid, d, s, r["id"])]) == 1]
                    scheduled_exams.append({
                        "exam_id": eid,
                        "day": d,
                        "session": s,
                        "rooms": used_rooms
                    })
                    break

        return scheduled_exams

    def solve_spectra_bookings(self, timetable_assign: Dict[str, Tuple[str, int, str]]) -> Dict[str, Any]:
        """
        Processes all 25 Spectra Week booking requests according to official priority,
        time windows, room capacity, and equipment constraints.
        Returns the exact 'fest_week' block for schedule.json.
        """
        data = self.data
        requests = data.get("booking_requests", [])
        cancelled_ids = {c["request_id"] for c in data.get("cancellations", [])}
        order = data.get("priority_order", [])
        role_cap = data.get("role_category_cap", {})

        def get_eff_cat(req):
            req_cat = req.get("requested_category", "club_event")
            cap = role_cap.get(req.get("role", "club"), "club_event")
            r_idx = order.index(req_cat) if req_cat in order else len(order) - 1
            c_idx = order.index(cap) if cap in order else len(order) - 1
            return order[max(r_idx, c_idx)]

        # Sort active requests by priority (effective category rank, then submitted_at)
        active_reqs = [r for r in requests if r["id"] not in cancelled_ids]
        active_reqs.sort(key=lambda r: (order.index(get_eff_cat(r)), r.get("submitted_at", "")))

        # Track room occupancy (room, day, period) -> request_id or session_id
        room_busy = defaultdict(list)
        for sid, (d, sp, rid) in timetable_assign.items():
            s = self.sessions.get(sid)
            if s:
                for p in range(sp, sp + s["duration"]):
                    room_busy[(rid, d, p)].append(sid)

        # Track group busy (group, day, period)
        grp_busy = defaultdict(set)
        for sid, (d, sp, rid) in timetable_assign.items():
            s = self.sessions.get(sid)
            if s:
                for p in range(sp, sp + s["duration"]):
                    for g in s["groups"]:
                        grp_busy[(g, d, p)].add(sid)

        decisions = []
        session_overrides = []

        # Cancelled requests get rejected status as per validator
        for req in requests:
            if req["id"] in cancelled_ids:
                decisions.append({
                    "request_id": req["id"],
                    "status": "rejected",
                    "reason": "Request was officially cancelled by the requester."
                })

        for req in active_reqs:
            req_id = req["id"]
            dur = req["duration_periods"]
            att = req["attendance"]
            req_rooms = req["room_types"]
            needs = set(req.get("needs", []))
            mand_groups = req.get("mandatory_for_groups", [])

            # Candidate rooms
            candidate_rooms = []
            for r in self.rooms.values():
                if "event" not in r.get("allowed_uses", []):
                    continue
                if r["type"] not in req_rooms:
                    continue
                if r["capacity"] < att:
                    continue
                feats = set(r.get("features", [])) | ({"accessible"} if r.get("accessible") else set())
                if needs - feats:
                    continue
                candidate_rooms.append(r)

            # Sort candidate rooms by capacity fit (closest capacity first)
            candidate_rooms.sort(key=lambda r: r["capacity"])

            # 1. Try approved inside requested windows
            placed = False
            for w in req.get("windows", []):
                w_day = w["day"]
                for sp in range(w["from_period"], w["to_period"] - dur + 2):
                    ep = sp + dur - 1
                    if ep > MAX_PERIOD:
                        continue
                    periods = list(range(sp, ep + 1))

                    # Check group clash
                    if any(grp_busy.get((g, w_day, p)) for g in mand_groups for p in periods):
                        continue

                    for r in candidate_rooms:
                        rid = r["id"]
                        # Check room unavail
                        if any((w_day, p) in self.room_un[rid] for p in periods):
                            continue
                        if any(room_busy[(rid, w_day, p)] for p in periods):
                            continue

                        # Placed approved!
                        for p in periods:
                            room_busy[(rid, w_day, p)].append(req_id)
                        decisions.append({
                            "request_id": req_id,
                            "status": "approved",
                            "day": w_day,
                            "start_period": sp,
                            "end_period": ep,
                            "room_id": rid,
                            "reason": f"Approved inside window {w_day} P{w['from_period']}-P{w['to_period']} in {r['name']}."
                        })
                        placed = True
                        break
                    if placed:
                        break
                if placed:
                    break

            if placed:
                continue

            # 2. Try alternative_offered in evening event periods (P10-P13) or other days
            alt_placed = False
            for alt_day in self.days:
                for sp in range(10, MAX_PERIOD - dur + 2):
                    ep = sp + dur - 1
                    periods = list(range(sp, ep + 1))
                    for r in candidate_rooms:
                        rid = r["id"]
                        if any((alt_day, p) in self.room_un[rid] for p in periods):
                            continue
                        if any(room_busy[(rid, alt_day, p)] for p in periods):
                            continue
                        for p in periods:
                            room_busy[(rid, alt_day, p)].append(req_id)
                        decisions.append({
                            "request_id": req_id,
                            "status": "alternative_offered",
                            "day": alt_day,
                            "start_period": sp,
                            "end_period": ep,
                            "room_id": rid,
                            "reason": f"Alternative evening slot offered at {alt_day} P{sp}-P{ep} in {r['name']}."
                        })
                        alt_placed = True
                        break
                    if alt_placed:
                        break
                if alt_placed:
                    break

            if not alt_placed:
                # Reject with reasoned explanation
                if not candidate_rooms:
                    reason = f"No venue on campus satisfies required room types {req_rooms} and capacity {att}."
                else:
                    reason = f"All compatible venues ({', '.join(r['id'] for r in candidate_rooms[:3])}) are occupied during requested windows."
                decisions.append({
                    "request_id": req_id,
                    "status": "rejected",
                    "reason": reason
                })

        return {
            "session_overrides": session_overrides,
            "bookings": decisions
        }
