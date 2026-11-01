import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  X,
  Layers,
  Sparkles,
  Lightbulb,
  Maximize2,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { FadeContent } from './FadeContent';

export interface InteriorSpace {
  id: string;
  name: string;
  category: 'Public Architecture' | 'Academic Spaces' | 'Advanced Research' | 'Collaboration & Ideation';
  image: string;
  shortDesc: string;
  concept: string;
  materials: string[];
  lighting: string;
  highlights: string[];
}

export const INTERIOR_SPACES: InteriorSpace[] = [
  {
    id: 'lobby',
    name: 'Main Reception & Entrance Lobby',
    category: 'Public Architecture',
    image: '/img/cit/interiors/lobby.webp',
    shortDesc: 'Double-height greeting pavilion featuring hand-chiseled Chilika sandstone walls, warm fluted oak, and floor-to-ceiling perimeter glazing.',
    concept: 'Conceived as an imposing yet warm institutional threshold that welcomes students, scholars, and visiting dignitaries with abundant natural daylight and restrained material honesty.',
    materials: ['Local Khordha Sandstone', 'Fluted European Oak', 'Honed Beige Marble Flooring', 'Low-Iron Structural Glazing', 'Brushed Bronze Accents'],
    lighting: '3000K warm indirect cove lighting integrated within ceiling recesses, complemented by perimeter daylight harvesting sensors.',
    highlights: [
      'Double-height 7.5m soaring volumetric lobby',
      'Sandstone feature wall with integrated CIT bronze emblem',
      'Barrier-free accessible reception and security concourse',
      'Acoustic ceiling baffles ensuring tranquil sound levels'
    ]
  },
  {
    id: 'smart-classroom',
    name: 'Modern Smart Classrooms',
    category: 'Academic Spaces',
    image: '/img/cit/interiors/smart-classroom.webp',
    shortDesc: 'Tiered pedagogical amphitheater with ergonomic swivel stations, synchronized 4K interactive presentation arrays, and natural daylighting.',
    concept: 'Engineered for active inquiry, sightline clarity, and acoustic damping to maximize lecture engagement, peer debate, and digital collaboration.',
    materials: ['Perforated Acoustic Timber Wall Cladding', 'Matte Charcoal Steel Framework', 'Solid Ash Tabletops', 'Recycled PET Upholstery'],
    lighting: 'Glare-free micro-prismatic linear LED luminaires calibrated for high CRI (>90) to prevent eye fatigue during intensive lecture blocks.',
    highlights: [
      '80-seat tiered curved layout with optimized sightlines',
      'Dual 86" interactive 4K multi-touch displays',
      'Integrated AC power and USB-C data ports at every student station',
      'Low-velocity displacement underfloor ventilation'
    ]
  },
  {
    id: 'library-interior',
    name: 'Central Library & Study Atrium',
    category: 'Academic Spaces',
    image: '/img/cit/interiors/library-interior.webp',
    shortDesc: 'Double-height scholarly sanctuary with floor-to-ceiling wooden stacks, individual focus carrels, collaborative reading lounges, and scenic window walls.',
    concept: 'Designed around the acoustic hierarchy of scholarship—transitioning seamlessly from collaborative open reading lounges on the lower concourse to silent study carrels on the upper mezzanine.',
    materials: ['Solid American Walnut Bookshelves', 'Acoustic Cork Flooring in Quiet Pods', 'Patinated Bronze Balustrades', 'Full-Grain Leather Reading Chairs'],
    lighting: 'Individual dimmable task lamps at each reading desk, paired with gentle ambient ceiling uplighting highlighting the architectural timber canopy.',
    highlights: [
      '45,000+ technical monograph & journal capacity',
      '12 bookable group research and seminar suites',
      'Ergonomic focus carrels with personal daylight control',
      'Automated RFID self-checkout and digital repository terminals'
    ]
  },
  {
    id: 'cse-lab',
    name: 'Computer Science & Engineering Lab',
    category: 'Advanced Research',
    image: '/img/cit/interiors/cse-lab.webp',
    shortDesc: 'High-performance computing studio featuring dual-monitor development workstations, concealed cable raceways, and collaborative sprint pods.',
    concept: 'An agile software and AI engineering environment combining deep individual computational capability with modular team ideation pods.',
    materials: ['Anti-Static ESD Vinyl Flooring', 'Acoustic Fabric Pinboards', 'Powder-Coated Aluminum Desk Frames', 'Acoustic Glass Partitions'],
    lighting: 'Dimmable 4000K neutral white task lighting with subtle deep academic blue architectural perimeter LED accents.',
    highlights: [
      'Dual 27" 4K HDR displays per development station',
      'Dedicated 10Gbps fiber backbone to campus GPU cluster',
      'Ergonomic multi-adjust mesh task seating',
      'Isolated noise-damped server simulation rack'
    ]
  },
  {
    id: 'ece-lab',
    name: 'Electronics & Communication Lab',
    category: 'Advanced Research',
    image: '/img/cit/interiors/ece-lab.webp',
    shortDesc: 'Precision microelectronics and telecommunications suite equipped with ESD-safe workbenches, digital storage oscilloscopes, and PCB prototyping stations.',
    concept: 'A functional, rigorously organized laboratory engineered for precision circuit synthesis, RF testing, and embedded silicon prototyping with absolute safety.',
    materials: ['Phenolic Resin Chemical-Resistant Work Surfaces', 'Static-Dissipative Grounded Mats', 'Industrial Steel Tool Cabinetry'],
    lighting: 'High-illuminance shadowless bench illumination (750 lux at work plane) with adjustable gooseneck inspection magnification lamps.',
    highlights: [
      'Individual point-of-use fume extraction arms for soldering stations',
      'Isolated clean power conditioning rails preventing noise interference',
      'High-bandwidth spectrum analyzers & arbitrary waveform generators',
      'Rapid PCB mechanical prototyping & milling enclosure'
    ]
  },
  {
    id: 'robotics-lab',
    name: 'Mechanical & Robotics Laboratory',
    category: 'Advanced Research',
    image: '/img/cit/interiors/robotics-lab.webp',
    shortDesc: 'Prototyping pavilion housing 6-axis industrial robotic arms, high-precision CNC routers, industrial 3D printers, and CAD modeling stations.',
    concept: 'An industrial-contemporary aesthetic blending polished concrete durability with high-precision digital fabrication and kinematic testing.',
    materials: ['Polished Sealed Concrete Flooring', 'Heavy Modular Steel Tables', 'Exposed Architectural Ductwork', 'Safety-Interlocked Acrylic Shields'],
    lighting: 'High-bay diffused LED industrial luminaires with high-contrast safety illumination around active robotic work envelopes.',
    highlights: [
      'Overhead utility drops for pneumatic air and 3-phase power',
      '6-axis articulated industrial robotic arms with safety perimeter fences',
      'Enclosed SLS & FDM additive manufacturing suite',
      'Heavy-duty material testing rigs & dynamic balancing benches'
    ]
  },
  {
    id: 'auditorium',
    name: 'Auditorium & Plenary Hall',
    category: 'Public Architecture',
    image: '/img/cit/interiors/auditorium.webp',
    shortDesc: '500-seat plenary hall with stepped continental seating, acoustically calibrated faceted wall cladding, and an ultra-wide theatrical LED backdrop.',
    concept: 'A ceremonial space designed for institutional convocations, international technical symposiums, research conferences, and cultural performances.',
    materials: ['Micro-Perforated Acoustic Timber Paneling', 'Plush Acoustic Wool-Blend Seating', 'Dark Walnut Stage Decking', 'Concealed Sound Diffusers'],
    lighting: 'Fully programmable DMX architectural scene lighting, warm step-edge pathway illumination, and motorized stage spotlight arrays.',
    highlights: [
      '500-seat sightline-optimized continental stepped configuration',
      'Dolby Atmos spatial surround sound system with acoustic RT60 tuning',
      'Ultra-wide P1.8 fine-pitch theatrical LED presentation wall',
      'Wheelchair-accessible stage lift & simultaneous translation booths'
    ]
  },
  {
    id: 'innovation-hub',
    name: 'Student Collaboration & Innovation Hub',
    category: 'Collaboration & Ideation',
    image: '/img/cit/interiors/innovation-hub.webp',
    shortDesc: 'Open-plan creative incubator with modular soft seating, writable magnetic glass partitions, breakout sprint tables, and prototype showcase displays.',
    concept: 'An unconstrained, energizing space where interdisciplinary student founders brainstorm, test prototypes, and pitch community-driven engineering solutions.',
    materials: ['Light Birch Plywood Tiered Bleachers', 'Writable Magnetic Glassboards', 'Acoustic Felt Hanging Screens', 'Biophilic Indoor Planters'],
    lighting: 'Playful hanging geometric pendant lights paired with warm perimeter coves that create an informal, creative startup atmosphere.',
    highlights: [
      'Movable acoustic mobile partitions for flexible sprint zones',
      '75" wireless casting presentation displays',
      'Rapid prototype assembly workbench & hardware loan closet',
      'High-density floor and table charging nodes'
    ]
  },
  {
    id: 'faculty-offices',
    name: 'Faculty & Department Offices',
    category: 'Academic Spaces',
    image: '/img/cit/interiors/faculty-offices.webp',
    shortDesc: 'Modern academic workspaces featuring private research consultation suites, frosted glass meeting rooms, and collaborative faculty lounges.',
    concept: 'Striking a balance between deep scholarly contemplation, student mentoring privacy, and collegial department dialogue across engineering branches.',
    materials: ['Natural White Oak Veneer Desks', 'Acoustic Fabric Pinboards', 'Double-Glazed Acoustic Partitions (STC 45)', 'Neutral Linen Drapery'],
    lighting: 'Indirect perimeter cove lighting combined with personalized desk luminaires and occupancy sensor controls.',
    highlights: [
      'Private acoustic-isolated student mentoring consultation nooks',
      'Integrated video-conferencing meeting suites',
      'Secure thesis, research data, and departmental monograph archive',
      'Warm collaborative faculty lounge with pantry facilities'
    ]
  },
  {
    id: 'student-commons',
    name: 'Student Common Area & Wellness Lounge',
    category: 'Collaboration & Ideation',
    image: '/img/cit/interiors/student-commons.webp',
    shortDesc: 'Relaxed social commons with warm timber picnic tables, conversational banquette seating, biophilic courtyards, and device charging stations.',
    concept: 'A welcoming domestic-scale respite where students decompress between rigorous technical lab sessions and connect across cohorts.',
    materials: ['Terrazzo and Warm Oak Flooring', 'Woven Cane Privacy Screens', 'Terracotta Tile Planters', 'Textured Wool Upholstery in Earth Tones'],
    lighting: 'Warm 2700K ambient illumination with organic ceramic wall sconces and skylights infusing filtered natural daylight.',
    highlights: [
      'Device charging counters and secure student day lockers',
      'Fresh drinking water and refreshment counter',
      'Informal discussion alcoves with acoustic privacy backs',
      'Indoor air-purifying plant installations and lake view lounge'
    ]
  }
];

