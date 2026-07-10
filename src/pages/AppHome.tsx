import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Zap, Briefcase, BookOpen, TrendingUp,
  Search, ArrowRight, Activity, BarChart3, Star,
  Wallet, TrendingDown,
  RefreshCw, PieChart, Sparkles, ChevronRight, Bell,
  CheckCircle2, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, safeJsonParse } from '../lib/api-utils';
import { authFetch } from '../lib/authFetch';
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
      whileHover={{ y: -3, scale: 1.02 }}
      className="card p-5 flex flex-col justify-between min-h-[110px]"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg border ${colors[color]} backdrop-blur-sm`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {change && (
            <span className={`text-label flex items-center gap-1 ${
              change.positive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {change.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {change.value}
            </span>
          )}
          {subtitle && <span className="text-xs text-[var(--text-muted)] font-medium">{subtitle}</span>}
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

  // Market indices
  const [indices, setIndices] = useState<IndexResult[]>([]);

  // Portfolio data
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [stockCaps, setStockCaps] = useState<Record<string, number>>({});
  // Buy zones
  const [buyZones, setBuyZones] = useState<BuyZoneCard[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);

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
    const fetchAll = async () => {
      try {
        const [wRes, tRes] = await Promise.all([
          authFetch('/api/watchlist'),
          authFetch('/api/trades'),
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
    setLoadingZones(true);
    Promise.all([
      authFetch('/api/backtest/audit?basket=ALL').then(r => r.json()),
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

  const ALL_SYMBOLS = useMemo(() => {
    const s = new Set<string>();
    Object.values(BASKETS).forEach(list => list.forEach(sym => s.add(sym)));
    return Array.from(s);
  }, []);

  // Calculate portfolio summary (open + closed) + cap allocation
  const portfolioSummary = useMemo(() => {
    let totalInv = 0, totalCur = 0, realizedPnL = 0;
    const capInv = { large: 0, mid: 0, small: 0 };
    const capCur = { large: 0, mid: 0, small: 0 };
    const combinedMap: Record<string, { quantity: number; buy_price: number }> = {};
    watchlist.forEach(w => { combinedMap[w.symbol] = { quantity: Number(w.quantity) || 0, buy_price: Number(w.buy_price) || 0 }; });
    trades.filter(t => t.status === 'OPEN').forEach(t => {
      const tQty = Number(t.quantity) || 0;
      const tPrice = Number(t.entry_price) || 0;
      if (combinedMap[t.symbol]) {
        const ex = combinedMap[t.symbol];
        const nQty = ex.quantity + tQty;
        if (nQty > 0) { ex.buy_price = ((ex.buy_price * ex.quantity) + (tPrice * tQty)) / nQty; ex.quantity = nQty; }
      } else {
        combinedMap[t.symbol] = { quantity: tQty, buy_price: tPrice };
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
      const exitPrice = Number(t.exit_price) || 0;
      const entryPrice = Number(t.entry_price) || 0;
      const qty = Number(t.quantity) || 0;
      realizedPnL += (exitPrice - entryPrice) * qty;
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
    const fetchNotifs = async () => {
      try {
        const res = await authFetch('/api/notifications');
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
      const da = a.exit_date || a.entry_date || '';
      const db = b.exit_date || b.entry_date || '';
      return db.localeCompare(da);
    });
  }, [trades]);

  // Format large numbers
  const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <SEO title="Dashboard | MarketBeacon Pro" description="Your institutional audit command center" />

      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">

        {/* ── Market Indices + Alerts Ticker ── */}
        <div className="card overflow-hidden">
          <div className="flex divide-x divide-[var(--border-primary)] overflow-x-auto py-3 px-4 whitespace-nowrap scrollbar-none text-caption items-center">
            {indices.map((idx, i) => (
              <div key={i} className="flex items-center gap-3 px-5">
                <span className="text-[var(--text-secondary)]">{idx.name}</span>
                <span className="font-bold text-[var(--text-primary)]">{idx.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                <span className={`flex items-center gap-0.5 text-label ${idx.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {idx.change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                </span>
              </div>
            ))}
            {indices.length === 0 && (
              <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs px-5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading market data...
              </div>
            )}
            {notifications.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 px-5 shrink-0">
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden relative h-5 px-5">
                  <motion.div
                    key={notifIndex}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center"
                  >
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {notifications[notifIndex]?.title && (
                        <span className="text-amber-400 mr-1.5">{notifications[notifIndex].title}:</span>
                      )}
                      {notifications[notifIndex]?.message || ''}
                    </span>
                  </motion.div>
                </div>
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="text-caption text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0 mr-3">
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-sm text-[var(--text-muted)] font-medium mt-1 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                tierColor === 'amber' ? 'bg-amber-400' : tierColor === 'blue' ? 'bg-blue-400' : 'bg-emerald-400'
              }`} />
              {tierLabel} Tier · {indices[0] ? `NIFTY ${indices[0].price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'Market Open'}
            </p>
          </div>
          <Link
            to="/screener"
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-caption px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <Search className="w-3.5 h-3.5" /> New Audit
          </Link>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Active Buy Zone Cards ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-caption text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Active Buy Zones
              </h2>
              <Link to="/alpha-hub" className="text-xs font-bold text-blue-400 uppercase tracking-wider hover:text-blue-300 transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loadingZones ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="h-4 w-16 bg-[var(--bg-tertiary)] rounded mb-3" />
                    <div className="h-6 w-24 bg-[var(--bg-tertiary)] rounded mb-2" />
                    <div className="h-3 w-32 bg-[var(--bg-tertiary)] rounded" />
                  </div>
                ))}
              </div>
            ) : buyZones.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {buyZones.map((zone, i) => (
                  <motion.button
                    key={zone.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -2 }}
                    onClick={() => navigate(`/analysis/${zone.symbol}`)}
                    className="card p-4 text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">{zone.symbol}</span>
                      <span className="text-caption text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">BUY</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Entry</span>
                        <span className="font-bold text-[var(--text-secondary)]">₹{zone.entryPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Target</span>
                        <span className="font-bold text-blue-400">₹{zone.target.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Gain</span>
                        <span className="font-bold text-emerald-400">
                          +{(((zone.target - zone.entryPrice) / zone.entryPrice) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[var(--border-primary)]/40 flex items-center gap-1 text-label text-[var(--text-muted)]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {zone.strategy}
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center">
                <Info className="w-5 h-5 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[var(--text-muted)]">No active buy zones right now</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Check back after the next market scan</p>
              </div>
            )}
          </div>

          {/* ── Portfolio Allocation + Recent Activity ── */}
          <div className="space-y-6">
            {/* Allocation */}
            <div>
              <h2 className="text-caption text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-blue-400" /> Portfolio
              </h2>
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Invested</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{portfolioSummary.totalInvested > 0 ? fmt(portfolioSummary.totalInvested) : '₹0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Current</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{portfolioSummary.totalInvested > 0 ? fmt(portfolioSummary.totalCurrent) : '--'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)]/40">
                  <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">P&L</span>
                  <span className={`text-sm font-bold flex items-center gap-1 ${
                    portfolioSummary.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {portfolioSummary.totalPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {portfolioSummary.totalInvested > 0 || portfolioSummary.realizedPnL !== 0
                      ? `${portfolioSummary.totalPnL >= 0 ? '+' : '-'}${fmt(Math.abs(portfolioSummary.totalPnL))}`
                      : '--'}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] font-medium space-y-0.5 pt-1">
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
                    <div className="flex justify-between text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1.5">
                      <span>Allocation</span>
                      <span>{portfolioCount} holdings</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                        style={{ width: `${Math.max(portfolioSummary.curCapBreakdown.large, portfolioSummary.curCapBreakdown.large > 0 ? 4 : 0)}%` }}
                        title={`Large Cap ${portfolioSummary.curCapBreakdown.large.toFixed(0)}%`}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
                        style={{ width: `${Math.max(portfolioSummary.curCapBreakdown.mid, portfolioSummary.curCapBreakdown.mid > 0 ? 4 : 0)}%` }}
                        title={`Mid Cap ${portfolioSummary.curCapBreakdown.mid.toFixed(0)}%`}
                      />
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                        style={{ width: `${Math.max(portfolioSummary.curCapBreakdown.small, portfolioSummary.curCapBreakdown.small > 0 ? 4 : 0)}%` }}
                        title={`Small/Micro Cap ${portfolioSummary.curCapBreakdown.small.toFixed(0)}%`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[var(--text-muted)] font-medium mt-1">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Large {portfolioSummary.curCapBreakdown.large.toFixed(0)}%</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Mid {portfolioSummary.curCapBreakdown.mid.toFixed(0)}%</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Small {portfolioSummary.curCapBreakdown.small.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                <Link
                  to="/portfolio"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg text-caption hover:bg-blue-600/20 transition-all"
                >
                  View Wealth Desk <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-caption text-[var(--text-primary)] uppercase tracking-wider mb-4">Recent Activity</h2>
              <div className="space-y-2">
                {(() => {
                  const openItems = watchlist.slice(0, 2).map((item) => {
                    const qty = Number(item.quantity) || 0;
                    const buyPrice = Number(item.buy_price) || 0;
                    const currentPrice = stockPrices[item.symbol] || buyPrice;
                    const pnl = qty > 0 ? (currentPrice - buyPrice) * qty : 0;
                    const pct = buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;
                    return { type: 'open' as const, symbol: item.symbol, qty, entry: buyPrice, pnl, pct, label: 'In Portfolio' as const };
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
                      className="card py-2.5 px-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors shrink-0">{item.symbol}</span>
                        <span className={`font-semibold shrink-0 ${
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
                        <span className={`font-semibold shrink-0 ml-auto ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.pnl >= 0 ? '+' : '-'}{fmt(Math.abs(item.pnl))}
                        </span>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="card p-4 text-center">
                      <p className="text-xs text-[var(--text-muted)] font-medium">No activity yet</p>
                      <Link to="/screener" className="text-xs font-bold text-blue-400 mt-1 inline-block hover:text-blue-300 transition-colors">
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
          <h2 className="text-caption text-[var(--text-primary)] uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map((link, i) => (
              <motion.button
                key={i}
                whileHover={{ y: -2 }}
                onClick={() => navigate(link.path)}
                className="card p-4 text-left cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-lg ${link.bg} ${link.border} flex items-center justify-center mb-3`}>
                  <link.icon className={`w-4.5 h-4.5 ${link.iconCls}`} />
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{link.label}</div>
                <div className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{link.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Upgrade CTA for Free users ── */}
        {user?.tier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border border-blue-500/20 flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Unlock Alpha Tier
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Get ABCD tranche entries, advanced strategies, and real-time alerts.</p>
            </div>
            <Link
              to="/license-desk"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-caption px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 shrink-0"
            >
              Upgrade <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}

        {/* ── Mobile CTA ── */}
        <div className="md:hidden">
          <Link
            to="/screener"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-caption px-5 py-4 rounded-xl w-full shadow-lg shadow-blue-500/20"
          >
            <Search className="w-4 h-4" /> New Audit
          </Link>
        </div>
      </div>
    </>
  );
};

export default AppHome;
