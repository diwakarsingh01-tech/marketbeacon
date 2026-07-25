import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FlaskConical, Play, Loader2, Trophy, AlertTriangle, XCircle,
  RefreshCw, Download, Bookmark, History, Search, TrendingUp,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { toast } from 'sonner';

const API_URL = getApiUrl();

type Bucket = 'PASS' | 'WATCH' | 'REJECT';

interface QuarterPoint {
  q: string;
  sales: number;
  opm: number;
  npm: number;
  pat: number;
  eps: number;
}

interface GrowthMetric {
  symbol: string;
  sector: string;
  bucket: Bucket;
  passScore: number;
  yoyRevenueGrowth: number | null;
  yoyProfitGrowth: number | null;
  yoyEpsGrowth: number | null;
  qoqRevenueGrowth: number | null;
  qoqProfitGrowth: number | null;
  npmNow: number | null;
  npm4QAgo: number | null;
  npmDeltaBps: number | null;
  // OPM trend (comprehensive)
  opmNow: number | null;
  opm4QAgo: number | null;
  opmDeltaBps: number | null;
  roce: number | null;
  roe: number | null;
  peRatio: number | null;
  pegRatio: number | null;
  cagrProfit3Y: number | null;
  // CAGRs (multiple windows)
  cagrSales1Y: number | null;
  cagrSales3Y: number | null;
  cagrSales5Y: number | null;
  cagrProfit1Y: number | null;
  cagrProfit5Y: number | null;
  cagrEps3Y: number | null;
  cagrEps5Y: number | null;
  // Valuation
  pbRatio: number | null;
  psRatio: number | null;
  evEbitda: number | null;
  dividendYield: number | null;
  enterpriseValueCr: number | null;
  netDebtToEquity: number | null;
  pledgePct: number | null;
  smartMoneyTotal: number | null;
  marketCapCr: number | null;
  // Cash-flow / efficiency
  cfoToPat: number | null;
  freeCashFlow: number | null;
  capexToSales: number | null;
  fcfYield: number | null;
  // Working-capital days
  dioDays: number | null;
  dsoDays: number | null;
  dpoDays: number | null;
  hardRejectReason: string | null;
  qualityFlags: string[];
  growthFlags: string[];
  quartersAnalyzed: number;
  latestQuarter: string | null;
  // Per-quarter series (12 quarters Sales/OPM/PAT/EPS) — for expandable detail row
  quarterlySeries?: QuarterPoint[];
}

interface RunMeta {
  id: number;
  status: 'running' | 'complete' | 'failed';
  total: number;
  done: number;
  pass_count: number;
  watch_count: number;
  reject_count: number;
  quarter?: string;
  created_at: string;
  completed_at?: string;
}

interface PublishedPick {
  id: number;
  quarter: string;
  label: string;
  pass_count: number;
  watch_count: number;
  reject_count: number;
  published_at: string;
}

const BUCKET_STYLE: Record<Bucket, { chip: string; icon: any; label: string }> = {
  PASS:  { chip: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Trophy, label: 'PASS' },
  WATCH: { chip: 'bg-amber-500/15 text-amber-400 border-amber-500/30',      icon: AlertTriangle, label: 'WATCH' },
  REJECT: { chip: 'bg-rose-500/15 text-rose-400 border-rose-500/30',        icon: XCircle, label: 'REJECT' },
};

const fmt = (v: number | null, digits = 1, suffix = ''): string => {
  if (v == null) return '—';
  return `${v.toFixed(digits)}${suffix}`;
};
const fmtGrowth = (v: number | null): { text: string; trend: 'up' | 'down' | 'flat' } => {
  if (v == null) return { text: '—', trend: 'flat' };
  const trend = v > 0.5 ? 'up' : v < -0.5 ? 'down' : 'flat';
  return { text: `${v > 0 ? '+' : ''}${v.toFixed(1)}%`, trend };
};

