import React, { useRef, useEffect } from 'react';
import { createTopDockController } from './topDockController';
import type { TopDockControllerOptions } from './topDockController';

export interface NavDockItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface AnimatedTopDockNavProps {
  items: NavDockItem[];
  activeId?: string;
  onItemClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => void;
  scrolled?: boolean;
  className?: string;
}

const DOCK_ANIMATION_OPTIONS: TopDockControllerOptions = {
  variant: 'sable',
  proximity: 122,
  spring: 0.19,
  damping: 0.7,
  widthGrowth: 0,
  heightGrowth: 0,
  drop: 1.2,
  axis: 'x',
  distribute: false,
  lockTrack: false,
};

export const AnimatedTopDockNav: React.FC<AnimatedTopDockNavProps> = ({
  items,
  activeId,
  onItemClick,
  scrolled = false,
  className = '',
}) => {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    // Initialize controller with Sable variant and spring physics
    const cleanup = createTopDockController(el, () => DOCK_ANIMATION_OPTIONS);
    return cleanup;
  }, []);

  return (
    <nav
      ref={navRef}
      className={`cit-top-dock relative hidden lg:flex items-center gap-1 p-1 rounded-full border transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? 'bg-[#FBF8F3]/95 border-[#1E1915]/14 shadow-[0_4px_20px_-2px_rgba(30,25,21,0.08),0_1px_3px_rgba(30,25,21,0.04)]'
          : 'bg-[#FBF8F3]/90 backdrop-blur-md border-[#1E1915]/14 shadow-[0_8px_28px_-4px_rgba(30,25,21,0.12),0_2px_6px_rgba(30,25,21,0.06)]'
      } ${className}`}
      aria-label="CIT Primary Navigation Dock"
      data-dock-state="idle"
      data-dock-max="0.00"
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <a
            key={item.id}
            href={item.href}
            data-dock-item="true"
            data-active={isActive ? 'true' : 'false'}
            aria-current={isActive ? 'page' : undefined}
            onClick={(e) => onItemClick(e, item.href, item.id)}
            className={`group relative inline-flex flex-none items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wide whitespace-nowrap outline-none transition-colors duration-200 select-none ${
              isActive
                ? 'bg-[#A9502B] text-[#F3ECE2] shadow-xs shadow-[#A9502B]/30'
                : 'text-[#5B5048] hover:text-[#1E1915] hover:bg-[#F3ECE2]/90 data-[dock-near=true]:text-[#1E1915] data-[dock-near=true]:bg-[#F3ECE2]/80 focus-visible:ring-2 focus-visible:ring-[#A9502B]/40 focus-visible:text-[#1E1915]'
            }`}
          >
            {item.icon && (
              <span
                className={`pointer-events-none transition-colors duration-200 shrink-0 ${
                  isActive
                    ? 'text-[#F3ECE2]'
                    : 'text-[#5B5048] group-hover:text-[#A9502B] group-data-[dock-near=true]:text-[#A9502B]'
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
            )}
            <span className="pointer-events-none">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
};
