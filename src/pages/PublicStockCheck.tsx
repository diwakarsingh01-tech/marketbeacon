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
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col justify-between">
      <SEO 
        title="Free Institutional Stock Audit Scanner" 
        description="Verify any Indian stock ticker (NSE/BSE) to reveal its institutional health score, ownership matrix analysis, and breakout strategy metrics." 
        url="/check" 
      />

      {/* Subtle background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[5%] w-[45%] h-[40%] bg-[#00d09c]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[45%] h-[40%] bg-emerald-100/30 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center transition-all hover:opacity-90 active:scale-95">
            <BrandLogo variant="light" size={28} />
          </Link>
          <Link 
            to="/login" 
            className="px-6 py-2.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#00d09c]/20"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center text-center space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-[#00d09c]/10 rounded-full border border-[#00d09c]/20 mb-4">
            <span className="w-1.5 h-1.5 bg-[#00d09c] rounded-full" />
            <span className="text-xs font-bold text-[#00d09c] uppercase tracking-wider">Free Audit Tool</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 italic tracking-tighter leading-none">
            INSTITUTIONAL <span className="text-[#00d09c]">AUDIT SCANNER.</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium max-w-2xl mx-auto tracking-wide">
            Type any NSE/BSE stock ticker (e.g. INFY, RELIANCE) to run a 100-point structural health audit and evaluate institutional accumulation levels.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-2xl relative" ref={suggestionsRef}>
          <form onSubmit={(e) => handleSearch(e)} className="relative">
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-2 shadow-md focus-within:border-[#00d09c] focus-within:ring-2 focus-within:ring-[#00d09c]/10 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input 
                type="text" 
                value={symbol}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stock symbol... (e.g. RELIANCE)" 
                className="w-full bg-transparent border-0 outline-none text-slate-800 px-4 py-3 placeholder:text-slate-300 text-base font-bold uppercase tracking-wider focus-visible:ring-0"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shrink-0 shadow-md"
              >
                Scan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden text-left divide-y divide-slate-50 max-h-72 overflow-y-auto no-scrollbar">
              {suggestions.map((item, idx) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSearch(undefined, item.symbol)}
                  className={`w-full px-5 py-3.5 flex items-center justify-between transition-all outline-none text-left ${
                    idx === selectedIndex 
                      ? 'bg-[#00d09c]/5 text-[#00d09c] border-l-[3px] border-[#00d09c] pl-4' 
                      : 'text-slate-600 hover:bg-slate-50 border-l-[3px] border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-black tracking-wider uppercase text-sm">{item.symbol}</span>
                    {item.baskets && item.baskets.length > 0 && (
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.baskets[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.price > 0 && (
                      <span className="text-xs font-bold text-slate-400">₹{item.price.toFixed(2)}</span>
                    )}
                    <ChevronRight className={`w-4 h-4 transition-transform ${idx === selectedIndex ? 'translate-x-1 text-[#00d09c]' : 'text-slate-300'}`} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trending Stock Badges */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Popular Scans</span>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {trendingStocks.map((sym) => (
              <button 
                key={sym}
                onClick={() => navigate(`/analysis/${sym}`)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 hover:border-[#00d09c]/40 hover:bg-[#00d09c]/5 text-slate-500 hover:text-[#00d09c] rounded-xl text-xs font-bold transition-all hover:scale-[1.03] active:scale-95"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Marketing Campaigns Section */}
        <div className="w-full max-w-2xl bg-gradient-to-r from-[#00d09c]/5 via-emerald-50 to-[#00d09c]/5 border border-[#00d09c]/15 rounded-3xl p-6 text-left space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00d09c]" />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Active Promotional Channels</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Promo 1: Telegram Channel */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between space-y-2 shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-[#00d09c] uppercase tracking-widest block mb-1">Telegram Community Bot</span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Group Ticker Audit</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Query real-time stock audits inside our community channel using the `/audit {"<ticker>"}` command.
                </p>
              </div>
              <a 
                href="https://t.me/+bANpkxNzTvdmYmI9" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-black text-[#00d09c] hover:text-[#00bda0] uppercase tracking-wider flex items-center gap-1 mt-2 w-max"
              >
                Join Channel <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Promo 2: Weekly Newsletter Wrap */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between space-y-2 shadow-sm">
              <div>
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Weekly Market Wrap</span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Friday Breakout newsletter</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Receive the top 5 high-momentum breakout corridors and structural summaries delivered post-market close.
                </p>
              </div>
              <Link 
                to="/login"
                className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-wider flex items-center gap-1 mt-2 w-max"
              >
                Subscribe Now <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl pt-10 border-t border-slate-100">
          <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <Activity className="w-8 h-8 text-[#00d09c] mb-3" />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Momentum Tracking</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Instantly verify if a stock has entered high-momentum setup corridors.</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <ShieldAlert className="w-8 h-8 text-rose-400 mb-3" />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Risk Evaluation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Check historical debt-to-equity and operational constraints.</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <Target className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">Target Objectives</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Calculate mathematical projections and entry tranche guidelines.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100 text-center px-6 relative z-10 bg-white">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-xl mx-auto italic">
          MarketBeacon Pro is a quantitative research platform. We are NOT SEBI-registered advisers.
          All audit scores are generated via pre-programmed mathematical models.
        </p>
      </footer>
    </div>
  );
};

export default PublicStockCheck;
