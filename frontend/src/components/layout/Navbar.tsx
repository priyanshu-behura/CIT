import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  ArrowRight,
  UserCheck,
  Home,
  Info,
  GraduationCap,
  Sparkles,
  Users,
  BookOpen,
  MapPin,
} from 'lucide-react';
import { AnimatedTopDockNav } from '../navigation/AnimatedTopDockNav';
import type { NavDockItem } from '../navigation/AnimatedTopDockNav';
import { StarBorder } from '../ui/StarBorder';

interface NavbarProps {
  onNavigateLogin: () => void;
  onNavigateApp: () => void;
  userRole?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateLogin,
  onNavigateApp,
  userRole,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    const sectionIds = ['hero', 'about', 'departments', 'campus-interiors', 'campus-life', 'admissions', 'location'];
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '-15% 0px -65% 0px',
      threshold: 0,
    });

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // CIT Navigation Items mapped to Animated Top Dock
  const dockItems: NavDockItem[] = [
    { id: 'hero', label: 'Home', href: '#hero', icon: <Home className="h-3.5 w-3.5 shrink-0" /> },
    { id: 'about', label: 'About', href: '#about', icon: <Info className="h-3.5 w-3.5 shrink-0" /> },
    { id: 'departments', label: 'Departments', href: '#departments', icon: <GraduationCap className="h-3.5 w-3.5 shrink-0" /> },
    { id: 'campus-interiors', label: 'Campus Interiors', href: '#campus-interiors', icon: <Sparkles className="h-3.5 w-3.5 shrink-0" /> },
    { id: 'campus-life', label: 'Campus Life', href: '#campus-life', icon: <Users className="h-3.5 w-3.5 shrink-0" /> },
    { id: 'admissions', label: 'Admissions', href: '#admissions', icon: <BookOpen className="h-3.5 w-3.5 shrink-0" /> },
    { id: 'location', label: 'Contact', href: '#location', icon: <MapPin className="h-3.5 w-3.5 shrink-0" /> },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveSection(id);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePortalAction = () => {
    setMobileMenuOpen(false);
    if (userRole) {
      onNavigateApp();
    } else {
      onNavigateLogin();
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 cit-ease-out ${
          scrolled
            ? 'h-[62px] sm:h-[66px] bg-[#F3ECE2]/95 backdrop-blur-md border-b border-[#1E1915]/10 shadow-[0_4px_20px_-4px_rgba(30,25,21,0.06)]'
            : 'h-[76px] sm:h-[84px] bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* CIT Brand Logo with Official Institutional Seal */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, '#hero', 'hero')}
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none shrink-0"
          >
            <img
              src="/img/cit/cit-logo.png"
              alt="Chilika Institute of Technology"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover shrink-0 shadow-sm border border-[#F3ECE2]/30 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span
                className={`font-serif text-base sm:text-lg font-bold tracking-wider leading-none transition-colors duration-300 ${
                  scrolled ? 'text-[#1E1915]' : 'text-[#F3ECE2]'
                }`}
              >
                CHILIKA
              </span>
              <span
                className={`text-[8.5px] sm:text-[9px] uppercase tracking-[0.2em] font-medium leading-tight mt-0.5 transition-colors duration-300 ${
                  scrolled ? 'text-[#5B5048]' : 'text-[#F3ECE2]/80'
                }`}
              >
                Institute of Technology
              </span>
            </div>
          </a>

          {/* Desktop Animated Top Dock Navigation (Sable Proximity Spring Interaction) */}
          <AnimatedTopDockNav
            items={dockItems}
            activeId={activeSection}
            onItemClick={handleLinkClick}
            scrolled={scrolled}
          />

          {/* Desktop Portal Login Button (CTA) */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <StarBorder
              as="button"
              onClick={handlePortalAction}
              radius={9999}
              color="#C8693F"
              trailColor="#A9502B"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#A9502B] hover:bg-[#8F3F1E] text-[#F3ECE2] text-xs font-semibold tracking-wider uppercase transition-colors duration-200 shadow-sm hover:shadow-md hover:shadow-[#A9502B]/20 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#A9502B]/40"
            >
              {userRole ? (
                <>
                  <UserCheck className="h-3.5 w-3.5 pointer-events-none shrink-0" />
                  <span className="pointer-events-none">Portal Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5 pointer-events-none shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              ) : (
                <>
                  <span className="pointer-events-none">Portal Login</span>
                  <ArrowRight className="h-3.5 w-3.5 pointer-events-none shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </StarBorder>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors focus:outline-none ${
                scrolled ? 'text-[#1E1915]' : 'text-[#F3ECE2]'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fullscreen / Slide-in Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col bg-[#191513] text-[#F3ECE2] px-6 sm:px-8 pt-24 pb-10 overflow-y-auto animate-in fade-in duration-300">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/img/cit/cit-logo.png"
                alt="Chilika Institute of Technology"
                className="h-9 w-9 rounded-full object-cover shrink-0 shadow-xs border border-[#F3ECE2]/20"
              />
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#A9502B] font-mono font-bold">
                Chilika Institute of Technology
              </div>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-5">
              {dockItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href, item.id)}
                  className={`font-serif text-2xl tracking-wide transition-colors flex items-center gap-3 ${
                    activeSection === item.id ? 'text-[#A9502B] font-bold' : 'text-[#F3ECE2] hover:text-[#A9502B]'
                  }`}
                >
                  <span className="text-[#A9502B]/80">{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>

            {/* Mobile Portal Login Action Button */}
            <div className="pt-6 border-t border-[#F3ECE2]/15 flex flex-col gap-3">
              <button
                onClick={handlePortalAction}
                className="w-full py-3.5 rounded-full bg-[#A9502B] hover:bg-[#8f3f1e] text-[#F3ECE2] text-sm font-semibold tracking-wider uppercase transition-all text-center flex items-center justify-center gap-2"
              >
                <span>{userRole ? 'Portal Dashboard' : 'Portal Login'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
