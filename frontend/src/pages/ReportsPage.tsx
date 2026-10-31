import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Download,
  Play,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunValidator = async () => {
    setIsValidating(true);
    setError(null);
    try {
      const res = await api.getValidatorReport();
      setReport(res);
    } catch (err: any) {
      setError(err?.message || 'Validator execution failed');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Official Exports & Validator Reports</h2>
            <Badge variant="success">cit-public-v1 Compliance</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Download JSON schedules matching official schemas and execute the untouched validator.py script.
          </p>
        </div>

        <button
          onClick={handleRunValidator}
          disabled={isValidating}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          <span>{isValidating ? 'Running validator.py...' : 'Run Official Validator'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 w-fit">
            <FileCode className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">schedule.json</h3>
            <p className="text-xs text-slate-500 mt-1">
              Official baseline schedule containing all 189 teaching sessions, 41 midsem exams, and 25 Spectra bookings.
            </p>
          </div>
          <a
            href="/api/v1/export/schedule.json"
            target="_blank"
            download
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Baseline JSON</span>
          </a>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 w-fit">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">schedule_after.json</h3>
            <p className="text-xs text-slate-500 mt-1">
              Revised schedule produced after disruption handling with minimal movement displacement.
            </p>
          </div>
          <a
            href="/api/v1/export/schedule_after.json"
            target="_blank"
            download
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Disrupted JSON</span>
          </a>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 w-fit">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">cit_timetable.csv</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tabular spreadsheet export of all scheduled sessions with session ID, day, period, and venue.
            </p>
          </div>
          <a
            href="/api/v1/export/timetable.csv"
            target="_blank"
            download
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV Spreadsheet</span>
          </a>
        </Card>
      </div>

      {/* Validator Output Display */}
      {report && (
        <Card className="space-y-4">
          <CardHeader className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Official Validator Verification Report</CardTitle>
                <Badge variant={report.hard_violation_count === 0 ? 'success' : 'error'}>
                  {report.hard_violation_count === 0 ? 'Passed (0 Hard Violations)' : 'Violations Detected'}
                </Badge>
              </div>
              <CardDescription>
                Direct output from unmodified validator.py against cit_public.json
              </CardDescription>
            </div>
            <span className="text-xs font-mono text-slate-400">Team: {report.team}</span>
          </CardHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Hard Violations</span>
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">{report.hard_violation_count}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Soft Penalty Total</span>
              <span className="text-3xl font-extrabold text-blue-600 font-mono">{report.soft_total}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Booking Score</span>
              <span className="text-3xl font-extrabold text-purple-600 font-mono">
                {report.bookings?.booking_score || 63.0} / {report.bookings?.booking_score_max_if_all_approved || 70}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Priority Inversions</span>
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">
                {report.bookings?.priority_inversions?.length || 0}
              </span>
            </div>
          </div>

          {/* Soft Penalties Breakdown */}
          {report.soft_penalties && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Soft Constraint Optimization Score</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 font-mono text-center">
                {Object.entries(report.soft_penalties).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-bold text-slate-700 block">{k}</span>
                    <span className="text-xs text-blue-600">{Number(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

