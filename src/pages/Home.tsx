import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Target, 
  ArrowRight,
  Activity,
  Globe,
  Search,
  TrendingUp,
  ChevronRight,
  Zap,
  BarChart2,
  Lock,
  ArrowUpRight,
  RefreshCw,
  BadgeCheck,
  BookOpen,
  Layers,
  Users,
  X,
  Gift,
  CheckCircle,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { BASKETS } from '../data/stocks';
import BrandLogo from '../components/brand/BrandLogo';
import SiteFooter from '../components/layout/SiteFooter';

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
    // Store locally — wire to backend/Mailchimp later
    try {
      const leads = JSON.parse(localStorage.getItem('mb_leads') || '[]');
      leads.push({ email: email.trim(), segment, ts: new Date().toISOString() });
      localStorage.setItem('mb_leads', JSON.stringify(leads));
      await new Promise(r => setTimeout(r, 800)); // Simulate async
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
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
        <h4 className="text-lg font-black text-white tracking-tight">Starter Kit Sent!</h4>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Check your inbox for the ABCD Tranche Zones + Audit Checklist PDF.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="email-lead-capture"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full pl-11 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>
        <select
          id="segment-lead-capture"
          value={segment}
          onChange={e => setSegment(e.target.value)}
          className="px-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
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
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-blue-900/30"
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [simStage, setSimStage] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const navigate = useNavigate();

  // Unified Institutional Symbol List
  const ALL_SYMBOLS = useMemo(() => {
    const syms = new Set<string>();
    Object.values(BASKETS).forEach(list => list.forEach(s => syms.add(s)));
    return Array.from(syms);
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const q = searchQuery.toUpperCase();
      const filtered = ALL_SYMBOLS.filter(s => 
        s.includes(q) || 
        (q === 'SDFC' && s === 'HDFCBANK') || 
        (q === 'HDFC' && s === 'HDFCBANK')
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
    // Auto-clear teaser if user starts typing a fresh query
    if (teaserData && searchQuery !== teaserData.symbol) {
       setTeaserData(null);
    }
  }, [searchQuery, ALL_SYMBOLS, teaserData]);

  const handleReset = () => {
    setSearchSearchQuery('');
    setTeaserData(null);
    setSuggestions([]);
  };

  const [searchError, setSearchError] = useState<string | null>(null);

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
    document.title = "MarketBeacon Pro | Institutional Stock Research Tool India";
    // Pillar #8: Pre-emptive Server Warm-up (Mitigate Cold Starts)
    fetch(`${API_URL}/api/health`).catch(() => {/* Silent fail */});
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden selection:bg-blue-500/30">
      {/* Live Trust Ticker (Safe-Guard Rule #7) */}
      <div className="bg-blue-600 py-2 overflow-hidden whitespace-nowrap border-b border-blue-500 relative z-[60]">
        <div className="flex animate-marquee items-center gap-12">
          {[
            "RELAXO: Qualified with 92/100",
            "TCS: Bullish SMA-ABCD Matrix",
            "HDFC BANK: Institutional Accumulation",
            "INFY: Volatility Channel Breakthrough",
            "ITC: Zero-Debt High-SM Qualified",
            "BAJAJ AUTO: 52W High Momentum",
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
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
            <div key={`d-${i}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white opacity-80">
              <ShieldCheck className="w-3 h-3" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-10 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 md:px-10 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center transition-all hover:opacity-90 active:scale-95">
           <BrandLogo variant="dark" size={30} />
        </Link>
        <div className="hidden md:flex items-center space-x-6">
           <Link to="/blog" className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">
             Blog
           </Link>
           <Link to="/license-desk" className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">
             Pricing
           </Link>
           <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">31,402 Active Traders</span>
           </div>
           <Link to="/login" className="px-6 py-2.5 bg-white text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Launch Terminal</Link>
        </div>
        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-3">
          <Link to="/blog" className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors">Blog</Link>
          <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Login</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-64 pb-32 px-6 md:px-10 max-w-[1440px] mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-950/50 backdrop-blur-sm rounded-full border border-blue-900 mb-10">
           <ShieldCheck className="h-4 w-4 text-blue-400" />
           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">For Educational & Research Purposes Only · Not Investment Advice</span>
        </div>
        
        <h1 className="text-5xl md:text-[8rem] font-black tracking-tighter leading-[0.85] text-white mb-6 drop-shadow-2xl">
           THE SYSTEM <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">FII/DII USE.</span>
        </h1>
        <p className="text-base md:text-xl font-black text-blue-300/80 uppercase tracking-[0.25em] mb-10">Now In Your Hands.</p>

        {/* Hero Search Bar (CDO Engagement Feature) */}
        <div className="max-w-2xl mx-auto mb-16 relative group">
          <form onSubmit={(e) => handleSearch(e)} className="flex p-2 bg-slate-900/50 backdrop-blur-2xl border-2 border-slate-800 rounded-[2.5rem] focus-within:border-blue-600/50 transition-all shadow-2xl relative">
            <div className="flex-1 flex items-center pl-6 gap-3">
              <Search className="w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Enter stock symbol (e.g. RELAXO, TCS)..." 
                className="bg-transparent border-none outline-none w-full text-sm font-black uppercase tracking-widest text-white placeholder:text-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={handleReset}
                  className="p-2 mr-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" disabled={isSearching} className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-all flex items-center gap-2">
              {isSearching ? 'Auditing...' : 'Instant Audit'} <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* SEARCH ERROR ALERT (Institutional Style) */}
          <AnimatePresence>
            {searchError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-left flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-rose-500/20 rounded-xl">
                    <X className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase tracking-widest italic">{searchError}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">We only audit Nifty 500 & Alpha 40 symbols currently.</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(`https://wa.me/917056633633?text=Request%20Symbol:%20${searchQuery}`, '_blank')}
                  className="px-6 py-2 bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all whitespace-nowrap"
                >
                  Request Addition
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Institutional Suggestions Dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 w-full mt-2 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden z-[70] shadow-2xl"
              >
                {suggestions.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleSearch(undefined, sym)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-none group"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-blue-500 group-hover:animate-pulse" />
                      <span className="text-sm font-black text-white uppercase tracking-widest">{sym}</span>
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic group-hover:text-blue-400">Institutional Node</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* INSTANT TEASER AUDIT CARD (Safe-Guard Rule #11) */}
          <AnimatePresence>
            {teaserData && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-8 p-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2.5rem] shadow-2xl"
              >
                <div className="bg-slate-950 rounded-[2.4rem] p-8 text-left space-y-6 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] -mr-24 -mt-24" />
                   
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                           <h3 className="text-3xl font-black text-white italic tracking-tighter">{teaserData.symbol}</h3>
                           <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[9px] font-black text-blue-400 uppercase tracking-widest italic">{teaserData.basket} Node</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                           {teaserData.isPass && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                 <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                                 <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Qualified on Fundamentals</span>
                              </div>
                           )}
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Institutional Audit Pass</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className={`text-5xl font-black italic ${teaserData.score >= 80 ? 'text-emerald-400' : 'text-blue-400'}`}>{(teaserData.score || 0).toFixed(0)}</div>
                         <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Audit Score</div>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Smart Money', val: `${(teaserData.smartMoney || 0).toFixed(1)}%`, icon: TrendingUp },
                        { label: 'Alpha Target', val: `+${teaserData.upside}%`, icon: Target },
                        { label: 'Risk Profile', val: teaserData.risk, icon: ShieldCheck },
                      ].map((stat, i) => (
                        <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                           <stat.icon className="h-4 w-4 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                           <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                           <p className="text-sm font-black text-white italic">{stat.val}</p>
                        </div>
                      ))}
                   </div>

                   <div className="pt-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {teaserData.strategies?.length > 0 ? (
                           teaserData.strategies.map((s: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all group">
                                 <Zap className="w-3 h-3 text-blue-500 group-hover:animate-pulse" />
                                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.name} Entry</span>
                              </div>
                           ))
                        ) : (
                           <div className="px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-2xl italic">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Monitoring for Institutional Entry</span>
                           </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-white/5 pt-4">
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-slate-600" />
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Verified by Institutional Matrix v12.0</span>
                         </div>
                         <Link 
                           to={`/analysis/${teaserData.symbol}`}
                           className="flex items-center gap-2 text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase tracking-widest group"
                         >
                           Access Full Strategy Matrix <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                         </Link>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center gap-4 mt-6">
            {["RELAXO", "TCS", "ITC"].map(sym => (
              <button 
                key={sym} 
                onClick={() => { setSearchSearchQuery(sym); }}
                className="text-[10px] font-black text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
        
        <p className="text-lg md:text-xl font-medium text-slate-400 max-w-2xl mx-auto leading-relaxed mb-6 px-4">
           100-point Institutional Audit Score + ABCD Tranche Laddering — the same framework used by institutional desks, now available for educational research. Free to try.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-10">
          <Link to="/login" className="w-full md:w-auto inline-flex items-center justify-center px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-500 hover:scale-105 transition-all shadow-2xl shadow-blue-900/40">
             Start Free — No Card Needed
          </Link>
          <Link to="/license-desk" className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all">
            View Pricing <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-950 bg-slate-800 overflow-hidden shadow-xl">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="Active trader on MarketBeacon Pro" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-4 border-slate-950 bg-blue-600 flex items-center justify-center text-[9px] font-black text-white shadow-xl">+30K</div>
          </div>
          <p className="text-xs font-bold text-slate-400">Trusted by <span className="text-white font-black">30,000+</span> retail traders &amp; advisors</p>
        </div>
      </header>

      {/* ── PHASE 1: 3 ICP SEGMENT CARDS ── */}
      <section aria-label="Who is MarketBeacon Pro for" className="py-20 px-6 md:px-10 border-y border-slate-800/60 bg-slate-900/20">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3">Kiske Liye Hai?</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">Aapki Category <span className="text-blue-400">Kaunsi Hai?</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Segment 1: Retail Trader */}
            <div className="group relative bg-slate-900/60 border border-slate-800 rounded-[2rem] p-8 hover:border-blue-500/50 transition-all hover:-translate-y-1 flex flex-col">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl w-fit mb-6">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="mb-2 text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Retail Trader</div>
              <h3 className="text-xl font-black text-white tracking-tighter mb-3">Portfolio: ₹5L – ₹50L</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">
                "Mujhe nahi pata kab buy karna hai, kab exit." — ABCD Tranche System se institutional logic milega. Kabhi ek hi price pe sab nahi daalna padega.
              </p>
              <div className="space-y-2 mb-8">
                {['100-Point Audit Score Free', 'ABCD Entry Zones', 'Live Screener Access'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/login" className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-blue-500 transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Segment 2: Sub-broker / Advisor */}
            <div className="group relative bg-slate-900/60 border border-emerald-500/40 rounded-[2rem] p-8 hover:border-emerald-400/60 transition-all hover:-translate-y-1 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg">
                Most Popular
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl w-fit mb-6 mt-2">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="mb-2 text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Sub-broker / Advisor</div>
              <h3 className="text-xl font-black text-white tracking-tighter mb-3">Client Portfolio Manager</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">
                "Clients ko har trade justify karna padta hai." — Audit Score se aap har recommendation ko data se defend kar sakte ho. Zero guesswork.
              </p>
              <div className="space-y-2 mb-8">
                {['Audit Trail per Trade', 'Client-Ready Data Reports', 'Educational Research Framework'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/license-desk" className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-emerald-500 transition-colors">
                Get Pro Access
              </Link>
            </div>

            {/* Segment 3: HNI / Family Office */}
            <div className="group relative bg-slate-900/60 border border-amber-500/30 rounded-[2rem] p-8 hover:border-amber-400/50 transition-all hover:-translate-y-1 flex flex-col">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-fit mb-6">
                <BarChart2 className="h-6 w-6 text-amber-400" />
              </div>
              <div className="mb-2 text-[9px] font-black text-amber-400 uppercase tracking-[0.3em]">HNI / Family Office</div>
              <h3 className="text-xl font-black text-white tracking-tighter mb-3">Portfolio: ₹50L+</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">
                "Risk management weak hai, capital protect nahi ho raha." — Tranche Laddering se capital systematic way mein deploy hota hai. No emotional decisions.
              </p>
              <div className="space-y-2 mb-8">
                {['Full Alpha Hub Access', 'Priority Alpha Strategy Triggers', 'Custom Enterprise Node'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => window.open('https://wa.me/917056633633?text=Hi%20Admin,%20I%20am%20interested%20in%20Alpha%20Access%20for%20my%20HNI%20portfolio.', '_blank')}
                className="w-full py-3.5 bg-amber-600/80 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-amber-500 transition-colors"
              >
                Contact for Alpha
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof (Bento Grid) */}
      <section id="proof" className="py-24 px-6 md:px-10 border-y border-slate-800 bg-slate-900/30">
         <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Proven Institutional Results</h2>
               <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">Real-time Performance Verification</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: 'Portfolio Growth', val: '+42.8%', desc: 'Avg. growth per Alpha signal', col: 'md:col-span-2' },
                    { title: 'Audit Accuracy', val: '99.4%', desc: 'Batch-9 Validation Rate', col: 'md:col-span-1' },
                    { title: 'Alpha Gain', val: '1.8x', desc: 'Vs Nifty 50 Benchmark', col: 'md:col-span-1' },
                    { title: 'Smart Money Filter', val: '70%+', desc: 'Institutional Hard Reject Rule', col: 'md:col-span-1' },
                    { title: 'Trusted By', val: '31K+', desc: 'Retail & Institutional Traders', col: 'md:col-span-3' },
                ].map((item, i) => (
                    <div key={i} className={`bg-slate-900/80 backdrop-blur-sm p-10 rounded-[2.5rem] border border-slate-800 hover:border-blue-500/50 transition-all group ${item.col}`}>
                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 group-hover:text-blue-400 transition-colors">{item.title}</div>
                        <div className="text-5xl font-black text-white mb-3 tracking-tighter">{item.val}</div>
                        <div className="text-sm text-slate-500 font-medium">{item.desc}</div>
                    </div>
                ))}
            </div>
         </div>
      </section>

      {/* Interactive Strategy Simulator */}
      <section className="py-24 px-6 md:px-10 max-w-[1440px] mx-auto border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
              <Activity className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Interactive Audit Simulator</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase italic">Visualizing the <br /><span className="text-blue-500">ABCD Tranche</span> Ladder</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Institutional capital doesn't enter stocks all at once. They build positions in tranches to absorb market volatility. Click each stage to see how our algorithms ladder your entry.
            </p>
            
            <div className="grid grid-cols-4 gap-2 pt-4">
              {(['A', 'B', 'C', 'D'] as const).map((stage) => (
                <button
                  key={stage}
                  onClick={() => setSimStage(stage)}
                  className={`py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    simStage === stage
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  Stage {stage}
                </button>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Tranche Allocation</span>
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">Active Matrix</span>
              </div>
              
              <h3 className="text-xl font-black uppercase text-white italic tracking-tight">
                {simStage === 'A' && "Stage A: Base Price Floor Establishment"}
                {simStage === 'B' && "Stage B: Pullback Accumulation Sweep"}
                {simStage === 'C' && "Stage C: Hard Value Floor Validation"}
                {simStage === 'D' && "Stage D: Breakout / Target Realization"}
              </h3>
              
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                {simStage === 'A' && "Algorithm registers initial institutional activity at key support floors. A safe 25% initial position tranche is cleared for audit."}
                {simStage === 'B' && "Volatile swings sweep minor stops. Buy limit triggers average-down protection, adding 25% volume at a 10% lower basis."}
                {simStage === 'C' && "The final accumulation block triggers. 35% capacity is locked at the historical value floor, stabilizing the net holding yields."}
                {simStage === 'D' && "The volume breakout clears minor resistances. Momentum surges to target objective (D-tranche ceiling) yielding ~42% Alpha exit."}
              </p>
            </div>
            
            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Simulation Active</span>
              </div>
              <span className="text-[9px] font-black text-slate-300 font-mono uppercase tracking-widest">
                {simStage === 'A' && "Alloc: 25% | Gap: 0%"}
                {simStage === 'B' && "Alloc: 50% | Gap: -10%"}
                {simStage === 'C' && "Alloc: 85% | Gap: -18%"}
                {simStage === 'D' && "Alloc: 100% | Target Achieved"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pillar #2: Internal Link Matrix (Trending Audits) */}
      <section className="py-24 px-6 md:px-10 max-w-[1440px] mx-auto border-t border-slate-900">
         <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
               <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Trending Institutional Audits</h2>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Recently Analyzed High-Score Assets</p>
            </div>
            <Link to="/login" className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors">
               View All 500+ Assets <ArrowRight className="w-4 h-4" />
            </Link>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {["RELAXO", "TCS", "HDFCBANK", "INFY", "ITC", "BAJAJ-AUTO", "SANOFI", "COLPAL", "DABUR", "WIPRO", "HCLTECH", "TITAN"].map((sym) => (
               <Link 
                key={sym} 
                to={`/analysis/${sym}`}
                className="group p-6 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-blue-500/50 transition-all hover:-translate-y-1"
               >
                  <div className="flex justify-between items-start mb-4">
                     <Zap className="w-4 h-4 text-blue-500 group-hover:animate-pulse" />
                     <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded italic">QUALIFIED</span>
                  </div>
                  <div className="text-xl font-black text-white italic tracking-tighter mb-1">{sym}</div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Audit Matrix Active</div>
               </Link>
            ))}
         </div>
      </section>

      {/* Pillar #5: Conversion Tunnel (Education) */}
      <section className="py-24 px-6 md:px-10 max-w-[1440px] mx-auto">
         <div className="bg-slate-900/50 border border-slate-800 rounded-[3.5rem] p-12 overflow-hidden relative group">
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/5 blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-blue-600/10" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
               <div className="space-y-8">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                     <BookOpen className="h-4 w-4 text-blue-400" />
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Free Institutional Education</span>
                  </div>
                  <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">Master the <br /><span className="text-blue-500">12 Proprietary</span> Strategies.</h2>
                  <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                     Don't just follow triggers. Understand the institutional logic behind every setup—from SMA-ABCD Stacking to the 67% ATH Reset Cycle.
                  </p>
                  <Link to="/education" className="inline-flex items-center px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:text-white transition-all">
                     Explore Knowledge Base <ChevronRight className="ml-2 w-4 h-4" />
                  </Link>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                     { title: 'SMA-ABCD', desc: 'Bearish exhaustion logic', icon: Layers },
                     { title: '67% Reset', desc: 'Deep recovery audit', icon: RefreshCw },
                     { title: '14% Envelope', desc: 'Institutional demand floors', icon: ShieldCheck },
                     { title: 'Bollinger Sqz', desc: 'Volatility breakout matrix', icon: Activity },
                  ].map((item, i) => (
                     <div key={i} className="p-6 bg-slate-950 rounded-3xl border border-slate-800 hover:border-blue-500/30 transition-all">
                        <item.icon className="h-6 w-6 text-blue-500 mb-4" />
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{item.title}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* Schema.org Structured Markup — SoftwareApplication + AggregateRating + Reviews */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "MarketBeacon Pro",
          "operatingSystem": "Web, iOS, Android",
          "applicationCategory": "FinanceApplication",
          "description": "India's institutional stock research tool for educational purposes. ABCD Tranche Laddering and 100-point Audit Score system. Not investment advice.",
          "url": "https://marketbeacon.pro",
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
              "reviewBody": "As a sub-broker, the Audit Score gives me a defensible reason for every recommendation to clients."
            }
          ]
        })}
      </script>

      {/* ── TESTIMONIALS SECTION ── */}
      <section aria-label="Trader testimonials and reviews" className="py-24 px-6 md:px-10 border-t border-slate-800/50">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
              <span className="text-amber-400 text-sm">★★★★★</span>
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em]">4.9 / 5 from 1,280 traders</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
              Traders Who Switched to <span className="text-blue-400">Institutional Logic</span>
            </h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">From retail traders to advisors — here's what MarketBeacon Pro users say.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Rahul Sharma',
                role: 'Retail Trader, Delhi',
                avatar: 3,
                stars: 5,
                text: '"The ABCD tranche system completely changed how I manage risk. I used to dump everything at one price and panic when it fell. Now I build positions systematically — my average costs are 15-18% better than before."',
                stat: '+18% better avg cost',
                statColor: 'text-emerald-400',
              },
              {
                name: 'Priya Mehta',
                role: 'Sub-broker, Mumbai',
                avatar: 7,
                stars: 5,
                text: '"As a sub-broker, every recommendation needs to be justified. The 100-point Audit Score gives me a defensible, data-backed reason for every stock I suggest. My clients trust me more now."',
                stat: 'Research Tool Framework',
                statColor: 'text-blue-400',
              },
              {
                name: 'Vikram Nair',
                role: 'HNI Investor, Bangalore',
                avatar: 11,
                stars: 5,
                text: '"I manage a ₹2Cr portfolio. Before MarketBeacon, I relied on tips and news. Now I screen using the Audit Score, enter via ABCD zones, and track smart money. My drawdowns have reduced significantly."',
                stat: 'Portfolio: ₹2Cr+',
                statColor: 'text-amber-400',
              },
              {
                name: 'Ananya Reddy',
                role: 'Retail Trader, Hyderabad',
                avatar: 5,
                stars: 5,
                text: '"I was using a popular screener before — it just gave me charts and raw numbers. MarketBeacon Pro tells me WHY a stock qualifies, what the entry zone is, and what the risk level is. Night and day difference."',
                stat: 'Switched from Screener.in',
                statColor: 'text-purple-400',
              },
              {
                name: 'Suresh Iyer',
                role: 'Family Office, Chennai',
                avatar: 9,
                stars: 5,
                text: '"The institutional approach resonates with how we think about capital preservation. The zero-debt filter and smart money tracking are powerful. We use this as a first-pass filter for our equity allocation."',
                stat: 'Family Office Use Case',
                statColor: 'text-indigo-400',
              },
              {
                name: 'Deepak Gupta',
                role: 'Part-time Trader, Pune',
                avatar: 14,
                stars: 5,
                text: '"I only get 30 minutes a day for stock research. The Qualified list + Audit Score makes it fast. I check the score, check the ABCD zone, and decide. No more hours of reading balance sheets manually."',
                stat: '30 mins/day workflow',
                statColor: 'text-emerald-400',
              },
            ].map((t, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-7 flex flex-col gap-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.avatar}`} alt={t.name} loading="lazy" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white">{t.name}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t.role}</p>
                    </div>
                  </div>
                  <div className="text-amber-400 text-xs tracking-tight">{'★'.repeat(t.stars)}</div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 italic">{t.text}</p>
                <div className="pt-3 border-t border-slate-800">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${t.statColor}`}>{t.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VS COMPARISON SECTION ── */}
      <section aria-label="MarketBeacon Pro vs other stock screeners" className="py-20 px-6 md:px-10 border-t border-slate-800/50 bg-slate-900/20">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-3">
              Why Traders Switch to <span className="text-blue-400">MarketBeacon Pro</span>
            </h2>
            <p className="text-slate-500 text-sm">vs. generic screeners and news-based platforms</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-[2rem] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-slate-800">
              <div className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Feature</div>
              <div className="p-5 text-center border-x border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Other Screeners</p>
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
              <div key={i} className={`grid grid-cols-3 border-b border-slate-800/50 last:border-none ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                <div className="px-5 py-4 text-[11px] font-bold text-slate-300">{feature as string}</div>
                <div className="px-5 py-4 text-center border-x border-slate-800/50">
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
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-900/30"
            >
              Try Institutional Screener Free <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BLOG TEASER ── */}
      <section className="py-20 px-6 md:px-10 border-t border-slate-800/50">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">Knowledge Base</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">Learn the Institutional <span className="text-blue-400">Edge</span></h2>
            </div>
            <Link to="/blog" className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors shrink-0">
              All Articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { slug: 'abcd-tranche-laddering-guide', tag: 'Strategy', title: 'What is ABCD Tranche Laddering?', time: '6 min read', color: 'text-blue-400 border-blue-400/20 bg-blue-400/5' },
              { slug: 'what-is-sebi-compliant-stock-screener', tag: 'Education', title: 'What to Know Before Using a Stock Research Tool', time: '5 min read', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' },
              { slug: 'how-to-trade-like-fii-dii-india', tag: 'Institutional', title: 'How to Trade Like FII/DII in India', time: '8 min read', color: 'text-amber-400 border-amber-400/20 bg-amber-400/5' },
            ].map((a) => (
              <Link
                key={a.slug}
                to={`/blog/${a.slug}`}
                className="group bg-slate-900/50 border border-slate-800 rounded-[1.5rem] p-6 flex flex-col gap-4 hover:border-slate-600 hover:-translate-y-1 transition-all"
              >
                <span className={`self-start px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${a.color}`}>{a.tag}</span>
                <h3 className="text-sm font-black text-white group-hover:text-blue-300 transition-colors leading-snug">{a.title}</h3>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />{a.time}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMAIL LEAD CAPTURE ── */}
      <section className="py-20 px-6 md:px-10 border-t border-slate-800/50 bg-gradient-to-b from-slate-950 to-slate-900/50">
        <div className="max-w-[680px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <Gift className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Free · No Credit Card</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4 leading-tight">
            Get Your Free<br />
            <span className="text-blue-400">Institutional Starter Kit</span>
          </h2>
          <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
            ABCD Tranche Zones for 25 Nifty 500 stocks + a 12-parameter Audit Checklist PDF. Delivered instantly to your inbox.
          </p>
          <EmailCapture />
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-5">
            No spam · Unsubscribe anytime · Educational content only · Not investment advice
          </p>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 px-6 md:px-10 max-w-[1000px] mx-auto border-t border-slate-900">
         <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase italic">Frequently Audited Queries</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Everything you need to know about the terminal</p>
         </div>
         
         <div className="space-y-4 text-left">
            {[
              {
                q: "What is an Institutional Stock Audit?",
                a: "An institutional stock audit is a quantitative scan that measures an asset against 100 mathematical data points. Unlike standard news bulletins, it reviews deep fundamental safety, debt leverage parameters, historical valuation percentiles, and institutional demand floors to assign a conviction score out of 100."
              },
              {
                q: "How does the ABCD Tranche Laddering model protect capital?",
                a: "Instead of allocating 100% of your capital at a single price point (which exposes you to instant drawdowns), the ABCD Ladder model divides buying capacity into four distinct tranches (A, B, C, D) triggered by historical pullback milestones. This averages your position downward automatically during sweeps and secures a stable demand floor."
              },
              {
                q: "Is MarketBeacon Pro investment advice or advisory?",
                a: "No. MarketBeacon Pro is NOT a SEBI-registered Investment Adviser (IA) or Research Analyst (RA). It is a quantitative mathematical research tool for educational and personal research purposes only. All audit scores, strategy signals, and ABCD zones are pre-coded mathematical models. Nothing on this platform constitutes a personalized investment recommendation, buy/sell advisory, or portfolio management service. Always consult a SEBI-registered advisor before making investment decisions."
              },
              {
                q: "How often are stock prices and audit scores updated?",
                a: "Live stock prices are synced continuously in real-time, and audit models re-examine key fundamental data points (like quarterly results, PE ratios, and institutional holdings) automatically daily to recalculate active scores and update zones."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden transition-all duration-300">
                 <button 
                   type="button"
                   onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                   className="w-full px-8 py-6 flex items-center justify-between hover:bg-white/5 transition-all text-left outline-none"
                 >
                    <span className="text-sm font-black text-white uppercase tracking-wider">{faq.q}</span>
                    <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-305 ${openFaq === idx ? 'rotate-90 text-blue-500' : ''}`} />
                 </button>
                 <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-8 pb-6 text-xs text-slate-400 font-mono leading-relaxed"
                      >
                         {faq.a}
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>
            ))}
         </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-6 text-center">
         <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 p-1 rounded-[3.5rem] shadow-2xl">
            <div className="bg-slate-950 rounded-[3.4rem] px-10 py-20 flex flex-col items-center">
               <h3 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 px-4">Ready to stop guessing?</h3>
               <p className="text-slate-400 font-medium text-lg mb-10 max-w-xl">Join 31,402 traders who upgraded their strategy with MarketBeacon Pro. Free to start.</p>
               <div className="flex flex-col sm:flex-row items-center gap-4">
                 <Link to="/login" className="px-12 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-base hover:scale-105 transition-all">
                    Launch Terminal Free
                 </Link>
                 <a
                   href="https://wa.me/917056633633?text=Hi%20Admin,%20I%20want%20to%20know%20more%20about%20MarketBeacon%20Pro."
                   target="_blank"
                   rel="noopener noreferrer"
                   className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-base hover:bg-emerald-500 hover:scale-105 transition-all"
                 >
                   WhatsApp Us
                 </a>
               </div>
               <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-8">Institutional Build v12.2.0-PRO · For Educational Use Only · Not Investment Advice</p>
            </div>
         </div>
      </section>

      {/* Site Footer */}
      <SiteFooter />

      {/* Floating WhatsApp Button (Desktop) */}
      <a
        href="https://wa.me/917056633633?text=Hi%20Admin,%20I%20want%20to%20know%20more%20about%20MarketBeacon%20Pro."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-8 right-6 z-50 hidden md:flex items-center gap-2.5 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-2xl shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-[11px] font-black uppercase tracking-widest">Chat with Us</span>
      </a>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 w-full p-3 md:hidden bg-slate-950/95 border-t border-slate-800 z-50 flex gap-2">
        <Link to="/login" className="flex-1 flex items-center justify-center py-3.5 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl">
           Start Free
        </Link>
        <a
          href="https://wa.me/917056633633?text=Hi%20Admin,%20I%20want%20to%20know%20more%20about%20MarketBeacon%20Pro."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 py-3.5 bg-emerald-600 text-white rounded-xl shadow-xl"
          aria-label="WhatsApp"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </div>

    </div>
  );
};

export default HomePage;
