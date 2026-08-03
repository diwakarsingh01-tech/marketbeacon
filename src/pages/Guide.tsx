import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, BarChart3, BookOpen, Brain, Compass,
  GraduationCap, Home, Play, Settings, Target,
  Wallet, Zap, Menu, X, ArrowUp,
  CheckCircle2, Layers, Search, LineChart, ListOrdered,
  Flag, Route, Star, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { useTour } from '../context/TourContext';

// ── Types ──────────────────────────────────────────────────────────────────

interface GuideStep {
  id: string;
  title: string;
  description: string;
  menuPath: string;
  icon: any;
  action: string;
  phase: 'discover' | 'analyze' | 'execute' | 'learn';
}

interface PhaseMeta {
  key: GuideStep['phase'];
  label: string;
  icon: any;
  color: string;
  subtitle: string;
}

const PHASES: PhaseMeta[] = [
  { key: 'discover', label: 'Discover', icon: Search, color: 'emerald', subtitle: 'Find opportunities' },
  { key: 'analyze', label: 'Analyze', icon: LineChart, color: 'blue', subtitle: 'Validate signals' },
  { key: 'execute', label: 'Execute', icon: Layers, color: 'purple', subtitle: 'Build & trade' },
  { key: 'learn', label: 'Learn', icon: GraduationCap, color: 'amber', subtitle: 'Master the craft' },
];