type SortField = 'symbol' | 'sector' | 'bucket' | 'passScore' | 'yoyRevenueGrowth' | 'yoyProfitGrowth' | 'npmDeltaBps' | 'opmDeltaBps' | 'roce' | 'peRatio' | 'pegRatio' | 'pbRatio' | 'psRatio' | 'cfoToPat' | 'fcfYield' | 'dividendYield' | 'cagrSales3Y' | 'cagrProfit3Y' | 'smartMoneyTotal';
type SortDir = 'asc' | 'desc';

const DetailCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-baseline justify-between border-b border-[var(--border-secondary)]/40 py-1">
    <dt className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</dt>
    <dd className="font-mono font-bold text-[var(--text-secondary)]">{value}</dd>
  </div>
);

const CagrCell: React.FC<{ label: string; y1: number | null; y3: number | null; y5: number | null }> = ({ label, y1, y3, y5 }) => (
  <div className="rounded-lg bg-[var(--bg-tertiary)]/60 border border-[var(--border-secondary)]/40 px-2 py-1.5">
    <div className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] mb-0.5">{label} CAGR</div>
    <div className="flex justify-between text-[10px]">
      <span title="1Y">1Y: <span className={y1 == null ? 'text-[var(--text-tertiary)]' : (y1 >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{y1 == null ? '—' : y1.toFixed(1) + '%'}</span></span>
      <span title="3Y">3Y: <span className={y3 == null ? 'text-[var(--text-tertiary)]' : (y3 >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{y3 == null ? '—' : y3.toFixed(1) + '%'}</span></span>
      <span title="5Y">5Y: <span className={y5 == null ? 'text-[var(--text-tertiary)]' : (y5 >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{y5 == null ? '—' : y5.toFixed(1) + '%'}</span></span>
    </div>
  </div>
);

const AdminGrowthLab: React.FC = () => {
  const { user } = useAuth();
  const [symbolsInput, setSymbolsInput] = useState('KAYNES, POLYCAB, TCS, INFY, RELIANCE');
  const [quarterLabel, setQuarterLabel] = useState('');
  const [running, setRunning] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<number | null>(null);
  const [runStatus, setRunStatus] = useState<RunMeta | null>(null);
  const [results, setResults] = useState<GrowthMetric[]>([]);
  const [filterBucket, setFilterBucket] = useState<Bucket | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('passScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [history, setHistory] = useState<RunMeta[]>([]);
  const [published, setPublished] = useState<PublishedPick[]>([]);
  const [publishQuarter, setPublishQuarter] = useState('');
  const [publishLabel, setPublishLabel] = useState('');
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/growth-lab/runs`, { credentials: 'include' });
      const d = await safeJsonParse(res);
      if (res.ok && !d.error) setHistory(d);
    } catch {}
  }, []);

  const fetchPublished = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/growth-lab/published`, { credentials: 'include' });
      const d = await safeJsonParse(res);
      if (res.ok && !d.error) setPublished(d);
    } catch {}
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchPublished();
  }, [fetchHistory, fetchPublished]);

  // Poll for run completion
  useEffect(() => {
    if (!running || currentRunId == null) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/growth-lab/analyze/${currentRunId}`, { credentials: 'include' });
        const d = await safeJsonParse(res);
        if (!res.ok || d.error) { toast.error(d.error || 'Poll failed'); return; }
        setRunStatus({ id: d.id, status: d.status, total: d.total, done: d.done, pass_count: d.passCount, watch_count: d.watchCount, reject_count: d.rejectCount, quarter: d.quarter, created_at: d.createdAt, completed_at: d.completedAt });
        setResults(d.results || []);
        if (d.status === 'complete' || d.status === 'failed') {
          setRunning(false);
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          if (d.status === 'complete') toast.success(`Analyzed ${d.done} stocks — ${d.passCount} PASS / ${d.watchCount} WATCH / ${d.rejectCount} REJECT`);
          if (d.status === 'failed') toast.error('Run failed: ' + (d.errorMessage || 'unknown'));
          fetchHistory();
        }
      } catch (e: any) { toast.error('Poll error: ' + e.message); }
    };
    poll();
    pollRef.current = setInterval(poll, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [running, currentRunId, fetchHistory]);

  const startAnalysis = async () => {
    if (!symbolsInput.trim()) { toast.error('Enter at least one symbol'); return; }
    try {
      setRunning(true);
      setResults([]);
      setRunStatus(null);
      setFilterBucket('ALL');
      const res = await fetch(`${API_URL}/api/admin/growth-lab/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ symbols: symbolsInput, quarter: quarterLabel || 'auto' }),
      });
      const d = await safeJsonParse(res);
      if (!res.ok || d.error) { toast.error(d.error || 'Failed to start'); setRunning(false); return; }
      setCurrentRunId(d.runId);
      toast.info(`Run #${d.runId} started — ${d.total} symbols queued`);
    } catch (e: any) { toast.error('Error: ' + e.message); setRunning(false); }
  };

  const publishRun = async () => {
    if (!currentRunId) { toast.error('No active run to publish'); return; }
    if (!publishQuarter.trim()) { toast.error('Enter a quarter label e.g. "Q1-FY27"'); return; }
    try {
      const res = await fetch(`${API_URL}/api/admin/growth-lab/analyze/${currentRunId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quarter: publishQuarter.trim(), label: publishLabel.trim() || publishQuarter.trim() }),
      });
      const d = await safeJsonParse(res);
      if (!res.ok || d.error) { toast.error(d.error || 'Publish failed'); return; }
      toast.success(`Published ${d.quarter}: ${d.pass} PASS / ${d.watch} WATCH / ${d.reject} REJECT`);
      setPublishQuarter('');
      setPublishLabel('');
      fetchPublished();
    } catch (e: any) { toast.error('Error: ' + e.message); }
  };

  const exportCsv = () => {
    const rows = [['Symbol','Sector','Bucket','Score','YoY Rev %','YoY PAT %','YoY EPS %','QoQ Rev %','QoQ PAT %','OPM now %','OPM Δ bps','NPM now %','NPM Δ bps','ROCE %','ROE %','PE','PEG','P/B','P/S','EV/EBITDA','Div Yield %','3Y Sales CAGR %','3Y PAT CAGR %','5Y Sales CAGR %','5Y PAT CAGR %','CFO/PAT','FCF Cr','Capex/Sales %','FCF Yield %','DIO days','DSO days','DPO days','D/E','Pledge %','Smart Money %','MCap Cr','EV Cr','Hard Reject','qualityFlags','growthFlags','Quarter','LatestQ']];
    for (const r of filtered) {
      rows.push([
        r.symbol, r.sector, r.bucket, String(r.passScore),
        fmt(r.yoyRevenueGrowth), fmt(r.yoyProfitGrowth), fmt(r.yoyEpsGrowth),
        fmt(r.qoqRevenueGrowth), fmt(r.qoqProfitGrowth),
        fmt(r.opmNow), fmt(r.opmDeltaBps, 0),
        fmt(r.npmNow), fmt(r.npmDeltaBps, 0),
        fmt(r.roce), fmt(r.roe), fmt(r.peRatio, 2), fmt(r.pegRatio, 2),
        fmt(r.pbRatio, 2), fmt(r.psRatio, 2), fmt(r.evEbitda, 1), fmt(r.dividendYield),
        fmt(r.cagrSales3Y), fmt(r.cagrProfit3Y), fmt(r.cagrSales5Y), fmt(r.cagrProfit5Y),
        fmt(r.cfoToPat, 2), fmt(r.freeCashFlow, 0), fmt(r.capexToSales), fmt(r.fcfYield),
        fmt(r.dioDays, 0), fmt(r.dsoDays, 0), fmt(r.dpoDays, 0),
        fmt(r.netDebtToEquity, 2),
        fmt(r.pledgePct), fmt(r.smartMoneyTotal),
        fmt(r.marketCapCr, 0), fmt(r.enterpriseValueCr, 0),
        r.hardRejectReason || '',
        r.qualityFlags.join(' | '),
        r.growthFlags.join(' | '),
        runStatus?.quarter || '',
        r.latestQuarter || '',
      ]);
    }
    const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `growth-lab-run-${currentRunId || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply filter + search + sort
  const filtered = results
    .filter(r => filterBucket === 'ALL' || r.bucket === filterBucket)
    .filter(r => !search || r.symbol.toLowerCase().includes(search.toLowerCase()) || r.sector.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortField] ?? -Infinity;
      const bv = b[sortField] ?? -Infinity;
      // Symbol / sector alphabetical
      if (sortField === 'symbol' || sortField === 'sector') {
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      }
      // Bucket — order PASS > WATCH > REJECT
      if (sortField === 'bucket') {
        const w: Record<Bucket, number> = { PASS: 3, WATCH: 2, REJECT: 1 };
        return sortDir === 'asc' ? w[a.bucket] - w[b.bucket] : w[b.bucket] - w[a.bucket];
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const toggleSort = (f: SortField) => {
    if (f === sortField) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(f); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField !== field ? <span className="opacity-20">↕</span> : (sortDir === 'asc' ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
              <FlaskConical className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Growth Lab</h1>
              <p className="text-xs text-[var(--text-secondary)] uppercase tracking-[0.2em] font-bold">Quarterly Growth Filtration · Admin Tool</p>
            </div>
          </div>
          {user && <div className="text-xs text-[var(--text-secondary)] font-bold">Signed in as {user.email}</div>}
        </div>

        {/* Section: Start a new analysis */}
        <section className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-black uppercase tracking-tight">New Analysis</h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">Paste a comma/newline-separated list of NSE symbols. Backend will scrape Screener.in (live, ~1-3s per symbol) and run growth metrics. Avoid running {'>'}500 symbols at once.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2">Symbols</label>
              <textarea
                value={symbolsInput}
                onChange={e => setSymbolsInput(e.target.value)}
                disabled={running}
                rows={4}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
                placeholder="e.g. TCS, INFY, POLYCAB, KAYNES ..."
              />
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2">Quarter label (optional)</label>
                <input
                  value={quarterLabel}
                  onChange={e => setQuarterLabel(e.target.value)}
                  disabled={running}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
                  placeholder="auto (detected) or Q1-FY27"
                />
              </div>
              <button
                onClick={startAnalysis}
                disabled={running || !symbolsInput.trim()}
                className="mt-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-cyan-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {running ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : <><Play className="h-4 w-4" /> Start Analysis</>}
              </button>
            </div>
          </div>

          {runStatus && (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--border-primary)]">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Run #{runStatus.id} · <span className={runStatus.status === 'running' ? 'text-amber-400' : runStatus.status === 'failed' ? 'text-rose-400' : 'text-emerald-400'}>{runStatus.status}</span>
              </div>
              {runStatus.status === 'running' && (
                <div className="flex-1 min-w-[200px]">
                  <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${runStatus.total > 0 ? (runStatus.done / runStatus.total) * 100 : 0}%` }} />
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] font-bold mt-1">{runStatus.done} / {runStatus.total} scraped</div>
                </div>
              )}
              {runStatus.status === 'complete' && (
                <>
                  <div className="flex gap-3 text-xs font-bold">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><Trophy className="h-3 w-3" />{runStatus.pass_count} PASS</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30"><AlertTriangle className="h-3 w-3" />{runStatus.watch_count} WATCH</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30"><XCircle className="h-3 w-3" />{runStatus.reject_count} REJECT</span>
                  </div>
                  <button onClick={exportCsv} className="ml-auto px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:text-emerald-400 hover:border-emerald-500/30 flex items-center gap-2">
                    <Download className="h-3 w-3" /> Export CSV
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* Section: Results table */}
        {results.length > 0 && (
          <section className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 md:p-5 border-b border-[var(--border-primary)] flex flex-wrap items-center gap-3 justify-between">
              <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Results ({filtered.length} shown)</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbol/sector" className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-lg pl-8 pr-3 py-1.5 text-xs w-44 focus:outline-none" />
                </div>
                <div className="flex gap-1">
                  {(['ALL','PASS','WATCH','REJECT'] as const).map(b => (
                    <button key={b} onClick={() => setFilterBucket(b)} disabled={running}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] border transition-all ${filterBucket===b ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >{b}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--bg-tertiary)]/50 text-[var(--text-secondary)] uppercase tracking-[0.1em] text-[10px]">
                    <th className="w-8 px-2 py-2"></th>
                    <th className="text-left px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort('symbol')}>Symbol <SortIcon field="symbol" /></th>
                    <th className="text-left px-3 py-2 cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort('sector')}>Sector <SortIcon field="sector" /></th>
                    <th className="text-left px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort('bucket')}>Bucket <SortIcon field="bucket" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort('passScore')}>Score <SortIcon field="passScore" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort('yoyRevenueGrowth')}>YoY Rev <SortIcon field="yoyRevenueGrowth" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort('yoyProfitGrowth')}>YoY PAT <SortIcon field="yoyProfitGrowth" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort('opmDeltaBps')}>OPM Δ(bps) <SortIcon field="opmDeltaBps" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort('npmDeltaBps')}>NPM Δ(bps) <SortIcon field="npmDeltaBps" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort('roce')}>ROCE <SortIcon field="roce" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort('peRatio')}>PE <SortIcon field="peRatio" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden xl:table-cell" onClick={() => toggleSort('pbRatio')}>P/B <SortIcon field="pbRatio" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden xl:table-cell" onClick={() => toggleSort('psRatio')}>P/S <SortIcon field="psRatio" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden xl:table-cell" onClick={() => toggleSort('cagrSales3Y')}>3Y Sal CAGR <SortIcon field="cagrSales3Y" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden xl:table-cell" onClick={() => toggleSort('cfoToPat')}>CFO/PAT <SortIcon field="cfoToPat" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden xl:table-cell" onClick={() => toggleSort('fcfYield')}>FCF Yld % <SortIcon field="fcfYield" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden xl:table-cell" onClick={() => toggleSort('dividendYield')}>Div Yld % <SortIcon field="dividendYield" /></th>
                    <th className="text-right px-3 py-2 cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort('smartMoneyTotal')}>Smart $ <SortIcon field="smartMoneyTotal" /></th>
                    <th className="text-left px-3 py-2">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const bs = BUCKET_STYLE[r.bucket];
                    const BIcon = bs.icon;
                    const rev = fmtGrowth(r.yoyRevenueGrowth);
                    const pat = fmtGrowth(r.yoyProfitGrowth);
                    const isOpen = expandedSymbol === r.symbol;
                    const qs = r.quarterlySeries || [];
                    return (
                      <React.Fragment key={r.symbol}>
                        <tr className={`border-t border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]/30 transition-colors ${isOpen ? 'bg-[var(--bg-tertiary)]/40' : ''}`}>
                          <td className="px-2 py-2.5 text-center">
                            <button onClick={() => setExpandedSymbol(isOpen ? null : r.symbol)} className="text-[var(--text-tertiary)] hover:text-emerald-400 transition-colors">
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4 rotate-90" />}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 font-bold">{r.symbol}</td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] hidden md:table-cell">{r.sector}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${bs.chip}`}><BIcon className="h-3 w-3" />{bs.label}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">{r.passScore}</td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            <span className={rev.trend === 'up' ? 'text-emerald-400' : rev.trend === 'down' ? 'text-rose-400' : ''}>{rev.text}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            <span className={pat.trend === 'up' ? 'text-emerald-400' : pat.trend === 'down' ? 'text-rose-400' : ''}>{pat.text}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono hidden lg:table-cell">
                            <span className={(r.opmDeltaBps ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{r.opmDeltaBps == null ? '—' : (r.opmDeltaBps > 0 ? '+' : '') + r.opmDeltaBps}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono hidden lg:table-cell">
                            <span className={(r.npmDeltaBps ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{r.npmDeltaBps == null ? '—' : (r.npmDeltaBps > 0 ? '+' : '') + r.npmDeltaBps}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono hidden lg:table-cell">{fmt(r.roce)}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{fmt(r.peRatio, 1)}</td>
                          <td className="px-3 py-2.5 text-right font-mono hidden xl:table-cell">{fmt(r.pbRatio, 2)}</td>
                          <td className="px-3 py-2.5 text-right font-mono hidden xl:table-cell">{fmt(r.psRatio, 2)}</td>
                          <td className="px-3 py-2.5 text-right font-mono hidden xl:table-cell">{fmt(r.cagrSales3Y)}</td>
                          <td className="px-3 py-2.5 text-right font-mono hidden xl:table-cell">{fmt(r.cfoToPat, 2)}×</td>
                          <td className="px-3 py-2.5 text-right font-mono hidden xl:table-cell">{fmt(r.fcfYield)}</td>
                          <td className="px-3 py-2.5 text-right font-mono hidden xl:table-cell">{fmt(r.dividendYield)}</td>
                          <td className="px-3 py-2.5 text-right font-mono hidden md:table-cell">{fmt(r.smartMoneyTotal)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {[...(r.hardRejectReason ? [r.hardRejectReason] : []), ...r.growthFlags, ...r.qualityFlags].slice(0, 3).map((f, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-tertiary)] whitespace-nowrap">{f}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="border-t border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/15">
                            <td colSpan={20} className="px-4 py-5">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Per-quarter series */}
                                <div className="lg:col-span-2">
                                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3" /> Quarterly Series · {qs.length} quarters · latest {r.latestQuarter || '—'}
                                  </h4>
                                  {qs.length === 0 ? (
                                    <p className="text-xs text-[var(--text-tertiary)]">No quarterly data available.</p>
                                  ) : (
                                    <div className="overflow-x-auto rounded-xl border border-[var(--border-secondary)]">
                                      <table className="w-full text-[11px] font-mono">
                                        <thead>
                                          <tr className="bg-[var(--bg-tertiary)]/70 text-[var(--text-secondary)] uppercase tracking-widest text-[9px]">
                                            <th className="text-left px-2 py-1.5">Quarter</th>
                                            <th className="text-right px-2 py-1.5">Sales (₹Cr)</th>
                                            <th className="text-right px-2 py-1.5">OPM %</th>
                                            <th className="text-right px-2 py-1.5">NPM %</th>
                                            <th className="text-right px-2 py-1.5">PAT (₹Cr)</th>
                                            <th className="text-right px-2 py-1.5">EPS ₹</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {qs.map((q, i) => {
                                            const prev = i > 0 ? qs[i - 1] : null;
                                            const salesDelta = prev && prev.sales > 0 ? ((q.sales - prev.sales) / prev.sales) * 100 : null;
                                            const patDelta = prev && prev.pat > 0 ? ((q.pat - prev.pat) / prev.pat) * 100 : null;
                                            return (
                                              <tr key={q.q} className="border-t border-[var(--border-secondary)]/50">
                                                <td className="px-2 py-1.5 text-[var(--text-secondary)]">{q.q}</td>
                                                <td className="px-2 py-1.5 text-right">{q.sales.toLocaleString('en-IN')}<span className={`ml-1 text-[9px] ${salesDelta == null ? '' : salesDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{salesDelta == null ? '' : (salesDelta > 0 ? '+' : '') + salesDelta.toFixed(1) + '%'}</span></td>
                                                <td className="px-2 py-1.5 text-right">{q.opm}</td>
                                                <td className="px-3 py-1.5 text-right">{q.npm}</td>
                                                <td className="px-2 py-1.5 text-right">{q.pat.toLocaleString('en-IN')}<span className={`ml-1 text-[9px] ${patDelta == null ? '' : patDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{patDelta == null ? '' : (patDelta > 0 ? '+' : '') + patDelta.toFixed(1) + '%'}</span></td>
                                                <td className="px-2 py-1.5 text-right">{q.eps.toFixed(2)}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                {/* Comprehensive fundamentals grid */}
                                <div>
                                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2">Comprehensive Fundamentals</h4>
                                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                                    <DetailCell label="Market Cap" value={fmt(r.marketCapCr, 0, ' Cr')} />
                                    <DetailCell label="Enterprise Value" value={fmt(r.enterpriseValueCr, 0, ' Cr')} />
                                    <DetailCell label="ROCE" value={fmt(r.roce, 1, '%')} />
                                    <DetailCell label="ROE" value={fmt(r.roe, 1, '%')} />
                                    <DetailCell label="P/E" value={fmt(r.peRatio, 1)} />
                                    <DetailCell label="P/B" value={fmt(r.pbRatio, 2)} />
                                    <DetailCell label="P/S" value={fmt(r.psRatio, 2)} />
                                    <DetailCell label="PEG" value={fmt(r.pegRatio, 2)} />
                                    <DetailCell label="EV/EBITDA" value={fmt(r.evEbitda, 1)} />
                                    <DetailCell label="Div Yield" value={fmt(r.dividendYield, 2, '%')} />
                                    <DetailCell label="D/E" value={fmt(r.netDebtToEquity, 2)} />
                                    <DetailCell label="Smart Money" value={fmt(r.smartMoneyTotal, 1, '%')} />
                                    <DetailCell label="Pledge" value={fmt(r.pledgePct, 2, '%')} />
                                    <DetailCell label="CFO/PAT" value={fmt(r.cfoToPat, 2, '×')} />
                                    <DetailCell label="FCF (₹Cr)" value={fmt(r.freeCashFlow, 0)} />
                                    <DetailCell label="FCF Yield" value={fmt(r.fcfYield, 1, '%')} />
                                    <DetailCell label="Capex/Sales" value={fmt(r.capexToSales, 1, '%')} />
                                    <DetailCell label="OPM now" value={fmt(r.opmNow, 1, '%')} />
                                    <DetailCell label="DIO days" value={fmt(r.dioDays, 0)} />
                                    <DetailCell label="DSO days" value={fmt(r.dsoDays, 0)} />
                                    <DetailCell label="DPO days" value={fmt(r.dpoDays, 0)} />
                                  </dl>
                                  <div className="mt-3 pt-3 border-t border-[var(--border-secondary)]/60">
                                    <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-1.5">CAGRs</h5>
                                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                                      <CagrCell label="Sales" y1={r.cagrSales1Y} y3={r.cagrSales3Y} y5={r.cagrSales5Y} />
                                      <CagrCell label="PAT" y1={r.cagrProfit1Y} y3={r.cagrProfit3Y} y5={r.cagrProfit5Y} />
                                      <CagrCell label="EPS" y1={null} y3={r.cagrEps3Y} y5={r.cagrEps5Y} />
                                    </div>
                                  </div>
                                  {(r.growthFlags.length > 0 || r.qualityFlags.length > 0 || r.hardRejectReason) && (
                                    <div className="mt-3 pt-3 border-t border-[var(--border-secondary)]/60">
                                      <h5 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-1.5">All Flags</h5>
                                      <div className="flex flex-wrap gap-1">
                                        {r.hardRejectReason && <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">{r.hardRejectReason}</span>}
                                        {r.growthFlags.map((f, i) => <span key={`g${i}`} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">{f}</span>)}
                                        {r.qualityFlags.map((f, i) => <span key={`q${i}`} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">{f}</span>)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section: Publish + Published lists side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Publish current run */}
          <section className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-black uppercase tracking-tight">Publish Run #{currentRunId ?? '—'}</h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Snapshot the current completed run into a published quarterly list. Once published, the quarter key is immutable (use Delete on the right to retract).</p>
            <input value={publishQuarter} onChange={e => setPublishQuarter(e.target.value)} placeholder="Quarter key e.g. Q1-FY27" disabled={!currentRunId || runStatus?.status !== 'complete'}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 disabled:opacity-50" />
            <input value={publishLabel} onChange={e => setPublishLabel(e.target.value)} placeholder="Display label e.g. Q1 FY27 (Apr–Jun 2026)" disabled={!currentRunId || runStatus?.status !== 'complete'}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 disabled:opacity-50" />
            <button onClick={publishRun} disabled={!currentRunId || runStatus?.status !== 'complete' || !publishQuarter.trim()}
              className="px-5 py-3 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed">
              Publish
            </button>
          </section>

          {/* Published quarters */}
          <section className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-tight">Published Lists {published.length > 0 && `(${published.length})`}</h2>
            </div>
            {published.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">No quarters published yet. Run an analysis then publish the result.</p>
            ) : (
              <ul className="divide-y divide-[var(--border-primary)]">
                {published.map(p => (
                  <li key={p.id} className="py-3 flex flex-wrap items-center gap-3">
                    <div>
                      <div className="font-bold">{p.label}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">{p.quarter} · {p.published_at}</div>
                    </div>
                    <div className="flex gap-1.5 text-[10px] font-bold ml-auto">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">{p.pass_count} PASS</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">{p.watch_count} WATCH</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400">{p.reject_count} REJECT</span>
                    </div>
                    <button onClick={async () => {
                      if (!confirm(`Delete published list "${p.quarter}"?`)) return;
                      try {
                        const res = await fetch(`${API_URL}/api/admin/growth-lab/published/${encodeURIComponent(p.quarter)}`, { method: 'DELETE', credentials: 'include' });
                        const d = await safeJsonParse(res);
                        if (res.ok && !d.error) { toast.success('Deleted'); fetchPublished(); }
                        else toast.error(d.error || 'Delete failed');
                      } catch (e: any) { toast.error(e.message); }
                    }} className="text-[var(--text-tertiary)] hover:text-rose-400"><XCircle className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Section: Run history */}
        {history.length > 0 && (
          <section className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-4 w-4 text-[var(--text-tertiary)]" />
              <h2 className="text-sm font-black uppercase tracking-tight">Run History</h2>
            </div>
            <ul className="divide-y divide-[var(--border-primary)]">
              {history.map(h => (
                <li key={h.id} className="py-2.5 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-bold w-12">#{h.id}</span>
                  <span className={`font-bold uppercase tracking-widest ${h.status === 'running' ? 'text-amber-400' : h.status === 'failed' ? 'text-rose-400' : 'text-emerald-400'}`}>{h.status}</span>
                  <span className="text-[var(--text-secondary)]">{h.done}/{h.total} done</span>
                  <span className="text-[var(--text-secondary)] hidden md:inline">· {h.quarter || '—'}</span>
                  <span className="text-[var(--text-secondary)] ml-auto">{h.created_at} {h.completed_at ? `→ ${h.completed_at}` : ''}</span>
                  <button onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/api/admin/growth-lab/analyze/${h.id}`, { credentials: 'include' });
                      const d = await safeJsonParse(res);
                      if (!res.ok || d.error) { toast.error(d.error || 'Open failed'); return; }
                      setCurrentRunId(h.id);
                      setRunStatus({ id: d.id, status: d.status, total: d.total, done: d.done, pass_count: d.passCount, watch_count: d.watchCount, reject_count: d.rejectCount, quarter: d.quarter, created_at: d.createdAt, completed_at: d.completedAt });
                      setResults(d.results || []);
                      setRunning(d.status === 'running');
                      toast.info(`Loaded run #${h.id}`);
                    } catch (e: any) { toast.error(e.message); }
                  }} className="text-emerald-400 hover:text-emerald-300 font-bold">Open</button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminGrowthLab;