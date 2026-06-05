import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronUp as ChevronUpIcon, 
  ChevronDown as ChevronDownIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Zap as ZapIcon, 
  Settings2 as SettingsIcon, 
  Check as CheckIcon, 
  X as XIcon, 
  Star as StarIcon,
  Download as DownloadIcon,
  ShieldCheck,
  Info as InfoIcon,
  Share2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TradeTableProps {
  trades: any[];
  livePrices?: Record<string, number>;
  athData?: Record<string, number>;
  capData?: Record<string, number>;
  sectorData?: Record<string, string>;
  isWatchlist?: boolean;
  activeTab?: string;
  userWatchlist?: string[];
  strategyId?: string;
  onToggleWatchlist?: (symbol: string) => void;
  onUpdateHolding?: (symbol: string, quantity: number, buyPrice: number) => void;
  onUpdateReview?: () => void;
}

const CircularGauge = ({ value, size = 32, strokeWidth = 3 }: { value: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#3b82f6' : '#f59e0b';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100" />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} fill="transparent" strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[8px] font-black text-slate-900">{value}</span>
    </div>
  );
};

const getMarketCapTag = (cap: number, symbol: string) => {
  if (['NIFTYBEES', 'BANKBEES'].includes(symbol)) {
    return { label: 'ETF', class: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
  }
  const capInCr = cap / 10000000;
  if (capInCr >= 20000) return { label: 'LARGE CAP', class: 'text-slate-900 bg-slate-100 border-slate-200' };
  if (capInCr >= 5000) return { label: 'MID CAP', class: 'text-blue-600 bg-blue-50 border-blue-100' };
  return { label: 'SMALL CAP', class: 'text-amber-600 bg-amber-50 border-amber-100' };
};

const TradeTable: React.FC<TradeTableProps> = ({ 
  trades, livePrices, athData, capData, sectorData, activeTab, userWatchlist, strategyId, onToggleWatchlist, onUpdateHolding 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    observation: true,
    symbol: true,
    marketCap: true,
    abcd: true,
    basePrice: true,
    cmp: true,
    dfh: true,
    objective: true,
    roi: true,
    pending: true,
    fundamentals: true
  });

  useEffect(() => {
    const isWatchlistTab = activeTab === 'hold';
    const isPortfolioTab = activeTab === 'portfolio';
    const isSpecialStrat = strategyId === 'SIXTY_SEVEN_FUNDA';
    
    setVisibleColumns({
      observation: !isWatchlistTab && !isPortfolioTab,
      symbol: true,
      marketCap: true,
      abcd: !isWatchlistTab && !isPortfolioTab && !isSpecialStrat,
      basePrice: !isWatchlistTab && !isPortfolioTab,
      cmp: true,
      dfh: true,
      objective: !isWatchlistTab && !isPortfolioTab,
      roi: !isWatchlistTab && !isPortfolioTab,
      pending: !isWatchlistTab && !isPortfolioTab,
      fundamentals: true
    });
  }, [activeTab, strategyId]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ 
    key: 'entryTime', 
    direction: 'desc' 
  });

  useEffect(() => {
    if (activeTab === 'hold') setSortConfig({ key: 'dfh', direction: 'asc' });
    else setSortConfig({ key: 'entryTime', direction: 'desc' });
  }, [activeTab]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExportCSV = () => {
    if (!filteredAndSortedTrades.length) return;
    const headers = ['Symbol', 'Observation', 'Strategy', 'Sector', 'Market Cap', 'Entry A (Base)', 'CMP', 'ATH', 'Target (Objective)', 'ROI%', 'Gap%', 'Audit Score', 'Audit Remark'];
    const rows = filteredAndSortedTrades.map(t => [
      t.symbol,
      t.entryTime || '-',
      t.strategy || 'Institutional Matrix',
      t.sector,
      t.marketCap,
      t.entryPrice?.toFixed(2),
      t.livePrice?.toFixed(2) || t.currentPrice?.toFixed(2),
      (athData?.[t.symbol] || t.ath || 0).toFixed(2),
      t.target?.toFixed(2),
      t.targetGap?.toFixed(2) + '%',
      (t.entryPrice > 0 ? (((t.livePrice || t.currentPrice) - t.entryPrice)/t.entryPrice) * 100 : 0).toFixed(2) + '%',
      t.score + '/100',
      t.reason || 'Institutional Audit Active'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `MarketBeacon_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareSignal = (trade: any, method: 'copy' | 'telegram' = 'copy') => {
    const livePrice = livePrices?.[trade.symbol] || trade.livePrice || trade.currentPrice || 0;
    const text = `🚨 *MarketBeacon Research: ${trade.symbol}*

⚡️ *Strategy:* ${trade.strategy || 'Institutional Matrix'}
💰 *Price:* ₹${livePrice.toLocaleString()}
🎯 *Objective:* ₹${(trade.target || trade.targetPrice || 0).toLocaleString()}
📊 *Audit:* ${trade.isPass !== false ? '✅ Qualified' : '🔍 Observation'}

🔗 *Full Terminal:* https://marketbeacon.vercel.app/stock/${trade.symbol}

#MarketBeacon #InstitutionalResearch #Batch9`;
    
    if (method === 'copy') {
      navigator.clipboard.writeText(text);
      alert(`Signal for ${trade.symbol} copied to clipboard! Ready to paste.`);
    } else {
      const url = `https://t.me/share/url?url=https://marketbeacon.vercel.app&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  const handleToggleWatchlist = (e: React.MouseEvent, symbol: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWatchlist) onToggleWatchlist(symbol);
  };

  const filteredAndSortedTrades = useMemo(() => {
    let result = (trades || []).map(t => {
      const livePrice = livePrices?.[t.symbol] || t.livePrice || t.currentPrice;
      const basePrice = t.entryPrice || t.actualEntryPrice;
      const marketCap = capData?.[t.symbol] || t.marketCap || 0;
      const sector = sectorData?.[t.symbol] || t.sector || 'General';
      const ath = athData?.[t.symbol] || t.ath || 0;
      
      let calculatedRoi = 0;
      if (livePrice && basePrice && basePrice > 0) {
        calculatedRoi = ((livePrice - basePrice) / basePrice) * 100;
      }

      const targetGap = (livePrice && t.target) ? ((t.target - livePrice) / livePrice) * 100 : 0;
      const dfh = (livePrice && ath && ath > 0) ? ((livePrice / ath) - 1) * 100 : 0;

      return {
        ...t,
        livePrice,
        calculatedRoi,
        targetGap,
        dfh,
        marketCap,
        sector,
        entryTime: t.entryTime || t.entry_date || '-'
      };
    });

    if (searchTerm) {
      result = result.filter(t => t.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'roi') { valA = a.calculatedRoi; valB = b.calculatedRoi; }
        else if (sortConfig.key === 'pending') { valA = a.targetGap; valB = b.targetGap; }
        else if (sortConfig.key === 'symbol') { valA = a.symbol; valB = b.symbol; }
        else if (sortConfig.key === 'price') { valA = a.livePrice || 0; valB = b.livePrice || 0; }
        else if (sortConfig.key === 'entryTime') {
          valA = a.entryTime && a.entryTime !== '-' ? new Date(a.entryTime).getTime() : 0;
          valB = b.entryTime && b.entryTime !== '-' ? new Date(b.entryTime).getTime() : 0;
        } else {
          valA = a[sortConfig.key as keyof typeof a];
          valB = b[sortConfig.key as keyof typeof b];
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [trades, searchTerm, sortConfig, livePrices, athData, capData, sectorData]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <FilterIcon className="h-2.5 w-2.5 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUpIcon className="h-2.5 w-2.5 ml-1 text-blue-600" /> : <ChevronDownIcon className="h-2.5 w-2.5 ml-1 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Search and Settings Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/50 backdrop-blur-md px-6 py-5 rounded-3xl border border-slate-100 gap-6 shadow-sm">
        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Terminal Symbols..."
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-14 pr-6 py-3.5 text-[11px] font-black uppercase tracking-widest focus:bg-white focus:border-blue-500/20 focus:shadow-xl transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportCSV} 
            className="flex items-center gap-3 px-8 py-3.5 bg-slate-INK text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-900/10 group border border-white/5"
            style={{ backgroundColor: 'var(--slate-ink)' }}
          >
            <DownloadIcon className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span>Export Matrix Audit</span>
          </button>
          <button 
            onClick={() => setShowColumnSettings(!showColumnSettings)} 
            className={`p-3.5 rounded-2xl border transition-all ${showColumnSettings ? 'bg-slate-ink text-white border-blue-500/30' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
            style={showColumnSettings ? { backgroundColor: 'var(--slate-ink)' } : {}}
          >
            <SettingsIcon className="h-4.5 w-4.5" />
          </button>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-5 py-3.5 rounded-2xl border border-slate-100 shadow-sm italic">
            {filteredAndSortedTrades.length} Nodes Discovered
          </div>
        </div>
      </div>

      {/* Column Settings Dropdown */}
      {showColumnSettings && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 p-6 bg-white rounded-3xl border border-slate-100 shadow-xl"
        >
           {Object.entries(visibleColumns).map(([key, isVisible]) => (
             <button 
                key={key} 
                onClick={() => setVisibleColumns(p => ({...p, [key]: !isVisible}))} 
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isVisible ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
             >
                {key}
             </button>
           ))}
        </motion.div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block border border-slate-100 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              {activeTab === 'portfolio' ? (
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                  <th className="px-10 py-7 text-left">Asset Node</th>
                  <th className="px-8 py-7 text-center">Qty</th>
                  <th className="px-8 py-7 text-right">Entry Base</th>
                  <th className="px-8 py-7 text-right">CMP</th>
                  <th className="px-8 py-7 text-right">Invested Value</th>
                  <th className="px-8 py-7 text-right">Current Node</th>
                  <th className="px-10 py-7 text-right">Yield %</th>
                </tr>
              ) : (
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                  {visibleColumns.observation && <th className="px-10 py-7 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('entryTime')}><div className="flex items-center gap-1">Obs <SortIcon column="entryTime" /></div></th>}
                  {visibleColumns.symbol && <th className="px-8 py-7 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('symbol')}><div className="flex items-center gap-1">Asset Node <SortIcon column="symbol" /></div></th>}
                  {visibleColumns.marketCap && <th className="px-8 py-7 cursor-pointer hover:text-blue-600 transition-colors text-center" onClick={() => handleSort('marketCap')}><div className="flex items-center justify-center gap-1">Tier <SortIcon column="marketCap" /></div></th>}
                  {visibleColumns.abcd && <th className="px-8 py-7 text-center">ABCD Ladder</th>}
                  {visibleColumns.basePrice && <th className="px-8 py-7 text-right">Base</th>}
                  {visibleColumns.cmp && <th className="px-8 py-7 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('price')}><div className="flex items-center justify-end text-blue-600 gap-1">CMP <SortIcon column="price" /></div></th>}
                  {visibleColumns.dfh && <th className="px-8 py-7 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('dfh')}><div className="flex items-center justify-end gap-1">DFH% <SortIcon column="dfh" /></div></th>}
                  {visibleColumns.objective && <th className="px-8 py-7 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('target')}><div className="flex items-center justify-end gap-1">Objective <SortIcon column="target" /></div></th>}
                  {visibleColumns.roi && <th className="px-8 py-7 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('roi')}><div className="flex items-center justify-end gap-1 text-emerald-600">ROI% (Alpha) <SortIcon column="roi" /></div></th>}
                  {visibleColumns.pending && <th className="px-8 py-7 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('pending')}><div className="flex items-center justify-end gap-1">Gap% (Window) <SortIcon column="pending" /></div></th>}
                  {visibleColumns.fundamentals && <th className="px-10 py-7 text-right">Audit</th>}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-50 font-mono">
              {filteredAndSortedTrades.length === 0 ? (
                <tr><td colSpan={15} className="px-10 py-24 text-center text-xs font-black text-slate-300 uppercase tracking-[0.6em]">No institutional signals detected in current matrix</td></tr>
              ) : (
                <AnimatePresence>
                  {filteredAndSortedTrades.map((trade, idx) => {
                    const capTag = getMarketCapTag(trade.marketCap, trade.symbol);
                    const isStarred = userWatchlist?.includes(trade.symbol);
                    const ath = athData?.[trade.symbol] || trade.ath || 0;

                    if (activeTab === 'portfolio') {
                      const invested = (trade.quantity || 0) * (trade.buy_price || 0);
                      const currentVal = (trade.quantity || 0) * (trade.livePrice || 0);
                      const pnl = currentVal - invested;
                      return (
                        <motion.tr 
                           key={trade.symbol} 
                           initial={{ opacity: 0, y: 5 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: idx * 0.02 }}
                           className="hover:bg-slate-50/50 transition-all font-black text-[11px] group divide-x divide-slate-50"
                        >
                          <td className="px-10 py-6 text-left">
                            <div className="flex items-center space-x-5">
                              <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-slate-200 hover:text-amber-400 transition-all active:scale-90">
                                 <StarIcon className={`h-4.5 w-4.5 ${isStarred ? 'fill-current text-amber-400' : ''}`} />
                              </button>
                              <div className="flex flex-col font-sans">
                                 <span className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tighter leading-none">{trade.symbol}</span>
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{trade.sector}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <input type="number" defaultValue={trade.quantity || 0} onBlur={(e) => onUpdateHolding?.(trade.symbol, parseInt(e.target.value) || 0, trade.buy_price || 0)} className="w-20 bg-slate-50 border-2 border-transparent rounded-xl text-center font-black py-2 shadow-inner outline-none focus:bg-white focus:border-blue-500/20 transition-all" />
                          </td>
                          <td className="px-8 py-6 text-right">
                            <input type="number" defaultValue={trade.buy_price || 0} onBlur={(e) => onUpdateHolding?.(trade.symbol, trade.quantity || 0, parseFloat(e.target.value) || 0)} className="w-24 bg-slate-50 border-2 border-transparent rounded-xl text-right font-black py-2 px-3 shadow-inner outline-none focus:bg-white focus:border-blue-500/20 transition-all" />
                          </td>
                          <td className="px-8 py-6 text-right text-blue-600 font-black italic shadow-inner">₹{trade.livePrice?.toLocaleString()}</td>
                          <td className="px-8 py-6 text-right text-slate-500 font-bold opacity-60">₹{invested.toLocaleString()}</td>
                          <td className="px-8 py-6 text-right text-slate-900 font-black">₹{currentVal.toLocaleString()}</td>
                          <td className="px-10 py-6 text-right">
                            <span className={`px-4 py-1.5 rounded-xl font-black italic tracking-tighter ${pnl >= 0 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                                {pnl >= 0 ? '+' : ''}{invested > 0 ? ((pnl/invested)*100).toFixed(1) : '0.0'}% Yield
                            </span>
                          </td>
                        </motion.tr>
                      );
                    }

                    return (
                      <motion.tr 
                        key={trade.symbol} 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50 group transition-all font-black text-[11px] divide-x divide-slate-50"
                      >
                        {visibleColumns.observation && (
                          <td className="px-10 py-6 text-[9px] text-slate-400 font-bold uppercase whitespace-nowrap italic">
                            {(() => {
                              if (!trade.entryTime || trade.entryTime === '-') return '-';
                              const d = new Date(trade.entryTime);
                              if (isNaN(d.getTime())) return '-';
                              return (
                                <div className="flex flex-col gap-1">
                                  <span className="text-slate-600">{d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  <span className="opacity-40 text-[7px]">{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })} NODE</span>
                                </div>
                              );
                            })()}
                          </td>
                        )}
                        {visibleColumns.symbol && (
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                               <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-slate-200 hover:text-amber-400 transition-all active:scale-90">
                                  <StarIcon className={`h-4.5 w-4.5 ${isStarred ? 'fill-current text-amber-400' : ''}`} />
                               </button>
                               <div className="flex flex-col font-sans">
                                  <span className="text-base font-black text-slate-950 group-hover:text-blue-600 transition-colors tracking-tighter leading-none">{trade.symbol}</span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{trade.sector}</span>
                               </div>
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-auto pr-2">
                                  <button onClick={() => handleShareSignal(trade, 'telegram')} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Share2 className="h-3.5 w-3.5" /></button>
                                  <Link to={`/stock/${trade.symbol}`} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-INK hover:text-white transition-all"><ExternalLink className="h-3.5 w-3.5" /></Link>
                               </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.marketCap && (
                          <td className="px-8 py-6 text-center">
                            {capTag && <span className={`px-3 py-1 rounded-lg text-[8px] font-black border tracking-widest ${capTag.class}`}>{capTag.label}</span>}
                          </td>
                        )}
                        {visibleColumns.abcd && (
                          <td className="px-8 py-6 text-center group/ladder relative">
                            <div className="flex items-center justify-center space-x-2 cursor-help">
                              {['a', 'b', 'c', 'd'].map((l) => {
                                const levelObj = trade.abcd?.[l];
                                const levelVal = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                                const isActive = (trade.livePrice || 0) <= levelVal && levelVal > 0;
                                const levelColor = l === 'a' ? (isActive ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/40' : 'bg-blue-50 text-blue-400 border-blue-100') :
                                                 (l === 'b' || l === 'c') ? (isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/40' : 'bg-indigo-50 text-indigo-400 border-indigo-100') :
                                                 (isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/40' : 'bg-emerald-50 text-emerald-400 border-emerald-100');

                                return (
                                  <div key={l} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border-2 transition-all ${levelColor} ${isActive ? 'shadow-lg scale-125 z-10' : 'opacity-30'}`}>
                                    {l.toUpperCase()}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-[200] hidden group-hover/ladder:block bg-slate-950 text-white shadow-2xl rounded-2xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-[220px]">
                               <div className="space-y-3">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Institutional Ladder</span>
                                     <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                  </div>
                                  {['a', 'b', 'c', 'd'].map((l) => {
                                    const levelObj = trade.abcd?.[l];
                                    const price = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                                    const date = typeof levelObj === 'object' ? levelObj.date : null;
                                    
                                    return (
                                      <div key={l} className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                          <span className={`text-[10px] font-black ${l === 'a' ? 'text-blue-400' : l === 'd' ? 'text-emerald-400' : 'text-slate-400'}`}>Entry {l.toUpperCase()}</span>
                                          {date && <span className="text-[7px] text-slate-500 font-bold uppercase">{date}</span>}
                                        </div>
                                        <span className="text-sm font-black text-white italic">₹{price?.toLocaleString()}</span>
                                      </div>
                                    );
                                  })}
                               </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.basePrice && <td className="px-8 py-6 text-right text-slate-400 font-black italic">₹{trade.entryPrice?.toLocaleString()}</td>}
                        {visibleColumns.cmp && <td className="px-8 py-6 text-right text-blue-600 font-black italic bg-slate-50/50 shadow-inner">₹{trade.livePrice?.toLocaleString()}</td>}
                        {visibleColumns.dfh && <td className="px-8 py-6 text-right text-slate-400 font-black opacity-60 italic">{trade.dfh?.toFixed(1)}%</td>}
                        {visibleColumns.objective && <td className="px-8 py-6 text-right text-fuchsia-600 font-black font-mono">₹{trade.target?.toLocaleString()}</td>}
                        {visibleColumns.roi && (
                          <td className="px-8 py-6 text-right">
                             <div className="flex flex-col items-end">
                                <span className={`text-base font-black tracking-tighter italic ${trade.targetGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                   {trade.targetGap >= 0 ? '+' : ''}{trade.targetGap?.toFixed(1)}%
                                </span>
                                <span className="text-[7px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Objective Alpha</span>
                             </div>
                        </td>
                        )}
                        {visibleColumns.pending && (
                          <td className="px-8 py-6 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-orange-600 italic">
                                   {trade.entryPrice > 0 ? (((trade.livePrice - trade.entryPrice)/trade.entryPrice) * 100).toFixed(1) : '0.0'}%
                                </span>
                                <span className="text-[7px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Entry Window</span>
                             </div>
                          </td>
                        )}
                        {visibleColumns.fundamentals && (
                          <td className="px-10 py-6 text-right">
                            <div className="flex items-center justify-end space-x-4">
                               <div className="flex flex-col items-end mr-1">
                                  <span className={`text-[10px] font-black uppercase tracking-tighter italic ${trade.isPass !== false ? 'text-emerald-600' : 'text-orange-500'}`}>
                                     {trade.isPass !== false ? 'Pass' : 'Obs'}
                                  </span>
                                  <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">Logic</span>
                               </div>
                               <CircularGauge value={trade.score} />
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Safe-Guard Rule #10: Smart Insight Cards) */}
      <div className="md:hidden space-y-6">
         <AnimatePresence>
            {filteredAndSortedTrades.map((trade, idx) => {
              const isStarred = userWatchlist?.includes(trade.symbol);
              const capTag = getMarketCapTag(trade.marketCap, trade.symbol);
              
              return (
                <motion.div 
                   key={trade.symbol} 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   whileTap={{ scale: 0.98 }}
                   className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden group"
                >
                   {/* Card Background Pattern */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-700" />
                   
                   <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center space-x-4">
                         <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="p-2 -ml-2 text-slate-200 hover:text-amber-400 transition-all">
                            <StarIcon className={`h-6 w-6 ${isStarred ? 'fill-current text-amber-400' : ''}`} />
                         </button>
                         <div>
                            <h3 className="text-2xl font-black text-slate-950 tracking-tighter leading-none italic">{trade.symbol}</h3>
                            <div className="flex items-center gap-2 mt-2">
                               <span className={`px-2 py-0.5 rounded text-[7px] font-black border tracking-widest ${capTag.class}`}>{capTag.label}</span>
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trade.sector}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <button 
                            onClick={() => handleShareSignal(trade, 'telegram')} 
                            className="p-3 bg-blue-50 text-blue-600 rounded-2xl active:scale-90 transition-all shadow-sm border border-blue-100"
                         >
                            <Share2 className="h-5 w-5" />
                         </button>
                         <Link 
                            to={`/stock/${trade.symbol}`} 
                            className="p-3 bg-slate-INK text-white rounded-2xl shadow-xl shadow-slate-900/20 active:scale-90 transition-all"
                            style={{ backgroundColor: 'var(--slate-ink)' }}
                         >
                            <ChevronRight className="h-5 w-5" />
                         </Link>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 relative z-10">
                      <div className="p-5 bg-slate-50/80 backdrop-blur-sm rounded-[2rem] border border-slate-100 flex flex-col justify-center space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Signal Base</p>
                        <p className="text-xl font-black text-slate-950 font-mono italic">₹{trade.entryPrice?.toLocaleString()}</p>
                      </div>
                      <div className="p-5 bg-blue-500/5 backdrop-blur-sm rounded-[2rem] border border-blue-500/10 flex flex-col justify-center space-y-1 text-right">
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest italic">Current Node</p>
                        <p className="text-xl font-black text-blue-600 font-mono italic">₹{trade.livePrice?.toLocaleString()}</p>
                      </div>
                   </div>

                   <div className="flex items-center justify-between px-2 pt-2 relative z-10">
                      <div className="flex items-center gap-4">
                        <CircularGauge value={trade.score} size={48} strokeWidth={4} />
                        <div className="flex flex-col">
                           <span className={`text-[11px] font-black uppercase italic tracking-tighter ${trade.isPass !== false ? 'text-emerald-600' : 'text-orange-500'}`}>
                             {trade.isPass !== false ? 'Institutional Pass' : 'Logic Observation'}
                           </span>
                           <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-sm font-black italic ${trade.targetGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {trade.targetGap >= 0 ? '+' : ''}{trade.targetGap?.toFixed(1)}% Alpha
                              </span>
                           </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Entry Window</span>
                        <p className="text-xs font-black text-orange-600 font-mono">{trade.entryPrice > 0 ? (((trade.livePrice - trade.entryPrice)/trade.entryPrice) * 100).toFixed(1) : '0.0'}%</p>
                      </div>
                   </div>
                </motion.div>
              );
            })}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default TradeTable;
