import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TradeTable from '../components/tables/TradeTable';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { 
  Download, 
  ChevronRight, 
  RefreshCw, 
  TrendingUp, 
  X, 
  ShieldAlert, 
  Zap, 
  Globe, 
  Trash2,
  TrendingDown,
  BarChart3,
  BookOpen,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import BrokerHub from '../components/modals/BrokerHub';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import DataFreshnessBadge from '../components/ui/DataFreshnessBadge';
import type { AllStockItem, AuditData, WatchlistItem, TradeRecord, StockPriceResult, IndexResult } from '../types';

const API_URL = getApiUrl();

interface DashboardPageProps {
  defaultTab?: 'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral';
}



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

  // Market indices
  const [indices, setIndices] = useState<IndexResult[]>([]);
  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const res = await fetch(`${API_URL}/api/market-indices`);
        const data = await safeJsonParse(res);
        if (res.ok && data.results) setIndices(data.results);
      } catch {}
    };
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000);
    return () => clearInterval(interval);
  }, []);



  // Determine route context so tabs never bleed between screener and portfolio
  const isPortfolioRoute = location.pathname === '/portfolio';
  const isMarketRoute = location.pathname === '/market';
  const isScreenerRoute = location.pathname === '/screener';

  const currentStrategy = STRATEGIES.find(s => s.id === strategyId) || STRATEGIES[0];

  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(() => localStorage.getItem('mb_screener_last_updated'));
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
  const fetchData = useCallback(async (_forceRefresh = false) => {
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
          const now = new Date().toISOString();
          setLastUpdated(now);
          localStorage.setItem('mb_screener_last_updated', now);
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

  // Tier info
  const tierColor = user?.tier === 'alpha' ? 'amber' : user?.tier === 'pro' ? 'blue' : 'emerald';
  const tierLabel = user?.tier === 'alpha' ? 'Alpha' : user?.tier === 'pro' ? 'Pro' : 'Free';

  // Quick action links
  const quickLinks = [
    { icon: Zap, label: 'Alpha Hub', path: '/alpha-hub', desc: 'Active institutional setups', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconCls: 'text-purple-400' },
    { icon: BarChart3, label: 'Charts Terminal', path: '/charts', desc: 'Advanced charting suite', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', iconCls: 'text-[#00d09c]' },
    { icon: Briefcase, label: 'Wealth Desk', path: '/portfolio', desc: 'Track holdings & P&L', bg: 'bg-amber-500/10', border: 'border-amber-500/20', iconCls: 'text-amber-400' },
    { icon: BookOpen, label: 'Trade Journal', path: '/trades', desc: 'Verify & log trades', bg: 'bg-blue-400/10', border: 'border-blue-400/20', iconCls: 'text-blue-400' },
    { icon: GraduationCap, label: 'Education', path: '/education', desc: 'Learn institutional methods', bg: 'bg-rose-500/10', border: 'border-rose-500/20', iconCls: 'text-rose-400' },
  ];

  const handleMasterExport = () => {
    if (!data?.allStocks?.length) return;
    const headers = ['Symbol', 'Observation', 'Strategy', 'Sector', 'Market Cap', 'Level A (Base)', 'CMP', 'ATH', 'Model Objective', 'ROI%', 'Gap%', 'Audit Score', 'Audit Remark'];
    const rows = data.allStocks.map((t: AllStockItem) => {
      const ath = stockATHs[t.symbol] || t.ath || 0;
      const entry = Number(t.entryPrice) || 0;
      const current = Number(t.currentPrice) || 0;
      const target = Number(t.target) || 0;
      
      const gap = entry > 0 ? (((current - entry)/entry) * 100).toFixed(2) : '0.00';
      const roi = current > 0 ? (((target - current)/current) * 100).toFixed(2) : '0.00';
      
      return [
        t.symbol,
        t.entryTime || '-',
        t.strategy || 'Institutional Matrix',
        t.sector,
        t.marketCap,
        entry.toFixed(2),
        current.toFixed(2),
        ath.toFixed(2),
        target.toFixed(2),
        roi,
        gap,
        t.score || '-',
        t.reason || '-'
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
      <div className="flex-1 flex flex-col py-6 md:py-8 px-6 md:px-10 space-y-6 bg-[var(--bg-primary)] animate-in fade-in duration-500">
        {/* Market ticker skeleton */}
        <div className="flex gap-4 overflow-hidden">
          {[1,2,3].map(i => <div key={i} className="h-10 w-48 bg-[var(--bg-tertiary)] rounded-xl animate-pulse shrink-0" />)}
        </div>
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
           {[1,2,3,4].map(i => <div key={i} className="h-32 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)] animate-pulse" />)}
        </div>
        <div className="h-96 bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-primary)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-4 md:py-6 px-4 md:px-8 lg:px-10 space-y-5 md:space-y-6 bg-[var(--bg-primary)] overflow-y-auto no-scrollbar terminal-scan">
      <SEO title={isPortfolioRoute ? 'Wealth Desk' : isMarketRoute ? 'Market Watch' : 'Matrix Screener'} description="Real-time stock screener with Institutional Audit Scores, ABCD entry levels, and multi-strategy analysis for Nifty 500." />
      
      {/* ── Market Ticker Strip ── */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 md:gap-5 overflow-x-auto no-scrollbar py-1.5 -mx-4 md:-mx-0 px-4 md:px-0"
      >
        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider shrink-0">INDICES</span>
        {indices.length > 0 ? indices.slice(0, 4).map(idx => (
          <div key={idx.name} className="flex items-center gap-2 shrink-0 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 py-1.5 min-w-[140px]">
            <span className="text-xs font-bold text-[var(--text-primary)]">{idx.name.replace(' ', '')}</span>
            <span className="text-xs font-bold font-mono text-[var(--text-primary)]">{idx.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${idx.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {idx.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
            </span>
          </div>
        )) : (
          <div className="flex gap-3">
            {[1,2,3].map(i => <div key={i} className="h-8 w-36 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />)}
          </div>
        )}
        <div className="flex-1" />
        <span className="text-[9px] text-[var(--text-muted)] font-medium shrink-0 opacity-50">
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${true ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {true ? 'Market Open' : 'Closed'} · NSE
        </span>
      </motion.div>

      {/* ── Breadcrumbs ── */}
      <Breadcrumbs items={[
        { label: isPortfolioRoute ? 'Wealth Desk' : isMarketRoute ? 'Market Watch' : 'Matrix Screener', href: '#' }
      ]} />

      {/* ── Enhanced Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[var(--border-primary)] pb-6 gap-6">
        <div className="space-y-3">
          {/* Top row: User greeting + tier badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-[#00d09c]/20 to-emerald-500/10 rounded-xl flex items-center justify-center shadow-sm border border-[#00d09c]/30">
                <Zap className="h-4 w-4 text-[#00d09c]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] leading-none text-[#00d09c]">MarketBeacon</span>
                <span className="text-[9px] text-[var(--text-muted)] tracking-wider mt-0.5">Institutional Terminal</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              tierColor === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
              tierColor === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-600' :
              'bg-emerald-50 border-emerald-200 text-[#00d09c]'
            }`}>{tierLabel} Tier</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {indices.filter(idx => idx.price).map((idx) => (
                <span key={idx.name} className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] px-2 py-0.5 rounded-full">
                  <span className={`w-1.5 h-1.5 rounded-full ${idx.change >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {idx.name.replace('NIFTY 50', 'NIFTY').replace('BANK NIFTY', 'BANKNIFTY')} {idx.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  <span className={idx.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                    {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
          
          {/* Title row */}
          <div className="space-y-0.5">
            <h1 className="text-2xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none">
              {isPortfolioRoute ? 'Wealth Desk' : isMarketRoute ? 'Market Watch' : 'Matrix Screener'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em]">
                {isPortfolioRoute ? 'Custom Portfolio Asset Ledger' : currentStrategy.name}
              </p>
              <DataFreshnessBadge lastUpdated={lastUpdated} dataType="Screener Scan" size="sm" className="ml-2" />
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 w-full lg:w-auto">
          {isPortfolioRoute && (
            <div className="grid grid-cols-4 sm:flex sm:items-center gap-2 w-full md:w-auto">
              <button 
                onClick={handleClearPortfolio} 
                className="px-3 sm:px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-rose-500/20 transition-all active:scale-95 min-h-[44px]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Remove Old Details</span>
                <span className="sm:hidden">Reset</span>
              </button>
              <button 
                onClick={() => setShowAddManualModal(true)} 
                className="px-3 sm:px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-[var(--bg-secondary)] transition-all active:scale-95 min-h-[44px]"
              >
                <span className="text-sm leading-none">+</span>
                <span className="hidden sm:inline text-[11px]">Add</span>
              </button>
              <button 
                onClick={() => setShowBrokerHub(true)} 
                className="px-3 sm:px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 hover:bg-[var(--bg-primary)] transition-all active:scale-95 border border-white/5 min-h-[44px]"
              >
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <button 
                onClick={() => fetchData(true)} 
                className={`p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] transition-all shrink-0 flex items-center justify-center min-h-[44px] ${isRefreshing ? 'animate-spin text-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {!isPortfolioRoute && (
            <div data-tour="screener-filters" className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full">
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] pl-1.5">Universe</span>
                <div className="relative">
                  <select 
                    value={activeBasket} 
                    onChange={(e) => {
                      const newBasket = e.target.value;
                      setActiveBasket(newBasket);
                      const supportsNewBasket = STRATEGIES.find(s => s.id === strategyId)?.baskets.includes(newBasket);
                      if (!supportsNewBasket) {
                        const firstAvailable = STRATEGIES.find(s => s.isLocked && s.baskets.includes(newBasket));
                        if (firstAvailable) navigate(`?strategy=${firstAvailable.id}`);
                      }
                    }} 
                    className="appearance-none bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-xl pl-3.5 pr-9 py-2.5 text-[11px] font-bold uppercase outline-none focus-visible:ring-2 focus-visible:ring-[#00d09c]/50 focus-visible:border-[#00d09c]/50 shadow-sm cursor-pointer hover:border-[#00d09c]/40 hover:text-[var(--text-primary)] transition-all w-full sm:min-w-[160px]"
                  >
                    {['Elite Basket', 'Quality Basket', 'Growth Basket'].map(b => {
                      const count = (BASKETS[b] || []).length;
                      return <option key={b} value={b}>{b} · {count} stocks</option>;
                    })}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                    <ChevronRight className="w-3 h-3 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] pl-1.5">Strategy</span>
                <div className="relative">
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
                    className="appearance-none bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-xl pl-3.5 pr-9 py-2.5 text-[11px] font-bold uppercase outline-none focus-visible:ring-2 focus-visible:ring-[#00d09c]/50 focus-visible:border-[#00d09c]/50 shadow-sm cursor-pointer hover:border-[#00d09c]/40 hover:text-[var(--text-primary)] transition-all w-full sm:min-w-[190px]"
                  >
                    {lockedStrategies.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {!canAccess(s.tier) ? '🔒' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]">
                    <ChevronRight className="w-3 h-3 rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:pb-0.5">
                <button 
                  onClick={handleMasterExport}
                  className="px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl text-[11px] font-bold hover:bg-[var(--bg-secondary)] transition-all shadow-sm group border border-[var(--border-primary)] flex items-center gap-2 min-h-[44px]"
                >
                  <Download className="h-3.5 w-3.5 text-[#00d09c] group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                
                <Link 
                  to="/alpha-hub"
                  className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-[11px] font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md flex items-center gap-2 min-h-[44px]"
                >
                  <Zap className="h-3.5 w-3.5 text-yellow-300" />
                  <span>Alpha Hub</span>
                </Link>

                <button 
                  onClick={() => fetchData(true)} 
                  className={`p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] transition-all shrink-0 flex items-center justify-center min-h-[44px] ${isRefreshing ? 'animate-spin text-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Cards — Clean & Impactful ── */}
      {isPortfolioRoute ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-1.5 hover:border-[var(--border-secondary)] transition-all">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Total Invested</span>
            <span className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tabular-nums font-mono">₹{portfolioSummary.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="text-[10px] text-[var(--text-muted)]">Capital deployed · {portfolioCount} holdings</span>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-1.5 hover:border-[var(--border-secondary)] transition-all">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Current Value</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tabular-nums font-mono">₹{portfolioSummary.totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              <span className={`text-[10px] font-bold ${portfolioSummary.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {portfolioSummary.totalPnL >= 0 ? '+' : ''}{portfolioSummary.totalInvested > 0 ? ((portfolioSummary.totalPnL / portfolioSummary.totalInvested) * 100).toFixed(1) : '0'}%
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">Market valuation</span>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-1.5 hover:border-[var(--border-secondary)] transition-all">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Total P&amp;L</span>
            <span className={`text-xl md:text-2xl font-bold tabular-nums font-mono ${portfolioSummary.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {portfolioSummary.totalPnL >= 0 ? '+' : '-'}₹{Math.abs(portfolioSummary.totalPnL).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className={`text-[10px] ${portfolioSummary.totalPnL >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
              Realized: {portfolioSummary.realizedGain >= 0 ? '+' : '-'}₹{Math.abs(portfolioSummary.realizedGain).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-1.5 hover:border-[var(--border-secondary)] transition-all">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Cap Architecture</span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tabular-nums font-mono">{portfolioSummary.capBreakdown.large.toFixed(0)}%</span>
                <div className="flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${portfolioSummary.capBreakdown.large}%` }} />
                </div>
              </div>
              <div className="flex gap-2 text-[9px] font-semibold text-[var(--text-muted)]">
                <span className="text-blue-400">L {portfolioSummary.capBreakdown.large.toFixed(0)}%</span>
                <span className="text-amber-400">M {portfolioSummary.capBreakdown.mid.toFixed(0)}%</span>
                <span className="text-emerald-400">S {portfolioSummary.capBreakdown.small.toFixed(0)}%</span>
              </div>
            </div>
            <span className="text-[10px] text-[var(--text-muted)]">Large/Mid/Small split</span>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-1.5 hover:border-[var(--border-secondary)] transition-all">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Audit Pass Rate</span>
            <span className="text-xl md:text-2xl font-bold text-emerald-500 tabular-nums font-mono">
              {data ? `${((data.allStocks.filter((s: AllStockItem) => s.isPass).length / Math.max(data.allStocks.length, 1)) * 100).toFixed(1)}%` : '—'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Institutional filter pass</span>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-1.5 hover:border-[var(--border-secondary)] transition-all">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Avg Audit Score</span>
            <span className="text-xl md:text-2xl font-bold text-blue-500 tabular-nums font-mono">
              {data ? `${(data.allStocks.reduce((a: number, s: AllStockItem) => a + (s.score || 0), 0) / Math.max(data.allStocks.length, 1)).toFixed(0)}` : '—'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Mean institutional score</span>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-1.5 hover:border-[var(--border-secondary)] transition-all">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Rejection Rate</span>
            <span className="text-xl md:text-2xl font-bold text-amber-500 tabular-nums font-mono">{data ? `${((rejectedCount / Math.max(data.allStocks?.length || 1, 1)) * 100).toFixed(0)}%` : '70%+'}</span>
            <span className="text-[10px] text-[var(--text-muted)]">Quality filter</span>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-1.5 hover:border-[var(--border-secondary)] transition-all">
            <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{isScreenerRoute ? 'Active Setups' : 'In Universe'}</span>
            <span className="text-xl md:text-2xl font-bold text-purple-500 tabular-nums font-mono">{isScreenerRoute ? openCount : watchlistCount}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{isScreenerRoute ? 'Active signals today' : 'Qualified stocks'}</span>
          </div>
        </motion.div>
      )}

      {/* ── Quick Action Cards ── */}
      {!isPortfolioRoute && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {quickLinks.map((link, i) => (
              <Link
                key={i}
                to={link.path}
                className="flex items-center gap-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl px-3 py-2.5 hover:border-[#00d09c]/30 hover:bg-[var(--bg-secondary)] transition-all group min-h-[44px]"
              >
                <div className={`w-7 h-7 rounded-lg ${link.bg} border ${link.border} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                  <link.icon className={`w-3.5 h-3.5 ${link.iconCls}`} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-[#00d09c] transition-colors truncate">{link.label}</span>
                  <span className="text-[8px] text-[var(--text-muted)] font-medium truncate">{link.desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Top Holdings Preview (Portfolio only) ── */}
      {isPortfolioRoute && portfolioCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Top Holdings</span>
              <span className="text-[9px] text-[var(--text-muted)]">{portfolioCount} total positions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {(() => {
                const combinedMap: Record<string, { quantity: number; buy_price: number }> = {};
                (userWatchlist || []).forEach(w => { combinedMap[w.symbol] = { quantity: w.quantity || 0, buy_price: w.buy_price || 0 }; });
                (trades || []).filter(t => t.status === 'OPEN').forEach(t => {
                  if (combinedMap[t.symbol]) {
                    const ex = combinedMap[t.symbol];
                    const nQty = ex.quantity + (t.quantity || 0);
                    if (nQty > 0) { ex.buy_price = ((ex.buy_price * ex.quantity) + (t.entry_price * t.quantity)) / nQty; ex.quantity = nQty; }
                  } else { combinedMap[t.symbol] = { quantity: t.quantity || 0, buy_price: t.entry_price || 0 }; }
                });
                return Object.entries(combinedMap)
                  .filter(([_, h]) => h.quantity > 0)
                  .sort(([, a], [, b]) => (b.quantity * b.buy_price) - (a.quantity * a.buy_price))
                  .slice(0, 4)
                  .map(([symbol, h]) => {
                    const curr = stockPrices[symbol] || h.buy_price;
                    const invested = h.quantity * h.buy_price;
                    const currentVal = h.quantity * curr;
                    const pnl = currentVal - invested;
                    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                    return { symbol, invested, currentVal, pnl, pnlPct, qty: h.quantity };
                  });
              })().map((item) => (
                <div key={item.symbol} className="flex items-center gap-3 bg-[var(--bg-secondary)]/40 rounded-lg px-3 py-2.5 border border-[var(--border-primary)]">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)]/20 to-emerald-500/10 flex items-center justify-center text-[10px] font-black text-[var(--text-muted)]">
                    {item.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">{item.symbol}</span>
                      <span className={`text-[9px] font-bold ${item.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.pnl >= 0 ? '+' : ''}{item.pnlPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-[var(--text-muted)] font-mono">₹{item.invested.toLocaleString()}</span>
                      <span className="text-[9px] text-[var(--text-tertiary)]">{item.qty} shares</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Main Table Section ── */}
      <AnimatePresence mode="wait">
         <motion.section 
           data-tour="portfolio-table"
           key={activeTab + activeBasket}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           className="flex-1 min-h-0"
         >
           {error ? (
             <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl h-96 flex flex-col items-center justify-center space-y-6 shadow-xl p-8 backdrop-blur-sm">
               <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 max-w-md text-center">
                  <ShieldAlert className="h-10 w-10 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-lg font-black uppercase tracking-tighter mb-2 italic">Connection Error</h2>
                  <p className="text-xs leading-relaxed opacity-80">{error}</p>
               </div>
               <div className="flex items-center space-x-4">
                 <button 
                   onClick={() => { localStorage.removeItem('mb_api_override'); window.location.reload(); }} 
                   className="px-6 py-3 bg-gradient-to-r from-[#00d09c] to-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-md hover:from-[#00bda0] hover:to-emerald-700 transition-all active:scale-95"
                 >
                   Reset & Retry
                 </button>
                 <Link to="/connect" className="px-5 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-secondary)] rounded-xl text-xs font-bold hover:text-[var(--text-primary)] transition-all">Connectivity Hub</Link>
               </div>
             </div>
           ) : (
             <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl shadow-lg flex flex-col relative" style={{ minHeight: 0 }}>
                <div className="flex-1 overflow-auto custom-scrollbar rounded-2xl">
                   <TradeTable 
                     trades={getTradesForTab()} 
                     livePrices={stockPrices} 
                     athData={stockATHs}
                     capData={stockCaps}
                     userWatchlist={(userWatchlist || []).map(w => w.symbol)}
                     onToggleWatchlist={handleToggleWatchlist}
                     onUpdateHolding={handleUpdateHolding}
                     activeTab={activeTab}
                     setActiveTab={(tab) => handleSetActiveTab(tab as any)}
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
                    className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative w-12 h-12">
                        <div className="absolute inset-0 border-3 border-[var(--border-primary)] rounded-full" />
                        <div className="absolute inset-0 border-3 border-transparent border-t-[#00d09c] rounded-full animate-spin" />
                      </div>
                      <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.3em] animate-pulse">
                        Scanning Matrix...
                      </p>
                    </div>
                  </motion.div>
                )}
             </div>
           )}
         </motion.section>
       </AnimatePresence>

       <BrokerHub isOpen={showBrokerHub} onClose={() => setShowBrokerHub(false)} onImportComplete={handleImportHoldings} />

      {showAddManualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[var(--bg-primary)]/80 backdrop-blur-md animate-in fade-in duration-300">
           <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-[var(--bg-primary)] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[var(--border-primary)]"
           >
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4 mb-5">
                 <div className="space-y-1">
                    <h3 className="text-lg font-black text-[var(--text-primary)] uppercase leading-none">Add Asset</h3>
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-1">Manual Portfolio Entry</p>
                 </div>
                 <button onClick={() => setShowAddManualModal(false)} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-all"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={async (e) => {
                 e.preventDefault();
                 if (!manualSymbol) return;
                 await handleAddManualHolding(manualSymbol, parseInt(manualQty) || 0, parseFloat(manualPrice) || 0);
                 setShowAddManualModal(false);
                 setManualSymbol(''); setManualQty(''); setManualPrice('');
              }} className="space-y-5">
                 <div>
                    <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-1.5 block">Stock Symbol</label>
                    <input type="text" required placeholder="e.g. TCS" value={manualSymbol} onChange={(e) => setManualSymbol(e.target.value.toUpperCase())} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#00d09c] focus:bg-[var(--bg-primary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#00d09c]/30 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-1.5 block">Quantity</label>
                       <input type="number" required placeholder="0" value={manualQty} onChange={(e) => setManualQty(e.target.value)} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#00d09c] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#00d09c]/30 text-[var(--text-primary)]" />
                    </div>
                    <div>
                       <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-1.5 block">Buy Price</label>
                       <input type="number" step="0.05" required placeholder="0.00" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#00d09c] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#00d09c]/30 text-[var(--text-primary)]" />
                    </div>
                 </div>
                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#00d09c] to-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-[0.15em] shadow-lg shadow-[#00d09c]/20 transition-all active:scale-95 hover:from-[#00bda0] hover:to-emerald-700">
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
