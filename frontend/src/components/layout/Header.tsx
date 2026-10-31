import React from 'react';
import type { HealthStatus } from '../../types/dataset';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Badge } from '../ui/Badge';
import { Cpu, RefreshCw } from 'lucide-react';

interface HeaderProps {
  health: HealthStatus | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, isLoading, onRefresh }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-navy-800 bg-navy-950/80 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-electric-600 via-electric-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-electric-600/30 border border-cyan-400/30">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                CIT Campus Scheduling
              </span>
              <Badge variant="electric" size="sm">Phase 1</Badge>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide">
              Timetable & Disruption Management Engine
            </p>
          </div>
        </div>

        {/* System & Connection Status */}
        <div className="flex items-center gap-3">
          {health?.ortools_available && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-800">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs text-slate-300 font-mono">
                OR-Tools v{health.ortools_version}
              </span>
            </div>
          )}

          {health ? (
            <StatusIndicator
              status="online"
              label="Backend Connected"
              sublabel={health.dataset_id ? `Dataset: ${health.dataset_id}` : undefined}
            />
          ) : (
            <StatusIndicator
              status="offline"
              label="Backend Offline"
              sublabel="Check port 8000"
            />
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-navy-900 hover:bg-navy-850 text-slate-300 hover:text-cyan-300 border border-navy-800 hover:border-cyan-500/30 transition-all disabled:opacity-50"
            title="Refresh Dataset & Health"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
