import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  DoorClosed,
  Users,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Building2,
  GraduationCap,
  Calendar,
  XCircle,
  FileText,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { User, DatasetSummary, DetailedSession, BookingRecord, AnalyticsOverview } from '../types/dataset';

interface DashboardPageProps {
  user: User | null;
  summary: DatasetSummary | null;
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  summary,
  onNavigate,
}) => {
  const [sessions, setSessions] = useState<DetailedSession[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [solveMessage, setSolveMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [ttRes, bRes, anRes] = await Promise.all([
          api.getCurrentTimetable(),
          api.getAllBookings(),
          api.getAnalytics()
        ]);
        setSessions(ttRes.sessions);
        setBookings(bRes);
        setAnalytics(anRes);
      } catch {
        // ignore
      }
    };
    loadDashboardData();
  }, []);

  const handleGenerateTimetable = async () => {
    setIsSolving(true);
    setSolveMessage(null);
    try {
      const res = await api.generateTimetable();
      setSolveMessage(`Solver Success! Scheduled ${res.total_sessions_scheduled} sessions with ${res.hard_violations} hard violations in ${res.solver_duration}s.`);
      const ttRes = await api.getCurrentTimetable();
      setSessions(ttRes.sessions);
    } catch (err: any) {
      setSolveMessage(`Solver Error: ${err?.message || 'Failed to generate timetable'}`);
    } finally {
      setIsSolving(false);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const userBookings = bookings.filter((b) => b.requester_email === user?.email || (user?.role === 'club' && b.role === 'club'));

  // Faculty specific schedule filter
  const facultySessions = user?.role === 'faculty'
    ? sessions.filter((s) => s.faculty_id === 'F01' || s.faculty_name?.includes('Smruti'))
    : sessions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.full_name || 'Academic Administrator'}
            </h2>
            <Badge variant={user?.role === 'admin' ? 'error' : user?.role === 'coordinator' ? 'electric' : user?.role === 'faculty' ? 'success' : 'warning'}>
              {user?.role?.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chilika Institute of Technology &middot; {user?.department ? `${user.department} Department` : 'Central Campus Administration'} &middot; Academic Year 2026–2027
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <button
              onClick={handleGenerateTimetable}
              disabled={isSolving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isSolving ? 'Solving OR-Tools CP-SAT...' : 'Generate Optimized Timetable'}</span>
            </button>
          )}

          {user?.role === 'club' && (
            <button
              onClick={() => onNavigate('bookings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Submit Event Request</span>
            </button>
          )}

          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fest Week</span>
            <span className="text-xs font-bold text-blue-700 font-mono">Week 7 (Spectra '27)</span>
          </div>
        </div>
      </div>

      {/* Solver Notification Banner */}
      {solveMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
          solveMessage.includes('Success')
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>{solveMessage}</span>
          </div>
          <button onClick={() => setSolveMessage(null)} className="text-slate-400 hover:text-slate-600">Dismiss</button>
        </div>
      )}

      {/* Stat Cards Grid - Grounded in Real CIT Dataset */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Teaching Sessions"
          value={summary?.counts.sessions || 189}
          subtitle={`${summary?.counts.total_teaching_hours || 243} teaching hrs/wk`}
          icon={<CalendarDays className="h-5 w-5" />}
          accent="electric"
        />
        <StatCard
          title="Campus Venues"
          value={summary?.counts.rooms || 27}
          subtitle="Auditorium, halls & labs"
          icon={<DoorClosed className="h-5 w-5" />}
          accent="cyan"
        />
        <StatCard
          title="Teaching Faculty"
          value={summary?.counts.faculty || 40}
          subtitle="Across 6 departments"
          icon={<Users className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          title="Midsem Exams"
          value={summary?.counts.exams || 41}
          subtitle="Mon–Sat (Half-cap rule)"
          icon={<FileCheck2 className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* Role-Specific Content Area */}
      {/* 1. ADMIN VIEW */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pending Booking Requests */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Booking Approvals ({pendingBookings.length})</CardTitle>
                  <CardDescription>Decide room allocation based on official priority hierarchy</CardDescription>
                </div>
                <button
                  onClick={() => onNavigate('bookings')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View All Requests <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="pb-2 px-2">Req ID</th>
                      <th className="pb-2 px-2">Requester</th>
                      <th className="pb-2 px-2">Event Title</th>
                      <th className="pb-2 px-2 text-right">Attendance</th>
                      <th className="pb-2 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {pendingBookings.slice(0, 5).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-2 font-mono font-bold text-blue-600">{b.id}</td>
                        <td className="py-2.5 px-2 font-medium text-slate-800">{b.requester_name}</td>
                        <td className="py-2.5 px-2 text-slate-600 max-w-[200px] truncate">{b.title}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-700">{b.attendance}</td>
                        <td className="py-2.5 px-2">
                          <button
                            onClick={() => onNavigate('bookings')}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-[11px] hover:bg-blue-100 transition-colors"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Timetable Schedule Summary */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Scheduled Sessions ({sessions.length})</CardTitle>
                  <CardDescription>Generated via Google OR-Tools CP-SAT solver</CardDescription>
                </div>
                <button
                  onClick={() => onNavigate('timetable')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Full Weekly Grid <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>

              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <div key={s.session_id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{s.course_name}</span>
                        <Badge variant={s.kind === 'lab' ? 'warning' : 'electric'} size="sm">{s.kind}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {s.faculty_name} &middot; Groups: {s.groups.join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-blue-700">{s.day} P{s.start_period}–P{s.end_period}</span>
                      <p className="text-[11px] text-slate-400">{s.room_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Room Utilization & Quick Tools */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Venue Utilization</CardTitle>
                <CardDescription>Based on 45 weekly teaching periods</CardDescription>
              </CardHeader>
              <div className="space-y-3">
                {analytics?.room_utilization?.slice(0, 6).map((r) => (
                  <div key={r.room_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{r.name}</span>
                      <span className="font-mono font-bold text-blue-700">{r.utilization_percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(r.utilization_percent, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Administrative Shortcuts</CardTitle>
                <CardDescription>Official compliance & exports</CardDescription>
              </CardHeader>
              <div className="space-y-2">
                <button
                  onClick={() => onNavigate('reports')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Run Official Validator</p>
                      <p className="text-[10px] text-slate-400">Execute validator.py</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate('disruptions')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Disruption Rescheduling</p>
                      <p className="text-[10px] text-slate-400">Minimal session displacement</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 2. FACULTY VIEW */}
      {user?.role === 'faculty' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>My Weekly Teaching Schedule</CardTitle>
                  <CardDescription>Classes assigned to Dr. Smruti Mohapatra (F01)</CardDescription>
                </div>
                <button
                  onClick={() => onNavigate('timetable')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View Full Grid <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>

              <div className="space-y-2.5">
                {facultySessions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No classes scheduled. Click 'Generate Timetable' or view institute timetable.
                  </div>
                ) : (
                  facultySessions.map((s) => (
                    <div key={s.session_id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{s.course_name} ({s.course_id})</h4>
                          <Badge variant={s.kind === 'lab' ? 'warning' : 'electric'} size="sm">{s.kind}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Room: <strong className="text-slate-800">{s.room_name} ({s.room_id})</strong> &middot; Cohort: {s.groups.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-blue-700">{s.day}</span>
                        <p className="text-xs text-slate-500 font-mono">P{s.start_period}–P{s.end_period}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Workload Policy</CardTitle>
                <CardDescription>Constraint H12 daily limits</CardDescription>
              </CardHeader>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Maximum 4 Hours / Day Respected
                </p>
                <p className="text-emerald-700 leading-normal">
                  The solver guarantees you will never be assigned more than 4 teaching hours on any single day, preventing burnout and lecture fatigue.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 3. CLUB REPRESENTATIVE VIEW */}
      {user?.role === 'club' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>My Event Booking Requests</CardTitle>
                  <CardDescription>Track approval status and venue allocation</CardDescription>
                </div>
                <button
                  onClick={() => onNavigate('bookings')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Submit New Request <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>

              <div className="space-y-3">
                {userBookings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No active booking requests. Use the Natural Language Assistant to book a venue!
                  </div>
                ) : (
                  userBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600">{b.id}</span>
                          <span className="font-bold text-xs text-slate-900">{b.title}</span>
                          <Badge
                            variant={
                              b.status === 'approved' ? 'success' :
                              b.status === 'rejected' ? 'error' :
                              b.status === 'alternative_offered' ? 'warning' : 'neutral'
                            }
                            size="sm"
                          >
                            {b.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Attendance: {b.attendance} &middot; Duration: {b.duration_periods}h
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-800">{b.assigned_room_id || 'Pending Room'}</span>
                        {b.assigned_day && <p className="text-[11px] text-slate-500 font-mono">{b.assigned_day} P{b.assigned_start_period}–P{b.assigned_end_period}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Natural Language Booking</CardTitle>
                <CardDescription>English & Hinglish input</CardDescription>
              </CardHeader>
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Book venues by speaking or typing naturally. The AI assistant extracts all parameters into reviewable drafts.
                </p>
                <button
                  onClick={() => onNavigate('assistant')}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Try AI Booking Assistant
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 4. DEPARTMENT COORDINATOR VIEW */}
      {user?.role === 'coordinator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Department Teaching Load by Faculty</CardTitle>
                  <CardDescription>Real workload aggregated from active timetable sessions</CardDescription>
                </div>
                <button
                  onClick={() => onNavigate('timetable')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View Department Timetable <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="pb-2 px-2">Department</th>
                      <th className="pb-2 px-2 text-right">Faculty</th>
                      <th className="pb-2 px-2 text-right">Total Hrs</th>
                      <th className="pb-2 px-2 text-right">Avg Hrs/Faculty</th>
                      <th className="pb-2 px-2">Load Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {analytics?.department_workload?.map((dept) => (
                      <tr key={dept.department} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-slate-800">{dept.department}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-600">{dept.faculty_count}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-blue-700">{dept.total_teaching_hours}h</td>
                        <td className="py-2.5 px-2 text-right font-mono text-slate-700">{dept.avg_hours_per_faculty.toFixed(1)}h</td>
                        <td className="py-2.5 px-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            dept.avg_hours_per_faculty <= 4
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : dept.avg_hours_per_faculty <= 6
                              ? 'text-amber-700 bg-amber-50 border-amber-200'
                              : 'text-rose-700 bg-rose-50 border-rose-200'
                          }`}>
                            {dept.avg_hours_per_faculty <= 4 ? 'Balanced' : dept.avg_hours_per_faculty <= 6 ? 'Moderate' : 'High Load'}
                          </span>
                        </td>
                      </tr>
                    )) ?? (
                      <tr><td colSpan={5} className="py-4 text-center text-slate-400 text-xs">Loading workload data...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cohort Weekly Hours</CardTitle>
                <CardDescription>Teaching hours by student group</CardDescription>
              </CardHeader>
              <div className="space-y-2 text-xs">
                {analytics?.cohort_workload?.slice(0, 7).map((c) => (
                  <div key={c.group_id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-800">{c.group_id}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({c.size} students)</span>
                    </div>
                    <span className="font-mono text-blue-700 font-bold">{c.weekly_teaching_hours} hrs/wk</span>
                  </div>
                )) ?? <p className="text-xs text-slate-400 text-center py-4">Loading...</p>}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
