import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TradeTable from '../components/tables/TradeTable';
import StrategyGuide from '../components/StrategyGuide';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { ChevronRight, Target, ShieldCheck, RefreshCw, TrendingUp, Wallet, BookOpen, X, Lock, ShieldAlert, Check, Zap, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import BrokerHub from '../components/modals/BrokerHub';
import LegalModal from '../components/modals/LegalModal';

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
  const [showBrokerHub, setShowBrokerHub] = useState(false);
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
      const newStrategy = STRATEGIES.find(s => s.id === id);
      if (newStrategy && !newStrategy.baskets.includes(activeBasket as any)) {
        setActiveBasket(newStrategy.baskets[0]);
      }
      navigate(`?strategy=${id}`);
    }
  };

  const handleBasketChange = (basketId: string) => {
    setActiveBasket(basketId);
    // Ensure current strategy is valid for this basket
    if (!currentStrategy.baskets.includes(basketId as any)) {
      // Find the first strategy that supports this basket
      const validStrategy = STRATEGIES.find(s => s.baskets.includes(basketId as any));
      if (validStrategy) {
        navigate(`?strategy=${validStrategy.id}`);
      }
    }
  };

  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [stockATHs, setStockATHs] = useState<Record<string, number>>({});
  const [stockCaps, setStockCaps] = useState<Record<string, number>>({});
  const [stockSectors, setStockSectors] = useState<Record<string, string>>({});
  const [userWatchlist, setUserWatchlist] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!currentStrategy.baskets.includes(activeBasket as any)) {
      setActiveBasket(currentStrategy.baskets[0]);
    }
  }, [strategyId, currentStrategy]);

  // --- Portfolio Persistence Logic ---
  const fetchTrades = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/trades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      }
    } catch (e) { console.error('Fetch Trades Error:', e); }
  }, []);

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

  const handleImportHoldings = async (holdings: any[]) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;

    setIsRefreshing(true);
    try {
      // Process sequential imports to avoid DB lock/race conditions
      for (const item of holdings) {
        await fetch(`${API_URL}/api/watchlist`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ symbol: item.symbol })
        });
        
        await fetch(`${API_URL}/api/watchlist/${item.symbol}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ quantity: item.quantity, buy_price: item.buyPrice })
        });
      }
      
      alert(`Successfully imported ${holdings.length} holdings into Portfolio Manager.`);
      fetchWatchlist();
    } catch (e) {
      alert("Error importing holdings. Some items may have failed.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    fetchTrades();
  }, [fetchWatchlist, fetchTrades]);

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
      const text = await response.text();
      
      try {
        const result = JSON.parse(text);
        if (response.ok) {
          setData(result);
          // ... rest of logic
          const portfolioSymbols = [
            ...userWatchlist.map(w => w.symbol),
            ...trades.map(t => t.symbol)
          ];
          const symbolsToFetch = Array.from(new Set([
            ...(result.allStocks?.map((s: any) => s.symbol) || []),
            ...portfolioSymbols
          ]));
          fetchStockPrices(symbolsToFetch);
        } else {
          setError(`Data Sync Failed: ${result.error || response.statusText}`);
        }
      } catch (jsonErr) {
        console.error("[DEBUG] Invalid Scanner JSON:", text.substring(0, 100));
        setError("Production Sync Error: Terminal received HTML instead of Market Data. Please verify VITE_API_URL settings.");
      }
    } catch (e) {
      setError('Connection Error: Backend server unreachable or timed out.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, [activeBasket, strategyId, userWatchlist, trades]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTradesForTab = useCallback(() => {
    if (!data || !data.allStocks) return [];
    
    if (activeTab === 'portfolio') {
      const combinedPortfolioMap: Record<string, { quantity: number, buy_price: number }> = {};
      
      // Add Watchlist items
      userWatchlist.forEach(w => {
        combinedPortfolioMap[w.symbol] = { quantity: w.quantity || 0, buy_price: w.buy_price || 0 };
      });

      // Merge Open Trades from Journal
      trades.filter(t => t.status === 'OPEN').forEach(t => {
        if (combinedPortfolioMap[t.symbol]) {
          const existing = combinedPortfolioMap[t.symbol];
          const newQty = existing.quantity + (t.quantity || 0);
          if (newQty > 0) {
            existing.buy_price = ((existing.buy_price * existing.quantity) + (t.entry_price * t.quantity)) / newQty;
            existing.quantity = newQty;
          }
        } else {
          combinedPortfolioMap[t.symbol] = { quantity: t.quantity || 0, buy_price: t.entry_price || 0 };
        }
      });

      // --- PRO FIX: Filter from entire stock price map, not just data.allStocks ---
      const symbols = Object.keys(combinedPortfolioMap);
      return symbols.map(symbol => {
        const baseData = data.allStocks.find((s: any) => s.symbol === symbol) || {
          symbol,
          stockName: symbol,
          marketCap: stockCaps[symbol] || 0,
          sector: stockSectors[symbol] || 'Manual Entry',
          currentPrice: stockPrices[symbol] || 0
        };
        return { ...baseData, ...combinedPortfolioMap[symbol] };
      }).filter(s => s.quantity > 0);
    }

    if (activeTab === 'watchlist') {
      return data.allStocks; 
    }

    if (activeTab === 'rejected') {
      return data.rejected || [];
    }

    return data[activeTab] || [];
  }, [data, userWatchlist, activeTab, trades, stockPrices, stockCaps, stockSectors]);

  const portfolioSummary = useMemo(() => {
    // Initial state check should not strictly depend on data.allStocks
    if (!userWatchlist.length && !trades.length) return { 
      totalInvested: 0, totalCurrent: 0, totalPnL: 0, pnlPercent: 0, realizedGain: 0, unrealizedGain: 0, combinedPnL: 0, combinedPnlPercent: 0,
      capBreakdown: { large: 0, mid: 0, small: 0 },
      sectorBreakdown: {} as Record<string, { amount: number, stocks: string[] }>,
      strategyStats: {} as Record<string, number>
    };

    const combinedMap: Record<string, { quantity: number, buy_price: number }> = {};
    
    // 1. Load Watchlist (Active Holdings)
    userWatchlist.forEach(w => {
      combinedMap[w.symbol] = { quantity: w.quantity || 0, buy_price: w.buy_price || 0 };
    });

    // 2. Merge Open Trades from Journal
    trades.filter(t => t.status === 'OPEN').forEach(t => {
      if (combinedMap[t.symbol]) {
        const existing = combinedMap[t.symbol];
        const newQty = existing.quantity + (t.quantity || 0);
        if (newQty > 0) {
          existing.buy_price = ((existing.buy_price * existing.quantity) + (t.entry_price * t.quantity)) / newQty;
          existing.quantity = newQty;
        }
      } else {
        combinedMap[t.symbol] = { quantity: t.quantity || 0, buy_price: t.entry_price || 0 };
      }
    });

    // 3. Process the entire combined map (Global Scope)
    let totalInvested = 0;
    let totalCurrent = 0;
    const capInvested = { large: 0, mid: 0, small: 0 };
    const sectorInvested: Record<string, { amount: number, stocks: string[] }> = {};
    const strategyStats: Record<string, number> = {};

    const STRATEGY_NAME_MAP: Record<string, string> = {
      'Institutional Floor': 'ENVELOPE_LONG',
      'Momentum Ceiling': 'ENVELOPE_SHORT',
      'Volatility Channel': 'BOLLINGER',
      'Structural Pivot': 'CUP_HANDLE_ABCD',
      'Dynamic Reversal': 'RHS_ABCD',
      'Annual Range Matrix': '52W_HIGH_LOW',
      'Quantum Stacking': 'SMA_ABCD',
      'Velocity Retest': 'TWENTY_RALLY_RETEST',
      'Deep Recovery Audit': 'SIXTY_SEVEN_FUNDA',
      'Supply-Demand Core': 'SR_STRATEGY',
      'Envelope Long': 'ENVELOPE_LONG',
      'Envelope Short': 'ENVELOPE_SHORT',
      'SMA ABCD': 'SMA_ABCD'
    };
    
    Object.entries(combinedMap).forEach(([symbol, holding]) => {
      const livePrice = stockPrices[symbol] || 0;
      const mktCap = stockCaps[symbol] || 0;
      const sector = stockSectors[symbol] || 'Manual Entry';
      const investedAmount = holding.quantity * holding.buy_price;

      if (holding.quantity > 0 && holding.buy_price > 0) {
        totalInvested += investedAmount;
        totalCurrent += holding.quantity * livePrice;

        // Standard Institutional Market Cap Bifurcation
        const capInCr = mktCap / 10000000;
        if (capInCr >= 65000) { 
          capInvested.large += investedAmount;
        } else if (capInCr >= 20000) { 
          capInvested.mid += investedAmount;
        } else { 
          capInvested.small += investedAmount;
        }

        // Sector Bifurcation
        if (!sectorInvested[sector]) sectorInvested[sector] = { amount: 0, stocks: [] };
        sectorInvested[sector].amount += investedAmount;
        sectorInvested[sector].stocks.push(symbol);

        // Strategy Breakdown
        const journalTrade = trades.find(jt => jt.symbol === symbol && jt.status === 'OPEN');
        if (journalTrade) {
          const rawStrat = journalTrade.strategy;
          const stratKey = STRATEGY_NAME_MAP[rawStrat] || rawStrat || 'MANUAL';
          strategyStats[stratKey] = (strategyStats[stratKey] || 0) + investedAmount;
        } else {
          strategyStats['WATCHLIST'] = (strategyStats['WATCHLIST'] || 0) + investedAmount;
        }
      }
    });

    const totalPnL = totalCurrent - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    const realizedGain = trades
      .filter(t => t.status === 'CLOSED')
      .reduce((acc, t) => acc + (((t.exit_price || 0) - (t.entry_price || 0)) * (t.quantity || 0)), 0);
    
    const realizedPnlPercent = totalInvested > 0 ? (realizedGain / totalInvested) * 100 : 0;
    const unrealizedPnlPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    const combinedPnL = totalPnL + realizedGain;
    const combinedPnlPercent = totalInvested > 0 ? (combinedPnL / totalInvested) * 100 : 0;

    return { 
      totalInvested, totalCurrent, totalPnL, pnlPercent, realizedGain, 
      unrealizedGain: totalPnL, 
      realizedPnlPercent,
      unrealizedPnlPercent,
      combinedPnL, combinedPnlPercent,
      capBreakdown: {
        large: totalInvested > 0 ? (capInvested.large / totalInvested) * 100 : 0,
        mid: totalInvested > 0 ? (capInvested.mid / totalInvested) * 100 : 0,
        small: totalInvested > 0 ? (capInvested.small / totalInvested) * 100 : 0
      },
      sectorBreakdown: sectorInvested,
      strategyStats
    };
  }, [userWatchlist, trades, stockPrices, stockCaps, stockSectors]);

  // Dynamic Headings based on page type
  const pageInfo = {
    title: activeTab === 'portfolio' ? 'Portfolio Manager' : activeTab === 'watchlist' ? 'Universe Analytics' : 'Algorithm Screener',
    desc: activeTab === 'portfolio' ? 'Tracking your active institutional holdings' : activeTab === 'watchlist' ? 'Full scanning results across market universe' : `Scanning patterns for ${currentStrategy.name}`
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 py-6 md:py-8 px-4 md:px-10 space-y-6 md:space-y-8 overflow-hidden">
      
      {/* Expiry Alert Banner */}
      {(user as any)?.tier !== 'free' && (user as any)?.daysRemaining !== null && (user as any)?.daysRemaining <= 3 && (
        <div className="bg-red-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between animate-pulse">
           <div className="flex items-center space-x-3">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Access Expiring in {(user as any)?.daysRemaining} Days</span>
           </div>
           <button 
             onClick={() => {
               setRequiredTier((user as any).tier);
               setShowUpgradeModal(true);
             }}
             className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
           >
             Renew Now
           </button>
        </div>
      )}

      {/* 1. Page Identity & Controls - Minimalist approach */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-100 pb-6 md:pb-8 gap-6 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{pageInfo.title}</h1>
          <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">{activeBasket.replace('_', ' ')} • {pageInfo.desc}</p>
        </div>

        <div className="flex items-center lg:items-end space-x-3">
          {activeTab === 'portfolio' && (
            <button 
              onClick={() => setShowBrokerHub(true)}
              className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Connect Broker</span>
            </button>
          )}

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
                    {STRATEGIES
                      .filter(s => s.baskets.includes(activeBasket as any)) // SHORT BY BASKET WISE
                      .map(s => {
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
      {activeTab === 'portfolio' && (portfolioSummary.totalInvested > 0 || portfolioSummary.realizedGain !== 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-5 shrink-0 animate-in fade-in slide-in-from-top duration-500">
           {/* Total Invested */}
           <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Principal</span>
                    <Wallet className="h-3.5 w-3.5 text-slate-600" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tighter">₹{portfolioSummary.totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Active Deployment</p>
                 </div>
              </div>
           </div>
           
           {/* Current Value */}
           <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Market Value</span>
                 <RefreshCw className={`h-3.5 w-3.5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              </div>
              <div className="space-y-1">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tighter">₹{portfolioSummary.totalCurrent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Real-time Valuation</p>
              </div>
           </div>

           {/* Realized (Booked) */}
           <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Realized Alpha</span>
                 <Check className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                 <div className="flex items-baseline space-x-2">
                    <h3 className={`text-2xl font-black tracking-tighter ${(portfolioSummary.realizedGain || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                       ₹{Math.abs(portfolioSummary.realizedGain || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </h3>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${(portfolioSummary.realizedGain || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                       {(portfolioSummary.realizedPnlPercent || 0).toFixed(1)}%
                    </span>
                 </div>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Booked P&L</p>
              </div>
           </div>

           {/* Unrealized (Paper) */}
           <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Unrealized</span>
                 <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="space-y-1">
                 <div className="flex items-baseline space-x-2">
                    <h3 className={`text-2xl font-black tracking-tighter ${(portfolioSummary.unrealizedGain || 0) >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                       ₹{Math.abs(portfolioSummary.unrealizedGain || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </h3>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${(portfolioSummary.unrealizedGain || 0) >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                       {(portfolioSummary.unrealizedPnlPercent || 0).toFixed(1)}%
                    </span>
                 </div>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Current Floating</p>
              </div>
           </div>

           {/* Combined P&L */}
           <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Score</span>
                 <Target className="h-3.5 w-3.5 text-slate-300" />
              </div>
              <div className="space-y-1">
                 <div className="flex items-baseline space-x-2">
                    <h3 className={`text-2xl font-black tracking-tighter ${(portfolioSummary.combinedPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                       ₹{Math.abs(portfolioSummary.combinedPnL || 0).toLocaleString()}
                    </h3>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${(portfolioSummary.combinedPnL || 0) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                       {(portfolioSummary.combinedPnlPercent || 0).toFixed(1)}%
                    </span>
                 </div>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Returns</p>
              </div>
           </div>

           {/* Institutional Grade Card */}
           <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-blue-100 uppercase tracking-[0.2em] leading-none">Security Grade</span>
                    <ShieldCheck className="h-4 w-4 text-blue-200" />
                 </div>
                 <h3 className="text-xl font-black leading-none uppercase italic tracking-tighter">Institutional</h3>
              </div>
           </div>
        </div>
      )}

      {/* 3. Portfolio Risk Analyzer (Integrated Analytics) */}
      {activeTab === 'portfolio' && portfolioSummary.totalInvested > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 shrink-0 animate-in fade-in slide-in-from-bottom duration-700">
           {/* Strategy Distribution */}
           <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Strategy Matrix</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alpha Model Exposure</p>
                 </div>
                 <BookOpen className="h-5 w-5 text-indigo-500 opacity-50" />
              </div>

              <div className="space-y-5 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                 {(() => {
                    const strategyStats = portfolioSummary.strategyStats || {};
                    const totalValue = Object.values(strategyStats).reduce((a, b) => a + (b as number), 0) as number;
                    
                    return Object.entries(strategyStats)
                       .sort(([, a], [, b]) => (b as number) - (a as number))
                       .map(([strategy, amount]) => {
                          const pct = (amount as number / totalValue) * 100;
                          return (
                             <div key={strategy} className="group cursor-default">
                                <div className="flex justify-between items-end mb-2">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">{strategy.replace('_', ' ')}</span>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">Allocation: ₹{(amount as number).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                   </div>
                                   <span className="text-[11px] font-black text-slate-900">{pct.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                   <div 
                                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000 group-hover:bg-indigo-600"
                                      style={{ width: `${pct}%` }}
                                   />
                                </div>
                             </div>
                          );
                       });
                 })()}
              </div>
           </div>

           {/* Market Cap Distribution */}
           <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Cap Allocation</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">50-30-20 Institutional Rule</p>
                 </div>
                 <div className="px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Live Audit</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                 {[
                    { label: 'Large Cap', allocation: 50, current: portfolioSummary.capBreakdown.large, color: 'bg-slate-900', desc: '> 65k Cr', icon: ShieldCheck },
                    { label: 'Mid Cap', allocation: 30, current: portfolioSummary.capBreakdown.mid, color: 'bg-blue-600', desc: '20k - 65k Cr', icon: Target },
                    { label: 'Small Cap', allocation: 20, current: portfolioSummary.capBreakdown.small, color: 'bg-indigo-500', desc: '< 20k Cr', icon: Zap }
                 ].map((cap, i) => {
                    const diff = cap.current - cap.allocation;
                    const isAlert = Math.abs(diff) > 10;
                    return (
                       <div key={i} className={`p-5 rounded-[2rem] border transition-all ${isAlert ? 'bg-red-50/30 border-red-100' : 'bg-slate-50/50 border-slate-100'}`}>
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-xl ${cap.color} text-white`}>
                                   <cap.icon className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                   <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight block leading-none mb-1">{cap.label}</span>
                                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{cap.desc}</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className={`text-sm font-black block leading-none ${isAlert ? 'text-red-600' : 'text-slate-900'}`}>
                                   {cap.current.toFixed(1)}%
                                </span>
                                <span className={`text-[8px] font-black uppercase ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                   {diff > 0 ? '+' : ''}{diff.toFixed(1)}% Variance
                                </span>
                             </div>
                          </div>
                          <div className="w-full h-2 bg-white rounded-full overflow-hidden relative border border-slate-100">
                             <div className={`h-full ${cap.color} rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${cap.current}%` }} />
                             <div className="absolute top-0 bottom-0 border-l-2 border-slate-400/30 z-10" style={{ left: `${cap.allocation}%` }} />
                          </div>
                          <div className="flex justify-between items-center mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                             <span>Market Exposure</span>
                             <span>Model Allocation {cap.allocation}%</span>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>

           {/* Sector Exposure */}
           <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8 flex flex-col">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Sectors</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">20% Safety Limit</p>
                 </div>
                 <div className="p-2 bg-emerald-50 rounded-xl">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                 </div>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 max-h-[350px] pr-2 custom-scrollbar">
                 {Object.entries(portfolioSummary.sectorBreakdown)
                    .sort(([, a], [, b]) => b.amount - a.amount)
                    .map(([sector, data], i) => {
                       const pct = (data.amount / portfolioSummary.totalInvested) * 100;
                       const isOverexposed = pct > 20;
                       return (
                          <div key={i} className={`p-4 rounded-2xl border transition-all ${isOverexposed ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50 border-slate-50 hover:bg-white hover:border-slate-200 shadow-xs'}`}>
                             <div className="flex justify-between items-center mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-tight truncate max-w-[120px] ${isOverexposed ? 'text-rose-600' : 'text-slate-700'}`}>{sector}</span>
                                <span className={`text-[11px] font-black ${isOverexposed ? 'text-rose-600' : 'text-slate-900'}`}>{pct.toFixed(1)}%</span>
                             </div>
                             <div className="w-full h-1 bg-slate-200/50 rounded-full overflow-hidden">
                                <div 
                                   className={`h-full transition-all duration-1000 rounded-full ${isOverexposed ? 'bg-rose-500 shadow-lg shadow-rose-200' : 'bg-slate-900'}`} 
                                   style={{ width: `${pct}%` }} 
                                />
                             </div>
                          </div>
                       );
                    })}
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center pt-4 italic">Auto-audited for sector risk</p>
           </div>
        </section>
      )}

      {/* 4. Sub-Filters (Baskets) */}
      {activeTab !== 'portfolio' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 overflow-hidden">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
            {currentStrategy.baskets.length > 1 ? currentStrategy.baskets.map((basketKey) => (
              <button
                key={basketKey}
                onClick={() => handleBasketChange(basketKey)}
                className={`px-6 md:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeBasket === basketKey ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {basketKey.replace('_', ' ')}
              </button>
            )) : (
              <div className="px-6 md:px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">
                 {currentStrategy.baskets[0].replace('_', ' ')} Optimized
              </div>
            )}
          </div>
          
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 backdrop-blur-sm overflow-x-auto no-scrollbar shadow-inner">
             {[
               { id: 'open', label: 'Qualified', color: 'blue', activeClass: 'bg-emerald-600 text-white shadow-emerald-200', count: data?.open?.length || 0 },
               { id: 'hold', label: 'Observation', color: 'indigo', activeClass: 'bg-blue-600 text-white shadow-blue-200', count: data?.hold?.length || 0 },
               { id: 'neutral', label: 'Neutral', color: 'slate', activeClass: 'bg-slate-900 text-white shadow-slate-200', count: data?.neutral?.length || 0 },
               { id: 'watchlist', label: 'Watchlist', color: 'amber', activeClass: 'bg-amber-500 text-white shadow-amber-200', count: userWatchlist?.length || 0 },
               { id: 'rejected', label: 'Rejected', color: 'red', activeClass: 'bg-rose-600 text-white shadow-rose-200', count: data?.rejected?.length || 0 }
             ].map((tab) => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)} 
                 className={`px-5 md:px-7 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center space-x-2 relative group ${
                   activeTab === tab.id ? tab.activeClass + ' shadow-lg scale-[1.02]' : 'text-slate-500 hover:text-slate-900'
                 }`}
               >
                 <span>{tab.label}</span>
                 <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold transition-colors ${
                   activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                 }`}>
                   {tab.count}
                 </span>
               </button>
             ))}
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

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        requiredTier={requiredTier}
        userEmail={user?.email}
      />

      <BrokerHub 
        isOpen={showBrokerHub}
        onClose={() => setShowBrokerHub(false)}
        onImportComplete={handleImportHoldings}
      />
    </div>
  );
};
export default DashboardPage;
