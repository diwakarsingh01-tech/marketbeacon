import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';

interface TradeTableProps {
  trades: any[];
  livePrices?: Record<string, number>;
  athData?: Record<string, number>;
  capData?: Record<string, number>;
  isWatchlist?: boolean;
}

const getMarketCapTag = (cap: number) => {
  const capInCr = cap / 10000000;
  if (capInCr > 100000) return { label: 'Large Cap', class: 'text-blue-600 bg-blue-50 border-blue-100' };
  if (capInCr > 33000) return { label: 'Mid Cap', class: 'text-purple-600 bg-purple-50 border-purple-100' };
  if (capInCr > 15000) return { label: 'Small Cap', class: 'text-amber-600 bg-amber-50 border-amber-100' };
  return { label: 'Micro Cap', class: 'text-gray-500 bg-gray-50 border-gray-100' };
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

    // Filter by Search Term
    if (searchTerm) {
      result = result.filter(t => 
        t.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'roi') {
          valA = a.roi || 0;
          valB = b.roi || 0;
        } else if (sortConfig.key === 'symbol') {
          valA = a.symbol;
          valB = b.symbol;
        } else if (sortConfig.key === 'price') {
          valA = livePrices?.[a.symbol] || a.currentPrice || 0;
          valB = livePrices?.[b.symbol] || b.currentPrice || 0;
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
  }, [trades, searchTerm, sortConfig, livePrices]);

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-white p-20 rounded-[2rem] text-center border border-dashed border-gray-200">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No matching mathematical observations</p>
      </div>
    );
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <Filter className="h-3 w-3 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 ml-1 text-blue-600" /> : <ChevronDown className="h-3 w-3 ml-1 text-blue-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Symbol (e.g. RELIANCE)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Showing {filteredAndSortedTrades.length} Models
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {isWatchlist ? (
                <tr className="bg-[#f5f5f7]/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                  <th className="px-8 py-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('symbol')}>
                    <div className="flex items-center">Instrument <SortIcon column="symbol" /></div>
                  </th>
                  <th className="px-8 py-5">Market Cap</th>
                  <th className="px-8 py-5 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('dfh')}>
                    <div className="flex items-center justify-end">DFH% <SortIcon column="dfh" /></div>
                  </th>
                  <th className="px-8 py-5 text-right">Model Status</th>
                </tr>
              ) : (
                <tr className="bg-[#f5f5f7]/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                  <th className="px-8 py-5">Observation Date</th>
                  <th className="px-8 py-5 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('symbol')}>
                    <div className="flex items-center">Symbol <SortIcon column="symbol" /></div>
                  </th>
                  <th className="px-8 py-5">Market Cap</th>
                  <th className="px-8 py-5 text-right">Observation Price</th>
                  <th className="px-8 py-5 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('price')}>
                    <div className="flex items-center justify-end">Current Market Price <SortIcon column="price" /></div>
                  </th>
                  <th className="px-8 py-5 text-right">DFH%</th>
                  <th className="px-8 py-5 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('roi')}>
                    <div className="flex items-center justify-end">Mathematical ROI % <SortIcon column="roi" /></div>
                  </th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAndSortedTrades.map((trade) => {
                const livePrice = livePrices?.[trade.symbol] || trade.currentPrice;
                const ath = athData?.[trade.symbol] || trade.ath;
                const cap = capData?.[trade.symbol] || trade.marketCap;
                const dfh = (livePrice && ath) ? ((livePrice / ath) - 1) * 100 : null;
                const capTag = cap ? getMarketCapTag(cap) : null;
                const roi = trade.roi;

                if (isWatchlist) {
                  return (
                    <tr key={trade.id} className="hover:bg-[#f5f5f7] transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-sm font-black text-gray-900">{trade.symbol}</span>
                      </td>
                      <td className="px-8 py-5">
                        {capTag && (
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest border ${capTag.class}`}>
                            {capTag.label}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-xs font-bold text-red-400">{dfh ? `${dfh.toFixed(2)}%` : '-'}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          trade.status === 'ENTRY' ? 'text-green-600 bg-green-50' : 
                          trade.status === 'HOLD' ? 'text-orange-600 bg-orange-50' : 
                          trade.status === 'CLOSED' ? 'text-blue-600 bg-blue-50' :
                          'text-gray-400 bg-gray-50'
                        }`}>
                          {trade.status === 'ENTRY' ? 'Identified' : trade.status === 'HOLD' ? 'Holding Pattern' : trade.status === 'CLOSED' ? 'Exited' : 'Neutral'}
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={trade.id} className="hover:bg-[#f5f5f7] transition-colors group">
                    <td className="px-8 py-5 text-xs font-medium text-gray-400">{trade.entryTime}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{trade.symbol}</span>
                        <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">Phase {trade.currentLevel || 'A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {capTag && (
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest border w-fit ${capTag.class}`}>
                          {capTag.label}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-500 text-right">₹{(trade.actualEntryPrice || trade.entryPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="px-8 py-5 text-sm font-black text-blue-600 text-right">
                      {livePrice ? `₹${livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-xs font-bold text-red-400">{dfh ? `${dfh.toFixed(2)}%` : '-'}</span>
                    </td>
                    <td className={`px-8 py-5 text-sm font-black text-right ${roi >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                      {roi ? (
                        <div className="flex flex-col items-end">
                          <span>{roi >= 0 ? '+' : ''}{roi.toFixed(2)}%</span>
                        </div>
                      ) : '0.00%'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradeTable;
