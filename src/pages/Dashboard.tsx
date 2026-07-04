import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TradeTable from '../components/tables/TradeTable';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { 
  Download, 
  ChevronRight, 
  RefreshCw, 
  TrendingUp, 
  Wallet, 
  X, 
  ShieldAlert, 
  Zap, 
  Globe, 
  Activity, 
  PieChart, 
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import BrokerHub from '../components/modals/BrokerHub';
import LegalModal from '../components/modals/LegalModal';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import type { AllStockItem, AuditData, WatchlistItem, TradeRecord, StockPriceResult } from '../types';

const API_URL = getApiUrl();

// --- PREMIUM DASHBOARD COMPONENTS ---

interface DashboardStatProps {
  title: string;
  value: string | number;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color?: string;
  subtitle?: string;
}

const DashboardStat: React.FC<DashboardStatProps> = ({ title, value, icon: Icon, color = "blue", subtitle }) => {
  const iconColors: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    slate: "text-[var(--text-tertiary)] bg-slate-500/10 border-slate-500/30",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/30"
  };

  return (
    <motion.div 
      whileHover={{ y: -2, scale: 1.02 }}
      className="card p-5 flex flex-col justify-between min-h-[110px] transition-all duration-200 hover:border-[var(--border-secondary)] hover:shadow-lg hover:shadow-black/50"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg border ${iconColors[color]} backdrop-blur-sm`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="space-y-0.5">
        <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-mono">{value}</h3>
        {subtitle && (
          <p className="text-label text-[var(--text-muted)] uppercase tracking-wider">{subtitle}</p>
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

  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeBasket, setActiveBasket] = useState<string>(() => {
    const paramBasket = searchParams.get('basket');
    if (paramBasket && STRATEGIES.some(s => s.baskets.includes(paramBasket))) {
      return paramBasket;
    }
    return currentStrategy.baskets[0];
  });
  
  const lockedStrategies = STRATEGIES.filter(s => s.isLocked && s.baskets.includes(activeBasket));

  const [activeTab, setActiveTab] = useState<'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral'>(() => {
    const paramTab = searchParams.get('tab') as any;
    const validTabs = ['open', 'hold', 'watchlist', 'portfolio', 'rejected', 'neutral'];
    if (paramTab && validTabs.includes(paramTab)) {
      return paramTab;
    }
    return defaultTab;
  });

  // Locked tab setter — prevents screener route from ever showing portfolio tab & vice versa
  const handleSetActiveTab = (tab: 'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral') => {
    if (isPortfolioRoute) return; // portfolio route tab is fixed
    if (isMarketRoute) return;   // market route tab is fixed
    if (isScreenerRoute && tab === 'portfolio') return; // screener can't show portfolio
    setActiveTab(tab);
  };
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
  const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);

  useEffect(() => {
    const paramTab = new URLSearchParams(location.search).get('tab') as any;
    const validTabs = ['open', 'hold', 'watchlist', 'portfolio', 'rejected', 'neutral'];
    if (paramTab && validTabs.includes(paramTab)) {
      setActiveTab(paramTab);
    } else {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, location.search]);

  useEffect(() => {
    const paramBasket = new URLSearchParams(location.search).get('basket');
    if (paramBasket && currentStrategy.baskets.includes(paramBasket)) {
      setActiveBasket(paramBasket);
      return;
    }
    if (currentStrategy && !currentStrategy.baskets.includes(activeBasket)) {
      setActiveBasket(currentStrategy.baskets[0]);
    }
  }, [strategyId, currentStrategy, location.search]);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/trades`, { credentials: 'include' });
      const d = await safeJsonParse(res);
      if (res.status === 401 || res.status === 403 || d?.error === 'Invalid token.' || d?.error === 'Access denied.') {
        window.location.href = '/login';
        return;
      }
      if (res.ok && !d.error) setTrades(d || []);
    } catch (e) { console.error('Fetch Trades Error:', e); }
  }, []);

  const fetchWatchlist = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, { credentials: 'include' });
      const d = await safeJsonParse(response);
      if (response.status === 401 || response.status === 403 || d?.error === 'Invalid token.' || d?.error === 'Access denied.') {
        window.location.href = '/login';
        return;
      }
      if (response.ok && !d.error) setUserWatchlist(d || []);
    } catch (e) { console.error('Watchlist Error:', e); }
  }, []);

  const handleToggleWatchlist = async (symbol: string) => {
    const isAdding = !userWatchlist.find(s => s.symbol === symbol);
    try {
      const response = await fetch(`${API_URL}/api/watchlist${isAdding ? '' : `/${symbol}`}`, {
        method: isAdding ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: isAdding ? JSON.stringify({ symbol }) : undefined
      });
      if (response.ok) fetchWatchlist();
    } catch (e) { console.error('Toggle Error:', e); }
  };

  const handleUpdateHolding = async (symbol: string, quantity: number, buy_price: number) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist/${symbol}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity, buy_price })
      });
      if (response.ok) fetchWatchlist();
    } catch (e) { console.error('Update Error:', e); }
  };

  const handleImportHoldings = async (holdings: Array<Record<string, unknown>>, mode: 'merge' | 'overwrite' = 'merge') => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/watchlist/bulk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ holdings, mode })
      });
      const resData = await safeJsonParse(response);
      if (response.ok && !resData.error) {
        toast(`Successfully imported ${holdings.length} holdings.`);
        fetchWatchlist();
      } else {
        toast(`Import failed: ${resData.error || 'Server error'}`);
      }
    } catch (e) { 
      console.error('Import holdings error:', e);
      toast("Import failed."); 
    } finally { 
      setIsRefreshing(false); 
    }
  };

  const handleClearPortfolio = async () => {
    if (!window.confirm("Are you sure you want to remove all old details/positions from your Wealth Desk? This action cannot be undone.")) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        toast("All old details removed successfully.");
        fetchWatchlist();
      } else {
        toast("Failed to remove old details.");
      }
    } catch (e) {
      toast("Error removing old details.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddManualHolding = async (symbol: string, quantity: number, buyPrice: number) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ symbol: symbol.toUpperCase().trim() })
      });
      if (response.ok) {
        await fetch(`${API_URL}/api/watchlist/${symbol.toUpperCase().trim()}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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
          d.forEach((p: StockPriceResult) => { 
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
        credentials: 'include'
      });
      const d = await safeJsonParse(response);
      
      if (response.status === 403 && d.requiredTier) {
        setRequiredTier(d.requiredTier);
        setShowUpgradeModal(true);
        setError(`This strategy requires ${d.requiredTier.toUpperCase()} tier access.`);
        return;
      }

      if (response.status === 401 || response.status === 403 || d?.error === 'Invalid token.' || d?.error === 'Access denied.') {
        window.location.href = '/login';
        return;
      }
      if (response.ok && !d.error) {
          console.log(`[DASHBOARD] Successfully fetched ${d.allStocks?.length || 0} nodes for basket: ${activeBasket}`);
          setData(d);
          const portfolioSymbols = [...(userWatchlist || []).map(w => w.symbol), ...(trades || []).map(t => t.symbol)];
          const symbolsToFetch = Array.from(new Set([...(d.allStocks?.map(s => s.symbol) || []), ...portfolioSymbols]));
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
        const base = data?.allStocks?.find((s: AllStockItem) => s.symbol === symbol) || { symbol, marketCap: stockCaps[symbol] || 0, sector: stockSectors[symbol] || 'Manual', currentPrice: stockPrices[symbol] || 0 };
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
    const basketData = data.allStocks.map((r: AllStockItem) => {
      const sym = (r.symbol || '').trim().toUpperCase();
      const inLocalBasket = currentBasketStocks.includes(sym) || 
                            currentBasketStocks.includes(sym.replace('.NS', '')) ||
                            currentBasketStocks.some(b => b.replace('.NS', '') === sym);
      return { ...r, inLocalBasket };
    }).filter((r: AllStockItem & { inLocalBasket: boolean }) => r.inLocalBasket || activeBasket === 'All Symbols');

    // If basket filtering results in 0 nodes but backend sent data, show backend data as fallback
    const finalDisplayData = basketData.length > 0 ? basketData : data.allStocks;

    const open = finalDisplayData.filter((r: AllStockItem) => r && r.isBuyZone && r.isPass);
    const rejected = finalDisplayData.filter((r: AllStockItem) => r && !r.isPass && r.reason !== 'Audit Pending: Node Warming Up' && r.reason !== 'QUALIFIED' && r.reason !== 'OBSERVATION');
    const neutral = finalDisplayData.filter((r: AllStockItem) => r && ( r.isObservation || (!r.isBuyZone && r.isPass) || r.reason === 'Audit Pending: Node Warming Up' ));
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
    return (data?.allStocks || []).filter((r: AllStockItem) => {
      const sym = (r.symbol || '').trim().toUpperCase();
      const inBasket = basket.includes(sym) || basket.includes(sym.replace('.NS', '')) || basket.some(b => b.replace('.NS', '') === sym);
      return inBasket && r.isBuyZone && r.isPass;
    }).length;
  }, [data, activeBasket]);

  const neutralCount = useMemo(() => {
    const basket = (BASKETS[activeBasket] || []).map(s => s.trim().toUpperCase());
    return (data?.allStocks || []).filter((r: AllStockItem) => {
      const sym = (r.symbol || '').trim().toUpperCase();
      const inBasket = basket.includes(sym) || basket.includes(sym.replace('.NS', '')) || basket.some(b => b.replace('.NS', '') === sym);
      return inBasket && ( (r.isBuyZone === false && r.isPass) || r.reason === 'Audit Pending: Node Warming Up' );
    }).length;
  }, [data, activeBasket]);

  const rejectedCount = useMemo(() => {
    const basket = (BASKETS[activeBasket] || []).map(s => s.trim().toUpperCase());
    return (data?.allStocks || []).filter((r: AllStockItem) => {
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
    const headers = ['Symbol', 'Observation', 'Strategy', 'Sector', 'Market Cap', 'Level A (Base)', 'CMP', 'ATH', 'Model Objective', 'ROI%', 'Gap%', 'Audit Score', 'Audit Remark'];
    const rows = data.allStocks.map((t: AllStockItem) => {
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
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MarketBeacon_Master_Audit_${activeBasket}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!data && isRefreshing) {
    return (
      <div className="flex-1 flex flex-col py-8 md:py-12 px-6 md:px-10 space-y-8 bg-[var(--bg-primary)] animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[var(--border-primary)] pb-8 gap-8">
           <div className="space-y-4">
              <div className="w-64 h-10 bg-[var(--bg-tertiary)] rounded-xl animate-pulse" />
              <div className="w-96 h-14 bg-[var(--bg-tertiary)] rounded-2xl animate-pulse" />
           </div>
           <div className="flex gap-4">
              <div className="w-40 h-14 bg-[var(--bg-tertiary)] rounded-2xl animate-pulse" />
              <div className="w-40 h-14 bg-[var(--bg-tertiary)] rounded-2xl animate-pulse" />
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[1,2,3,4].map(i => <div key={i} className="h-40 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] animate-pulse" />)}
        </div>
        <div className="h-96 bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-primary)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-6 md:py-8 px-6 md:px-10 space-y-8 bg-[var(--bg-primary)] overflow-y-auto no-scrollbar terminal-scan">
      <SEO title="Stock Screener" description="Real-time stock screener with Institutional Audit Scores, ABCD entry levels, and multi-strategy analysis for Nifty 500." />
      {/* Institutional Header (Safe-Guard Rule #9) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[var(--border-primary)] pb-8 gap-8">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-[var(--text-tertiary)]">
              <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center shadow-xl border border-blue-500/30">
                 <Zap className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold uppercase tracking-[0.4em] leading-none text-blue-400">Matrix Node</span>
                 <span className="text-label text-[var(--text-muted)] uppercase tracking-wider mt-1 italic">Real-time Terminal Monitor</span>
              </div>
           </div>
            <div className="space-y-1">
               <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">
                 {isPortfolioRoute ? 'Wealth Desk' : isMarketRoute ? 'Market Watch' : 'Matrix Screener'}
               </h1>
               <p className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em] pl-1">
                 {isPortfolioRoute ? 'Custom Portfolio Asset Ledger' : currentStrategy.name}
               </p>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end gap-5 w-full lg:w-auto">
          {isPortfolioRoute && (
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="grid grid-cols-3 gap-2.5 w-full md:flex md:w-auto">
                <button 
                  onClick={handleClearPortfolio} 
                  className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-caption shadow-sm flex items-center justify-center space-x-1.5 hover:bg-rose-100/50 hover:border-rose-300 transition-all active:scale-95 animate-in fade-in"
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  <span className="hidden sm:inline">Remove Old Details</span>
                  <span className="sm:hidden">Reset</span>
                </button>
                <button 
                  onClick={() => setShowAddManualModal(true)} 
                  className="px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-xl text-caption shadow-sm flex items-center justify-center space-x-1.5 hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/40 transition-all active:scale-95"
                >
                  <span>+ Add</span>
                </button>
                <button 
                  onClick={() => setShowBrokerHub(true)} 
                  className="px-5 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl text-caption shadow-lg flex items-center justify-center space-x-2 hover:bg-[var(--bg-primary)] transition-all active:scale-95 border border-white/5"
                >
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span className="hidden sm:inline">Upload New Details</span>
                  <span className="sm:hidden">Upload</span>
                </button>
              </div>
              <button 
                onClick={() => fetchData(true)} 
                className={`p-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] shadow-sm hover:bg-[var(--bg-secondary)] transition-all shrink-0 ${isRefreshing ? 'animate-spin text-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )}

          {!isPortfolioRoute && (
            <div className="grid grid-cols-2 md:flex md:flex-row md:items-end gap-3.5 w-full md:w-auto">
              <div className="flex flex-col space-y-1">
                <span className="text-caption text-[var(--text-tertiary)] uppercase tracking-[0.2em] pl-1.5">Active Universe</span>
                <div className="relative group">
                  <select 
                    value={activeBasket} 
                    onChange={(e) => {
                      const newBasket = e.target.value;
                      setActiveBasket(newBasket);
                      const supportsNewBasket = STRATEGIES.find(s => s.id === strategyId)?.baskets.includes(newBasket);
                      if (!supportsNewBasket) {
                        const firstAvailable = STRATEGIES.find(s => s.isLocked && s.baskets.includes(newBasket));
                        if (firstAvailable) {
                          navigate(`?strategy=${firstAvailable.id}`);
                        }
                      }
                    }} 
                    className="appearance-none bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold uppercase outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 shadow-sm cursor-pointer hover:border-blue-500/40 hover:text-[var(--text-primary)] transition-all w-full md:min-w-[150px]"
                  >
                    {['Elite Basket', 'Quality Basket', 'Growth Basket'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <span className="text-caption text-[var(--text-tertiary)] uppercase tracking-[0.2em] pl-1.5">Model Matrix</span>
                <div className="relative group">
                  <select 
                    value={strategyId} 
                    onChange={(e) => {
                      const selected = STRATEGIES.find(s => s.id === e.target.value);
                      if (selected && !canAccess(selected.tier)) {
                        setRequiredTier(selected.tier as 'pro' | 'alpha');
                        setShowUpgradeModal(true);
                        return;
                      }
                      navigate(`?strategy=${e.target.value}`);
                    }} 
                    className="appearance-none bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold uppercase outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 shadow-sm cursor-pointer hover:border-blue-500/40 hover:text-[var(--text-primary)] transition-all w-full md:min-w-[180px]"
                  >
                    {lockedStrategies.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {!canAccess(s.tier) ? '🔒' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 col-span-2 md:col-span-1 w-full md:w-auto md:pb-0.5">
                <button 
                  onClick={handleMasterExport}
                  className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl text-caption hover:bg-[var(--bg-secondary)] transition-all shadow-md group border border-[var(--border-primary)]"
                >
                  <Download className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span>Export Audit</span>
                </button>
                
                <Link 
                  to="/alpha-hub"
                  className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-[var(--text-primary)] rounded-xl text-caption hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md group"
                >
                  <Zap className="h-4 w-4 text-yellow-300 group-hover:scale-110 transition-transform" />
                  <span>Alpha Hub</span>
                </Link>

                <button 
                  onClick={() => fetchData(true)} 
                  className={`p-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] shadow-sm hover:bg-[var(--bg-secondary)] transition-all shrink-0 ${isRefreshing ? 'animate-spin text-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
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
            color="blue" 
          />
          <DashboardStat 
            title="Valuation" 
            value={`₹${portfolioSummary.totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={TrendingUp} 
            color="emerald" 
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
             <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl h-96 flex flex-col items-center justify-center space-y-6 shadow-2xl p-8 backdrop-blur-sm">
               <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 max-w-md text-center">
                  <ShieldAlert className="h-10 w-10 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-lg font-black uppercase tracking-tighter mb-2 italic">Institutional Link Severed</h2>
                  <p className="text-caption leading-relaxed opacity-80">{error}</p>
               </div>
               <div className="flex items-center space-x-4">
                 <button 
                   onClick={() => { localStorage.removeItem('mb_api_override'); window.location.reload(); }} 
                   className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[var(--text-primary)] rounded-xl text-xs font-bold uppercase tracking-[0.3em] shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95"
                 >
                   Authorize Node Reset
                 </button>
                 <Link to="/connect" className="px-6 py-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-secondary)] rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:text-[var(--text-primary)] transition-all">Connectivity Hub</Link>
               </div>
             </div>
           ) : (
             <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl shadow-2xl flex flex-col overflow-hidden h-full relative group/table backdrop-blur-sm">
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
                {/* Refreshing Overlay */}
                {isRefreshing && data && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-md flex items-center justify-center z-10 rounded-3xl"
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-[var(--border-primary)] rounded-full" />
                        <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 border-4 border-transparent border-b-emerald-500 rounded-full animate-spin" style={{ animationDuration: '0.8s', transform: 'rotate(180deg)' }} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-[0.3em] animate-pulse">
                        Scanning Institutional Matrix
                      </p>
                    </div>
                  </motion.div>
                )}
                {/* Institutional Border Highlight */}
                <div className="absolute inset-0 border border-blue-600/0 group-hover/table:border-blue-600/20 rounded-3xl pointer-events-none transition-all duration-700" />
             </div>
           )}
         </motion.section>
       </AnimatePresence>

       <BrokerHub isOpen={showBrokerHub} onClose={() => setShowBrokerHub(false)} onImportComplete={handleImportHoldings} />

      {showAddManualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[var(--bg-primary)]/80 backdrop-blur-md animate-in fade-in duration-300">
           <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-[var(--bg-primary)] w-full max-w-md rounded-3xl shadow-2xl p-8 border border-[var(--border-primary)]"
           >
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4 mb-6">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase italic leading-none">Add Asset Node</h3>
                    <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-1.5">Manual Portfolio Entry</p>
                 </div>
                 <button onClick={() => setShowAddManualModal(false)} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-all"><X className="h-5 w-5" /></button>
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
                    <label className="text-caption text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-2 block">Stock Symbol</label>
                    <input type="text" required placeholder="e.g. TCS" value={manualSymbol} onChange={(e) => setManualSymbol(e.target.value.toUpperCase())} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-6 py-4 text-sm font-bold focus:border-blue-500 focus:bg-[var(--bg-primary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-caption text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-2 block">Quantity</label>
                       <input type="number" required placeholder="0" value={manualQty} onChange={(e) => setManualQty(e.target.value)} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-6 py-4 text-sm font-bold focus:border-blue-500 focus:bg-[var(--bg-primary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
                    </div>
                    <div>
                       <label className="text-caption text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-2 block">Buy Price</label>
                       <input type="number" step="0.05" required placeholder="0.00" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-6 py-4 text-sm font-bold focus:border-blue-500 focus:bg-[var(--bg-primary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
                    </div>
                 </div>
                  <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-[var(--text-primary)] rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all active:scale-95 hover:from-blue-500 hover:to-indigo-500">
                     Add to Portfolio
                  </button>
               </form>
            </motion.div>
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
