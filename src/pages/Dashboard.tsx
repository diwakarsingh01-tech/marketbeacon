import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import TradeTable from '../components/tables/TradeTable';
import StrategyGuide from '../components/StrategyGuide';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { Download, ChevronRight, Target, ShieldCheck, RefreshCw, TrendingUp, Wallet, BookOpen, X, Lock, ShieldAlert, Check, Zap, Globe, Activity, Database, PieChart, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import BrokerHub from '../components/modals/BrokerHub';
import LegalModal from '../components/modals/LegalModal';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

interface DashboardPageProps {
  defaultTab?: 'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral';
}

const BASKET_LABELS: Record<string, string> = {
  'Bluechip': 'Bluechip Universe',
  'High Beta': 'High Beta Universe',
  'Wealth Universe': 'Wealth Universe'
};

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
    if (currentStrategy && !currentStrategy.baskets.includes(activeBasket as any)) {
      setActiveBasket(currentStrategy.baskets[0]);
    }
  }, [strategyId, currentStrategy]);

  const fetchTrades = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/trades`, { headers: { 'Authorization': `Bearer ${token}` } });
      const d = await safeJsonParse(res);
      if (res.ok && !d.error) setTrades(d || []);
    } catch (e) { console.error('Fetch Trades Error:', e); }
  }, []);

  const fetchWatchlist = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, { headers: { 'Authorization': `Bearer ${token}` } });
      const d = await safeJsonParse(response);
      if (response.ok && !d.error) setUserWatchlist(d || []);
    } catch (e) { console.error('Watchlist Error:', e); }
  }, []);

  const handleToggleWatchlist = async (symbol: string) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    const isAdding = !userWatchlist.find(s => s.symbol === symbol);
    try {
      const response = await fetch(`${API_URL}/api/watchlist${isAdding ? '' : `/${symbol}`}`, {
        method: isAdding ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: isAdding ? JSON.stringify({ symbol }) : undefined
      });
      if (response.ok) fetchWatchlist();
    } catch (e) { console.error('Toggle Error:', e); }
  };

  const handleUpdateHolding = async (symbol: string, quantity: number, buy_price: number) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/watchlist/${symbol}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quantity, buy_price })
      });
      if (response.ok) fetchWatchlist();
    } catch (e) { console.error('Update Error:', e); }
  };

  const handleImportHoldings = async (holdings: any[]) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    setIsRefreshing(true);
    try {
      for (const item of holdings) {
        await fetch(`${API_URL}/api/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ symbol: item.symbol })
        });
        await fetch(`${API_URL}/api/watchlist/${item.symbol}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ quantity: item.quantity, buy_price: item.buyPrice })
        });
      }
      alert(`Imported ${holdings.length} holdings.`);
      fetchWatchlist();
    } catch (e) { alert("Import failed."); }
    finally { setIsRefreshing(false); }
  };

  useEffect(() => {
    fetchWatchlist();
    fetchTrades();
  }, [fetchWatchlist, fetchTrades]);

  const fetchStockPrices = async (symbols: string[]) => {
    if (!symbols || symbols.length === 0) return;
    const chunkSize = 50;
    const priceMap: Record<string, number> = { ...stockPrices };
    const athMap: Record<string, number> = { ...stockATHs };
    const capMap: Record<string, number> = { ...stockCaps };
    const sectorMap: Record<string, string> = { ...stockSectors };

    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      try {
        const response = await fetch(`${API_URL}/api/stock-prices?symbols=${chunk.join(',')}`);
        const d = await safeJsonParse(response);
        if (response.ok && Array.isArray(d)) {
          d.forEach((p: any) => { 
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
  const fetchData = useCallback(async (forceRefresh = false) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/backtest/audit?basket=${activeBasket}&strategy=${strategyId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('mb_token')}` }
      });
      const d = await safeJsonParse(response);
      if (response.ok && !d.error) {
          setData(d);
          const portfolioSymbols = [...(userWatchlist || []).map(w => w.symbol), ...(trades || []).map(t => t.symbol)];
          const symbolsToFetch = Array.from(new Set([...(d.allStocks?.map((s: any) => s.symbol) || []), ...portfolioSymbols]));
          fetchStockPrices(symbolsToFetch);
      } else {
          setError(d.error || `Data Sync Failed`);
      }
    } catch (e) { setError('Connection Error'); }
    finally { setTimeout(() => setIsRefreshing(false), 300); }
  }, [activeBasket, strategyId, userWatchlist, trades]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTradesForTab = useCallback(() => {
    if (!data || !data.allStocks) return [];
    
    // Bifurcation Logic:
    // 1. Qualified (Open): isBuyZone && isPass
    // 2. Rejected: !isPass
    // 3. Neutral: !isBuyZone && isPass
    // 4. Watchlist: allStocks
    
    const open = data.allStocks.filter((r: any) => r?.isBuyZone && r?.isPass);
    const rejected = data.allStocks.filter((r: any) => !r?.isPass);
    const neutral = data.allStocks.filter((r: any) => !r?.isBuyZone && r?.isPass);
    const watchlist = data.allStocks;

    if (activeTab === 'hold') return watchlist; // Keeping 'hold' ID as Watchlist to avoid breaking type
    if (activeTab === 'neutral') return neutral;
    if (activeTab === 'rejected') return rejected;
    if (activeTab === 'open') return open;
    
    // Portfolio tab handled separately
    if (activeTab === 'portfolio') {
      const combinedMap: Record<string, { quantity: number, buy_price: number }> = {};
      (userWatchlist || []).forEach(w => { combinedMap[w.symbol] = { quantity: w.quantity || 0, buy_price: w.buy_price || 0 }; });
      (trades || []).filter(t => t.status === 'OPEN').forEach(t => {
        if (combinedMap[t.symbol]) {
          const ex = combinedMap[t.symbol];
          const nQty = ex.quantity + (t.quantity || 0);
          if (nQty > 0) { ex.buy_price = ((ex.buy_price * ex.quantity) + (t.entry_price * t.quantity)) / nQty; ex.quantity = nQty; }
        } else { combinedMap[t.symbol] = { quantity: t.quantity || 0, buy_price: t.entry_price || 0 }; }
      });
      return Object.keys(combinedMap).map(symbol => {
        const base = data.allStocks.find((s: any) => s.symbol === symbol) || { symbol, marketCap: stockCaps[symbol] || 0, sector: stockSectors[symbol] || 'Manual', currentPrice: stockPrices[symbol] || 0 };
        return { ...base, ...combinedMap[symbol] };
      }).filter(s => s.quantity > 0);
    }
    return [];
  }, [data, userWatchlist, activeTab, trades, stockPrices, stockCaps, stockSectors]);

  const portfolioSummary = useMemo(() => {
    if (!userWatchlist.length && !trades.length) return { totalInvested: 0, totalCurrent: 0, totalPnL: 0, realizedGain: 0, capBreakdown: { large: 0, mid: 0, small: 0 }, sectorBreakdown: {} };
    let totalInv = 0, totalCur = 0;
    const capInv = { large: 0, mid: 0, small: 0 };
    const combinedMap: Record<string, { quantity: number, buy_price: number }> = {};
    userWatchlist.forEach(w => { combinedMap[w.symbol] = { quantity: w.quantity || 0, buy_price: w.buy_price || 0 }; });
    trades.filter(t => t.status === 'OPEN').forEach(t => {
      if (combinedMap[t.symbol]) {
        const ex = combinedMap[t.symbol];
        const nQty = ex.quantity + (t.quantity || 0);
        if (nQty > 0) { ex.buy_price = ((ex.buy_price * ex.quantity) + (t.entry_price * t.quantity)) / nQty; ex.quantity = nQty; }
      } else { combinedMap[t.symbol] = { quantity: t.quantity || 0, buy_price: t.entry_price || 0 }; }
    });
    Object.entries(combinedMap).forEach(([symbol, h]) => {
      const inv = h.quantity * h.buy_price;
      if (inv > 0) {
        totalInv += inv;
        totalCur += h.quantity * (stockPrices[symbol] || h.buy_price);
        const capCr = (stockCaps[symbol] || 0) / 10000000;
        if (capCr >= 20000) capInv.large += inv;
        else if (capCr >= 5000) capInv.mid += inv;
        else capInv.small += inv;
      }
    });
    return { 
      totalInvested: totalInv, totalCurrent: totalCur, totalPnL: totalCur - totalInv,
      realizedGain: trades.filter(t => t.status === 'CLOSED').reduce((a, t) => a + (((t.exit_price || 0) - (t.entry_price || 0)) * (t.quantity || 0)), 0),
      capBreakdown: {
        large: totalInv > 0 ? (capInv.large / totalInv) * 100 : 0,
        mid: totalInv > 0 ? (capInv.mid / totalInv) * 100 : 0,
        small: totalInv > 0 ? (capInv.small / totalInv) * 100 : 0
      }
    };
  }, [userWatchlist, trades, stockPrices, stockCaps]);

  const handleMasterExport = () => {
    if (!data?.allStocks?.length) return;
    const headers = ['Symbol', 'Observation', 'Strategy', 'Sector', 'Market Cap', 'Entry A (Base)', 'CMP', 'ATH', 'Target (Objective)', 'ROI%', 'Gap%', 'Audit Score', 'Audit Remark'];
    const rows = data.allStocks.map((t: any) => {
      const ath = stockATHs[t.symbol] || t.ath || 0;
      const gap = t.entryPrice > 0 ? (((t.currentPrice - t.entryPrice)/t.entryPrice) * 100).toFixed(2) : '0.00';
      const roi = t.currentPrice > 0 ? (((t.target - t.currentPrice)/t.currentPrice) * 100).toFixed(2) : '0.00';
      
      return [
        t.symbol,
        t.entryTime || '-',
        t.strategy || 'Institutional Matrix',
        t.sector,
        t.marketCap,
        t.entryPrice?.toFixed(2),
        t.currentPrice?.toFixed(2),
        ath?.toFixed(2),
        t.target?.toFixed(2),
        roi + '%',
        gap + '%',
        t.score + '/100',
        t.reason || 'Institutional Audit Active'
      ];
    });
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MarketBeacon_Master_Audit_${activeBasket}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col py-6 md:py-10 px-4 md:px-10 space-y-8 bg-[#f8fafc] overflow-y-auto">
      {/* Institutional Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-100 pb-10 gap-8">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-slate-400">
              <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                 <Zap className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Terminal Monitor</span>
           </div>
           <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                {activeTab === 'portfolio' ? 'Portfolio Mix' : activeTab === 'hold' ? 'Watchlist Audit' : 'Matrix Screener'}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{currentStrategy.name}</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {activeTab === 'portfolio' && (
            <button 
              onClick={() => setShowBrokerHub(true)} 
              className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center space-x-3 hover:bg-black transition-all active:scale-95"
            >
              <Globe className="h-4 w-4 text-blue-400" />
              <span>Connect Broker</span>
            </button>
          )}

          <div className="flex flex-col space-y-1.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Active Universe</span>
            <div className="relative group">
              <select 
                value={activeBasket} 
                onChange={(e) => setActiveBasket(e.target.value)} 
                className="appearance-none bg-white border border-slate-100 rounded-2xl pl-6 pr-10 py-3.5 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-all min-w-[140px]"
              >
                <option value="Bluechip">Bluechip</option>
                <option value="High Beta">High Beta</option>
                <option value="Wealth Universe">Wealth Universe</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Strategy Matrix</span>
            <div className="relative group">
              <select 
                value={strategyId} 
                onChange={(e) => navigate(`?strategy=${e.target.value}`)} 
                className="appearance-none bg-white border border-slate-100 rounded-2xl pl-6 pr-10 py-3.5 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-all min-w-[180px]"
              >
                {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="flex items-end h-full pb-0.5 pt-4 space-x-2">
            <button 
              onClick={handleMasterExport}
              className="flex items-center space-x-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 group"
            >
              <Download className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Export Master Audit</span>
            </button>
            <button 
              onClick={() => fetchData(true)} 
              className={`p-3.5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Unified Portfolio Summary */}
      {(activeTab === 'portfolio' || activeTab === 'hold') && portfolioSummary.totalInvested > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-all" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest relative z-10">Total Invested</span>
             <h3 className="text-3xl font-black mt-2 tracking-tighter relative z-10">₹{portfolioSummary.totalInvested.toLocaleString()}</h3>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Valuation</span>
             <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">₹{portfolioSummary.totalCurrent.toLocaleString()}</h3>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Absolute P&L</span>
             <h3 className={`text-3xl font-black mt-2 tracking-tighter ${portfolioSummary.totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
               {portfolioSummary.totalPnL >= 0 ? '+' : '-'}₹{Math.abs(portfolioSummary.totalPnL).toLocaleString()}
             </h3>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cap Mix (50-30-20)</span>
               <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
               </div>
            </div>
            <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-50">
               <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${portfolioSummary.capBreakdown.large}%` }} />
               <div className="h-full bg-slate-600 transition-all duration-1000" style={{ width: `${portfolioSummary.capBreakdown.mid}%` }} />
               <div className="h-full bg-slate-400 transition-all duration-1000" style={{ width: `${portfolioSummary.capBreakdown.small}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-tighter">
               <span>Large: {portfolioSummary.capBreakdown.large.toFixed(0)}%</span>
               <span>Mid: {portfolioSummary.capBreakdown.mid.toFixed(0)}%</span>
               <span>Small: {portfolioSummary.capBreakdown.small.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Tab Controller */}
      <div className="flex bg-slate-100/50 p-1 rounded-[1.2rem] md:rounded-[2rem] border border-slate-100 w-fit max-w-full overflow-x-auto no-scrollbar shadow-inner gap-1">
         {[
           { id: 'open', label: 'Qualified', count: data?.allStocks?.filter((r: any) => r?.isBuyZone && r?.isPass).length || 0 },
           { id: 'neutral', label: 'Neutral', count: data?.allStocks?.filter((r: any) => !r?.isBuyZone && r?.isPass).length || 0 },
           { id: 'rejected', label: 'Rejected', count: data?.allStocks?.filter((r: any) => !r?.isPass).length || 0 },
           { id: 'hold', label: 'Watchlist', count: data?.allStocks?.length || 0 },
         ].map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setActiveTab(tab.id as any)} 
             className={`px-4 md:px-8 py-2.5 md:py-3.5 rounded-[1rem] md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
               activeTab === tab.id 
                 ? 'bg-white text-slate-900 shadow-md md:shadow-xl' 
                 : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
             }`}
           >
              <div className="flex items-center justify-center space-x-2 md:space-x-3">
                 <span>{tab.label}</span>
                 <span className={`px-1.5 py-0.5 rounded-md md:rounded-lg text-[7px] md:text-[8px] font-black ${
                   activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                 }`}>
                    {tab.count}
                 </span>
              </div>
           </button>
         ))}
      </div>

      <section className="flex-1 min-h-0 animate-in fade-in duration-700">
        {error ? (
          <div className="bg-white rounded-[3rem] h-96 border border-slate-100 flex flex-col items-center justify-center space-y-8 shadow-sm">
            <div className="bg-rose-50 p-6 rounded-[2rem] text-rose-600 border border-rose-100 max-w-md text-center">
               <AlertCircle className="h-10 w-10 mx-auto mb-4" />
               <p className="text-sm font-black uppercase tracking-widest">{error}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => { localStorage.removeItem('mb_api_override'); window.location.reload(); }} 
                className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95"
              >
                Reset Connection Node
              </button>
              <Link to="/connect" className="px-8 py-5 bg-white border-2 border-slate-100 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all">Fix Connectivity</Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
             <div className="flex-1 overflow-auto custom-scrollbar">
                <TradeTable 
                  trades={getTradesForTab()} 
                  livePrices={stockPrices} 
                  athData={stockATHs}
                  capData={stockCaps}
                  userWatchlist={(userWatchlist || []).map(w => w.symbol)}
                  onToggleWatchlist={handleToggleWatchlist}
                  onUpdateHolding={handleUpdateHolding}
                  activeTab={activeTab}
                  strategyId={strategyId}
                />
             </div>
          </div>
        )}
      </section>

      <BrokerHub isOpen={showBrokerHub} onClose={() => setShowBrokerHub(false)} onImportComplete={handleImportHoldings} />
    </div>
  );
};
export default DashboardPage;
