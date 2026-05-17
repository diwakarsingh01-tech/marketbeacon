import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TradeTable from '../components/tables/TradeTable';
import StrategyGuide from '../components/StrategyGuide';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { ChevronRight, Target, ShieldCheck, RefreshCw, TrendingUp, Wallet, BookOpen, X, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface DashboardPageProps {
  defaultTab?: 'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral';
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
  const [activeTab, setActiveTab] = useState<'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral'>(defaultTab);
  const [showGuide, setShowGuide] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'alpha'>('pro');

  const checkStrategyAccess = (id: string) => {
    const strategy = STRATEGIES.find(s => s.id === id);
    if (!strategy) return true;
    if (strategy.tier === 'free') return true;
    
    const userTier = (user as any)?.tier || 'free';
    
    if (strategy.tier === 'alpha' && userTier !== 'alpha') {
      setRequiredTier('alpha');
      setShowUpgradeModal(true);
      return false;
    }
    if (strategy.tier === 'pro' && userTier === 'free') {
      setRequiredTier('pro');
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  };

  const handleStrategyChange = (id: string) => {
    if (checkStrategyAccess(id)) {
      navigate(`?strategy=${id}`);
    }
  };

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
      const response = await fetch(`${API_URL}/api/watchlist`, {
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
      const response = await fetch(`${API_URL}/api/watchlist${isAdding ? '' : `/${symbol}`}`, {
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
      const response = await fetch(`${API_URL}/api/watchlist/${symbol}`, {
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
        const response = await fetch(`${API_URL}/api/stock-prices?symbols=${chunk.join(',')}`);
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
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = useMemo(() => [
    "🚀 Auditing Institutional Fundamentals...",
    "🔍 Scanning Knoxville Divergence Signals...",
    "🛡️ Analyzing SMA 200 Support Zones...",
    "📊 Filtering Super 45 High-Growth Assets...",
    "💎 Calculating Deep Value Entry Points...",
    "⚖️ Optimizing Risk-to-Reward Ratios...",
    "⚡ Synchronizing Real-Time Market Pulse..."
  ], []);

  useEffect(() => {
    let interval: any;
    if (isRefreshing || !data) {
      interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isRefreshing, data, loadingMessages]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/backtest/envelope?basket=${activeBasket}&strategy=${strategyId}`);
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
    if (!data || !data.allStocks) return { 
      totalInvested: 0, totalCurrent: 0, totalPnL: 0, pnlPercent: 0,
      capBreakdown: { large: 0, mid: 0, small: 0, micro: 0 },
      sectorBreakdown: {} as Record<string, { amount: number, stocks: string[] }>
    };

    const portfolioTrades = data.allStocks
      .filter((s: any) => userWatchlist.find(w => w.symbol === s.symbol))
      .map((s: any) => ({ ...s, ...userWatchlist.find(w => w.symbol === s.symbol) }));

    let totalInvested = 0;
    let totalCurrent = 0;
    const capInvested = { large: 0, mid: 0, small: 0, micro: 0 };
    const sectorInvested: Record<string, { amount: number, stocks: string[] }> = {};
    
    portfolioTrades.forEach((t: any) => {
      const livePrice = stockPrices[t.symbol] || t.currentPrice || 0;
      const mktCap = t.marketCap || 0;
      const sector = t.sector || 'General';
      const investedAmount = t.quantity * t.buy_price;

      if (t.quantity > 0 && t.buy_price > 0) {
        totalInvested += investedAmount;
        totalCurrent += t.quantity * livePrice;

        // Market Cap Bifurcation (4-Tier Institutional Model)
        if (mktCap >= 200000000000) { 
          capInvested.large += investedAmount;
        } else if (mktCap >= 50000000000) { 
          capInvested.mid += investedAmount;
        } else if (mktCap >= 10000000000) { // Small Cap 1,000 - 5,000 Cr
          capInvested.small += investedAmount;
        } else { // Micro Cap < 1,000 Cr
          capInvested.micro += investedAmount;
        }

        // Sector Bifurcation
        if (!sectorInvested[sector]) sectorInvested[sector] = { amount: 0, stocks: [] };
        sectorInvested[sector].amount += investedAmount;
        sectorInvested[sector].stocks.push(t.symbol);
      }
    });

    const totalPnL = totalCurrent - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return { 
      totalInvested, totalCurrent, totalPnL, pnlPercent,
      capBreakdown: {
        large: totalInvested > 0 ? (capInvested.large / totalInvested) * 100 : 0,
        mid: totalInvested > 0 ? (capInvested.mid / totalInvested) * 100 : 0,
        small: totalInvested > 0 ? (capInvested.small / totalInvested) * 100 : 0,
        micro: totalInvested > 0 ? (capInvested.micro / totalInvested) * 100 : 0,
      },
      sectorBreakdown: sectorInvested
    };
  }, [data, userWatchlist, stockPrices]);

  // Dynamic Headings based on page type
  const pageInfo = {
    title: activeTab === 'portfolio' ? 'Portfolio Manager' : activeTab === 'watchlist' ? 'Universe Analytics' : 'Algorithm Screener',
    desc: activeTab === 'portfolio' ? 'Tracking your active institutional holdings' : activeTab === 'watchlist' ? 'Full scanning results across market universe' : `Scanning patterns for ${currentStrategy.name}`
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 py-6 md:py-8 px-4 md:px-10 space-y-6 md:space-y-8 overflow-hidden">
      
      {/* 1. Page Identity & Controls - Minimalist approach */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-100 pb-6 md:pb-8 gap-6 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{pageInfo.title}</h1>
          <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">{activeBasket.replace('_', ' ')} • {pageInfo.desc}</p>
        </div>

        <div className="flex items-center lg:items-end space-x-3">
          <div className="flex-1 lg:flex-none flex flex-col space-y-2 items-start lg:items-end">
            {/* Strategy Select - Only visible on Screener/Market tabs */}
            {activeTab !== 'portfolio' && (
              <div className="flex items-center space-x-2 w-full lg:w-auto">
                <div className="relative group flex-1 lg:flex-none">
                  <select 
                    value={strategyId}
                    onChange={(e) => handleStrategyChange(e.target.value)}
                    className="appearance-none bg-white border border-slate-100 rounded-2xl pl-5 pr-12 py-3.5 text-[10px] font-black uppercase tracking-[0.1em] focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer w-full lg:min-w-[280px]"
                  >
                    {STRATEGIES.map(s => {
                      const userTier = (user as any)?.tier || 'free';
                      const isLocked = (s.tier === 'alpha' && userTier !== 'alpha') || (s.tier === 'pro' && userTier === 'free');
                      return (
                        <option key={s.id} value={s.id}>
                          {isLocked ? '🔒 ' : '🟢 '}{s.name}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90" />
                </div>
                
                <button 
                  onClick={() => setShowGuide(!showGuide)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center space-x-2 ${showGuide ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                  title="View Strategy Guide"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Guide</span>
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => fetchData(true)}
            className={`p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition-all shrink-0 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Strategy Guide (Conditional) */}
      {showGuide && (
        <div className="relative shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
          <button 
            onClick={() => setShowGuide(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-slate-800 text-white rounded-full hover:bg-black transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <StrategyGuide strategyId={strategyId} />
        </div>
      )}

      {/* 2. Portfolio Summary Cards (Conditional) */}
      {activeTab === 'portfolio' && portfolioSummary.totalInvested > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 shrink-0 animate-in fade-in slide-in-from-top duration-500">
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
              <h3 className="text-2xl font-black mt-2 leading-none uppercase italic hidden md:block">Institutional</h3>
              <h3 className="text-xl font-black mt-2 leading-none uppercase italic md:hidden">Insti.</h3>
           </div>
        </div>
      )}

      {/* 3. Portfolio Risk Analyzer (Integrated Analytics) */}
      {activeTab === 'portfolio' && portfolioSummary.totalInvested > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 shrink-0 animate-in fade-in slide-in-from-bottom duration-700">
           {/* Market Cap Distribution (4-Tier Bifurcation) */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">Cap Allocation Matrix</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional 4-Tier Diversification</p>
                 </div>
                 <div className="px-3 py-1.5 bg-blue-50 rounded-xl">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Model: 50-30-15-5</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                    { label: 'Large Cap', target: 50, current: portfolioSummary.capBreakdown.large, color: 'bg-slate-900', desc: '> 20k Cr' },
                    { label: 'Mid Cap', target: 30, current: portfolioSummary.capBreakdown.mid, color: 'bg-blue-600', desc: '5k - 20k Cr' },
                    { label: 'Small Cap', target: 15, current: portfolioSummary.capBreakdown.small, color: 'bg-indigo-400', desc: '1k - 5k Cr' },
                    { label: 'Micro Cap', target: 5, current: portfolioSummary.capBreakdown.micro, color: 'bg-rose-500', desc: '< 1k Cr' }
                 ].map((cap, i) => (
                    <div key={i} className="p-4 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-3">
                       <div className="flex justify-between items-start">
                          <div>
                             <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest block">{cap.label}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase">{cap.desc}</span>
                          </div>
                          <span className={`text-xs font-black ${Math.abs(cap.current - cap.target) > 10 ? 'text-red-600' : 'text-slate-900'}`}>
                             {cap.current.toFixed(1)}%
                          </span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden relative">
                          <div className={`h-full ${cap.color} rounded-full transition-all duration-1000`} style={{ width: `${cap.current}%` }} />
                          <div className="absolute top-0 bottom-0 border-l border-slate-400 z-10" style={{ left: `${cap.target}%` }} />
                       </div>
                       <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase">
                          <span>Progress</span>
                          <span>Target {cap.target}%</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Sector Exposure (20% Safety Cap) */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase italic">Sector Contribution</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diversification Health (20% Threshold)</p>
                 </div>
                 <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>

              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                 {Object.entries(portfolioSummary.sectorBreakdown)
                    .sort(([, a], [, b]) => b.amount - a.amount)
                    .map(([sector, data], i) => {
                       const pct = (data.amount / portfolioSummary.totalInvested) * 100;
                       const isOverexposed = pct > 20;
                       return (
                          <div key={i} className="p-4 rounded-3xl border border-slate-50 bg-slate-50/30 space-y-2 group hover:border-blue-100 hover:bg-blue-50/20 transition-all">
                             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight">
                                <div className="flex items-center space-x-2">
                                   <span className={isOverexposed ? 'text-red-600' : 'text-slate-700'}>{sector}</span>
                                   {isOverexposed && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md text-[8px]">OVEREXPOSED</span>}
                                </div>
                                <span className={isOverexposed ? 'text-red-600' : 'text-slate-900'}>{pct.toFixed(1)}%</span>
                             </div>
                             <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                                <div 
                                   className={`h-full transition-all duration-1000 rounded-full ${isOverexposed ? 'bg-red-500 shadow-lg shadow-red-200' : 'bg-blue-500 group-hover:bg-blue-600'}`} 
                                   style={{ width: `${pct}%` }} 
                                />
                             </div>
                             <div className="flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {data.stocks.map((s, idx) => (
                                   <span key={idx} className="px-1.5 py-0.5 bg-white border border-slate-100 text-[8px] font-black text-slate-400 rounded-md">{s}</span>
                                ))}
                             </div>
                          </div>
                       );
                    })}
              </div>
           </div>
        </section>
      )}

      {/* 4. Sub-Filters (Baskets) */}
      {activeTab !== 'portfolio' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 overflow-hidden">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
            {currentStrategy.baskets.map((basketKey) => (
              <button
                key={basketKey}
                onClick={() => setActiveBasket(basketKey)}
                className={`px-6 md:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeBasket === basketKey ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {basketKey.replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
             <button onClick={() => setActiveTab('open')} className={`px-5 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'open' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Qualified</button>
             <button onClick={() => setActiveTab('hold')} className={`px-5 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'hold' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Observation</button>
             <button onClick={() => setActiveTab('neutral')} className={`px-5 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'neutral' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Neutral</button>
             <button onClick={() => setActiveTab('watchlist')} className={`px-5 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'watchlist' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400'}`}>Watchlist</button>
             <button onClick={() => setActiveTab('rejected')} className={`px-5 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'rejected' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>Rejected</button>
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
                   <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em]">{loadingMessages[loadingMessageIndex]}</p>
                </div>
             )}

             {/* Integrated Portfolio Risk Analyzer */}
             {activeTab === 'portfolio' && portfolioSummary.totalInvested > 0 && (
               <div className="p-8 border-b border-slate-100 bg-slate-50/20 shrink-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Market Cap Matrix */}
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Cap Allocation Matrix</h3>
                           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Institutional Diversification</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           {[
                              { label: 'Large Cap', target: 50, current: portfolioSummary.capBreakdown.large, color: 'bg-slate-900' },
                              { label: 'Mid Cap', target: 30, current: portfolioSummary.capBreakdown.mid, color: 'bg-blue-600' },
                              { label: 'Small Cap', target: 15, current: portfolioSummary.capBreakdown.small, color: 'bg-indigo-400' },
                              { label: 'Micro Cap', target: 5, current: portfolioSummary.capBreakdown.micro, color: 'bg-rose-500' }
                           ].map((cap, i) => (
                              <div key={i} className="p-3 bg-white rounded-2xl border border-slate-100 space-y-2 shadow-sm">
                                 <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{cap.label}</span>
                                    <span className={`text-[10px] font-black ${Math.abs(cap.current - cap.target) > 10 ? 'text-red-600' : 'text-slate-900'}`}>{cap.current.toFixed(1)}%</span>
                                 </div>
                                 <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden relative">
                                    <div className={`h-full ${cap.color} rounded-full transition-all duration-1000`} style={{ width: `${cap.current}%` }} />
                                    <div className="absolute top-0 bottom-0 border-l border-slate-400 z-10" style={{ left: `${cap.target}%` }} />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Sector Contribution */}
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic">Sector Contribution</h3>
                           <div className="flex items-center space-x-2">
                              <div className={`h-1.5 w-1.5 rounded-full ${Object.values(portfolioSummary.sectorBreakdown).some(data => (data.amount / portfolioSummary.totalInvested) * 100 > 20) ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Safety Cap: 20%</span>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                           {Object.entries(portfolioSummary.sectorBreakdown)
                              .sort(([, a], [, b]) => b.amount - a.amount)
                              .map(([sector, data], i) => {
                                 const pct = (data.amount / portfolioSummary.totalInvested) * 100;
                                 const isOverexposed = pct > 20;
                                 return (
                                    <div key={i} className="space-y-1 group">
                                       <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
                                          <span className={isOverexposed ? 'text-red-600' : 'text-slate-600'}>{sector}</span>
                                          <span className={isOverexposed ? 'text-red-600' : 'text-slate-900'}>{pct.toFixed(1)}%</span>
                                       </div>
                                       <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                          <div className={`h-full transition-all duration-1000 rounded-full ${isOverexposed ? 'bg-red-500' : 'bg-blue-600/60'}`} style={{ width: `${pct}%` }} />
                                       </div>
                                    </div>
                                 );
                              })}
                        </div>
                     </div>
                  </div>
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
                  onUpdateReview={() => fetchData(true)}
                  isWatchlist={activeTab === 'portfolio'}
                  activeTab={activeTab}
                  strategyId={strategyId}
                />
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] h-full border border-slate-100 flex flex-col items-center justify-center space-y-6">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">{loadingMessages[loadingMessageIndex]}</p>
          </div>
        )}
      </section>
      {/* SEBI Compliance & Legal Footer */}
      <footer className="mt-auto py-10 px-8 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center space-x-2 text-slate-900">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-black uppercase tracking-widest">MarketBeacon Regulatory Disclosure</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 font-medium uppercase tracking-tight">
                Important: We are <span className="text-red-600 font-bold underline">NOT SEBI REGISTERED</span> investment advisors. 
                All data, strategies, and signals generated by MarketBeacon (Batch 9 Engine) are for 
                <span className="text-slate-900 font-bold"> EDUCATIONAL AND RESEARCH PURPOSES ONLY</span>. 
                MarketBeacon does not provide personalized investment advice, trading recommendations, or financial consulting.
              </p>
              <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                Trading in the stock market involves significant risk. Historical performance of our strategies (e.g. Velocity Retest, Quantum Stacking) 
                is not a guarantee of future results. No Stop-Loss approach is a high-risk methodology and requires independent financial verification. 
                Please consult a SEBI registered financial advisor before making any monetary decisions.
              </p>
            </div>
            <div className="md:text-right space-y-2">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">© 2026 MarketBeacon Terminal</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Institutional Proprietary Software</p>
              <div className="pt-4 flex md:justify-end space-x-4 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                <a href="#" className="hover:underline">Legal Policy</a>
                <a href="#" className="hover:underline">Risk Disclosure</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        requiredTier={requiredTier}
        userEmail={user?.email}
      />
    </div>
  );
};

export default DashboardPage;
