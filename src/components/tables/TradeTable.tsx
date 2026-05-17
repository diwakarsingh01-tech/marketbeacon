import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronUp as ChevronUpIcon, 
  ChevronDown as ChevronDownIcon, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  ExternalLink as ExternalLinkIcon, 
  Zap as ZapIcon, 
  Trophy as TrophyIcon, 
  Settings2 as SettingsIcon, 
  Check as CheckIcon, 
  X as XIcon, 
  Briefcase as BriefcaseIcon, 
  Star as StarIcon,
  Download as DownloadIcon,
  ShieldCheck,
  Info as InfoIcon
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
  if (symbol === 'AKZOINDIA') {
    return { label: 'Small Cap', class: 'text-amber-600 bg-amber-50 border-amber-100' };
  }
  const capInCr = cap / 10000000;
  if (capInCr > 100000) return { label: 'Large Cap', class: 'text-blue-600 bg-blue-50 border-blue-100' };
  if (capInCr > 33000) return { label: 'Mid Cap', class: 'text-purple-600 bg-purple-50 border-purple-100' };
  if (capInCr > 15000) return { label: 'Small Cap', class: 'text-amber-600 bg-amber-50 border-amber-100' };
  return { label: 'Micro Cap', class: 'text-slate-500 bg-slate-50 border-slate-100' };
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
    // Keep ABCD visible if not in watchlist
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
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/reviews`, {
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
      : [
          ...(visibleColumns.observation ? ['OBSERVATION'] : []),
          ...(visibleColumns.symbol ? ['SYMBOL'] : []),
          ...(visibleColumns.sector ? ['SECTOR'] : []),
          ...(visibleColumns.marketCap ? ['MARKET CAP'] : []),
          ...(isSixtySevenStrategy ? ['REASON', 'STATUS'] : []),
          ...(visibleColumns.abcd ? ['ABCD LADDER'] : []),
          ...(visibleColumns.basePrice ? ['BASE PRICE'] : []),
          ...(visibleColumns.cmp ? ['CMP'] : []),
          ...(visibleColumns.dfh ? ['DFH %'] : []),
          ...(visibleColumns.objective ? ['TARGET'] : []),
          ...(visibleColumns.roi ? ['ROI %'] : []),
          ...(visibleColumns.pending ? ['GAP %'] : []),
          ...(visibleColumns.fundamentals ? ['AUDIT'] : [])
        ];

    const rows = filteredAndSortedTrades.map(t => {
      if (isWatchlist) {
        const invested = (t.quantity || 0) * (t.buy_price || 0);
        const currentVal = (t.quantity || 0) * (t.livePrice || 0);
        const pnlPer = invested > 0 ? ((currentVal - invested) / invested) * 100 : 0;
        return [t.symbol, t.quantity, t.buy_price, t.livePrice, invested, currentVal, pnlPer.toFixed(2)];
      }
      
      const row = [];
      if (visibleColumns.observation) row.push(t.entryTime || '-');
      if (visibleColumns.symbol) row.push(t.symbol);
      if (visibleColumns.sector) row.push(t.sector);
      if (visibleColumns.marketCap) row.push(t.marketCap);
      if (isSixtySevenStrategy) {
        row.push(t.review?.reason_text || '-');
        row.push(t.review?.reason_resolved ? 'RESOLVED' : 'ACTIVE');
      }
      if (visibleColumns.abcd) {
        const a = t.abcd?.a?.toFixed(0) || '-';
        const b = t.abcd?.b?.toFixed(0) || '-';
        const c = t.abcd?.c?.toFixed(0) || '-';
        const d = t.abcd?.d?.toFixed(0) || '-';
        row.push(`A:${a}|B:${b}|C:${c}|D:${d}`);
      }
      if (visibleColumns.basePrice) row.push(t.entryPrice);
      if (visibleColumns.cmp) row.push(t.livePrice);
      if (visibleColumns.dfh) row.push(t.dfh?.toFixed(2) || '0');
      if (visibleColumns.objective) row.push(t.target);
      if (visibleColumns.roi) row.push(t.calculatedRoi.toFixed(2));
      if (visibleColumns.pending) row.push(t.targetGap.toFixed(2));
      if (visibleColumns.fundamentals) row.push('N/A');
      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

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
          {isSixtySevenStrategy && (
            <>
              <th className="px-4 py-3 text-right">Reason</th>
              <th className="px-4 py-3 text-center">Status</th>
            </>
          )}
          {visibleColumns.abcd && (
            <th className="px-4 py-3 text-center">
              <div className="flex items-center justify-center">
                Ladder (ABCD)
                <Link to="/education" className="ml-1 opacity-20 hover:opacity-100 transition-opacity">
                  <InfoIcon className="h-2.5 w-2.5" />
                </Link>
              </div>
            </th>
          )}
          {visibleColumns.basePrice && <th className="px-4 py-3 text-right">Base</th>}
          {visibleColumns.cmp && <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort('price')}><div className="flex items-center justify-end">CMP <SortIcon column="price" /></div></th>}
          {visibleColumns.dfh && <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort('dfh')}><div className="flex items-center justify-end">DFH% <SortIcon column="dfh" /></div></th>}
          {visibleColumns.objective && (
            <th className="px-4 py-3 text-right text-indigo-600">
              <div className="flex items-center justify-end">
                Model Obj.
                <Link to="/education" className="ml-1 opacity-20 hover:opacity-100 transition-opacity">
                  <InfoIcon className="h-2.5 w-2.5" />
                </Link>
              </div>
            </th>
          )}
          {visibleColumns.roi && (
            <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort('roi')}>
              <div className="flex items-center justify-end">
                ROI%
                <Link to="/education" className="ml-1 opacity-20 hover:opacity-100 transition-opacity">
                  <InfoIcon className="h-2.5 w-2.5" />
                </Link>
                <SortIcon column="roi" />
              </div>
            </th>
          )}
          {visibleColumns.pending && <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort('pending')}><div className="flex items-center justify-end">Gap% <SortIcon column="pending" /></div></th>}
          {visibleColumns.fundamentals && <th className="px-4 py-3 text-right">Audit</th>}
        </tr>
      )}
    </thead>
  );

  return (
    <div className="space-y-4">
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
            <button 
              onClick={handleExportCSV}
              className="p-2 rounded-lg border border-slate-100 bg-white text-slate-400 hover:text-blue-600 transition-all shadow-sm flex items-center space-x-2"
              title="Export CSV"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className={`p-2 rounded-lg border transition-all ${showColumnSettings ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                <SettingsIcon className="h-3.5 w-3.5" />
              </button>
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

      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar border border-slate-100 rounded-2xl bg-white">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <TableHeader />
          <tbody className="divide-y divide-slate-50">
            {filteredAndSortedTrades.length === 0 ? (
              <tr><td colSpan={10} className="px-8 py-20 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">No mathematical data found</td></tr>
            ) : (
              filteredAndSortedTrades.map((trade, idx) => {
                const ath = athData?.[trade.symbol] || trade.ath;
                const cap = trade.marketCap;
                const capTag = getMarketCapTag(cap, trade.symbol);
                const isTopFive = idx < 5 && !searchTerm; 
                const isStarred = userWatchlist?.includes(trade.symbol);
                const highlightClass = isTopFive ? "bg-amber-50/20 border-l-2 border-l-amber-400" : "hover:bg-slate-50/50";

                if (isWatchlist) {
                  const invested = (trade.quantity || 0) * (trade.buy_price || 0);
                  const currentVal = (trade.quantity || 0) * (trade.livePrice || 0);
                  const pnl = currentVal - invested;
                  const pnlPer = invested > 0 ? (pnl / invested) * 100 : 0;

                  return (
                    <tr key={trade.symbol} className={`${highlightClass} group transition-all text-right`}>
                      <td className="px-4 py-2.5 text-left flex items-center space-x-2">
                        <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-amber-400"><StarIcon className="h-3.5 w-3.5 fill-current" /></button>
                        <span className="text-[11px] font-black text-slate-900">{trade.symbol}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <input type="number" defaultValue={trade.quantity || 0} onBlur={(e) => onUpdateHolding?.(trade.symbol, parseInt(e.target.value) || 0, trade.buy_price || 0)} className="w-12 bg-slate-50 rounded text-center text-[10px] font-black p-0.5" />
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" defaultValue={trade.buy_price || 0} onBlur={(e) => onUpdateHolding?.(trade.symbol, trade.quantity || 0, parseFloat(e.target.value) || 0)} className="w-16 bg-slate-50 rounded text-right text-[10px] font-black p-0.5" />
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-black text-blue-600">₹{trade.livePrice?.toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                      <td className="px-4 py-2.5 text-[10px] font-bold text-slate-500">₹{invested.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                      <td className="px-4 py-2.5 text-[11px] font-black text-slate-900">₹{currentVal.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col items-end">
                           <span className={`text-[10px] font-black ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pnl >= 0 ? '+' : ''}{pnlPer.toFixed(1)}%</span>
                           <span className="text-[7px] font-bold opacity-40 text-slate-400">₹{Math.abs(pnl).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={trade.symbol} className={`${highlightClass} group transition-all`}>
                    {visibleColumns.observation && (
                      <td className="px-4 py-2.5 flex items-center space-x-3">
                        <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-slate-200 hover:text-amber-400 transition-colors"><StarIcon className={`h-3.5 w-3.5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} /></button>
                        <span className="text-[9px] font-bold text-slate-400">{trade.entryTime || '-'}</span>
                      </td>
                    )}
                    {visibleColumns.symbol && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center space-x-1">
                          <span className="text-[11px] font-black text-slate-900">{trade.symbol}</span>
                          {isTopFive && <ZapIcon className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />}
                        </div>
                      </td>
                    )}
                    {visibleColumns.sector && <td className="px-4 py-2.5 text-[8px] font-black uppercase text-slate-400 truncate max-w-[80px]">{trade.sector || 'N/A'}</td>}
                    {visibleColumns.marketCap && <td className="px-4 py-2.5">{capTag && <span className={`px-2 py-0.5 rounded text-[7px] font-black border ${capTag.class}`}>{capTag.label}</span>}</td>}
                    
                    {isSixtySevenStrategy && (
                      <>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-col text-right">
                            <span className="text-[8px] font-black uppercase text-slate-400">{trade.review?.reason_bucket || 'unknown'}</span>
                            <span className="text-[9px] font-bold text-slate-600 truncate max-w-[120px]">{trade.review?.reason_text || 'No review'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button 
                            onClick={() => setSelectedStockForReview(trade)}
                            className={`px-2 py-0.5 rounded text-[7px] font-black border ${trade.review?.reason_resolved ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-red-600 bg-red-50 border-red-100'}`}
                          >
                            {trade.review?.reason_resolved ? 'RESOLVED' : 'ACTIVE'}
                          </button>
                        </td>
                      </>
                    )}

                    {visibleColumns.abcd && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center space-x-1">
                          {['a', 'b', 'c', 'd'].map((level) => {
                            const priceAtLevel = trade.abcd?.[level];
                            // Skip Level A for High Beta (gap 15) or if tranche is B1
                            const isSkipped = level === 'a' && (trade.abcd?.gap === 15);
                            const isActive = trade.livePrice <= priceAtLevel;
                            
                            return (
                              <div key={level} className="group/ladder relative">
                                <div className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-black border transition-all ${
                                  isSkipped ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' :
                                  isActive ? 'bg-blue-600 text-white border-blue-700 shadow-sm scale-110' :
                                  'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                }`}>
                                  {isSkipped ? '×' : level.toUpperCase()}
                                </div>
                                {priceAtLevel && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/ladder:block bg-slate-900 text-white text-[7px] px-1.5 py-0.5 rounded whitespace-nowrap z-50">
                                    {isSkipped ? 'A Skipped: ' : `${level.toUpperCase()}: `}₹{priceAtLevel.toFixed(0)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    )}
                    {visibleColumns.basePrice && <td className="px-4 py-2.5 text-[10px] font-bold text-slate-400 text-right">{ trade.entryPrice ? `₹${trade.entryPrice.toLocaleString(undefined, {maximumFractionDigits:0})}` : '-' }</td>}
                    {visibleColumns.cmp && <td className="px-4 py-2.5 text-[11px] font-black text-blue-600 text-right">₹{trade.livePrice?.toLocaleString(undefined, {maximumFractionDigits:1})}</td>}
                    {visibleColumns.dfh && (
                      <td className="px-4 py-2.5 text-right">
                        <span className={`text-[10px] font-black ${trade.dfh <= -15 ? 'text-red-500' : 'text-slate-400'}`}>
                          {trade.dfh?.toFixed(1)}%
                        </span>
                      </td>
                    )}
                    {visibleColumns.objective && <td className="px-4 py-2.5 text-[10px] font-bold text-blue-600 text-right">₹{trade.target?.toLocaleString(undefined, {maximumFractionDigits:0})}</td>}
                    {visibleColumns.roi && (
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex flex-col items-end">
                           <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${trade.calculatedRoi >= 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                              {trade.calculatedRoi >= 0 ? '+' : ''}{trade.calculatedRoi?.toFixed(1)}%
                           </span>
                           {trade.rejectionReason && (
                              <span className="text-[7px] font-black text-red-500 uppercase tracking-tighter mt-1 italic">
                                 {trade.rejectionReason}
                              </span>
                           )}
                           {trade.isPass && (
                              <span className="text-[7px] font-black text-emerald-500 uppercase tracking-tighter mt-1 flex items-center">
                                 <ShieldCheck className="h-1.5 w-1.5 mr-0.5" /> Pass
                              </span>
                           )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.pending && <td className="px-4 py-2.5 text-right"><span className={`text-[10px] font-black ${trade.targetGap > 0 ? 'text-orange-500' : 'text-green-500'}`}>{trade.targetGap > 0 ? trade.targetGap.toFixed(1) : '0.0'}%</span></td>}
                    {visibleColumns.fundamentals && <td className="px-4 py-2.5 text-right"><Link to={`/stock/${trade.symbol}`} className="p-1 bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors inline-block"><ExternalLinkIcon className="h-3 w-3" /></Link></td>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
