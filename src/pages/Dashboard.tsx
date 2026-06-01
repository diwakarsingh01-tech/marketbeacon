import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TradeTable from '../components/tables/TradeTable';
import StrategyGuide from '../components/StrategyGuide';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { 
  Download, 
  ChevronRight, 
  Target, 
  ShieldCheck, 
  RefreshCw, 
  TrendingUp, 
  Wallet, 
  BookOpen, 
  X, 
  Lock, 
  ShieldAlert, 
  Check, 
  Zap, 
  Globe, 
  Activity, 
  Database, 
  PieChart, 
  AlertCircle,
  Layers,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import BrokerHub from '../components/modals/BrokerHub';
import LegalModal from '../components/modals/LegalModal';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

// --- PREMIUM DASHBOARD COMPONENTS ---

const DashboardStat = ({ title, value, icon: Icon, color = "blue" }: any) => {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100"
  };

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colors[color]} border`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">{value}</h3>
    </motion.div>
  );
};

interface DashboardPageProps {
  defaultTab?: 'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral';
}

const BASKET_LABELS: Record<string, string> = {
  'H-Super45': 'H-Super45 Universe',
  'H-GOOD45': 'H-GOOD45 Universe',
  'H-Good200': 'H-Good200 Universe'
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
    
    const open = data.allStocks.filter((r: any) => r && r.isBuyZone && r.isPass);
    const rejected = data.allStocks.filter((r: any) => r && !r.isPass);
    const neutral = data.allStocks.filter((r: any) => r && !r.isBuyZone && r.isPass);
    const watchlist = data.allStocks.filter((r: any) => r !== null);

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

  if (!data && isRefreshing) {
    return (
      <div className="flex-1 flex flex-col py-6 md:py-10 px-4 md:px-10 space-y-10 bg-[#f8fafc] animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-100 pb-10 gap-8">
           <div className="space-y-4">
              <div className="w-48 h-8 bg-slate-200 rounded-xl animate-pulse" />
              <div className="w-64 h-12 bg-slate-200 rounded-2xl animate-pulse" />
           </div>
           <div className="flex gap-4">
              <div className="w-32 h-12 bg-slate-200 rounded-2xl animate-pulse" />
              <div className="w-32 h-12 bg-slate-200 rounded-2xl animate-pulse" />
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse" />)}
        </div>
        <div className="h-96 bg-white rounded-[3.5rem] border border-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-6 md:py-10 px-4 md:px-10 space-y-10 bg-[#f8fafc] overflow-y-auto no-scrollbar">
      {/* Institutional Header (Safe-Guard Rule #9) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-100 pb-10 gap-8">
        <div className="space-y-5">
           <div className="flex items-center space-x-3 text-slate-400">
              <div className="w-10 h-10 bg-slate-ink text-white rounded-xl flex items-center justify-center shadow-2xl border border-white/5" style={{ backgroundColor: 'var(--slate-ink)' }}>
                 <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Matrix Node</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Real-time Terminal Monitor</span>
              </div>
           </div>
           <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                {activeTab === 'portfolio' ? 'Wealth Desk' : activeTab === 'hold' ? 'Watchlist' : 'Matrix Screener'}
              </h1>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] pl-1">{currentStrategy.name}</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {activeTab === 'portfolio' && (
            <button 
              onClick={() => setShowBrokerHub(true)} 
              className="px-8 py-4 bg-slate-ink text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center space-x-3 hover:bg-black transition-all active:scale-95 border border-white/5"
              style={{ backgroundColor: 'var(--slate-ink)' }}
            >
              <Globe className="h-4 w-4 text-blue-500" />
              <span>Connect Institutional Node</span>
            </button>
          )}

          <div className="flex flex-col space-y-1.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] pl-2">Active Universe</span>
            <div className="relative group">
              <select 
                value={activeBasket} 
                onChange={(e) => setActiveBasket(e.target.value)} 
                className="appearance-none bg-white border border-slate-200 rounded-2xl pl-6 pr-12 py-4 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer hover:border-blue-500/30 transition-all min-w-[160px]"
              >
                <option value="Bluechip">Bluechip</option>
                <option value="High Beta">High Beta</option>
                <option value="Wealth Universe">Wealth Universe</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] pl-2">Model Matrix</span>
            <div className="relative group">
              <select 
                value={strategyId} 
                onChange={(e) => navigate(`?strategy=${e.target.value}`)} 
                className="appearance-none bg-white border border-slate-200 rounded-2xl pl-6 pr-12 py-4 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer hover:border-blue-500/30 transition-all min-w-[200px]"
              >
                {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex items-end h-full pb-0.5 pt-4 space-x-3">
            <button 
              onClick={handleMasterExport}
              className="flex items-center space-x-3 px-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200/50 group border border-white/5"
            >
              <Download className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
              <span>Export Audit</span>
            </button>
            <button 
              onClick={() => fetchData(true)} 
              className={`p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Unified Portfolio Summary */}
      {(activeTab === 'portfolio' || activeTab === 'hold') && portfolioSummary.totalInvested > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-slate-ink rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5" style={{ backgroundColor: 'var(--slate-ink)' }}>
             <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-all" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">Total Invested</span>
             <h3 className="text-4xl font-black mt-3 tracking-tighter relative z-10 italic">₹{portfolioSummary.totalInvested.toLocaleString()}</h3>
          </div>
          <DashboardStat title="Valuation" value={`₹${portfolioSummary.totalCurrent.toLocaleString()}`} icon={TrendingUp} color="blue" />
          <DashboardStat title="Absolute P&L" value={`${portfolioSummary.totalPnL >= 0 ? '+' : '-'}₹${Math.abs(portfolioSummary.totalPnL).toLocaleString()}`} icon={Activity} color={portfolioSummary.totalPnL >= 0 ? "emerald" : "rose"} />
          
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cap Architecture</span>
               <PieChart className="h-4 w-4 text-slate-300" />
            </div>
            <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-50 shadow-inner">
               <div className="h-full bg-slate-ink transition-all duration-1000" style={{ width: `${portfolioSummary.capBreakdown.large}%` }} />
               <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${portfolioSummary.capBreakdown.mid}%` }} />
               <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${portfolioSummary.capBreakdown.small}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
               <span>L: {portfolioSummary.capBreakdown.large.toFixed(0)}%</span>
               <span>M: {portfolioSummary.capBreakdown.mid.toFixed(0)}%</span>
               <span>S: {portfolioSummary.capBreakdown.small.toFixed(0)}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Institutional Tab Controller */}
      <div className="flex bg-slate-200/40 p-1.5 rounded-[1.5rem] md:rounded-[2.2rem] border border-slate-200/50 w-fit max-w-full overflow-x-auto no-scrollbar shadow-inner gap-1.5">
         {[
           { id: 'open', label: 'Qualified', count: data?.allStocks?.filter((r: any) => r && r.isBuyZone && r.isPass).length || 0 },
           { id: 'neutral', label: 'Neutral', count: data?.allStocks?.filter((r: any) => r && !r.isBuyZone && r.isPass).length || 0 },
           { id: 'rejected', label: 'Rejected', count: data?.allStocks?.filter((r: any) => r && !r.isPass).length || 0 },
           { id: 'hold', label: 'Watchlist', count: data?.allStocks?.filter((r: any) => r !== null).length || 0 },
         ].map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setActiveTab(tab.id as any)} 
             className={`px-6 md:px-10 py-3.5 md:py-4 rounded-[1.2rem] md:rounded-[1.8rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${
               activeTab === tab.id 
                 ? 'bg-white text-slate-900 shadow-xl border border-slate-100' 
                 : 'text-slate-500 hover:text-slate-950 hover:bg-white/40'
             }`}
           >
              <div className="flex items-center justify-center space-x-3 md:space-x-4">
                 <span>{tab.label}</span>
                 <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black ${
                   activeTab === tab.id ? 'bg-slate-ink text-white' : 'bg-slate-200 text-slate-600'
                 }`}>
                    {tab.count}
                 </span>
              </div>
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              )}
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.section 
          key={activeTab + activeBasket}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 min-h-0"
        >
          {error ? (
            <div className="bg-white rounded-[3.5rem] h-96 border-2 border-slate-100 flex flex-col items-center justify-center space-y-8 shadow-sm p-12">
              <div className="p-8 bg-rose-500/10 border-2 border-rose-500/20 rounded-[2.5rem] text-rose-600 max-w-md text-center">
                 <ShieldAlert className="h-12 w-12 mx-auto mb-6 animate-pulse" />
                 <h2 className="text-xl font-black uppercase tracking-tighter mb-2 italic">Institutional Link Severed</h2>
                 <p className="text-xs font-bold uppercase tracking-widest leading-relaxed opacity-80">{error}</p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => { localStorage.removeItem('mb_api_override'); window.location.reload(); }} 
                  className="px-12 py-5 bg-slate-ink text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all active:scale-95 border border-white/5"
                  style={{ backgroundColor: 'var(--slate-ink)' }}
                >
                  Authorize Node Reset
                </button>
                <Link to="/connect" className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-950 transition-all">Connectivity Hub</Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden h-full relative group/table">
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
               {/* Institutional Border Highlight */}
               <div className="absolute inset-0 border-2 border-blue-600/0 group-hover/table:border-blue-600/5 rounded-[3.5rem] pointer-events-none transition-all duration-700" />
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <BrokerHub isOpen={showBrokerHub} onClose={() => setShowBrokerHub(false)} onImportComplete={handleImportHoldings} />
    </div>
  );
};
export default DashboardPage;