export const CitInteriorsSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeSpace, setActiveSpace] = useState<InteriorSpace | null>(null);
  const [showAllSpaces, setShowAllSpaces] = useState(false);

  // Keyboard navigation for modal (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeSpace) return;
      if (e.key === 'Escape') {
        setActiveSpace(null);
      } else if (e.key === 'ArrowRight') {
        const currentIndex = INTERIOR_SPACES.findIndex((s) => s.id === activeSpace.id);
        const nextIndex = (currentIndex + 1) % INTERIOR_SPACES.length;
        setActiveSpace(INTERIOR_SPACES[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = INTERIOR_SPACES.findIndex((s) => s.id === activeSpace.id);
        const prevIndex = (currentIndex - 1 + INTERIOR_SPACES.length) % INTERIOR_SPACES.length;
        setActiveSpace(INTERIOR_SPACES[prevIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSpace]);

  const categories = ['All', 'Academic Spaces', 'Advanced Research', 'Collaboration & Ideation', 'Public Architecture'];

  const filteredSpaces = selectedCategory === 'All'
    ? INTERIOR_SPACES
    : INTERIOR_SPACES.filter((s) => s.category === selectedCategory);

  const displayedSpaces = showAllSpaces ? filteredSpaces : filteredSpaces.slice(0, 6);

  return (
    <section id="campus-interiors" className="py-20 sm:py-28 md:py-32 bg-[#F3ECE2] border-t border-[#1E1915]/10 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <FadeContent threshold={0.15}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A9502B]/10 border border-[#A9502B]/20 text-[#A9502B] text-[10px] font-mono uppercase font-bold tracking-widest">
                <img
                  src="/img/cit/cit-logo.png"
                  alt="CIT Seal"
                  className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                />
                <span>PROPOSED CIT ARCHITECTURAL INTERIORS</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E1915] tracking-tight leading-[1.1]">
                Spaces That Inspire Possibilities.
              </h2>
              <p className="text-[#5B5048] text-sm sm:text-base font-sans leading-relaxed">
                Thoughtfully designed environments where learning, research, creativity and collaboration come together. Built on warm minimalism, natural sandstone, fluted oak, and abundant daylight.
              </p>
            </div>

            {/* Quick Counter */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#5B5048] bg-[#FBF8F3] px-3.5 py-2 rounded-xl border border-[#1E1915]/10">
              <Layers className="h-4 w-4 text-[#A9502B]" />
              <span>10 Architectural Concepts</span>
            </div>
          </div>
        </FadeContent>

        {/* Category Filter Pills */}
        <FadeContent threshold={0.15} delay={0.08}>
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 sm:mb-10 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-sans font-semibold tracking-wide transition-all duration-200 border ${
                    isSelected
                      ? 'bg-[#243C50] text-[#F3ECE2] border-[#243C50] shadow-sm'
                      : 'bg-[#FBF8F3] text-[#5B5048] border-[#1E1915]/10 hover:border-[#1E1915]/25 hover:text-[#1E1915]'
                  }`}
                >
                  {cat === 'All' ? 'All Spaces (10)' : cat}
                </button>
              );
            })}
          </div>
        </FadeContent>

        {/* Asymmetric / Responsive Gallery Grid */}
        <FadeContent threshold={0.15} stagger={0.12} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {displayedSpaces.map((space, idx) => {
            // Give subtle asymmetric prominence to select cards on large screens
            const isFeatured = idx === 0 && selectedCategory === 'All';
            return (
              <div
                key={space.id}
                onClick={() => setActiveSpace(space)}
                className={`group rounded-2xl bg-[#FBF8F3] border border-[#1E1915]/10 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-400 cursor-pointer flex flex-col justify-between ${
                  isFeatured ? 'md:col-span-2 lg:col-span-2' : ''
                }`}
              >
                {/* Image Container with smooth zoom */}
                <div className={`relative overflow-hidden bg-slate-200 ${isFeatured ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
                  <img
                    src={space.image}
                    alt={space.name}
                    className="w-full h-full object-cover transition-transform duration-700 cit-ease-out group-hover:scale-106"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Category Badge */}
                  <span className="absolute top-3.5 left-3.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#191513]/75 text-[#F3ECE2] backdrop-blur-md border border-[#F3ECE2]/20">
                    {space.category}
                  </span>

                  {/* Expand icon pill on hover */}
                  <div className="absolute bottom-3.5 right-3.5 p-2 rounded-full bg-[#F3ECE2]/90 text-[#1E1915] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1E1915] group-hover:text-[#A9502B] transition-colors leading-snug">
                      {space.name}
                    </h3>
                    <p className="text-xs text-[#5B5048] leading-relaxed font-sans line-clamp-2">
                      {space.shortDesc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1E1915]/5 flex items-center justify-between text-xs font-semibold text-[#A9502B]">
                    <span>Explore Concept Details</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </FadeContent>

        {/* Explore All Spaces Toggle */}
        {filteredSpaces.length > 6 && (
          <div className="mt-10 sm:mt-12 text-center">
            <button
              onClick={() => setShowAllSpaces(!showAllSpaces)}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#243C50] hover:bg-[#1a2c3a] text-[#F3ECE2] text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{showAllSpaces ? 'Show Less Spaces' : `Explore All ${filteredSpaces.length} Interior Spaces`}</span>
              <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${showAllSpaces ? 'rotate-90' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* 5. INTERIOR DETAIL MODAL EXPERIENCE */}
      {activeSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-250 overflow-y-auto">
          <div className="bg-[#FBF8F3] text-[#1E1915] rounded-2xl border border-[#1E1915]/15 max-w-4xl w-full overflow-hidden shadow-2xl relative my-auto animate-in zoom-in-95 duration-250">
            {/* Modal Header & Close */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-black/40">
              <img
                src={activeSpace.image}
                alt={activeSpace.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#191513]/90 via-[#191513]/30 to-transparent" />

              {/* Top Controls */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-[#191513]/70 backdrop-blur-md border border-white/20">
                  {activeSpace.category} &middot; CIT Interior Design Concept
                </span>
                <button
                  onClick={() => setActiveSpace(null)}
                  className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors focus:outline-none"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Bottom Title on Image */}
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
                <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#F3ECE2]">
                  {activeSpace.name}
                </h3>
              </div>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Concept Paragraph */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#A9502B]">
                  ARCHITECTURAL CONCEPT
                </div>
                <p className="text-sm sm:text-base text-[#5B5048] font-sans leading-relaxed">
                  {activeSpace.concept}
                </p>
              </div>

              {/* Three Detail Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Materials & Finishes */}
                <div className="p-4 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#1E1915]">
                    <Compass className="h-4 w-4 text-[#A9502B]" />
                    <span>Materials & Finishes</span>
                  </div>
                  <ul className="text-xs text-[#5B5048] space-y-1 font-sans">
                    {activeSpace.materials.map((m) => (
                      <li key={m} className="flex items-start gap-1.5">
                        <span className="text-[#A9502B]">&bull;</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lighting Concept */}
                <div className="p-4 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#1E1915]">
                    <Lightbulb className="h-4 w-4 text-[#243C50]" />
                    <span>Lighting Concept</span>
                  </div>
                  <p className="text-xs text-[#5B5048] font-sans leading-relaxed">
                    {activeSpace.lighting}
                  </p>
                </div>

                {/* Functional Highlights */}
                <div className="p-4 rounded-xl bg-[#F3ECE2] border border-[#1E1915]/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#1E1915]">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>Functional Highlights</span>
                  </div>
                  <ul className="text-xs text-[#5B5048] space-y-1 font-sans">
                    {activeSpace.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-1.5">
                        <span className="text-emerald-600">&bull;</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 sm:px-8 py-4 bg-[#F3ECE2] border-t border-[#1E1915]/10 flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#5B5048]">
                Press &larr; / &rarr; or Esc to navigate
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const currentIndex = INTERIOR_SPACES.findIndex((s) => s.id === activeSpace.id);
                    const prevIndex = (currentIndex - 1 + INTERIOR_SPACES.length) % INTERIOR_SPACES.length;
                    setActiveSpace(INTERIOR_SPACES[prevIndex]);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#1E1915]/20 hover:border-[#A9502B] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => {
                    const currentIndex = INTERIOR_SPACES.findIndex((s) => s.id === activeSpace.id);
                    const nextIndex = (currentIndex + 1) % INTERIOR_SPACES.length;
                    setActiveSpace(INTERIOR_SPACES[nextIndex]);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#1E1915]/20 hover:border-[#A9502B] text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setActiveSpace(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#1E1915] text-[#F3ECE2] text-xs font-semibold hover:bg-black transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

