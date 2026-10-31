import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'electric' | 'none';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = 'none',
  onClick,
}) => {
  const glowClasses = {
    cyan: 'hover:border-cyan-300 hover:shadow-card-hover',
    electric: 'hover:border-blue-300 hover:shadow-card-hover',
    none: 'hover:border-slate-300',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all duration-200 ${glowClasses[glow]} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`border-b border-slate-100 pb-3 mb-4 ${className}`}>{children}</div>;

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <h3 className={`text-base font-semibold text-slate-900 ${className}`}>{children}</h3>;

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <p className={`text-xs text-slate-500 mt-0.5 ${className}`}>{children}</p>;
