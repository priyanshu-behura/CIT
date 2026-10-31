import re
from typing import Dict, Any, List, Optional
from datetime import datetime

# Map common periods to times and vice-versa
# Teaching: P1=08:00, P2=09:00, P3=10:00, P4=11:00, P5=12:00, P6=14:00, P7=15:00, P8=16:00, P9=17:00
# Evening event: P10=18:00, P11=19:00, P12=20:00, P13=21:00
PERIOD_MAP = {
    8: 1, 9: 2, 10: 3, 11: 4, 12: 5,
    14: 6, 15: 7, 16: 8, 17: 9,
    18: 10, 19: 11, 20: 12, 21: 13
}

DAYS_ENGLISH_HINGLISH = {
    "monday": "MON", "somwar": "MON", "mon": "MON",
    "tuesday": "TUE", "mangalwar": "TUE", "tue": "TUE",
    "wednesday": "WED", "budhwar": "WED", "wed": "WED",
    "thursday": "THU", "guruwar": "THU", "thu": "THU",
    "friday": "FRI", "shukrawar": "FRI", "fri": "FRI",
    "saturday": "SAT", "shaniwar": "SAT", "sat": "SAT"
}

ROOM_TYPE_KEYWORDS = {
    "auditorium": ("auditorium", "AUD"),
    "audi": ("auditorium", "AUD"),
    "seminar": ("seminar_hall", "SH-1"),
    "seminar hall": ("seminar_hall", "SH-1"),
    "lecture hall": ("lecture_hall", "LH-1"),
    "lh": ("lecture_hall", "LH-1"),
    "classroom": ("classroom", "CR-101"),
    "class": ("classroom", "CR-101"),
    "cr": ("classroom", "CR-101"),
    "computing lab": ("lab_cs", "CS-LAB-1"),
    "cs lab": ("lab_cs", "CS-LAB-1"),
    "computer lab": ("lab_cs", "CS-LAB-1"),
    "electronics lab": ("lab_elec", "ELEC-LAB-1"),
    "workshop": ("workshop", "MECH-WS"),
    "open air theatre": ("outdoor", "OAT"),
    "oat": ("outdoor", "OAT")
}

CATEGORY_KEYWORDS = {
    "robotics": ("club_event", "Robotics Workshop"),
    "cultural": ("club_event", "Cultural Fest / Event"),
    "hackathon": ("club_event", "Tech Hackathon"),
    "guest lecture": ("guest_lecture", "Distinguished Guest Lecture"),
    "symposium": ("department_event", "Department Academic Symposium"),
    "meeting": ("department_event", "Faculty & Staff Meeting"),
    "convocation": ("institute_event", "Annual Institute Convocation"),
    "orientation": ("institute_event", "Student Orientation Program"),
    "quiz": ("club_event", "Inter-College Quiz Competition"),
    "workshop": ("club_event", "Hands-on Technical Workshop"),
    "bootcamp": ("club_event", "Student Coding Bootcamp")
}


