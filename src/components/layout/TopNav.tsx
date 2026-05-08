import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Zap, RefreshCw, ShieldCheck } from 'lucide-react';

const TopNav: React.FC = () => {
  const [indices, setIndices] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchIndices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('http://127.0.0.1:3001/api/market-indices');
      if (response.ok) {
        const data = await response.json();
        setIndices(data.results || []);
      }
    } catch (e) {
      console.error('Pulse Error:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Visual feedback
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000); // 1 minute auto-refresh
    return () => clearInterval(interval);
  }, [fetchIndices]);

  return (
    <nav className="glass-nav">
      <div className="max-w-[1440px] mx-auto px-10 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">
            <Activity className="h-5 w-5 text-white" />
          </Link>
          <div className="flex flex-col">
            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">MarketBeacon <span className="text-blue-600 italic">LIVE</span></span>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Signal Active</span>
            </div>
          </div>
        </div>

        {/* Market Pulse - Bold & Prominent with ATH Logic */}
        <div className="flex items-center bg-white/40 px-6 py-2.5 rounded-[1.25rem] border border-white/60 space-x-10">
          <div className="flex items-center space-x-2 border-r border-gray-200/50 pr-6">
            <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pulse</span>
          </div>
          <div className="flex items-center space-x-10">
            {indices.map((index) => {
              const downFromHigh = index.ath ? ((index.price - index.ath) / index.ath) * 100 : 0;
              return (
                <div key={index.name} className="flex items-center space-x-4 border-r border-gray-200/30 last:border-0 pr-10 last:pr-0">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{index.name}</span>
                    <span className="text-sm font-black text-gray-900">₹{index.price?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex flex-col items-end space-y-0.5">
                    <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${index.change >= 0 ? 'bg-green-100/50 text-green-600' : 'bg-red-100/50 text-red-600'}`}>
                      {index.change >= 0 ? '▲' : '▼'} {Math.abs(index.change)?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User & Security & Global Refresh */}
        <div className="flex items-center space-x-6">
          <button 
            onClick={fetchIndices}
            className={`p-2.5 rounded-xl border border-white/60 bg-white/40 hover:bg-white/60 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : 'text-gray-400'}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center border-2 border-white shadow-xl">
            <span className="text-xs font-black text-white">DS</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
