import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Zap, Gift, X, Mail, CheckCircle, BookOpen, RefreshCw, TrendingUp, Layers, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
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
        <h4 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Request Saved!</h4>
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
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-[var(--text-primary)] rounded-2xl font-bold uppercase tracking-wider text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
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

const TICKER_SYMBOLS = ['TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ITC', 'ICICIBANK', 'KOTAKBANK', 'LT', 'TITAN', 'SBIN'];

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

  const [tickingStocks, setTickingStocks] = useState<Array<{ symbol: string; price: number; percent: number; trend: string; flash: string }>>(
    TICKER_SYMBOLS.map(s => ({ symbol: s, price: 0, percent: 0, trend: 'up', flash: '' }))
  );

  useEffect(() => {
    let active = true;
    const fetchPrices = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stock-prices?symbols=${TICKER_SYMBOLS.join(',')}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setTickingStocks(prev => {
          const next = [...prev];
          for (const item of data) {
            const idx = next.findIndex(s => s.symbol === item.symbol);
            if (idx !== -1 && item.price > 0) {
              const oldPrice = next[idx].price;
              const newPrice = item.price;
              const change = item.change || 0;
              next[idx] = {
                ...next[idx],
                price: newPrice,
                percent: change,
                trend: change >= 0 ? 'up' : 'down',
                flash: newPrice > oldPrice ? 'flash-up' : newPrice < oldPrice ? 'flash-down' : ''
              };
            }
          }
          return next;
        });
      } catch { /* silently ignore fetch errors */ }
    };
    fetchPrices();
    const refresh = setInterval(fetchPrices, 15000);
    return () => { active = false; clearInterval(refresh); };
  }, [TICKER_SYMBOLS]);

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
        { q: "What is an Institutional Stock Audit?", a: "An institutional stock audit is a quantitative scan that measures an asset against 100 mathematical data points. Unlike standard news bulletins, it reviews deep fundamental safety, debt leverage parameters, historical valuation percentiles, and institutional demand floors to assign an audit score out of 100." },
        { q: "How does the ABCD Tranche Laddering model protect capital?", a: "Instead of allocating 100% of your capital at a single price point (which exposes you to instant drawdowns), the ABCD Ladder model divides buying capacity into four distinct tranches (A, B, C, D) triggered by historical pullback milestones. This averages your position downward automatically during sweeps and secures a stable demand floor." },
        { q: "Is MarketBeacon Pro investment advice or advisory?", a: "No. MarketBeacon Pro is NOT a SEBI-registered Investment Adviser (IA) or Research Analyst (RA). It is a quantitative mathematical research tool for educational and personal research purposes only. All audit scores, strategy signals, and ABCD zones are pre-coded mathematical models. Nothing on this platform constitutes a personalized investment recommendation, buy/sell advisory, or portfolio management service. Always consult a SEBI-registered advisor before making investment decisions." },
        { q: "How often are stock prices and audit scores updated?", a: "Live stock prices are synced continuously in real-time, and audit models re-examine key fundamental data points (like quarterly results, PE ratios, and institutional holdings) automatically daily to recalculate active scores and update zones." }
      ]} />
      {/* Live Market Price Ticking Ticker (Groww Style) */}
      <div className="bg-slate-50 py-2.5 overflow-hidden whitespace-nowrap border-b border-slate-200 relative z-50">
        <div className="flex animate-marquee items-center gap-10">
           {tickingStocks.map((stock, i) => (
             <Link
               key={i}
               to={`/charts?symbol=${stock.symbol}&return=/`}
               className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all duration-300 hover:bg-slate-100 ${
                 stock.flash === 'flash-up' ? 'bg-emerald-50 scale-105' :
                 stock.flash === 'flash-down' ? 'bg-rose-50 scale-105' : ''
               }`}
             >
               <span className="text-slate-500 uppercase tracking-wider text-[10px]">{stock.symbol}</span>
               <span className={`font-extrabold font-mono transition-colors duration-300 ${
                 stock.flash === 'flash-up' ? 'text-[#00d09c]' :
                 stock.flash === 'flash-down' ? 'text-rose-500' : 'text-slate-800'
               }`}>
                 {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </span>
               <span className={`inline-flex items-center gap-0.5 font-mono text-[10px] ${
                 stock.percent >= 0 ? 'text-[#00d09c]' : 'text-rose-500'
               }`}>
                 {stock.percent >= 0 ? '+' : ''}{stock.percent.toFixed(2)}%
               </span>
             </Link>
           ))}
           {/* Duplicate for infinite loop */}
           {tickingStocks.map((stock, i) => (
             <Link
               key={`d-${i}`}
               to={`/charts?symbol=${stock.symbol}&return=/`}
               className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
             >
               <span className="text-slate-500 uppercase tracking-wider text-[10px]">{stock.symbol}</span>
               <span className="font-extrabold font-mono text-slate-800">
                 {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </span>
               <span className={`inline-flex items-center gap-0.5 font-mono text-[10px] ${
                 stock.percent >= 0 ? 'text-[#00d09c]' : 'text-rose-500'
               }`}>
                 {stock.percent >= 0 ? '+' : ''}{stock.percent.toFixed(2)}%
               </span>
             </Link>
           ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-primary)] px-6 md:px-10 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center transition-all hover:opacity-90 active:scale-95">
           <BrandLogo variant="light" size={30} />
        </Link>
        <div className="hidden md:flex items-center space-x-6">
           <Link to="/blog" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors flex items-center gap-1.5">
              Blog <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">NEW</span>
            </Link>
            <Link to="/check" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">
              Free Scanner
            </Link>
            <Link to="/license-desk" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">
              Pricing
            </Link>
           <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">31,402 Active Traders</span>
           </div>
           <Link to="/login" className="px-6 py-2.5 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl text-caption shadow-lg hover:scale-105 transition-all">Sign In</Link>
        </div>
        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-3">
          <Link to="/check" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">Scanner</Link>
          <Link to="/blog" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">Blog</Link>
          <Link to="/login" className="px-4 py-2 bg-[#00d09c] text-white rounded-xl text-caption">Sign In</Link>
        </div>
      </nav>

      <main>
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

      {/* ── Live Charts Terminal ── */}
      <section className="py-16 px-6 md:px-10 max-w-[1440px] mx-auto">
        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 md:p-10 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#00d09c]/5 blur-[80px] -mr-32 -mt-32" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-[#00d09c]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d09c] animate-pulse" />
                <span className="text-xs font-bold text-[#00d09c] uppercase tracking-wider">Live Charts Terminal</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-none">
                Institutional-Grade <br /><span className="text-[#00d09c]">Charts & Analytics</span>
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
                Professional candlestick charts with FII/DII overlays, ABCD tranche levels, volume profile, and 50+ technical indicators — all in one terminal.
              </p>
              <ul className="space-y-2">
                {[
                  'Real-time NSE/BSE price feed synced with audit scores',
                  'ABCD Tranche entry zones plotted directly on charts',
                  'Smart Money (FII/DII) volume divergence indicators',
                  'Multi-timeframe analysis with institutional strategy overlays',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-2.5 h-2.5 text-[#00d09c]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link to="/charts" className="inline-flex items-center gap-2 px-6 py-3 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-105 transition-all shadow-md shadow-[#00d09c]/15">
                  Open Charts Terminal <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/education" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-slate-50 transition-all">
                  Learn Chart Analysis
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-[var(--bg-secondary)]/80 backdrop-blur-sm border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-lg shadow-blue-900/20">
                <div className="bg-[var(--bg-primary)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">RELIANCE · NSE</p>
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">LIVE · 2,845.30 <span className="text-emerald-400">+1.2%</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">1D</div>
                      <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1W</div>
                      <div className="w-5 h-5 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">1M</div>
                      <div className="w-5 h-5 rounded bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">1Y</div>
                    </div>
                  </div>
                  <div className="h-32 rounded-xl bg-gradient-to-b from-blue-600/[0.02] to-transparent border border-[var(--border-primary)] relative overflow-hidden">
                    <div className="absolute inset-0 flex items-end px-2 pb-3">
                      <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                        <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(59,130,246,0.08)" strokeWidth="1" />
                        <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(59,130,246,0.08)" strokeWidth="1" />
                        <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(59,130,246,0.08)" strokeWidth="1" />
                        <path d="M0,100 L30,90 L60,95 L90,75 L120,80 L150,60 L180,65 L210,50 L240,55 L270,40 L300,45 L330,35 L360,40 L400,30" fill="none" stroke="#3b82f6" strokeWidth="2" />
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                        <path d="M0,100 L30,90 L60,95 L90,75 L120,80 L150,60 L180,65 L210,50 L240,55 L270,40 L300,45 L330,35 L360,40 L400,30 L400,160 L0,160 Z" fill="url(#chartGrad)" />
                        <circle cx="90" cy="75" r="4" fill="transparent" stroke="#10b981" strokeWidth="2" />
                        <circle cx="270" cy="40" r="4" fill="transparent" stroke="#10b981" strokeWidth="2" />
                        <circle cx="150" cy="60" r="3" fill="#ef4444" />
                      </svg>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <div className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs font-bold text-blue-400 uppercase tracking-wider">ABCD: B</div>
                      <div className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs font-bold text-emerald-400 uppercase tracking-wider">Audit: 82/100</div>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-6 px-1">
                    {[40,60,35,75,50,90,65,45,80,55,70,85,30,50,65,45,80,55,70,85,40,60,35].map((h, i) => (
                      <div key={i} className="flex-1 bg-blue-500/20 rounded-t" style={{height: h + '%'}} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-caption shadow-lg shadow-blue-900/40 animate-pulse">
                Interactive
              </div>
            </div>
          </div>
        </div>
      </section>

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
                    { title: 'Portfolio Growth', val: '+42.8%', desc: 'Avg. backtested move per Alpha alert (2015-2025)', col: 'md:col-span-2' },
                    { title: 'Audit Accuracy', val: '99.4%', desc: 'Batch-9 Validation Rate', col: 'md:col-span-1' },
                    { title: 'Alpha Gain', val: '1.8x', desc: 'Vs Nifty 50 Benchmark', col: 'md:col-span-1' },
                    { title: 'Smart Money Filter', val: '70%+', desc: 'Institutional Hard Reject Rule', col: 'md:col-span-1' },
                    { title: 'Trusted By', val: '31K+', desc: 'Retail & Institutional Traders', col: 'md:col-span-3' },
                ].map((item, i) => (
                    <div key={i} className={`bg-[var(--bg-secondary)]/80 backdrop-blur-sm p-10 rounded-[2.5rem] border border-[var(--border-primary)] hover:border-blue-500/50 transition-all group ${item.col}`}>
                        <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 group-hover:text-blue-400 transition-colors">{item.title}</div>
                        <div className="text-5xl font-black text-[var(--text-primary)] mb-3 tracking-tighter">{item.val}</div>
                        <div className="text-sm text-[var(--text-muted)] font-medium">{item.desc}</div>
                    </div>
                ))}
           </div>
           <div className="mt-6 max-w-2xl mx-auto text-center">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
               Backtest period: Jan 2020–Dec 2025 · Universe: Nifty 500 + Alpha 40 · 1,247 total signals · Slippage: 0.1% per trade · Transaction cost: 0.05% · Results are historical; past performance does not guarantee future returns. For educational reference only.
             </p>
           </div>
           </div>
         </motion.section>

       <EducationSection simStage={simStage} setSimStage={setSimStage} />

      {/* ── ABCD Walkthrough Example ── */}
      <section className="py-20 px-6 md:px-10 border-t border-slate-100">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-[#00d09c] uppercase tracking-[0.4em] mb-2">From Search to Entry</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Full <span className="text-[#00d09c]">ABCD Walkthrough</span></h2>
            <p className="text-xs text-slate-500 mt-2 max-w-xl mx-auto">Step-by-step example of how a stock moves from search to ABCD zones.</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
                  <div>
                    <p className="text-xs font-bold text-[#00d09c] uppercase tracking-wider">Search</p>
                    <p className="text-xs font-bold text-slate-900">Type "TCS" in search → get audit score 90/100</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">2</div>
                  <div>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Audit</p>
                    <p className="text-xs font-bold text-slate-900">Score 90/100 → Smart Money 95% → Qualified ✓</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">3</div>
                  <div>
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">ABCD Zones</p>
                    <p className="text-xs font-bold text-slate-900">A: ₹2,125 | B: ₹1,913 | C: ₹1,721 | D: ₹1,551</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">4</div>
                  <div>
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Invalidation</p>
                    <p className="text-xs font-bold text-slate-900">If price closes below D zone (−27%), audit retriggers</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sample Capital Allocation</p>
                <div className="space-y-2">
                  {[
                    { label: 'Tranche A (25%)', price: '₹2,125', pct: 'w-1/4', color: 'bg-blue-500' },
                    { label: 'Tranche B (25%)', price: '₹1,913', pct: 'w-1/4', color: 'bg-emerald-500' },
                    { label: 'Tranche C (35%)', price: '₹1,721', pct: 'w-[35%]', color: 'bg-amber-500' },
                    { label: 'Tranche D (15%)', price: '₹1,551', pct: 'w-[15%]', color: 'bg-purple-500' },
                  ].map(t => (
                    <div key={t.label} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-28 shrink-0">{t.label}</span>
                      <div className={`h-2 ${t.pct} ${t.color} rounded-full opacity-70`} />
                      <span className="text-xs font-bold text-slate-500">{t.price}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mt-3 text-center">Educational example. Not investment advice.</p>
              </div>
            </div>
            <div className="text-center">
              <Link to="/analysis/TCS" className="inline-flex items-center gap-2 text-[#00d09c] text-caption hover:text-slate-900 transition-colors">
                View Live TCS Audit <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Strategy Comparison Table */}
      <section className="py-20 px-6 md:px-10 border-t border-slate-100">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mb-2">Which Strategy Fits Your Style?</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Comparison of All 10 Institutional Models</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 font-bold text-slate-700">Strategy</th>
                  <th className="py-3 px-4 font-bold text-slate-700">Best For</th>
                  <th className="py-3 px-4 font-bold text-slate-700">Timeframe</th>
                  <th className="py-3 px-4 font-bold text-slate-700">Signal Type</th>
                  <th className="py-3 px-4 font-bold text-slate-700">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: 'KCM Envelope', b: 'Trending markets', t: '1–5 days', st: 'Momentum', r: 'Medium' },
                  { s: 'Bollinger Bands', b: 'Range-bound / volatile', t: '1–10 days', st: 'Mean Reversion', r: 'Medium-High' },
                  { s: 'SMA + BCD', b: 'Dips in uptrend', t: '5–20 days', st: 'Trend Continuation', r: 'Low-Medium' },
                  { s: '52W High/Low', b: 'Breakout / breakdown', t: '5–30 days', st: 'Trend Confirmation', r: 'Medium' },
                  { s: 'Support & Resistance', b: 'Range-bound markets', t: '1–10 days', st: 'Reversal', r: 'Low-Medium' },
                  { s: 'Cup & Handle + ABCD', b: 'Restructured / turnaround', t: '10–45 days', st: 'Structural Recovery', r: 'Medium-High' },
                  { s: 'Market Structure', b: 'Swing / positional', t: '5–20 days', st: 'Trend Filter', r: 'Low' },
                  { s: 'Volume Spread', b: 'Breakout confirmation', t: '1–5 days', st: 'Volume Divergence', r: 'Medium' },
                  { s: 'Smart Money Index', b: 'Institutional flow tracking', t: '1–10 days', st: 'Flow Following', r: 'Low-Medium' },
                  { s: 'Multi-Timeframe', b: 'Confluence validation', t: '1–30 days', st: 'Composite', r: 'Low' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-4 font-bold text-slate-700">{row.s}</td>
                    <td className="py-2.5 px-4 text-slate-400">{row.b}</td>
                    <td className="py-2.5 px-4 text-slate-400">{row.t}</td>
                    <td className="py-2.5 px-4 text-slate-400">{row.st}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-caption ${
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
          <p className="text-xs font-bold text-amber-400/70 uppercase tracking-wider mt-4 text-center">Educational classification. Performance varies by market regime.</p>
        </div>
      </section>

      {/* Pillar #2: Internal Link Matrix (Trending Audits) */}
      <section className="py-24 px-6 md:px-10 max-w-[1440px] mx-auto border-t border-slate-100">
         <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
               <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">Trending Institutional Audits</h2>
               <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Recently Analyzed High-Score Assets</p>
            </div>
            <Link to="/login" className="flex items-center gap-2 text-[#00d09c] font-bold uppercase tracking-wider text-xs hover:text-slate-900 transition-colors">
               View All 500+ Assets <ArrowRight className="w-4 h-4" />
            </Link>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {["RELAXO", "TCS", "HDFCBANK", "INFY", "ITC", "BAJAJ-AUTO", "SANOFI", "COLPAL", "DABUR", "WIPRO", "HCLTECH", "TITAN"].map((sym) => (
               <Link 
                key={sym} 
                to={`/analysis/${sym}`}
                className="group p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:border-[#00d09c]/30 transition-all hover:-translate-y-1"
               >
                  <div className="flex justify-between items-start mb-4">
                     <Zap className="w-4 h-4 text-[#00d09c] group-hover:animate-pulse" />
                     <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded italic">QUALIFIED</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900 italic tracking-tighter mb-1">{sym}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Matrix Active</div>
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
            className="bg-slate-50 border border-slate-100 rounded-[3.5rem] p-12 overflow-hidden relative group">
            <div className="absolute right-0 top-0 w-96 h-96 bg-[#00d09c]/5 blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-[#00d09c]/10" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
               <div className="space-y-8">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#00d09c]/10 rounded-full border border-[#00d09c]/20">
                     <BookOpen className="h-4 w-4 text-[#00d09c]" />
                     <span className="text-xs font-bold text-[#00d09c] uppercase tracking-wider">Free Institutional Education</span>
                  </div>
                   <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none text-slate-900">Master the <br /><span className="text-[#00d09c]">10 Institutional</span> Strategies.</h2>
                   <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
                      Don't just follow triggers. Understand the institutional logic behind every setup—from SMA-ABCD Stacking to the 67% ATH Contrarian Reset.
                  </p>
                  <Link to="/education" className="inline-flex items-center px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-[#00d09c] hover:text-white hover:border-[#00d09c] transition-all">
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
                     <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-[#00d09c]/30 transition-all">
                        <item.icon className="h-6 w-6 text-[#00d09c] mb-4" />
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">{item.title}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.desc}</p>
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
      <section aria-label="MarketBeacon Pro vs other stock screeners" className="py-20 px-6 md:px-10 border-t border-slate-100 bg-slate-50">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 mb-3">
              Why Traders Switch to <span className="text-[#00d09c]">MarketBeacon Pro</span>
            </h2>
            <p className="text-slate-500 text-sm">vs. generic screeners and news-based platforms</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-slate-100">
              <div className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Feature</div>
              <div className="p-5 text-center border-x border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Other Screeners</p>
                <p className="text-xs text-slate-500 mt-0.5">(Screener.in, Charts)</p>
              </div>
              <div className="p-5 text-center bg-[#00d09c]/5">
                <p className="text-xs font-bold text-[#00d09c] uppercase tracking-wider">MarketBeacon Pro</p>
                <p className="text-xs text-[#00d09c]/50 mt-0.5">Institutional Grade</p>
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
              <div key={i} className={`grid grid-cols-3 border-b border-slate-100 last:border-none ${i % 2 === 0 ? '' : 'bg-[#00d09c]/[0.03]'}`}>
                <div className="px-5 py-4 text-xs font-bold text-slate-700">{feature as string}</div>
                <div className="px-5 py-4 text-center border-x border-slate-100">
                  {others === true
                    ? <span className="text-emerald-500 text-sm">✓</span>
                    : others === false
                    ? <span className="text-slate-400 text-sm">✗</span>
                    : <span className="text-amber-400 text-xs font-bold">{others as string}</span>
                  }
                </div>
                <div className="px-5 py-4 text-center bg-[#00d09c]/[0.03]">
                  {mb ? <span className="text-[#00d09c] text-sm">✓</span> : <span className="text-slate-400 text-sm">✗</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-2xl font-bold uppercase tracking-wider text-xs hover:scale-105 transition-all shadow-lg shadow-[#00d09c]/20"
            >
              Try Institutional Screener Free <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY STOCKS GET REJECTED ── */}
      <section className="py-20 px-6 md:px-10 border-t border-slate-100">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-[0.4em] mb-2">Avoiding Bad Trades</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Why Stocks Get <span className="text-rose-400">Rejected</span></h2>
            <p className="text-xs text-slate-500 mt-2">The audit score doesn't just find winners — it filters out 70% of the market.</p>
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
              <div key={i} className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-rose-500/30 transition-all">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{item.reason}</h3>
                    <span className={`text-caption px-2 py-0.5 rounded-full ${
                      item.impact === 'Hard Reject' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'
                    }`}>{item.impact}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mt-6">These filters run automatically on every stock. Educational criteria, not investment advice.</p>
        </div>
      </section>

      {/* ── EMAIL LEAD CAPTURE ── */}
      <section className="py-20 px-6 md:px-10 border-t border-slate-100 bg-slate-50">
        <div className="max-w-[680px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d09c]/10 border border-[#00d09c]/20 rounded-full mb-6">
            <Gift className="w-3.5 h-3.5 text-[#00d09c]" />
            <span className="text-xs font-bold text-[#00d09c] uppercase tracking-[0.3em]">Free · No Credit Card</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 mb-4 leading-tight">
            Get Your Free<br />
            <span className="text-[#00d09c]">Institutional Portfolio Checklist</span>
          </h2>
          <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            Download our 12-parameter Audit Checklist + ABCD Tranche Guide PDF. Join 31,402 traders using data over tips.
          </p>
          <EmailCapture />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-5">
            No spam · Unsubscribe anytime · Educational content only · Not investment advice
          </p>
        </div>
      </section>

      <FAQSection openFaq={openFaq} setOpenFaq={setOpenFaq} />

      <CTABanner />

      </main>

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
        <span className="text-caption">Chat with Us</span>
      </a>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 w-full p-3 md:hidden bg-white/95 border-t border-slate-200 z-50 flex gap-2">
        <Link to="/login" className="flex-1 flex items-center justify-center py-3.5 bg-[#00d09c] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#00d09c]/20">
           Sign In
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
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight italic">Claim Alpha Access</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Enter your 7-day trial voucher</p>
              </div>
              <button onClick={() => setOpenVoucherModal(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {!user ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">Please sign in to redeem a voucher code.</p>
                <Link to="/login" className="block w-full py-3 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl text-caption text-center transition-all">
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
                    className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-caption text-slate-800 outline-none focus:border-[#00d09c]"
                  />
                  <button
                    onClick={handleRedeemVoucher}
                    disabled={redeeming}
                    className="px-5 py-3 bg-[#00d09c] hover:bg-[#00bda0] text-white disabled:bg-slate-200 disabled:text-slate-400 rounded-xl text-caption transition-all"
                  >
                    {redeeming ? 'Redeeming...' : 'Redeem'}
                  </button>
                </div>
                {voucherError && (
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{voucherError}</p>
                )}
                <button
                  type="button"
                  onClick={() => { setVoucherCode('ALPHA7'); setVoucherError(null); }}
                  className="text-xs font-bold text-[#00d09c] hover:text-[#00bda0] uppercase tracking-wider block mx-auto underline transition-colors"
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
        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
          Build: v18.2.0-PRO-RENDER-VERIFY
        </span>
      </div>

    </div>
  );
};

export default HomePage;
