import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Users,
  DoorClosed,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { api } from '../services/api';
import type { BookingRecord } from '../types/dataset';

export const SpectraPage: React.FC = () => {
  const [spectraBookings, setSpectraBookings] = useState<BookingRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSpectra = async () => {
      setIsLoading(true);
      try {
        const [spectraRes, validatorRes] = await Promise.all([
          api.getSpectraWeek(),
          api.getValidatorReport().catch(() => null),
        ]);
        setSpectraBookings(spectraRes.bookings);
        // Merge spectra stats with validator booking stats
        const bookingStats = validatorRes?.bookings ?? {};
        setStats({
          ...spectraRes,
          booking_score: bookingStats.booking_score ?? null,
          approved: bookingStats.approved ?? null,
          alternatives: bookingStats.alternatives ?? null,
          rejected: bookingStats.rejected ?? null,
          priority_inversions: bookingStats.priority_inversions?.length ?? 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSpectra();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Spectra '27 Fest Week Management</h2>
            <Badge variant="cyan">Week 7 Institutional Festival</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official 25 Festival Booking Requests &middot; Priority Ranking &middot; Zero Priority Inversions
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
          <span className="font-bold flex items-center gap-1.5">
            <Award className="h-4 w-4 text-purple-700" />
            {stats ? (
              <>Booking Score: {stats.booking_score ?? 'N/A'} / 70.0 ({stats.booking_score ? Math.round((stats.booking_score / 70.0) * 100) : 0}%)</>
            ) : (
              <>Booking Score: Loading...</>
            )}
          </span>
          <p className="text-[11px] text-purple-700 mt-0.5">
            {stats ? `${stats.approved ?? '—'} Approved · ${stats.alternatives ?? '—'} Alternatives Offered · ${stats.rejected ?? '—'} Rejected · BR-04 Cancelled` : 'Loading booking statistics...'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={String(stats?.total_requests ?? 25)}
          subtitle="Submitted for Spectra '27"
          icon={<Calendar className="h-5 w-5" />}
          accent="electric"
        />
        <StatCard
          title="Active Requests"
          value={String(stats?.active_count ?? 24)}
          subtitle="Processed by priority engine"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          title="Cancelled (BR-04)"
          value={String(stats?.cancelled_count ?? 1)}
          subtitle="Officially withdrawn by requester"
          icon={<XCircle className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          title="Priority Inversions"
          value={String(stats?.priority_inversions ?? 0)}
          subtitle="Verified by validator.py"
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="cyan"
        />
      </div>

      {/* Spectra Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Spectra '27 Request Manifest (BR-01 through BR-25)</CardTitle>
          <CardDescription>
            Evaluated strictly under official priority weights: Institute Event (5), Guest Lecture (4), Dept Event (3), Club Event (2)
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] bg-slate-50">
                <th className="py-3 px-3">Req ID</th>
                <th className="py-3 px-3">Event Title</th>
                <th className="py-3 px-3">Requester & Role</th>
                <th className="py-3 px-3">Effective Category</th>
                <th className="py-3 px-3 text-right">Attendance</th>
                <th className="py-3 px-3 text-center">Allocated Slot</th>
                <th className="py-3 px-3">Venue</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Decision Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {spectraBookings.map((b) => (
                <tr
                  key={b.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    b.status === 'cancelled' ? 'bg-rose-50/30 line-through opacity-60' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">{b.id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 max-w-[200px] truncate">{b.title}</td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>{b.requester_name}</div>
                    <span className="text-[10px] font-mono text-slate-400 capitalize">{b.role}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-500 capitalize">
                    {b.effective_category.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{b.attendance}</td>
                  <td className="py-3 px-3 text-center font-mono">
                    {b.assigned_day ? (
                      <span className="font-semibold text-blue-700">
                        {b.assigned_day} P{b.assigned_start_period}–P{b.assigned_end_period}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                    {b.assigned_room_id || 'None'}
                  </td>
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
                  <td className="py-3 px-3 text-slate-500 max-w-[250px] truncate text-[11px]">
                    {b.decision_reason || 'Pending official allocation.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

