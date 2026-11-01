import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'electric' | 'terracotta' | 'academic' | 'none';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = 'none',
  onClick,
}) => {
  const glowClasses = {
    cyan: 'hover:border-[#243C50]/40 hover:shadow-card-hover',
    electric: 'hover:border-[#A9502B]/40 hover:shadow-card-hover',
    terracotta: 'hover:border-[#A9502B]/40 hover:shadow-card-hover',
    academic: 'hover:border-[#243C50]/40 hover:shadow-card-hover',
    none: 'hover:border-[#1E1915]/20',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#FBF8F3] border border-[#1E1915]/10 rounded-2xl p-5 shadow-sm transition-all duration-200 ${glowClasses[glow]} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`border-b border-[#1E1915]/10 pb-3 mb-4 ${className}`}>{children}</div>;

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <h3 className={`text-base font-serif font-bold text-[#1E1915] ${className}`}>{children}</h3>;

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <p className={`text-xs text-[#5B5048] mt-0.5 ${className}`}>{children}</p>;
