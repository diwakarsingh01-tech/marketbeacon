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
  const [selectedStockForReview, setSelectedStockForReview] = useState<any | null>(null);
  
  const isSixtySevenStrategy = strategyId === 'SIXTY_SEVEN_FUNDA';
  
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
    const isWatchlistTab = activeTab === 'watchlist' || activeTab === 'portfolio';
    setVisibleColumns(prev => ({
      ...prev,
      abcd: !isWatchlistTab && !isSixtySevenStrategy,
      observation: !isWatchlistTab,
      basePrice: !isWatchlistTab,
      objective: !isWatchlistTab,
      roi: !isWatchlistTab,
      pending: !isWatchlistTab
    }));
  }, [activeTab, isSixtySevenStrategy]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ 
    key: 'entryTime', 
    direction: 'desc' 
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleShareSignal = (trade: any, method: 'copy' | 'telegram' = 'copy') => {
    const text = `🚨 *MarketBeacon Research: ${trade.symbol}*

⚡️ *Strategy:* ${trade.strategy || 'Institutional Matrix'}
💰 *Price:* ₹${(livePrices?.[trade.symbol] || trade.currentPrice || 0).toLocaleString()}
🎯 *Objective:* ₹${(trade.targetPrice || trade.target || 0).toLocaleString()}
📊 *Audit:* ${trade.isPass ? '✅ Qualified' : '🔍 Observation'}

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

  const handleUpdateReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      symbol: selectedStockForReview.symbol,
      reason_bucket: formData.get('reason_bucket'),
      reason_text: formData.get('reason_text'),
      reason_still_active: formData.get('reason_still_active') === 'true',
      future_growth_prospect: formData.get('future_growth_prospect') === 'true'
    };

    const token = localStorage.getItem('mb_token');
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
    try {
      const res = await fetch(`${API_URL}/api/admin/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSelectedStockForReview(null);
        if (onUpdateReview) onUpdateReview();
      }
    } catch (e) { console.error('Review Update Error:', e); }
  };

  const filteredAndSortedTrades = useMemo(() => {
    let result = trades.map(t => {
      const livePrice = livePrices?.[t.symbol] || t.currentPrice;
      const basePrice = t.actualEntryPrice || t.entryPrice;
      const marketCap = capData?.[t.symbol] || t.marketCap || 0;
      const sector = sectorData?.[t.symbol] || t.sector || 'General';
      const ath = athData?.[t.symbol] || t.ath || 0;
      
      let calculatedRoi = 0;
      if (t.status === 'CLOSED' && t.roi !== undefined) {
        calculatedRoi = t.roi;
      } else if (livePrice && basePrice && basePrice > 0) {
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
        abcd: t.abcd,
        tranche: t.tranche
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
        else if (sortConfig.key === 'marketCap') { valA = a.marketCap; valB = b.marketCap; }
        else if (sortConfig.key === 'dfh') { valA = a.dfh || 0; valB = b.dfh || 0; }
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

  const handleExportCSV = () => {
    const headers = isWatchlist 
      ? ['Symbol', 'Quantity', 'Buy Price', 'CMP', 'Invested', 'Current Value', 'PnL %']
      : ['OBSERVATION', 'SYMBOL', 'SECTOR', 'MARKET CAP', 'BASE PRICE', 'CMP', 'TARGET', 'ROI %'];

    const rows = filteredAndSortedTrades.map(t => {
      if (isWatchlist) {
        const invested = (t.quantity || 0) * (t.buy_price || 0);
        const currentVal = (t.quantity || 0) * (t.livePrice || 0);
        const pnlPer = invested > 0 ? ((currentVal - invested) / invested) * 100 : 0;
        return [t.symbol, t.quantity, t.buy_price, t.livePrice, invested, currentVal, pnlPer.toFixed(2)];
      }
      return [t.entryTime || '-', t.symbol, t.sector, t.marketCap, t.entryPrice, t.livePrice, t.target, t.calculatedRoi.toFixed(2)];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MarketBeacon_${isWatchlist ? 'Portfolio' : 'Signals'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <FilterIcon className="h-2.5 w-2.5 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUpIcon className="h-2.5 w-2.5 ml-1 text-blue-600" /> : <ChevronDownIcon className="h-2.5 w-2.5 ml-1 text-blue-600" />;
  };

  const TableHeader = () => (
    <thead>
      {isWatchlist ? (
        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
          <th className="px-4 py-3 text-left">Instrument</th>
          <th className="px-4 py-3 text-center">Qty</th>
          <th className="px-4 py-3 text-right">Buy Price</th>
          <th className="px-4 py-3 text-right">CMP</th>
          <th className="px-4 py-3 text-right">Inv. Value</th>
          <th className="px-4 py-3 text-right">Curr. Value</th>
          <th className="px-4 py-3 text-right">P&L %</th>
        </tr>
      ) : (
        <tr className="bg-slate-900/5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
          {visibleColumns.observation && <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('entryTime')}><div className="flex items-center">Obs <SortIcon column="entryTime" /></div></th>}
          {visibleColumns.symbol && <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('symbol')}><div className="flex items-center">Symbol <SortIcon column="symbol" /></div></th>}
          {visibleColumns.sector && <th className="px-4 py-3">Sector</th>}
          {visibleColumns.marketCap && <th className="px-4 py-3 cursor-pointer" onClick={() => handleSort('marketCap')}><div className="flex items-center">Cap <SortIcon column="marketCap" /></div></th>}
          {visibleColumns.basePrice && <th className="px-4 py-3 text-right">Base</th>}
          {visibleColumns.cmp && <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort('price')}><div className="flex items-center justify-end">CMP <SortIcon column="price" /></div></th>}
          {visibleColumns.dfh && <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort('dfh')}><div className="flex items-center justify-end">DFH% <SortIcon column="dfh" /></div></th>}
          {visibleColumns.objective && <th className="px-4 py-3 text-right text-fuchsia-600 font-black">Target</th>}
          {visibleColumns.roi && <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort('roi')}><div className="flex items-center justify-end">ROI% <SortIcon column="roi" /></div></th>}
          {visibleColumns.pending && <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort('pending')}><div className="flex items-center justify-end">Gap% <SortIcon column="pending" /></div></th>}
          {visibleColumns.fundamentals && <th className="px-4 py-3 text-right">Audit</th>}
        </tr>
      )}
    </thead>
  );

  return (
    <div className="space-y-4">
      {/* Search and Settings Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/50 px-4 md:px-6 py-3 rounded-2xl border border-slate-100 gap-4">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 border-none rounded-xl pl-9 pr-4 py-2 text-[11px] font-bold focus:bg-white transition-all shadow-inner"
          />
        </div>
        
        <div className="flex items-center justify-between md:justify-end space-x-2 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <button onClick={handleExportCSV} className="p-2 rounded-lg border border-slate-100 bg-white text-slate-400 hover:text-blue-600 transition-all shadow-sm flex items-center space-x-2"><DownloadIcon className="h-3.5 w-3.5" /></button>
            <div className="relative">
              <button onClick={() => setShowColumnSettings(!showColumnSettings)} className={`p-2 rounded-lg border transition-all ${showColumnSettings ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border-slate-100'}`}><SettingsIcon className="h-3.5 w-3.5" /></button>
              {showColumnSettings && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[60]">
                  {Object.entries(visibleColumns).map(([key, isVisible]) => (
                    <button key={key} onClick={() => setVisibleColumns(p => ({...p, [key]: !isVisible}))} className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
                      <span className="text-[10px] font-bold text-slate-600 capitalize">{key}</span>
                      <div className={`h-4 w-4 rounded flex items-center justify-center ${isVisible ? 'bg-blue-600' : 'bg-slate-100'}`}>{isVisible && <CheckIcon className="h-2.5 w-2.5 text-white" />}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
            {filteredAndSortedTrades.length} Matches
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar border border-slate-100 rounded-2xl bg-white">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <TableHeader />
          <tbody className="divide-y divide-slate-50">
            {filteredAndSortedTrades.length === 0 ? (
              <tr><td colSpan={10} className="px-8 py-20 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">No data found</td></tr>
            ) : (
              filteredAndSortedTrades.map((trade, idx) => {
                const capTag = getMarketCapTag(trade.marketCap, trade.symbol);
                const isStarred = userWatchlist?.includes(trade.symbol);
                const highlightClass = idx < 5 && !searchTerm ? "bg-amber-50/20 border-l-2 border-l-amber-400" : "hover:bg-slate-50/50";

                if (isWatchlist) {
                  const invested = (trade.quantity || 0) * (trade.buy_price || 0);
                  const currentVal = (trade.quantity || 0) * (trade.livePrice || 0);
                  const pnl = currentVal - invested;
                  return (
                    <tr key={trade.symbol} className={`${highlightClass} group transition-all text-right`}>
                      <td className="px-4 py-2.5 text-left flex items-center space-x-2 relative">
                        <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-amber-400"><StarIcon className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} /></button>
                        <span className="text-[11px] font-black text-slate-900">{trade.symbol}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <input type="number" defaultValue={trade.quantity || 0} onBlur={(e) => onUpdateHolding?.(trade.symbol, parseInt(e.target.value) || 0, trade.buy_price || 0)} className="w-12 bg-slate-50 rounded text-center text-[10px] font-black p-0.5" />
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" defaultValue={trade.buy_price || 0} onBlur={(e) => onUpdateHolding?.(trade.symbol, trade.quantity || 0, parseFloat(e.target.value) || 0)} className="w-16 bg-slate-50 rounded text-right text-[10px] font-black p-0.5" />
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-black text-blue-600">₹{trade.livePrice?.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-[10px] font-bold text-slate-500">₹{invested.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-[11px] font-black text-slate-900">₹{currentVal.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col items-end">
                           <span className={`text-[10px] font-black ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pnl >= 0 ? '+' : ''}{((pnl/invested)*100).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={trade.symbol} className={`${highlightClass} group transition-all`}>
                    <td className="px-4 py-2.5 flex items-center space-x-3">
                       <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-slate-200 hover:text-amber-400"><StarIcon className={`h-3.5 w-3.5 ${isStarred ? 'fill-current text-amber-400' : ''}`} /></button>
                       <span className="text-[11px] font-black text-slate-900">{trade.symbol}</span>
                       <button onClick={() => handleShareSignal(trade, 'telegram')} className="opacity-0 group-hover:opacity-100 transition-all p-1 text-blue-500"><Share2 className="h-3 w-3" /></button>
                    </td>
                    <td className="px-4 py-2.5 text-[8px] font-black uppercase text-slate-400">{trade.sector}</td>
                    <td className="px-4 py-2.5">{capTag && <span className={`px-2 py-0.5 rounded text-[7px] font-black border ${capTag.class}`}>{capTag.label}</span>}</td>
                    <td className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-400">₹{trade.entryPrice?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-[11px] font-black text-blue-600">₹{trade.livePrice?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-[11px] font-black text-slate-400">{trade.dfh?.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right text-[10px] font-bold text-fuchsia-600">₹{trade.target?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                       <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${trade.calculatedRoi >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                          {trade.calculatedRoi >= 0 ? '+' : ''}{trade.calculatedRoi?.toFixed(1)}%
                       </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[10px] font-black text-orange-500">{trade.targetGap?.toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right"><Link to={`/stock/${trade.symbol}`} className="p-1 hover:bg-blue-50 rounded text-blue-500"><ExternalLink className="h-3 w-3" /></Link></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
         {filteredAndSortedTrades.length === 0 ? (
           <div className="py-20 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest bg-white rounded-3xl border border-slate-100">No data found</div>
         ) : (
           filteredAndSortedTrades.map((trade) => {
             const capTag = getMarketCapTag(trade.marketCap, trade.symbol);
             const isStarred = userWatchlist?.includes(trade.symbol);
             const invested = (trade.quantity || 0) * (trade.buy_price || 0);
             const currentVal = (trade.quantity || 0) * (trade.livePrice || 0);
             const pnl = currentVal - invested;

             return (
               <div key={trade.symbol} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center space-x-3">
                        <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-amber-400">
                           <StarIcon className={`h-4 w-4 ${isStarred ? 'fill-current' : 'text-slate-200'}`} />
                        </button>
                        <div>
                           <h3 className="text-sm font-black text-slate-900 leading-none">{trade.symbol}</h3>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{trade.sector || 'General'}</p>
                        </div>
                     </div>
                     <div className="flex items-center space-x-2">
                        <button onClick={() => handleShareSignal(trade, 'telegram')} className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Share2 className="h-3.5 w-3.5" /></button>
                        <Link to={`/stock/${trade.symbol}`} className="p-2 bg-slate-50 text-slate-400 rounded-xl"><ExternalLink className="h-3.5 w-3.5" /></Link>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                     {isWatchlist ? (
                        <>
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Holdings</p>
                              <p className="text-xs font-black text-slate-900">{trade.quantity || 0} Qty • ₹{trade.buy_price?.toLocaleString()}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current P&L</p>
                              <span className={`text-xs font-black ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 {pnl >= 0 ? '+' : ''}{invested > 0 ? ((pnl/invested)*100).toFixed(1) : '0'}%
                              </span>
                           </div>
                        </>
                     ) : (
                        <>
                           <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Base vs CMP</p>
                              <p className="text-xs font-black text-slate-900">₹{trade.entryPrice?.toLocaleString()} → <span className="text-blue-600">₹{trade.livePrice?.toLocaleString()}</span></p>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Model Obj.</p>
                              <p className="text-xs font-black text-fuchsia-600 italic">₹{trade.target?.toLocaleString()}</p>
                           </div>
                        </>
                     )}
                  </div>

                  <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                     <div className="flex items-center space-x-1">
                        {['a', 'b', 'c', 'd'].map((level) => {
                          const priceAtLevel = trade.abcd?.[level];
                          const isActive = trade.livePrice <= priceAtLevel;
                          return (
                            <div key={level} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black border ${
                              isActive ? 'bg-blue-600 text-white border-blue-700 shadow-sm' : 'bg-white text-slate-400 border-slate-100'
                            }`}>
                              {level.toUpperCase()}
                            </div>
                          );
                        })}
                     </div>
                     <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${trade.calculatedRoi >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trade.calculatedRoi >= 0 ? '+' : ''}{trade.calculatedRoi?.toFixed(1)}% ROI
                     </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                     {capTag && <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border ${capTag.class}`}>{capTag.label}</span>}
                     {trade.isPass && <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest flex items-center"><ShieldCheck className="h-2 w-2 mr-1" /> Institutional Pass</span>}
                  </div>
               </div>
             );
           })
         )}
      </div>

      {/* Review Modal */}
      {selectedStockForReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase italic">Analyst Review</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedStockForReview.symbol}</p>
                </div>
                <button onClick={() => setSelectedStockForReview(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><XIcon className="h-5 w-5 text-slate-400" /></button>
             </div>

             <form onSubmit={handleUpdateReview} className="space-y-6">
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reason Bucket</label>
                      <select name="reason_bucket" defaultValue={selectedStockForReview.review?.reason_bucket} className="w-full bg-slate-50 border-transparent rounded-2xl px-4 py-3.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all">
                         <option value="sentiment">Sentiment / Sector Panic</option>
                         <option value="business">Business Deterioration</option>
                         <option value="fundamentals">Fundamental / Profit Drop</option>
                         <option value="unknown">Unknown / Research Needed</option>
                      </select>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reason Description</label>
                      <textarea name="reason_text" defaultValue={selectedStockForReview.review?.reason_text} className="w-full bg-slate-50 border-transparent rounded-2xl px-4 py-3.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[100px]" placeholder="Explain why the stock fell..." />
                   </div>

                   <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reason Resolved?</label>
                        <select name="reason_still_active" defaultValue={selectedStockForReview.review?.reason_resolved ? 'false' : 'true'} className="w-full bg-slate-50 border-transparent rounded-2xl px-4 py-3.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all">
                           <option value="true">Still Active (Wait)</option>
                           <option value="false">Resolved (Buy Zone)</option>
                        </select>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Future Growth?</label>
                        <select name="future_growth_prospect" defaultValue={selectedStockForReview.review?.future_growth ? 'true' : 'false'} className="w-full bg-slate-50 border-transparent rounded-2xl px-4 py-3.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all">
                           <option value="true">Positive Prospect</option>
                           <option value="false">Negative / Stagnant</option>
                        </select>
                      </div>
                   </div>
                </div>

                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Save Analysis</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeTable;
