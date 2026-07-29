import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Search, BarChart3, Activity, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import DataFreshnessBadge from '../components/ui/DataFreshnessBadge';

const API_URL = getApiUrl();

// ── Types (match backend API responses exactly) ─────────────────────────

interface TopMover {
  symbol: string;
  quarter: string;
  sector: string;
  fiiChange: number;
  diiChange: number;
  promoterChange: number;
  currentFII: number;
  currentDII: number;
  currentPromoter: number;
}

interface SectorSummary {
  sector: string;
  avgFII: number;
  avgDII: number;
  avgPromoter: number;
  stockCount: number;
}

interface HistoryPoint {
  quarter: string;
  promoter: number;
  fii: number;
  dii: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────

const formatPct = (v: number | null | undefined, decimals = 1) =>
  v != null ? `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%` : '—';

const quarterLabel = (q: string) => {
  const m: Record<string, string> = {
    'Q1': 'Mar', 'Q2': 'Jun', 'Q3': 'Sep', 'Q4': 'Dec'
  };
  const [qq, yy] = q.split(' ');
  return `${m[qq] || qq} ${yy || ''}`;
};

const moverColor = (val: number) =>
  val >= 0 ? 'text-emerald-500' : 'text-red-500';

const customTooltipStyle = {
  contentStyle: {
    background: '#1a1f2e',
    border: '1px solid #2a2f3e',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#b0b8c8',
  },
  labelStyle: { color: '#e8ecf4', fontWeight: 700 },
};

type TabKey = 'fii_inc' | 'fii_dec' | 'dii_inc' | 'dii_dec';

// ── Sub-components ──────────────────────────────────────────────────────

/** Top Movers Table */
const TopMoversSection: React.FC<{ data: TopMover[]; loading: boolean }> = ({ data, loading }) => {
  const [tab, setTab] = useState<TabKey>('fii_inc');

  const filtered = data.filter(m => {
    if (tab === 'fii_inc') return m.fiiChange > 0;
    if (tab === 'fii_dec') return m.fiiChange < 0;
    if (tab === 'dii_inc') return m.diiChange > 0;
    return m.diiChange < 0;
  }).slice(0, 20);

  const tabs = [
    { key: 'fii_inc' as TabKey, label: 'FII ▲', desc: 'Top FII Increases' },
    { key: 'fii_dec' as TabKey, label: 'FII ▼', desc: 'Top FII Decreases' },
    { key: 'dii_inc' as TabKey, label: 'DII ▲', desc: 'Top DII Increases' },
    { key: 'dii_dec' as TabKey, label: 'DII ▼', desc: 'Top DII Decreases' },
  ];

  const isDiiTab = tab === 'dii_inc' || tab === 'dii_dec';
  const deltaKey = isDiiTab ? 'diiChange' as const : 'fiiChange' as const;
  const deltaLabel = isDiiTab ? 'Δ DII' : 'Δ FII';

  return (
    <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#00d09c]" />
          Top Movers
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              tab === t.key
                ? 'bg-[#00d09c]/20 text-[#00d09c] border border-[#00d09c]/30'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-primary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">No data available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-primary)]">
                <th className="text-left py-2 pr-2 font-bold">Symbol</th>
                <th className="text-right px-2 font-bold">FII %</th>
                <th className="text-right px-2 font-bold">DII %</th>
                <th className="text-right px-2 font-bold">Promoter %</th>
                <th className="text-right pl-2 font-bold">{deltaLabel}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.symbol} className="border-b border-[var(--border-primary)]/50 hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                  <td className="py-2.5 pr-2">
                    <span className="font-bold text-[var(--text-primary)]">{m.symbol}</span>
                    <span className="text-[var(--text-muted)] ml-1">({m.quarter})</span>
                  </td>
                  <td className="text-right px-2 font-mono">{m.currentFII.toFixed(1)}%</td>
                  <td className="text-right px-2 font-mono">{m.currentDII.toFixed(1)}%</td>
                  <td className="text-right px-2 font-mono text-[var(--text-muted)]">{m.currentPromoter.toFixed(1)}%</td>
                  <td className={`text-right pl-2 font-mono font-bold ${moverColor(m[deltaKey])}`}>
                    <span className="flex items-center justify-end gap-1">
                      {m[deltaKey] >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {formatPct(m[deltaKey])}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/** Trend Chart */
const TrendChartSection: React.FC = () => {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [inputVal, setInputVal] = useState('RELIANCE');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (sym: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/smart-money/history/${encodeURIComponent(sym)}?t=${Date.now()}`);
      const json = await safeJsonParse(res);
      if (res.ok && json?.history) {
        setHistory(json.history);
      } else {
        setError(json?.error || 'No data found');
        setHistory([]);
      }
    } catch {
      setError('Network error');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(symbol);
  }, [symbol, fetchHistory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputVal.trim().toUpperCase();
    if (val) setSymbol(val);
  };

  return (
    <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#00d09c]" />
          FII / DII Trend
        </h3>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value.toUpperCase())}
            placeholder="Search symbol (e.g. RELIANCE)"
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#00d09c]/50"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-[#00d09c]/20 text-[#00d09c] border border-[#00d09c]/30 rounded-lg text-xs font-bold hover:bg-[#00d09c]/30 transition-all"
        >
          Load
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 text-center py-8">{error}</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">
          No shareholding history for {symbol}. Data appears after the first snapshot capture.
        </p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history.map(h => ({ ...h, quarter: quarterLabel(h.quarter) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
              <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[0, 'auto']} tickFormatter={v => `${v}%`} />
              <Tooltip {...customTooltipStyle} />
              <Line type="monotone" dataKey="fii" stroke="#00d09c" strokeWidth={2} dot={{ r: 3, fill: '#00d09c' }} name="FII %" />
              <Line type="monotone" dataKey="dii" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} name="DII %" />
              <Line type="monotone" dataKey="promoter" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} name="Promoter %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

/** Sector Summary Bar Chart */
const SectorSummarySection: React.FC<{ data: SectorSummary[]; loading: boolean }> = ({ data, loading }) => {
  const [metric, setMetric] = useState<'fii' | 'dii'>('fii');

  const chartData = data
    .filter(s => s.stockCount >= 2)
    .slice(0, 12)
    .map(s => ({
      name: s.sector.length > 14 ? s.sector.slice(0, 14) + '…' : s.sector,
      fullName: s.sector,
      value: metric === 'fii' ? s.avgFII : s.avgDII,
      count: s.stockCount,
    }));

  const colors = ['#00d09c', '#34d399', '#10b981', '#059669', '#047857', '#f59e0b', '#fbbf24', '#f97316', '#ef4444', '#8b5cf6', '#6366f1', '#3b82f6'];

  return (
    <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#00d09c]" />
          Sector Summary
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setMetric('fii')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              metric === 'fii'
                ? 'bg-[#00d09c]/20 text-[#00d09c] border border-[#00d09c]/30'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-primary)]'
            }`}
          >
            FII
          </button>
          <button
            onClick={() => setMetric('dii')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
              metric === 'dii'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-primary)]'
            }`}
          >
            DII
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">No sector data available.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#b0b8c8' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip
                {...customTooltipStyle}
                formatter={(value: number) => [`${value.toFixed(1)}%`, metric === 'fii' ? 'Avg FII' : 'Avg DII']}
                labelFormatter={(label: string) => {
                  const found = chartData.find(d => d.name === label);
                  return `${found?.fullName || label} (${found?.count || 0} stocks)`;
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

/** Smart Money Total Gauge */
const TotalGaugeSection: React.FC<{ topMovers: TopMover[]; loading: boolean }> = ({ topMovers, loading }) => {
  if (loading) return null;

  const latestQuarter = topMovers.length > 0 ? topMovers[0].quarter : null;
  const avgFii = topMovers.length > 0
    ? topMovers.reduce((s, m) => s + m.currentFII, 0) / topMovers.length
    : 0;
  const avgDii = topMovers.length > 0
    ? topMovers.reduce((s, m) => s + m.currentDII, 0) / topMovers.length
    : 0;
  const totalFiiChange = topMovers.reduce((s, m) => s + m.fiiChange, 0);
  const totalDiiChange = topMovers.reduce((s, m) => s + m.diiChange, 0);

  return (
    <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5">
      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-[#00d09c]" />
        Smart Money Gauge
        {latestQuarter && (
          <span className="text-[10px] text-[var(--text-muted)] font-normal normal-case ml-1">
            ({quarterLabel(latestQuarter)})
          </span>
        )}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* FII Gauge */}
        <div className="bg-[var(--bg-tertiary)]/60 rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Avg FII</span>
            <span className={`text-xs font-bold ${totalFiiChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {totalFiiChange >= 0 ? '▲' : '▼'} {formatPct(totalFiiChange, 2)}
            </span>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight font-mono">
            {avgFii.toFixed(1)}<span className="text-sm text-[var(--text-muted)]">%</span>
          </div>
          <div className="mt-2 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#00d09c] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(avgFii, 50) / 50 * 100}%` }}
            />
          </div>
        </div>

        {/* DII Gauge */}
        <div className="bg-[var(--bg-tertiary)]/60 rounded-xl p-4 border border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Avg DII</span>
            <span className={`text-xs font-bold ${totalDiiChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {totalDiiChange >= 0 ? '▲' : '▼'} {formatPct(totalDiiChange, 2)}
            </span>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight font-mono">
            {avgDii.toFixed(1)}<span className="text-sm text-[var(--text-muted)]">%</span>
          </div>
          <div className="mt-2 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(avgDii, 50) / 50 * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────
const SmartMoneyPage: React.FC = () => {
  const [topMovers, setTopMovers] = useState<TopMover[]>([]);
  const [sectors, setSectors] = useState<SectorSummary[]>([]);
  const [loadingMovers, setLoadingMovers] = useState(true);
  const [loadingSectors, setLoadingSectors] = useState(true);

  useEffect(() => {
    const fetchTopMovers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/smart-money/top-movers?t=${Date.now()}`);
        const json = await safeJsonParse(res);
        if (res.ok && json?.movers) setTopMovers(json.movers);
      } catch (e) {
        console.error('Failed to fetch top movers', e);
      } finally {
        setLoadingMovers(false);
      }
    };