const PHASE_COLORS: Record<string, { border: string; bg: string; text: string; badge: string; gradient: string; glow: string }> = {
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', gradient: 'from-emerald-500/20 via-transparent to-transparent', glow: 'shadow-emerald-500/10' },
  blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', gradient: 'from-blue-500/20 via-transparent to-transparent', glow: 'shadow-blue-500/10' },
  purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', gradient: 'from-purple-500/20 via-transparent to-transparent', glow: 'shadow-purple-500/10' },
  amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', gradient: 'from-amber-500/20 via-transparent to-transparent', glow: 'shadow-amber-500/10' },
};

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'screener',
    title: 'Discover Stocks',
    menuPath: 'Screener — Stock Screener',
    icon: Compass,
    action: 'Filter by sector, market cap, price, volume',
    description: 'Use the Stock Screener to find stocks that match your thesis. Apply filters for sector, market capitalization, price range, and volume to build an initial watchlist.',
    phase: 'discover',
  },
  {
    id: 'alpha-hub',
    title: 'Analyze with Institutional Signals',
    menuPath: 'Alpha Hub — Main Terminal',
    icon: Target,
    action: 'Review signals, strategy feedback, and scores',
    description: 'Return to Alpha Hub to see institutional strategy signals and validation on your shortlisted names. Each stock gets a strategy score and signal type.',
    phase: 'analyze',
  },
  {
    id: 'charts',
    title: 'Technical Charting',
    menuPath: 'Chart Terminal — Technical Charting',
    icon: BarChart3,
    action: 'Open chart, check trend and support/resistance',
    description: 'For any stock in your watchlist, open the Chart Terminal to view technical set-ups. Check trend direction, key support/resistance levels, and candlestick patterns.',
    phase: 'analyze',
  },
  {
    id: 'manager',
    title: 'Build Your Portfolio',
    menuPath: 'Manager — Wealth Tracking',
    icon: Wallet,
    action: 'Add stocks, allocate capital, set positions',
    description: 'Convert your shortlisted stocks into a structured portfolio. Add each stock, allocate capital per position, and track current value.',
    phase: 'execute',
  },
  {
    id: 'journal',
    title: 'Document Every Trade',
    menuPath: 'Journal — Trade Ledger',
    icon: BookOpen,
    action: 'Record buy/sell, quantity, price, and reasoning',
    description: 'Go to the Trade Ledger to record every trade and decision. Note buy or sell, quantity, price, and your reasoning. This becomes your institutional-grade trade diary.',
    phase: 'execute',
  },
  {
    id: 'course',
    title: 'Learn the Framework',
    menuPath: 'Education — Video Course',
    icon: GraduationCap,
    action: 'Watch core modules on risk, allocation, and filtration',
    description: 'If new to institutional strategy, watch the core video modules that explain how the console thinks about risk, allocation, and filtration.',
    phase: 'learn',
  },
  {
    id: 'ai',
    title: 'Use AI Strategy Assistance',
    menuPath: 'BeaconAI — Strategy AI',
    icon: Brain,
    action: 'Ask specific questions like evaluate portfolio or suggest filters',
    description: 'When ready for AI support, open the Strategy AI assistant and ask specific questions like "help me evaluate this portfolio" or "suggest filters for swing trading mid-cap stocks."',
    phase: 'learn',
  },
  {
    id: 'settings',
    title: 'Manage Subscription & Settings',
    menuPath: 'Account — License Desk',
    icon: Settings,
    action: 'Access plans, profile, and tutorials',
    description: 'Under Account, use License Desk to manage your access and plans. Use Settings for profile updates. Visit Help for tutorials and platform guidance.',
    phase: 'learn',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function groupByPhase(steps: GuideStep[]): { phase: PhaseMeta; steps: GuideStep[] }[] {
  return PHASES.map(phase => ({
    phase,
    steps: steps.filter(s => s.phase === phase.key),
  })).filter(g => g.steps.length > 0);
}

function useScrollSpy(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] || '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}

function useReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return progress;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const GuidePage: React.FC = () => {
  const { startTour } = useTour();
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const grouped = groupByPhase(GUIDE_STEPS);
  const allIds = GUIDE_STEPS.map(s => s.id);
  const activeId = useScrollSpy(allIds);
  const readingProgress = useReadingProgress();

  const tocRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileTocOpen(false);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = () => { if (mq.matches) setMobileTocOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <>
      <SEO
        title="Guide — MarketBeacon Pro"
        description="Step-by-step instructions on how to use MarketBeacon Pro for discovering stocks, building portfolios, and tracking performance."
        url="/guide"
      />

      {/* ── Reading Progress Bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-[var(--bg-primary)] z-[60]">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="min-h-screen bg-[#020617] text-[var(--text-primary)]">

        {/* ── Top Bar ── */}
        <div className="border-b border-[var(--border-primary)] bg-[#0a0f1e]/80 backdrop-blur-sm sticky top-20 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Home className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider hidden sm:inline">Home</span>
              </Link>
              <span className="text-[var(--text-muted)] text-xs">/</span>
              <span className="text-xs font-bold text-[var(--accent-amber)] uppercase tracking-wider">Guide</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all"
                aria-label={mobileTocOpen ? 'Close navigation' : 'Open navigation'}
              >
                {mobileTocOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <button
                onClick={() => startTour(0)}
                className="text-xs font-bold text-[var(--accent-amber)] hover:text-[var(--signal-buy)] uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <Play className="h-3 w-3 hidden sm:block" />
                <span className="hidden sm:inline">Start Interactive Tour</span>
                <span className="sm:hidden">Tour</span>
              </button>
            </div>
          </div>

          {/* Mobile TOC Dropdown */}
          <AnimatePresence>
            {mobileTocOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden border-t border-[var(--border-primary)] bg-[#0a0f1e]/95 backdrop-blur-md overflow-hidden"
              >
                <div className="px-4 py-3 space-y-2 max-h-[50vh] overflow-y-auto">
                  {grouped.map((group) => {
                    const colors = PHASE_COLORS[group.phase.color];
                    return (
                      <div key={group.phase.key}>
                        <div className="flex items-center gap-1.5 px-3 py-1 mb-0.5">
                          <group.phase.icon className={`h-2.5 w-2.5 ${colors.text}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${colors.text}`}>
                            {group.phase.label}
                          </span>
                        </div>
                        {group.steps.map((step) => (
                          <button
                            key={step.id}
                            onClick={() => scrollToSection(step.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${
                              activeId === step.id
                                ? 'bg-[var(--bg-tertiary)] text-[var(--accent-amber)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[8px] font-bold shrink-0">
                              {GUIDE_STEPS.indexOf(step) + 1}
                            </span>
                            {step.title}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
          <div className="flex gap-8 lg:gap-12">

            {/* ═══ DESKTOP SIDEBAR TOC ═══ */}
            <aside
              ref={tocRef}
              className="hidden lg:block w-56 xl:w-60 shrink-0"
            >
              <nav className="sticky top-36 space-y-1">
                <div className="px-3 py-2 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Route className="h-4 w-4 text-[var(--accent-amber)]" />
                    <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">On This Page</span>
                  </div>
                  <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 transition-all duration-300 rounded-full"
                      style={{ width: `${readingProgress}%` }}
                    />
                  </div>
                </div>

                {grouped.map((group) => {
                  const colors = PHASE_COLORS[group.phase.color];
                  return (
                    <div key={group.phase.key} className="mb-3">
                      <div className="flex items-center gap-1.5 px-3 py-1">
                        <group.phase.icon className={`h-2.5 w-2.5 ${colors.text}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${colors.text}`}>
                          {group.phase.label}
                        </span>
                      </div>
                      {group.steps.map((step) => {
                        const idx = GUIDE_STEPS.indexOf(step);
                        return (
                          <button
                            key={step.id}
                            onClick={() => scrollToSection(step.id)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all ${
                              activeId === step.id
                                ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                              activeId === step.id
                                ? 'bg-[var(--accent-amber)]/20 text-[var(--accent-amber)]'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="text-[11px] font-medium leading-tight truncate">{step.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                <div className="pt-3 px-3">
                  <button
                    onClick={() => startTour(0)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 rounded-lg text-[10px] font-bold text-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/20 transition-all"
                  >
                    <Play className="h-3 w-3" />
                    Start Tour
                  </button>
                </div>
              </nav>
            </aside>

            {/* ═══ MAIN CONTENT ═══ */}
            <main className="flex-1 min-w-0">

              {/* ── Hero ── */}
              <section className="relative overflow-hidden rounded-2xl mb-8 lg:mb-10">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-amber)]/5 via-[var(--bg-primary)] to-emerald-500/5" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
                
                <div className="relative px-6 py-8 lg:py-12 text-center space-y-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-14 h-14 mx-auto bg-gradient-to-br from-[var(--accent-amber)]/20 to-emerald-500/20 border border-[var(--accent-amber)]/30 rounded-2xl flex items-center justify-center shadow-xl shadow-[var(--accent-amber)]/5"
                  >
                    <Route className="h-7 w-7 text-[var(--accent-amber)]" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
                      How to Use{' '}
                      <span className="bg-gradient-to-r from-[var(--accent-amber)] to-emerald-400 bg-clip-text text-transparent">
                        MarketBeacon Pro
                      </span>
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed mt-3">
                      From stock idea to managed portfolio — a clear 8-step path for every user.
                    </p>
                  </motion.div>

                  {/* Phase quick-links */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex flex-wrap items-center justify-center gap-2 pt-1"
                  >
                    {PHASES.map((p) => {
                      const colors = PHASE_COLORS[p.color];
                      return (
                        <button
                          key={p.key}
                          onClick={() => scrollToSection(GUIDE_STEPS.find(s => s.phase === p.key)?.id || '')}
                          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.bg} border ${colors.border} hover:scale-105 transition-all cursor-pointer`}
                        >
                          <p.icon className={`h-3 w-3 ${colors.text}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                </div>
              </section>

              {/* ── Interactive Tour CTA (mobile prominent) ── */}
              <section className="lg:hidden mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-[var(--accent-amber)]/10 to-emerald-500/10 border border-[var(--accent-amber)]/30 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--accent-amber)]/20 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-[var(--accent-amber)]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-wider text-[var(--accent-amber)]">Interactive Investment Tour</h2>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Walk through the platform page-by-page</p>
                    </div>
                  </div>
                  <button
                    onClick={() => startTour(0)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/80 text-[#020617] rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-95"
                  >
                    <Play className="h-4 w-4" />
                    Start Investment Tour
                  </button>
                </motion.div>
              </section>

              {/* ── Phase & Step Content ── */}
              <div className="space-y-10 lg:space-y-14">
                {grouped.map((group, groupIdx) => {
                  const colors = PHASE_COLORS[group.phase.color];
                  const Icon = group.phase.icon;
                  return (
                    <section key={group.phase.key} className="space-y-5">
                      {/* Phase header with gradient */}
                      <div className={`relative overflow-hidden rounded-2xl ${colors.bg} border ${colors.border} p-5 lg:p-6`}>
                        <div className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-50`} />
                        <div className="relative flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
                            <Icon className={`h-6 w-6 ${colors.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h2 className={`text-sm lg:text-base font-black uppercase tracking-[0.2em] ${colors.text}`}>
                                Phase {groupIdx + 1}: {group.phase.label}
                              </h2>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${colors.badge}`}>
                                {group.steps.length} step{group.steps.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">{group.phase.subtitle}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {group.steps.map((step, localIdx) => {
                          const globalIdx = GUIDE_STEPS.indexOf(step);
                          const StepIcon = step.icon;
                          const isActive = activeId === step.id;
                          return (
                            <motion.div
                              key={step.id}
                              id={step.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: localIdx * 0.08 }}
                              className={`scroll-mt-24 transition-all duration-300 ${isActive ? 'scale-[1.01]' : ''}`}
                            >
                              <div className={`relative bg-[var(--bg-secondary)] border ${isActive ? 'border-[var(--accent-amber)]/50 shadow-lg shadow-[var(--accent-amber)]/5' : 'border-[var(--border-primary)] hover:border-[var(--accent-amber)]/30'} rounded-xl transition-all duration-300 overflow-hidden group`}>
                                {/* Gradient accent line */}
                                <div className={`h-1 w-full bg-gradient-to-r ${colors.text.replace('text-', 'from-')} to-transparent`} />
                                
                                {/* Step number badge */}
                                <div className="absolute top-3 right-3">
                                  <span className={`w-6 h-6 rounded-full ${colors.bg} border ${colors.border} text-[9px] font-bold flex items-center justify-center ${colors.text}`}>
                                    {globalIdx + 1}
                                  </span>
                                </div>

                                <div className="p-5 lg:p-6">
                                  <div className="flex items-start gap-4">
                                    <div className={`relative w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                      <StepIcon className={`h-6 w-6 ${colors.text}`} />
                                    </div>

                                    <div className="flex-1 min-w-0 pr-6">
                                      <h3 className="text-base lg:text-lg font-black text-[var(--text-primary)] mb-2">
                                        {step.title}
                                      </h3>
                                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                                        {step.description}
                                      </p>

                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`text-[9px] lg:text-[10px] font-bold ${colors.badge} px-2.5 py-1 rounded-full border flex items-center gap-1`}>
                                          <Flag className="h-2.5 w-2.5" />
                                          {step.menuPath}
                                        </span>
                                        <span className="text-[9px] lg:text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                          <CheckCircle2 className="h-2.5 w-2.5" />
                                          {step.action}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Phase connector (not for last phase) */}
                      {groupIdx < grouped.length - 1 && (
                        <div className="flex items-center justify-center py-4">
                          <div className="w-px h-8 bg-gradient-to-b from-[var(--border-primary)] to-transparent" />
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              {/* ── Quick Reference Cards ── */}
              <section className="space-y-6 pt-8 lg:pt-12">
                <h2 className="text-base lg:text-lg font-black uppercase tracking-wider flex items-center gap-2">
                  <Star className="h-4 w-4 text-[var(--accent-amber)]" />
                  Quick Reference
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 space-y-3 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Find Opportunities</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" /> Use the Stock Screener to filter by fundamentals</li>
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" /> Apply sector, market cap, and volume filters</li>
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" /> Bookmark candidates to your watchlist</li>
                    </ul>
                  </div>

                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 space-y-3 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Analyze & Validate</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" /> Alpha Hub shows institutional strategy signals</li>
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" /> Chart Terminal provides technical setup analysis</li>
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" /> Check support/resistance and trend direction</li>
                    </ul>
                  </div>

                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 space-y-3 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Build & Execute</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-purple-400 mt-0.5 shrink-0" /> Manager tracks positions and portfolio value</li>
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-purple-400 mt-0.5 shrink-0" /> Set position size and capital allocation</li>
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-purple-400 mt-0.5 shrink-0" /> Journal records every trade with reasoning</li>
                    </ul>
                  </div>

                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 space-y-3 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Learn & Improve</span>
                    </div>
                    <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" /> Video Course explains the institutional framework</li>
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" /> Strategy AI gives on-demand analysis help</li>
                      <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" /> License Desk manages your subscription & plans</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* ── Footer ── */}
              <footer className="border-t border-[var(--border-primary)] pt-6 mt-8 lg:mt-12">
                <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed max-w-lg mx-auto">
                  MarketBeacon Pro is an educational and mathematical analysis platform. It does not provide investment advice, stock recommendations, or financial guidance. All strategies and models are for informational purposes only. Users are solely responsible for their investment decisions. Consult a registered financial adviser before making any financial commitments.
                </p>
              </footer>

            </main>
          </div>
        </div>

        {/* ── Back to Top Button ── */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToTop}
              className="fixed bottom-6 right-6 z-50 w-11 h-11 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/80 text-[#020617] rounded-2xl shadow-2xl flex items-center justify-center transition-all active:scale-90"
              aria-label="Back to top"
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Floating Mobile TOC Indicator ── */}
        <div className="lg:hidden fixed bottom-6 left-6 z-50">
          <button
            onClick={() => setMobileTocOpen(true)}
            className="w-11 h-11 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-2xl shadow-2xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-all active:scale-90"
            aria-label="Open table of contents"
          >
            <ListOrdered className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
};

export default GuidePage;
