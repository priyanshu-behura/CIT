import React from 'react';

interface CitLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CitLogo: React.FC<CitLogoProps> = ({
  size = 'md',
  variant = 'auto',
  showText = false,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-18 w-18',
  };

  const imgSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Official CIT Institutional Seal Medallion */}
      <img
        src="/img/cit/cit-logo.png"
        alt="Chilika Institute of Technology"
        className={`${imgSize} rounded-full object-cover shrink-0 shadow-xs transition-transform duration-300 hover:scale-105`}
        loading="eager"
      />

      {/* Optional Institutional Typography Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-serif font-bold tracking-wider ${
              size === 'lg' || size === 'xl' ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
            } ${
              variant === 'light'
                ? 'text-[#F3ECE2]'
                : variant === 'dark'
                ? 'text-[#1E1915]'
                : 'text-current'
            }`}
          >
            CIT
          </span>
          <span
            className={`uppercase tracking-[0.18em] font-medium mt-0.5 ${
              size === 'lg' || size === 'xl' ? 'text-[10px] sm:text-[11px]' : 'text-[8.5px] sm:text-[9px]'
            } ${
              variant === 'light'
                ? 'text-[#F3ECE2]/80'
                : variant === 'dark'
                ? 'text-[#5B5048]'
                : 'text-current opacity-80'
            }`}
          >
            Chilika Institute of Technology
          </span>
        </div>
      )}
    </div>
  );
};

