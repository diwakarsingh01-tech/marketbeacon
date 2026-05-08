import React from 'react';

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
  if (!trades || trades.length === 0) {
    return (
      <div className="bg-white p-20 rounded-[2rem] text-center border border-dashed border-gray-200">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No matching trades in this category</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {isWatchlist ? (
              <tr className="bg-[#f5f5f7]/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                <th className="px-8 py-5">Instrument</th>
                <th className="px-8 py-5">Market Cap</th>
                <th className="px-8 py-5 text-right">DFH%</th>
                <th className="px-8 py-5 text-right">Model Status</th>
              </tr>
            ) : (
              <tr className="bg-[#f5f5f7]/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                <th className="px-8 py-5">Observation Date</th>
                <th className="px-8 py-5">Symbol</th>
                <th className="px-8 py-5">Universe</th>
                <th className="px-8 py-5 text-right">Observation Price</th>
                <th className="px-8 py-5 text-right">Current Market Price</th>
                <th className="px-8 py-5 text-right">DFH%</th>
                <th className="px-8 py-5 text-right">Mathematical ROI %</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {trades.map((trade) => {
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
                    <div className="flex flex-col space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest text-gray-400 bg-gray-50 border border-gray-100 w-fit">
                        {trade.basket || 'Bluechip'}
                      </span>
                      {capTag && (
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest border w-fit ${capTag.class}`}>
                          {capTag.label}
                        </span>
                      )}
                    </div>
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
  );
};

export default TradeTable;