class NLPBookingService:
    def parse_booking_prompt(self, text: str) -> Dict[str, Any]:
        """
        Parses English or Hinglish natural language booking prompts.
        Extracts structured booking parameters with deterministic fallbacks.
        User reviews and edits this draft in the UI before submitting.
        """
        text_lower = text.lower()
        extracted = {
            "title": "Campus Event",
            "category": "club_event",
            "day": "MON",
            "start_period": 6,
            "end_period": 8,
            "attendance": 60,
            "room_types": ["classroom"],
            "preferred_room_id": "CR-101",
            "needs": ["projector", "ac"],
            "needs_accessible": False,
            "confidence": 0.85,
            "extracted_fields": []
        }

        # 1. Day Extraction (English / Hinglish)
        for keyword, day_code in DAYS_ENGLISH_HINGLISH.items():
            if re.search(rf"\b{keyword}\b", text_lower):
                extracted["day"] = day_code
                extracted["extracted_fields"].append(f"Day: {day_code}")
                break

        # Check for 'tomorrow' / 'kal'
        if "tomorrow" in text_lower or "kal" in text_lower:
            extracted["day"] = "TUE"  # sensible next-day default
            extracted["extracted_fields"].append("Day: TUE (from tomorrow/kal)")

        # 2. Time / Periods Extraction
        # Patterns like: "2 pm to 5 pm", "14:00 to 17:00", "10 am to 1 pm"
        time_match = re.search(r"(\d{1,2})\s*(am|pm)?\s*(?:to|-|se|till)\s*(\d{1,2})\s*(am|pm)", text_lower)
        if time_match:
            start_hr = int(time_match.group(1))
            start_mer = time_match.group(2)
            end_hr = int(time_match.group(3))
            end_mer = time_match.group(4)

            # Convert 12h to 24h
            if start_mer == "pm" and start_hr < 12:
                start_hr += 12
            elif start_mer == "am" and start_hr == 12:
                start_hr = 0
            if end_mer == "pm" and end_hr < 12:
                end_hr += 12
            elif end_mer == "am" and end_hr == 12:
                end_hr = 0

            # Map to nearest period
            sp = PERIOD_MAP.get(start_hr, 6)
            ep = PERIOD_MAP.get(end_hr - 1, sp + 2)
            extracted["start_period"] = sp
            extracted["end_period"] = max(sp, ep)
            extracted["extracted_fields"].append(f"Time: {start_hr}:00 to {end_hr}:00 (P{sp}-P{ep})")
        elif "morning" in text_lower or "subah" in text_lower:
            extracted["start_period"] = 2
            extracted["end_period"] = 4
            extracted["extracted_fields"].append("Time: Morning (P2-P4)")
        elif "evening" in text_lower or "shaam" in text_lower:
            extracted["start_period"] = 10
            extracted["end_period"] = 12
            extracted["extracted_fields"].append("Time: Evening (P10-P12)")

        # 3. Attendance Extraction
        # Look for numbers near "students", "people", "attendees", "log", "candidates"
        att_match = re.search(r"(\d{2,4})\s*(?:students|attendees|people|people|log|seats)?", text_lower)
        if att_match:
            val = int(att_match.group(1))
            if 10 <= val <= 1000:
                extracted["attendance"] = val
                extracted["extracted_fields"].append(f"Attendance: {val}")

        # 4. Room Type & Preferred Room
        for kw, (rtype, pref_id) in ROOM_TYPE_KEYWORDS.items():
            if kw in text_lower:
                extracted["room_types"] = [rtype]
                extracted["preferred_room_id"] = pref_id
                extracted["extracted_fields"].append(f"Room: {rtype} ({pref_id})")
                break

        # 5. Category & Event Title
        for kw, (cat, default_title) in CATEGORY_KEYWORDS.items():
            if kw in text_lower:
                extracted["category"] = cat
                extracted["title"] = default_title
                extracted["extracted_fields"].append(f"Category: {cat}")
                break

        # Custom title from text if "for <event>" or "<event> ke liye"
        for_match = re.search(r"(?:for|liye)\s+([a-zA-Z\s]{4,30})(?:on|from|in|with|$)", text_lower)
        if for_match:
            candidate = for_match.group(1).strip().title()
            if candidate and len(candidate) > 4:
                extracted["title"] = candidate
                extracted["extracted_fields"].append(f"Title: {candidate}")

        # 6. Needs / Features
        needs = []
        if any(w in text_lower for w in ["projector", "screen"]):
            needs.append("projector")
        if any(w in text_lower for w in ["ac", "air condition", "cool"]):
            needs.append("ac")
        if any(w in text_lower for w in ["mic", "pa", "sound", "speaker"]):
            needs.append("pa_system")
        if any(w in text_lower for w in ["computer", "pc", "system"]):
            needs.append("computers")
        if any(w in text_lower for w in ["wheelchair", "accessible", "ramps"]):
            extracted["needs_accessible"] = True
            extracted["extracted_fields"].append("Accessible: True")

        if needs:
            extracted["needs"] = needs
            extracted["extracted_fields"].append(f"Needs: {', '.join(needs)}")

        return extracted


nlp_booking_service = NLPBookingService()

