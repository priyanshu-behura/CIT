import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'cyan' | 'electric' | 'emerald' | 'amber' | 'terracotta' | 'academic';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'cyan',
}) => {
  const iconBorderColors: Record<string, string> = {
    cyan: 'border-[#243C50]/20 text-[#243C50] bg-[#243C50]/10',
    electric: 'border-[#A9502B]/20 text-[#A9502B] bg-[#A9502B]/10',
    terracotta: 'border-[#A9502B]/20 text-[#A9502B] bg-[#A9502B]/10',
    academic: 'border-[#243C50]/20 text-[#243C50] bg-[#243C50]/10',
    emerald: 'border-emerald-200 text-emerald-800 bg-emerald-50/70',
    amber: 'border-amber-200 text-amber-800 bg-amber-50/70',
  };

  const cardGlow = accent === 'emerald' || accent === 'amber' ? 'none' : accent;

  return (
    <Card glow={cardGlow as any} className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#5B5048] uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#1E1915] font-serif">{value}</span>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-[#5B5048]">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${iconBorderColors[accent]} shrink-0`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
