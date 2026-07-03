import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Zap, Briefcase, BookOpen, TrendingUp, LineChart,
  Search, ArrowRight, Activity, BarChart3, Shield, Star,
  Clock, Target, Wallet, AlertTriangle, TrendingDown,
  RefreshCw, PieChart, Sparkles, ChevronRight, Bell,
  CheckCircle2, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, safeJsonParse } from '../lib/api-utils';
import SEO from '../components/SEO';
import { BASKETS } from '../data/stocks';
import type { IndexResult, WatchlistItem, TradeRecord, StockPriceResult, AllStockItem, Notification } from '../types';

const API_URL = getApiUrl();

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
  subtitle?: string;
  change?: { value: string; positive: boolean } | null;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle, change }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between min-h-[100px] transition-all hover:border-[var(--border-secondary)] hover:shadow-lg"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg border ${colors[color]} backdrop-blur-sm`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{value}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {change && (
            <span className={`text-[10px] font-black flex items-center gap-0.5 ${
              change.positive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {change.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {change.value}
            </span>
          )}
          {subtitle && <span className="text-[9px] text-[var(--text-muted)] font-medium">{subtitle}</span>}
        </div>
      </div>
    </motion.div>
  );
};

interface QuickLink {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  path: string;
  desc: string;
  bg: string;
  border: string;
  iconCls: string;
}

const quickLinks: QuickLink[] = [
  { icon: Search, label: 'Audit a Stock', path: '/screener', desc: 'Search & score any NSE/BSE stock', bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconCls: 'text-blue-400' },
  { icon: TrendingUp, label: 'Alpha Signals', path: '/alpha-hub', desc: 'Active institutional setups', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', iconCls: 'text-emerald-400' },
  { icon: Briefcase, label: 'Portfolio', path: '/portfolio', desc: 'Track holdings & P&L', bg: 'bg-amber-500/10', border: 'border-amber-500/20', iconCls: 'text-amber-400' },
  { icon: BookOpen, label: 'Trade Journal', path: '/trades', desc: 'Verify & log trades', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconCls: 'text-purple-400' },
  { icon: LayoutGrid, label: 'Screener Matrix', path: '/screener', desc: 'Real-time stock matrix', bg: 'bg-rose-500/10', border: 'border-rose-500/20', iconCls: 'text-rose-400' },
  { icon: BarChart3, label: 'Charts Terminal', path: '/charts', desc: 'Advanced charting suite', bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconCls: 'text-blue-400' },
];

interface BuyZoneCard {
  symbol: string;
  entryPrice: number;
  target: number;
  currentPrice: number;
  score: number;
  strategy: string;
}

const AppHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Market indices
  const [indices, setIndices] = useState<IndexResult[]>([]);

  // Portfolio data
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [stockCaps, setStockCaps] = useState<Record<string, number>>({});
  const [stockChange, setStockChange] = useState<Record<string, number>>({});

  // Buy zones
  const [buyZones, setBuyZones] = useState<BuyZoneCard[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Day P&L tracking
  const [dayPnL, setDayPnL] = useState<number>(0);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifIndex, setNotifIndex] = useState(0);

  const tierColor = user?.tier === 'alpha' ? 'amber' : user?.tier === 'pro' ? 'blue' : 'emerald';
  const tierLabel = user?.tier === 'alpha' ? 'Alpha' : user?.tier === 'pro' ? 'Pro' : 'Free';

  // Fetch market indices
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

  // Fetch portfolio/watchlist data
  useEffect(() => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;

    const fetchAll = async () => {
      try {
        const auth = { headers: { 'Authorization': `Bearer ${token}` } };
        const [wRes, tRes] = await Promise.all([
          fetch(`${API_URL}/api/watchlist`, auth),
          fetch(`${API_URL}/api/trades`, auth),
        ]);
        if (wRes.ok) {
          const wd = await safeJsonParse(wRes);
          if (!wd.error) setWatchlist(wd || []);
        }
        if (tRes.ok) {
          const td = await safeJsonParse(tRes);
          if (!td.error) setTrades(td || []);
        }
      } catch {}
    };
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch prices for portfolio symbols
  useEffect(() => {
    const symbols = [
      ...watchlist.map(w => w.symbol),
      ...trades.filter(t => t.status === 'OPEN').map(t => t.symbol),
      'TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ITC',
    ];
    if (symbols.length === 0) return;
    const unique = [...new Set(symbols)];
    fetch(`${API_URL}/api/stock-prices?symbols=${unique.join(',')}`)
      .then(r => r.json())
      .then((data: StockPriceResult[]) => {
        if (!Array.isArray(data)) return;
        const pMap: Record<string, number> = {};
        const cMap: Record<string, number> = {};
        const chMap: Record<string, number> = {};
        data.forEach(s => {
          if (s.price) pMap[s.symbol] = s.price;
          if (s.marketCap) cMap[s.symbol] = s.marketCap;
          if (s.ath) chMap[s.symbol] = s.ath;
        });
        setStockPrices(pMap);
        setStockCaps(cMap);
      })
      .catch(() => {});
  }, [watchlist, trades]);

  // Fetch active buy zones
  useEffect(() => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    setLoadingZones(true);
    Promise.all([
      fetch(`${API_URL}/api/backtest/audit?basket=ALL`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()),
    ])
      .then(([data]) => {
        const results = data.allStocks || [];
        const buyZoneStocks = results
          .filter((s: AllStockItem) => s.isBuyZone && s.entryPrice && s.target)
          .sort((a: AllStockItem, b: AllStockItem) => (b.score || 0) - (a.score || 0))
          .map((s: AllStockItem) => ({
            symbol: s.symbol,
            entryPrice: s.entryPrice || 0,
            target: s.target || 0,
            currentPrice: stockPrices[s.symbol] || s.currentPrice || 0,
            score: s.score || 0,
            strategy: s.strategy || 'Institutional',
          }));
        setBuyZones(buyZoneStocks);
      })
      .catch(() => {})
      .finally(() => setLoadingZones(false));
  }, [stockPrices]);

  // Symbol search
  const ALL_SYMBOLS = useMemo(() => {
    const s = new Set<string>();
    Object.values(BASKETS).forEach(list => list.forEach(sym => s.add(sym)));
    return Array.from(s);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toUpperCase();
    const filtered = ALL_SYMBOLS.filter(s => s.includes(q)).slice(0, 6);
    setSearchResults(filtered);
  }, [searchQuery, ALL_SYMBOLS]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate portfolio summary (open + closed) + cap allocation
  const portfolioSummary = useMemo(() => {
    let totalInv = 0, totalCur = 0, realizedPnL = 0;
    const capInv = { large: 0, mid: 0, small: 0 };
    const capCur = { large: 0, mid: 0, small: 0 };
    const combinedMap: Record<string, { quantity: number; buy_price: number }> = {};
    watchlist.forEach(w => { combinedMap[w.symbol] = { quantity: w.quantity || 0, buy_price: w.buy_price || 0 }; });
    trades.filter(t => t.status === 'OPEN').forEach(t => {
      if (combinedMap[t.symbol]) {
        const ex = combinedMap[t.symbol];
        const nQty = ex.quantity + (t.quantity || 0);
        if (nQty > 0) { ex.buy_price = ((ex.buy_price * ex.quantity) + (t.entry_price * t.quantity)) / nQty; ex.quantity = nQty; }
      } else {
        combinedMap[t.symbol] = { quantity: t.quantity || 0, buy_price: t.entry_price || 0 };
      }
    });
    Object.entries(combinedMap).forEach(([symbol, h]) => {
      const inv = h.quantity * h.buy_price;
      if (inv > 0) {
        totalInv += inv;
        const cur = h.quantity * (stockPrices[symbol] || h.buy_price);
        totalCur += cur;
        const capCr = (stockCaps[symbol] || 0) / 10000000;
        if (capCr >= 20000) { capInv.large += inv; capCur.large += cur; }
        else if (capCr >= 5000) { capInv.mid += inv; capCur.mid += cur; }
        else { capInv.small += inv; capCur.small += cur; }
      }
    });
    const unrealizedPnL = totalCur - totalInv;
    trades.filter(t => t.status === 'CLOSED' && t.exit_price).forEach(t => {
      realizedPnL += (t.exit_price! - t.entry_price) * t.quantity;
    });
    const totalPnL = unrealizedPnL + realizedPnL;
    const pnlPct = totalInv > 0 ? (totalPnL / totalInv) * 100 : (realizedPnL !== 0 ? 100 : 0);
    const capBreakdown = {
      large: totalInv > 0 ? (capInv.large / totalInv) * 100 : 0,
      mid: totalInv > 0 ? (capInv.mid / totalInv) * 100 : 0,
      small: totalInv > 0 ? (capInv.small / totalInv) * 100 : 0,
    };
    const curCapBreakdown = {
      large: totalCur > 0 ? (capCur.large / totalCur) * 100 : 0,
      mid: totalCur > 0 ? (capCur.mid / totalCur) * 100 : 0,
      small: totalCur > 0 ? (capCur.small / totalCur) * 100 : 0,
    };
    return { totalInvested: totalInv, totalCurrent: totalCur, unrealizedPnL, realizedPnL, totalPnL, pnlPct, capBreakdown, curCapBreakdown };
  }, [watchlist, trades, stockPrices, stockCaps]);

  const portfolioCount = useMemo(() => {
    const combinedMap: Record<string, number> = {};
    watchlist.forEach(w => { combinedMap[w.symbol] = (combinedMap[w.symbol] || 0) + (w.quantity || 0); });
    trades.filter(t => t.status === 'OPEN').forEach(t => {
      combinedMap[t.symbol] = (combinedMap[t.symbol] || 0) + (t.quantity || 0);
    });
    return Object.keys(combinedMap).filter(s => combinedMap[s] > 0).length;
  }, [watchlist, trades]);

  // Day P&L from localStorage snapshot
  useEffect(() => {
    const curValue = portfolioSummary.totalCurrent;
    if (curValue <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem('apphome_snapshot');
      if (raw) {
        const snap = JSON.parse(raw);
        if (snap.date !== today) {
          setDayPnL(curValue - snap.value);
          localStorage.setItem('apphome_snapshot', JSON.stringify({ date: today, value: curValue }));
        }
      } else {
        localStorage.setItem('apphome_snapshot', JSON.stringify({ date: today, value: curValue }));
      }
    } catch {}
  }, [portfolioSummary.totalCurrent]);

  // Fetch real notifications
  useEffect(() => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await safeJsonParse(res);
        if (Array.isArray(data)) setNotifications(data);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  // Rotate notification ticker
  useEffect(() => {
    if (notifications.length < 2) return;
    const t = setInterval(() => {
      setNotifIndex(prev => (prev + 1) % notifications.length);
    }, 4000);
    return () => clearInterval(t);
  }, [notifications]);

  // Closed trades for recent activity
  const closedTrades = useMemo(() => {
    return trades.filter(t => t.status === 'CLOSED').sort((a, b) => {
      const da = a.exit_date || a.entry_date;
      const db = b.exit_date || b.entry_date;
      return db.localeCompare(da);
    });
  }, [trades]);

  // Format large numbers
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <SEO title="Dashboard | MarketBeacon Pro" description="Your institutional audit command center" />

      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── Market Indices + Alerts Ticker ── */}
        <div className="border border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)]/50 overflow-hidden">
          <div className="flex divide-x divide-[var(--border-primary)] overflow-x-auto py-2.5 px-4 whitespace-nowrap scrollbar-none text-[11px] font-black uppercase tracking-wider items-center">
            {indices.map((idx, i) => (
              <div key={i} className="flex items-center gap-2.5 px-5">
                <span className="text-[var(--text-secondary)]">{idx.name}</span>
                <span className="font-bold text-[var(--text-primary)]">{idx.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                <span className={`flex items-center gap-0.5 text-[10px] font-black ${idx.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {idx.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                </span>
              </div>
            ))}
            {indices.length === 0 && (
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] px-5">
                <RefreshCw className="w-3 h-3 animate-spin" /> Loading market data...
              </div>
            )}
            {notifications.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 px-5 shrink-0">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden relative h-4 px-5">
                  <motion.div
                    key={notifIndex}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center"
                  >
                    <span className="text-[10px] font-bold text-[var(--text-primary)] truncate">
                      {notifications[notifIndex]?.title && (
                        <span className="text-amber-400 mr-1.5">{notifications[notifIndex].title}:</span>
                      )}
                      {notifications[notifIndex]?.message || ''}
                    </span>
                  </motion.div>
                </div>
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0 mr-3">
                    {notifications.filter(n => n.unread).length} new
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">
              Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-1 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                tierColor === 'amber' ? 'bg-amber-400' : tierColor === 'blue' ? 'bg-blue-400' : 'bg-emerald-400'
              }`} />
              {tierLabel} Tier · {indices[0] ? `NIFTY ${indices[0].price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'Market Open'}
            </p>
          </div>
          <Link
            to="/screener"
            className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
          >
            <Search className="w-3 h-3" /> New Audit
          </Link>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Portfolio Value"
            value={portfolioSummary.totalInvested > 0 ? fmt(portfolioSummary.totalCurrent) : '₹0'}
            icon={Wallet}
            color="emerald"
            change={portfolioSummary.totalInvested > 0 ? {
              value: `${portfolioSummary.pnlPct >= 0 ? '+' : ''}${portfolioSummary.pnlPct.toFixed(2)}%`,
              positive: portfolioSummary.pnlPct >= 0,
            } : null}
            subtitle={portfolioCount > 0 ? `${portfolioCount} holdings` : undefined}
          />
          <StatCard
            title="Total P&L"
            value={portfolioSummary.totalInvested > 0 || portfolioSummary.realizedPnL !== 0 ? `${portfolioSummary.totalPnL >= 0 ? '+' : '-'}${fmt(Math.abs(portfolioSummary.totalPnL))}` : '--'}
            icon={Activity}
            color={portfolioSummary.totalPnL >= 0 ? 'emerald' : 'rose'}
            change={dayPnL !== 0 ? {
              value: `${dayPnL >= 0 ? '+' : '-'}${fmt(Math.abs(dayPnL))} today`,
              positive: dayPnL >= 0,
            } : null}
            subtitle={portfolioSummary.realizedPnL !== 0 ? `Realized ${portfolioSummary.realizedPnL >= 0 ? '+' : '-'}${fmt(Math.abs(portfolioSummary.realizedPnL))}` : undefined}
          />
          <StatCard
            title="Active Signals"
            value={buyZones.length}
            icon={Zap}
            color="blue"
            subtitle="Buy zone stocks"
          />
          <StatCard
            title="Watchlist"
            value={watchlist.length}
            icon={Star}
            color="amber"
            subtitle={`${ALL_SYMBOLS.length} in universe`}
          />
        </div>

        {/* ── Two Column: Buy Zones + Portfolio ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Active Buy Zone Cards ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Active Buy Zones
              </h2>
              <Link to="/alpha-hub" className="text-[8px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            {loadingZones ? (
              <div className="grid grid-cols-2 gap-2.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl p-4 animate-pulse">
                    <div className="h-4 w-16 bg-[var(--bg-tertiary)] rounded mb-3" />
                    <div className="h-6 w-24 bg-[var(--bg-tertiary)] rounded mb-2" />
                    <div className="h-3 w-32 bg-[var(--bg-tertiary)] rounded" />
                  </div>
                ))}
              </div>
            ) : buyZones.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {buyZones.map((zone, i) => (
                  <motion.button
                    key={zone.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -1 }}
                    onClick={() => navigate(`/analysis/${zone.symbol}`)}
                    className="bg-[var(--bg-secondary)]/50 border border-emerald-500/20 rounded-xl p-4 text-left hover:border-emerald-500/40 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">{zone.symbol}</span>
                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">BUY</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-[var(--text-muted)]">Entry</span>
                        <span className="font-bold text-[var(--text-secondary)]">₹{zone.entryPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-[var(--text-muted)]">Target</span>
                        <span className="font-bold text-blue-400">₹{zone.target.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-[9px]">
                        <span className="text-[var(--text-muted)]">Gain</span>
                        <span className="font-bold text-emerald-400">
                          +{(((zone.target - zone.entryPrice) / zone.entryPrice) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[var(--border-primary)]/40 flex items-center gap-1 text-[7px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> {zone.strategy}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl p-6 text-center">
                <Info className="w-5 h-5 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-[11px] font-bold text-[var(--text-muted)]">No active buy zones right now</p>
                <p className="text-[8px] text-[var(--text-muted)] mt-1">Check back after the next market scan</p>
              </div>
            )}
          </div>

          {/* ── Portfolio Allocation + Recent Activity ── */}
          <div className="space-y-4">
            {/* Allocation */}
            <div>
              <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-blue-400" /> Portfolio
              </h2>
              <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Invested</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">{portfolioSummary.totalInvested > 0 ? fmt(portfolioSummary.totalInvested) : '₹0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Current</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">{portfolioSummary.totalInvested > 0 ? fmt(portfolioSummary.totalCurrent) : '--'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)]/40">
                  <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">P&L</span>
                  <span className={`text-sm font-black flex items-center gap-1 ${
                    portfolioSummary.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {portfolioSummary.totalPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {portfolioSummary.totalInvested > 0 || portfolioSummary.realizedPnL !== 0
                      ? `${portfolioSummary.totalPnL >= 0 ? '+' : '-'}${fmt(Math.abs(portfolioSummary.totalPnL))}`
                      : '--'}
                  </span>
                </div>
                <div className="text-[8px] text-[var(--text-muted)] font-medium space-y-0.5 pt-1">
                  <span className="flex justify-between">
                    <span>Unrealized</span>
                    <span className={portfolioSummary.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {portfolioSummary.totalInvested > 0 ? `${portfolioSummary.unrealizedPnL >= 0 ? '+' : '-'}${fmt(Math.abs(portfolioSummary.unrealizedPnL))}` : '--'}
                    </span>
                  </span>
                  <span className="flex justify-between">
                    <span>Realized</span>
                    <span className={portfolioSummary.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {portfolioSummary.realizedPnL !== 0 ? `${portfolioSummary.realizedPnL >= 0 ? '+' : '-'}${fmt(Math.abs(portfolioSummary.realizedPnL))}` : '--'}
                    </span>
                  </span>
                </div>
                {portfolioSummary.totalInvested > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wider mb-1.5">
                      <span>Allocation</span>
                      <span>{portfolioCount} holdings</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden flex">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${Math.max(portfolioSummary.curCapBreakdown.large, portfolioSummary.curCapBreakdown.large > 0 ? 4 : 0)}%` }}
                        title={`Large Cap ${portfolioSummary.curCapBreakdown.large.toFixed(0)}%`}
                      />
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${Math.max(portfolioSummary.curCapBreakdown.mid, portfolioSummary.curCapBreakdown.mid > 0 ? 4 : 0)}%` }}
                        title={`Mid Cap ${portfolioSummary.curCapBreakdown.mid.toFixed(0)}%`}
                      />
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.max(portfolioSummary.curCapBreakdown.small, portfolioSummary.curCapBreakdown.small > 0 ? 4 : 0)}%` }}
                        title={`Small/Micro Cap ${portfolioSummary.curCapBreakdown.small.toFixed(0)}%`}
                      />
                    </div>
                    <div className="flex justify-between text-[7px] text-[var(--text-muted)] font-medium mt-1">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Large {portfolioSummary.curCapBreakdown.large.toFixed(0)}%</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Mid {portfolioSummary.curCapBreakdown.mid.toFixed(0)}%</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Small {portfolioSummary.curCapBreakdown.small.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                <Link
                  to="/portfolio"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-600/20 transition-all"
                >
                  View Wealth Desk <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-3">Recent Activity</h2>
              <div className="space-y-2">
                {(() => {
                  const openItems = watchlist.slice(0, 2).map((item) => {
                    const pnl = item.quantity && stockPrices[item.symbol]
                      ? (stockPrices[item.symbol] - (item.buy_price || 0)) * item.quantity
                      : 0;
                    const pct = item.buy_price ? (pnl / (item.quantity * item.buy_price)) * 100 : 0;
                    return { type: 'open' as const, symbol: item.symbol, qty: item.quantity || 0, entry: item.buy_price || 0, pnl, pct, label: 'In Portfolio' as const };
                  });
                  const closedItems = closedTrades.slice(0, 2).map((t) => {
                    const pnl = t.exit_price ? (t.exit_price - t.entry_price) * t.quantity : 0;
                    const pct = t.entry_price ? ((t.exit_price || 0) - t.entry_price) / t.entry_price * 100 : 0;
                    return { type: 'closed' as const, symbol: t.symbol, qty: t.quantity, entry: t.entry_price, exitPrice: t.exit_price, pnl, pct, label: 'Closed' as const };
                  });
                  const items = [...openItems, ...closedItems].slice(0, 4);
                  return items.length > 0 ? items.map((item, i) => (
                    <motion.div
                      key={`${item.type}-${item.symbol}-${i}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => navigate(`/analysis/${item.symbol}`)}
                      className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl px-3 py-2 cursor-pointer hover:border-blue-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-2 text-[9px]">
                        <span className="text-xs font-black text-[var(--text-primary)] group-hover:text-blue-400 transition-colors shrink-0">{item.symbol}</span>
                        <span className={`font-black shrink-0 ${
                          item.pct >= 5 ? 'text-emerald-400' :
                          item.pct >= 0 ? 'text-blue-400' :
                          'text-rose-400'
                        }`}>
                          {item.pct >= 0 ? '+' : ''}{item.pct.toFixed(1)}%
                        </span>
                        <span className={`font-bold ${item.type === 'closed' ? 'text-[var(--text-muted)]' : 'text-emerald-400'} shrink-0`}>
                          {item.label}
                        </span>
                        <span className="text-[var(--text-muted)] font-medium truncate">
                          · {item.qty}sh @ ₹{item.entry.toLocaleString('en-IN')}
                          {item.type === 'closed' && item.exitPrice
                            ? ` → ₹${item.exitPrice.toLocaleString('en-IN')}`
                            : stockPrices[item.symbol]
                              ? ` · CMP ₹${stockPrices[item.symbol].toLocaleString('en-IN')}`
                              : ''}
                        </span>
                        <span className={`font-bold shrink-0 ml-auto ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.pnl >= 0 ? '+' : '-'}{fmt(Math.abs(item.pnl))}
                        </span>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl p-4 text-center">
                      <p className="text-[10px] text-[var(--text-muted)] font-medium">No activity yet</p>
                      <Link to="/screener" className="text-[8px] font-black text-blue-400 mt-1 inline-block hover:text-blue-300 transition-colors">
                        Start screening stocks →
                      </Link>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {quickLinks.map((link, i) => (
              <motion.button
                key={i}
                whileHover={{ y: -1 }}
                onClick={() => navigate(link.path)}
                className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl p-4 text-left hover:border-blue-500/30 transition-all group"
              >
                <div className={`w-8 h-8 rounded-lg ${link.bg} ${link.border} flex items-center justify-center mb-2`}>
                  <link.icon className={`w-4 h-4 ${link.iconCls}`} />
                </div>
                <div className="text-[11px] font-black text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{link.label}</div>
                <div className="text-[8px] text-[var(--text-muted)] font-medium mt-0.5">{link.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Upgrade CTA for Free users ── */}
        {user?.tier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border border-blue-500/20 flex items-center justify-between flex-wrap gap-3"
          >
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Unlock Alpha Tier
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">Get ABCD tranche entries, advanced strategies, and real-time alerts.</p>
            </div>
            <Link
              to="/license-desk"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all shrink-0"
            >
              Upgrade <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* ── Mobile CTA ── */}
        <div className="md:hidden">
          <Link
            to="/screener"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-5 py-4 rounded-xl w-full"
          >
            <Search className="w-3.5 h-3.5" /> New Audit
          </Link>
        </div>
      </div>
    </>
  );
};

export default AppHome;
