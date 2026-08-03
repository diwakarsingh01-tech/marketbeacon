import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid, Zap, Briefcase, BookOpen, TrendingUp,
  Search, ArrowRight, Activity, BarChart3, Star,
  Wallet, TrendingDown,
  PieChart, Sparkles, ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, safeJsonParse } from '../lib/api-utils';
import { authFetch } from '../lib/authFetch';
import SEO from '../components/SEO';
import { BASKETS } from '../data/stocks';
import type { IndexResult, WatchlistItem, TradeRecord, StockPriceResult, AllStockItem } from '../types';

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
  const iconColorMap: Record<string, string> = {
    blue: 'text-[var(--signal-buy)]',
    emerald: 'text-[var(--signal-buy)]',
    amber: 'text-[var(--accent-amber)]',
    purple: 'text-[var(--accent-purple)]',
    rose: 'text-[var(--signal-sell)]',
  };
  const iconCls = iconColorMap[color] || iconColorMap.emerald;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="card p-5 flex flex-col justify-between min-h-[118px] cursor-default"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-caption text-[var(--text-muted)]">{title}</span>
        <div className="p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
          <Icon className={`h-4 w-4 ${iconCls}`} />
        </div>
      </div>

      <div>
        <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight leading-none tabular-nums">{value}</div>
        <div className="flex items-center gap-2 mt-1.5">
          {change && (
            <span className={`text-xs font-bold flex items-center gap-1 ${change.positive ? 'text-[var(--signal-buy)]' : 'text-[var(--signal-sell)]'}`}>
              {change.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {change.value}
            </span>
          )}
          {subtitle && <span className="text-[11px] text-[var(--text-muted)] font-medium">{subtitle}</span>}
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
  { icon: Search, label: 'Audit a Stock', path: '/screener', desc: 'Search & score any NSE/BSE stock', bg: 'bg-[var(--signal-buy)]/10', border: 'border-[var(--signal-buy)]/20', iconCls: 'text-[var(--signal-buy)]' },
  { icon: TrendingUp, label: 'Alpha Signals', path: '/alpha-hub', desc: 'Active institutional setups', bg: 'bg-[var(--signal-buy)]/10', border: 'border-[var(--signal-buy)]/20', iconCls: 'text-[var(--signal-buy)]' },
  { icon: Briefcase, label: 'Portfolio', path: '/portfolio', desc: 'Track holdings & P&L', bg: 'bg-[var(--accent-amber)]/10', border: 'border-[var(--accent-amber)]/20', iconCls: 'text-[var(--accent-amber)]' },
  { icon: BookOpen, label: 'Trade Journal', path: '/trades', desc: 'Verify & log trades', bg: 'bg-[var(--accent-purple)]/10', border: 'border-[var(--accent-purple)]/20', iconCls: 'text-[var(--accent-purple)]' },
  { icon: LayoutGrid, label: 'Screener Matrix', path: '/screener', desc: 'Real-time stock matrix', bg: 'bg-[var(--signal-sell)]/10', border: 'border-[var(--signal-sell)]/20', iconCls: 'text-[var(--signal-sell)]' },
  { icon: BarChart3, label: 'Charts Terminal', path: '/charts', desc: 'Advanced charting suite', bg: 'bg-[var(--signal-buy)]/10', border: 'border-[var(--signal-buy)]/20', iconCls: 'text-[var(--signal-buy)]' },
  { icon: TrendingUp, label: 'Short Term Investing', path: '/short-term', desc: 'ABCD buy B→C→D · targets D→C→B→A', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', iconCls: 'text-cyan-400' },
];

interface BuyZoneCard {
  symbol: string;
  entryPrice: number;
  currentPrice: number;
  score: number;
  auditScore: number;
  smartMoney: number;
  strategy: string;
  entryTime: string | null;
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
  // Active setup zones
  const [buyZones, setBuyZones] = useState<BuyZoneCard[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | '7d' | 'all'>('today');

  // Filter buyZones by date range
  const filteredBuyZones = useMemo(() => {
    if (dateRange === 'all') return buyZones;
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === 'today') {
      cutoff.setHours(0, 0, 0, 0);
    } else {
      cutoff.setDate(now.getDate() - 7);
    }
    return buyZones.filter((z) => {
      if (!z.entryTime) return false;
      return new Date(z.entryTime) >= cutoff;
    });
  }, [buyZones, dateRange]);

   // Day P&L tracking
   const [dayPnL, setDayPnL] = useState<number>(0);

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

  // Fetch active setup zones — runs once on mount (cache on backend makes repeats instant)
  useEffect(() => {
    setLoadingZones(true);
    authFetch('/api/backtest/audit?basket=ALL')
      .then(r => r.json())
      .then((data) => {
        const results = data.allStocks || [];
        const setupZoneStocks = results
          .filter((s: AllStockItem) => s.isBuyZone && s.entryPrice)
          // Sort by most recent trigger first (entryTime), then by score
          .sort((a: AllStockItem, b: AllStockItem) => {
            const timeA = a.entryTime ? new Date(a.entryTime).getTime() : 0;
            const timeB = b.entryTime ? new Date(b.entryTime).getTime() : 0;
            if (timeB !== timeA) return timeB - timeA;
            return (b.score || 0) - (a.score || 0);
          })
          .map((s: AllStockItem) => ({
            symbol: s.symbol,
            entryPrice: s.entryPrice || 0,
            currentPrice: s.currentPrice || 0,
            score: s.score || 0,
            auditScore: s.auditScore || 0,
            smartMoney: s.smartMoney || 0,
            strategy: s.strategy || 'Institutional',
            entryTime: s.entryTime || null,
          }));
        setBuyZones(setupZoneStocks);
      })
      .catch(() => {})
      .finally(() => setLoadingZones(false));
  }, []);

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


  const niftyObj = indices.find(idx => idx.name === 'NIFTY 50') || { name: 'NIFTY 50', price: 24323.85, change: 0.56, ath: 26373 };





  return (
    <>
      <SEO title="Dashboard | MarketBeacon Pro" description="Your institutional audit command center" />

       <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">
              {(() => {
                const h = new Date().getHours();
                const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
                return <>{greeting}{user?.name ? <span className="text-[var(--signal-buy)]">, {user.name.split(' ')[0]}</span> : ''}</>;
              })()}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-caption px-2 py-0.5 rounded-full border ${
                tierColor === 'amber' ? 'bg-[var(--accent-amber)]/10 border-[var(--accent-amber)]/20 text-[var(--accent-amber)]' : 'bg-[var(--signal-buy)]/10 border-[var(--signal-buy)]/20 text-[var(--signal-buy)]'
              }`}>{tierLabel} Tier</span>
              {niftyObj && (
                <span className="flex items-center gap-1.5 text-caption text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-buy)] animate-pulse" />
                  NIFTY {niftyObj.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  <span className={`${niftyObj.change >= 0 ? 'text-[var(--signal-buy)]' : 'text-[var(--signal-sell)]'}`}>
                    {niftyObj.change >= 0 ? '+' : ''}{niftyObj.change.toFixed(2)}%
                  </span>
                </span>
              )}
            </div>
          </div>
          <Link
            to="/screener"
            className="hidden md:flex items-center gap-2 bg-[var(--signal-buy)] hover:opacity-90 text-white text-caption px-5 py-3 rounded-xl transition-all font-bold"
          >
            <Search className="w-3.5 h-3.5" /> New Audit
          </Link>
        </div>

        {/* ── Guided Workflow Banner ── */}
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/60 px-4 py-3">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">Investment Workflow</span>
          </div>

          {/* Steps row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-0">

            {/* Step 1 — Screen */}
            <Link to="/screener" className="group flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-[var(--bg-tertiary)] hover:bg-emerald-500/5 border border-[var(--border-primary)] hover:border-emerald-500/30 transition-all duration-200">
              <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black group-hover:scale-110 transition-transform">1</div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors leading-tight">Screen Stocks</span>
                <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wide mt-0.5 leading-none">Quantitative Filters</span>
              </div>
              <Search className="h-3 w-3 text-[var(--text-muted)] group-hover:text-emerald-500 ml-auto shrink-0 transition-colors" />
            </Link>

            <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 mx-1" />

            {/* Step 2 — Alpha Hub */}
            <Link to="/alpha-hub" className="group flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg sm:rounded-none bg-[var(--bg-tertiary)] hover:bg-cyan-500/5 border border-[var(--border-primary)] hover:border-cyan-500/30 transition-all duration-200">
              <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[10px] font-black group-hover:scale-110 transition-transform">2</div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-cyan-400 transition-colors leading-tight">Alpha Hub</span>
                <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wide mt-0.5 leading-none">Strategy Patterns</span>
              </div>
              <Zap className="h-3 w-3 text-[var(--text-muted)] group-hover:text-cyan-500 ml-auto shrink-0 transition-colors" />
            </Link>

            <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 mx-1" />

            {/* Step 3 — Chart */}
            <Link to="/charts" className="group flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg sm:rounded-none bg-[var(--bg-tertiary)] hover:bg-blue-500/5 border border-[var(--border-primary)] hover:border-blue-500/30 transition-all duration-200">
              <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black group-hover:scale-110 transition-transform">3</div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors leading-tight">Technical Setup</span>
                <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wide mt-0.5 leading-none">Chart Terminal</span>
              </div>
              <BarChart3 className="h-3 w-3 text-[var(--text-muted)] group-hover:text-blue-500 ml-auto shrink-0 transition-colors" />
            </Link>

            <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 mx-1" />

            {/* Step 4 — Track */}
            <Link to="/portfolio" className="group flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg sm:rounded-r-lg sm:rounded-l-none bg-[var(--bg-tertiary)] hover:bg-purple-500/5 border border-[var(--border-primary)] hover:border-purple-500/30 transition-all duration-200">
              <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] font-black group-hover:scale-110 transition-transform">4</div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-[var(--text-primary)] group-hover:text-purple-400 transition-colors leading-tight">Track & Manage</span>
                <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wide mt-0.5 leading-none">Portfolio & P&L</span>
              </div>
              <Briefcase className="h-3 w-3 text-[var(--text-muted)] group-hover:text-purple-500 ml-auto shrink-0 transition-colors" />
            </Link>
          </div>
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
            subtitle="Setup signals"
          />
          <StatCard
            title="Watchlist"
            value={watchlist.length}
            icon={Star}
            color="amber"
            subtitle={`${ALL_SYMBOLS.length} in universe`}
          />
        </div>

        {/* ── Two Column: Active Setups + Portfolio ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Active Setup Cards ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-caption text-[var(--text-primary)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--signal-buy)]" /> Active Setups
                <span className="text-[10px] text-[var(--text-muted)] font-normal ml-1">({filteredBuyZones.length})</span>
              </h2>
              <div className="flex items-center gap-2">
                {/* Date range toggle */}
                <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-0.5">
                  {(['today', '7d', 'all'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                        dateRange === range
                          ? 'bg-[var(--signal-buy)] text-white'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {range === 'today' ? 'Today' : range === '7d' ? '7D' : 'All'}
                    </button>
                  ))}
                </div>
                <Link to="/alpha-hub" className="text-caption text-[var(--signal-buy)] hover:opacity-80 transition-all flex items-center gap-1">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
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
            ) : filteredBuyZones.length > 0 ? (
              <div className="space-y-4">
                {/* Group by strategy */}
                {Object.entries(
                  filteredBuyZones.reduce((acc, zone) => {
                    const strat = zone.strategy || 'Other';
                    if (!acc[strat]) acc[strat] = [];
                    acc[strat].push(zone);
                    return acc;
                  }, {} as Record<string, typeof filteredBuyZones>)
                ).map(([strategy, zones]) => (
                  <div key={strategy}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{strategy}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{zones.length} stock{zones.length > 1 ? 's' : ''}</span>
                      <div className="flex-1 h-px bg-[var(--border-primary)]" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {zones.map((zone, i) => {
                        const score = zone.auditScore || zone.score || 0;
                        const scoreColor = score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
                        return (
                          <motion.button
                            key={zone.symbol}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/analysis/${zone.symbol}`)}
                            className="card p-3 text-left group cursor-pointer flex items-center gap-3 hover:border-[var(--signal-buy)]/30 transition-all"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black text-[var(--text-primary)] group-hover:text-[var(--signal-buy)] transition-colors truncate">{zone.symbol}</span>
                                <span className="text-[9px] text-[var(--signal-buy)] bg-[var(--signal-buy)]/10 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px]">
                                <span className="text-[var(--text-muted)]">₹{zone.entryPrice.toLocaleString('en-IN')}</span>
                                <span className={`font-bold ${scoreColor}`}>{score}</span>
                                <span className="text-emerald-400">{zone.smartMoney?.toFixed(0)}%</span>
                                {zone.entryTime && (
                                  <span className="text-[var(--text-muted)]">{new Date(zone.entryTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                )}
                              </div>
                            </div>
                            <Link
                              to={`/charts?symbol=${zone.symbol}&return=/`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-all flex-shrink-0"
                              title="Open in Charts Terminal"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                            </Link>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center">
                <Info className="w-5 h-5 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[var(--text-muted)]">No active setups right now</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Check back after the next market scan</p>
              </div>
            )}
          </div>

          {/* ── Portfolio Allocation + Recent Activity ── */}
          <div className="space-y-6">
            {/* Allocation */}
            <div>
              <h2 className="text-caption text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-[var(--signal-buy)]" /> Portfolio
              </h2>
              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-[var(--text-muted)]">Invested</span>
                  <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{portfolioSummary.totalInvested > 0 ? fmt(portfolioSummary.totalInvested) : '₹0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-[var(--text-muted)]">Current</span>
                  <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{portfolioSummary.totalInvested > 0 ? fmt(portfolioSummary.totalCurrent) : '--'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)]">
                  <span className="text-caption text-[var(--text-muted)]">P&L</span>
                  <span className={`text-sm font-bold flex items-center gap-1 tabular-nums ${
                    portfolioSummary.totalPnL >= 0 ? 'text-[var(--signal-buy)]' : 'text-[var(--signal-sell)]'
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
                    <span className={`tabular-nums ${portfolioSummary.unrealizedPnL >= 0 ? 'text-[var(--signal-buy)]' : 'text-[var(--signal-sell)]'}`}>
                      {portfolioSummary.totalInvested > 0 ? `${portfolioSummary.unrealizedPnL >= 0 ? '+' : '-'}${fmt(Math.abs(portfolioSummary.unrealizedPnL))}` : '--'}
                    </span>
                  </span>
                  <span className="flex justify-between">
                    <span>Realized</span>
                    <span className={`tabular-nums ${portfolioSummary.realizedPnL >= 0 ? 'text-[var(--signal-buy)]' : 'text-[var(--signal-sell)]'}`}>
                      {portfolioSummary.realizedPnL !== 0 ? `${portfolioSummary.realizedPnL >= 0 ? '+' : '-'}${fmt(Math.abs(portfolioSummary.realizedPnL))}` : '--'}
                    </span>
                  </span>
                </div>
                {portfolioSummary.totalInvested > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between text-caption text-[var(--text-muted)] mb-1.5">
                      <span>Allocation</span>
                      <span>{portfolioCount} holdings</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden flex">
                      <div
                        className="h-full bg-[var(--signal-buy)] transition-all"
                        style={{ width: `${Math.max(portfolioSummary.curCapBreakdown.large, portfolioSummary.curCapBreakdown.large > 0 ? 4 : 0)}%` }}
                        title={`Large Cap ${portfolioSummary.curCapBreakdown.large.toFixed(0)}%`}
                      />
                      <div
                        className="h-full bg-[var(--accent-amber)] transition-all"
                        style={{ width: `${Math.max(portfolioSummary.curCapBreakdown.mid, portfolioSummary.curCapBreakdown.mid > 0 ? 4 : 0)}%` }}
                        title={`Mid Cap ${portfolioSummary.curCapBreakdown.mid.toFixed(0)}%`}
                      />
                      <div
                        className="h-full bg-[var(--accent-blue)] transition-all"
                        style={{ width: `${Math.max(portfolioSummary.curCapBreakdown.small, portfolioSummary.curCapBreakdown.small > 0 ? 4 : 0)}%` }}
                        title={`Small/Micro Cap ${portfolioSummary.curCapBreakdown.small.toFixed(0)}%`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[var(--text-muted)] font-medium mt-1">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-buy)]" /> Large {portfolioSummary.curCapBreakdown.large.toFixed(0)}%</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-amber)]" /> Mid {portfolioSummary.curCapBreakdown.mid.toFixed(0)}%</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)]" /> Small {portfolioSummary.curCapBreakdown.small.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
                <Link
                  to="/portfolio"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[var(--signal-buy)]/10 border border-[var(--signal-buy)]/20 text-[var(--signal-buy)] rounded-lg text-caption hover:bg-[var(--signal-buy)]/20 transition-all"
                >
                  View Wealth Desk <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-caption text-[var(--text-primary)] mb-3">Recent Activity</h2>
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
                        <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--signal-buy)] transition-colors shrink-0">{item.symbol}</span>
                        <span className={`font-semibold shrink-0 ${
                          item.pct >= 5 ? 'text-[var(--signal-buy)]' :
                          item.pct >= 0 ? 'text-[var(--signal-buy)]' :
                          'text-[var(--signal-sell)]'
                        }`}>
                          {item.pct >= 0 ? '+' : ''}{item.pct.toFixed(1)}%
                        </span>
                        <span className={`font-bold ${item.type === 'closed' ? 'text-[var(--text-muted)]' : 'text-[var(--signal-buy)]'} shrink-0`}>
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
                        <span className={`font-semibold shrink-0 ml-auto tabular-nums ${item.pnl >= 0 ? 'text-[var(--signal-buy)]' : 'text-[var(--signal-sell)]'}`}>
                          {item.pnl >= 0 ? '+' : '-'}{fmt(Math.abs(item.pnl))}
                        </span>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="card p-4 text-center">
                      <p className="text-xs text-[var(--text-muted)] font-medium">No activity yet</p>
                      <Link to="/screener" className="text-xs font-bold text-[var(--signal-buy)] mt-1 inline-block hover:opacity-80 transition-all">
                        Start screening stock →
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
          <h2 className="text-caption text-[var(--text-primary)] mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map((link, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(link.path)}
                className="card p-4 text-left cursor-pointer overflow-hidden relative group"
              >
                <div className={`w-9 h-9 rounded-xl ${link.bg} border ${link.border} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <link.icon className={`w-4 h-4 ${link.iconCls}`} />
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--signal-buy)] transition-colors leading-snug">{link.label}</div>
                <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5 leading-snug">{link.desc}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Upgrade CTA for Free users ── */}
        {user?.tier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <Star className="w-4 h-4 text-[var(--accent-amber)]" />
                Unlock Alpha Tier
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Get ABCD tranche entries, advanced strategies, and real-time alerts.</p>
            </div>
            <Link
              to="/license-desk"
              className="flex items-center gap-2 bg-[var(--signal-buy)] hover:opacity-90 text-white text-caption px-5 py-3 rounded-xl transition-all shrink-0 font-bold"
            >
              Upgrade <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}

        {/* ── Mobile CTA ── */}
        <div className="md:hidden">
          <Link
            to="/screener"
            className="flex items-center justify-center gap-2 bg-[var(--signal-buy)] hover:opacity-90 text-white text-caption px-5 py-4 rounded-xl w-full font-bold"
          >
            <Search className="w-4 h-4" /> New Audit
          </Link>
        </div>
      </div>
    </>
  );
};

export default AppHome;
