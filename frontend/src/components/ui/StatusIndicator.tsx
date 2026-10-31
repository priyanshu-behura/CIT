import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'loading';
  label: string;
  sublabel?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, sublabel }) => {
  const dotColor = {
    online: 'bg-emerald-400',
    offline: 'bg-rose-500',
    loading: 'bg-amber-400 animate-pulse',
  };

  const pingColor = {
    online: 'bg-emerald-400',
    offline: 'bg-rose-500',
    loading: 'bg-amber-400',
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-800">
      <span className="relative flex h-2.5 w-2.5">
        {status === 'online' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor[status]} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor[status]}`} />
      </span>
      <div className="text-left">
        <div className="text-xs font-medium text-slate-200 leading-tight">{label}</div>
        {sublabel && <div className="text-[10px] text-slate-400 leading-tight">{sublabel}</div>}
      </div>
    </div>
  );
};

