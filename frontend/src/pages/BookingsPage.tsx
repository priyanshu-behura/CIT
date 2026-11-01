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
import { StarBorder } from '../components/ui/StarBorder';
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

  useEffect(() => {
    const handleBookingCreated = () => {
      loadBookings();
    };
    window.addEventListener('booking-created', handleBookingCreated);
    return () => {
      window.removeEventListener('booking-created', handleBookingCreated);
    };
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
      <div className="bg-[#FBF8F3] rounded-2xl border border-[#1E1915]/10 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-[#1E1915] tracking-tight">Venue Booking Management</h2>
            <Badge variant="cyan">{bookings.length} Total Requests</Badge>
          </div>
          <p className="text-xs text-[#5B5048] mt-1 font-sans">
            Official Priority Hierarchy: Exam &gt; Regular Class &gt; Institute &gt; Guest &gt; Dept &gt; Club
          </p>
        </div>

        <StarBorder
          as="button"
          onClick={() => setIsCreateOpen(true)}
          radius={12}
          color="#C8693F"
          trailColor="#A9502B"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Booking Request</span>
        </StarBorder>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'pending', 'approved', 'rejected', 'alternative_offered', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold capitalize transition-all shrink-0 ${
              statusFilter === st
                ? 'bg-[#A9502B] text-[#F3ECE2] shadow-2xs font-bold'
                : 'bg-[#FBF8F3] border border-[#1E1915]/10 text-[#5B5048] hover:bg-[#F3ECE2]'
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
              <tr className="border-b border-[#1E1915]/10 text-[#5B5048] font-mono uppercase text-[10px] bg-[#F3ECE2]">
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
            <tbody className="divide-y divide-[#1E1915]/10 font-sans">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-[#F3ECE2]/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#A9502B]">{b.id}</td>
                  <td className="py-3 px-3 font-medium text-[#1E1915]">{b.requester_name}</td>
                  <td className="py-3 px-3">
                    <Badge variant="neutral" size="sm">{b.role}</Badge>
                  </td>
                  <td className="py-3 px-3 font-medium text-[#1E1915] max-w-[220px] truncate">{b.title}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-[#5B5048] capitalize">
                    {b.effective_category.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-[#1E1915]">{b.attendance}</td>
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
                      className="px-2.5 py-1 rounded-lg bg-[#A9502B]/10 text-[#A9502B] hover:bg-[#A9502B]/20 font-semibold text-[11px] transition-colors"
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
        <div className="fixed inset-0 z-50 bg-[#191513]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF8F3] rounded-2xl shadow-elevated border border-[#1E1915]/15 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#1E1915]/10 pb-3">
              <div>
                <span className="font-mono text-xs text-[#A9502B] font-bold">{selectedBooking.id}</span>
                <h3 className="text-base font-serif font-bold text-[#1E1915]">{selectedBooking.title}</h3>
                <p className="text-xs text-[#5B5048]">Submitted by {selectedBooking.requester_name} ({selectedBooking.role})</p>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-1 rounded-lg text-[#5B5048] hover:bg-[#F3ECE2] font-bold">✕</button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#5B5048]">Effective Priority:</span>
                  <span className="font-bold text-[#1E1915] capitalize">{selectedBooking.effective_category.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B5048]">Requested Attendance:</span>
                  <span className="font-mono font-bold text-[#1E1915]">{selectedBooking.attendance} seats</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B5048]">Requested Window:</span>
                  <span className="font-mono text-[#243C50] font-bold">
                    {selectedBooking.windows[0]?.day} P{selectedBooking.windows[0]?.from_period}–P{selectedBooking.windows[0]?.to_period}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B5048]">Current Status:</span>
                  <Badge variant="cyan" size="sm">{selectedBooking.status}</Badge>
                </div>
                {selectedBooking.decision_reason && (
                  <div className="pt-1 mt-1 border-t border-[#1E1915]/10 text-[#5B5048]">
                    <span className="font-semibold text-[#1E1915]">Decision Note:</span> {selectedBooking.decision_reason}
                  </div>
                )}
              </div>

              {isAuthorizedApprover ? (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-[#5B5048]">
                    Administrative Decision Reason
                  </label>
                  <input
                    type="text"
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Enter reason for approval, rejection, or alternative venue offer..."
                    className="w-full px-3 py-2 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-xs text-[#1E1915] outline-none focus:border-[#A9502B]"
                  />

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <StarBorder
                      as="button"
                      onClick={() => handleDecision('approved')}
                      radius={12}
                      color="#34D399"
                      trailColor="#065F46"
                      className="py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-[#F3ECE2] font-semibold text-xs shadow-2xs"
                    >
                      Approve
                    </StarBorder>
                    <button
                      onClick={() => handleDecision('alternative_offered')}
                      className="py-2.5 rounded-xl bg-[#C8693F] hover:bg-[#A9502B] text-[#F3ECE2] font-semibold text-xs shadow-2xs"
                    >
                      Offer Alt
                    </button>
                    <button
                      onClick={() => handleDecision('rejected')}
                      className="py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-[#F3ECE2] font-semibold text-xs shadow-2xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-950/10 border border-amber-300 text-amber-900 text-[11px]">
                  <strong>View Only:</strong> Only Dean/Admin and Department Coordinators hold approval authority.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Request Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-[#191513]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FBF8F3] rounded-2xl shadow-elevated border border-[#1E1915]/15 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#1E1915]/10 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1E1915]">New Venue Booking Request</h3>
                <p className="text-xs text-[#5B5048]">Deterministic conflict check performed on submission</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg text-[#5B5048] hover:bg-[#F3ECE2] font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#5B5048] mb-1 font-mono uppercase text-[10px]">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Robotics Technical Workshop"
                  className="w-full px-3 py-2 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-[#1E1915] outline-none focus:border-[#A9502B]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5B5048] mb-1 font-mono uppercase text-[10px]">Requested Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#1E1915]/15 outline-none focus:border-[#A9502B] bg-[#FBF8F3] text-[#1E1915]"
                >
                  <option value="club_event">Club Event</option>
                  <option value="department_event">Department Event</option>
                  <option value="guest_lecture">Guest Lecture</option>
                  <option value="institute_event">Institute Event</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5B5048] mb-1 font-mono uppercase text-[10px]">Expected Attendance</label>
                  <input
                    type="number"
                    min={1}
                    max={800}
                    value={attendance}
                    onChange={(e) => setAttendance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-[#1E1915] outline-none focus:border-[#A9502B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5B5048] mb-1 font-mono uppercase text-[10px]">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-[#1E1915] outline-none focus:border-[#A9502B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#5B5048] mb-1 font-mono uppercase text-[10px]">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-[#1E1915] font-mono"
                  >
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#5B5048] mb-1 font-mono uppercase text-[10px]">Start Period</label>
                  <select
                    value={startPeriod}
                    onChange={(e) => setStartPeriod(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-[#1E1915] font-mono"
                  >
                    {[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                      <option key={p} value={p}>P{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#5B5048] mb-1 font-mono uppercase text-[10px]">End Period</label>
                  <select
                    value={endPeriod}
                    onChange={(e) => setEndPeriod(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-[#1E1915] font-mono"
                  >
                    {[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13].map((p) => (
                      <option key={p} value={p}>P{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5B5048] mb-1 font-mono uppercase text-[10px]">Room Type</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#1E1915]/15 bg-[#FBF8F3] text-[#1E1915]"
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
                <label className="flex items-center gap-2 cursor-pointer text-[#5B5048]">
                  <input
                    type="checkbox"
                    checked={needsProjector}
                    onChange={(e) => setNeedsProjector(e.target.checked)}
                    className="rounded accent-[#A9502B]"
                  />
                  <span>Needs Projector</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#5B5048]">
                  <input
                    type="checkbox"
                    checked={needsAC}
                    onChange={(e) => setNeedsAC(e.target.checked)}
                    className="rounded accent-[#A9502B]"
                  />
                  <span>Needs AC</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#1E1915]/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F3ECE2] text-[#5B5048] hover:text-[#1E1915] font-semibold"
                >
                  Cancel
                </button>
                <StarBorder
                  as="button"
                  type="submit"
                  radius={12}
                  color="#C8693F"
                  trailColor="#A9502B"
                  className="px-4 py-2 rounded-xl bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] font-semibold"
                >
                  Submit Booking Request
                </StarBorder>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

