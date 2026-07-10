import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BrandLogo from '../components/brand/BrandLogo';
import { Search, ArrowRight, Activity, ShieldAlert, Target } from 'lucide-react';
import SEO from '../components/SEO';

const PublicStockCheck: React.FC = () => {
  const [symbol, setSymbol] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    const cleanSym = symbol.trim().toUpperCase().replace('.NS', '');
    navigate(`/analysis/${cleanSym}`);
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

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-all duration-300" />
            <div className="relative flex items-center bg-[#0b0f19] border border-white/10 rounded-3xl p-2.5 shadow-2xl">
              <Search className="w-6 h-6 text-slate-500 ml-4 shrink-0" />
              <input 
                type="text" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="Search stock symbol... (e.g. RELIANCE)" 
                className="w-full bg-transparent border-0 outline-none text-white px-4 py-3 placeholder:text-slate-650 text-base font-bold uppercase tracking-wider"
              />
              <button 
                type="submit"
                className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-450 text-[#020617] rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shrink-0"
              >
                Scan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

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
