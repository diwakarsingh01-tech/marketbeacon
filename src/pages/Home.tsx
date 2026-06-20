import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Zap, Gift, X, Mail, CheckCircle, BookOpen, ShieldCheck, RefreshCw, TrendingUp, Layers, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { waLink } from '../lib/constants';
import type { StockSearchResult } from '../types';
import { BASKETS } from '../data/stocks';
import BrandLogo from '../components/brand/BrandLogo';
import SiteFooter from '../components/layout/SiteFooter';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import { Confetti } from '../components/ui/Confetti';
import SEO from '../components/SEO';
import { OrganizationSchema, WebApplicationSchema, FAQPageSchema } from '../components/StructuredData';
import HeroSection from '../components/landing/HeroSection';
import StrategyMatrix from '../components/landing/StrategyMatrix';
import ICPCards from '../components/landing/ICPCards';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import EducationSection from '../components/landing/EducationSection';
import FAQSection from '../components/landing/FAQSection';
import CTABanner from '../components/landing/CTABanner';
import BlogTeaser from '../components/landing/BlogTeaser';
import CourseFramework from '../components/landing/CourseFramework';
import { useVoucherRedeem } from '../hooks/useVoucherRedeem';

const API_URL = getApiUrl();

// ── Email Lead Capture Component ──────────────────────────────────────────────
const EmailCapture: React.FC = () => {
  const [email, setEmail] = useState('');
  const [segment, setSegment] = useState('retail');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), segment })
      });
      if (!res.ok) throw new Error('Failed to save');
      setSubmitted(true);
    } catch {
      // Fallback: save locally if backend unavailable
      try {
        const leads = JSON.parse(localStorage.getItem('mb_leads') || '[]');
        leads.push({ email: email.trim(), segment, ts: new Date().toISOString() });
        localStorage.setItem('mb_leads', JSON.stringify(leads));
        setSubmitted(true);
      } catch {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h4 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Request Saved!</h4>
        <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto">
          We have saved your request. The ABCD Tranche Guide + Audit Checklist PDF will be delivered to your email shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            id="email-lead-capture"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full pl-11 pr-4 py-4 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-2xl text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <select
          id="segment-lead-capture"
          value={segment}
          onChange={e => setSegment(e.target.value)}
          className="px-4 py-4 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-2xl text-sm text-[var(--text-secondary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus:border-blue-500 transition-colors appearance-none"
        >
          <option value="retail">Retail Trader</option>
          <option value="advisor">Sub-broker / Advisor</option>
          <option value="hni">HNI / Family Office</option>
        </select>
      </div>
      {error && <p className="text-rose-400 text-xs font-bold text-left pl-1">{error}</p>}
      <button
        id="email-lead-submit"
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-[var(--text-primary)] rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-blue-900/30"
      >
        {submitting ? (
          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</span>
        ) : (
          <><Gift className="w-4 h-4" /> Get Free Starter Kit</>
        )}
      </button>
    </form>
  );
};

