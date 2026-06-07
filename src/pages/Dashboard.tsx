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
  Search,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import BrokerHub from '../components/modals/BrokerHub';
import LegalModal from '../components/modals/LegalModal';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

// --- PREMIUM DASHBOARD COMPONENTS ---

const DashboardStat = ({ title, value, icon: Icon, color = "blue", subtitle }: any) => {
  const iconColors: any = {
    blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/10",
    slate: "text-slate-500 bg-slate-500/5 border-slate-500/10",
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/10"
  };

  return (
    <motion.div 
      whileHover={{ y: -1 }}
      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[110px]"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg border ${iconColors[color]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="space-y-0.5">
        <h3 className="text-2xl font-black text-slate-950 tracking-tight italic font-sans">{value}</h3>
        {subtitle && (
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

interface DashboardPageProps {
  defaultTab?: 'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral';
}

const BASKET_LABELS: Record<string, string> = {
  'Elite Basket': 'Elite Basket Universe',
  'Quality Basket': 'Quality Basket Universe',
  'Growth Basket': 'Growth Basket Universe'
};

const DashboardPage: React.FC<DashboardPageProps> = ({ defaultTab = 'open' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const userTier = user?.tier || 'free';
  const defaultStrategyId = userTier === 'alpha' 
    ? 'SR_STRATEGY' 
    : userTier === 'pro' 
      ? 'SMA_BCD' 
      : 'ENVELOPE_LONG';
  const strategyId = searchParams.get('strategy') || defaultStrategyId;



  // Determine route context so tabs never bleed between screener and portfolio
  const isPortfolioRoute = location.pathname === '/portfolio';
  const isMarketRoute = location.pathname === '/market';
  const isScreenerRoute = location.pathname === '/screener';

  const currentStrategy = STRATEGIES.find(s => s.id === strategyId) || STRATEGIES[0];
  const lockedStrategies = STRATEGIES.filter(s => s.isLocked);

  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeBasket, setActiveBasket] = useState<string>(currentStrategy.baskets[0]);
  const [activeTab, setActiveTab] = useState<'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral'>(defaultTab);

  // Locked tab setter — prevents screener route from ever showing portfolio tab & vice versa
  const handleSetActiveTab = (tab: 'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral') => {
    if (isPortfolioRoute) return; // portfolio route tab is fixed
    if (isMarketRoute) return;   // market route tab is fixed
    if (isScreenerRoute && tab === 'portfolio') return; // screener can't show portfolio
    setActiveTab(tab);
  };
  const [showGuide, setShowGuide] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBrokerHub, setShowBrokerHub] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'alpha'>('pro');

  const canAccess = (stratTier: string) => {
    const userTier = user?.tier || 'free';
    const weights: Record<string, number> = { 'free': 1, 'pro': 2, 'alpha': 3 };
    return weights[userTier] >= weights[stratTier];
  };

  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualPrice, setManualPrice] = useState('');

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
      if (res.status === 401 || res.status === 403 || d?.error === 'Invalid token.' || d?.error === 'Access denied.') {
        localStorage.removeItem('mb_token');
        localStorage.removeItem('mb_user');
        window.location.href = '/login';
        return;
      }
      if (res.ok && !d.error) setTrades(d || []);
    } catch (e) { console.error('Fetch Trades Error:', e); }
  }, []);

  const fetchWatchlist = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, { headers: { 'Authorization': `Bearer ${token}` } });
      const d = await safeJsonParse(response);
      if (response.status === 401 || response.status === 403 || d?.error === 'Invalid token.' || d?.error === 'Access denied.') {
        localStorage.removeItem('mb_token');
        localStorage.removeItem('mb_user');
        window.location.href = '/login';
        return;
      }
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

  const handleImportHoldings = async (holdings: any[], mode: 'merge' | 'overwrite' = 'merge') => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/watchlist/bulk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ holdings, mode })
      });
      const resData = await safeJsonParse(response);
      if (response.ok && !resData.error) {
        alert(`Successfully imported ${holdings.length} holdings.`);
        fetchWatchlist();
      } else {
        alert(`Import failed: ${resData.error || 'Server error'}`);
      }
    } catch (e) { 
      console.error('Import holdings error:', e);
      alert("Import failed."); 
    } finally { 
      setIsRefreshing(false); 
    }
  };

  const handleClearPortfolio = async () => {
    if (!window.confirm("Are you sure you want to remove all old details/positions from your Wealth Desk? This action cannot be undone.")) return;
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("All old details removed successfully.");
        fetchWatchlist();
      } else {
        alert("Failed to remove old details.");
      }
    } catch (e) {
      alert("Error removing old details.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddManualHolding = async (symbol: string, quantity: number, buyPrice: number) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ symbol: symbol.toUpperCase().trim() })
      });
      if (response.ok) {
        await fetch(`${API_URL}/api/watchlist/${symbol.toUpperCase().trim()}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ quantity, buy_price: buyPrice })
        });
        fetchWatchlist();
      }
    } catch (e) { console.error('Add Manual Holding Error:', e); }
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
      const response = await fetch(`${API_URL}/api/backtest/audit?basket=${encodeURIComponent(activeBasket)}&strategy=${encodeURIComponent(strategyId)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('mb_token')}` }
      });
      const d = await safeJsonParse(response);
      
      if (response.status === 403 && d.requiredTier) {
        setRequiredTier(d.requiredTier);
        setShowUpgradeModal(true);
        setError(`This strategy requires ${d.requiredTier.toUpperCase()} tier access.`);
        return;
      }

      if (response.status === 401 || response.status === 403 || d?.error === 'Invalid token.' || d?.error === 'Access denied.') {
        localStorage.removeItem('mb_token');
        localStorage.removeItem('mb_user');
        window.location.href = '/login';
        return;
      }
      if (response.ok && !d.error) {
          console.log(`[DASHBOARD] Successfully fetched ${d.allStocks?.length || 0} nodes for basket: ${activeBasket}`);
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
    // Portfolio tab handled separately first (so it doesn't require screener data to be loaded)
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
        const base = data?.allStocks?.find((s: any) => s.symbol === symbol) || { symbol, marketCap: stockCaps[symbol] || 0, sector: stockSectors[symbol] || 'Manual', currentPrice: stockPrices[symbol] || 0 };
        return { ...base, ...combinedMap[symbol] };
      }).filter(s => s.quantity > 0);
    }

    if (!data || !data.allStocks) return [];
    
    // Bifurcation Logic:
    // 1. Qualified (Open): isBuyZone && isPass
    // 2. Rejected: !isPass
    // 3. Neutral: !isBuyZone && isPass
    // 4. Watchlist: allStocks
    
    const currentBasketStocks = (BASKETS[activeBasket] || []).map(s => s.trim().toUpperCase());
    
    // Institutional Robustness: Filter by basket but fallback to raw backend data if needed
    const basketData = data.allStocks.map((r: any) => {
      const sym = (r.symbol || '').trim().toUpperCase();
      const inLocalBasket = currentBasketStocks.includes(sym) || 
                            currentBasketStocks.includes(sym.replace('.NS', '')) ||
                            currentBasketStocks.some(b => b.replace('.NS', '') === sym);
      return { ...r, inLocalBasket };
    }).filter((r: any) => r.inLocalBasket || activeBasket === 'All Symbols');

    // If basket filtering results in 0 nodes but backend sent data, show backend data as fallback
    const finalDisplayData = basketData.length > 0 ? basketData : data.allStocks;

    const open = finalDisplayData.filter((r: any) => r && r.isBuyZone && r.isPass);
    const rejected = finalDisplayData.filter((r: any) => r && !r.isPass && r.reason !== 'Audit Pending: Node Warming Up');
    const neutral = finalDisplayData.filter((r: any) => r && ( (!r.isBuyZone && r.isPass) || r.reason === 'Audit Pending: Node Warming Up' ));
    const watchlist = finalDisplayData; // Full institutional basket

    if (activeTab === 'hold') return watchlist; 
    if (activeTab === 'open') return open;
    if (activeTab === 'rejected') return rejected;
    if (activeTab === 'neutral') return neutral;
    // Show pending nodes in watchlist or relevant tab
    if (activeTab === 'watchlist') return watchlist;

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

  const portfolioCount = useMemo(() => {
    const combinedMap: Record<string, { quantity: number, buy_price: number }> = {};
    (userWatchlist || []).forEach(w => { combinedMap[w.symbol] = { quantity: w.quantity || 0, buy_price: w.buy_price || 0 }; });
    (trades || []).filter(t => t.status === 'OPEN').forEach(t => {
      if (combinedMap[t.symbol]) {
        const ex = combinedMap[t.symbol];
        const nQty = ex.quantity + (t.quantity || 0);
        if (nQty > 0) { ex.buy_price = ((ex.buy_price * ex.quantity) + (t.entry_price * t.quantity)) / nQty; ex.quantity = nQty; }
      } else { combinedMap[t.symbol] = { quantity: t.quantity || 0, buy_price: t.entry_price || 0 }; }
    });
    return Object.keys(combinedMap).filter(symbol => combinedMap[symbol].quantity > 0).length;
  }, [userWatchlist, trades]);

  const openCount = useMemo(() => {
    const basket = (BASKETS[activeBasket] || []).map(s => s.trim().toUpperCase());
    return (data?.allStocks || []).filter((r: any) => {
      const sym = (r.symbol || '').trim().toUpperCase();
      const inBasket = basket.includes(sym) || basket.includes(sym.replace('.NS', '')) || basket.some(b => b.replace('.NS', '') === sym);
      return inBasket && r.isBuyZone && r.isPass;
    }).length;
  }, [data, activeBasket]);

  const neutralCount = useMemo(() => {
    const basket = (BASKETS[activeBasket] || []).map(s => s.trim().toUpperCase());
    return (data?.allStocks || []).filter((r: any) => {
      const sym = (r.symbol || '').trim().toUpperCase();
      const inBasket = basket.includes(sym) || basket.includes(sym.replace('.NS', '')) || basket.some(b => b.replace('.NS', '') === sym);
      return inBasket && ( (r.isBuyZone === false && r.isPass) || r.reason === 'Audit Pending: Node Warming Up' );
    }).length;
  }, [data, activeBasket]);

  const rejectedCount = useMemo(() => {
    const basket = (BASKETS[activeBasket] || []).map(s => s.trim().toUpperCase());
    return (data?.allStocks || []).filter((r: any) => {
      const sym = (r.symbol || '').trim().toUpperCase();
      const inBasket = basket.includes(sym) || basket.includes(sym.replace('.NS', '')) || basket.some(b => b.replace('.NS', '') === sym);
      return inBasket && r.isPass === false;
    }).length;
  }, [data, activeBasket]);

  const watchlistCount = useMemo(() => {
    return (BASKETS[activeBasket] || []).length || 0;
  }, [activeBasket]);

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
    <div className="flex-1 flex flex-col py-4 md:py-6 px-4 md:px-8 space-y-6 bg-[#f8fafc] overflow-y-auto no-scrollbar">
      {/* Institutional Header (Safe-Guard Rule #9) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-100 pb-6 gap-6">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-slate-400">
              <div className="w-10 h-10 bg-slate-ink text-white rounded-xl flex items-center justify-center shadow-xl border border-white/5" style={{ backgroundColor: 'var(--slate-ink)' }}>
                 <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">Matrix Node</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Real-time Terminal Monitor</span>
              </div>
           </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                {isPortfolioRoute ? 'Wealth Desk' : isMarketRoute ? 'Market Watch' : 'Matrix Screener'}
              </h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] pl-1">
                {isPortfolioRoute ? 'Custom Portfolio Asset Ledger' : currentStrategy.name}
              </p>
           </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end gap-4 w-full lg:w-auto">
          {isPortfolioRoute && (
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="grid grid-cols-3 gap-2.5 w-full md:flex md:w-auto">
                <button 
                  onClick={handleClearPortfolio} 
                  className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center justify-center space-x-1.5 hover:bg-rose-100/50 hover:border-rose-300 transition-all active:scale-95 animate-in fade-in"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <span className="hidden sm:inline">Remove Old Details</span>
                  <span className="sm:hidden">Reset</span>
                </button>
                <button 
                  onClick={() => setShowAddManualModal(true)} 
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center justify-center space-x-1.5 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                >
                  <span>+ Add</span>
                </button>
                <button 
                  onClick={() => setShowBrokerHub(true)} 
                  className="px-5 py-2.5 bg-slate-ink text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center space-x-2 hover:bg-black transition-all active:scale-95 border border-white/5"
                  style={{ backgroundColor: 'var(--slate-ink)' }}
                >
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span className="hidden sm:inline">Upload New Details</span>
                  <span className="sm:hidden">Upload</span>
                </button>
              </div>
              <button 
                onClick={() => fetchData(true)} 
                className={`p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all shrink-0 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )}

          {!isPortfolioRoute && (
            <div className="grid grid-cols-2 md:flex md:flex-row md:items-end gap-3.5 w-full md:w-auto">
              <div className="flex flex-col space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1.5">Active Universe</span>
                <div className="relative group">
                  <select 
                    value={activeBasket} 
                    onChange={(e) => setActiveBasket(e.target.value)} 
                    className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-all w-full md:min-w-[150px]"
                  >
                    {currentStrategy.baskets.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1.5">Model Matrix</span>
                <div className="relative group">
                  <select 
                    value={strategyId} 
                    onChange={(e) => {
                      const selected = STRATEGIES.find(s => s.id === e.target.value);
                      if (selected && !canAccess(selected.tier)) {
                        setRequiredTier(selected.tier as any);
                        setShowUpgradeModal(true);
                        return;
                      }
                      navigate(`?strategy=${e.target.value}`);
                    }} 
                    className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-all w-full md:min-w-[180px]"
                  >
                    {lockedStrategies.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {!canAccess(s.tier) ? '🔒' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 col-span-2 md:col-span-1 w-full md:w-auto md:pb-0.5">
                <button 
                  onClick={handleMasterExport}
                  className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md group border border-white/5"
                >
                  <Download className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span>Export Audit</span>
                </button>
                
                <button 
                  onClick={() => fetchData(true)} 
                  className={`p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all shrink-0 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unified Portfolio Summary — only on Wealth Desk (/portfolio) */}
      {isPortfolioRoute && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500"
        >
          <DashboardStat 
            title="Total Invested" 
            value={`₹${portfolioSummary.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={Wallet} 
            color="slate" 
          />
          <DashboardStat 
            title="Valuation" 
            value={`₹${portfolioSummary.totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={TrendingUp} 
            color="blue" 
          />
          <DashboardStat 
            title="Absolute P&L" 
            value={`${portfolioSummary.totalPnL >= 0 ? '+' : '-'}₹${Math.abs(portfolioSummary.totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={Activity} 
            color={portfolioSummary.totalPnL >= 0 ? "emerald" : "rose"} 
            subtitle={portfolioSummary.totalInvested > 0 ? `${((portfolioSummary.totalPnL / portfolioSummary.totalInvested) * 100).toFixed(2)}% PnL` : undefined}
          />
          <DashboardStat 
            title="Cap Architecture" 
            value={`L:${portfolioSummary.capBreakdown.large.toFixed(0)}% M:${portfolioSummary.capBreakdown.mid.toFixed(0)}% S:${portfolioSummary.capBreakdown.small.toFixed(0)}%`} 
            icon={PieChart} 
            color="amber" 
            subtitle="Large / Mid / Small Cap Mix"
          />
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.section 
          key={activeTab + activeBasket}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 min-h-0"
        >
          {error ? (
            <div className="bg-white rounded-[2rem] h-96 border border-slate-100 flex flex-col items-center justify-center space-y-6 shadow-sm p-8">
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 max-w-md text-center">
                 <ShieldAlert className="h-10 w-10 mx-auto mb-4 animate-pulse" />
                 <h2 className="text-lg font-black uppercase tracking-tighter mb-2 italic">Institutional Link Severed</h2>
                 <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-80">{error}</p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => { localStorage.removeItem('mb_api_override'); window.location.reload(); }} 
                  className="px-8 py-3.5 bg-slate-ink text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:bg-black transition-all active:scale-95 border border-white/5"
                  style={{ backgroundColor: 'var(--slate-ink)' }}
                >
                  Authorize Node Reset
                </button>
                <Link to="/connect" className="px-6 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:text-slate-950 transition-all">Connectivity Hub</Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden h-full relative group/table">
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
                    setActiveTab={handleSetActiveTab}
                    strategyId={strategyId}
                    portfolioCount={portfolioCount}
                    openCount={openCount}
                    neutralCount={neutralCount}
                    rejectedCount={rejectedCount}
                    watchlistCount={watchlistCount}
                    onAddPositionClick={() => setShowAddManualModal(true)}
                    onConnectNodeClick={() => setShowBrokerHub(true)}
                  />
               </div>
               {/* Institutional Border Highlight */}
               <div className="absolute inset-0 border border-blue-600/0 group-hover/table:border-blue-600/5 rounded-[2.5rem] pointer-events-none transition-all duration-700" />
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <BrokerHub isOpen={showBrokerHub} onClose={() => setShowBrokerHub(false)} onImportComplete={handleImportHoldings} />

      {showAddManualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none">Add Asset Node</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Manual Portfolio Entry</p>
                 </div>
                 <button onClick={() => setShowAddManualModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={async (e) => {
                 e.preventDefault();
                 if (!manualSymbol) return;
                 const qty = parseInt(manualQty) || 0;
                 const pr = parseFloat(manualPrice) || 0;
                 await handleAddManualHolding(manualSymbol, qty, pr);
                 setShowAddManualModal(false);
                 setManualSymbol('');
                 setManualQty('');
                 setManualPrice('');
              }} className="space-y-6 text-left">
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Stock Symbol</label>
                    <input type="text" required placeholder="e.g. TCS" value={manualSymbol} onChange={(e) => setManualSymbol(e.target.value.toUpperCase())} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-blue-600 focus:bg-white transition-all outline-none shadow-inner" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Quantity</label>
                       <input type="number" required placeholder="0" value={manualQty} onChange={(e) => setManualQty(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-blue-600 focus:bg-white transition-all outline-none shadow-inner" />
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Buy Price</label>
                       <input type="number" step="0.05" required placeholder="0.00" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-blue-600 focus:bg-white transition-all outline-none shadow-inner" />
                    </div>
                 </div>
                  <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 hover:bg-black">
                     Add to Portfolio
                  </button>
               </form>
            </div>
         </div>
       )}

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
