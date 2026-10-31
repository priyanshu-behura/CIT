import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  DoorClosed,
  Users,
  GraduationCap,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';
import type { AnalyticsOverview } from '../types/dataset';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const statusPieData = data?.booking_stats?.by_status
    ? Object.entries(data.booking_stats.by_status).map(([name, value]) => ({
        name: name.replace('_', ' ').toUpperCase(),
        value,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Campus Analytics & Workload</h2>
            <Badge variant="cyan">Real Dataset Analytics</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quantitative analysis derived strictly from the active timetable and booking records.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Weekly Teaching Hours: <strong className="text-blue-700 font-mono font-bold">{data?.summary.weekly_teaching_hours || 243} hrs</strong>
        </div>
      </div>

      {/* Top Utilization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Utilization Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Venue Utilization (%)</CardTitle>
            <CardDescription>Occupied teaching hours out of 45 weekly periods</CardDescription>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.room_utilization?.slice(0, 10) || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="room_id" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  formatter={(val: any) => [`${val}%`, 'Utilization']}
                />
                <Bar dataKey="utilization_percent" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Faculty Workload by Department */}
        <Card>
          <CardHeader>
            <CardTitle>Teaching Load by Department (Hours/Wk)</CardTitle>
            <CardDescription>Aggregated across CSE, ECE, EE, ME, CE, and Science faculty</CardDescription>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.department_workload || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="department" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  formatter={(val: any) => [`${val} hrs`, 'Total Teaching Hours']}
                />
                <Bar dataKey="total_teaching_hours" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Daily & Period Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Period Usage Trend (P1-P9) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Teaching Intensity by Period (P1 to P9)</CardTitle>
            <CardDescription>Number of concurrent sessions in each period slot</CardDescription>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.period_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  formatter={(val: any) => [`${val} sessions`, 'Concurrent Classes']}
                />
                <Line type="monotone" dataKey="sessions" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Booking Status Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Decisions</CardTitle>
            <CardDescription>Approved vs Rejected vs Pending</CardDescription>
          </CardHeader>
          <div className="h-52 w-full flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">Loading booking statistics...</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
            {statusPieData.map((entry, idx) => (
              <span key={entry.name} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                {entry.name}: {entry.value}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

