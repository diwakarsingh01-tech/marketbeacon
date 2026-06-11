import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Target, ShieldCheck, TrendingUp, ChevronRight, Activity, ArrowUpRight, Lock, Gift, Sparkles
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
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
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
    <div className="flex-1 flex flex-col font-sans text-slate-800 bg-[#f8fafc] lg:h-screen lg:overflow-hidden overflow-y-auto pb-24 md:pb-0 relative">
      
      {/* COMPACT HEADER */}
      <div className="bg-white border-b border-slate-200 py-3.5 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-6">
              <div className="space-y-0.5">
                 <div className="flex items-center space-x-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    <Link to="/alpha-hub" className="hover:text-blue-600">Alpha Hub</Link>
                    <ChevronRight className="h-2 w-2" />
                    <span className="text-slate-900">{symbol}</span>
                 </div>
                 <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{symbol}</h1>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter">{data?.industry || 'General'}</span>
                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${universe === 'INSTITUTIONAL' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>{universe}</div>
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end w-full md:w-auto space-x-8">
               <div className="flex flex-col items-end">
                 <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">₹{data?.price?.toLocaleString() || '-'}</span>
                 <div className={`font-black text-[9px] ${Number(data?.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(data?.change) >= 0 ? '▲' : '▼'} {Math.abs(Number(data?.change) || 0).toFixed(2)}%
                 </div>
               </div>
               <div className="h-8 w-px bg-slate-200" />
               <div className="text-right">
                  <div className="text-2xl font-black tracking-tighter text-slate-900 leading-none">
                     {isProOrAbove ? score.toFixed(0) : '🔒'}
                     <span className="text-xs text-slate-300 ml-0.5">/100</span>
                  </div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Audit Score</span>
               </div>
            </div>
        </div>
      </div>

      {/* FIT-TO-SCREEN CONTENT */}
      <main className="max-w-[1600px] mx-auto w-full flex-1 lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 md:px-8 lg:px-10 py-6 relative">
        <div className="col-span-full">
          <Breadcrumbs items={[
            { label: 'Screener', href: '/screener' },
            { label: symbol }
          ]} />
        </div>
        <div className={`lg:col-span-8 space-y-4 lg:overflow-y-auto pr-2 no-scrollbar transition-all duration-300 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Market Cap</span>
                <p className="text-lg font-black text-slate-900 leading-tight">{formatCr(data?.marketCap)}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Profitability (ROE)</span>
                <p className="text-lg font-black text-slate-900 leading-tight">{data?.returnOnEquity ? `${Number(data.returnOnEquity).toFixed(1)}%` : '-'}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Efficiency (ROCE)</span>
                <p className="text-lg font-black text-slate-900 leading-tight">{data?.roce ? `${Number(data.roce).toFixed(1)}%` : '-'}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Debt-To-Equity</span>
                <p className={`text-lg font-black leading-tight ${Number(data?.netDebtToEquity) > 0.2 ? 'text-red-600' : 'text-slate-900'}`}>{Number(data?.netDebtToEquity).toFixed(2)}</p>
             </div>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-900">
                <span>Institutional Audit Matrix</span>
                <span className="text-slate-500">{audit?.reason}</span>
             </div>
             <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {weightedSegments.map((segment) => segment.data && (
                  <div key={segment.id} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-1">
                      <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                        {segment.icon} {segment.label}
                      </h3>
                      <span className="text-[9px] font-black text-slate-900">{segment.data.score}/{segment.data.max}</span>
                    </div>
                    <div className="space-y-1">
                      {(segment.data.checks || []).map((check: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                           <span className="text-[9px] font-medium text-slate-500 uppercase">{check.label}</span>
                           <span className={`text-[9px] font-black ${check.pass ? 'text-emerald-600' : 'text-amber-600'}`}>{check.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: 'ATH Sales', value: data?.athSales ? `₹${Number(data.athSales).toLocaleString()} Cr.` : '-' },
               { label: 'ATH Profit', value: data?.athNetProfit ? `₹${Number(data.athNetProfit).toLocaleString()} Cr.` : '-' },
               { label: '52W High', value: `₹${Number(data?.fiftyTwoWeekHigh || 0).toLocaleString()}` },
               { label: 'Beta', value: Number(data?.beta)?.toFixed(2) }
             ].map((item, i) => (
               <div key={i} className="space-y-0.5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                  <p className="text-xs font-black text-slate-900 uppercase leading-none">{item.value}</p>
               </div>
             ))}
          </section>
        </div>

        <div className={`lg:col-span-4 space-y-4 h-full transition-all duration-300 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
           <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-6">
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center">
                <Target className="h-4 w-4 mr-2" /> Valuation & Ownership
              </h3>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-xl border ${isPEOvervalued ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                       <p className={`text-[7px] font-black uppercase ${isPEOvervalued ? 'text-rose-400' : 'text-slate-500'}`}>Current PE</p>
                       <p className={`text-lg font-black leading-none ${isPEOvervalued ? 'text-rose-600' : 'text-slate-900'}`}>{peRatio.toFixed(1)}</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
                        <p className="text-[7px] font-black text-slate-500 uppercase">Median P/E (3Y / 5Y)</p>
                        <p className="text-lg font-black text-white leading-none font-mono">
                           {hasMedian ? `${avgMedian.toFixed(1)}x` : '—'}
                        </p>
                        {hasMedian && (
                           <p className="text-[6px] text-slate-500 leading-tight mt-0.5">
                              3Y: {pe3Y.toFixed(1)}x &middot; 5Y: {pe5Y.toFixed(1)}x
                           </p>
                        )}
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    {[
                      { label: 'Promoters', value: data?.shareholding?.promoter, color: 'bg-slate-900' },
                      { label: 'Institutional', value: (data?.shareholding?.fii || 0) + (data?.shareholding?.dii || 0), color: 'bg-slate-500' }
                    ].map((holder, idx) => (
                      <div key={idx} className="space-y-1">
                         <div className="flex justify-between items-center text-[9px] font-black">
                            <span className="text-slate-500 uppercase">{holder.label}</span>
                            <span className="text-slate-900">{holder.value?.toFixed(1)}%</span>
                         </div>
                         <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                            <div className={`h-full ${holder.color} rounded-full`} style={{ width: `${holder.value || 0}%` }} />
                         </div>
                      </div>
                    ))}
                    <div className="pt-2 flex flex-col">
                        <span className="text-[9px] font-black text-slate-900 uppercase">Smart Money Total</span>
                        <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{data?.shareholding?.smartMoneyTotal?.toFixed(2)}%</span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-3 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-widest italic">Research Hub</h3>
              <div className="grid grid-cols-1 gap-2">
                 <a href={`https://www.tradingview.com/symbols/NSE-${symbol}`} target="_blank" className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 group" rel="noreferrer">
                    <span className="text-[9px] font-black uppercase tracking-widest">Charts</span>
                    <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-white" />
                 </a>
                 <a href={`https://www.screener.in/company/${symbol}/consolidated/`} target="_blank" className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 group" rel="noreferrer">
                    <span className="text-[9px] font-black uppercase tracking-widest">Screener</span>
                    <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-white" />
                 </a>
              </div>
           </div>
        </div>

        {/* Lock Overlay */}
        {!isProOrAbove && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/10 backdrop-blur-[4px] p-6 rounded-2xl">
            <div className="bg-slate-950 text-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-800 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
               <div className="mx-auto w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-500 animate-pulse">
                  <Lock className="w-6 h-6" />
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white italic">PRO LICENSE REQUIRED</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                     Unlock deep fundamental analysis, institutional quality audits, valuation models, and active strategy indicators for <span className="text-blue-400 font-black">{symbol}</span>.
                  </p>
               </div>

               <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => setShowUpgrade(true)}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                  >
                     <Sparkles className="w-4 h-4 text-blue-200" /> Upgrade to Pro Execution
                  </button>
                  
                  <Link 
                    to="/license-desk"
                    className="block text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                  >
                     Compare Plans & Pricing
                  </Link>
               </div>

               <div className="border-t border-slate-800 pt-6 space-y-4">
                  <div className="space-y-1">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Have a Coupon or Voucher Code?</span>
                     <p className="text-[10px] text-slate-500">Redeem code for a 7-day free trial of all premium features.</p>
                  </div>
                  
                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       placeholder="Enter voucher (e.g. ALPHA7)..."
                       value={voucherCode}
                       onChange={(e) => setVoucherCode(e.target.value)}
                       className="flex-1 bg-slate-900 border border-slate-700 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white outline-none focus:border-blue-500"
                     />
                     <button
                       onClick={handleRedeemVoucher}
                       disabled={redeeming}
                       className="px-5 py-3 bg-white text-slate-950 hover:bg-slate-100 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                     >
                       {redeeming ? 'Applying...' : 'Apply'}
                     </button>
                  </div>

                  {voucherError && (
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">{voucherError}</p>
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
