import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'cyan' | 'electric' | 'emerald' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'cyan',
}) => {
  const iconBorderColors = {
    cyan: 'border-cyan-200 text-cyan-600 bg-cyan-50',
    electric: 'border-blue-200 text-blue-600 bg-blue-50',
    emerald: 'border-emerald-200 text-emerald-600 bg-emerald-50',
    amber: 'border-amber-200 text-amber-600 bg-amber-50',
  };

  return (
    <Card glow={accent === 'emerald' || accent === 'amber' ? 'none' : accent} className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">{value}</span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${iconBorderColors[accent]} shrink-0`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
