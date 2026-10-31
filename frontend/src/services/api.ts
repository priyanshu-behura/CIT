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
  DetailedSession,
  ScheduledExam,
  BookingRecord,
  DisruptionRecord,
  AnalyticsOverview,
  NotificationItem
} from '../types/dataset';

const BASE_URL = import.meta.env.VITE_API_URL || '';

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

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
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
  simulateDisruption: (disruptionId: string): Promise<any> =>
    fetchJson(`/api/v1/disruptions/${disruptionId}/simulate`, { method: 'POST' }),
  approveDisruption: (disruptionId: string): Promise<any> =>
    fetchJson(`/api/v1/disruptions/${disruptionId}/approve`, { method: 'POST' }),

  // Analytics
  getAnalytics: (): Promise<AnalyticsOverview> => fetchJson<AnalyticsOverview>('/api/v1/analytics/overview'),

  // AI Chat
  queryAIChat: (query: string, role?: string, user_email?: string): Promise<{ answer: string; category: string }> =>
    fetchJson('/api/v1/chat/query', {
      method: 'POST',
      body: JSON.stringify({ query, role, user_email }),
    }),

  // Notifications
  getNotifications: (role?: string): Promise<NotificationItem[]> => {
    const q = role ? `?role=${role}` : '';
    return fetchJson<NotificationItem[]>(`/api/v1/notifications${q}`);
  },
  markNotificationRead: (id: number): Promise<any> =>
    fetchJson(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
};
