import type {
  HealthStatus,
  DatasetSummary,
  RoomItem,
  FacultyItem,
  StudentGroupItem,
  CourseItem,
  SessionItem,
  BookingRequestItem,
  ExamItem,
  User,
  DemoAccount,
  DepartmentItem,
  DetailedSession,
  ScheduledExam,
  BookingRecord,
  DisruptionRecord,
  AnalyticsOverview,
  NotificationItem
} from '../types/dataset';

export interface ChatHistoryItem {
  role: string;
  text: string;
}

export interface AIChatResponse {
  answer: string;
  category: string;
  is_booking_intent?: boolean;
  draft_booking?: any;
  follow_up_questions?: string[];
  needs_input?: boolean;
  needs_input_fields?: string[];
  is_ai_powered?: boolean;
  model?: string;
  fallback_reason?: string;
}

// Normalize API base URL: strips trailing slashes to guarantee clean routing
// When VITE_API_URL is set (production on Vercel), calls hit the deployed FastAPI backend
// When unset/empty (local development), calls fall back to relative paths for Vite proxying
const BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

function getToken(): string | null {
  return localStorage.getItem('tech_zephyr_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('tech_zephyr_token', token);
  } else {
    localStorage.removeItem('tech_zephyr_token');
  }
}

export function formatErrorDetail(detail: any): string {
  if (!detail) return 'Unknown error';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((err) => {
        if (!err) return '';
        if (typeof err === 'string') return err;
        const loc = Array.isArray(err.loc)
          ? err.loc.filter((l: any) => l !== 'body').join('.')
          : err.loc || '';
        const msg = err.msg || err.message || JSON.stringify(err);
        return loc ? `${loc}: ${msg}` : msg;
      })
      .filter(Boolean)
      .join('; ');
  }
  if (typeof detail === 'object') {
    if (detail.message) return String(detail.message);
    if (detail.msg) return String(detail.msg);
    if (detail.detail) return formatErrorDetail(detail.detail);
    return JSON.stringify(detail);
  }
  return String(detail);
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = url.startsWith('/') ? url : `/${url}`;
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail !== undefined) {
        errorDetail = formatErrorDetail(errJson.detail);
      } else if (errJson && errJson.message) {
        errorDetail = errJson.message;
      }
    } catch {
      // ignore
    }
    console.error(`API Error ${response.status} [${url}]:`, errorDetail);
    throw new Error(`API error ${response.status}: ${errorDetail}`);
  }

  return response.json();
}

