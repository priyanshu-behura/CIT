export interface HealthStatus {
  status: string;
  project_name: string;
  version: string;
  ortools_available: boolean;
  ortools_version: string | null;
  dataset_loaded: boolean;
  dataset_id: string | null;
}

export interface DatasetCounts {
  rooms: number;
  faculty: number;
  student_groups: number;
  courses: number;
  sessions: number;
  total_teaching_hours: number;
  booking_requests: number;
  cancellations: number;
  active_booking_requests: number;
  exams: number;
  room_unavailability: number;
}

export interface DatasetSummary {
  dataset_id: string;
  institute: string;
  counts: DatasetCounts;
  priority_order: string[];
  role_category_cap: Record<string, string>;
  room_types: Record<string, number>;
  session_kinds: Record<string, number>;
  faculty_departments: Record<string, number>;
  student_group_years: Record<string, number>;
  calendar: {
    days: string[];
    periods: Array<{
      id: number;
      start: string;
      end: string;
      teaching: boolean;
    }>;
    lunch: {
      after_period: number;
      start: string;
      end: string;
    };
    lab_start_periods: number[];
    event_only_periods: number[];
    fest_week: string;
    exam_week: {
      days: string[];
      sessions: Array<{
        id: string;
        start: string;
        end: string;
      }>;
    };
  };
}

export interface RoomItem {
  id: string;
  name: string;
  building: string;
  type: string;
  capacity: number;
  features: string[];
  accessible: boolean;
  allowed_uses: string[];
}

export interface FacultyItem {
  id: string;
  name: string;
  department: string;
  max_hours_per_day: number;
  needs_accessible: boolean;
  unavailable: Array<{ day: string; periods: number[]; reason?: string }>;
  preferences: Array<{ type: string; days?: string[]; periods: number[]; note?: string }>;
}

export interface StudentGroupItem {
  id: string;
  name: string;
  year: number;
  department: string;
  size: number;
  needs_accessible: boolean;
}

export interface CourseItem {
  id: string;
  title: string;
  department: string;
  year: number;
  lecture_hours: number;
  tutorial_hours: number;
  lab_blocks: number;
}

export interface SessionItem {
  id: string;
  course_id: string;
  kind: string;
  groups: string[];
  faculty_id: string;
  size: number;
  duration: number;
  room_types: string[];
  needs_accessible: boolean;
  basket_slot: string | null;
  fixed_slot: { day: string; start_period: number } | null;
}

export interface BookingRequestItem {
  id: string;
  submitted_at: string;
  requester: string;
  role: string;
  department?: string | null;
  requested_category: string;
  title: string;
  attendance: number;
  duration_periods: number;
  windows: Array<{ day: string; from_period: number; to_period: number }>;
  room_types: string[];
  needs: string[];
  requested_room?: string | null;
  mandatory_for_groups: string[];
  series_id?: string | null;
  raw_text: string;
  is_cancelled: boolean;
}

export interface ExamItem {
  id: string;
  course_ids: string[];
  groups: string[];
  size: number;
  duration_hours: number;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'coordinator' | 'faculty' | 'club';
  department?: string;
}

export interface DemoAccount {
  role: 'admin' | 'coordinator' | 'faculty' | 'club';
  role_label: string;
  email: string;
  password: string;
  full_name: string;
  department: string;
  badge_color: string;
  description: string;
}

export interface DetailedSession {
  session_id: string;
  course_id: string;
  course_name: string;
  kind: string;
  duration: number;
  groups: string[];
  faculty_id: string;
  faculty_name: string;
  faculty_dept: string;
  room_id: string;
  room_name: string;
  room_type: string;
  room_capacity: number;
  day: string;
  start_period: number;
  end_period: number;
  basket_slot?: string | null;
  fixed_slot?: { day: string; start_period: number } | null;
}

export interface ScheduledExam {
  exam_id: string;
  course_ids: string[];
  groups: string[];
  student_count: number;
  duration_hours: number;
  day: string;
  session: string;
  assigned_rooms: Array<{
    room_id: string;
    name: string;
    actual_capacity: number;
    effective_exam_capacity: number;
  }>;
  total_effective_seats: number;
  capacity_valid: boolean;
}

export interface BookingRecord {
  id: string;
  requester_name: string;
  requester_email?: string;
  role: string;
  requested_category: string;
  effective_category: string;
  title: string;
  description?: string;
  attendance: number;
  duration_periods: number;
  windows: Array<{ day: string; from_period: number; to_period: number }>;
  room_types: string[];
  needs: string[];
  mandatory_for_groups: string[];
  preferred_room_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'alternative_offered' | 'cancelled';
  assigned_room_id?: string;
  assigned_day?: string;
  assigned_start_period?: number;
  assigned_end_period?: number;
  decision_reason?: string;
  decided_by?: string;
  decided_at?: string;
  submitted_at: string;
}

export interface DisruptionRecord {
  id: string;
  title: string;
  description?: string;
  changes: Array<Record<string, any>>;
  status: 'pending' | 'applied' | 'rejected';
  created_at: string;
  stability_metrics?: {
    sessions_moved?: number;
    time_changed?: number;
    room_only_changed?: number;
    moved_ids?: string[];
  };
  approved_by?: string;
  approved_at?: string;
}

export interface DisruptionDiff {
  session_id: string;
  course_id: string;
  kind: string;
  faculty_id: string;
  groups: string[];
  change_type: 'time_only' | 'room_only' | 'time_and_room' | 'new_session';
  before: { day: string; start_period: number; room_id: string } | null;
  after: { day: string; start_period: number; room_id: string };
}

export interface AnalyticsOverview {
  summary: {
    total_rooms: number;
    total_faculty: number;
    total_student_groups: number;
    total_sessions: number;
    weekly_teaching_hours: number;
    hard_violations: number;
    soft_penalty: number;
  };
  room_utilization: Array<{
    room_id: string;
    name: string;
    type: string;
    capacity: number;
    occupied_hours: number;
    utilization_percent: number;
  }>;
  department_workload: Array<{
    department: string;
    total_teaching_hours: number;
    faculty_count: number;
    avg_hours_per_faculty: number;
  }>;
  cohort_workload: Array<{
    group_id: string;
    year: number;
    size: number;
    weekly_teaching_hours: number;
  }>;
  day_distribution: Array<{ day: string; hours: number }>;
  period_distribution: Array<{ period: string; sessions: number }>;
  booking_stats: {
    by_status: Record<string, number>;
    by_category: Record<string, number>;
  };
}

export interface NotificationItem {
  id: number;
  target_role?: string;
  target_email?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: number;
  created_at: string;
}
