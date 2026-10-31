import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  Filter,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { BookingRecord, User } from '../types/dataset';

interface BookingsPageProps {
  user: User | null;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({ user }) => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // New Booking Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('club_event');
  const [attendance, setAttendance] = useState(50);
  const [duration, setDuration] = useState(2);
  const [day, setDay] = useState('FRI');
  const [startPeriod, setStartPeriod] = useState(6);
  const [endPeriod, setEndPeriod] = useState(7);
  const [roomType, setRoomType] = useState('classroom');
  const [needsProjector, setNeedsProjector] = useState(true);
  const [needsAC, setNeedsAC] = useState(true);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAllBookings({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setBookings(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const needs = [];
      if (needsProjector) needs.push('projector');
      if (needsAC) needs.push('ac');

      await api.createBooking({
        title,
        description,
        requested_category: category,
        attendance,
        duration_periods: duration,
        day,
        start_period: startPeriod,
        end_period: endPeriod,
        room_types: [roomType],
        needs,
      });

      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      loadBookings();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit booking');
    }
  };

  const handleDecision = async (decision: 'approved' | 'rejected' | 'alternative_offered') => {
    if (!selectedBooking) return;
    setActionError(null);

    // Frontend pre-check for self-approval
    if (user?.email && selectedBooking.requester_email) {
      if (user.email.toLowerCase() === selectedBooking.requester_email.toLowerCase()) {
        setActionError('Self-Approval Prohibited: You cannot approve your own booking request. An independent administrator must review it.');
        return;
      }
    }

    try {
      await api.decideBooking(selectedBooking.id, decision, decisionReason || `${decision} by ${user?.full_name}`, {
        assigned_room_id: selectedBooking.preferred_room_id || 'CR-101',
        assigned_day: selectedBooking.windows[0]?.day || 'MON',
        assigned_start_period: selectedBooking.windows[0]?.from_period || 6,
        assigned_end_period: selectedBooking.windows[0]?.to_period || 7,
      });

      setSelectedBooking(null);
      setDecisionReason('');
      loadBookings();
    } catch (err: any) {
      setActionError(err?.message || 'Decision processing failed');
    }
  };

  const isAuthorizedApprover = user?.role === 'admin' || user?.role === 'coordinator';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Venue Booking Management</h2>
            <Badge variant="cyan">{bookings.length} Total Requests</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official Priority Hierarchy: Exam &gt; Regular Class &gt; Institute &gt; Guest &gt; Dept &gt; Club
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Booking Request</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'pending', 'approved', 'rejected', 'alternative_offered', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold capitalize transition-all shrink-0 ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-2xs font-bold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Campus Booking Requests</CardTitle>
          <CardDescription>Click any row to review or execute administrative decisions</CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] bg-slate-50">
                <th className="py-3 px-3">Req ID</th>
                <th className="py-3 px-3">Requester</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Title</th>
                <th className="py-3 px-3">Effective Priority</th>
                <th className="py-3 px-3 text-right">Attendance</th>
                <th className="py-3 px-3 text-center">Duration</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">{b.id}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{b.requester_name}</td>
                  <td className="py-3 px-3">
                    <Badge variant="neutral" size="sm">{b.role}</Badge>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800 max-w-[220px] truncate">{b.title}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 capitalize">
                    {b.effective_category.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{b.attendance}</td>
                  <td className="py-3 px-3 text-center font-mono">{b.duration_periods}h</td>
                  <td className="py-3 px-3 text-center">
                    <Badge
                      variant={
                        b.status === 'approved' ? 'success' :
                        b.status === 'rejected' || b.status === 'cancelled' ? 'error' :
                        b.status === 'alternative_offered' ? 'warning' : 'neutral'
                      }
                      size="sm"
                    >
                      {b.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Decision / Review Dialog */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold">{selectedBooking.id}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedBooking.title}</h3>
                <p className="text-xs text-slate-500">Submitted by {selectedBooking.requester_name} ({selectedBooking.role})</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 font-bold">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Effective Priority:</span>
                  <span className="font-bold text-slate-800 capitalize">{selectedBooking.effective_category.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested Attendance:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedBooking.attendance} seats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested Window:</span>
                  <span className="font-mono text-blue-700">
                    {selectedBooking.windows[0]?.day} P{selectedBooking.windows[0]?.from_period}–P{selectedBooking.windows[0]?.to_period}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <Badge variant="cyan" size="sm">{selectedBooking.status}</Badge>
                </div>
                {selectedBooking.decision_reason && (
                  <div className="pt-1 mt-1 border-t border-slate-200 text-slate-600">
                    <span className="font-semibold text-slate-700">Decision Note:</span> {selectedBooking.decision_reason}
                  </div>
                )}
              </div>

              {isAuthorizedApprover ? (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Administrative Decision Reason
                  </label>
                  <input
                    type="text"
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Enter reason for approval, rejection, or alternative venue offer..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-blue-500"
                  />

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={() => handleDecision('approved')}
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecision('alternative_offered')}
                      className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-2xs"
                    >
                      Offer Alt
                    </button>
                    <button
                      onClick={() => handleDecision('rejected')}
                      className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                  <strong>View Only:</strong> Only Dean/Admin and Department Coordinators hold approval authority.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-elevated border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Venue Booking Request</h3>
                <p className="text-xs text-slate-500">Deterministic conflict check performed on submission</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Robotics Technical Workshop"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Requested Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="club_event">Club Event</option>
                  <option value="department_event">Department Event</option>
                  <option value="guest_lecture">Guest Lecture</option>
                  <option value="institute_event">Institute Event</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expected Attendance</label>
                  <input
                    type="number"
                    min={1}
                    max={800}
                    value={attendance}
                    onChange={(e) => setAttendance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  >
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Period</label>
                  <select
                    value={startPeriod}
                    onChange={(e) => setStartPeriod(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  >
                    {[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                      <option key={p} value={p}>P{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Period</label>
                  <select
                    value={endPeriod}
                    onChange={(e) => setEndPeriod(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  >
                    {[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13].map((p) => (
                      <option key={p} value={p}>P{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Room Type</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="classroom">Classroom (CR)</option>
                  <option value="lecture_hall">Lecture Hall (LH)</option>
                  <option value="seminar_hall">Seminar Hall (SH)</option>
                  <option value="auditorium">Main Auditorium (AUD)</option>
                  <option value="lab_cs">Computing Lab (CS-LAB)</option>
                  <option value="outdoor">Open Air Theatre (OAT)</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsProjector}
                    onChange={(e) => setNeedsProjector(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Needs Projector</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsAC}
                    onChange={(e) => setNeedsAC(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Needs AC</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Submit Booking Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

