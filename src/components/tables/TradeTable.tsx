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
  ChevronRight,
  Trash2,
  TrendingUp
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
  setActiveTab?: (tab: any) => void;
  userWatchlist?: string[];
  strategyId?: string;
  onToggleWatchlist?: (symbol: string) => void;
  onUpdateHolding?: (symbol: string, quantity: number, buyPrice: number) => void;
  onUpdateReview?: () => void;
  portfolioCount?: number;
  openCount?: number;
  neutralCount?: number;
  rejectedCount?: number;
  watchlistCount?: number;
  onAddPositionClick?: () => void;
  onConnectNodeClick?: () => void;
}

const EmptyState = ({ activeTab, searchTerm, onClearSearch, onAddPosition, onConnectNode, onGoToScreener }: any) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 max-w-md mx-auto animate-in fade-in duration-500">
      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
        <ZapIcon className="h-5 w-5 text-slate-300" />
      </div>
      
      {searchTerm ? (
        <>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">No Matching Nodes</h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-relaxed mb-5">
            We couldn't find any assets matching "{searchTerm}". Try refining your search query.
          </p>
          <button 
            onClick={onClearSearch}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95 border border-white/5"
          >
            Clear Search Filter
          </button>
        </>
      ) : activeTab === 'portfolio' ? (
        <>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Wealth Desk is Empty</h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-relaxed mb-5">
            No institutional assets are currently active in your portfolio ledger. Upload new details or enter assets manually to begin monitoring.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={onAddPosition}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              + Add Position
            </button>
            <button 
              onClick={onConnectNode}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95 border border-white/5"
            >
              Upload New Details
            </button>
            <a 
              href="https://t.me/Marketbeconpro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 flex items-center space-x-1.5 group"
            >
              <TrendingUp className="h-3 w-3 group-hover:scale-110 transition-transform" />
              <span>Get Symbols</span>
            </a>
          </div>
        </>
      ) : activeTab === 'hold' ? (
        <>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Watchlist is Empty</h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-relaxed mb-5">
            Your real-time watch matrix contains zero tracked nodes. Add symbols from the screener to start tracking.
          </p>
          {onGoToScreener && (
            <button 
              onClick={onGoToScreener}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95 border border-white/5"
            >
              Go to Screener
            </button>
          )}
        </>
      ) : (
        <>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">No Screener Signals Detected</h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-relaxed mb-2">
            No institutional assets in the current basket match the selected criteria.
          </p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">
            Check other filters or matrices for active setups.
          </p>
        </>
      )}
    </div>
  );
};

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
  trades, 
  livePrices, 
  athData, 
  capData, 
  sectorData, 
  activeTab, 
  setActiveTab,
  userWatchlist, 
  strategyId, 
  onToggleWatchlist, 
  onUpdateHolding,
  portfolioCount,
  openCount,
  neutralCount,
  rejectedCount,
  watchlistCount,
  onAddPositionClick,
  onConnectNodeClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const visibleTabs = useMemo(() => {
    if (activeTab === 'portfolio' || activeTab === 'hold') {
      return [];
    }
    return [
      { id: 'open', label: 'Qualified', count: openCount || 0 },
      { id: 'neutral', label: 'Neutral', count: neutralCount || 0 },
      { id: 'rejected', label: 'Rejected', count: rejectedCount || 0 },
    ];
  }, [activeTab, openCount, neutralCount, rejectedCount]);
  
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white/50 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-slate-100 gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
          {/* Search Input */}
          <div className="relative w-full md:max-w-xs">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Symbols..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:bg-white focus:border-blue-500/20 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Compact Pill Tabs */}
          {setActiveTab && visibleTabs.length > 0 && (
            <div className="flex flex-wrap items-center bg-slate-200/40 p-1 rounded-xl border border-slate-200/50 gap-0.5 max-w-full overflow-x-auto no-scrollbar shadow-inner">
               {visibleTabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                     activeTab === tab.id 
                       ? 'bg-white text-slate-900 shadow-md border border-slate-200/20' 
                       : 'text-slate-500 hover:text-slate-900 hover:bg-white/20'
                   }`}
                 >
                   <span>{tab.label}</span>
                   <span className={`ml-1.5 px-2 py-0.5 bg-slate-200/80 text-slate-600 rounded-lg text-[8px] font-black ${activeTab === tab.id ? 'bg-slate-ink text-white' : ''}`} style={activeTab === tab.id ? { backgroundColor: 'var(--slate-ink)' } : {}}>
                     {tab.count}
                   </span>
                 </button>
               ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 shrink-0 justify-end w-full lg:w-auto">
          <button 
            onClick={handleExportCSV} 
            className="flex items-center gap-3 px-6 py-3 bg-slate-INK text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 group border border-white/5"
            style={{ backgroundColor: 'var(--slate-ink)' }}
          >
            <DownloadIcon className="h-3.5 w-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
            <span>Export Matrix</span>
          </button>
          <button 
            onClick={() => setShowColumnSettings(!showColumnSettings)} 
            className={`p-3 rounded-2xl border transition-all ${showColumnSettings ? 'bg-slate-ink text-white border-blue-500/30' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
            style={showColumnSettings ? { backgroundColor: 'var(--slate-ink)' } : {}}
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm italic whitespace-nowrap">
            {filteredAndSortedTrades.length} Nodes
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

      <div className="hidden md:block border border-slate-100 rounded-[1.5rem] bg-white shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              {activeTab === 'portfolio' ? (
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                  <th className="px-6 py-3.5 text-left">Asset Node</th>
                  <th className="px-4 py-3.5 text-center">Qty</th>
                  <th className="px-4 py-3.5 text-right">Entry Base</th>
                  <th className="px-4 py-3.5 text-right">CMP</th>
                  <th className="px-4 py-3.5 text-right">Invested Value</th>
                  <th className="px-4 py-3.5 text-right">Current Node</th>
                  <th className="px-4 py-3.5 text-right">Yield %</th>
                  <th className="px-6 py-3.5 text-right">Audit</th>
                </tr>
              ) : (
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 italic">
                  {visibleColumns.observation && <th className="px-6 py-3.5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('entryTime')}><div className="flex items-center gap-1">Obs <SortIcon column="entryTime" /></div></th>}
                  {visibleColumns.symbol && <th className="px-4 py-3.5 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('symbol')}><div className="flex items-center gap-1">Asset Node <SortIcon column="symbol" /></div></th>}
                  {visibleColumns.marketCap && <th className="px-4 py-3.5 cursor-pointer hover:text-blue-600 transition-colors text-center" onClick={() => handleSort('marketCap')}><div className="flex items-center justify-center gap-1">Tier <SortIcon column="marketCap" /></div></th>}
                  {visibleColumns.abcd && <th className="px-4 py-3.5 text-center">ABCD Ladder</th>}
                  {visibleColumns.basePrice && <th className="px-4 py-3.5 text-right">Base</th>}
                  {visibleColumns.cmp && <th className="px-4 py-3.5 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('price')}><div className="flex items-center justify-end text-blue-600 gap-1">CMP <SortIcon column="price" /></div></th>}
                  {visibleColumns.dfh && <th className="px-4 py-3.5 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('dfh')}><div className="flex items-center justify-end gap-1">DFH% <SortIcon column="dfh" /></div></th>}
                  {visibleColumns.objective && <th className="px-4 py-3.5 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('target')}><div className="flex items-center justify-end gap-1">Objective <SortIcon column="target" /></div></th>}
                  {visibleColumns.roi && <th className="px-4 py-3.5 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('roi')}><div className="flex items-center justify-end gap-1 text-emerald-600">ROI% (Alpha) <SortIcon column="roi" /></div></th>}
                  {visibleColumns.pending && <th className="px-4 py-3.5 text-right cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort('pending')}><div className="flex items-center justify-end gap-1">Gap% (Window) <SortIcon column="pending" /></div></th>}
                  {visibleColumns.fundamentals && <th className="px-6 py-3.5 text-right">Audit</th>}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-50 font-mono">
              {filteredAndSortedTrades.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-6 py-12">
                    <EmptyState 
                      activeTab={activeTab} 
                      searchTerm={searchTerm} 
                      onClearSearch={() => setSearchTerm('')} 
                      onAddPosition={onAddPositionClick}
                      onConnectNode={onConnectNodeClick}
                      onGoToScreener={() => setActiveTab?.('open')}
                    />
                  </td>
                </tr>
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
                          <td className="px-6 py-2.5 text-left">
                            <div className="flex items-center space-x-3">
                              <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-slate-200 hover:text-amber-400 transition-all active:scale-90 shrink-0">
                                 <StarIcon className={`h-4 w-4 ${isStarred ? 'fill-current text-amber-400' : ''}`} />
                              </button>
                              <div className="flex flex-col font-sans">
                                 <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tighter leading-none">{trade.symbol}</span>
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{trade.sector}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <input 
                              type="number" 
                              defaultValue={trade.quantity || 0} 
                              onBlur={(e) => onUpdateHolding?.(trade.symbol, parseInt(e.target.value) || 0, trade.buy_price || 0)} 
                              className="w-16 bg-slate-50/50 border border-slate-200 rounded-lg text-center font-mono font-bold py-1 px-1.5 text-xs outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 hover:border-slate-300 transition-all shadow-sm" 
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <input 
                              type="number" 
                              defaultValue={trade.buy_price || 0} 
                              onBlur={(e) => onUpdateHolding?.(trade.symbol, trade.quantity || 0, parseFloat(e.target.value) || 0)} 
                              className="w-24 bg-slate-50/50 border border-slate-200 rounded-lg text-right font-mono font-bold py-1 px-2 text-xs outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 hover:border-slate-300 transition-all shadow-sm" 
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right text-blue-600 font-bold italic">₹{trade.livePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400 font-medium opacity-80">₹{invested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-right text-slate-900 font-bold">₹{currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`px-2.5 py-1 rounded-lg font-black text-[9px] italic tracking-tighter ${pnl >= 0 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-600 border border-rose-500/10'}`}>
                                {pnl >= 0 ? '+' : ''}{invested > 0 ? ((pnl/invested)*100).toFixed(1) : '0.0'}% Yield
                            </span>
                          </td>
                          <td className="px-6 py-2.5 text-right">
                            <div className="flex items-center justify-end space-x-3">
                               <div className="flex items-center justify-end gap-2 font-sans">
                                 {trade.isPass !== false ? (
                                   <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[9px] font-black tracking-wide shrink-0">
                                     <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                     PASS
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-[9px] font-black tracking-wide shrink-0">
                                     <span className="w-1 h-1 rounded-full bg-amber-500" />
                                     OBS
                                   </div>
                                 )}
                                 <div className="flex flex-col items-end min-w-[32px]">
                                   <span className="text-xs font-black text-slate-900 leading-none">{trade.score || 0}</span>
                                   <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Audit</span>
                                 </div>
                               </div>
                               <div className="flex items-center gap-1 shrink-0">
                                 <Link to={`/stock/${trade.symbol}`} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-ink hover:text-white transition-all shrink-0">
                                    <InfoIcon className="h-3.5 w-3.5" />
                                 </Link>
                                 <button onClick={(e) => { e.preventDefault(); if (window.confirm(`Remove ${trade.symbol} from portfolio?`)) onToggleWatchlist?.(trade.symbol); }} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white transition-all">
                                    <Trash2 className="h-3.5 w-3.5" />
                                 </button>
                               </div>
                            </div>
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
                          <td className="px-6 py-2.5 text-[9px] text-slate-400 font-bold uppercase whitespace-nowrap italic">
                            {(() => {
                              if (!trade.entryTime || trade.entryTime === '-') return '-';
                              const d = new Date(trade.entryTime);
                              if (isNaN(d.getTime())) return '-';
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-slate-600">{d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  <span className="opacity-40 text-[7px]">{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })} NODE</span>
                                </div>
                              );
                            })()}
                          </td>
                        )}
                        {visibleColumns.symbol && (
                          <td className="px-4 py-2.5">
                            <div className="flex items-center space-x-3">
                               <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-slate-200 hover:text-amber-400 transition-all active:scale-90 shrink-0">
                                  <StarIcon className={`h-4 w-4 ${isStarred ? 'fill-current text-amber-400' : ''}`} />
                               </button>
                               <div className="flex flex-col font-sans">
                                  <span className="text-sm font-black text-slate-950 group-hover:text-blue-600 transition-colors tracking-tighter leading-none">{trade.symbol}</span>
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{trade.sector}</span>
                                </div>
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-auto pr-2 shrink-0">
                                  <button onClick={() => handleShareSignal(trade, 'telegram')} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Share2 className="h-3 w-3" /></button>
                                  <Link to={`/stock/${trade.symbol}`} className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-ink hover:text-white transition-all"><ExternalLink className="h-3 w-3" /></Link>
                               </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.marketCap && (
                          <td className="px-4 py-2.5 text-center">
                            {capTag && <span className={`px-2 py-0.5 rounded text-[8px] font-black border tracking-widest ${capTag.class}`}>{capTag.label}</span>}
                          </td>
                        )}
                        {visibleColumns.abcd && (
                          <td className="px-4 py-2.5 text-center group/ladder relative">
                            <div className="flex items-center justify-center space-x-1.5 cursor-help">
                              {['a', 'b', 'c', 'd'].map((l) => {
                                const levelObj = trade.abcd?.[l];
                                const levelVal = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                                const isActive = (trade.livePrice || 0) <= levelVal && levelVal > 0;
                                const levelColor = l === 'a' ? (isActive ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/40' : 'bg-blue-50 text-blue-400 border-blue-100') :
                                                 (l === 'b' || l === 'c') ? (isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/40' : 'bg-indigo-50 text-indigo-400 border-indigo-100') :
                                                 (isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/40' : 'bg-emerald-50 text-emerald-400 border-emerald-100');

                                return (
                                  <div key={l} className={`w-5.5 h-5.5 rounded flex items-center justify-center text-[8px] font-black border-2 transition-all ${levelColor} ${isActive ? 'shadow-md scale-110 z-10' : 'opacity-30'}`}>
                                    {l.toUpperCase()}
                                  </div>
                                );
                              })}
                            </div>
                            <div className={`absolute left-1/2 -translate-x-1/2 z-[200] hidden group-hover/ladder:block bg-slate-950 text-white shadow-2xl rounded-xl p-4 animate-in fade-in duration-300 min-w-[200px] ${
                              idx < 2 
                                ? 'top-full mt-3 slide-in-from-top-2' 
                                : 'bottom-full mb-3 slide-in-from-bottom-2'
                            }`}>
                               <div className="space-y-2">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Institutional Ladder</span>
                                     <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                  </div>
                                  {['a', 'b', 'c', 'd'].map((l) => {
                                    const levelObj = trade.abcd?.[l];
                                    const price = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                                    const date = typeof levelObj === 'object' ? levelObj.date : null;
                                    
                                    return (
                                      <div key={l} className="flex justify-between items-center text-[10px]">
                                        <div className="flex flex-col text-left">
                                          <span className={`font-black ${l === 'a' ? 'text-blue-400' : l === 'd' ? 'text-emerald-400' : 'text-slate-400'}`}>Entry {l.toUpperCase()}</span>
                                          {date && <span className="text-[7px] text-slate-500 font-bold uppercase">{date}</span>}
                                        </div>
                                        <span className="font-bold text-white italic">₹{price?.toLocaleString()}</span>
                                      </div>
                                    );
                                  })}
                               </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.basePrice && <td className="px-4 py-2.5 text-right text-slate-400 font-semibold italic">₹{trade.entryPrice?.toLocaleString()}</td>}
                        {visibleColumns.cmp && <td className="px-4 py-2.5 text-right text-blue-600 font-bold italic bg-slate-50/50 shadow-inner">₹{trade.livePrice?.toLocaleString()}</td>}
                        {visibleColumns.dfh && <td className="px-4 py-2.5 text-right text-slate-400 font-medium opacity-80 italic">{trade.dfh?.toFixed(1)}%</td>}
                        {visibleColumns.objective && <td className="px-4 py-2.5 text-right text-fuchsia-600 font-bold font-mono">₹{trade.target?.toLocaleString()}</td>}
                        {visibleColumns.roi && (
                          <td className="px-4 py-2.5 text-right">
                             <div className="flex flex-col items-end">
                                <span className={`text-sm font-black tracking-tighter italic ${trade.targetGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                   {trade.targetGap >= 0 ? '+' : ''}{trade.targetGap?.toFixed(1)}%
                                </span>
                                <span className="text-[7px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Objective Alpha</span>
                             </div>
                          </td>
                        )}
                        {visibleColumns.pending && (
                          <td className="px-4 py-2.5 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-orange-600 italic">
                                   {trade.entryPrice > 0 ? (((trade.livePrice - trade.entryPrice)/trade.entryPrice) * 100).toFixed(1) : '0.0'}%
                                </span>
                                <span className="text-[7px] text-slate-400 uppercase font-black tracking-widest mt-0.5">Entry Window</span>
                             </div>
                          </td>
                        )}
                        {visibleColumns.fundamentals && (
                          <td className="px-6 py-2.5 text-right">
                            <div className="flex items-center justify-end space-x-3">
                               {trade.peRatio > 0 && (
                                 <div className="flex flex-col items-end mr-2">
                                    {(() => {
                                      const avgMedian = (Number(trade.peMedians?.pe3Y || 0) + Number(trade.peMedians?.pe5Y || 0)) / 2;
                                      const isHigh = avgMedian > 0 && trade.peRatio > avgMedian;
                                      return (
                                        <>
                                          <span className={`text-xs font-bold italic ${isHigh ? 'text-rose-600 animate-pulse' : 'text-slate-600'}`}>{trade.peRatio?.toFixed(1)}</span>
                                          <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Current PE</span>
                                        </>
                                      );
                                    })()}
                                 </div>
                               )}
                               <div className="flex items-center justify-end gap-2 font-sans">
                                 {trade.isPass !== false ? (
                                   <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[9px] font-black tracking-wide shrink-0">
                                     <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                     PASS
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-[9px] font-black tracking-wide shrink-0">
                                     <span className="w-1 h-1 rounded-full bg-amber-500" />
                                     OBS
                                   </div>
                                 )}
                                 <div className="flex flex-col items-end min-w-[32px]">
                                   <span className="text-xs font-black text-slate-900 leading-none">{trade.score || 0}</span>
                                   <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">Audit</span>
                                 </div>
                               </div>
                               <Link to={`/stock/${trade.symbol}`} className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-ink hover:text-white transition-all shrink-0">
                                  <InfoIcon className="h-3.5 w-3.5" />
                               </Link>
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
      <div className="md:hidden space-y-3 px-2">
         <AnimatePresence>
            {filteredAndSortedTrades.map((trade, idx) => {
              const isStarred = userWatchlist?.includes(trade.symbol);
              const capTag = getMarketCapTag(trade.marketCap, trade.symbol);
              const isExpanded = expandedSymbol === trade.symbol;
              
              // 1-day Change percent estimate from live prices
              const changePercent = trade.change || 0;
              const isPositive = changePercent >= 0;

              return (
                <motion.div 
                   key={trade.symbol} 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                   className="bg-white rounded-[1.25rem] border border-slate-100/80 shadow-md shadow-slate-100 overflow-hidden"
                >
                   {/* Clickable Header Area */}
                   <div 
                      onClick={() => setExpandedSymbol(isExpanded ? null : trade.symbol)}
                      className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
                   >
                      {/* Left: Symbol & Details */}
                      <div className="flex items-center space-x-3">
                         <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                               <span className="text-sm font-black text-slate-900 tracking-tight font-mono uppercase">{trade.symbol}</span>
                               <span className={`px-1.5 py-0.5 rounded-[0.25rem] text-[6.5px] font-black border tracking-wider leading-none ${capTag.class}`}>{capTag.label}</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{trade.sector}</span>
                         </div>
                      </div>
                      
                      {/* Right: Price & Toggle */}
                      <div className="flex items-center space-x-3">
                         <div className="text-right flex flex-col items-end">
                            <span className="text-sm font-extrabold text-slate-900 font-mono">₹{trade.livePrice?.toLocaleString()}</span>
                            <span className={`text-[8.5px] font-black font-mono leading-none mt-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                            </span>
                         </div>
                         <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                   </div>

                   {/* Quick Info (Always Visible: ABCD ladder & status) */}
                   <div className="px-4 pb-3 flex items-center justify-between border-b border-slate-50">
                      {/* ABCD indicators */}
                      {visibleColumns.abcd ? (
                         <div className="flex items-center space-x-1">
                            {['a', 'b', 'c', 'd'].map((l) => {
                              const levelObj = trade.abcd?.[l];
                              const levelVal = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                              const isActive = (trade.livePrice || 0) <= levelVal && levelVal > 0;
                              const levelColor = l === 'a' ? (isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50/50 text-blue-300 border-blue-100/40') :
                                               (l === 'b' || l === 'c') ? (isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50/50 text-indigo-300 border-indigo-100/40') :
                                               (isActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50/50 text-emerald-300 border-emerald-100/40');

                              return (
                                <div key={l} className={`w-5 h-5 rounded-[0.35rem] flex items-center justify-center text-[7px] font-black border transition-all ${levelColor} ${isActive ? 'scale-105 font-black opacity-100' : 'opacity-40'}`}>
                                  {l.toUpperCase()}
                                </div>
                              );
                            })}
                         </div>
                      ) : (
                         <div className="text-[9px] font-bold text-slate-400">Institutional Strategy</div>
                      )}

                      {/* Buy Zone Status */}
                      <div className="flex items-center gap-1.5">
                         {trade.isBuyZone ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[8px] font-black">BUY ZONE</span>
                         ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-full text-[8px] font-black">HOLD</span>
                         )}
                      </div>
                   </div>

                   {/* Expanded Details Section */}
                   {isExpanded && (
                      <div className="p-4 bg-slate-50/40 border-t border-slate-50 space-y-4 animate-in slide-in-from-top-1 duration-200">
                         {/* ABCD Prices */}
                         {visibleColumns.abcd && trade.abcd && (
                            <div className="bg-white p-3 rounded-[0.75rem] border border-slate-100/80 space-y-1.5 shadow-sm">
                               <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1 mb-1">Entry Tranche Target Levels</div>
                               <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  {['a', 'b', 'c', 'd'].map((l) => {
                                     const levelObj = trade.abcd?.[l];
                                     const price = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                                     return (
                                        <div key={l} className="flex justify-between items-center text-[10px]">
                                           <span className={`font-black uppercase text-[9px] ${l === 'a' ? 'text-blue-500' : l === 'd' ? 'text-emerald-500' : 'text-indigo-500'}`}>T-{l.toUpperCase()}</span>
                                           <span className="font-bold font-mono text-slate-900">₹{price?.toLocaleString()}</span>
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>
                         )}

                         {/* Core Metrics Grid */}
                         <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white p-2.5 rounded-[0.75rem] border border-slate-100/80 text-center flex flex-col justify-center shadow-sm">
                               <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Obs Base</span>
                               <span className="text-xs font-black font-mono text-slate-900">₹{trade.entryPrice?.toLocaleString()}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-[0.75rem] border border-slate-100/80 text-center flex flex-col justify-center shadow-sm">
                               <span className="text-[7.5px] font-black text-fuchsia-500 uppercase tracking-widest leading-none mb-1">Target</span>
                               <span className="text-xs font-black font-mono text-fuchsia-600">₹{trade.target?.toLocaleString()}</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-[0.75rem] border border-slate-100/80 text-center flex flex-col justify-center shadow-sm">
                               <span className="text-[7.5px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">ROI (Est.)</span>
                               <span className="text-xs font-black font-mono text-emerald-600">+{trade.targetGap?.toFixed(1)}%</span>
                            </div>
                         </div>

                         {/* Audit / PE / Score row */}
                         <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-[0.75rem] border border-slate-100/80 shadow-sm text-[10px]">
                            <div className="flex items-center space-x-1.5">
                               {trade.isPass !== false ? (
                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[7.5px] font-black">PASS</span>
                               ) : (
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[7.5px] font-black">OBS</span>
                               )}
                               <span className="font-extrabold text-slate-700">Audit Score:</span>
                               <span className="font-black text-slate-900">{trade.score || 0}</span>
                            </div>
                            {trade.peRatio > 0 && (
                               <div className="flex items-center space-x-1 font-mono">
                                  <span className="font-extrabold text-slate-400 uppercase text-[8px] tracking-wider">PE:</span>
                                  <span className="font-black text-slate-900">{trade.peRatio?.toFixed(1)}</span>
                               </div>
                            )}
                         </div>

                         {/* Action Buttons */}
                         <div className="flex items-center gap-2 pt-1">
                            <button 
                               onClick={(e) => { e.stopPropagation(); onToggleWatchlist?.(trade.symbol); }}
                               className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                                  isStarred 
                                     ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10' 
                                     : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                               }`}
                            >
                               <StarIcon className={`h-3.5 w-3.5 ${isStarred ? 'fill-current text-white' : ''}`} />
                               {isStarred ? 'Watchlisted' : 'Watchlist'}
                            </button>

                            <button 
                               onClick={(e) => { e.stopPropagation(); handleShareSignal(trade, 'telegram'); }}
                               className="px-3.5 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                            >
                               <Share2 className="h-3.5 w-3.5" />
                            </button>

                            <Link 
                               to={`/stock/${trade.symbol}`}
                               className="flex-1 py-2 bg-slate-950 text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1 hover:bg-black transition-all"
                            >
                               <InfoIcon className="h-3.5 w-3.5" />
                               Audit details
                            </Link>
                         </div>
                      </div>
                   )}
                </motion.div>
              );
            })}
         </AnimatePresence>
      </div>
    </div>
  );
};

export default TradeTable;
