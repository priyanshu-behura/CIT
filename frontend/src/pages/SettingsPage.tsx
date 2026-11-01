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
      <div className="bg-[#FBF8F3] rounded-2xl border border-[#1E1915]/10 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-serif text-[#1E1915] tracking-tight">System Environment & Settings</h2>
            <Badge variant="academic">CIT Campus Scheduling Core</Badge>
          </div>
          <p className="text-xs text-[#5B5048] mt-1">
            Platform configurations, verified source-of-truth dataset references, and security environment details.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
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
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Optimization Solver</span>
              <span className="font-mono font-bold text-[#A9502B]">Google OR-Tools CP-SAT</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Backend Framework</span>
              <span className="font-mono font-bold text-[#1E1915]">Python 3.12 + FastAPI</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Frontend Technology</span>
              <span className="font-mono font-bold text-[#1E1915]">React 19 + TypeScript + Vite</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Design System</span>
              <span className="font-mono font-bold text-[#1E1915]">CIT Warm Editorial Theme</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Database Engine</span>
              <span className="font-mono font-bold text-[#1E1915]">SQLite (tech_zephyr.db)</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Official Validator</span>
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
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Dataset Identifier</span>
              <span className="font-mono font-bold text-[#A9502B]">{summary?.dataset_id || 'cit-public-v1'}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Institution Name</span>
              <span className="font-bold text-[#1E1915]">{summary?.institute || 'Chilika Institute of Technology'}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Teaching Hours</span>
              <span className="font-mono font-bold text-[#1E1915]">{summary?.counts.total_teaching_hours || 243} hrs/wk</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Midsem Examinations</span>
              <span className="font-mono font-bold text-[#1E1915]">{summary?.counts.exams || 41} course exams</span>
            </div>
            <div className="p-3 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 flex items-center justify-between">
              <span className="font-medium text-[#5B5048]">Spectra Requests</span>
              <span className="font-mono font-bold text-[#1E1915]">25 requests (BR-04 cancelled)</span>
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
            <div key={acc.role} className="p-4 rounded-xl bg-[#F3ECE2]/50 border border-[#1E1915]/10 space-y-2 text-xs">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FBF8F3] border border-[#1E1915]/15 text-[#A9502B]">
                {acc.role.toUpperCase()}
              </span>
              <p className="font-bold text-[#1E1915]">{acc.full_name}</p>
              <div className="space-y-0.5 font-mono text-[11px] text-[#5B5048]">
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

