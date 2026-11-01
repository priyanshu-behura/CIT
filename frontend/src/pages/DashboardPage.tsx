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
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { StarBorder } from '../components/ui/StarBorder';
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
  const [isTimetableLoading, setIsTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState<string | null>(null);

  // Admin Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTimetable = async () => {
    setIsTimetableLoading(true);
    setTimetableError(null);
    try {
      const ttRes = await api.getCurrentTimetable();
      setSessions(ttRes.sessions || []);
    } catch (err: any) {
      setTimetableError(err?.message || 'Failed to load timetable schedule');
    } finally {
      setIsTimetableLoading(false);
    }
  };

  const loadOtherData = async () => {
    try {
      const [bRes, anRes] = await Promise.allSettled([
        api.getAllBookings(),
        api.getAnalytics()
      ]);
      if (bRes.status === 'fulfilled') setBookings(bRes.value);
      if (anRes.status === 'fulfilled') setAnalytics(anRes.value);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTimetable();
    loadOtherData();
  }, []);

  const handleGenerateTimetable = async () => {
    setIsSolving(true);
    setSolveMessage(null);
    try {
      const res = await api.generateTimetable();
      setSolveMessage(`Solver Success! Scheduled ${res.total_sessions_scheduled} sessions with ${res.hard_violations} hard violations in ${res.solver_duration}s.`);
      await fetchTimetable();
    } catch (err: any) {
      setSolveMessage(`Solver Error: ${err?.message || 'Failed to generate timetable'}`);
    } finally {
      setIsSolving(false);
    }
  };

  const handleAdminReset = async () => {
    setIsResetting(true);
    setResetFeedback(null);
    try {
      const res = await api.resetDemoData();
      setResetFeedback({
        type: 'success',
        message: `${res.message} (Restored Soft Penalty: ${res.baseline_restored?.soft_penalty ?? 232}, Hard Violations: ${res.baseline_restored?.hard_violations ?? 0})`
      });
      // Refresh dashboard data
      fetchTimetable();
      loadOtherData();
      setShowResetModal(false);
    } catch (err: any) {
      setResetFeedback({
        type: 'error',
        message: err?.message || 'Failed to reset demo data. Please try again.'
      });
    } finally {
      setIsResetting(false);
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
      <div className="bg-[#FBF8F3] rounded-2xl border border-[#1E1915]/10 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-[#1E1915] tracking-tight">
              Welcome back, {user?.full_name || 'Academic Administrator'}
            </h2>
            <Badge variant={user?.role === 'admin' ? 'error' : user?.role === 'coordinator' ? 'academic' : user?.role === 'faculty' ? 'success' : 'warning'}>
              {user?.role?.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-[#5B5048] mt-1 font-sans">
            Chilika Institute of Technology &middot; {user?.department ? `${user.department} Department` : 'Central Campus Administration'} &middot; Academic Year 2026–2027
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setShowResetModal(true)}
                disabled={isSolving || isResetting}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50/70 hover:bg-rose-100 text-rose-800 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                title="Reset database to clean baseline snapshot (Admin Only)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Demo State</span>
              </button>

              <StarBorder
                as="button"
                onClick={handleGenerateTimetable}
                disabled={isSolving || isResetting}
                radius={12}
                color="#C8693F"
                trailColor="#A9502B"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{isSolving ? 'Solving OR-Tools CP-SAT...' : 'Generate Optimized Timetable'}</span>
              </StarBorder>
            </>
          )}

          {user?.role === 'club' && (
            <StarBorder
              as="button"
              onClick={() => onNavigate('bookings')}
              radius={12}
              color="#C8693F"
              trailColor="#A9502B"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Submit Event Request</span>
            </StarBorder>
          )}

          <div className="px-3.5 py-2 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 text-right">
            <span className="text-[10px] font-bold text-[#5B5048] uppercase tracking-wider block font-mono">Fest Week</span>
            <span className="text-xs font-bold text-[#A9502B] font-mono">Week 7 (Spectra '27)</span>
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

      {/* Admin Reset Feedback Banner */}
      {resetFeedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
          resetFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {resetFeedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            )}
            <span>{resetFeedback.message}</span>
          </div>
          <button onClick={() => setResetFeedback(null)} className="text-slate-400 hover:text-slate-600 font-semibold text-xs">Dismiss</button>
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
                  className="text-xs font-semibold text-[#A9502B] hover:text-[#8F3F1E] flex items-center gap-1"
                >
                  View All Requests <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E1915]/10 text-[#5B5048] font-mono uppercase text-[10px]">
                      <th className="pb-2 px-2">Req ID</th>
                      <th className="pb-2 px-2">Requester</th>
                      <th className="pb-2 px-2">Event Title</th>
                      <th className="pb-2 px-2 text-right">Attendance</th>
                      <th className="pb-2 px-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1915]/10 font-sans">
                    {pendingBookings.slice(0, 5).map((b) => (
                      <tr key={b.id} className="hover:bg-[#F3ECE2]/60 transition-colors">
                        <td className="py-2.5 px-2 font-mono font-bold text-[#A9502B]">{b.id}</td>
                        <td className="py-2.5 px-2 font-medium text-[#1E1915]">{b.requester_name}</td>
                        <td className="py-2.5 px-2 text-[#5B5048] max-w-[200px] truncate">{b.title}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-[#1E1915]">{b.attendance}</td>
                        <td className="py-2.5 px-2">
                          <button
                            onClick={() => onNavigate('bookings')}
                            className="px-2.5 py-1 rounded-lg bg-[#A9502B]/10 text-[#A9502B] font-semibold text-[11px] hover:bg-[#A9502B]/20 transition-colors"
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
                  className="text-xs font-semibold text-[#A9502B] hover:text-[#8F3F1E] flex items-center gap-1"
                >
                  Full Weekly Grid <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>

              {isTimetableLoading ? (
                <div className="p-8 text-center text-xs text-[#5B5048] flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#A9502B]" />
                  <span>Loading scheduled sessions...</span>
                </div>
              ) : timetableError ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span>{timetableError}</span>
                  <button
                    onClick={fetchTimetable}
                    className="px-2.5 py-1 rounded bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-medium text-xs transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5B5048]">
                  No sessions scheduled. Click 'Generate Optimized Timetable' to run the solver.
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 5).map((s) => (
                    <div key={s.session_id} className="p-3 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E1915]">{s.course_name}</span>
                          <Badge variant={s.kind === 'lab' ? 'warning' : 'academic'} size="sm">{s.kind}</Badge>
                        </div>
                        <p className="text-[11px] text-[#5B5048] mt-0.5">
                          {s.faculty_name} &middot; Groups: {s.groups.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#243C50]">{s.day} P{s.start_period}–P{s.end_period}</span>
                        <p className="text-[11px] text-[#5B5048]">{s.room_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      <span className="font-medium text-[#1E1915]">{r.name}</span>
                      <span className="font-mono font-bold text-[#A9502B]">{r.utilization_percent}%</span>
                    </div>
                    <div className="w-full bg-[#EAE2D7] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#A9502B] h-1.5 rounded-full"
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
                  className="w-full p-2.5 rounded-xl border border-[#1E1915]/10 bg-[#F3ECE2] hover:bg-[#F3ECE2]/70 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    <div>
                      <p className="text-xs font-semibold text-[#1E1915]">Run Official Validator</p>
                      <p className="text-[10px] text-[#5B5048]">Execute validator.py</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#5B5048]" />
                </button>

                <button
                  onClick={() => onNavigate('disruptions')}
                  className="w-full p-2.5 rounded-xl border border-[#1E1915]/10 bg-[#F3ECE2] hover:bg-[#F3ECE2]/70 text-left flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-[#A9502B]" />
                    <div>
                      <p className="text-xs font-semibold text-[#1E1915]">Disruption Rescheduling</p>
                      <p className="text-[10px] text-[#5B5048]">Minimal session displacement</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#5B5048]" />
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
                  className="text-xs font-semibold text-[#A9502B] hover:text-[#8F3F1E] flex items-center gap-1"
                >
                  View Full Grid <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>

              <div className="space-y-2.5">
                {isTimetableLoading ? (
                  <div className="p-8 text-center text-xs text-[#5B5048] flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#A9502B]" />
                    <span>Loading teaching schedule...</span>
                  </div>
                ) : timetableError ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <span>{timetableError}</span>
                    <button
                      onClick={fetchTimetable}
                      className="px-2.5 py-1 rounded bg-amber-200/60 hover:bg-amber-200 text-amber-900 font-medium text-xs transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : facultySessions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#5B5048]">
                    No classes scheduled. Click 'Generate Timetable' or view institute timetable.
                  </div>
                ) : (
                  facultySessions.map((s) => (
                    <div key={s.session_id} className="p-3.5 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-serif font-bold text-[#1E1915]">{s.course_name} ({s.course_id})</h4>
                          <Badge variant={s.kind === 'lab' ? 'warning' : 'academic'} size="sm">{s.kind}</Badge>
                        </div>
                        <p className="text-xs text-[#5B5048] mt-1">
                          Room: <strong className="text-[#1E1915]">{s.room_name} ({s.room_id})</strong> &middot; Cohort: {s.groups.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-[#A9502B]">{s.day}</span>
                        <p className="text-xs text-[#5B5048] font-mono">P{s.start_period}–P{s.end_period}</p>
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
              <div className="p-4 rounded-xl bg-[#243C50]/10 border border-[#243C50]/20 text-xs text-[#243C50] space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#243C50]" />
                  Maximum 4 Hours / Day Respected
                </p>
                <p className="text-[#243C50]/90 leading-normal">
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
                  className="text-xs font-semibold text-[#A9502B] hover:text-[#8F3F1E] flex items-center gap-1"
                >
                  Submit New Request <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>

              <div className="space-y-3">
                {userBookings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#5B5048]">
                    No active booking requests. Use the Natural Language Assistant to book a venue!
                  </div>
                ) : (
                  userBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="p-3.5 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#A9502B]">{b.id}</span>
                          <span className="font-serif font-bold text-xs text-[#1E1915]">{b.title}</span>
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
                        <p className="text-xs text-[#5B5048] mt-1">
                          Attendance: {b.attendance} &middot; Duration: {b.duration_periods}h
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#1E1915]">{b.assigned_room_id || 'Pending Room'}</span>
                        {b.assigned_day && <p className="text-[11px] text-[#5B5048] font-mono">{b.assigned_day} P{b.assigned_start_period}–P{b.assigned_end_period}</p>}
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
                <p className="text-xs text-[#5B5048]">
                  Book venues by speaking or typing naturally. The AI assistant extracts all parameters into reviewable drafts.
                </p>
                <button
                  onClick={() => onNavigate('assistant')}
                  className="w-full py-2.5 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] font-semibold text-xs transition-colors flex items-center justify-center gap-2"
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
                  className="text-xs font-semibold text-[#A9502B] hover:text-[#8F3F1E] flex items-center gap-1"
                >
                  View Department Timetable <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E1915]/10 text-[#5B5048] font-mono uppercase text-[10px]">
                      <th className="pb-2 px-2">Department</th>
                      <th className="pb-2 px-2 text-right">Faculty</th>
                      <th className="pb-2 px-2 text-right">Total Hrs</th>
                      <th className="pb-2 px-2 text-right">Avg Hrs/Faculty</th>
                      <th className="pb-2 px-2">Load Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1915]/10 font-sans">
                    {analytics?.department_workload?.map((dept) => (
                      <tr key={dept.department} className="hover:bg-[#F3ECE2]/60 transition-colors">
                        <td className="py-2.5 px-2 font-bold text-[#1E1915]">{dept.department}</td>
                        <td className="py-2.5 px-2 text-right font-mono text-[#5B5048]">{dept.faculty_count}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-[#A9502B]">{dept.total_teaching_hours}h</td>
                        <td className="py-2.5 px-2 text-right font-mono text-[#1E1915]">{dept.avg_hours_per_faculty.toFixed(1)}h</td>
                        <td className="py-2.5 px-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            dept.avg_hours_per_faculty <= 4
                              ? 'text-emerald-800 bg-emerald-950/10 border-emerald-300'
                              : dept.avg_hours_per_faculty <= 6
                              ? 'text-amber-800 bg-amber-950/10 border-amber-300'
                              : 'text-rose-800 bg-rose-950/10 border-rose-300'
                          }`}>
                            {dept.avg_hours_per_faculty <= 4 ? 'Balanced' : dept.avg_hours_per_faculty <= 6 ? 'Moderate' : 'High Load'}
                          </span>
                        </td>
                      </tr>
                    )) ?? (
                      <tr><td colSpan={5} className="py-4 text-center text-[#5B5048] text-xs">Loading workload data...</td></tr>
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
                  <div key={c.group_id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F3ECE2] border border-[#1E1915]/10">
                    <div>
                      <span className="font-bold text-[#1E1915]">{c.group_id}</span>
                      <span className="text-[10px] text-[#5B5048] ml-1.5">({c.size} students)</span>
                    </div>
                    <span className="font-mono text-[#243C50] font-bold">{c.weekly_teaching_hours} hrs/wk</span>
                  </div>
                )) ?? <p className="text-xs text-[#5B5048] text-center py-4">Loading...</p>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 5. STUDENT VIEW */}
      {user?.role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>My Academic Schedule Overview</CardTitle>
                  <CardDescription>
                    {user?.department ? `${user.department} Department Cohort Classes` : 'Enrolled B.Tech Curriculum'}
                  </CardDescription>
                </div>
                <button
                  onClick={() => onNavigate('timetable')}
                  className="text-xs font-semibold text-[#A9502B] hover:text-[#8F3F1E] flex items-center gap-1"
                >
                  View Full Timetable <ArrowRight className="h-3 w-3" />
                </button>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E1915]/10 text-[#5B5048] font-mono uppercase text-[10px]">
                      <th className="pb-2 px-2">Course</th>
                      <th className="pb-2 px-2">Type</th>
                      <th className="pb-2 px-2">Faculty</th>
                      <th className="pb-2 px-2">Venue</th>
                      <th className="pb-2 px-2 text-right">Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1915]/10 font-sans">
                    {isTimetableLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#5B5048]">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-[#A9502B]" />
                            <span>Loading curriculum schedule...</span>
                          </div>
                        </td>
                      </tr>
                    ) : timetableError ? (
                      <tr>
                        <td colSpan={5} className="py-4 px-2 text-center text-xs text-amber-800 bg-amber-50/50">
                          <div className="flex items-center justify-center gap-3">
                            <span>{timetableError}</span>
                            <button
                              onClick={fetchTimetable}
                              className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-medium text-xs transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : sessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#5B5048]">
                          No cohort classes scheduled yet.
                        </td>
                      </tr>
                    ) : (
                      sessions
                        .filter((s) => s.course_id?.startsWith(user?.department || 'CS') || s.groups?.some(g => g.startsWith(user?.department || 'CSE')))
                        .slice(0, 7)
                        .map((s) => (
                          <tr key={s.session_id} className="hover:bg-[#F3ECE2]/60 transition-colors">
                            <td className="py-2.5 px-2 font-medium text-[#1E1915]">
                              <div className="font-bold">{s.course_name}</div>
                              <div className="text-[10px] text-[#5B5048] font-mono">{s.course_id}</div>
                            </td>
                            <td className="py-2.5 px-2">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                s.kind === 'lab'
                                  ? 'bg-indigo-950/10 text-indigo-800 border-indigo-300'
                                  : 'bg-[#243C50]/10 text-[#243C50] border-[#243C50]/30'
                              }`}>
                                {s.kind.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-[#5B5048]">{s.faculty_name}</td>
                            <td className="py-2.5 px-2 font-mono font-bold text-[#A9502B]">{s.room_id}</td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-[#1E1915]">
                              {s.day} P{s.start_period}–P{s.end_period}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Quick Actions Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => onNavigate('timetable')}
                className="p-4 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 hover:border-[#A9502B]/40 hover:shadow-card-hover transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-[#A9502B]">
                  <CalendarDays className="h-4 w-4" />
                  <span className="font-serif font-bold text-xs text-[#1E1915]">Weekly Timetable</span>
                </div>
                <p className="text-[11px] text-[#5B5048]">Browse all P1–P9 teaching sessions across lecture halls & labs.</p>
              </div>

              <div
                onClick={() => onNavigate('exams')}
                className="p-4 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 hover:border-[#A9502B]/40 hover:shadow-card-hover transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-emerald-700">
                  <FileCheck2 className="h-4 w-4" />
                  <span className="font-serif font-bold text-xs text-[#1E1915]">Midsem Schedule</span>
                </div>
                <p className="text-[11px] text-[#5B5048]">Check exam slots and assigned rooms with halved seating.</p>
              </div>

              <div
                onClick={() => onNavigate('ai-chat')}
                className="p-4 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 hover:border-[#A9502B]/40 hover:shadow-card-hover transition-all cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2 text-[#243C50]">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-serif font-bold text-xs text-[#1E1915]">Campus AI</span>
                </div>
                <p className="text-[11px] text-[#5B5048]">Ask questions about room availability, timings, or coursework.</p>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Student Profile & Institutional Badges */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>Verified Institutional Registration</CardDescription>
              </CardHeader>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B5048]">Full Name</span>
                    <span className="font-bold text-[#1E1915]">{user?.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B5048]">Institutional Email</span>
                    <span className="font-mono text-[#1E1915] text-[11px] truncate max-w-[140px]">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B5048]">Department</span>
                    <span className="font-bold text-[#A9502B]">{user?.department || 'CSE'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5B5048]">Registration No.</span>
                    <span className="font-mono font-bold text-[#243C50]">{user?.registration_no || 'CIT-2026-STU'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#1E1915]/10">
                    <span className="text-[#5B5048]">Account Status</span>
                    <span className="text-emerald-800 font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="h-3 w-3" /> Active & Verified
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#243C50]/5 border border-[#243C50]/15 space-y-1 text-[#243C50]">
                  <p className="font-bold flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5" /> Campus Fest Week 7
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Spectra '27 Fest events will run during evening slots (P10–P13, 18:00–22:00) with no interference to your academic timetable.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Admin Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191513]/60 backdrop-blur-xs p-4">
          <div className="bg-[#FBF8F3] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#1E1915]/15 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-700 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#1E1915]">Reset Platform to Baseline</h3>
                <p className="text-xs text-[#5B5048]">Authorized Academic Administrator Action</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#5B5048] mb-6 bg-[#F3ECE2] p-3.5 rounded-xl border border-[#1E1915]/10">
              <p className="font-semibold text-[#1E1915]">This action will atomically:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-[#5B5048]">
                <li>Restore the baseline timetable & exams from original validated snapshot.</li>
                <li>Reset the active schedule served by the platform to validated baseline (0 hard violations, soft penalty 232).</li>
                <li>Re-seed all 25 official booking requests from the dataset (BR-01 through BR-20, with BR-04 cancelled).</li>
                <li>Clear all generated disruption simulations, ad-hoc decisions, and notifications.</li>
                <li>Preserve all registered user accounts and protected system files.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5B5048] hover:bg-[#F3ECE2] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminReset}
                disabled={isResetting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-[#F3ECE2] shadow-sm transition-all disabled:opacity-50"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Resetting Demo State...' : 'Confirm & Reset'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
