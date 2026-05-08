import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TradeTableProps {
  trades: any[];
  livePrices?: Record<string, number>;
  athData?: Record<string, number>;
  capData?: Record<string, number>;
  isWatchlist?: boolean;
}

const getMarketCapTag = (cap: number) => {
  const capInCr = cap / 10000000;
  if (capInCr > 100000) return { label: 'Large Cap', class: 'text-blue-600 bg-blue-50/50 border-blue-100' };
  if (capInCr > 33000) return { label: 'Mid Cap', class: 'text-purple-600 bg-purple-50/50 border-purple-100' };
  if (capInCr > 15000) return { label: 'Small Cap', class: 'text-amber-600 bg-amber-50/50 border-amber-100' };
  return { label: 'Micro Cap', class: 'text-slate-500 bg-slate-50/50 border-slate-100' };
};

const TradeTable: React.FC<TradeTableProps> = ({ trades, livePrices, athData, capData, isWatchlist }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedTrades = useMemo(() => {
    let result = [...trades];

    if (searchTerm) {
      result = result.filter(t => 
        t.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'roi') {
          valA = a.roi ?? -999999;
          valB = b.roi ?? -999999;
        } else if (sortConfig.key === 'symbol') {
          valA = a.symbol;
          valB = b.symbol;
        } else if (sortConfig.key === 'price') {
          valA = livePrices?.[a.symbol] || a.currentPrice || 0;
          valB = livePrices?.[b.symbol] || b.currentPrice || 0;
        } else if (sortConfig.key === 'dfh') {
          const athA = athData?.[a.symbol] || a.ath;
          const athB = athData?.[b.symbol] || b.ath;
          valA = (livePrices?.[a.symbol] || a.currentPrice) && athA ? ((livePrices?.[a.symbol] || a.currentPrice) / athA) - 1 : -999999;
          valB = (livePrices?.[b.symbol] || b.currentPrice) && athB ? ((livePrices?.[b.symbol] || b.currentPrice) / athB) - 1 : -999999;
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
  }, [trades, searchTerm, sortConfig, livePrices, athData]);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <Filter className="h-3 w-3 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 ml-1 text-blue-600" /> : <ChevronDown className="h-3 w-3 ml-1 text-blue-600" />;
  };

  const TableHeader = () => (
    <thead>
      {isWatchlist ? (
        <tr className="bg-slate-900/10 text-[10px] font-black text-slate-700 uppercase tracking-[0.15em] border-b border-white/40">
          <th className="px-8 py-6 cursor-pointer hover:bg-slate-900/5 transition-colors" onClick={() => handleSort('symbol')}>
            <div className="flex items-center">Instrument <SortIcon column="symbol" /></div>
          </th>
          <th className="px-8 py-6">Market Cap</th>
          <th className="px-8 py-6 text-right cursor-pointer hover:bg-slate-900/5 transition-colors" onClick={() => handleSort('dfh')}>
            <div className="flex items-center justify-end">DFH% <SortIcon column="dfh" /></div>
          </th>
          <th className="px-8 py-6 text-right">Model Status</th>
        </tr>
      ) : (
        <tr className="bg-slate-900/10 text-[10px] font-black text-slate-700 uppercase tracking-[0.15em] border-b border-white/40">
          <th className="px-8 py-6">Observation</th>
          <th className="px-8 py-6 cursor-pointer hover:bg-slate-900/5 transition-colors" onClick={() => handleSort('symbol')}>
            <div className="flex items-center">Symbol <SortIcon column="symbol" /></div>
          </th>
          <th className="px-8 py-6">Market Cap</th>
          <th className="px-8 py-6 text-right">Base Price</th>
          <th className="px-8 py-6 text-right cursor-pointer hover:bg-slate-900/5 transition-colors" onClick={() => handleSort('price')}>
            <div className="flex items-center justify-end">CMP <SortIcon column="price" /></div>
          </th>
          <th className="px-8 py-6 text-right text-blue-600">Projected Phase</th>
          <th className="px-8 py-6 text-right cursor-pointer hover:bg-slate-900/5 transition-colors" onClick={() => handleSort('dfh')}>
            <div className="flex items-center justify-end">DFH% <SortIcon column="dfh" /></div>
          </th>
          <th className="px-8 py-6 text-right cursor-pointer hover:bg-slate-900/5 transition-colors" onClick={() => handleSort('roi')}>
            <div className="flex items-center justify-end">Math ROI % <SortIcon column="roi" /></div>
          </th>
          <th className="px-8 py-6 text-right">Fundamentals</th>
        </tr>
      )}
    </thead>
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between bg-white/40 backdrop-blur-md px-8 py-5 rounded-2xl border border-white/60 shadow-sm mx-1 mt-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/40 border-white/50 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold focus:bg-white/80 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-400 shadow-inner"
          />
        </div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/60 px-4 py-2 rounded-xl border border-white/80 shadow-sm">
          {filteredAndSortedTrades.length} Matches
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <TableHeader />
          <tbody className="divide-y divide-white/20">
            {filteredAndSortedTrades.length === 0 ? (
              <tr>
                <td colSpan={isWatchlist ? 4 : 9} className="px-8 py-20 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching mathematical observations</p>
                </td>
              </tr>
            ) : (
              filteredAndSortedTrades.map((trade) => {
                const livePrice = livePrices?.[trade.symbol] || trade.currentPrice;
                const ath = athData?.[trade.symbol] || trade.ath;
                const cap = capData?.[trade.symbol] || trade.marketCap;
                const dfh = (livePrice && ath) ? ((livePrice / ath) - 1) * 100 : null;
                const capTag = cap ? getMarketCapTag(cap) : null;
                
                // --- SEBI COMPLIANT ROI CALCULATION ---
                const basePrice = trade.actualEntryPrice || trade.entryPrice;
                let calculatedRoi = null;
                if (livePrice && basePrice && basePrice > 0) {
                  calculatedRoi = ((livePrice - basePrice) / basePrice) * 100;
                }
                // Use historical ROI if trade is closed
                if (trade.status === 'CLOSED' && trade.roi !== undefined) {
                  calculatedRoi = trade.roi;
                }

                if (isWatchlist) {
                  return (
                    <tr key={trade.id} className="hover:bg-white/50 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900">{trade.symbol}</span>
                      </td>
                      <td className="px-8 py-6">
                        {capTag && (
                          <span className={`px-2 py-1 rounded-lg text-[8px] font-black tracking-widest border shadow-sm ${capTag.class}`}>
                            {capTag.label}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-xs font-bold text-red-500/80">{dfh ? `${dfh.toFixed(2)}%` : '-'}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          trade.status === 'ENTRY' ? 'text-green-600 bg-green-400/10 border border-green-500/20' : 
                          trade.status === 'HOLD' ? 'text-orange-600 bg-orange-400/10 border border-orange-500/20' : 
                          'text-slate-400 bg-slate-400/10 border border-slate-500/20'
                        }`}>
                          {trade.status === 'ENTRY' ? 'Identified' : trade.status === 'HOLD' ? 'Observation' : 'Neutral'}
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={trade.id} className="hover:bg-white/50 transition-colors group">
                    <td className="px-8 py-6 text-[10px] font-bold text-slate-400">{trade.entryTime || '-'}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{trade.symbol}</span>
                        <span className="text-[9px] font-bold text-blue-500/70 uppercase tracking-tighter mt-1 italic">Phase {trade.currentLevel || 'A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {capTag && (
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black tracking-widest border shadow-sm w-fit block ${capTag.class}`}>
                          {capTag.label}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500 text-right">
                      { (trade.actualEntryPrice || trade.entryPrice) ? `₹${(trade.actualEntryPrice || trade.entryPrice).toLocaleString(undefined, { maximumFractionDigits: 1 })}` : '-' }
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-blue-600 text-right">
                      {livePrice ? `₹${livePrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : '-'}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-blue-600 text-right">
                      {trade.target ? `₹${trade.target.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : '-'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-xs font-bold text-red-500/80">{dfh !== null ? `${dfh.toFixed(2)}%` : '-'}</span>
                    </td>
                    <td className={`px-8 py-6 text-sm font-black text-right ${calculatedRoi !== null ? (calculatedRoi >= 0 ? 'text-green-600' : 'text-red-500') : 'text-slate-300'}`}>
                      {calculatedRoi !== null ? (
                        <div className="flex flex-col items-end">
                          <span className="px-3 py-1 rounded-xl bg-opacity-10 bg-current ring-1 ring-inset ring-current/20 font-mono tracking-tighter">
                            {calculatedRoi >= 0 ? '+' : ''}{calculatedRoi.toFixed(2)}%
                          </span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link 
                        to={`/stock/${trade.symbol}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all border border-blue-500/20 shadow-sm group/btn"
                      >
                        <span>Analyze</span>
                        <ExternalLink className="h-3 w-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeTable;
