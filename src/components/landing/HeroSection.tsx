import React from 'react';
import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  X,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  BadgeCheck,
  ArrowUpRight,
  Zap,
  Layers,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { waLink } from '../../lib/constants';
import type { StockSearchResult } from '../../types';

interface HeroSectionProps {
  searchQuery: string;
  setSearchSearchQuery: (val: string) => void;
  suggestions: StockSearchResult[];
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  isSearching: boolean;
  searchError: string | null;
  handleSearch: (e?: React.FormEvent, symbolOverride?: string) => void;
  handleReset: () => void;
  teaserData: any;
  isProOrAbove: boolean;
  user: any;
  voucherCode: string;
  setVoucherCode: (val: string) => void;
  setVoucherError: (val: string | null) => void;
  redeeming: boolean;
  handleRedeemVoucher: () => void;
  voucherError: string | null;
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  suggestionsRef: RefObject<HTMLDivElement | null>;
  setShowUpgrade: (val: boolean) => void;
  setSuggestions: React.Dispatch<React.SetStateAction<StockSearchResult[]>>;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchSearchQuery,
  suggestions,
  selectedIndex,
  setSelectedIndex,
  isSearching,
  searchError,
  handleSearch,
  handleReset,
  teaserData,
  isProOrAbove,
  user,
  voucherCode,
  setVoucherCode,
  redeeming,
  handleRedeemVoucher,
  voucherError,
  setVoucherError,
  itemRefs,
  suggestionsRef,
  setShowUpgrade,
  setSuggestions,
}) => {
  return (
    <>
      <header className="pt-20 md:pt-28 pb-16 px-6 md:px-10 max-w-[1200px] mx-auto text-center relative bg-white">
        {/* Rebranded Title & Headline */}
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#0f172a] leading-tight mb-4">
            All things investing,{' '}<br className="sm:hidden" />
            <span className="text-[#00d09c]">simplified.</span>
          </h1>
          <p className="text-sm md:text-lg text-slate-500 font-medium max-w-2xl mx-auto">
            Get instant 100-point fundamental audits, institutional <span className="font-bold text-slate-700">FII/DII</span> tracking, and smart entry zones for Nifty 500 stocks.
          </p>
        </div>

        {/* Center Search Bar — Clean, Large, Rounded */}
        <div id="search-anchor" className="max-w-2xl mx-auto mb-8 md:mb-10 relative group">
          <form 
            onSubmit={(e) => handleSearch(e)} 
            className="flex flex-col sm:flex-row p-1.5 md:p-2 bg-white border-2 border-slate-200 rounded-[1.25rem] sm:rounded-[2.5rem] focus-within:border-[#00d09c] transition-all shadow-lg hover:shadow-xl relative gap-1.5 sm:gap-0 duration-300"
          >
            <div className="flex-1 flex items-center pl-3 md:pl-6 gap-2 md:gap-3 py-1.5 md:py-0">
              <div className="relative">
                <Search className="w-4 h-4 md:w-5 md:h-5 text-slate-400 group-focus-within:text-[#00d09c] transition-colors shrink-0" />
                {searchQuery && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#00d09c] rounded-full animate-pulse" />
                )}
              </div>
              <input 
                type="text" 
                placeholder="Search stocks (e.g. TCS, RELIANCE, HDFCBANK)..." 
                className="bg-transparent border-none outline-none focus-visible:ring-0 w-full text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-800 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => {
                  setSearchSearchQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (suggestions.length === 0) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => {
                      const next = prev < suggestions.length - 1 ? prev + 1 : 0;
                      itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
                      return next;
                    });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => {
                      const next = prev > 0 ? prev - 1 : suggestions.length - 1;
                      itemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
                      return next;
                    });
                  } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault();
                    handleSearch(undefined, suggestions[selectedIndex].symbol);
                  } else if (e.key === 'Escape') {
                    setSuggestions([]);
                    setSelectedIndex(-1);
                  }
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="search"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Clear search"
                  className="p-1 md:p-2 mr-1 md:mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              )}
            </div>
            <button 
              type="submit" 
              disabled={isSearching} 
              aria-label="Run Audit"
              className="shrink-0 mr-1 w-10 h-10 sm:w-11 sm:h-11 bg-[#00d09c] hover:bg-[#00bda0] disabled:opacity-60 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#00d09c]/25 duration-200"
            >
              {isSearching ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Suggestions Dropdown — Clean Light Theme */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                ref={suggestionsRef}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 w-full mt-3 bg-white border border-slate-200 rounded-3xl overflow-hidden z-[999] shadow-xl text-left"
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={item.symbol}
                    ref={el => { itemRefs.current[idx] = el; }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSearch(undefined, item.symbol)}
                    className={`w-full px-6 py-4 flex items-center justify-between transition-colors border-b border-slate-100 last:border-none group ${idx === selectedIndex ? 'bg-slate-55 bg-slate-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-[#00d09c] group-hover:animate-pulse" />
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">{item.symbol}</span>
                      </div>
                      
                      <div className="hidden sm:flex items-center gap-2">
                        {(item.strategies || []).length > 0 ? (
                          (item.strategies || []).slice(0, 2).map((s: any, idx: number) => (
                            <span key={idx} className="px-2.5 py-0.5 bg-emerald-50 text-xs font-bold text-[#00d09c] rounded-full border border-[#00d09c]/15">
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider italic">Monitoring Node</span>
                        )}
                        {(item.strategies || []).length > 2 && (
                          <span className="text-xs font-bold text-slate-400">+{(item.strategies || []).length - 2}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-[#00d09c]">Audit Node</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {searchError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-5 bg-rose-5 border border-rose-100 rounded-3xl text-left flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-rose-100 rounded-xl">
                    <X className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">{searchError}</p>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">We only audit Nifty 500 & Alpha 40 symbols currently.</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(waLink(`Request Symbol: ${searchQuery}`), '_blank')}
                  className="px-6 py-2 bg-white text-slate-700 text-caption rounded-xl border border-slate-200 hover:bg-rose-500 hover:text-white hover:border-transparent transition-all whitespace-nowrap"
                >
                  Request Addition
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>



        {/* Live Teaser / Search Result Audit Card — Redesigned in well manner */}
        <div className="max-w-2xl mx-auto mb-12">
          <AnimatePresence>
            {teaserData && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-white border-2 border-slate-200 rounded-[2.5rem] shadow-xl text-left relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#00d09c] font-black text-lg border border-[#00d09c]/20 shadow-inner shrink-0">
                      {teaserData.symbol?.[0]}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{teaserData.symbol}</h3>
                        <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {teaserData.basket}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-[#00d09c]" />
                        <span className="text-[10px] font-bold text-[#00d09c] uppercase tracking-wider">Fundamentals Audit Certified</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right sm:shrink-0 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">CONVICTION RATING</span>
                    <span className="text-sm font-black text-[#00d09c] uppercase tracking-wider">
                      {isProOrAbove ? (teaserData.score >= 80 ? 'HIGH CONVICTION' : 'STABLE PASS') : 'PRO ONLY'}
                    </span>
                  </div>
                </div>

                {/* Score slider indicator */}
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span>Fundamental Safety Conviction</span>
                      <span className="text-[#00d09c] font-black text-base">{isProOrAbove ? `${(teaserData.score || 0).toFixed(0)}/100` : '🔒'}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200/60 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00d09c] to-[#00bda0] transition-all duration-1000 rounded-full" 
                        style={{ width: isProOrAbove ? `${teaserData.score || 0}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className={`space-y-6 transition-all duration-300 ${!isProOrAbove ? 'filter blur-[6px] pointer-events-none select-none opacity-30' : ''}`}>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Smart Money (FII/DII)', val: `${(teaserData.smartMoney || 0).toFixed(1)}%`, desc: 'Institutional Flow', color: 'text-[#00d09c]', bg: 'bg-emerald-50/40' },
                        { label: 'Alpha Target Upside', val: `+${teaserData.upside}%`, desc: 'Value Objective', color: 'text-blue-500', bg: 'bg-blue-50/40' },
                        { label: 'Risk Factor Audit', val: teaserData.risk, desc: 'Volatility Drawdown', color: 'text-amber-500', bg: 'bg-amber-50/40' },
                      ].map((stat, i) => (
                        <div key={i} className={`p-4 ${stat.bg} border border-slate-100 rounded-2xl flex flex-col justify-between`}>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 leading-none">{stat.label}</p>
                            <p className={`text-base font-black ${stat.color} mt-1`}>{stat.val}</p>
                          </div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-2.5 leading-none">{stat.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {teaserData.strategies?.length > 0 ? (
                          teaserData.strategies.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                              <Zap className="w-3.5 h-3.5 text-[#00d09c]" />
                              <span>{s.name} Entry Trigger</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-400">
                            Monitoring for Institutional Entry...
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified by Institutional Matrix</span>
                        </div>
                        <Link 
                          to={`/analysis/${teaserData.symbol}`}
                          className="flex items-center gap-1 text-xs font-bold text-[#00d09c] hover:text-[#00bda0] transition-all uppercase tracking-wider"
                        >
                          Access Full Strategy Matrix <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>

                      {/* HNI ABCD Tranche Visualizer */}
                      <div className="mt-6 p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-[#00d09c]" />
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">HNI Tranche Accumulation Ladder</h4>
                          </div>
                          <span className="text-[9px] font-bold text-[#00d09c] bg-emerald-50 px-2 py-0.5 rounded border border-[#00d09c]/10 uppercase">
                            Smart Money Protected
                          </span>
                        </div>
                        
                        <div className="relative pt-2">
                          {/* Connecting horizontal line */}
                          <div className="absolute top-[40%] left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0 hidden sm:block" />
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                            {[
                              { label: 'Tranche A', price: teaserData.abcd?.a?.price, type: 'Base Position', weight: '25%' },
                              { label: 'Tranche B', price: teaserData.abcd?.b?.price, type: 'Pullback Zone', weight: '25%' },
                              { label: 'Tranche C', price: teaserData.abcd?.c?.price, type: 'Hard Support', weight: '35%' },
                              { label: 'Tranche D', price: teaserData.abcd?.d?.price, type: 'Target Exit', weight: '15%' },
                            ].map((t, idx) => (
                              <div key={idx} className="bg-white border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center text-center shadow-sm relative group hover:border-[#00d09c] transition-colors duration-300">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.label}</span>
                                <span className="text-sm font-black text-slate-700 mt-1">{t.price}</span>
                                
                                <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[8px] font-bold text-slate-400">
                                  <span>{t.type}</span>
                                  <span className="text-slate-600 bg-slate-100 px-1 rounded">{t.weight}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lock overlay for Free users */}
                  {!isProOrAbove && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-2xl p-4 text-center">
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
                        <div className="mx-auto w-10 h-10 bg-emerald-50 border border-[#00d09c]/20 rounded-full flex items-center justify-center text-[#00d09c]">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">STRATEGY MATRIX LOCKED</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Smart money metrics, targets, and strategies for <span className="text-[#00d09c] font-bold">{teaserData.symbol}</span> require a Pro license.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          {user ? (
                            <button 
                              onClick={() => setShowUpgrade(true)}
                              className="w-full py-2.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-[#00d09c]/15"
                            >
                              Unlock with Pro Execution
                            </button>
                          ) : (
                            <Link 
                              to="/login"
                              className="w-full py-2.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all text-center shadow-md shadow-[#00d09c]/15"
                            >
                              Sign In to Unlock
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-4 space-y-3">
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              placeholder="Enter voucher (ALPHA7)..."
                              value={voucherCode}
                              onChange={(e) => setVoucherCode(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs outline-none focus-within:border-[#00d09c]"
                            />
                            <button
                              onClick={handleRedeemVoucher}
                              disabled={redeeming}
                              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 rounded-lg text-xs font-bold transition-all"
                            >
                              {redeeming ? '...' : 'Apply'}
                            </button>
                          </div>
                          {voucherError && (
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{voucherError}</p>
                          )}
                          <button 
                            type="button"
                            onClick={() => {
                              setVoucherCode('ALPHA7');
                              setVoucherError(null);
                            }}
                            className="text-xs font-bold text-[#00d09c] hover:text-[#00bda0] uppercase tracking-wider block mx-auto underline transition-colors"
                          >
                            Apply ALPHA7 (7-Day Trial)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Share Results */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => {
                      const scoreTxt = (teaserData.score || 0).toFixed(0);
                      const text = encodeURIComponent(`🚨 [Institutional Audit] ${teaserData.symbol} scored ${scoreTxt}/100 on MarketBeacon Pro! \n\nCheck the full FII/DII analysis here: https://marketbeaconpro.com/analysis/${teaserData.symbol}`);
                      window.open(waLink(text), '_blank');
                    }}
                    className="flex-1 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-[#00d09c] rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Zap className="w-4 h-4 fill-current" /> <span>Share on WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => {
                      const scoreTxt = (teaserData.score || 0).toFixed(0);
                      const text = encodeURIComponent(`🚨 [Institutional Audit] ${teaserData.symbol} scored ${scoreTxt}/100 on MarketBeacon Pro!`);
                      const url = `https://marketbeaconpro.com/analysis/${teaserData.symbol}`;
                      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                    }}
                    className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <TrendingUp className="w-4 h-4" /> <span>Share on Telegram</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Tagline / CTA Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-10 max-w-lg mx-auto">
          <Link to="/login" className="w-full inline-flex items-center justify-center px-6 py-4 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-[#00d09c]/15">
            Start Free — No Card Needed
          </Link>
          <Link to="/license-desk" className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold uppercase tracking-wider text-xs transition-all">
            View Pricing <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="Active user" loading="lazy" />
              </div>
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-white bg-[#00d09c] flex items-center justify-center text-xs font-bold text-white shadow-sm">+30K</div>
          </div>
          <p className="text-xs font-bold text-slate-400">Trusted by <span className="text-slate-800 font-extrabold">31,402</span> traders</p>
        </div>
      </header>
    </>
  );
};

export default HeroSection;
