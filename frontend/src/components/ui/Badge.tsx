import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'electric' | 'success' | 'warning' | 'error' | 'neutral' | 'purple' | 'terracotta' | 'academic';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantClasses = {
    terracotta: 'bg-[#A9502B]/10 text-[#A9502B] border border-[#A9502B]/25',
    academic: 'bg-[#243C50]/10 text-[#243C50] border border-[#243C50]/25',
    cyan: 'bg-[#243C50]/10 text-[#243C50] border border-[#243C50]/25',
    electric: 'bg-[#A9502B]/10 text-[#A9502B] border border-[#A9502B]/25',
    success: 'bg-emerald-950/10 text-emerald-800 border border-emerald-300',
    warning: 'bg-amber-950/10 text-amber-800 border border-amber-300',
    error: 'bg-rose-950/10 text-rose-800 border border-rose-300',
    neutral: 'bg-[#F3ECE2] text-[#5B5048] border border-[#1E1915]/10',
    purple: 'bg-[#243C50]/10 text-[#243C50] border border-[#243C50]/25',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
