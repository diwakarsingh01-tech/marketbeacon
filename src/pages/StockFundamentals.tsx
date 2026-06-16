import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Target, ShieldCheck, TrendingUp, ChevronRight, Activity, ArrowUpRight, Lock, Sparkles
} from 'lucide-react';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import { Confetti } from '../components/ui/Confetti';
import Breadcrumbs from '../components/ui/Breadcrumbs';

const API_URL = getApiUrl();

const StockFundamentalsPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/user/redeem-voucher`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
      <div className="w-10 h-10 border-4 border-[var(--border-primary)] border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  const formatCr = (val: any) => {
    const n = Number(val);
    if (isNaN(n) || n === 0) return '—';
    return `₹ ${(n / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr.`;
  };

  const audit = data?.audit || {};
  const score = Number(audit?.score) || 0;
  const universe = audit?.universe || 'WATCHLIST';

  const weightedSegments = [
    { id: 'profit', label: 'Profitability', data: audit?.profitabilityQuality, icon: <TrendingUp className="h-3 w-3 mr-1" /> },
    { id: 'safety', label: 'Safety', data: audit?.balanceSheetSafety, icon: <ShieldCheck className="h-3 w-3 mr-1" /> },
    { id: 'growth', label: 'Growth', data: audit?.growthQuality, icon: <Activity className="h-3 w-3 mr-1" /> },
    { id: 'valuation', label: 'Valuation', data: audit?.efficiencyGovernance, icon: <Target className="h-3 w-3 mr-1" /> }
  ];

  const peRatio = Number(data?.peRatio || 0);
  const pe3Y = Number(data?.peMedians?.pe3Y || 0);
  const pe5Y = Number(data?.peMedians?.pe5Y || 0);
  const avgMedian = (pe3Y + pe5Y) / 2;
  const hasMedian = avgMedian > 0;
  const isPEOvervalued = peRatio > avgMedian && hasMedian;

  return (
    <div className="flex-1 flex flex-col font-sans text-[var(--text-secondary)] bg-[var(--bg-primary)] lg:h-screen lg:overflow-hidden overflow-y-auto pb-24 md:pb-0 relative terminal-scan">
      
      {/* COMPACT HEADER */}
      <div className="bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-primary)] py-4 sticky top-0 z-10 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-6">
              <div className="space-y-0.5">
                 <div className="flex items-center space-x-2 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
                    <Link to="/alpha-hub" className="hover:text-blue-400">Alpha Hub</Link>
                    <ChevronRight className="h-2 w-2" />
                    <span className="text-[var(--text-primary)]">{symbol}</span>
                 </div>
                 <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter uppercase leading-none">{symbol}</h1>
                    <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-tighter">{data?.industry || 'General'}</span>
                    <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${universe === 'INSTITUTIONAL' ? 'bg-blue-600 text-[var(--text-primary)]' : 'bg-slate-700 text-[var(--text-primary)]'}`}>{universe}</div>
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-8">
               <div className="flex flex-col items-end">
                 <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter leading-none">₹{data?.price?.toLocaleString() || '-'}</span>
                 <div className={`font-bold text-[9px] ${Number(data?.change) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {Number(data?.change) >= 0 ? '▲' : '▼'} {Math.abs(Number(data?.change) || 0).toFixed(2)}%
                 </div>
               </div>
               <div className="h-8 w-px bg-[var(--bg-tertiary)]" />
               <div className="text-right">
                  <div className="text-2xl font-black tracking-tighter text-[var(--text-primary)] leading-none">
                     {isProOrAbove ? score.toFixed(0) : '🔒'}
                     <span className="text-xs text-[var(--text-muted)] ml-0.5">/100</span>
                  </div>
                  <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Audit Score</span>
               </div>
            </div>
        </div>
      </div>

      {/* FIT-TO-SCREEN CONTENT */}
      <main className="max-w-[1600px] mx-auto w-full flex-1 lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 px-6 md:px-8 lg:px-10 py-8 relative">
        <div className="col-span-full">
          <Breadcrumbs items={[
            { label: 'Screener', href: '/screener' },
            { label: symbol }
          ]} />
        </div>
        <div className={`lg:col-span-8 space-y-6 lg:overflow-y-auto pr-2 no-scrollbar transition-all duration-300 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between h-24 transition-all duration-200 hover:border-blue-500/30">
                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Market Cap</span>
                <p className="text-lg font-black text-[var(--text-primary)] leading-tight font-mono">{formatCr(data?.marketCap)}</p>
             </div>
             <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between h-24 transition-all duration-200 hover:border-blue-500/30">
                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Profitability (ROE)</span>
                <p className="text-lg font-black text-[var(--text-primary)] leading-tight font-mono">{data?.returnOnEquity ? `${Number(data.returnOnEquity).toFixed(1)}%` : '-'}</p>
             </div>
             <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between h-24 transition-all duration-200 hover:border-blue-500/30">
                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Efficiency (ROCE)</span>
                <p className="text-lg font-black text-[var(--text-primary)] leading-tight font-mono">{data?.roce ? `${Number(data.roce).toFixed(1)}%` : '-'}</p>
             </div>
             <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between h-24 transition-all duration-200 hover:border-blue-500/30">
                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Debt-To-Equity</span>
                <p className={`text-lg font-black leading-tight font-mono ${Number(data?.netDebtToEquity) > 0.2 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{Number(data?.netDebtToEquity).toFixed(2)}</p>
             </div>
          </div>

          <section className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
             <div className="px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                <span className="text-[var(--text-primary)]">Institutional Audit Matrix</span>
                <span className="text-[var(--text-muted)]">{audit?.reason}</span>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {weightedSegments.map((segment) => segment.data && (
                  <div key={segment.id} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-2">
                      <h3 className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center">
                        {segment.icon} {segment.label}
                      </h3>
                      <span className="text-[9px] font-bold text-[var(--text-primary)]">{segment.data.score}/{segment.data.max}</span>
                    </div>
                    <div className="space-y-2">
                      {(segment.data.checks || []).map((check: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                           <span className="text-[9px] font-medium text-[var(--text-muted)] uppercase">{check.label}</span>
                           <span className={`text-[9px] font-bold ${check.pass ? 'text-emerald-500' : 'text-amber-500'}`}>{check.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </section>

          <section className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl shadow-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 backdrop-blur-sm">
             {[
               { label: 'ATH Sales', value: data?.athSales ? `₹${Number(data.athSales).toLocaleString()} Cr.` : '-' },
               { label: 'ATH Profit', value: data?.athNetProfit ? `₹${Number(data.athNetProfit).toLocaleString()} Cr.` : '-' },
               { label: '52W High', value: `₹${Number(data?.fiftyTwoWeekHigh || 0).toLocaleString()}` },
               { label: 'Beta', value: Number(data?.beta)?.toFixed(2) }
             ].map((item, i) => (
               <div key={i} className="space-y-1">
                  <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{item.label}</span>
                  <p className="text-xs font-bold text-[var(--text-primary)] uppercase leading-none font-mono">{item.value}</p>
               </div>
             ))}
          </section>
        </div>

        <div className={`lg:col-span-4 space-y-6 h-full transition-all duration-300 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
           <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl shadow-xl p-6 space-y-6 backdrop-blur-sm">
              <h3 className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center">
                <Target className="h-4 w-4 mr-2 text-blue-500" /> Valuation & Ownership
              </h3>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isPEOvervalued ? 'bg-red-500/10 border-red-500/30' : 'bg-[var(--bg-primary)] border-[var(--border-primary)]'} transition-all duration-200 hover:scale-[1.02]`}>
                       <p className={`text-[7px] font-bold uppercase ${isPEOvervalued ? 'text-red-500' : 'text-[var(--text-tertiary)]'}`}>Current PE</p>
                       <p className={`text-lg font-black leading-none font-mono ${isPEOvervalued ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{peRatio.toFixed(1)}</p>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-primary)] text-center transition-all duration-200 hover:scale-[1.02]">
                        <p className="text-[7px] font-bold text-[var(--text-tertiary)] uppercase">Median P/E (3Y / 5Y)</p>
                        <p className="text-lg font-black text-[var(--text-primary)] leading-none font-mono">
                           {hasMedian ? `${avgMedian.toFixed(1)}x` : '—'}
                        </p>
                        {hasMedian && (
                           <p className="text-[6px] text-[var(--text-muted)] leading-tight mt-0.5">
                              3Y: {pe3Y.toFixed(1)}x &middot; 5Y: {pe5Y.toFixed(1)}x
                           </p>
                        )}
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    {[
                      { label: 'Promoters', value: data?.shareholding?.promoter, color: 'bg-[var(--bg-secondary)]' },
                      { label: 'Institutional', value: (data?.shareholding?.fii || 0) + (data?.shareholding?.dii || 0), color: 'bg-slate-500' }
                    ].map((holder, idx) => (
                      <div key={idx} className="space-y-2">
                         <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-[var(--text-tertiary)] uppercase">{holder.label}</span>
                            <span className="text-[var(--text-primary)]">{holder.value?.toFixed(1)}%</span>
                         </div>
                         <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                            <div className={`h-full ${holder.color} rounded-full transition-all duration-500`} style={{ width: `${holder.value || 0}%` }} />
                         </div>
                      </div>
                    ))}
                    <div className="pt-2 flex flex-col">
                        <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Smart Money Total</span>
                        <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter leading-none font-mono">{data?.shareholding?.smartMoneyTotal?.toFixed(2)}%</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-[var(--bg-primary)] rounded-2xl p-6 text-[var(--text-primary)] space-y-4 shadow-xl border border-[var(--border-primary)] backdrop-blur-sm">
              <h3 className="text-xs font-black uppercase tracking-widest italic">Research Hub</h3>
              <div className="grid grid-cols-1 gap-3">
                 <a href={`https://www.tradingview.com/symbols/NSE-${symbol}`} target="_blank" className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/5 rounded-xl hover:bg-[var(--bg-primary)]/10 transition-all border border-white/10 group" rel="noreferrer">
                    <span className="text-[9px] font-bold uppercase tracking-widest">Charts</span>
                    <ArrowUpRight className="h-3 w-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                 </a>
                 <a href={`https://www.screener.in/company/${symbol}/consolidated/`} target="_blank" className="flex items-center justify-between p-4 bg-[var(--bg-primary)]/5 rounded-xl hover:bg-[var(--bg-primary)]/10 transition-all border border-white/10 group" rel="noreferrer">
                    <span className="text-[9px] font-bold uppercase tracking-widest">Screener</span>
                    <ArrowUpRight className="h-3 w-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                 </a>
              </div>
           </div>
        </div>

        {/* Lock Overlay */}
        {!isProOrAbove && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-md p-8 rounded-2xl">
            <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-3xl p-10 max-w-md w-full shadow-2xl border border-[var(--border-primary)] text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
               <div className="mx-auto w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-500 animate-pulse">
                  <Lock className="w-7 h-7" />
               </div>
               
               <div className="space-y-3">
                  <h3 className="text-xl font-black uppercase tracking-tight text-[var(--text-primary)] italic">PRO LICENSE REQUIRED</h3>
                  <p className="text-xs text-[var(--text-tertiary)] font-medium leading-relaxed">
                     Unlock deep fundamental analysis, institutional quality audits, valuation models, and active strategy indicators for <span className="text-blue-400 font-black">{symbol}</span>.
                  </p>
               </div>

               <div className="space-y-4 pt-2">
                  <button 
                    onClick={() => setShowUpgrade(true)}
                    className="w-full py-5 bg-blue-600 text-[var(--text-primary)] rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
                  >
                     <Sparkles className="w-4 h-4 text-blue-200" /> Upgrade to Pro Execution
                  </button>
                  
                  <Link 
                    to="/license-desk"
                    className="block text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest"
                  >
                     Compare Plans & Pricing
                  </Link>
               </div>

               <div className="border-t border-[var(--border-primary)] pt-8 space-y-5">
                  <div className="space-y-2">
                     <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Have a Coupon or Voucher Code?</span>
                     <p className="text-[10px] text-[var(--text-muted)]">Redeem code for a 7-day free trial of all premium features.</p>
                  </div>
                  
                  <div className="flex gap-3">
                     <input 
                       type="text" 
                       placeholder="Enter voucher (e.g. ALPHA7)..."
                       value={voucherCode}
                       onChange={(e) => setVoucherCode(e.target.value)}
                       className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] px-5 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--text-primary)] outline-none focus:border-blue-500 placeholder:text-slate-600"
                     />
                     <button
                       onClick={handleRedeemVoucher}
                       disabled={redeeming}
                       className="px-6 py-4 bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-slate-100 disabled:bg-[var(--bg-tertiary)] disabled:text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                     >
                       {redeeming ? 'Applying...' : 'Apply'}
                     </button>
                  </div>

                  {voucherError && (
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-wider">{voucherError}</p>
                  )}

                  <button 
                     type="button"
                     onClick={() => {
                        setVoucherCode('ALPHA7');
                        setVoucherError(null);
                     }}
                     className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-wider block mx-auto underline transition-colors"
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