export const api = {
  // Health & Core Dataset
  getHealth: (): Promise<HealthStatus> => fetchJson<HealthStatus>('/api/health'),
  getDatasetSummary: (): Promise<DatasetSummary> => fetchJson<DatasetSummary>('/api/v1/dataset/summary'),
  getRooms: (): Promise<RoomItem[]> => fetchJson<RoomItem[]>('/api/v1/dataset/rooms'),
  getFaculty: (): Promise<FacultyItem[]> => fetchJson<FacultyItem[]>('/api/v1/dataset/faculty'),
  getStudentGroups: (): Promise<StudentGroupItem[]> => fetchJson<StudentGroupItem[]>('/api/v1/dataset/groups'),
  getCourses: (): Promise<CourseItem[]> => fetchJson<CourseItem[]>('/api/v1/dataset/courses'),
  getSessions: (): Promise<SessionItem[]> => fetchJson<SessionItem[]>('/api/v1/dataset/sessions'),
  getBookings: (): Promise<BookingRequestItem[]> => fetchJson<BookingRequestItem[]>('/api/v1/dataset/bookings'),
  getExams: (): Promise<ExamItem[]> => fetchJson<ExamItem[]>('/api/v1/dataset/exams'),

  // Auth & Roles
  login: (email: string, password: string): Promise<{ access_token: string; user: User }> =>
    fetchJson('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    full_name: string;
    email: string;
    registration_no?: string;
    department: string;
    password: string;
    confirm_password: string;
  }): Promise<{ message: string; user: User }> =>
    fetchJson('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  forgotPassword: (email: string): Promise<{ message: string }> =>
    fetchJson('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyResetToken: (token: string): Promise<{ valid: boolean; email_masked: string }> =>
    fetchJson('/api/v1/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  resetPassword: (
    token: string,
    new_password: string,
    confirm_password: string
  ): Promise<{ message: string }> =>
    fetchJson('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password, confirm_password }),
    }),
  getDepartments: (): Promise<DepartmentItem[]> =>
    fetchJson<DepartmentItem[]>('/api/v1/auth/departments'),
  getMe: (): Promise<User> => fetchJson<User>('/api/v1/auth/me'),
  getDemoAccounts: (): Promise<DemoAccount[]> => fetchJson<DemoAccount[]>('/api/v1/auth/demo-accounts'),

  // Timetable & Solver
  generateTimetable: (): Promise<any> =>
    fetchJson('/api/v1/timetable/generate', { method: 'POST' }),
  startGenerateJob: (): Promise<{ job_id: string; status: string; progress: number; stage: string }> =>
    fetchJson('/api/v1/timetable/generate-async', { method: 'POST' }),
  getGenerateJobStatus: (jobId: string): Promise<any> =>
    fetchJson(`/api/v1/timetable/jobs/${jobId}`),
  getCurrentTimetable: (params: { group?: string; faculty_id?: string; room_id?: string; day?: string } = {}): Promise<{
    dataset_id: string;
    total_scheduled: number;
    filtered_count: number;
    sessions: DetailedSession[];
    calendar: any;
  }> => {
    const q = new URLSearchParams();
    if (params.group) q.set('group', params.group);
    if (params.faculty_id) q.set('faculty_id', params.faculty_id);
    if (params.room_id) q.set('room_id', params.room_id);
    if (params.day) q.set('day', params.day);
    return fetchJson(`/api/v1/timetable/current?${q.toString()}`);
  },
  getExamSchedule: (params: { group?: string; day?: string } = {}): Promise<{
    total_exams: number;
    filtered_count: number;
    exams: ScheduledExam[];
    exam_calendar: any;
  }> => {
    const q = new URLSearchParams();
    if (params.group) q.set('group', params.group);
    if (params.day) q.set('day', params.day);
    return fetchJson(`/api/v1/timetable/exams?${q.toString()}`);
  },
  getValidatorReport: (): Promise<any> => fetchJson('/api/v1/timetable/validate'),

  // Booking & Spectra Week
  getAllBookings: (params: { status?: string; role?: string } = {}): Promise<BookingRecord[]> => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.role) q.set('role', params.role);
    return fetchJson<BookingRecord[]>(`/api/v1/bookings?${q.toString()}`);
  },
  createBooking: (data: any): Promise<any> =>
    fetchJson('/api/v1/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  decideBooking: (bookingId: string, decision: 'approved' | 'rejected' | 'alternative_offered', reason: string, extra: any = {}): Promise<any> =>
    fetchJson(`/api/v1/bookings/${bookingId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason, ...extra }),
    }),
  getSpectraWeek: (): Promise<{ fest_week: string; total_requests: number; cancelled_count: number; active_count: number; bookings: BookingRecord[] }> =>
    fetchJson('/api/v1/bookings/spectra'),
  parseNLPBooking: (prompt: string): Promise<any> =>
    fetchJson('/api/v1/bookings/nlp-parse', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
  getAlternatives: (params: { attendance: number; room_types: string; day?: string; start_period?: number; end_period?: number }): Promise<any[]> => {
    const q = new URLSearchParams({
      attendance: String(params.attendance),
      room_types: params.room_types,
      day: params.day || 'MON',
      start_period: String(params.start_period || 6),
      end_period: String(params.end_period || 8),
    });
    return fetchJson<any[]>(`/api/v1/bookings/alternatives?${q.toString()}`);
  },

  // Disruptions
  getDisruptions: (): Promise<DisruptionRecord[]> => fetchJson<DisruptionRecord[]>('/api/v1/disruptions'),
  createDisruption: (data: any): Promise<any> =>
    fetchJson('/api/v1/disruptions', { method: 'POST', body: JSON.stringify(data) }),
  uploadDisruptionFile: (file: File): Promise<{ status: string; message: string; disruption: any }> => {
    return file.text().then((text) =>
      fetchJson('/api/v1/disruptions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      })
    );
  },
  simulateDisruption: (disruptionId: string): Promise<any> =>
    fetchJson(`/api/v1/disruptions/${disruptionId}/simulate`, { method: 'POST' }),
  approveDisruption: (disruptionId: string): Promise<any> =>
    fetchJson(`/api/v1/disruptions/${disruptionId}/approve`, { method: 'POST' }),

  // Analytics
  getAnalytics: (): Promise<AnalyticsOverview> => fetchJson<AnalyticsOverview>('/api/v1/analytics/overview'),

  // AI Chat
  queryAIChat: (query: string, role?: string, user_email?: string, history?: ChatHistoryItem[]): Promise<AIChatResponse> =>
    fetchJson('/api/v1/chat/query', {
      method: 'POST',
      body: JSON.stringify({ query, role, user_email, history }),
    }),

  // Notifications
  getNotifications: (role?: string): Promise<NotificationItem[]> => {
    const q = role ? `?role=${role}` : '';
    return fetchJson<NotificationItem[]>(`/api/v1/notifications${q}`);
  },
  markNotificationRead: (id: number): Promise<any> =>
    fetchJson(`/api/v1/notifications/${id}/read`, { method: 'POST' }),

  // Admin Operations
  resetDemoData: (): Promise<{ status: string; message: string; baseline_restored: any; official_bookings_count: number }> =>
    fetchJson('/api/v1/admin/reset', { method: 'POST' }),
};
