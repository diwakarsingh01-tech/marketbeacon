import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TradeTable from '../components/tables/TradeTable';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { ChevronRight, Target, ShieldCheck, RefreshCw, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardPageProps {
  defaultTab?: 'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected';
}

const DashboardPage: React.FC<DashboardPageProps> = ({ defaultTab = 'open' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const strategyId = searchParams.get('strategy') || 'ENVELOPE_LONG';
  
  const currentStrategy = STRATEGIES.find(s => s.id === strategyId) || STRATEGIES[0];
  
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeBasket, setActiveBasket] = useState<string>(currentStrategy.baskets[0]);
  const [activeTab, setActiveTab] = useState<'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected'>(defaultTab);
  
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [stockATHs, setStockATHs] = useState<Record<string, number>>({});
  const [stockCaps, setStockCaps] = useState<Record<string, number>>({});
  const [stockSectors, setStockSectors] = useState<Record<string, string>>({});
  const [userWatchlist, setUserWatchlist] = useState<any[]>([]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!currentStrategy.baskets.includes(activeBasket as any)) {
      setActiveBasket(currentStrategy.baskets[0]);
    }
  }, [strategyId, currentStrategy]);

  // --- Portfolio Persistence Logic ---
  const fetchWatchlist = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const response = await fetch('import.meta.env.VITE_API_URL || "http://localhost:3001"/api/watchlist', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const list = await response.json();
        setUserWatchlist(list);
      }
    } catch (e) { console.error('Watchlist Error:', e); }
  }, []);

  const handleToggleWatchlist = async (symbol: string) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    const isAdding = !userWatchlist.find(s => s.symbol === symbol);
    
    try {
      const response = await fetch(`import.meta.env.VITE_API_URL || "http://localhost:3001"/api/watchlist${isAdding ? '' : `/${symbol}`}`, {
        method: isAdding ? 'POST' : 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: isAdding ? JSON.stringify({ symbol }) : undefined
      });
      if (response.ok) {
        setUserWatchlist(prev => 
          isAdding ? [...prev, { symbol, quantity: 0, buy_price: 0 }] : prev.filter(s => s.symbol !== symbol)
        );
      }
    } catch (e) { console.error('Toggle Error:', e); }
  };

  const handleUpdateHolding = async (symbol: string, quantity: number, buy_price: number) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const response = await fetch(`import.meta.env.VITE_API_URL || "http://localhost:3001"/api/watchlist/${symbol}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ quantity, buy_price })
      });
      if (response.ok) {
        setUserWatchlist(prev => prev.map(s => 
          s.symbol === symbol ? { ...s, quantity, buy_price } : s
        ));
      }
    } catch (e) { console.error('Update Error:', e); }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const fetchStockPrices = async (symbols: string[]) => {
    if (symbols.length === 0) return;
    const chunkSize = 50;
    const priceMap: Record<string, number> = { ...stockPrices };
    const athMap: Record<string, number> = { ...stockATHs };
    const capMap: Record<string, number> = { ...stockCaps };
    const sectorMap: Record<string, string> = { ...stockSectors };

    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      try {
        const response = await fetch(`import.meta.env.VITE_API_URL || "http://localhost:3001"/api/stock-prices?symbols=${chunk.join(',')}`);
        if (response.ok) {
          const prices = await response.json();
          prices.forEach((p: any) => { 
            if (p.price) priceMap[p.symbol] = p.price; 
            if (p.ath) athMap[p.symbol] = p.ath;
            if (p.marketCap) capMap[p.symbol] = p.marketCap;
            if (p.sector) sectorMap[p.symbol] = p.sector;
          });
        }
      } catch (e) { console.error('Price Sync Error:', e); }
    }
    setStockPrices(priceMap);
    setStockATHs(athMap);
    setStockCaps(capMap);
    setStockSectors(sectorMap);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketStatus, setMarketStatus] = useState<string>('CLOSED');

  const fetchData = useCallback(async (forceRefresh = false) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const indicesRes = await fetch('import.meta.env.VITE_API_URL || "http://localhost:3001"/api/market-indices');
      if (indicesRes.ok) {
        const indicesData = await indicesRes.json();
        setMarketStatus(indicesData.status);
      }

      const response = await fetch(`import.meta.env.VITE_API_URL || "http://localhost:3001"/api/backtest/envelope?basket=${activeBasket}&strategy=${strategyId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
        const symbolsToFetch = result.allStocks?.map((s: any) => s.symbol) || [];
        fetchStockPrices(symbolsToFetch);
      } else {
        const errData = await response.json().catch(() => ({ error: 'Unknown API Error' }));
        setError(`Data Sync Failed: ${errData.error || response.statusText}`);
      }
    } catch (e) {
      setError('Connection Error: Backend server unreachable or timed out.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, [activeBasket, strategyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTradesForTab = useCallback(() => {
    if (!data || !data.allStocks) return [];
    
    if (activeTab === 'portfolio') {
      return data.allStocks
        .filter((s: any) => userWatchlist.find(w => w.symbol === s.symbol))
        .map((s: any) => {
          const holding = userWatchlist.find(w => w.symbol === s.symbol);
          return { ...s, ...holding };
        });
    }

    if (activeTab === 'watchlist') {
      return data.allStocks; 
    }

    if (activeTab === 'rejected') {
      return data.rejected || [];
    }

    return data[activeTab] || [];
  }, [data, userWatchlist, activeTab]);

  const portfolioSummary = useMemo(() => {
    if (!data || !data.allStocks) return { totalInvested: 0, totalCurrent: 0, totalPnL: 0, pnlPercent: 0 };
    const portfolioTrades = data.allStocks
      .filter((s: any) => userWatchlist.find(w => w.symbol === s.symbol))
      .map((s: any) => ({ ...s, ...userWatchlist.find(w => w.symbol === s.symbol) }));

    let totalInvested = 0;
    let totalCurrent = 0;
    
    portfolioTrades.forEach((t: any) => {
      const livePrice = stockPrices[t.symbol] || t.currentPrice || 0;
      if (t.quantity > 0 && t.buy_price > 0) {
        totalInvested += t.quantity * t.buy_price;
        totalCurrent += t.quantity * livePrice;
      }
    });

    const totalPnL = totalCurrent - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return { totalInvested, totalCurrent, totalPnL, pnlPercent };
  }, [data, userWatchlist, stockPrices]);

  // Dynamic Headings based on page type
  const pageInfo = {
    title: activeTab === 'portfolio' ? 'Portfolio Manager' : activeTab === 'watchlist' ? 'Universe Analytics' : 'Algorithm Screener',
    desc: activeTab === 'portfolio' ? 'Tracking your active institutional holdings' : activeTab === 'watchlist' ? 'Full scanning results across market universe' : `Scanning patterns for ${currentStrategy.name}`
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 py-8 px-10 space-y-8 overflow-hidden">
      
      {/* 1. Page Identity & Controls - Minimalist approach */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-8 gap-6 shrink-0">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{pageInfo.title}</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{activeBasket.replace('_', ' ')} • {pageInfo.desc}</p>
        </div>

        <div className="flex items-end space-x-3">
          <div className="flex flex-col space-y-2 items-end">
            {/* Strategy Select - Only visible on Screener/Market tabs */}
            {activeTab !== 'portfolio' && (
              <div className="relative group">
                <select 
                  value={strategyId}
                  onChange={(e) => navigate(`?strategy=${e.target.value}`)}
                  className="appearance-none bg-white border border-slate-100 rounded-2xl pl-5 pr-12 py-3.5 text-[10px] font-black uppercase tracking-[0.1em] focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer min-w-[280px]"
                >
                  {STRATEGIES.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.isLive ? '🟢' : '⏳'}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90" />
              </div>
            )}
          </div>
          
          <button 
            onClick={() => fetchData(true)}
            className={`p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Portfolio Summary Cards (Conditional) */}
      {activeTab === 'portfolio' && portfolioSummary.totalInvested > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 animate-in fade-in slide-in-from-top duration-500">
           <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
              <Wallet className="absolute right-[-10px] bottom-[-10px] h-24 w-24 opacity-10" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Invested</p>
              <h3 className="text-2xl font-black">₹{portfolioSummary.totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
           </div>
           <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Value</p>
              <h3 className="text-2xl font-black text-slate-900">₹{portfolioSummary.totalCurrent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
           </div>
           <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net P&L</p>
              <div className="flex items-center space-x-2">
                 <h3 className={`text-2xl font-black ${portfolioSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(portfolioSummary.totalPnL).toLocaleString()}
                 </h3>
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${portfolioSummary.totalPnL >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {portfolioSummary.pnlPercent.toFixed(2)}%
                 </span>
              </div>
           </div>
           <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/30">
              <div className="flex justify-between items-start">
                 <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest leading-none">Security Grade</p>
                 <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="text-2xl font-black mt-2 leading-none uppercase italic">Institutional</h3>
           </div>
        </div>
      )}

      {/* 3. Sub-Filters (Baskets) */}
      {activeTab !== 'portfolio' && (
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            {currentStrategy.baskets.map((basketKey) => (
              <button
                key={basketKey}
                onClick={() => setActiveBasket(basketKey)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeBasket === basketKey ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {basketKey.replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100">
             <button onClick={() => setActiveTab('open')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'open' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Qualified</button>
             <button onClick={() => setActiveTab('hold')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'hold' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Observation</button>
             <button onClick={() => setActiveTab('rejected')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rejected' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>Rejected</button>
          </div>

        </div>
      )}

      {/* 4. Main Data Terminal */}
      <section className="flex-1 min-h-0 overflow-hidden relative">
        {error ? (
          <div className="bg-white rounded-[2.5rem] h-full border border-slate-100 flex flex-col items-center justify-center space-y-4 p-10 text-center">
            <p className="text-sm font-bold text-red-500 uppercase tracking-widest">{error}</p>
            <button onClick={() => fetchData(true)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Retry Terminal</button>
          </div>
        ) : data ? (
          <div className={`bg-white rounded-[2.5rem] h-full border border-slate-100 shadow-sm flex flex-col overflow-hidden relative transition-all duration-500 ${isRefreshing ? 'opacity-40 blur-[2px] scale-[0.99]' : 'opacity-100 blur-0 scale-100 animate-in fade-in zoom-in-95'}`}>
             {isRefreshing && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center space-y-3 bg-white/10 backdrop-blur-[1px]">
                   <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                   <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em]">Updating Universe...</p>
                </div>
             )}
             <div className="flex-1 overflow-auto custom-scrollbar">
                <TradeTable 
                  trades={getTradesForTab()} 
                  livePrices={stockPrices} 
                  athData={stockATHs}
                  capData={stockCaps}
                  sectorData={stockSectors}
                  userWatchlist={userWatchlist.map(w => w.symbol)}
                  onToggleWatchlist={handleToggleWatchlist}
                  onUpdateHolding={handleUpdateHolding}
                  isWatchlist={activeTab === 'portfolio'}
                />
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] h-full border border-slate-100 flex flex-col items-center justify-center space-y-6">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Processing Mathematical Chunks...</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
