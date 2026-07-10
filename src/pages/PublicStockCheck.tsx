import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BrandLogo from '../components/brand/BrandLogo';
import { Search, ArrowRight, Activity, ShieldAlert, Target, ChevronRight, Sparkles } from 'lucide-react';
import SEO from '../components/SEO';
import { BASKETS } from '../data/stocks';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import type { StockSearchResult } from '../types';

const ALL_STOCKS = Array.from(new Set(Object.values(BASKETS).flat())).sort();
const API_URL = getApiUrl();

const PublicStockCheck: React.FC = () => {
  const [symbol, setSymbol] = useState('');
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Auto-redirect if URL has query parameters (e.g. ?symbol=INFY or ?s=INFY)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const symParam = params.get('symbol') || params.get('s');
    if (symParam && symParam.trim()) {
      const cleanSym = symParam.trim().toUpperCase().replace('.NS', '');
      navigate(`/analysis/${cleanSym}`, { replace: true });
    }
  }, [navigate]);

  // Handle clicks outside suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, []);

  const onSearchChange = (val: string) => {
    setSymbol(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${API_URL}/api/search/stock?q=${encodeURIComponent(val)}`, { signal: controller.signal });
          clearTimeout(timeout);
          const data = await safeJsonParse(res);
          if (res.ok && data?.results) {
            setSuggestions(data.results.slice(0, 8));
            setSelectedIndex(0);
            setShowSuggestions(true);
            return;
          }
        } catch {}
        
        // Local fallback filter
        const local = ALL_STOCKS.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
        if (local.length > 0) {
          setSuggestions(local.map(s => ({ symbol: s, baskets: [], strategies: [], price: 0, change: 0, peMedians: {} })));
          setSelectedIndex(0);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 200);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e?: React.FormEvent, symbolOverride?: string) => {
    if (e) e.preventDefault();
    const finalSym = symbolOverride || symbol;
    if (!finalSym.trim()) return;
    const cleanSym = finalSym.trim().toUpperCase().replace('.NS', '');
    setSymbol(cleanSym);
    setShowSuggestions(false);
    navigate(`/analysis/${cleanSym}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        handleSearch(undefined, suggestions[selectedIndex].symbol);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const trendingStocks = ['INFY', 'RELIANCE', 'TCS', 'HDFCBANK', 'TATAMOTORS', 'SBIN'];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 font-sans flex flex-col justify-between">
      <SEO 
        title="Free Institutional Stock Audit Scanner" 
        description="Verify any Indian stock ticker (NSE/BSE) to reveal its institutional health score, ownership matrix analysis, and breakout strategy metrics." 
        url="/check" 
      />

      {/* Decorative Glow Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[5%] w-[45%] h-[40%] bg-cyan-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[45%] h-[40%] bg-indigo-900/5 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <header className="border-b border-white/5 bg-[#0f172a]/40 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center transition-all hover:opacity-90 active:scale-95">
            <BrandLogo variant="dark" size={28} />
          </Link>
          <Link 
            to="/login" 
            className="px-6 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl text-xs font-bold text-white uppercase tracking-wider transition-all hover:bg-white/10"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center text-center space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-cyan-500/10 rounded-full border border-cyan-500/20 mb-4">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]" />
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Free Audit Tool</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter leading-none">
            INSTITUTIONAL <span className="text-cyan-500">AUDIT SCANNER.</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-2xl mx-auto tracking-wide">
            Type any NSE/BSE stock ticker (e.g. INFY, RELIANCE) to run a 100-point structural health audit and evaluate institutional accumulation levels.
          </p>
        </div>

        {/* Search Bar with Autocomplete Dropdown */}
        <div className="w-full max-w-2xl relative" ref={suggestionsRef}>
          <form onSubmit={(e) => handleSearch(e)} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-all duration-300" />
            <div className="relative flex items-center bg-[#0b0f19] border border-white/10 rounded-3xl p-2.5 shadow-2xl">
              <Search className="w-6 h-6 text-slate-500 ml-4 shrink-0" />
              <input 
                type="text" 
                value={symbol}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stock symbol... (e.g. RELIANCE)" 
                className="w-full bg-transparent border-0 outline-none text-white px-4 py-3 placeholder:text-slate-650 text-base font-bold uppercase tracking-wider focus-visible:ring-0 focus-visible:outline-none"
              />
              <button 
                type="submit"
                className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-450 text-[#020617] rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shrink-0"
              >
                Scan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown List */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-3 bg-[#0d1324]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-left divide-y divide-white/5 max-h-72 overflow-y-auto no-scrollbar">
              {suggestions.map((item, idx) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSearch(undefined, item.symbol)}
                  className={`w-full px-6 py-4 flex items-center justify-between transition-all outline-none text-left ${
                    idx === selectedIndex 
                      ? 'bg-cyan-500/10 text-cyan-400 border-l-[4px] border-cyan-500 pl-5' 
                      : 'text-slate-350 hover:bg-white/[0.02] hover:text-white border-l-[4px] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black tracking-wider uppercase text-sm">{item.symbol}</span>
                    {item.baskets && item.baskets.length > 0 && (
                      <span className="px-2 py-0.5 bg-slate-900 border border-white/5 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {item.baskets[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.price > 0 && (
                      <span className="text-xs font-bold text-slate-500">₹{item.price.toFixed(2)}</span>
                    )}
                    <ChevronRight className={`w-4 h-4 transition-transform ${idx === selectedIndex ? 'translate-x-1 text-cyan-400' : 'text-slate-650'}`} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trending Stock Badges */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Popular Scans</span>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {trendingStocks.map((sym) => (
              <button 
                key={sym}
                onClick={() => navigate(`/analysis/${sym}`)}
                className="px-4 py-2 bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-slate-400 hover:text-cyan-400 rounded-xl text-xs font-bold transition-all hover:scale-[1.03] active:scale-95"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Marketing Campaigns Section */}
        <div className="w-full max-w-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-white/5 rounded-3xl p-6 text-left space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Active Promotional Channels</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Promo 1: Telegram Channel */}
            <div className="p-4 bg-[#080d1a]/60 border border-white/5 rounded-2xl flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest block mb-1">Telegram Community Bot</span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Group Ticker Audit</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Query real-time stock audits inside our community channel using the `/audit {"<ticker>"}` command.
                </p>
              </div>
              <a 
                href="https://t.me/+bANpkxNzTvdmYmI9" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1 mt-2 w-max"
              >
                Join Channel <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Promo 2: Weekly Newsletter Wrap */}
            <div className="p-4 bg-[#080d1a]/60 border border-white/5 rounded-2xl flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Weekly Market Wrap</span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Friday Breakout newsletter</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Receive the top 5 high-momentum breakout corridors and structural summaries delivered post-market close.
                </p>
              </div>
              <Link 
                to="/login"
                className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1 mt-2 w-max"
              >
                Subscribe Now <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Marketing Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl pt-10 border-t border-white/5">
          <div className="flex flex-col items-center p-6 bg-white/[0.01] rounded-2xl border border-white/[0.03]">
            <Activity className="w-8 h-8 text-cyan-400 mb-3" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Momentum Tracking</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Instantly verify if a stock has entered high-momentum buy corridors.</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white/[0.01] rounded-2xl border border-white/[0.03]">
            <ShieldAlert className="w-8 h-8 text-rose-450 mb-3" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Risk Evaluation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Check historical debt-to-equity and operational constraints.</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white/[0.01] rounded-2xl border border-white/[0.03]">
            <Target className="w-8 h-8 text-indigo-400 mb-3" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Target objectives</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Calculate mathematical projections and entry tranche guidelines.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center px-6 relative z-10 bg-[#020617]/80">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-relaxed max-w-xl mx-auto italic">
          MarketBeacon Pro is a quantitative research platform. We are NOT SEBI-registered advisers.
          All audit scores are generated via pre-programmed mathematical models.
        </p>
      </footer>
    </div>
  );
};

export default PublicStockCheck;
