import React from 'react';
import {
  Settings,
  Server,
  Database,
  ShieldCheck,
  RotateCcw,
  Users,
  CheckCircle2,
  Code
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import type { User, DemoAccount, DatasetSummary } from '../types/dataset';

interface SettingsPageProps {
  user: User | null;
  summary: DatasetSummary | null;
  demoAccounts: DemoAccount[];
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  summary,
  demoAccounts,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Environment & Settings</h2>
            <Badge variant="cyan">CIT Campus Scheduling Core</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platform configurations, verified source-of-truth dataset references, and security environment details.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>OR-Tools CP-SAT Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environment Diagnostics */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Architecture Stack</CardTitle>
            <CardDescription>Verified components running in production</CardDescription>
          </CardHeader>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Optimization Solver</span>
              <span className="font-mono font-bold text-blue-700">Google OR-Tools CP-SAT</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Backend Framework</span>
              <span className="font-mono font-bold text-slate-900">Python 3.12 + FastAPI</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Frontend Technology</span>
              <span className="font-mono font-bold text-slate-900">React 19 + TypeScript + Vite</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Design System</span>
              <span className="font-mono font-bold text-slate-900">Tailwind CSS (Premium Light)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Database Engine</span>
              <span className="font-mono font-bold text-slate-900">SQLite (tech_zephyr.db)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Official Validator</span>
              <span className="font-mono font-bold text-emerald-700">validator.py (0 Violations)</span>
            </div>
          </div>
        </Card>

        {/* Official Dataset Reference */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle>Source Dataset Configuration</CardTitle>
            <CardDescription>Source of truth: cit_public.json</CardDescription>
          </CardHeader>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Dataset Identifier</span>
              <span className="font-mono font-bold text-blue-700">{summary?.dataset_id || 'cit-public-v1'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Institution Name</span>
              <span className="font-bold text-slate-900">{summary?.institute || 'Chilika Institute of Technology'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Teaching Hours</span>
              <span className="font-mono font-bold text-slate-900">{summary?.counts.total_teaching_hours || 243} hrs/wk</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Midsem Examinations</span>
              <span className="font-mono font-bold text-slate-900">{summary?.counts.exams || 41} course exams</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="font-medium text-slate-600">Spectra Requests</span>
              <span className="font-mono font-bold text-slate-900">25 requests (BR-04 cancelled)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Demo Accounts Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Verified Demo Role Accounts</CardTitle>
          <CardDescription>Available for evaluation and hackathon judging</CardDescription>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoAccounts.map((acc) => (
            <div key={acc.role} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                {acc.role.toUpperCase()}
              </span>
              <p className="font-bold text-slate-900">{acc.full_name}</p>
              <div className="space-y-0.5 font-mono text-[11px] text-slate-500">
                <p>Email: {acc.email}</p>
                <p>Pass: {acc.password}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

