import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Compass,
  BookOpen,
  Cpu,
  Zap,
  Cog,
  Layers,
  Building2,
  Users,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Calendar,
  X,
  GraduationCap,
  Globe,
  Radio,
  Send
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { CitInteriorsSection } from '../components/common/CitInteriorsSection';
import { FadeContent } from '../components/common/FadeContent';
import { StarBorder } from '../components/ui/StarBorder';
import { TextType } from '../components/ui/TextType';
import { VariableProximity } from '../components/ui/VariableProximity';
import type { DatasetSummary } from '../types/dataset';

interface LandingPageProps {
  summary: DatasetSummary | null;
  onNavigateLogin: () => void;
  onNavigateApp: () => void;
  userRole?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  summary,
  onNavigateLogin,
  onNavigateApp,
  userRole,
}) => {
  // Modal state for standalone information dialogs (e.g., Transit/Academic ethics)
  const [modalType, setModalType] = useState<string | null>(null);

  // Department gallery horizontal scroll ref
  const deptScrollRef = useRef<HTMLDivElement>(null);
  const [activeDeptIndex, setActiveDeptIndex] = useState(0);

  // Campus Life dark section active experience
  const [activeExperience, setActiveExperience] = useState(0);

  // Student Testimonials slider state
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isTestimonialHovered, setIsTestimonialHovered] = useState(false);

  // Admissions Query Form state
  const [queryName, setQueryName] = useState('');
  const [queryEmail, setQueryEmail] = useState('');
  const [queryDept, setQueryDept] = useState('Computer Science & Engineering');
  const [queryMessage, setQueryMessage] = useState('');
  const [isQuerySubmitted, setIsQuerySubmitted] = useState(false);

  // Newsletter subscribe state
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Testimonial auto-play timer (6.5s)
  useEffect(() => {
    if (isTestimonialHovered) return;
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isTestimonialHovered]);

  const departments = [
    {
      num: '01',
      title: 'Computer Science & Engineering',
      tagline: 'Computational Systems, AI & Software Architecture',
      desc: 'Advancing algorithmic precision, distributed cloud infrastructure, machine intelligence, and high-assurance security engineering for global computing demands.',
      focus: ['Distributed Systems', 'Machine Intelligence', 'Software Verification', 'Cybersecurity'],
      img: '/img/cit/department-cse.webp',
    },
    {
      num: '02',
      title: 'Electronics & Communication',
      tagline: 'Semiconductor Hardware, VLSI & Modern Telemetry',
      desc: 'Bridging physical silicon with intelligent communication systems, advanced signal processing, embedded architectures, and next-generation wireless physical layers.',
      focus: ['VLSI Circuit Design', 'Embedded Robotics', 'Optical Networks', 'RF Systems'],
      img: '/img/cit/department-electronics.webp',
    },
    {
      num: '03',
      title: 'Electrical Engineering',
      tagline: 'Power Systems, Renewable Microgrids & Control',
      desc: 'Pioneering clean energy transition, high-efficiency power electronics, grid resilience, industrial automation, and electric mobility technologies.',
      focus: ['Clean Energy Grids', 'Electric Mobility', 'Industrial Control', 'High-Voltage Power'],
      img: '/img/cit/department-electrical.webp',
    },
    {
      num: '04',
      title: 'Mechanical Engineering',
      tagline: 'Precision Robotics, Thermofluids & Additive Design',
      desc: 'Synthesizing kinematic theory with modern computational fluid dynamics, robotic manipulation, advanced materials, and digital manufacturing processes.',
      focus: ['Autonomous Robotics', 'Aerodynamics & CFD', 'Digital Fabrication', 'Thermal Engineering'],
      img: '/img/cit/department-mechanical.webp',
    },
  ];

  const facilities = [
    {
      title: 'Modern Classrooms',
      desc: 'Acoustically calibrated tiered lecture halls equipped with synchronized projection, natural lighting, and ergonomic study stations.',
      img: '/img/cit/modern-classrooms.webp',
      badge: 'Academic Spaces',
    },
    {
      title: 'Advanced Laboratories',
      desc: 'Multi-disciplinary experimental suites featuring high-precision instrumentation for electronics, materials testing, and physical sciences.',
      img: '/img/cit/laboratories.webp',
      badge: 'Experimental Research',
    },
    {
      title: 'Central Library',
      desc: 'Quiet study carrels, specialized technological treatises, expansive digital repository access, and collaborative research meeting suites.',
      img: '/img/cit/library.webp',
      badge: 'Scholarly Archive',
    },
    {
      title: 'Computer Labs',
      desc: 'High-density computational clusters, GPU workstations, and Unix workstation terminals for intensive simulations and system design.',
      img: '/img/cit/computer-lab.webp',
      badge: 'High-Performance Compute',
    },
    {
      title: 'Campus Infrastructure',
      desc: 'Architectural harmony featuring water reflection basins, landscaped courtyards, sustainable energy harvesting, and pedestrian walkways.',
      img: '/img/cit/campus-hero.png',
      badge: 'Sustainable Architecture',
    },
    {
      title: 'Sports & Recreation',
      desc: 'Integrated athletics pavilion, standard synthetic courts, indoor fitness gymnasium, and dedicated wellness recreation spaces.',
      img: '/img/cit/sports.webp',
      badge: 'Student Wellness',
    },
  ];

  const campusLifeExperiences = [
    {
      num: '01',
      title: 'Student Community',
      subtitle: 'A close-knit collegiate culture built on mutual curiosity',
      desc: 'Life at CIT is defined by an energetic residential community where students debate engineering paradigms, collaborate across branches, and forge professional friendships that endure for a lifetime.',
      highlights: ['Peer-led academic study circles', 'Branch mentorship networks', 'Residential community lounges'],
      img: '/img/cit/campus-life.webp',
    },
    {
      num: '02',
      title: 'Innovation & Projects',
      subtitle: 'Where classroom theory becomes working prototypes',
      desc: 'Student technical teams engage in autonomous robotics design, competitive coding marathons, renewable energy prototypes, and community engineering solutions with dedicated faculty mentorship.',
      highlights: ['Annual Innovation Hackathon', 'Robotics & Automation Society', 'Incubator project grants'],
      img: '/img/cit/student-activities.webp',
    },
    {
      num: '03',
      title: 'Events & Activities',
      subtitle: 'Celebrating scholarship, cultural heritage, and talent',
      desc: 'From technical conferences and guest addresses by leading industry engineers to Spectra annual cultural festival and department symposiums, campus is vibrant year-round.',
      highlights: ['Spectra Cultural Festival', 'Distinguished Lecture Series', 'Inter-collegiate Tech Conclave'],
      img: '/img/cit/campus-academic.webp',
    },
    {
      num: '04',
      title: 'Sports & Recreation',
      subtitle: 'Physical vitality to balance intellectual rigor',
      desc: 'Our expansive campus grounds support competitive cricket, football, basketball, badminton, and track events, promoting physical fitness and team spirit alongside academic discipline.',
      highlights: ['Inter-department championship trophies', 'Evening recreation leagues', 'Fitness and yoga suites'],
      img: '/img/cit/sports.webp',
    },
  ];

  const testimonials = [
    {
      quote:
        'CIT provided the mathematical foundation and laboratory freedom I needed to understand complex distributed architectures from the silicon up.',
      name: 'Aarav Patnaik',
      role: 'B.Tech Student, Computer Science & Engineering',
      year: 'Final Year Cohort',
    },
    {
      quote:
        'The faculty mentorship in the VLSI and embedded systems labs transformed abstract circuit theory into tangible, working hardware prototypes.',
      name: 'Meera Mohanty',
      role: 'B.Tech Student, Electronics & Communication',
      year: 'Third Year Cohort',
    },
    {
      quote:
        'The emphasis on clean engineering design and rigorous experimentation taught us how to tackle real power grid constraints with confidence.',
      name: 'Rohan Das',
      role: 'B.Tech Student, Electrical Engineering',
      year: 'Final Year Cohort',
    },
    {
      quote:
        'From computational fluid dynamics to hands-on robotic fabrication, CIT balances theoretical depth with the practical discipline industry demands.',
      name: 'Sneha Tripathy',
      role: 'B.Tech Student, Mechanical Engineering',
      year: 'Third Year Cohort',
    },
  ];

  const handleScrollDepts = (direction: 'left' | 'right') => {
    if (!deptScrollRef.current) return;
    const cardWidth = 360;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    deptScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setActiveDeptIndex((prev) => {
      if (direction === 'left') return Math.max(0, prev - 1);
      return Math.min(departments.length - 1, prev + 1);
    });
  };

  const handleAdmissionsQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryName && queryEmail && queryMessage) {
      setIsQuerySubmitted(true);
      setTimeout(() => {
        setIsQuerySubmitted(false);
        setQueryName('');
        setQueryEmail('');
        setQueryMessage('');
      }, 5000);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscribedEmail) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setSubscribedEmail('');
      }, 4000);
    }
  };

  return (
    <div className="cit min-h-screen bg-[#F3ECE2] text-[#1E1915] selection:bg-[#A9502B]/20 selection:text-[#1E1915] overflow-x-hidden">
      {/* 1. STICKY LUXURY NAVIGATION */}
      <Navbar
        onNavigateLogin={onNavigateLogin}
        onNavigateApp={onNavigateApp}
        userRole={userRole}
      />

      {/* 2. HERO SECTION */}
      <section id="hero" className="relative min-h-[90vh] sm:min-h-screen flex items-center overflow-hidden">
        {/* Full-bleed authentic campus photography */}
        <div className="absolute inset-0 z-0">
          <img
            src="/img/cit/campus-hero.png"
            alt="Chilika Institute of Technology Main Campus and Reflecting Basin"
            className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000 cit-ease-out"
            fetchPriority="high"
          />
          {/* Subtle directional gradient scrim for high typographic legibility */}
          <div className="absolute inset-0 cit-scrim pointer-events-none" />
          <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        </div>

        {/* Hero Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-20 sm:pb-24 relative z-10 w-full">
          <FadeContent trigger="load" duration={0.9} delay={0.1} className="max-w-3xl space-y-6 sm:space-y-7">
            {/* Small uppercase eyebrow with official institutional mark */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#191513]/60 backdrop-blur-md border border-[#F3ECE2]/20">
              <img
                src="/img/cit/cit-logo.png"
                alt="CIT Crest"
                className="h-4 w-4 rounded-full object-cover shrink-0"
              />
              <span className="text-[10px] sm:text-[11px] font-sans font-semibold tracking-[0.2em] uppercase text-[#F3ECE2]">
                <VariableProximity
                  label="Chilika Institute of Technology"
                  fromFontVariationSettings="'wght' 600, 'opsz' 9"
                  toFontVariationSettings="'wght' 900, 'opsz' 40"
                  radius={90}
                  falloff="gaussian"
                  smoothing={0.18}
                  fromColor="#F3ECE2"
                  toColor="#C8693F"
                  scale={1.035}
                  lift={0.04}
                  idleWave={false}
                />
              </span>
            </div>

            {/* Cinematic Serif Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#F3ECE2] tracking-tight leading-[1.08] sm:leading-[1.04]">
              Engineering
              <br />
              <span className="italic font-normal text-[#F3ECE2]/95">Tomorrow,</span>
              <br />
              Today<span className="text-[#A9502B]">.</span>
            </h1>

            {/* Supporting Text with Animated TextType Tagline */}
            <div className="space-y-3 max-w-2xl">
              {/* Animated Institutional Vision Tagline */}
              <div className="min-h-[1.85rem] sm:min-h-[2.2rem] md:min-h-[2.5rem] flex items-center">
                <TextType
                  as="div"
                  text={[
                    "Where Innovation Meets Education",
                    "Building Tomorrow's Leaders",
                    "Discover a Future of Possibilities",
                    "Learning Beyond Classrooms",
                  ]}
                  typingSpeed={55}
                  deletingSpeed={28}
                  pauseDuration={1800}
                  initialDelay={500}
                  loop={true}
                  showCursor={true}
                  cursorStyle="character"
                  cursorCharacter="|"
                  cursorColor="#A9502B"
                  cursorClassName="text-[#A9502B] font-light ml-0.5"
                  cursorGlide={true}
                  typeEffect="fade"
                  startOnVisible={true}
                  mistakes={0}
                  className="font-serif text-lg sm:text-xl md:text-2xl font-medium text-[#C8693F] tracking-wide"
                />
              </div>

              {/* Supporting Descriptive Body Text */}
              <p className="text-sm sm:text-base md:text-lg text-[#F3ECE2]/85 font-sans font-normal leading-relaxed max-w-xl">
                Discover a place where curiosity meets innovation, knowledge becomes opportunity, and ideas shape the future.
              </p>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 pt-2 sm:pt-3">
              <StarBorder
                as="a"
                href="#about"
                radius={9999}
                color="#C8693F"
                trailColor="#A9502B"
                className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-[#A9502B] hover:bg-[#8f3f1e] text-[#F3ECE2] font-semibold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-md hover:scale-[1.02] active:scale-[0.98] text-center"
              >
                <span>Explore CIT</span>
                <ArrowRight className="h-4 w-4" />
              </StarBorder>

              <a
                href="#departments"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-full bg-[#F3ECE2]/15 hover:bg-[#F3ECE2]/25 text-[#F3ECE2] font-semibold text-xs sm:text-sm tracking-wider uppercase backdrop-blur-sm border border-[#F3ECE2]/30 transition-all duration-300 text-center"
              >
                <span>Discover Departments</span>
              </a>
            </div>
          </FadeContent>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 text-[#F3ECE2]/70 pointer-events-none">
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono">Scroll to explore</span>
          <div className="w-5 h-9 rounded-full border border-[#F3ECE2]/40 flex justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-[#A9502B] animate-bounce" />
          </div>
        </div>
      </section>

      {/* 3. QUICK ACCESS BAR */}
      <section id="quick-access" className="relative z-20 -mt-8 sm:-mt-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FBF8F3] border border-[#1E1915]/10 rounded-2xl shadow-[0_20px_45px_-12px_rgba(30,25,21,0.12)] p-4 sm:p-5">
          <FadeContent threshold={0.15} stagger={0.12} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                id: 'admissions',
                title: 'Admissions & Queries',
                desc: 'Intake criteria & query desk',
                icon: <GraduationCap className="h-4 w-4 text-[#A9502B]" />,
                action: () => {
                  const target = document.querySelector('#admissions');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                },
              },
              {
                id: 'programs',
                title: 'Academic Programs',
                desc: 'B.Tech curricula & minors',
                icon: <BookOpen className="h-4 w-4 text-[#243C50]" />,
                action: () => {
                  const target = document.querySelector('#departments');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                },
              },
              {
                id: 'portal',
                title: 'Student Portal',
                desc: 'Timetables & scheduling',
                icon: <Users className="h-4 w-4 text-[#A9502B]" />,
                action: () => {
                  if (userRole) onNavigateApp();
                  else onNavigateLogin();
                },
              },
              {
                id: 'campus',
                title: 'Campus Information',
                desc: 'Location, labs & transit',
                icon: <Compass className="h-4 w-4 text-[#243C50]" />,
                action: () => {
                  const target = document.querySelector('#location');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                },
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="flex items-start gap-3 p-3.5 rounded-xl hover:bg-[#F3ECE2]/70 text-left transition-all duration-200 group border border-transparent hover:border-[#1E1915]/5 focus:outline-none"
              >
                <div className="p-2 rounded-lg bg-[#F3ECE2] border border-[#1E1915]/10 group-hover:scale-105 transition-transform shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-serif font-bold text-[#1E1915] group-hover:text-[#A9502B] transition-colors truncate">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#5B5048] font-sans truncate">
                    {item.desc}
                  </div>
                </div>
              </button>
            ))}
          </FadeContent>

          {/* Quick CTA strip */}
          <FadeContent threshold={0.15} delay={0.15}>
            <div className="mt-3 pt-3 border-t border-[#1E1915]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#5B5048] px-2 gap-2">
            <span className="font-sans">
              Looking for campus scheduling & institutional venue allocation?
            </span>
            <StarBorder
              as="button"
              onClick={userRole ? onNavigateApp : onNavigateLogin}
              radius={8}
              color="#C8693F"
              trailColor="#A9502B"
              className="inline-flex items-center gap-1.5 font-semibold text-[#A9502B] hover:text-[#8f3f1e] group px-3 py-1.5 rounded-lg bg-[#A9502B]/5 border border-[#A9502B]/20"
            >
              <span>Explore Opportunities &middot; Launch Portal</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </StarBorder>
          </div>
          </FadeContent>
        </div>
      </section>

      {/* 4. ABOUT CIT SECTION */}
      <section id="about" className="py-20 sm:py-28 md:py-32 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Editorial Text */}
          <FadeContent threshold={0.15} className="lg:col-span-7 space-y-6">
            <div className="text-[11px] uppercase tracking-[0.22em] font-sans font-bold text-[#A9502B]">
              ABOUT CIT
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E1915] leading-[1.12]">
              <VariableProximity
                label="Where ambition meets the art of engineering."
                fromFontVariationSettings="'wght' 700, 'opsz' 9"
                toFontVariationSettings="'wght' 950, 'opsz' 40"
                radius={110}
                falloff="gaussian"
                smoothing={0.18}
                fromColor="#1E1915"
                toColor="#A9502B"
                scale={1.035}
                lift={0.04}
                idleWave={false}
              />
            </h2>

            <p className="cit-dropcap text-[#5B5048] text-base sm:text-lg leading-relaxed font-sans">
              Chilika Institute of Technology is dedicated to the disciplined pursuit of technical knowledge, engineering discovery, and rigorous scholarship. Situated along the serene coastal expanse of Chilika in Odisha, CIT combines natural tranquility with world-class computational and experimental facilities.
            </p>

            <p className="text-[#5B5048] text-sm sm:text-base leading-relaxed font-sans">
              Here, engineering is not merely an academic curriculum; it is an enduring commitment to problem-solving. From foundational computational theory to precision manufacturing and power grid transformation, CIT prepares engineers to design systems that are resilient, sustainable, and socially impactful.
            </p>

            {/* Three Institutional Highlight Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-3">
              <div className="p-4 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 space-y-1.5">
                <span className="font-serif text-xs font-bold text-[#A9502B] tracking-wider uppercase block">
                  01 &middot; Rigor
                </span>
                <h4 className="font-serif text-sm font-bold text-[#1E1915]">
                  Rigorous Pedagogy
                </h4>
                <p className="text-xs text-[#5B5048] leading-normal font-sans">
                  Deep grounding in mathematical foundations, algorithmic discipline, and system verification.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 space-y-1.5">
                <span className="font-serif text-xs font-bold text-[#243C50] tracking-wider uppercase block">
                  02 &middot; Discovery
                </span>
                <h4 className="font-serif text-sm font-bold text-[#1E1915]">
                  Applied Research
                </h4>
                <p className="text-xs text-[#5B5048] leading-normal font-sans">
                  State-of-the-art computational suites and fabrication laboratories for experimental inquiry.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 space-y-1.5">
                <span className="font-serif text-xs font-bold text-[#A9502B] tracking-wider uppercase block">
                  03 &middot; Community
                </span>
                <h4 className="font-serif text-sm font-bold text-[#1E1915]">
                  Collaborative Culture
                </h4>
                <p className="text-xs text-[#5B5048] leading-normal font-sans">
                  Close faculty mentorship, peer-driven innovation teams, and vibrant technical societies.
                </p>
              </div>
            </div>
          </FadeContent>

          {/* Right Column: Two-Image Overlapping Collage */}
          <FadeContent threshold={0.15} delay={0.15} className="lg:col-span-5 relative mt-4 lg:mt-0">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Primary Architecture Image */}
              <div className="relative z-10 rounded-2xl overflow-hidden border border-[#1E1915]/10 shadow-[0_25px_50px_-15px_rgba(30,25,21,0.18)] aspect-[4/5]">
                <img
                  src="/img/cit/campus-academic.webp"
                  alt="CIT Academic Complex and Research Wing"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Overlapping Secondary Lab Image (Adaptive for tablet/desktop) */}
              <div className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-10 z-20 w-3/5 rounded-xl overflow-hidden border-2 border-[#FBF8F3] shadow-[0_20px_35px_-10px_rgba(30,25,21,0.22)] aspect-square hidden sm:block">
                <img
                  src="/img/cit/laboratories.webp"
                  alt="CIT Research Instrumentation Laboratory"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Institutional Seal Accent Badge */}
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-20 bg-[#243C50] text-[#F3ECE2] p-2.5 sm:p-3 rounded-xl shadow-lg border border-[#F3ECE2]/20 text-center flex flex-col items-center gap-1.5 max-w-[130px] sm:max-w-[140px]">
                <img
                  src="/img/cit/cit-logo.png"
                  alt="Chilika Institute of Technology Official Seal"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover shadow-xs border border-[#F3ECE2]/30"
                />
                <div className="text-[9px] sm:text-[10px] tracking-wider uppercase font-sans font-semibold text-[#F3ECE2]/90 leading-tight">
                  ESTD. 2005 &middot; Odisha
                </div>
              </div>
            </div>
          </FadeContent>
        </div>
      </section>

      {/* 5. ACADEMIC DEPARTMENTS (PINNED HORIZONTAL GALLERY) */}
      <section id="departments" className="py-20 sm:py-28 bg-[#FBF8F3] border-y border-[#1E1915]/10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header & Controls */}
          <FadeContent threshold={0.15}>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="text-[11px] uppercase tracking-[0.22em] font-sans font-bold text-[#A9502B]">
                DEPARTMENTS OF STUDY
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E1915]">
                <VariableProximity
                  label="Explore your possibilities."
                  fromFontVariationSettings="'wght' 700, 'opsz' 9"
                  toFontVariationSettings="'wght' 950, 'opsz' 40"
                  radius={110}
                  falloff="gaussian"
                  smoothing={0.18}
                  fromColor="#1E1915"
                  toColor="#A9502B"
                  scale={1.035}
                  lift={0.04}
                  idleWave={false}
                />
              </h2>
              <p className="text-[#5B5048] text-sm sm:text-base max-w-xl font-sans">
                Four rigorous engineering disciplines built on theoretical depth, laboratory experimentation, and industry alignment.
              </p>
            </div>

            {/* Navigation Buttons & Counter */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-[#5B5048] mr-2">
                0{activeDeptIndex + 1} / 0{departments.length}
              </span>
              <button
                onClick={() => handleScrollDepts('left')}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-[#1E1915]/20 hover:border-[#A9502B] hover:text-[#A9502B] bg-[#FBF8F3] flex items-center justify-center transition-colors"
                aria-label="Previous Department"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleScrollDepts('right')}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-[#1E1915]/20 hover:border-[#A9502B] hover:text-[#A9502B] bg-[#FBF8F3] flex items-center justify-center transition-colors"
                aria-label="Next Department"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          </FadeContent>

          {/* Horizontal Scroll Track */}
          <FadeContent
            threshold={0.15}
            stagger={0.12}
            delay={0.1}
            ref={deptScrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {departments.map((dept, idx) => (
              <div
                key={dept.num}
                className="snap-start shrink-0 w-[280px] xs:w-[320px] sm:w-[350px] md:w-[380px] rounded-2xl bg-[#F3ECE2] border border-[#1E1915]/10 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group"
              >
                {/* Department Image Frame */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#1E1915]/5">
                  <img
                    src={dept.img}
                    alt={dept.title}
                    className="w-full h-full object-cover transition-transform duration-700 cit-ease-out group-hover:scale-107"
                    loading="lazy"
                  />
                  <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#191513]/70 backdrop-blur-md text-[#F3ECE2] text-xs font-mono font-bold border border-[#F3ECE2]/20">
                    Dept {dept.num}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-[#1E1915] group-hover:text-[#A9502B] transition-colors leading-snug">
                      {dept.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#243C50] tracking-wide">
                      {dept.tagline}
                    </p>
                    <p className="text-xs text-[#5B5048] leading-relaxed font-sans">
                      {dept.desc}
                    </p>
                  </div>

                  {/* Focus Tags */}
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {dept.focus.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-md bg-[#FBF8F3] border border-[#1E1915]/10 text-[#5B5048]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <a
                      href="#admissions"
                      className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A9502B] group-hover:text-[#8f3f1e] transition-colors"
                    >
                      <span>Inquire About Program</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </FadeContent>
        </div>
      </section>

      {/* 6. CAMPUS FACILITIES */}
      <section id="facilities" className="py-20 sm:py-28 md:py-32 max-w-7xl mx-auto px-4 sm:px-6">
        <FadeContent threshold={0.15}>
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="text-[11px] uppercase tracking-[0.22em] font-sans font-bold text-[#A9502B]">
            INFRASTRUCTURE & ENVIRONMENT
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E1915]">
            <VariableProximity
              label="Designed for learning. Built for discovery."
              fromFontVariationSettings="'wght' 700, 'opsz' 9"
              toFontVariationSettings="'wght' 950, 'opsz' 40"
              radius={110}
              falloff="gaussian"
              smoothing={0.18}
              fromColor="#1E1915"
              toColor="#A9502B"
              scale={1.035}
              lift={0.04}
              idleWave={false}
            />
          </h2>
          <p className="text-[#5B5048] text-sm sm:text-base font-sans">
            A 27-venue academic campus comprising specialized engineering laboratories, multimedia lecture halls, and central research facilities.
          </p>
        </div>
        </FadeContent>

        {/* 3-Column Card Layout */}
        <FadeContent threshold={0.15} stagger={0.12} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
          {facilities.map((fac) => (
            <div
              key={fac.title}
              className="group rounded-2xl bg-[#FBF8F3] border border-[#1E1915]/10 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img
                  src={fac.img}
                  alt={fac.title}
                  className="w-full h-full object-cover transition-transform duration-700 cit-ease-out group-hover:scale-107"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                <span className="absolute top-3.5 left-3.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#191513]/70 text-[#F3ECE2] backdrop-blur-md border border-[#F3ECE2]/20">
                  {fac.badge}
                </span>
              </div>

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1E1915] group-hover:text-[#A9502B] transition-colors">
                    {fac.title}
                  </h3>
                  <p className="text-xs text-[#5B5048] leading-relaxed font-sans">
                    {fac.desc}
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href="#location"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#243C50] group-hover:text-[#A9502B] transition-colors"
                  >
                    <span>View on Campus Map</span>
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </FadeContent>
      </section>

      {/* 7. CAMPUS INTERIORS SHOWCASE ("Spaces That Inspire Possibilities.") */}
      <CitInteriorsSection />

      {/* 8. CAMPUS LIFE — DARK EDITORIAL SECTION */}
      <section id="campus-life" className="py-20 sm:py-28 md:py-32 bg-[#191513] text-[#F3ECE2] border-t border-[#F3ECE2]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FadeContent threshold={0.15}>
            <div className="mb-10 sm:mb-14 space-y-3">
            <div className="text-[11px] uppercase tracking-[0.22em] font-sans font-bold text-[#A9502B]">
              LIFE AT CIT
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#F3ECE2]">
              <VariableProximity
                label="More than classrooms. A place to grow."
                fromFontVariationSettings="'wght' 700, 'opsz' 9"
                toFontVariationSettings="'wght' 950, 'opsz' 40"
                radius={110}
                falloff="gaussian"
                smoothing={0.18}
                fromColor="#F3ECE2"
                toColor="#C8693F"
                scale={1.035}
                lift={0.04}
                idleWave={false}
              />
            </h2>
            <p className="text-[#F3ECE2]/70 text-sm sm:text-base max-w-xl font-sans">
              Engaging campus life where technical rigor is balanced by vibrant collegiate traditions, creative societies, and inter-branch community.
            </p>
          </div>
          </FadeContent>

          {/* Cinematic Split Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Left: Featured Image Frame */}
            <FadeContent threshold={0.15} className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-[#F3ECE2]/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] aspect-[4/3] bg-black/40">
                <img
                  key={activeExperience}
                  src={campusLifeExperiences[activeExperience].img}
                  alt={campusLifeExperiences[activeExperience].title}
                  className="w-full h-full object-cover animate-in fade-in duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#191513]/80 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-5 right-4 sm:right-5 flex items-center justify-between text-xs">
                  <span className="font-serif font-bold text-sm tracking-wide text-[#F3ECE2]">
                    {campusLifeExperiences[activeExperience].title}
                  </span>
                  <span className="font-mono text-[11px] text-[#A9502B]">
                    0{activeExperience + 1} / 04
                  </span>
                </div>
              </div>
            </FadeContent>

            {/* Right: Interactive Experience List */}
            <FadeContent threshold={0.15} stagger={0.12} className="lg:col-span-6 space-y-3 sm:space-y-4">
              {campusLifeExperiences.map((exp, index) => {
                const isActive = activeExperience === index;
                return (
                  <div
                    key={exp.num}
                    onMouseEnter={() => setActiveExperience(index)}
                    onClick={() => setActiveExperience(index)}
                    className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all duration-300 cit-ease-out ${
                      isActive
                        ? 'bg-[#F3ECE2]/10 border-[#A9502B] translate-x-1 sm:translate-x-2'
                        : 'bg-transparent border-[#F3ECE2]/10 hover:border-[#F3ECE2]/25'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isActive ? 'text-[#A9502B]' : 'text-[#F3ECE2]/40'
                        }`}
                      >
                        {exp.num}
                      </span>
                      <h3
                        className={`font-serif text-base sm:text-lg md:text-xl font-bold transition-colors ${
                          isActive ? 'text-[#F3ECE2]' : 'text-[#F3ECE2]/70'
                        }`}
                      >
                        {exp.title}
                      </h3>
                    </div>

                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[#F3ECE2]/75 font-sans leading-relaxed">
                      {exp.desc}
                    </p>

                    {isActive && (
                      <div className="mt-3 pt-3 border-t border-[#F3ECE2]/10 flex flex-wrap gap-1.5 sm:gap-2 animate-in fade-in duration-300">
                        {exp.highlights.map((h) => (
                          <span
                            key={h}
                            className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-[#A9502B]/20 text-[#F3ECE2] border border-[#A9502B]/40"
                          >
                            &bull; {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </FadeContent>
          </div>
        </div>
      </section>

      {/* 8. STUDENT TESTIMONIALS */}
      <section
        id="testimonials"
        onMouseEnter={() => setIsTestimonialHovered(true)}
        onMouseLeave={() => setIsTestimonialHovered(false)}
        className="py-20 sm:py-28 md:py-32 max-w-5xl mx-auto px-4 sm:px-6 text-center"
      >
        <FadeContent threshold={0.15}>
          <div className="space-y-3 mb-8 sm:mb-10">
          <div className="text-[11px] uppercase tracking-[0.22em] font-sans font-bold text-[#A9502B]">
            STUDENT STORIES
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E1915]">
            Experiences that shape futures.
          </h2>
        </div>
        </FadeContent>

        <FadeContent threshold={0.15} delay={0.1}>
        {/* Carousel Viewport */}
        <div className="relative min-h-[180px] sm:min-h-[220px] flex items-center justify-center">
          <div
            key={activeTestimonial}
            className="animate-in fade-in duration-500 max-w-3xl space-y-4 sm:space-y-6 px-2"
          >
            <p className="font-serif text-lg sm:text-2xl md:text-3xl italic text-[#1E1915] leading-relaxed">
              &ldquo;{testimonials[activeTestimonial].quote}&rdquo;
            </p>

            <div className="space-y-1">
              <div className="font-sans font-bold text-sm tracking-wide text-[#1E1915]">
                {testimonials[activeTestimonial].name}
              </div>
              <div className="text-xs text-[#5B5048]">
                {testimonials[activeTestimonial].role} &middot;{' '}
                <span className="text-[#A9502B] font-medium">
                  {testimonials[activeTestimonial].year}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dash Indicators & Controls */}
        <div className="flex items-center justify-center gap-4 mt-6 sm:mt-8">
          <button
            onClick={() =>
              setActiveTestimonial(
                (prev) => (prev - 1 + testimonials.length) % testimonials.length
              )
            }
            className="p-1.5 rounded-full text-[#5B5048] hover:text-[#1E1915] hover:bg-[#1E1915]/5 transition-colors"
            aria-label="Previous story"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeTestimonial === i ? 'w-8 bg-[#A9502B]' : 'w-2 bg-[#1E1915]/20'
                }`}
                aria-label={`Go to story ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() =>
              setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
            }
            className="p-1.5 rounded-full text-[#5B5048] hover:text-[#1E1915] hover:bg-[#1E1915]/5 transition-colors"
            aria-label="Next story"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        </FadeContent>
      </section>

      {/* 9. ADMISSIONS QUERY & CAMPUS LOCATION (TARGET FOR ADMISSIONS & CONTACT NAV) */}
      <section id="admissions" className="py-20 sm:py-28 bg-[#FBF8F3] border-t border-[#1E1915]/10 scroll-mt-20">
        <div id="location" className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left: Admissions Query & Inquiries Form */}
            <div className="lg:col-span-6 space-y-6">
              <FadeContent threshold={0.15} className="space-y-3">
                <div className="text-[11px] uppercase tracking-[0.22em] font-sans font-bold text-[#A9502B]">
                ADMISSIONS QUERY & INQUIRIES
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E1915]">
                <VariableProximity
                  label="Your journey starts here."
                  fromFontVariationSettings="'wght' 700, 'opsz' 9"
                  toFontVariationSettings="'wght' 950, 'opsz' 40"
                  radius={110}
                  falloff="gaussian"
                  smoothing={0.18}
                  fromColor="#1E1915"
                  toColor="#A9502B"
                  scale={1.035}
                  lift={0.04}
                  idleWave={false}
                />
              </h2>

              <p className="text-[#5B5048] text-sm sm:text-base leading-relaxed font-sans">
                Admission to B.Tech programs at Chilika Institute of Technology is based on standardized national merit, scholastic academic performance, and technical aptitude assessment for the 2026&ndash;2027 intake.
              </p>
              </FadeContent>

              {/* Admissions Query Submission Card */}
              <FadeContent threshold={0.15} delay={0.1}>
                <div className="p-5 sm:p-6 rounded-2xl bg-[#F3ECE2] border border-[#1E1915]/10 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E1915]/10">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/img/cit/cit-logo.png"
                      alt="CIT Seal"
                      className="h-5 w-5 rounded-full object-cover shrink-0"
                    />
                    <span className="font-serif font-bold text-sm text-[#1E1915]">
                      Direct Admissions Query Desk
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#A9502B]/15 text-[#A9502B] font-bold">
                    Fall 2026 Active
                  </span>
                </div>

                {isQuerySubmitted ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Query Received Successfully</span>
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-700">
                      Thank you. Your admissions inquiry has been recorded by the CIT Admissions Desk. Our admissions coordinator will reach out to your registered email with program criteria and enrollment guides.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleAdmissionsQuerySubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#5B5048] uppercase tracking-wider mb-1 font-mono">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={queryName}
                          onChange={(e) => setQueryName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="w-full px-3 py-2 rounded-lg bg-[#FBF8F3] border border-[#1E1915]/15 text-xs text-[#1E1915] focus:outline-none focus:border-[#A9502B]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#5B5048] uppercase tracking-wider mb-1 font-mono">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={queryEmail}
                          onChange={(e) => setQueryEmail(e.target.value)}
                          placeholder="priya@example.com"
                          className="w-full px-3 py-2 rounded-lg bg-[#FBF8F3] border border-[#1E1915]/15 text-xs text-[#1E1915] focus:outline-none focus:border-[#A9502B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5B5048] uppercase tracking-wider mb-1 font-mono">
                        Program of Interest
                      </label>
                      <select
                        value={queryDept}
                        onChange={(e) => setQueryDept(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#FBF8F3] border border-[#1E1915]/15 text-xs text-[#1E1915] focus:outline-none focus:border-[#A9502B]"
                      >
                        <option value="Computer Science & Engineering">B.Tech in Computer Science & Engineering</option>
                        <option value="Electronics & Communication">B.Tech in Electronics & Communication</option>
                        <option value="Electrical Engineering">B.Tech in Electrical Engineering</option>
                        <option value="Mechanical Engineering">B.Tech in Mechanical Engineering</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5B5048] uppercase tracking-wider mb-1 font-mono">
                        Query / Inquiry Details
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={queryMessage}
                        onChange={(e) => setQueryMessage(e.target.value)}
                        placeholder="Inquire regarding eligibility criteria, scholarship opportunities, or campus visit..."
                        className="w-full px-3 py-2 rounded-lg bg-[#FBF8F3] border border-[#1E1915]/15 text-xs text-[#1E1915] focus:outline-none focus:border-[#A9502B] resize-none"
                      />
                    </div>

                    <StarBorder
                      as="button"
                      type="submit"
                      radius={12}
                      color="#C8693F"
                      trailColor="#A9502B"
                      className="w-full py-2.5 rounded-xl bg-[#A9502B] hover:bg-[#8f3f1e] text-[#F3ECE2] text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Admissions Query</span>
                    </StarBorder>
                  </form>
                )}
              </div>
              </FadeContent>

              {/* Direct Official Contact Rows */}
              <FadeContent threshold={0.15} delay={0.15}>
                <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#F3ECE2] border border-[#1E1915]/10 text-[#A9502B] shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1E1915] font-serif">
                      Admissions Registry & Academic Office
                    </div>
                    <div className="text-[11px] text-[#5B5048] font-sans">
                      admissions@cit.ac.in &middot; registrar@cit.ac.in
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#F3ECE2] border border-[#1E1915]/10 text-[#243C50] shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1E1915] font-serif">
                      Campus Administrative Helpline
                    </div>
                    <div className="text-[11px] text-[#5B5048] font-sans">
                      +91 (0674) 270-CIT-INFO (Mon &ndash; Sat, 09:00 &ndash; 17:00 IST)
                    </div>
                  </div>
                </div>
              </div>
              </FadeContent>
            </div>

            {/* Right: Architectural Campus Map Representation & Location Details */}
            <FadeContent threshold={0.15} delay={0.1} className="lg:col-span-6 space-y-4">
              <div className="rounded-2xl border border-[#1E1915]/15 bg-[#F3ECE2] p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E1915]/10">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-[#A9502B]" />
                    <span className="font-serif font-bold text-sm text-[#1E1915]">
                      <VariableProximity
                        label="Campus Architectural Schematic"
                        fromFontVariationSettings="'wght' 700, 'opsz' 9"
                        toFontVariationSettings="'wght' 950, 'opsz' 40"
                        radius={90}
                        falloff="gaussian"
                        smoothing={0.18}
                        fromColor="#1E1915"
                        toColor="#A9502B"
                        scale={1.035}
                        lift={0.04}
                        idleWave={false}
                      />
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-[#5B5048]">
                    Zone Layout v26
                  </span>
                </div>

                {/* Stylized Campus Layout Map */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 space-y-1">
                    <span className="text-[10px] font-mono text-[#A9502B] font-bold">ZONE A</span>
                    <div className="font-serif font-bold text-[#1E1915]">Academic Quad</div>
                    <div className="text-[11px] text-[#5B5048]">LH-1 to LH-6, Lecture Halls</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 space-y-1">
                    <span className="text-[10px] font-mono text-[#243C50] font-bold">ZONE B</span>
                    <div className="font-serif font-bold text-[#1E1915]">Engineering Block</div>
                    <div className="text-[11px] text-[#5B5048]">CSE, ECE, EE & ME Labs</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 space-y-1">
                    <span className="text-[10px] font-mono text-[#A9502B] font-bold">ZONE C</span>
                    <div className="font-serif font-bold text-[#1E1915]">Central Library</div>
                    <div className="text-[11px] text-[#5B5048]">Atrium, Repositories</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 space-y-1">
                    <span className="text-[10px] font-mono text-[#243C50] font-bold">ZONE D</span>
                    <div className="font-serif font-bold text-[#1E1915]">Auditorium</div>
                    <div className="text-[11px] text-[#5B5048]">500-seat plenary hall</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 space-y-1">
                    <span className="text-[10px] font-mono text-[#A9502B] font-bold">ZONE E</span>
                    <div className="font-serif font-bold text-[#1E1915]">Reflecting Basin</div>
                    <div className="text-[11px] text-[#5B5048]">Main entrance promenade</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FBF8F3] border border-[#1E1915]/10 space-y-1">
                    <span className="text-[10px] font-mono text-[#243C50] font-bold">ZONE F</span>
                    <div className="font-serif font-bold text-[#1E1915]">Athletic Pavilion</div>
                    <div className="text-[11px] text-[#5B5048]">Gymnasium & grounds</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="p-2 rounded-lg bg-[#FBF8F3] border border-[#1E1915]/10 text-[#A9502B] shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1E1915] font-serif">
                      Campus Physical Location
                    </div>
                    <div className="text-[11px] text-[#5B5048] font-sans">
                      Chilika Coastal Knowledge Zone, Khordha District, Odisha 752030
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#243C50]/5 border border-[#243C50]/15 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#243C50] gap-1">
                  <span>Campus shuttle available from nearest rail & transit stations</span>
                  <span className="font-bold font-mono">30-min intervals</span>
                </div>
              </div>
            </FadeContent>
          </div>
        </div>
      </section>

      {/* 10. PREMIUM DARK FOOTER */}
      <footer className="bg-[#191513] text-[#F3ECE2] pt-16 sm:pt-20 pb-12 border-t border-[#F3ECE2]/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <FadeContent threshold={0.15} stagger={0.1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-12 sm:pb-16 border-b border-[#F3ECE2]/10">
            {/* Brand column */}
            <div className="sm:col-span-2 space-y-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/img/cit/cit-logo.png"
                  alt="Chilika Institute of Technology Official Seal"
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover shrink-0 shadow-md border border-[#F3ECE2]/20"
                />
                <div>
                  <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-[#F3ECE2] block leading-snug">
                    CHILIKA INSTITUTE OF TECHNOLOGY
                  </span>
                  <span className="text-[10px] font-sans tracking-widest text-[#F3ECE2]/60 uppercase">
                    Odisha, India &middot; Estd. 2005
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#F3ECE2]/70 leading-relaxed font-sans max-w-sm">
                Dedicated to foundational engineering education, technological research, and student-centered scholarship along the scenic coastline of Chilika, Odisha.
              </p>

              {/* Newsletter subscribe */}
              <div className="pt-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#A9502B] block mb-2 font-mono">
                  Institutional Updates & Bulletins
                </span>
                {isSubscribed ? (
                  <div className="text-xs text-emerald-400 font-medium py-2">
                    Thank you for subscribing to CIT notifications.
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md">
                    <input
                      type="email"
                      value={subscribedEmail}
                      onChange={(e) => setSubscribedEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="px-3.5 py-2 rounded-lg bg-[#F3ECE2]/10 border border-[#F3ECE2]/20 text-xs text-[#F3ECE2] placeholder-[#F3ECE2]/40 focus:outline-none focus:border-[#A9502B] flex-1"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#A9502B] hover:bg-[#8f3f1e] text-[#F3ECE2] text-xs font-semibold tracking-wider uppercase transition-colors shrink-0"
                    >
                      Subscribe
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Links Column 1: About */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest font-bold text-[#A9502B] font-mono">
                About CIT
              </h4>
              <ul className="text-xs text-[#F3ECE2]/70 space-y-2 font-sans">
                <li><a href="#about" className="hover:text-[#F3ECE2] transition-colors">Vision & Mission</a></li>
                <li><a href="#about" className="hover:text-[#F3ECE2] transition-colors">Institutional Leadership</a></li>
                <li><a href="#campus-interiors" className="hover:text-[#F3ECE2] transition-colors">Campus Interiors</a></li>
                <li><a href="#facilities" className="hover:text-[#F3ECE2] transition-colors">Campus Architecture</a></li>
                <li><a href="#location" className="hover:text-[#F3ECE2] transition-colors">Accreditation Principles</a></li>
              </ul>
            </div>

            {/* Links Column 2: Academics */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest font-bold text-[#A9502B] font-mono">
                Departments
              </h4>
              <ul className="text-xs text-[#F3ECE2]/70 space-y-2 font-sans">
                <li><a href="#departments" className="hover:text-[#F3ECE2] transition-colors">Computer Science</a></li>
                <li><a href="#departments" className="hover:text-[#F3ECE2] transition-colors">Electronics & Comm.</a></li>
                <li><a href="#departments" className="hover:text-[#F3ECE2] transition-colors">Electrical Engineering</a></li>
                <li><a href="#departments" className="hover:text-[#F3ECE2] transition-colors">Mechanical Engineering</a></li>
                <li><a href="#facilities" className="hover:text-[#F3ECE2] transition-colors">Research Laboratories</a></li>
              </ul>
            </div>

            {/* Links Column 3: Student Resources */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest font-bold text-[#A9502B] font-mono">
                Resources
              </h4>
              <ul className="text-xs text-[#F3ECE2]/70 space-y-2 font-sans">
                <li><a href="#admissions" className="hover:text-[#F3ECE2] transition-colors">Admissions Desk</a></li>
                <li><button onClick={userRole ? onNavigateApp : onNavigateLogin} className="hover:text-[#F3ECE2] transition-colors">Portal Login</button></li>
                <li><a href="#campus-life" className="hover:text-[#F3ECE2] transition-colors">Campus Life & Clubs</a></li>
                <li><a href="#location" className="hover:text-[#F3ECE2] transition-colors">Contact Directory</a></li>
              </ul>
            </div>
          </FadeContent>

          {/* Bottom Copyright */}
          <FadeContent threshold={0.15} delay={0.1}>
            <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#F3ECE2]/50 gap-4">
            <div>
              &copy; 2026 Chilika Institute of Technology. All rights reserved.
            </div>
            <div className="flex gap-4 sm:gap-6 text-[11px]">
              <button onClick={() => setModalType('privacy')} className="hover:text-[#F3ECE2] transition-colors">Privacy Policy</button>
              <button onClick={() => setModalType('terms')} className="hover:text-[#F3ECE2] transition-colors">Terms of Service</button>
              <button onClick={() => setModalType('ethics')} className="hover:text-[#F3ECE2] transition-colors">Academic Ethics</button>
            </div>
          </div>

          {/* Giant Typographic Wordmark in subtle background */}
          <div className="mt-6 sm:mt-8 text-center pointer-events-none select-none overflow-hidden">
            <span className="font-serif text-[75px] xs:text-[100px] sm:text-[140px] md:text-[180px] font-bold tracking-widest text-[#F3ECE2]/[0.03] leading-none block">
              CIT
            </span>
          </div>
          </FadeContent>
        </div>
      </footer>

      {/* 11. INFORMATIONAL MODAL (For legal/privacy policies) */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FBF8F3] text-[#1E1915] rounded-2xl border border-[#1E1915]/15 max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-[#5B5048] hover:text-[#1E1915] hover:bg-[#1E1915]/5 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/img/cit/cit-logo.png"
                  alt="CIT Seal"
                  className="h-5 w-5 rounded-full object-cover shrink-0"
                />
                <div className="text-[10px] uppercase tracking-widest font-mono text-[#A9502B] font-bold">
                  Institutional Policy &middot; CIT
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1915]">
                {modalType === 'privacy' ? 'Privacy & Data Protection' : modalType === 'terms' ? 'Terms of Institutional Service' : 'Academic Ethics & Integrity'}
              </h3>
              <p className="text-xs text-[#5B5048] leading-relaxed">
                Chilika Institute of Technology operates in full adherence to transparent educational ethics, safeguarding personal student information, institutional research intellectual property, and community safety.
              </p>
              <button
                onClick={() => setModalType(null)}
                className="w-full py-2.5 rounded-full bg-[#1E1915] text-[#F3ECE2] text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