    const fetchSectors = async () => {
      try {
        const res = await fetch(`${API_URL}/api/smart-money/sector-summary?t=${Date.now()}`);
        const json = await safeJsonParse(res);
        if (res.ok && json?.sectors) setSectors(json.sectors);
      } catch (e) {
        console.error('Failed to fetch sectors', e);
      } finally {
        setLoadingSectors(false);
      }
    };

    fetchTopMovers();
    fetchSectors();
  }, []);

  return (
    <div className="flex-1 flex flex-col font-sans text-[var(--text-secondary)] bg-[var(--bg-primary)] min-h-screen overflow-y-auto pb-24 md:pb-0 relative terminal-scan">

      {/* HEADER */}
      <div className="bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-primary)] py-4 sticky top-0 z-10 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">
              Smart Money
            </h1>
            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-1">
              FII / DII Shareholding Tracking
            </p>
          </div>
          <DataFreshnessBadge
            lastUpdated={new Date().toISOString()}
            dataType="Shareholding Data"
            showLabel={true}
          />
        </div>
      </div>

      {/* CONTENT */}
      <main className="max-w-[1600px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-6 md:px-8 lg:px-10 py-8 relative">
        {/* Left column: Top Movers + Gauge */}
        <div className="lg:col-span-7 space-y-6">
          <TotalGaugeSection topMovers={topMovers} loading={loadingMovers} />
          <TopMoversSection data={topMovers} loading={loadingMovers} />
        </div>

        {/* Right column: Trend Chart + Sector Summary */}
        <div className="lg:col-span-5 space-y-6">
          <TrendChartSection />
          <SectorSummarySection data={sectors} loading={loadingSectors} />
        </div>
      </main>
    </div>
  );
};

export default SmartMoneyPage;
