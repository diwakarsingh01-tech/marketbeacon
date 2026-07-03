import React from 'react';
import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  X,
  ChevronRight,
  ShieldCheck,
  Target,
  TrendingUp,
  BadgeCheck,
  ArrowUpRight,
  Zap,
  Layers,
  Lock,
  Activity,
  RefreshCw,
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
      {/* Hero Section */}
      <header className="pt-24 md:pt-36 pb-16 md:pb-32 px-6 md:px-10 max-w-[1440px] mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />
        
        {/* 3D Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-40 right-32 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

          {/* Hero Search Bar — Top, Like Google Search */}
          <div id="search-anchor" className="max-w-2xl mx-auto mb-8 md:mb-12 relative group">
            <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row p-1.5 md:p-2 bg-[var(--bg-secondary)]/80 backdrop-blur-3xl border-2 border-[var(--border-secondary)] rounded-[1.25rem] sm:rounded-[2.5rem] focus-within:border-blue-500/70 focus-within:bg-[var(--bg-secondary)]/90 transition-all shadow-2xl shadow-blue-900/20 relative gap-1.5 sm:gap-0 transform group-hover:scale-[1.02] transition-all duration-300">
              <div className="flex-1 flex items-center pl-3 md:pl-6 gap-2 md:gap-3 py-1.5 md:py-0">
                <div className="relative">
                  <Search className="w-4 h-4 md:w-5 md:h-5 text-[var(--text-tertiary)] group-focus-within:text-blue-400 transition-colors shrink-0" />
                  {searchQuery && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="Enter stock symbol..." 
                  className="bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none w-full text-xs md:text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
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
                    className="p-1 md:p-2 mr-1 md:mr-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-all"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                )}
              </div>
              <button type="submit" disabled={isSearching} className="w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text-primary)] rounded-[0.75rem] sm:rounded-[2rem] font-bold uppercase tracking-wider text-[11px] sm:text-xs hover:from-blue-500 hover:to-indigo-600 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-blue-500/20 transform group-hover:scale-105 transition-all duration-300">
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Auditing...
                  </span>
                ) : (
                  <><span className="hidden sm:inline">Fundamentals Audit</span>
                  <span className="sm:hidden">Audit</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </form>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mt-2">
              Educational stock audit · Not a buy/sell recommendation
            </p>
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
                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider italic">{searchError}</p>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-relaxed">We only audit Nifty 500 & Alpha 40 symbols currently.</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(waLink(`Request Symbol: ${searchQuery}`), '_blank')}
                  className="px-6 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-rose-500 hover:text-[var(--text-primary)] transition-all whitespace-nowrap"
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
                ref={suggestionsRef}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 w-full mt-3 bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden z-[999] shadow-2xl"
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={item.symbol}
                    ref={el => { itemRefs.current[idx] = el; }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSearch(undefined, item.symbol)}
                    className={`w-full px-6 py-4 flex items-center justify-between transition-colors border-b border-white/5 last:border-none group ${idx === selectedIndex ? 'bg-blue-600/20' : 'hover:bg-[var(--bg-primary)]/5'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 text-blue-500 group-hover:animate-pulse" />
                        <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{item.symbol}</span>
                      </div>
                      
                      {/* Strategy Badges */}
                      <div className="hidden sm:flex items-center gap-2">
                        {item.strategies?.length > 0 ? (
                          item.strategies.slice(0, 2).map((s: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-bold text-blue-400 uppercase tracking-wider italic">
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider italic">Monitoring Node</span>
                        )}
                        {item.strategies?.length > 2 && (
                          <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase">+{item.strategies.length - 2}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider italic group-hover:text-blue-400">Institutional Node</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="max-w-3xl mx-auto -mt-4 mb-8 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
          <p className="text-[11px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-relaxed">
            Educational research scan only. Strategy triggers and audit scores are not buy/sell advice.
          </p>
        </div>

        {/* Live Trust Ticker (Audit Results) */}
        <div className="mb-8 md:mb-10">
          <AnimatePresence>
            {teaserData && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-8 p-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2.5rem] shadow-2xl shadow-blue-900/30 relative overflow-hidden"
              >
                {/* 3D Glow Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-6" />
                
                <div className="bg-[var(--bg-primary)] rounded-[2.4rem] p-8 text-left space-y-6 relative overflow-hidden border border-white/10">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] -mr-32 -mt-32" />
                   <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/10 blur-[60px] -ml-24 -mb-24" />
                   
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                         <div className="flex items-center gap-3">
                            <h3 className="text-3xl font-black text-[var(--text-primary)] italic tracking-tighter">{teaserData.symbol}</h3>
                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[10px] font-bold text-blue-400 uppercase tracking-wider italic">{teaserData.basket} Node</span>
                            {teaserData.isPass && (
                              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[8px] font-bold text-emerald-400 uppercase tracking-wider">
                                BULLISH
                              </span>
                            )}
                         </div>
                         <div className="flex items-center gap-2 pt-1">
                            {teaserData.isPass && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                   <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                                   <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Qualified on Fundamentals</span>
                                </div>
                             )}
                             <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider italic">Institutional Audit Pass</p>
                         </div>
                       </div>
                       <div className="text-right">
                          <div className={`text-5xl font-black italic ${teaserData.score >= 80 ? 'text-emerald-400' : 'text-blue-400'} relative`}>
                            {isProOrAbove ? (teaserData.score || 0).toFixed(0) : '🔒'}
                            {teaserData.score >= 80 && (
                              <span className="absolute -top-2 -right-2 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">BUY</span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Audit Score</div>
                       </div>
                    </div>

                    <div className="relative">
                       {/* Premium Stats Grid & Strategies (Blurred for Free users) */}
                       <div className={`space-y-6 transition-all duration-300 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-30' : ''}`}>
                          <div className="grid grid-cols-3 gap-4">
                             {[
                               { label: 'Smart Money', val: `${(teaserData.smartMoney || 0).toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                               { label: 'Alpha Target', val: `+${teaserData.upside}%`, icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                               { label: 'Risk Profile', val: teaserData.risk, icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                             ].map((stat, i) => (
                               <div key={i} className="p-4 bg-[var(--bg-primary)]/5 border border-white/5 rounded-2xl hover:bg-[var(--bg-primary)]/10 transition-all group hover:scale-105 hover:border-blue-500/30">
                                  <div className={`p-2 ${stat.bg} rounded-xl w-fit mb-2 group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color} group-hover:text-[var(--text-primary)] transition-colors`} />
                                  </div>
                                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 group-hover:text-[var(--text-secondary)] transition-colors">{stat.label}</p>
                                  <p className={`text-sm font-black text-[var(--text-primary)] italic ${stat.color} group-hover:text-[var(--text-primary)] transition-colors`}>{stat.val}</p>
                               </div>
                             ))}
                          </div>

                          <div className="pt-4 space-y-4">
                             <div className="flex flex-wrap gap-2">
                                {teaserData.strategies?.length > 0 ? (
                                   teaserData.strategies.map((s: any, i: number) => (
                                      <div key={i} className="card flex items-center gap-2 px-4 py-2 hover:border-blue-500/50 transition-all group hover:scale-105 hover:bg-blue-500/5">
                                         <Zap className="w-3 h-3 text-blue-500 group-hover:animate-pulse" />
                                         <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider group-hover:text-blue-400 transition-colors">{s.name} Entry</span>
                                         {i === 0 && (
                                           <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider ml-1">PRIMARY</span>
                                         )}
                                     </div>
                                  ))
                                ) : (
                                   <div className="card px-4 py-2 italic">
                                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Monitoring for Institutional Entry</span>
                                   </div>
                               )}
                             </div>
                             
                             <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Verified by Institutional Matrix v12.0</span>
                                </div>
                                <Link 
                                  to={`/analysis/${teaserData.symbol}`}
                                  className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-[var(--text-primary)] transition-all uppercase tracking-wider group"
                                >
                                  Access Full Strategy Matrix <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Link>
                             </div>

                             {/* Phase 3: HNI ABCD Tranche Visualizer */}
                             <div className="mt-6 p-5 bg-blue-600/5 border border-blue-500/10 rounded-3xl space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
                                <div className="flex items-center justify-between relative z-10">
                                   <div className="flex items-center gap-2">
                                      <Layers className="h-3.5 w-3.5 text-blue-500" />
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Institutional Entry Plan (HNI Edge)</h4>
                                   </div>
                                   <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cap: ₹10,00,000 (Sample)</span>
                                </div>
                                
                                <div className="grid grid-cols-4 gap-2 relative z-10">
                                   {[
                                      { id: 'A', label: 'Tranche A', price: teaserData.abcd?.a?.price, weight: '25%', status: 'active', color: 'bg-emerald-500' },
                                      { id: 'B', label: 'Tranche B', price: teaserData.abcd?.b?.price, weight: '25%', status: 'pending', color: 'bg-blue-500' },
                                      { id: 'C', label: 'Tranche C', price: teaserData.abcd?.c?.price, weight: '25%', status: 'pending', color: 'bg-slate-500' },
                                      { id: 'D', label: 'Tranche D', price: teaserData.abcd?.d?.price, weight: '25%', status: 'locked', color: 'bg-slate-700' },
                                   ].map((t, idx) => (
                                      <div key={idx} className="card p-3 flex flex-col items-center text-center space-y-1 relative group hover:scale-105 transition-all">
                                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{t.label}</span>
                                          <span className="text-xs font-bold text-[var(--text-primary)] italic">{t.price}</span>
                                          <div className="w-full h-1 bg-[var(--bg-tertiary)] rounded-full mt-1 overflow-hidden">
                                             <div className={`h-full ${t.color} rounded-full transition-all duration-1000`} style={{ width: t.weight }} />
                                          </div>
                                          <span className={`text-[9px] font-bold mt-1 ${t.status === 'active' ? 'text-emerald-400' : t.status === 'pending' ? 'text-blue-400' : 'text-[var(--text-muted)]'}`}>Alloc: ₹2.5L</span>
                                         {t.status === 'active' && (
                                           <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                         )}
                                      </div>
                                   ))}
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] italic text-center font-bold relative z-10">
                                   "Institutional capital follows a laddered entry approach to maximize capital protection."
                                </p>
                             </div>
                          </div>
                       </div>

                       {/* Lock overlay for Free users */}
                       {!isProOrAbove && (
                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--bg-primary)]/40 backdrop-blur-[2px] rounded-3xl p-4 text-center">
                             <div className="bg-[var(--bg-secondary)]/90 border border-[var(--border-primary)] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl -mr-16 -mt-16" />
                                <div className="mx-auto w-10 h-10 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-500 animate-pulse relative z-10">
                                   <Lock className="w-4 h-4" />
                                </div>
                                <div className="space-y-1 relative z-10">
                                   <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">PRO STRATEGY MATRIX LOCKED</h4>
                                   <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                                      Smart money details, upside targets, and strategy entry points for <span className="text-blue-400 font-bold">{teaserData.symbol}</span> require a Pro Execution tier license.
                                   </p>
                                </div>

                                <div className="flex flex-col gap-2 pt-2 relative z-10">
                                   {user ? (
                                      <button 
                                        onClick={() => setShowUpgrade(true)}
                                          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text-primary)] rounded-xl font-bold uppercase tracking-wider text-[11px] hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 relative overflow-hidden group"
                                        >
                                           <span className="relative z-10">Unlock with Pro Execution</span>
                                      </button>
                                   ) : (
                                      <Link 
                                        to="/login"
                                          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text-primary)] rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all text-center shadow-lg shadow-blue-500/20"
                                        >
                                           <span className="relative z-10">Sign In to Unlock</span>
                                      </Link>
                                   )}
                                </div>

                                <div className="border-t border-[var(--border-primary)] pt-3.5 space-y-2.5 relative z-10">
                                   <div className="flex gap-1.5">
                                      <input 
                                        type="text" 
                                        placeholder="Enter voucher (ALPHA7)..."
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value)}
                                        className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-primary)] px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus:border-blue-500"
                                      />
                                      <button
                                        onClick={handleRedeemVoucher}
                                        disabled={redeeming}
                                        className="px-4 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-slate-100 disabled:bg-[var(--bg-secondary)] disabled:text-slate-700 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                                      >
                                         {redeeming ? '...' : 'Apply'}
                                      </button>
                                   </div>
                                   {voucherError && (
                                      <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">{voucherError}</p>
                                   )}
                                   <button 
                                      type="button"
                                      onClick={() => {
                                         setVoucherCode('ALPHA7');
                                         setVoucherError(null);
                                      }}
                                       className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider block mx-auto underline transition-colors"
                                   >
                                      Apply ALPHA7 (7-Day Trial)
                                   </button>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>

                    {/* Share Results (Safe-Guard Phase 2: Viral Trigger) */}
                    <div className="pt-4 flex flex-col sm:flex-row gap-3 relative z-10">
                       <button 
                         onClick={() => {
                           const scoreTxt = (teaserData.score || 0).toFixed(0);
                           const text = encodeURIComponent(`🚨 [Institutional Audit] ${teaserData.symbol} scored ${scoreTxt}/100 on MarketBeacon Pro! \n\nCheck the full FII/DII analysis here: https://marketbeaconpro.com/analysis/${teaserData.symbol}`);
                           window.open(waLink(text), '_blank');
                         }}
                          className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-[var(--text-primary)] rounded-2xl text-xs font-bold uppercase tracking-wider hover:from-emerald-500 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
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
                          className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text-primary)] rounded-2xl text-xs font-bold uppercase tracking-wider hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                          <TrendingUp className="w-4 h-4" /> <span>Share on Telegram</span>
                       </button>
                    </div>
                 </div>
               </motion.div>
             )}
            </AnimatePresence>
          </div>

        {/* Brand Heading */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-950/50 backdrop-blur-sm rounded-full border border-blue-900 mb-4 md:mb-8">
           <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
           <span className="text-[9px] md:text-xs font-bold text-blue-400 uppercase tracking-wider">For Educational & Research Purposes Only</span>
        </div>
        
        <h1 className="text-3xl md:text-[6rem] font-black tracking-tighter leading-[0.85] text-[var(--text-primary)] mb-3 md:mb-6 drop-shadow-2xl">
           THE SYSTEM <br className="hidden sm:block" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">FII/DII USE.</span>
        </h1>
         <p className="text-xs md:text-base font-medium text-blue-300/70 max-w-2xl mx-auto leading-relaxed mb-6 md:mb-8 px-4">
            Type any stock symbol above → get its <span className="text-blue-400 font-bold">100-point institutional audit score</span> in seconds. Free, no login needed.
         </p>

        {/* Grand Launch Promo Banner */}
        <div className="max-w-2xl mx-auto mb-6 md:mb-10">
          <div className="relative group cursor-pointer overflow-hidden p-[1px] bg-gradient-to-r from-blue-600 via-indigo-400 to-emerald-400 rounded-2xl shadow-xl shadow-blue-900/20">
            <div className="bg-[var(--bg-primary)]/90 backdrop-blur-xl rounded-[15px] px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 fill-current animate-pulse" />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="text-[11px] md:text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider leading-none mb-0.5 md:mb-1 truncate">Grand Alpha Launch Live</h4>
                  <p className="text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider truncate">Free 7-Day Institutional Access</p>
                </div>
              </div>
              <Link to="/login"
                className="px-3 md:px-5 py-1.5 md:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text-primary)] rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0 text-center shadow-lg shadow-blue-500/20"
              >
                Start 7-Day Free Trial →
              </Link>
            </div>
            <div className="absolute top-0 right-0 p-1">
                   <div className="px-1 py-0.5 bg-emerald-500 text-[var(--text-primary)] text-[7px] md:text-[8px] font-bold uppercase rounded-bl-lg animate-bounce">Live</div>
            </div>
          </div>
        </div>

        {/* Live Preview Card — Instant Value Proof */}
        <div className="max-w-md mx-auto mb-6 md:mb-8">
          <Link to={`/analysis/${teaserData?.symbol || 'TCS'}`}
            className="block group relative overflow-hidden p-[1px] bg-gradient-to-r from-blue-600 via-indigo-400 to-emerald-400 rounded-2xl shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="bg-[var(--bg-primary)]/95 backdrop-blur-xl rounded-[15px] px-4 md:px-5 py-3 md:py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg md:text-xl font-black text-[var(--text-primary)] italic tracking-tighter">{teaserData?.symbol || 'TCS'}</span>
                  {teaserData?.isPass !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${
                       teaserData.isPass ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                     }`}>
                       {teaserData.isPass ? 'Qualified' : 'Audit Pending'}
                     </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400" /> Live
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                  {teaserData?.score !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className={`text-lg md:text-2xl font-black italic tracking-tighter ${
                        teaserData.score >= 70 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>{teaserData.score}</span>
                      <span className="text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-tight">Audit<br/>Score</span>
                    </div>
                  )}
                  {teaserData?.smartMoney !== undefined && (
                    <div className="h-8 w-px bg-[var(--border-primary)]" />
                  )}
                  {teaserData?.smartMoney !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg md:text-2xl font-black text-blue-400 italic tracking-tighter">{teaserData.smartMoney.toFixed(0)}%</span>
                      <span className="text-[9px] md:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-tight">Smart<br/>Money</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">View Audit</span>
                  <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              </div>
              {!teaserData && (
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Loading live audit data...</span>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* CTA */}
          <p className="text-xs md:text-lg font-medium text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-4 md:mb-6 px-4">
           100-point Institutional Audit Score + 10 Proprietary Strategies + ABCD Tranche Laddering — the same framework used by institutional desks. Free to try.
         </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-6 md:mb-10">
          <Link to="/login" className="w-full md:w-auto inline-flex items-center justify-center px-6 md:px-10 py-3 md:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text-primary)] rounded-xl md:rounded-2xl font-bold uppercase tracking-wider text-xs md:text-sm hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
             Start Free — No Card Needed
          </Link>
          <Link to="/license-desk" className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-5 bg-[var(--bg-primary)]/5 border border-white/10 text-[var(--text-primary)] rounded-xl md:rounded-2xl font-bold uppercase tracking-wider text-xs md:text-sm hover:bg-[var(--bg-primary)]/10 transition-all">
            View Pricing <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 md:mb-10">
          <div className="flex -space-x-2 md:-space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 md:border-4 border-slate-950 bg-[var(--bg-tertiary)] overflow-hidden shadow-xl">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="Active trader on MarketBeacon Pro" loading="lazy" decoding="async" />
              </div>
            ))}
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 md:border-4 border-slate-950 bg-blue-600 flex items-center justify-center text-[9px] md:text-[11px] font-bold text-[var(--text-primary)] shadow-xl">+30K</div>
          </div>
          <p className="text-[11px] md:text-xs font-bold text-[var(--text-muted)]">Trusted by <span className="text-[var(--text-primary)] font-bold">31,402</span> traders</p>
        </div>
        </header>
    </>
  );
};

export default HeroSection;