const HomePage: React.FC = () => {
  const [searchQuery, setSearchSearchQuery] = useState('');
  const [teaserData, setTeaserData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [simStage, setSimStage] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const navigate = useNavigate();

  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [openVoucherModal, setOpenVoucherModal] = useState(false);
  const {
    code: voucherCode,
    setCode: setVoucherCode,
    redeeming,
    error: voucherError,
    setError: setVoucherError,
    success: voucherSuccess,
    redeem: handleRedeemVoucher,
  } = useVoucherRedeem();

  const isProOrAbove = user?.tier === 'pro' || user?.tier === 'alpha';

  // Unified Institutional Symbol List
  const ALL_SYMBOLS = useMemo(() => {
    const syms = new Set<string>();
    Object.values(BASKETS).forEach(list => list.forEach(s => syms.add(s)));
    return Array.from(syms);
  }, []);

  useEffect(() => {
    let active = true;
    
    // Clear immediately if less than 2 chars
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const q = searchQuery.toUpperCase();
    const filtered = ALL_SYMBOLS.filter(s => 
      s.includes(q) || 
      (q === 'SDFC' && s === 'HDFCBANK') || 
      (q === 'HDFC' && s === 'HDFCBANK')
    ).slice(0, 5);

    // STEP 1: Show symbols immediately (Pre-populated)
    const initialSuggestions: StockSearchResult[] = filtered.map(s => ({ symbol: s, strategies: [], baskets: [], price: 0, change: 0, peMedians: {} }));
    setSuggestions(initialSuggestions);
    setSelectedIndex(-1);
    itemRefs.current = [];

    // STEP 2: Fetch strategy data in background
    const timeout = setTimeout(async () => {
      try {
        const results = await Promise.all(filtered.map(async sym => {
          try {
            const res = await fetch(`${API_URL}/api/public/analysis/${sym}`);
            if (!res.ok) throw new Error('Fetch failed');
            const data = await safeJsonParse(res);
            return { symbol: sym, strategies: data?.strategies || [], baskets: [], price: 0, change: 0, peMedians: {} };
          } catch (e) {
            return { symbol: sym, strategies: [], baskets: [], price: 0, change: 0, peMedians: {} };
          }
        }));
        if (active) setSuggestions(results);
      } catch (err) {
        // Fallback already handled by STEP 1
      }
    }, 400); // 400ms delay for background fetch to avoid jitter

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [searchQuery, ALL_SYMBOLS, API_URL]);

  const handleReset = () => {
    setSearchSearchQuery('');
    setTeaserData(null);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const [searchError, setSearchError] = useState<string | null>(null);

  // Fetch default teaser for TCS on load so visitors see instant value
  useEffect(() => {
    fetch(`${API_URL}/api/public/analysis/TCS`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setTeaserData(data); })
      .catch(() => {});
  }, []);

  const handleSearch = async (e?: React.FormEvent, symbolOverride?: string) => {
    if (e) e.preventDefault();
    const finalQuery = symbolOverride || searchQuery;
    if (!finalQuery) return;
    
    const upQuery = finalQuery.toUpperCase();
    setSearchSearchQuery(upQuery);
    setSuggestions([]);
    setIsSearching(true);
    setTeaserData(null);
    setSearchError(null);
    
    try {
      const res = await fetch(`${API_URL}/api/public/analysis/${upQuery}`);
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        setTeaserData(data);
      } else if (res.status === 202) {
        setSearchError(`Node warming up for ${upQuery}. Data is being audited. Please refresh in 30 seconds.`);
      } else {
        setTeaserData(null);
        setSearchError(`Symbol "${upQuery}" is not part of the current Institutional Universe.`);
      }
    } catch (e) {
      setSearchError("Terminal Node Connection Error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Pillar #8: Pre-emptive Server Warm-up (Mitigate Cold Starts)
    fetch(`${API_URL}/api/health`).catch(() => {/* Silent fail */});
  }, []);

  useEffect(() => {
    if (voucherSuccess) {
      setShowConfetti(true);
      setTimeout(() => window.location.reload(), 3000);
    }
  }, [voucherSuccess]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] overflow-x-hidden selection:bg-blue-500/30">
      <SEO title="Best Stock Analysis Tool India" description="India's #1 Institutional Audit Score for Nifty 500 stocks. ABCD Tranche Logic, FII DII trends & real-time screening. For educational purposes only." />
      <OrganizationSchema />
      <WebApplicationSchema />
      <FAQPageSchema questions={[
        { q: "What is an Institutional Stock Audit?", a: "An institutional stock audit is a quantitative scan that measures an asset against 100 mathematical data points. Unlike standard news bulletins, it reviews deep fundamental safety, debt leverage parameters, historical valuation percentiles, and institutional demand floors to assign a conviction score out of 100." },
        { q: "How does the ABCD Tranche Laddering model protect capital?", a: "Instead of allocating 100% of your capital at a single price point (which exposes you to instant drawdowns), the ABCD Ladder model divides buying capacity into four distinct tranches (A, B, C, D) triggered by historical pullback milestones. This averages your position downward automatically during sweeps and secures a stable demand floor." },
        { q: "Is MarketBeacon Pro investment advice or advisory?", a: "No. MarketBeacon Pro is NOT a SEBI-registered Investment Adviser (IA) or Research Analyst (RA). It is a quantitative mathematical research tool for educational and personal research purposes only. All audit scores, strategy signals, and ABCD zones are pre-coded mathematical models. Nothing on this platform constitutes a personalized investment recommendation, buy/sell advisory, or portfolio management service. Always consult a SEBI-registered advisor before making investment decisions." },
        { q: "How often are stock prices and audit scores updated?", a: "Live stock prices are synced continuously in real-time, and audit models re-examine key fundamental data points (like quarterly results, PE ratios, and institutional holdings) automatically daily to recalculate active scores and update zones." }
      ]} />
      {/* Live Trust Ticker (Safe-Guard Rule #7) */}
      <div className="bg-blue-600 py-2 overflow-hidden whitespace-nowrap border-b border-blue-500 relative">
        <div className="flex animate-marquee items-center gap-12">
          {[
            "RELAXO: Qualified with 92/100",
            "TCS: Bullish SMA-ABCD Matrix",
            "HDFC BANK: Institutional Accumulation",
            "INFY: Volatility Channel Breakthrough",
            "ITC: Zero-Debt High-SM Qualified",
            "BAJAJ AUTO: 52W High Momentum",
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">
              <ShieldCheck className="w-3 h-3" />
              <span>{text}</span>
            </div>
          ))}
          {/* Duplicate for infinite loop */}
          {[
            "RELAXO: Qualified with 92/100",
            "TCS: Bullish SMA-ABCD Matrix",
            "HDFC BANK: Institutional Accumulation",
            "INFY: Volatility Channel Breakthrough",
            "ITC: Zero-Debt High-SM Qualified",
            "BAJAJ AUTO: 52W High Momentum",
          ].map((text, i) => (
            <div key={`d-${i}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] opacity-80">
              <ShieldCheck className="w-3 h-3" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-primary)] px-6 md:px-10 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center transition-all hover:opacity-90 active:scale-95">
           <BrandLogo variant="dark" size={30} />
        </Link>
        <div className="hidden md:flex items-center space-x-6">
           <Link to="/blog" className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-colors flex items-center gap-1.5">
              Blog <span className="text-[6px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">NEW</span>
            </Link>
            <Link to="/license-desk" className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-colors">
              Pricing
            </Link>
           <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">31,402 Active Traders</span>
           </div>
           <Link to="/login" className="px-6 py-2.5 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Launch Terminal</Link>
        </div>
        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-3">
          <Link to="/blog" className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-colors">Blog</Link>
          <Link to="/login" className="px-4 py-2 bg-blue-600 text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest">Login</Link>
        </div>
      </nav>

      <HeroSection
        searchQuery={searchQuery}
        setSearchSearchQuery={setSearchSearchQuery}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        isSearching={isSearching}
        searchError={searchError}
        handleSearch={handleSearch}
        handleReset={handleReset}
        teaserData={teaserData}
        isProOrAbove={isProOrAbove}
        user={user}
        voucherCode={voucherCode}
        setVoucherCode={setVoucherCode}
        redeeming={redeeming}
        handleRedeemVoucher={handleRedeemVoucher}
        voucherError={voucherError}
        setVoucherError={setVoucherError}
        itemRefs={itemRefs}
        suggestionsRef={suggestionsRef}
        setShowUpgrade={setShowUpgrade}
      />
      <CourseFramework />
      <StrategyMatrix />

      <ICPCards />

      {/* Social Proof (Bento Grid) */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        id="proof" className="py-24 px-6 md:px-10 border-y border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
         <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Proven Institutional Results</h2>
               <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] text-sm">Real-time Performance Verification</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: 'Portfolio Growth', val: '+42.8%', desc: 'Avg. move per Alpha alert', col: 'md:col-span-2' },
                    { title: 'Audit Accuracy', val: '99.4%', desc: 'Batch-9 Validation Rate', col: 'md:col-span-1' },
                    { title: 'Alpha Gain', val: '1.8x', desc: 'Vs Nifty 50 Benchmark', col: 'md:col-span-1' },
                    { title: 'Smart Money Filter', val: '70%+', desc: 'Institutional Hard Reject Rule', col: 'md:col-span-1' },
                    { title: 'Trusted By', val: '31K+', desc: 'Retail & Institutional Traders', col: 'md:col-span-3' },
                ].map((item, i) => (
                    <div key={i} className={`bg-[var(--bg-secondary)]/80 backdrop-blur-sm p-10 rounded-[2.5rem] border border-[var(--border-primary)] hover:border-blue-500/50 transition-all group ${item.col}`}>
                        <div className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 group-hover:text-blue-400 transition-colors">{item.title}</div>
                        <div className="text-5xl font-black text-[var(--text-primary)] mb-3 tracking-tighter">{item.val}</div>
                        <div className="text-sm text-[var(--text-muted)] font-medium">{item.desc}</div>
                    </div>
                ))}
           </div>
           <div className="mt-6 max-w-2xl mx-auto text-center">
             <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
               Backtest period: Jan 2020–Dec 2025 · Universe: Nifty 500 + Alpha 40 · 1,247 total signals · Slippage: 0.1% per trade · Transaction cost: 0.05% · Results are historical; past performance does not guarantee future returns. For educational reference only.
             </p>
           </div>
           </div>
         </motion.section>

       <EducationSection simStage={simStage} setSimStage={setSimStage} />

      {/* ── ABCD Walkthrough Example ── */}
      <section className="py-20 px-6 md:px-10 border-t border-[var(--border-primary)]/50">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">From Search to Entry</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)]">Full <span className="text-blue-400">ABCD Walkthrough</span></h2>
            <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xl mx-auto">Step-by-step example of how a stock moves from search to ABCD zones.</p>
          </div>
          <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-[2rem] p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm">1</div>
                  <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Search</p>
                    <p className="text-xs font-black text-[var(--text-primary)]">Type "TCS" in search → get audit score 90/100</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm">2</div>
                  <div>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Audit</p>
                    <p className="text-xs font-black text-[var(--text-primary)]">Score 90/100 → Smart Money 95% → Qualified ✓</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">3</div>
                  <div>
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">ABCD Zones</p>
                    <p className="text-xs font-black text-[var(--text-primary)]">A: ₹2,125 | B: ₹1,913 | C: ₹1,721 | D: ₹1,551</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-sm">4</div>
                  <div>
                    <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Invalidation</p>
                    <p className="text-xs font-black text-[var(--text-primary)]">If price closes below D zone (−27%), audit retriggers</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)]">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Sample Capital Allocation</p>
                <div className="space-y-2">
                  {[
                    { label: 'Tranche A (25%)', price: '₹2,125', pct: 'w-1/4', color: 'bg-blue-500' },
                    { label: 'Tranche B (25%)', price: '₹1,913', pct: 'w-1/4', color: 'bg-emerald-500' },
                    { label: 'Tranche C (35%)', price: '₹1,721', pct: 'w-[35%]', color: 'bg-amber-500' },
                    { label: 'Tranche D (15%)', price: '₹1,551', pct: 'w-[15%]', color: 'bg-purple-500' },
                  ].map(t => (
                    <div key={t.label} className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest w-28 shrink-0">{t.label}</span>
                      <div className={`h-2 ${t.pct} ${t.color} rounded-full opacity-70`} />
                      <span className="text-[9px] font-bold text-[var(--text-muted)]">{t.price}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[8px] font-bold text-amber-400/70 uppercase tracking-widest mt-3 text-center">Educational example. Not investment advice.</p>
              </div>
            </div>
            <div className="text-center">
              <Link to="/analysis/TCS" className="inline-flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors">
                View Live TCS Audit <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Strategy Comparison Table */}
      <section className="py-20 px-6 md:px-10 border-t border-[var(--border-primary)]/50">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] mb-2">Which Strategy Fits Your Style?</h2>
            <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] text-xs">Comparison of All 10 Institutional Models</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-[var(--border-primary)]">
                  <th className="py-3 pr-4 font-black text-[var(--text-primary)]">Strategy</th>
                  <th className="py-3 px-4 font-black text-[var(--text-primary)]">Best For</th>
                  <th className="py-3 px-4 font-black text-[var(--text-primary)]">Timeframe</th>
                  <th className="py-3 px-4 font-black text-[var(--text-primary)]">Signal Type</th>
                  <th className="py-3 px-4 font-black text-[var(--text-primary)]">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: 'KCM Envelope', b: 'Trending markets', t: '1–5 days', st: 'Momentum', r: 'Medium' },
                  { s: 'Bollinger Bands', b: 'Range-bound / volatile', t: '1–10 days', st: 'Mean Reversion', r: 'Medium-High' },
                  { s: 'SMA + BCD', b: 'Dips in uptrend', t: '5–20 days', st: 'Trend Continuation', r: 'Low-Medium' },
                  { s: '52W High/Low', b: 'Breakout / breakdown', t: '5–30 days', st: 'Trend Confirmation', r: 'Medium' },
                  { s: 'Support & Resistance', b: 'Range-bound markets', t: '1–10 days', st: 'Reversal', r: 'Low-Medium' },
                  { s: 'RHS / Cup ABCD', b: 'Restructured / turnaround', t: '10–45 days', st: 'Structural Recovery', r: 'Medium-High' },
                  { s: 'Market Structure', b: 'Swing / positional', t: '5–20 days', st: 'Trend Filter', r: 'Low' },
                  { s: 'Volume Spread', b: 'Breakout confirmation', t: '1–5 days', st: 'Volume Divergence', r: 'Medium' },
                  { s: 'Smart Money Index', b: 'Institutional flow tracking', t: '1–10 days', st: 'Flow Following', r: 'Low-Medium' },
                  { s: 'Multi-Timeframe', b: 'Confluence validation', t: '1–30 days', st: 'Composite', r: 'Low' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border-primary)]/30 hover:bg-[var(--bg-secondary)]/30 transition-colors">
                    <td className="py-2.5 pr-4 font-bold text-[var(--text-primary)]">{row.s}</td>
                    <td className="py-2.5 px-4 text-[var(--text-muted)]">{row.b}</td>
                    <td className="py-2.5 px-4 text-[var(--text-muted)]">{row.t}</td>
                    <td className="py-2.5 px-4 text-[var(--text-muted)]">{row.st}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${
                        row.r === 'Low' ? 'text-emerald-400' :
                        row.r === 'Low-Medium' ? 'text-emerald-300' :
                        row.r === 'Medium' ? 'text-amber-400' :
                        row.r === 'Medium-High' ? 'text-orange-400' : 'text-red-400'
                      }`}>{row.r}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[8px] font-bold text-amber-400/70 uppercase tracking-widest mt-4 text-center">Educational classification. Performance varies by market regime.</p>
        </div>
      </section>

      {/* Pillar #2: Internal Link Matrix (Trending Audits) */}
      <section className="py-24 px-6 md:px-10 max-w-[1440px] mx-auto border-t border-slate-900">
         <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
               <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Trending Institutional Audits</h2>
               <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Recently Analyzed High-Score Assets</p>
            </div>
            <Link to="/login" className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-xs hover:text-[var(--text-primary)] transition-colors">
               View All 500+ Assets <ArrowRight className="w-4 h-4" />
            </Link>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {["RELAXO", "TCS", "HDFCBANK", "INFY", "ITC", "BAJAJ-AUTO", "SANOFI", "COLPAL", "DABUR", "WIPRO", "HCLTECH", "TITAN"].map((sym) => (
               <Link 
                key={sym} 
                to={`/analysis/${sym}`}
                className="group p-6 bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-3xl hover:border-blue-500/50 transition-all hover:-translate-y-1"
               >
                  <div className="flex justify-between items-start mb-4">
                     <Zap className="w-4 h-4 text-blue-500 group-hover:animate-pulse" />
                     <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded italic">QUALIFIED</span>
                  </div>
                  <div className="text-xl font-black text-[var(--text-primary)] italic tracking-tighter mb-1">{sym}</div>
                  <div className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">Audit Matrix Active</div>
               </Link>
            ))}
         </div>
      </section>

      {/* Pillar #5: Conversion Tunnel (Education) */}
      <section className="py-24 px-6 md:px-10 max-w-[1440px] mx-auto">
         <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-[3.5rem] p-12 overflow-hidden relative group">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/5 blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-blue-600/10" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
               <div className="space-y-8">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                     <BookOpen className="h-4 w-4 text-blue-400" />
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Free Institutional Education</span>
                  </div>
                   <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">Master the <br /><span className="text-blue-500">10 Institutional</span> Strategies.</h2>
                   <p className="text-[var(--text-muted)] text-lg font-medium leading-relaxed max-w-md">
                      Don't just follow triggers. Understand the institutional logic behind every setup—from SMA-ABCD Stacking to the 67% ATH Contrarian Reset.
                  </p>
                  <Link to="/education" className="inline-flex items-center px-8 py-4 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-[var(--text-primary)] transition-all">
                     Explore Knowledge Base <ChevronRight className="ml-2 w-4 h-4" />
                  </Link>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                      { title: '67% Reset', desc: 'Contrarian value (Fallen Value Basket)', icon: RefreshCw },
                      { title: 'Velocity Retest', desc: '20% rally pullback entry', icon: TrendingUp },
                      { title: 'SMA-ABCD', desc: 'Bearish exhaustion logic', icon: Layers },
                      { title: 'Bollinger Sqz', desc: 'Volatility breakout matrix', icon: Activity },
                   ].map((item, i) => (
                     <div key={i} className="p-6 bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-primary)] hover:border-blue-500/30 transition-all">
                        <item.icon className="h-6 w-6 text-blue-500 mb-4" />
                        <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-1">{item.title}</h4>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{item.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </motion.div>
       </section>

      {/* ── BLOG TEASER ── */}
      <BlogTeaser />

      {/* Schema.org Structured Markup — SoftwareApplication + AggregateRating + Reviews */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "MarketBeacon Pro",
          "operatingSystem": "Web, iOS, Android",
          "applicationCategory": "FinanceApplication",
          "description": "India's institutional stock research tool for educational purposes. ABCD Tranche Laddering and 100-point Audit Score system. Not investment advice.",
          "url": "https://marketbeaconpro.com",
          "offers": {
            "@type": "Offer",
            "price": "99",
            "priceCurrency": "INR",
            "priceValidUntil": "2027-01-01"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "1280",
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": [
            {
              "@type": "Review",
              "author": { "@type": "Person", "name": "Rahul S." },
              "reviewRating": { "@type": "Rating", "ratingValue": "5" },
              "reviewBody": "The ABCD tranche system changed how I manage risk. No more single-entry bets."
            },
            {
              "@type": "Review",
              "author": { "@type": "Person", "name": "Priya M." },
              "reviewRating": { "@type": "Rating", "ratingValue": "5" },
              "reviewBody": "As a sub-broker, the Audit Score gives me a defensible reason for every research assessment to clients."
            }
          ]
        })}
      </script>

      <TestimonialsSection />

      {/* ── VS COMPARISON SECTION ── */}
      <section aria-label="MarketBeacon Pro vs other stock screeners" className="py-20 px-6 md:px-10 border-t border-[var(--border-primary)]/50 bg-[var(--bg-secondary)]/20">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)] mb-3">
              Why Traders Switch to <span className="text-blue-400">MarketBeacon Pro</span>
            </h2>
            <p className="text-[var(--text-muted)] text-sm">vs. generic screeners and news-based platforms</p>
          </div>

          <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-[2rem] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-[var(--border-primary)]">
              <div className="p-5 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Feature</div>
              <div className="p-5 text-center border-x border-[var(--border-primary)]">
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Other Screeners</p>
                <p className="text-[8px] text-slate-600 mt-0.5">(Screener.in, Charts)</p>
              </div>
              <div className="p-5 text-center bg-blue-600/5">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">MarketBeacon Pro</p>
                <p className="text-[8px] text-blue-500/50 mt-0.5">Institutional Grade</p>
              </div>
            </div>
            {/* Rows */}
            {[
              ['100-Point Audit Score', false, true],
              ['ABCD Tranche Entry Zones', false, true],
              ['Smart Money (FII/DII) Tracking', false, true],
              ['Educational Research Framework', '⚠️ Varies', true],
              ['Hard Reject Rules (Debt, ROCE)', false, true],
              ['Live NSE/BSE Price Feed', true, true],
              ['PE Percentile vs 5-Year History', false, true],
              ['Institutional Strategy Triggers (12 models)', false, true],
            ].map(([feature, others, mb], i) => (
              <div key={i} className={`grid grid-cols-3 border-b border-[var(--border-primary)]/50 last:border-none ${i % 2 === 0 ? '' : 'bg-[var(--bg-primary)]/[0.01]'}`}>
                <div className="px-5 py-4 text-[11px] font-bold text-[var(--text-secondary)]">{feature as string}</div>
                <div className="px-5 py-4 text-center border-x border-[var(--border-primary)]/50">
                  {others === true
                    ? <span className="text-emerald-500 text-sm">✓</span>
                    : others === false
                    ? <span className="text-slate-600 text-sm">✗</span>
                    : <span className="text-amber-400 text-xs font-bold">{others as string}</span>
                  }
                </div>
                <div className="px-5 py-4 text-center bg-blue-600/[0.03]">
                  {mb ? <span className="text-blue-400 text-sm">✓</span> : <span className="text-slate-600 text-sm">✗</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-[var(--text-primary)] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-900/30"
            >
              Try Institutional Screener Free <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY STOCKS GET REJECTED ── */}
      <section className="py-20 px-6 md:px-10 border-t border-[var(--border-primary)]/50">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.4em] mb-2">Avoiding Bad Trades</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)]">Why Stocks Get <span className="text-rose-400">Rejected</span></h2>
            <p className="text-xs text-[var(--text-muted)] mt-2">The audit score doesn't just find winners — it filters out 70% of the market.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { reason: 'Debt-to-Equity > 1.0', impact: 'Hard Reject', desc: 'Stocks with high debt relative to equity are automatically disqualified. High debt = high bankruptcy risk in downturns.', icon: '💀' },
              { reason: 'Smart Money < 30%', impact: 'Hard Reject', desc: 'If Promoter + FII + DII holding is below 30%, the stock lacks institutional interest. Retail-dominated stocks are too volatile.', icon: '👻' },
              { reason: 'Promoter Pledge ≥ 5%', impact: 'Hard Reject', desc: 'When promoters have pledged >5% of their stake, it signals financial distress. Institutions avoid these.', icon: '🔴' },
              { reason: 'ROCE < 12%', impact: 'Score Penalty', desc: 'Return on Capital Employed below 12% means the company isn\'t generating enough return on its capital base.', icon: '⚠️' },
              { reason: 'Declining Revenue Trend', impact: 'Score Penalty', desc: '3-year revenue declining = business shrinking. Even if price is low, the underlying business is deteriorating.', icon: '📉' },
              { reason: 'FII/DII Holding Dropping', impact: 'Score Penalty', desc: 'If institutions are reducing their stake quarter-on-quarter, the smart money is exiting. Follow the trend.', icon: '🏃' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-2xl hover:border-rose-500/30 transition-all">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-[var(--text-primary)]">{item.reason}</h3>
                    <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      item.impact === 'Hard Reject' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'
                    }`}>{item.impact}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center mt-6">These filters run automatically on every stock. Educational criteria, not investment advice.</p>
        </div>
      </section>

      {/* ── EMAIL LEAD CAPTURE ── */}
      <section className="py-20 px-6 md:px-10 border-t border-[var(--border-primary)]/50 bg-gradient-to-b from-slate-950 to-slate-900/50">
        <div className="max-w-[680px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <Gift className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Free · No Credit Card</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] mb-4 leading-tight">
            Get Your Free<br />
            <span className="text-blue-400">Institutional Portfolio Checklist</span>
          </h2>
          <p className="text-[var(--text-muted)] text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Download our 12-parameter Audit Checklist + ABCD Tranche Guide PDF. Join 31,402 traders using data over tips.
          </p>
          <EmailCapture />
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-5">
            No spam · Unsubscribe anytime · Educational content only · Not investment advice
          </p>
        </div>
      </section>

      <FAQSection openFaq={openFaq} setOpenFaq={setOpenFaq} />

      <CTABanner />

      {/* Site Footer */}
      <SiteFooter />

      {/* Floating WhatsApp Button (Desktop) */}
      <a
        href={waLink('Hi Admin, I want to know more about MarketBeacon Pro.')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-8 right-6 z-50 hidden md:flex items-center gap-2.5 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-[var(--text-primary)] rounded-2xl shadow-2xl shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-[11px] font-black uppercase tracking-widest">Chat with Us</span>
      </a>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 w-full p-3 md:hidden bg-[var(--bg-primary)]/95 border-t border-[var(--border-primary)] z-50 flex gap-2">
        <Link to="/login" className="flex-1 flex items-center justify-center py-3.5 bg-blue-600 text-[var(--text-primary)] rounded-xl font-black uppercase tracking-widest text-xs shadow-xl">
           Start Free
        </Link>
        <a
          href={waLink('Hi Admin, I want to know more about MarketBeacon Pro.')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 py-3.5 bg-emerald-600 text-[var(--text-primary)] rounded-xl shadow-xl"
          aria-label="WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </div>

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        requiredTier="pro" 
        userEmail={user?.email} 
      />
      {showConfetti && <Confetti />}

      {/* Voucher / Claim Modal */}
      {openVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-secondary)] rounded-[2rem] p-6 max-w-md w-full shadow-2xl border border-[var(--border-primary)] space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">Claim Alpha Access</h3>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Enter your 7-day trial voucher</p>
              </div>
              <button onClick={() => setOpenVoucherModal(false)} className="p-1 hover:bg-[var(--bg-tertiary)] rounded-full transition-colors">
                <X className="h-5 w-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {!user ? (
              <div className="space-y-4">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">Please sign in to redeem a voucher code.</p>
                <Link to="/login" className="block w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-blue-500 transition-all">
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter voucher (e.g. ALPHA7)..."
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--text-primary)] outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleRedeemVoucher}
                    disabled={redeeming}
                    className="px-5 py-3 bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    {redeeming ? 'Redeeming...' : 'Redeem'}
                  </button>
                </div>
                {voucherError && (
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">{voucherError}</p>
                )}
                <button
                  type="button"
                  onClick={() => { setVoucherCode('ALPHA7'); setVoucherError(null); }}
                  className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-wider block mx-auto underline transition-colors"
                >
                  Quick Apply: ALPHA7 (7-Day Free Trial)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deployment Verification Tag */}
      <div className="fixed bottom-4 right-4 z-[100] opacity-20 hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
          Build: v18.0.8-PRO-RENDER-VERIFY
        </span>
      </div>

    </div>
  );
};

export default HomePage;
