from collections import defaultdict
from typing import Dict, Any, List, Set, Tuple


def diagnose_session_infeasibility(
    session: Dict[str, Any],
    data: Dict[str, Any],
    baseline_assign: Dict[str, Tuple[str, int, str]] = None
) -> Dict[str, Any]:
    """
    Deterministic candidate hard-constraint elimination diagnostic.
    Systematically enumerates all (day, start_period, room) candidates for the session
    and classifies which authoritative hard constraint(s) eliminates each candidate.
    Never hallucinates or invents a constraint.
    """
    sid = session["id"]
    dur = session["duration"]
    kind = session["kind"]
    fac_id = session["faculty_id"]
    groups = session["groups"]
    size = session["size"]
    req_room_types = session.get("room_types", [])
    needs_acc = session.get("needs_accessible", False)
    fx = session.get("fixed_slot")
    bs = session.get("basket_slot")

    days = data["calendar"].get("days", ["MON", "TUE", "WED", "THU", "FRI"])
    max_p = 9  # Teaching periods 1-9
    lunch = data["calendar"]["lunch"]["after_period"]
    lab_starts = data["calendar"].get("lab_start_periods", [2, 6])
    rooms = {r["id"]: r for r in data["rooms"]}
    faculty_dict = {f["id"]: f for f in data["faculty"]}
    fac_obj = faculty_dict.get(fac_id, {})
    fac_max_daily = fac_obj.get("max_hours_per_day", 4)

    # Faculty unavailability set
    fac_un = set()
    for u in fac_obj.get("unavailable", []):
        for p in u.get("periods", []):
            fac_un.add((u["day"], p))

    # Room unavailability set
    room_un = set()
    for u in data.get("room_unavailability", []):
        for p in u.get("periods", []):
            room_un.add((u["room_id"], u["day"], p))

    # Schedule assignments in baseline if provided
    active_assignments = baseline_assign or {}

    # Faculty occupancy from baseline
    fac_occupied = set()
    fac_daily_hours = defaultdict(int)
    for other_sid, (o_d, o_sp, o_rid) in active_assignments.items():
        if other_sid == sid:
            continue
        other_sess = next((s for s in data["sessions"] if s["id"] == other_sid), None)
        if not other_sess:
            continue
        o_dur = other_sess["duration"]
        if other_sess["faculty_id"] == fac_id:
            for p in range(o_sp, o_sp + o_dur):
                fac_occupied.add((o_d, p))
            fac_daily_hours[o_d] += o_dur

    # Room occupancy from baseline
    room_occupied = set()
    for other_sid, (o_d, o_sp, o_rid) in active_assignments.items():
        if other_sid == sid:
            continue
        other_sess = next((s for s in data["sessions"] if s["id"] == other_sid), None)
        if not other_sess:
            continue
        for p in range(o_sp, o_sp + other_sess["duration"]):
            room_occupied.add((o_rid, o_d, p))

    # Student groups occupancy from baseline
    group_occupied = set()
    for other_sid, (o_d, o_sp, o_rid) in active_assignments.items():
        if other_sid == sid:
            continue
        other_sess = next((s for s in data["sessions"] if s["id"] == other_sid), None)
        if not other_sess:
            continue
        if bs and other_sess.get("basket_slot") == bs:
            continue
        for g in other_sess["groups"]:
            if g in groups:
                for p in range(o_sp, o_sp + other_sess["duration"]):
                    group_occupied.add((g, o_d, p))

    all_possible_starts = list(range(1, max_p + 1))
    candidate_eliminations = defaultdict(int)
    unclassified_count = 0
    total_candidates_evaluated = 0

    for d in days:
        for sp in all_possible_starts:
            for rid, r in rooms.items():
                total_candidates_evaluated += 1
                covered_periods = list(range(sp, sp + dur))
                eliminated = False

                # 1. Period bounds & duration
                if sp + dur - 1 > 9:
                    candidate_eliminations["operating_window_exceeded"] += 1
                    eliminated = True
                    continue

                # 2. Fixed slot restriction
                if fx:
                    if d != fx.get("day") or sp != fx.get("start_period"):
                        candidate_eliminations["fixed_slot_mismatch"] += 1
                        eliminated = True
                        continue

                # 3. Lab start period rule
                if kind == "lab" and sp not in lab_starts:
                    candidate_eliminations["lab_start_period_invalid"] += 1
                    eliminated = True
                    continue

                # 4. Lunch break overlap rule (classes cannot straddle lunch)
                if sp <= lunch < sp + dur:
                    candidate_eliminations["lunch_break_clash"] += 1
                    eliminated = True
                    continue

                # 5. Room capacity rule
                if r["capacity"] < size:
                    candidate_eliminations["room_capacity_insufficient"] += 1
                    eliminated = True
                    continue

                # 6. Room type eligibility rule
                if r["type"] not in req_room_types:
                    candidate_eliminations["room_type_ineligible"] += 1
                    eliminated = True
                    continue

                # 7. Room accessibility rule
                if needs_acc and not r.get("accessible", False):
                    candidate_eliminations["room_accessibility_required"] += 1
                    eliminated = True
                    continue

                # 8. Room maintenance / unavailable rule
                if any((rid, d, p) in room_un for p in covered_periods):
                    candidate_eliminations["room_unavailable_maintenance"] += 1
                    eliminated = True
                    continue

                # 9. Room double-booking clash
                if any((rid, d, p) in room_occupied for p in covered_periods):
                    candidate_eliminations["room_double_booking_clash"] += 1
                    eliminated = True
                    continue

                # 10. Faculty unavailable rule
                if any((d, p) in fac_un for p in covered_periods):
                    candidate_eliminations["faculty_unavailable_leave"] += 1
                    eliminated = True
                    continue

                # 11. Faculty double-booking clash
                if any((d, p) in fac_occupied for p in covered_periods):
                    candidate_eliminations["faculty_double_booking_clash"] += 1
                    eliminated = True
                    continue

                # 12. Faculty daily max hours
                if fac_daily_hours[d] + dur > fac_max_daily:
                    candidate_eliminations["faculty_daily_hours_exceeded"] += 1
                    eliminated = True
                    continue

                # 13. Student group double-booking clash
                if any((g, d, p) in group_occupied for g in groups for p in covered_periods):
                    candidate_eliminations["student_group_double_booking_clash"] += 1
                    eliminated = True
                    continue

    sorted_constraints = sorted(candidate_eliminations.items(), key=lambda x: x[1], reverse=True)
    dominant_constraints = [c[0] for c in sorted_constraints[:3]]

    parts = []
    if candidate_eliminations.get("room_capacity_insufficient", 0) > 0 and len(rooms) == sum(1 for r in rooms.values() if r["capacity"] < size):
        parts.append(f"Required capacity {size} exceeds every eligible room on campus.")
    if candidate_eliminations.get("room_unavailable_maintenance", 0) > 0:
        parts.append("Eligible venues are unavailable due to closure or scheduled maintenance.")
    if candidate_eliminations.get("faculty_unavailable_leave", 0) > 0:
        parts.append(f"Assigned faculty {fac_id} is unavailable during the required teaching windows.")
    if candidate_eliminations.get("fixed_slot_mismatch", 0) > 0:
        parts.append("Session is constrained to a fixed slot that conflicts with venue or faculty availability.")
    if candidate_eliminations.get("room_type_ineligible", 0) > 0 and all(r["type"] not in req_room_types for r in rooms.values()):
        parts.append(f"No campus room matches the required room type {req_room_types}.")

    if not parts:
        top_name = dominant_constraints[0] if dominant_constraints else "unclassified_elimination"
        parts.append(f"No valid time slot and room exists satisfying all hard constraints (dominant blocking constraint: {top_name}).")

    explanation = f"Deterministic diagnostic for session {sid}: " + " ".join(parts)

    return {
        "session_id": sid,
        "total_candidates_evaluated": total_candidates_evaluated,
        "candidate_eliminations": dict(candidate_eliminations),
        "dominant_blocking_constraints": dominant_constraints,
        "explanation": explanation,
        "unclassified_eliminations": unclassified_count
    }
