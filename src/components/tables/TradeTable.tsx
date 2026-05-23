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
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

const getMarketCapTag = (cap: number, symbol: string) => {
  if (['NIFTYBEES', 'BANKBEES'].includes(symbol)) {
    return { label: 'ETF', class: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
  }
  const capInCr = cap / 10000000;
  if (capInCr >= 65000) return { label: 'Large Cap', class: 'text-slate-900 bg-slate-100 border-slate-200' };
  if (capInCr >= 20000) return { label: 'Mid Cap', class: 'text-blue-600 bg-blue-50 border-blue-100' };
  return { label: 'Small Cap', class: 'text-indigo-500 bg-indigo-50/50 border-indigo-100' };
};

const TradeTable: React.FC<TradeTableProps> = ({ 
  trades, livePrices, athData, capData, sectorData, isWatchlist, activeTab, userWatchlist, strategyId, onToggleWatchlist, onUpdateHolding, onUpdateReview 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    observation: true,
    symbol: true,
    sector: true,
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
      sector: true,
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

  // Re-sync sort if tab changes to something with different primary keys
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
    let result = trades.map(t => {
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
        let valA, valB;
        if (sortConfig.key === 'roi') { valA = a.calculatedRoi; valB = b.calculatedRoi; }
        else if (sortConfig.key === 'pending') { valA = a.targetGap; valB = b.targetGap; }
        else if (sortConfig.key === 'symbol') { valA = a.symbol; valB = b.symbol; }
        else if (sortConfig.key === 'price') { valA = a.livePrice || 0; valB = b.livePrice || 0; }
        else if (sortConfig.key === 'entryTime') {
          valA = a.entryTime && a.entryTime !== '-' ? new Date(a.entryTime).getTime() : 0;
          valB = b.entryTime && b.entryTime !== '-' ? new Date(b.entryTime).getTime() : 0;
        } else {
          valA = a[sortConfig.key];
          valB = b[sortConfig.key];
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
    <div className="space-y-4">
      {/* Search and Settings Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100 gap-4 shadow-sm">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-xs font-black uppercase focus:bg-white transition-all shadow-inner"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <button onClick={() => setShowColumnSettings(!showColumnSettings)} className={`p-3 rounded-xl border transition-all ${showColumnSettings ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border-slate-100'}`}><SettingsIcon className="h-4 w-4" /></button>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
            {filteredAndSortedTrades.length} Qualified Assets
          </div>
        </div>
      </div>

      {/* Column Settings Dropdown */}
      {showColumnSettings && (
        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2">
           {Object.entries(visibleColumns).map(([key, isVisible]) => (
             <button key={key} onClick={() => setVisibleColumns(p => ({...p, [key]: !isVisible}))} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isVisible ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border-slate-200'}`}>
                {key}
             </button>
           ))}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden border border-slate-100 rounded-3xl bg-white shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            {activeTab === 'portfolio' ? (
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-5 text-left">Instrument</th>
                <th className="px-6 py-5 text-center">Qty</th>
                <th className="px-6 py-5 text-right">Entry Price</th>
                <th className="px-6 py-5 text-right">CMP</th>
                <th className="px-6 py-5 text-right">Inv. Value</th>
                <th className="px-6 py-5 text-right">Curr. Value</th>
                <th className="px-6 py-5 text-right">P&L %</th>
              </tr>
            ) : (
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                {visibleColumns.observation && <th className="px-6 py-5 cursor-pointer" onClick={() => handleSort('entryTime')}><div className="flex items-center">Obs <SortIcon column="entryTime" /></div></th>}
                {visibleColumns.symbol && <th className="px-6 py-5 cursor-pointer" onClick={() => handleSort('symbol')}><div className="flex items-center">Symbol <SortIcon column="symbol" /></div></th>}
                {visibleColumns.sector && <th className="px-6 py-5">Sector</th>}
                {visibleColumns.marketCap && <th className="px-6 py-5 cursor-pointer" onClick={() => handleSort('marketCap')}><div className="flex items-center">Cap <SortIcon column="marketCap" /></div></th>}
                {visibleColumns.abcd && <th className="px-6 py-5 text-center">ABCD Ladder</th>}
                {visibleColumns.basePrice && <th className="px-6 py-5 text-right">Base</th>}
                {visibleColumns.cmp && <th className="px-6 py-5 text-right cursor-pointer" onClick={() => handleSort('price')}><div className="flex items-center justify-end text-blue-600">CMP <SortIcon column="price" /></div></th>}
                {activeTab === 'hold' && <th className="px-6 py-5 text-right font-black text-slate-500">ATH</th>}
                {visibleColumns.dfh && <th className="px-6 py-5 text-right cursor-pointer" onClick={() => handleSort('dfh')}><div className="flex items-center justify-end">DFH% <SortIcon column="dfh" /></div></th>}
                {visibleColumns.objective && <th className="px-6 py-5 text-right text-fuchsia-600 font-black">Objective</th>}
                {visibleColumns.roi && <th className="px-6 py-5 text-right cursor-pointer" onClick={() => handleSort('roi')}><div className="flex items-center justify-end">ROI% <SortIcon column="roi" /></div></th>}
                {visibleColumns.pending && <th className="px-6 py-5 text-right cursor-pointer" onClick={() => handleSort('pending')}><div className="flex items-center justify-end">Gap% <SortIcon column="pending" /></div></th>}
                {visibleColumns.fundamentals && <th className="px-6 py-5 text-right">Audit</th>}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredAndSortedTrades.length === 0 ? (
              <tr><td colSpan={15} className="px-8 py-20 text-center text-xs font-black text-slate-300 uppercase tracking-[0.4em]">No institutional signals detected</td></tr>
            ) : (
              filteredAndSortedTrades.map((trade) => {
                const capTag = getMarketCapTag(trade.marketCap, trade.symbol);
                const isStarred = userWatchlist?.includes(trade.symbol);
                const ath = athData?.[trade.symbol] || trade.ath || 0;

                if (activeTab === 'portfolio') {
                  const invested = (trade.quantity || 0) * (trade.buy_price || 0);
                  const currentVal = (trade.quantity || 0) * (trade.livePrice || 0);
                  const pnl = currentVal - invested;
                  return (
                    <tr key={trade.symbol} className="hover:bg-slate-50 transition-all font-black text-[11px]">
                      <td className="px-6 py-4 text-left flex items-center space-x-3">
                        <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-slate-200 hover:text-amber-400 transition-colors"><StarIcon className={`h-4 w-4 ${isStarred ? 'fill-current text-amber-400' : ''}`} /></button>
                        <span className="text-slate-900">{trade.symbol}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input type="number" defaultValue={trade.quantity || 0} onBlur={(e) => onUpdateHolding?.(trade.symbol, parseInt(e.target.value) || 0, trade.buy_price || 0)} className="w-16 bg-slate-50 border-none rounded-lg text-center font-black p-1 shadow-inner outline-none focus:bg-white transition-all" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input type="number" defaultValue={trade.buy_price || 0} onBlur={(e) => onUpdateHolding?.(trade.symbol, trade.quantity || 0, parseFloat(e.target.value) || 0)} className="w-20 bg-slate-50 border-none rounded-lg text-right font-black p-1 shadow-inner outline-none focus:bg-white transition-all" />
                      </td>
                      <td className="px-6 py-4 text-right text-blue-600">₹{trade.livePrice?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-500 font-bold">₹{invested.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-900 font-bold">₹{currentVal.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                         <span className={`px-2 py-1 rounded-lg ${pnl >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {pnl >= 0 ? '+' : ''}{invested > 0 ? ((pnl/invested)*100).toFixed(1) : '0.0'}%
                         </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={trade.symbol} className="hover:bg-slate-50 group transition-all font-black text-[11px]">
                    {visibleColumns.observation && (
                      <td className="px-6 py-4 text-[9px] text-slate-400 font-bold uppercase whitespace-nowrap">
                        {trade.entryTime && trade.entryTime !== '-' ? (
                          <div className="flex flex-col">
                            <span>{new Date(trade.entryTime).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <span className="opacity-50">{new Date(trade.entryTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                          </div>
                        ) : '-'}
                      </td>
                    )}
                    {visibleColumns.symbol && (
                      <td className="px-6 py-4 flex items-center space-x-3">
                         <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-slate-200 hover:text-amber-400 transition-colors"><StarIcon className={`h-4 w-4 ${isStarred ? 'fill-current text-amber-400' : ''}`} /></button>
                         <span className="text-slate-900">{trade.symbol}</span>
                         <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => handleShareSignal(trade, 'telegram')} className="p-1 text-blue-500 hover:scale-110 transition-transform"><Share2 className="h-3.5 w-3.5" /></button>
                            <Link to={`/stock/${trade.symbol}`} className="p-1 text-slate-400 hover:text-slate-900"><ExternalLink className="h-3.5 w-3.5" /></Link>
                         </div>
                      </td>
                    )}
                    {visibleColumns.sector && <td className="px-6 py-4 text-[9px] text-slate-400 uppercase truncate max-w-[120px]">{trade.sector}</td>}
                    {visibleColumns.marketCap && <td className="px-6 py-4">{capTag && <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${capTag.class}`}>{capTag.label}</span>}</td>}
                    {visibleColumns.abcd && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          {['a', 'b', 'c', 'd'].map((l) => {
                            const levelVal = trade.abcd?.[l] || 0;
                            const isActive = (trade.livePrice || 0) <= levelVal;
                            return (
                              <div key={l} title={`Level ${l.toUpperCase()}: ₹${levelVal.toLocaleString()}`} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border transition-all ${isActive ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-110' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                                {l.toUpperCase()}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    )}
                    {visibleColumns.basePrice && <td className="px-6 py-4 text-right text-slate-400 font-bold">₹{trade.entryPrice?.toLocaleString()}</td>}
                    {visibleColumns.cmp && <td className="px-6 py-4 text-right text-blue-600 font-black">₹{trade.livePrice?.toLocaleString()}</td>}
                    {activeTab === 'hold' && <td className="px-6 py-4 text-right text-slate-400 font-bold">₹{ath?.toLocaleString() || '-'}</td>}
                    {visibleColumns.dfh && <td className="px-6 py-4 text-right text-slate-400 font-medium">{trade.dfh?.toFixed(1)}%</td>}
                    {visibleColumns.objective && <td className="px-6 py-4 text-right text-fuchsia-600 font-black">₹{trade.target?.toLocaleString()}</td>}
                    {visibleColumns.roi && (
                      <td className="px-6 py-4 text-right">
                         <div className="flex flex-col items-end">
                            <span className={`text-[11px] font-black ${trade.targetGap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {trade.targetGap >= 0 ? '+' : ''}{trade.targetGap?.toFixed(1)}%
                            </span>
                            <span className="text-[7px] text-slate-400 uppercase font-black tracking-tighter">Upside</span>
                         </div>
                      </td>
                    )}
                    {visibleColumns.pending && (
                      <td className="px-6 py-4 text-right">
                         <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-orange-500">
                               {trade.entryPrice > 0 ? (((trade.livePrice - trade.entryPrice)/trade.entryPrice) * 100).toFixed(1) : '0.0'}%
                            </span>
                            <span className="text-[7px] text-slate-400 uppercase font-black tracking-tighter">Gap to Base</span>
                         </div>
                      </td>
                    )}
                    {visibleColumns.fundamentals && (
                      <td className="px-6 py-4 text-right">
                        <Link to={`/stock/${trade.symbol}`} className="p-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-slate-400 transition-all inline-block shadow-sm">
                           <ShieldCheck className="h-4 w-4" />
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Refined with Telegram Share) */}
      <div className="md:hidden space-y-4">
         {filteredAndSortedTrades.map((trade) => {
           const isStarred = userWatchlist?.includes(trade.symbol);
           return (
            <div key={trade.symbol} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm space-y-4 relative overflow-hidden">
               <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                     <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-slate-200 hover:text-amber-400 transition-colors"><StarIcon className={`h-5 w-5 ${isStarred ? 'fill-current text-amber-400' : ''}`} /></button>
                     <div>
                        <h3 className="text-base font-black text-slate-900 leading-none">{trade.symbol}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{trade.sector}</p>
                     </div>
                  </div>
                  <div className="flex items-center space-x-2">
                     <button onClick={() => handleShareSignal(trade, 'telegram')} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Share2 className="h-4 w-4" /></button>
                     <Link to={`/stock/${trade.symbol}`} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><ExternalLink className="h-4 w-4" /></Link>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Base vs CMP</p>
                    <p className="text-xs font-black text-slate-900">₹{trade.entryPrice?.toLocaleString()} → <span className="text-blue-600">₹{trade.livePrice?.toLocaleString()}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Upside Target</p>
                    <p className="text-xs font-black text-fuchsia-600">₹{trade.target?.toLocaleString()} ({trade.targetGap?.toFixed(1)}%)</p>
                  </div>
               </div>
               <div className="flex items-center justify-between pt-2">
                  <span className={`text-[10px] font-black uppercase tracking-tighter ${trade.isPass !== false ? 'text-emerald-600' : 'text-orange-500'}`}>
                    {trade.isPass !== false ? '✅ Qualified Signal' : '🔍 Observation Mode'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase italic">
                    {trade.entryTime && trade.entryTime !== '-' ? new Date(trade.entryTime).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                  </span>
               </div>
            </div>
           );
         })}
      </div>
    </div>
  );
};

export default TradeTable;
