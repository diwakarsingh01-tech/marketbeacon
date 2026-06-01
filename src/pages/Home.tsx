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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';

import { BASKETS } from '../data/stocks';

const API_URL = getApiUrl();

const HomePage: React.FC = () => {
  const [searchQuery, setSearchSearchQuery] = useState('');
  const [teaserData, setTeaserData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
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

  const handleSearch = async (e?: React.FormEvent, symbolOverride?: string) => {
    if (e) e.preventDefault();
    const finalQuery = symbolOverride || searchQuery;
    if (!finalQuery) return;
    
    const upQuery = finalQuery.toUpperCase();
    setSearchSearchQuery(upQuery);
    setSuggestions([]);
    setIsSearching(true);
    setTeaserData(null);
    
    try {
      const res = await fetch(`${API_URL}/api/public/analysis/${upQuery}`);
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        setTeaserData(data);
      } else {
        setTeaserData(null);
        alert(`Institutional Alert: Symbol "${searchQuery.toUpperCase()}" not found in current node snapshot.`);
      }
    } catch (e) {
      console.error("Audit Search Error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    document.title = "MarketBeacon Pro | Institutional Trading Terminal";
    const metaDescription = document.createElement('meta');
    metaDescription.name = "description";
    metaDescription.content = "Join 30,000+ traders using MarketBeacon Pro. Professional institutional-grade stock research powered by 12 proprietary models and Batch-9 fundamental audit.";
    document.head.appendChild(metaDescription);
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
        <div className="flex items-center space-x-2">
           <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Activity className="h-6 w-6" />
           </div>
           <span className="text-xl font-black tracking-tighter uppercase italic">MarketBeacon<span className="text-blue-500">Pro</span></span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
           <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">31,402 Active Traders</span>
           </div>
           <Link to="/login" className="px-6 py-2.5 bg-white text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Launch Terminal</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-64 pb-32 px-6 md:px-10 max-w-[1440px] mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-950/50 backdrop-blur-sm rounded-full border border-blue-900 mb-10">
           <ShieldCheck className="h-4 w-4 text-blue-400" />
           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">v11.6 Institutional Growth Matrix</span>
        </div>
        
        <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter leading-[0.85] text-white mb-10 drop-shadow-2xl">
           TRADE LIKE <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">SMART MONEY.</span>
        </h1>

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
                           <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-[8px] font-black text-blue-400 uppercase tracking-widest italic">Live Node</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Institutional 100-Point Audit Results</p>
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
                        <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                           <stat.icon className="h-4 w-4 text-blue-500 mb-2" />
                           <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                           <p className="text-sm font-black text-white italic">{stat.val}</p>
                        </div>
                      ))}
                   </div>

                   <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {teaserData.strategies?.map((s: any, i: number) => (
                           <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[8px] font-black text-emerald-400 uppercase tracking-widest">{s.name}</span>
                        ))}
                      </div>
                      <Link 
                        to={`/analysis/${teaserData.symbol}`}
                        className="flex items-center gap-2 text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase tracking-widest"
                      >
                        Full Strategy Matrix <ArrowUpRight className="h-4 w-4" />
                      </Link>
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
        
        <p className="text-xl md:text-2xl font-medium text-slate-400 max-w-3xl mx-auto leading-relaxed mb-16 px-4">
           The same proprietary 100-point audits and mathematical models used by institutional desks, now accessible to you.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Link to="/login" className="w-full md:w-auto inline-flex items-center px-12 py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-blue-500 hover:scale-105 transition-all shadow-2xl shadow-blue-900/40">
             Get Instant Access
          </Link>
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-950 bg-slate-800 overflow-hidden shadow-xl">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" />
              </div>
            ))}
            <div className="w-12 h-12 rounded-full border-4 border-slate-950 bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
              +30K
            </div>
          </div>
        </div>
      </header>

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

      {/* CTA Footer */}
      <section className="py-32 px-6 text-center">
         <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 p-1 rounded-[3.5rem] shadow-2xl">
            <div className="bg-slate-950 rounded-[3.4rem] px-10 py-20 flex flex-col items-center">
               <h3 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 px-4">Ready to stop guessing?</h3>
               <p className="text-slate-400 font-medium text-lg mb-12 max-w-xl">Join the 31,402 traders who have upgraded their strategy with MarketBeacon Pro.</p>
               <Link to="/login" className="px-16 py-6 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-lg hover:scale-105 transition-all">
                  Launch Terminal Now
               </Link>
               <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-10">Institutional Build v12.2.0-PRO</p>
            </div>
         </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 w-full p-4 md:hidden bg-slate-950 border-t border-slate-800 z-50">
        <Link to="/login" className="w-full flex items-center justify-center py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl">
           Start Your Trial
        </Link>
      </div>

    </div>
  );
};

export default HomePage;
