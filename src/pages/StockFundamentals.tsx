import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Target, ShieldCheck, TrendingUp, ChevronRight, Activity, ArrowUpRight, Lock, Sparkles, ChevronDown, ChevronUp, BarChart3, Bot
} from 'lucide-react';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import { Confetti } from '../components/ui/Confetti';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { InfoTooltip } from '../components/ui/InfoTooltip';
import { FUNDA_INFO_MAP } from '../data/fundaInfo';
import DataFreshnessBadge from '../components/ui/DataFreshnessBadge';
import AiSuggestionPanel from '../components/ai/AiSuggestionPanel';

const API_URL = getApiUrl();

const StockFundamentalsPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backtestData, setBacktestData] = useState<any>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestLoaded, setBacktestLoaded] = useState(false);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    setVoucherError(null);
    try {
      const res = await fetch(`${API_URL}/api/user/redeem-voucher`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() })
      });
      const result = await safeJsonParse(res);
      if (res.ok && !result.error) {
        setShowConfetti(true);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setVoucherError(result.error || 'Invalid voucher code.');
      }
    } catch (e) {
      setVoucherError('Network error. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  const userTier = user?.tier || 'free';
  const isProOrAbove = userTier === 'pro' || userTier === 'alpha';

  useEffect(() => {
    const fetchFundamentals = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stock-fundamentals?symbol=${symbol}&t=${Date.now()}`);
        const result = await safeJsonParse(response);
        if (response.ok && !result.error) setData(result);
        else console.error('Fetch Error:', result.error);
      } catch (e) { console.error('Failed to fetch', e); }
      finally { setLoading(false); }
    };
    fetchFundamentals();
  }, [symbol]);

  const loadBacktest = async () => {
    setBacktestLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/backtest/history?symbol=${symbol}&t=${Date.now()}`);
      const result = await safeJsonParse(res);
      if (res.ok && !result.error) setBacktestData(result);
    } catch (e) { console.error('Backtest fetch failed', e); }
    finally { setBacktestLoading(false); setBacktestLoaded(true); }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
      <div className="w-10 h-10 border-4 border-[var(--border-primary)] border-t-[#00d09c] rounded-full animate-spin" />
    </div>
  );

  const formatCr = (val: unknown) => {
    const n = Number(val);
    if (isNaN(n) || n === 0) return '—';
    return `₹ ${(n / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr.`;
  };

  const dataAge = data?.dataAge || {};
  const globalLastUpdated = dataAge.lastUpdated || data?.lastUpdated || null;

  const audit = data?.audit || {};
  const score = Number(audit?.score) || 0;
  const universe = audit?.universe || 'WATCHLIST';
  const isPass = audit.isPass || data?.audit?.isPass || universe === 'INSTITUTIONAL';

  const weightedSegments = [
    { id: 'profit', label: 'Profitability', data: audit?.profitabilityQuality, icon: <TrendingUp className="h-3 w-3 mr-1" /> },
    { id: 'safety', label: 'Safety', data: audit?.balanceSheetSafety, icon: <ShieldCheck className="h-3 w-3 mr-1" /> },
    { id: 'growth', label: 'Growth', data: audit?.growthQuality, icon: <Activity className="h-3 w-3 mr-1" /> },
    { id: 'valuation', label: 'Valuation', data: audit?.efficiencyGovernance, icon: <Target className="h-3 w-3 mr-1" /> }
  ];

  const peRatio = Number(data?.peRatio || 0);
  const pe3Y = Number(data?.peMedians?.pe3Y || 0);
  const pe5Y = Number(data?.peMedians?.pe5Y || 0);
  const pe10Y = Number(data?.peMedians?.pe10Y || 0);
  // Rule: Current PE must be ≤ 3Y median AND ≤ 5Y median.
  // If either median is available, it must not be exceeded.
  const hasPe3Y = pe3Y > 0;
  const hasPe5Y = pe5Y > 0;
  const hasMedian = hasPe3Y || hasPe5Y;
  const isPEOvervalued = hasMedian && (
    (hasPe3Y && peRatio > pe3Y) || (hasPe5Y && peRatio > pe5Y)
  );
  // For display: pick the most conservative (lowest) available median
  const referenceMedian = hasPe3Y && hasPe5Y ? Math.min(pe3Y, pe5Y) : (hasPe3Y ? pe3Y : (hasPe5Y ? pe5Y : 0));

  // Find all baskets that contain this stock
  const containingBaskets = Object.entries(BASKETS)
    .filter(([_, list]) => {
      const sym = symbol?.trim().toUpperCase();
      if (!sym) return false;
      return list.some(s => {
        const u = s.trim().toUpperCase();
        return u === sym || u.replace('.NS', '') === sym || sym.replace('.NS', '') === u;
      });
    })
    .map(([name]) => name);

  const applicableStrategies = STRATEGIES.filter(strat =>
    strat.baskets.some(b => containingBaskets.includes(b))
  );

  return (
    <div className="flex-1 flex flex-col font-sans text-[var(--text-secondary)] bg-[var(--bg-primary)] min-h-screen overflow-y-auto pb-24 md:pb-0 relative terminal-scan">
      
      {/* COMPACT HEADER */}
      <div className="bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-primary)] py-4 sticky top-0 z-10 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-6">
              <div className="space-y-0.5">
                 <div className="flex items-center space-x-2 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                    <Link to="/alpha-hub" className="hover:text-[#00d09c]">Alpha Hub</Link>
                    <ChevronRight className="h-2 w-2" />
                    <span className="text-[var(--text-primary)]">{symbol}</span>
                 </div>
                 <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">{symbol}</h1>
                    <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded text-xs font-bold text-[var(--text-secondary)] uppercase tracking-tighter">{data?.industry || 'General'}</span>
                    <div className={`px-2 py-0.5 rounded text-caption uppercase tracking-tighter ${universe === 'INSTITUTIONAL' ? 'bg-[#00d09c] text-white' : 'bg-slate-200 text-slate-700'}`}>{universe}</div>
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-8">
               <div className="flex flex-col items-end">
                 <span className="text-xl font-bold text-[var(--text-primary)] tracking-tighter leading-none">₹{data?.price?.toLocaleString() || '-'}</span>
                 <div className={`font-bold text-xs ${Number(data?.change) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {Number(data?.change) >= 0 ? '▲' : '▼'} {Math.abs(Number(data?.change) || 0).toFixed(2)}%
                 </div>
               </div>
               <div className="h-8 w-px bg-[var(--bg-tertiary)]" />
               <div className="text-right">
                  <div className="text-2xl font-bold tracking-tighter text-[var(--text-primary)] leading-none">
                     {isProOrAbove ? score.toFixed(0) : '🔒'}
                     <span className="text-xs text-[var(--text-muted)] ml-0.5">/100</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Audit Score</span>
                  <DataFreshnessBadge 
                    lastUpdated={globalLastUpdated} 
                    dataType="Fundamental Data" 
                    showLabel={true} 
                    className="mt-1"
                  />
               </div>
            </div>
        </div>
      </div>

      {/* FIT-TO-SCREEN CONTENT */}
      <main className="max-w-[1600px] mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-6 md:px-8 lg:px-10 py-8 relative">
        <div className="col-span-full">
          <Breadcrumbs items={[
            { label: 'Screener', href: '/screener' },
            { label: symbol || '' }
          ]} />
        </div>
        <div className={`lg:col-span-8 space-y-6 pr-2 no-scrollbar transition-all duration-300 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between h-28 transition-all duration-200 hover:border-[#00d09c]/30">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">Market Cap <InfoTooltip entry={FUNDA_INFO_MAP.marketCap} /></span>
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)] leading-tight font-mono">{formatCr(data?.marketCap)}</p>
                  <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} className="mt-1" />
                </div>
             </div>
             <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between h-28 transition-all duration-200 hover:border-[#00d09c]/30">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">Profitability (ROE) <InfoTooltip entry={FUNDA_INFO_MAP.roe} /></span>
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)] leading-tight font-mono">{data?.returnOnEquity ? `${Number(data.returnOnEquity).toFixed(1)}%` : '-'}</p>
                  <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} className="mt-1" />
                </div>
             </div>
             <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between h-28 transition-all duration-200 hover:border-[#00d09c]/30">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">Efficiency (ROCE) <InfoTooltip entry={FUNDA_INFO_MAP.roce} /></span>
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)] leading-tight font-mono">{data?.roce ? `${Number(data.roce).toFixed(1)}%` : '-'}</p>
                  <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} className="mt-1" />
                </div>
             </div>
             <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between h-28 transition-all duration-200 hover:border-[#00d09c]/30">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">Debt-To-Equity <InfoTooltip entry={FUNDA_INFO_MAP.debtToEquity} /></span>
                <div>
                  <p className={`text-lg font-bold leading-tight font-mono ${Number(data?.netDebtToEquity) > 0.2 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{Number(data?.netDebtToEquity).toFixed(2)}</p>
                  <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} className="mt-1" />
                </div>
             </div>
          </div>

          {/* Basket & Strategy Classifications */}
          <section className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl shadow-xl p-5 backdrop-blur-sm space-y-4">
             <div className="flex justify-between items-center text-caption text-[var(--text-secondary)] border-b border-[var(--border-primary)] pb-3">
                <span className="text-[var(--text-primary)]">Basket & Strategy Matrix</span>
                <DataFreshnessBadge isLive={true} dataType="Strategy Engine" size="sm" />
             </div>
             
             {/* Baskets list */}
             <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Associated Baskets</span>
                <div className="flex flex-wrap gap-2">
                   {containingBaskets.length > 0 ? (
                      containingBaskets.map((bName) => (
                         <span key={bName} className="px-2.5 py-1 bg-[#00d09c]/10 text-[#00d09c] border border-[#00d09c]/20 rounded-lg text-caption">
                            {bName}
                         </span>
                      ))
                   ) : (
                      <span className="text-xs text-[var(--text-muted)] font-bold uppercase">None (Not in any predefined basket)</span>
                   )}
                </div>
             </div>

             {/* Strategies table */}
             <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider block">Strategy Routing & Approval Status</span>
                <div className="grid grid-cols-1 gap-2.5">
                   {applicableStrategies.map((strat) => {
                      const stratResult = data?.strategies?.[strat.id];
                       
                      let statusText = '';
                      let statusColor = '';
                      let tabName = '';

                      const isApproved = stratResult?.status === 'QUALIFIED' || stratResult?.isBuyZone;
                      const isRejected = stratResult?.status === 'REJECTED' || stratResult?.status === 'REJECT' || stratResult?.isPass === false || !isPass;

                      if (isApproved) {
                         statusText = 'APPROVED / SETUP ZONE';
                         statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                         tabName = 'open';
                      } else if (isRejected) {
                         statusText = 'REJECTED / AVOID';
                         statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                         tabName = 'rejected';
                      } else {
                         statusText = 'OBSERVATION / NEUTRAL';
                         statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                         tabName = 'neutral';
                      }

                      // Find a basket that connects this stock and strategy
                      const matchingBasket = strat.baskets.find(b => containingBaskets.includes(b)) || strat.baskets[0];

                      return (
                         <div key={strat.id} className="flex items-center justify-between p-3.5 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-xl hover:border-[#00d09c]/30 transition-all">
                            <div className="space-y-1">
                               <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide block">{strat.name}</span>
                               <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider block">Basket: {matchingBasket}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wider border uppercase leading-none ${statusColor}`}>
                                  {statusText}
                                  {stratResult?.reason && stratResult.reason !== 'QUALIFIED' && stratResult.reason !== 'OBSERVATION' && (
                                     <span className="block text-[6px] opacity-85 mt-0.5 normal-case font-bold">{stratResult.reason}</span>
                                  )}
                               </span>
                               <Link 
                                  to={`/screener?strategy=${strat.id}&basket=${encodeURIComponent(matchingBasket)}&tab=${tabName}&search=${symbol}`}
                                  className="p-1.5 bg-[#00d09c]/10 hover:bg-[#00d09c] text-[#00d09c] hover:text-white rounded-lg border border-[#00d09c]/20 transition-all text-caption flex items-center gap-1 active:scale-95"
                                  title="View on Screener Matrix"
                               >
                                  <span>View Matrix</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                               </Link>
                            </div>
                         </div>
                      );
                   })}
                   {applicableStrategies.length === 0 && (
                      <div className="p-4 bg-[var(--bg-primary)]/20 border border-[var(--border-primary)] rounded-xl text-center">
                         <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">No applicable strategy for this stock's basket classification.</p>
                      </div>
                   )}
                </div>
             </div>
          </section>


          <section className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl shadow-xl backdrop-blur-sm">
             <div className="px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50 flex justify-between items-center text-caption text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)]">Institutional Audit Matrix</span>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-muted)]">{audit?.reason}</span>
                  <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} />
                </div>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {weightedSegments.some(s => s.data) ? (
                  weightedSegments.map((segment) => segment.data && (
                  <div key={segment.id} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-2">
                      <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center">
                        {segment.icon} {segment.label} <InfoTooltip entry={FUNDA_INFO_MAP[segment.id === 'valuation' ? 'valuationScore' : segment.id === 'profit' ? 'profitabilityQuality' : segment.id === 'safety' ? 'balanceSheetSafety' : 'growthQuality']} size="sm" className="ml-1" />
                      </h3>
                      <span className="text-caption text-[var(--text-primary)]">{segment.data.score}/{segment.data.max}</span>
                    </div>
                    <div className="space-y-2">
                       {(segment.data.checks || []).map((check: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                           <span className="text-caption font-medium text-[var(--text-muted)] uppercase">{check.label}</span>
                           <span className={`text-caption ${check.pass ? 'text-emerald-500' : 'text-amber-500'}`}>{check.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )))
                : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Audit data not available for this stock</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Fundamental audit scoring requires complete financial data</p>
                  </div>
                )}
             </div>
          </section>

          <section className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl shadow-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 backdrop-blur-sm">
             {[
               { label: 'ATH Sales', value: data?.athSales ? `₹${Number(data.athSales).toLocaleString()} Cr.` : '-', infoKey: 'salesAth' as const },
               { label: 'ATH Profit', value: data?.athNetProfit ? `₹${Number(data.athNetProfit).toLocaleString()} Cr.` : '-', infoKey: 'profitAth' as const },
               { label: '52W High', value: `₹${Number(data?.fiftyTwoWeekHigh || 0).toLocaleString()}`, infoKey: 'fiftyTwoWeekHigh' as const },
               { label: 'Beta', value: Number(data?.beta)?.toFixed(2), infoKey: 'beta' as const }
             ].map((item, i) => (
               <div key={i} className="space-y-1">
                  <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">{item.label} <InfoTooltip entry={FUNDA_INFO_MAP[item.infoKey]} /></span>
                  <p className="text-xs font-bold text-[var(--text-primary)] uppercase leading-none font-mono">{item.value}</p>
                  <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} />
               </div>
             ))}
          </section>



        </div>

        <div className={`lg:col-span-4 space-y-6 pr-2 no-scrollbar transition-all duration-300 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
           <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl shadow-xl p-6 space-y-6 backdrop-blur-sm">
              <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center">
                <Target className="h-4 w-4 mr-2 text-[#00d09c]" /> Valuation & Ownership
              </h3>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isPEOvervalued ? 'bg-red-500/10 border-red-500/30' : 'bg-[var(--bg-primary)] border-[var(--border-primary)]'} transition-all duration-200 hover:scale-[1.02]`}>
                       <p className={`text-caption uppercase flex items-center gap-1 ${isPEOvervalued ? 'text-red-500' : 'text-[var(--text-tertiary)]'}`}>Current PE <InfoTooltip entry={FUNDA_INFO_MAP.peRatio} size="sm" /></p>
                       <p className={`text-lg font-bold leading-none font-mono ${isPEOvervalued ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{peRatio.toFixed(1)}</p>
                       <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} className="mt-1" />
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-primary)] text-center transition-all duration-200 hover:scale-[1.02]">
                        <p className="text-caption text-[var(--text-tertiary)] uppercase flex items-center justify-center gap-1">Median P/E (3Y / 5Y) <InfoTooltip entry={FUNDA_INFO_MAP.peMedian} size="sm" /></p>
                        <p className="text-lg font-bold text-[var(--text-primary)] leading-none font-mono">
                           {hasMedian ? `${referenceMedian.toFixed(1)}x` : '—'}
                        </p>
                        {hasMedian && (
                           <p className="text-[6px] text-[var(--text-muted)] leading-tight mt-0.5">
                              3Y: {pe3Y.toFixed(1)}x &middot; 5Y: {pe5Y.toFixed(1)}x{pe10Y > 0 ? ` &middot; 10Y: ${pe10Y.toFixed(1)}x` : ''}
                           </p>
                        )}
                        <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} className="mt-1" />
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    {[
                      { label: 'Promoters', value: data?.shareholding?.promoter, infoKey: 'promoterHolding', color: 'bg-[var(--bg-secondary)]' },
                      { label: 'Institutional', value: (data?.shareholding?.fii || 0) + (data?.shareholding?.dii || 0), infoKey: 'fiiDiiCombined', color: 'bg-slate-500' }
                    ].map((holder, idx) => (
                      <div key={idx} className="space-y-2">
                         <div className="flex justify-between items-center text-caption">
                            <span className="text-[var(--text-tertiary)] uppercase flex items-center gap-1">{holder.label} <InfoTooltip entry={FUNDA_INFO_MAP[holder.infoKey]} size="sm" /></span>
                            <span className="text-[var(--text-primary)]">{holder.value?.toFixed(1)}%</span>
                         </div>
                         <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                            <div className={`h-full ${holder.color} rounded-full transition-all duration-500`} style={{ width: `${holder.value || 0}%` }} />
                         </div>
                         <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} />
                      </div>
                    ))}
                    <div className="pt-2 flex flex-col">
                        <span className="text-caption text-[var(--text-tertiary)] uppercase flex items-center gap-1">Smart Money Total <InfoTooltip entry={FUNDA_INFO_MAP.smartMoney} size="sm" /></span>
                        <span className="text-2xl font-bold text-[var(--text-primary)] tracking-tighter leading-none font-mono">{data?.shareholding?.smartMoneyTotal?.toFixed(2)}%</span>
                        <DataFreshnessBadge lastUpdated={globalLastUpdated} size="xs" showLabel={false} className="mt-1" />
                    </div>
                 </div>
              </div>
           </div>

           <AiSuggestionPanel symbol={symbol || ''} />

           <div className="bg-[var(--bg-primary)] rounded-2xl p-6 text-[var(--text-primary)] space-y-4 shadow-xl border border-[var(--border-primary)] backdrop-blur-sm">
               <h3 className="text-caption italic">Research Hub</h3>
              <div className="grid grid-cols-1 gap-3">
                  <a href={`https://www.tradingview.com/symbols/NSE-${symbol}`} target="_blank" className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/5 rounded-xl hover:bg-[var(--bg-primary)]/10 transition-all border border-white/10 group" rel="noreferrer">
                     <span className="text-caption">Charts</span>
                     <ArrowUpRight className="h-3 w-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </a>
                  <Link to={`/charts?symbol=${symbol}&return=/stock/${symbol}`} className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/5 rounded-xl hover:bg-[var(--bg-primary)]/10 transition-all border border-white/10 group">
                     <span className="text-caption">Terminal</span>
                     <BarChart3 className="h-3 w-3 text-[var(--text-tertiary)] group-hover:text-blue-400 transition-colors" />
                  </Link>
                 <a href={`https://www.screener.in/company/${symbol}/consolidated/`} target="_blank" className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/5 rounded-xl hover:bg-[var(--bg-primary)]/10 transition-all border border-white/10 group" rel="noreferrer">
                    <span className="text-caption">Screener</span>
                    <ArrowUpRight className="h-3 w-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                 </a>
                  <Link to={`/ai-assistant?symbol=${symbol}`} className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/5 rounded-xl hover:bg-[var(--bg-primary)]/10 transition-all border border-white/10 group">
                     <span className="text-caption">Ask Beacon AI</span>
                     <Bot className="h-3 w-3 text-[var(--text-tertiary)] group-hover:text-blue-400 transition-colors" />
                  </Link>
              </div>
           </div>
        </div>

        {/* Full-Width: 20-Year Strategy Backtest */}
        <div className="col-span-full">
          <section className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50 flex justify-between items-center text-caption text-[var(--text-secondary)]">
              <span className="text-[var(--text-primary)]">Strategy Backtest (20-Year History)</span>
              {backtestLoading && <div className="w-4 h-4 border-2 border-[var(--border-primary)] border-t-[#00d09c] rounded-full animate-spin" />}
              {backtestLoaded && !backtestLoading && <DataFreshnessBadge isLive={true} dataType="Computed On-Demand" size="sm" />}
            </div>
            <div className="p-4 space-y-2">
              {!backtestLoaded && !backtestLoading && (
                <div className="text-center py-6">
                  <button onClick={loadBacktest} className="px-4 py-2 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-lg text-caption transition-colors shadow-md shadow-[#00d09c]/15">
                    Load 20-Year Backtest
                  </button>
                  <p className="text-xs text-[var(--text-muted)] mt-2">Computes all 10 strategies across 20 years of daily data. May take ~60s.</p>
                </div>
              )}
              {backtestLoading && <div className="p-4 text-center text-xs text-[var(--text-muted)]">Computing 20-year backtest...</div>}
              {backtestLoaded && !backtestLoading && backtestData ? (
                Object.entries(backtestData).sort((a: [string, any], b: [string, any]) => b[1].totalTrades - a[1].totalTrades).map(([sid, r]: [string, any]) => (
                  <div key={sid} className="bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedStrategy(expandedStrategy === sid ? null : sid)}
                      className="w-full flex items-center justify-between p-3 hover:bg-[var(--bg-primary)]/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-caption">
                        <span className="text-[var(--text-primary)]">{sid.replace(/_/g, ' ')}</span>
                        <span className="text-[var(--text-muted)]">{r.totalTrades} trades</span>
                        <span className={r.winRate >= 60 ? 'text-emerald-500' : r.winRate >= 40 ? 'text-amber-500' : 'text-red-500'}>{r.winRate}% WR</span>
                      </div>
                      <div className="flex items-center gap-4 text-caption">
                        <span className="text-[#00d09c]">{r.avgRoi}% avg ROI</span>
                        <span className="text-[var(--text-muted)]">{r.avgDays}d avg</span>
                        {expandedStrategy === sid ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </div>
                    </button>
                    {expandedStrategy === sid && r.trades?.length > 0 && (
                      <div className="border-t border-[var(--border-primary)] overflow-x-auto">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="bg-[var(--bg-primary)]/60 text-[var(--text-muted)] uppercase tracking-wider">
                              <th className="p-2 text-left">Setup Level</th>
                              <th className="p-2 text-left">Price</th>
                              <th className="p-2 text-left">Exit</th>
                              <th className="p-2 text-left">Price</th>
                              <th className="p-2 text-left">Projection</th>
                              <th className="p-2 text-left">Hit?</th>
                              <th className="p-2 text-right">ROI</th>
                              <th className="p-2 text-right">Days</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.trades.map((t: any, i: number) => (
                              <tr key={i} className="border-t border-[var(--border-primary)]/50 hover:bg-[var(--bg-primary)]/40">
                                <td className="p-2 text-[var(--text-primary)]">{t.entryDate}</td>
                                <td className="p-2 text-[var(--text-secondary)]">₹{t.entryPrice}</td>
                                <td className="p-2 text-[var(--text-primary)]">{t.exitDate}</td>
                                <td className="p-2 text-[var(--text-secondary)]">₹{t.exitPrice}</td>
                                <td className="p-2 text-[var(--text-secondary)]">₹{t.targetPrice}</td>
                                <td className="p-2">{t.targetHit ? <span className="text-emerald-500">✓</span> : <span className="text-red-500">✗</span>}</td>
                                <td className={`p-2 text-right font-bold ${t.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{t.roi > 0 ? '+' : ''}{t.roi}%</td>
                                <td className="p-2 text-right text-[var(--text-secondary)]">{t.daysHeld}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {expandedStrategy === sid && (!r.trades || r.trades.length === 0) && (
                      <div className="p-4 text-center text-xs text-[var(--text-muted)]">No trades recorded for 20-year period</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                  {backtestLoading ? 'Computing 20-year backtest...' : 'Backtest data unavailable'}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Lock Overlay */}
        {!isProOrAbove && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-md p-8 rounded-2xl">
            <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-3xl p-10 max-w-md w-full shadow-2xl border border-[var(--border-primary)] text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
               <div className="mx-auto w-16 h-16 bg-[#00d09c]/10 border border-[#00d09c]/20 rounded-full flex items-center justify-center text-[#00d09c] animate-pulse">
                  <Lock className="w-7 h-7" />
               </div>
               
               <div className="space-y-3">
                  <h3 className="text-xl font-bold uppercase tracking-tight text-[var(--text-primary)] italic">PRO LICENSE REQUIRED</h3>
                  <p className="text-xs text-[var(--text-tertiary)] font-medium leading-relaxed">
                     Unlock deep fundamental analysis, institutional quality audits, valuation models, and active strategy indicators for <span className="text-[#00d09c] font-bold">{symbol}</span>.
                  </p>
               </div>

               <div className="space-y-4 pt-2">
                  <button 
                    onClick={() => setShowUpgrade(true)}
                    className="w-full py-5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-[#00d09c]/20 flex items-center justify-center gap-2"
                  >
                     <Sparkles className="w-4 h-4 text-white" /> Upgrade to Pro Execution
                  </button>
                  
<Link 
                    to="/license-desk"
                    className="block text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider"
                  >
                    Compare Plans & Pricing
                  </Link>
               </div>

               <div className="border-t border-[var(--border-primary)] pt-8 space-y-5">
                  <div className="space-y-2">
                     <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">Have a Coupon or Voucher Code?</span>
                     <p className="text-xs text-[var(--text-muted)]">Redeem code for a 7-day free trial of all premium features.</p>
                  </div>
                  
                  <div className="flex gap-3">
                     <input 
                       type="text" 
                       placeholder="Enter voucher (e.g. ALPHA7)..."
                       value={voucherCode}
                       onChange={(e) => setVoucherCode(e.target.value)}
                       className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] px-5 py-4 rounded-xl text-caption text-[var(--text-primary)] outline-none focus:border-[#00d09c] placeholder:text-slate-600"
                     />
<button
                      onClick={handleRedeemVoucher}
                      disabled={redeeming}
                      className="px-6 py-4 bg-[#00d09c] hover:bg-[#00bda0] text-white disabled:opacity-50 rounded-xl text-caption transition-all shadow-md shadow-[#00d09c]/15"
                    >
                      {redeeming ? 'Applying...' : 'Apply'}
                    </button>
                  </div>

                  {voucherError && (
                     <p className="text-xs font-bold text-red-500 uppercase tracking-wider">{voucherError}</p>
                  )}

<button 
                      type="button"
                      onClick={() => {
                        setVoucherCode('ALPHA7');
                        setVoucherError(null);
                      }}
                      className="text-xs font-bold text-[#00d09c] hover:text-[#00bda0] uppercase tracking-wider block mx-auto underline transition-colors"
                    >
                      Quick Apply: ALPHA7 (7-Day Free Trial)
                    </button>
               </div>
            </div>
          </div>
        )}
      </main>

      {showConfetti && <Confetti />}
      
      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        requiredTier="pro" 
        userEmail={user?.email} 
      />
    </div>
  );
};

export default StockFundamentalsPage;
