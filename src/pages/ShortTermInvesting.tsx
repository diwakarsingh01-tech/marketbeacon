import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendingUp, Target, RefreshCw, CheckCircle2, XCircle, ArrowRight, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { safeJsonParse } from '../lib/api-utils';
import { authFetch } from '../lib/authFetch';
import TierGate from '../components/gates/TierGate';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/ui/Breadcrumbs';

const BASKETS_TO_SCAN = ['Growth Basket', 'Elite Basket', 'Quality Basket'];

interface ShortTermSetup {
  symbol: string;
  basketSource?: string;
  isBuyZone: boolean;
  isPass?: boolean;
  isObservation?: boolean;
  reason?: string;
  entryPrice?: number;
  target?: number;
  currentPrice?: number;
  score?: number;
  tranche?: string | null;
  targets?: Array<{ level: string; price: number; gainPct: number }>;
  abcd?: any;
  sector?: string;
}

const ShortTermInvesting: React.FC = () => {
  const navigate = useNavigate();

  const fallbackContent = (
    <div className="flex-1 flex flex-col py-4 md:py-6 px-4 md:px-8 lg:px-10 space-y-5 md:space-y-6 bg-[var(--bg-primary)] overflow-y-auto no-scrollbar">
      <SEO title="Short Term Investing — MarketBeacon" description="Short-term ABCD setups: buy ladder B → C → D, targets D → C → B → A (~10% gain per leg)." />
      <Breadcrumbs items={[{ label: 'Short Term Investing', href: '#' }]} />

      <div className="bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] rounded-3xl p-8 md:p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center">
          <TrendingUp className="h-10 w-10 text-cyan-400" />
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] mb-3">Pro Feature: Short Term Investing</h2>
        <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">
          Unlock ABCD short-term setups — buy ladder B → C → D (10% gap per level), targets D → C → B → A (~10% gain per leg).
          Universe: Growth + Elite + Quality baskets with real-time Tranche & Target Ladder.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/license-desk')}
            className="w-full sm:w-auto mx-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg"
          >
            <Crown className="h-4 w-4" />
            Upgrade to Pro
          </button>
          <Link to="/pricing" className="block text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
            Compare Plans
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <TierGate requiredTier="pro" fallback={fallbackContent}>
      <ShortTermInvestingContent />
    </TierGate>
  );
};

const ShortTermInvestingContent: React.FC = () => {
  const [setups, setSetups] = useState<ShortTermSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadSetups = useCallback(async (showSpinner = true) => {
    if (showSpinner) setRefreshing(true);
    setError('');
    try {
      // Scan all three institutional baskets with the SHORT_TERM_ABCD strategy.
      const responses = await Promise.all(
        BASKETS_TO_SCAN.map((basket) =>
          authFetch(`/api/backtest/audit?strategy=SHORT_TERM_ABCD&basket=${encodeURIComponent(basket)}`)
            .then(async (res) => {
              const data = await safeJsonParse(res);
              return { basket, ok: res.ok, data };
            })
        )
      );

      const merged = new Map<string, ShortTermSetup>();
      for (const { basket, ok, data } of responses) {
        if (!ok || !data?.allStocks) continue;
        for (const stock of data.allStocks) {
          if (!stock?.symbol) continue;
          const prev = merged.get(stock.symbol);
          if (!prev) {
            merged.set(stock.symbol, { ...stock, basketSource: basket });
          } else {
            // Append basket info if stock appears in multiple baskets
            prev.basketSource = `${prev.basketSource}, ${basket}`;
          }
        }
      }
      setSetups(Array.from(merged.values()));
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || 'Failed to load short-term setups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSetups(false);
  }, [loadSetups]);

  // Active setups = buy-zone or qualified (fundamental gate passed)
  const activeSetups = useMemo(
    () => setups.filter((s) => s.isBuyZone || s.isPass || s.isObservation).sort((a, b) => (b.score || 0) - (a.score || 0)),
    [setups]
  );
  const buyZoneCount = useMemo(() => activeSetups.filter((s) => s.isBuyZone).length, [activeSetups]);
  const avgScore = useMemo(() => {
    if (!activeSetups.length) return 0;
    return Math.round(activeSetups.reduce((sum, s) => sum + (s.score || 0), 0) / activeSetups.length);
  }, [activeSetups]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)] py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-[var(--text-tertiary)] font-medium">Scanning Growth + Elite + Quality baskets…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-4 md:py-6 px-4 md:px-8 lg:px-10 space-y-5 md:space-y-6 bg-[var(--bg-primary)] overflow-y-auto no-scrollbar">
      <SEO title="Short Term Investing — MarketBeacon" description="Short-term ABCD setups: buy ladder B → C → D, targets D → C → B → A (~10% gain per leg)." />

      <Breadcrumbs items={[{ label: 'Short Term Investing', href: '#' }]} />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[var(--border-primary)] pb-6 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <TrendingUp className="h-5 w-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Short Term Investing
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)] max-w-2xl">
            ABCD short-term setups — <span className="text-cyan-400 font-semibold">buy ladder B → C → D</span> (10% gap har level),
            targets <span className="text-emerald-400 font-semibold">D → C → B → A</span> (~10% gain per leg). Universe: Growth + Elite + Quality.
          </p>
          <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {activeSetups.length} active setups
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-cyan-400" />
              {buyZoneCount} in buy zone
            </span>
            <span>Avg score {avgScore}</span>
            {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString('en-IN')}</span>}
          </div>
        </div>
        <button
          onClick={() => loadSetups()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-caption font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Setups — mobile cards + desktop table */}
      {activeSetups.length === 0 ? (
        <div className="p-10 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-primary)] rounded-3xl">
          Koi active short-term ABCD setup nahi mila abhi. Market ke next pullback par check karein.
        </div>
      ) : (
        <>
          {/* ── MOBILE: Card layout (default) ── */}
          <div className="md:hidden space-y-3">
            {activeSetups.map((s) => {
              const entry = Number(s.entryPrice) || 0;
              const current = Number(s.currentPrice) || 0;
              const gap = entry > 0 ? (((current - entry) / entry) * 100).toFixed(1) : '—';
              const targets = s.targets || [];
              return (
                <div key={s.symbol} className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl p-4 space-y-3">
                  {/* Row 1: Symbol + Tranche + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-extrabold text-sm text-[var(--text-primary)] truncate block">{s.symbol}</span>
                      {s.sector && <span className="text-[10px] text-[var(--text-muted)] block">{s.sector}</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider ${
                        s.tranche === 'D'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : s.tranche === 'C'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : s.tranche === 'B'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                      }`}>
                        {s.tranche || '—'}
                      </span>
                      {s.isBuyZone ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px]"><CheckCircle2 className="h-3 w-3" /> BUY</span>
                      ) : s.isPass ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[10px]"><Target className="h-3 w-3" /> QUAL</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--text-muted)] font-bold text-[10px]"><XCircle className="h-3 w-3" /> OBS</span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Entry / CMP / Gap */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[var(--bg-primary)]/40 rounded-xl px-3 py-2 text-center">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Entry</div>
                      <div className="font-mono font-bold text-cyan-400 text-xs">₹{entry.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-[var(--bg-primary)]/40 rounded-xl px-3 py-2 text-center">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">CMP</div>
                      <div className="font-mono font-bold text-[var(--text-primary)] text-xs">₹{current.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-[var(--bg-primary)]/40 rounded-xl px-3 py-2 text-center">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Gap</div>
                      <div className={`font-mono font-bold text-xs ${Number(gap) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{gap}%</div>
                    </div>
                  </div>

                  {/* Row 3: Score + Basket + Chart link */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-blue-400 text-xs">Score {s.score ?? '—'}</span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate">{s.basketSource || ''}</span>
                    </div>
                    <Link
                      to={`/charts?symbol=${encodeURIComponent(s.symbol)}&return=/short-term`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 shrink-0"
                    >
                      Chart <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Row 4: Targets ladder (compact) */}
                  {targets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {targets.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          T{i + 1}·{t.level} ₹{Number(t.price || 0).toLocaleString('en-IN')} <span className="text-emerald-500/70 font-mono">+{t.gainPct}%</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── DESKTOP: Table layout ── */}
          <div className="hidden md:block bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)] rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/40 text-[var(--text-muted)] uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-extrabold">Symbol</th>
                    <th className="px-3 py-3.5 font-extrabold">Basket</th>
                    <th className="px-3 py-3.5 font-extrabold">Tranche</th>
                    <th className="px-3 py-3.5 font-extrabold">Entry (B/C/D)</th>
                    <th className="px-3 py-3.5 font-extrabold">CMP</th>
                    <th className="px-3 py-3.5 font-extrabold">Gap%</th>
                    <th className="px-3 py-3.5 font-extrabold">Targets Ladder (D→C→B→A)</th>
                    <th className="px-3 py-3.5 font-extrabold">Score</th>
                    <th className="px-3 py-3.5 font-extrabold">Status</th>
                    <th className="px-3 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {activeSetups.map((s) => {
                    const entry = Number(s.entryPrice) || 0;
                    const current = Number(s.currentPrice) || 0;
                    const gap = entry > 0 ? (((current - entry) / entry) * 100).toFixed(1) : '—';
                    const targets = s.targets || [];
                    return (
                      <tr key={s.symbol} className="border-b border-[var(--border-primary)]/40 hover:bg-[var(--bg-primary)]/30 transition-all">
                        <td className="px-5 py-3.5">
                          <span className="font-extrabold text-[var(--text-primary)]">{s.symbol}</span>
                          {s.sector && <span className="block text-[10px] text-[var(--text-muted)]">{s.sector}</span>}
                        </td>
                        <td className="px-3 py-3.5 text-[var(--text-secondary)]">{s.basketSource || '—'}</td>
                        <td className="px-3 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase tracking-wider ${
                            s.tranche === 'D'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : s.tranche === 'C'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : s.tranche === 'B'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                          }`}>
                            {s.tranche || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-mono font-bold text-cyan-400">₹ {entry.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-3.5 font-mono font-bold text-[var(--text-primary)]">₹ {current.toLocaleString('en-IN')}</td>
                        <td className={`px-3 py-3.5 font-mono font-bold ${Number(gap) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{gap}%</td>
                        <td className="px-3 py-3.5">
                          {targets.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {targets.map((t, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                                  T{i + 1}·{t.level} ₹{Number(t.price || 0).toLocaleString('en-IN')} <span className="text-emerald-500/70 font-mono">+{t.gainPct}%</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 font-mono font-bold text-blue-400">{s.score ?? '—'}</td>
                        <td className="px-3 py-3.5">
                          {s.isBuyZone ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle2 className="h-3.5 w-3.5" /> BUY ZONE</span>
                          ) : s.isPass ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold"><Target className="h-3.5 w-3.5" /> QUALIFIED</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[var(--text-muted)] font-bold"><XCircle className="h-3.5 w-3.5" /> {s.reason || 'OBSERVATION'}</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <Link
                            to={`/charts?symbol=${encodeURIComponent(s.symbol)}&return=/short-term`}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-all"
                          >
                            Chart <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShortTermInvesting;
