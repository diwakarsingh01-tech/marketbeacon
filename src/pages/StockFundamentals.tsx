import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  X,
  Target,
  ExternalLink,
  Info,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  PieChart as PieIcon,
  Activity,
  ArrowUpRight
} from 'lucide-react';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

const StockFundamentalsPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFundamentals = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stock-fundamentals?symbol=${symbol}&t=${Date.now()}`);
        const result = await safeJsonParse(response);
        if (response.ok && !result.error) {
          setData(result);
        } else {
          console.error('Fetch Error:', result.error);
        }
      } catch (e) {
        console.error('Failed to fetch fundamentals', e);
      } finally {
        setLoading(false);
      }
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
    if (isNaN(n) || n === 0) return 'N/A';
    return `₹ ${(n / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr.`;
  };

  const getCapTag = (cap: any, sym?: string) => {
    if (sym === 'AKZOINDIA' || sym === 'SANOFI' || sym === 'WHIRLPOOL') return { label: 'Small Cap', color: 'text-amber-600' };
    const n = Number(cap);
    if (isNaN(n) || n === 0) return { label: 'N/A', color: 'text-slate-400' };
    const capInCr = n / 10000000;
    if (capInCr > 65000) return { label: 'Large Cap', color: 'text-slate-900' };
    if (capInCr > 20000) return { label: 'Mid Cap', color: 'text-blue-600' };
    return { label: 'Small Cap', color: 'text-amber-600' };
  };

  const audit = data?.audit || {};
  const score = Number(audit?.score) || 0;
  const universe = audit?.universe || 'WATCHLIST';
  const capTag = getCapTag(data?.marketCap, symbol);

  const informationalSegments = [
    { id: 'business', label: 'Business Profile (Informational)', data: audit?.businessQuality, icon: <ShieldCheck className="h-3 w-3 mr-2 text-blue-600" /> }
  ];

  const weightedSegments = [
    { id: 'profitability', label: 'Segment 1: Profitability Quality', data: audit?.profitabilityQuality, icon: <TrendingUp className="h-3 w-3 mr-2 text-blue-600" /> },
    { id: 'balanceSheet', label: 'Segment 2: Balance Sheet Safety', data: audit?.balanceSheetSafety, icon: <ShieldCheck className="h-3 w-3 mr-2 text-blue-600" /> },
    { id: 'growth', label: 'Segment 3: Growth Quality', data: audit?.growthQuality, icon: <Activity className="h-3 w-3 mr-2 text-blue-600" /> },
    { id: 'valuation', label: 'Segment 4: Valuation & History', data: audit?.valuationConsistency, icon: <Target className="h-3 w-3 mr-2 text-blue-600" /> },
    { id: 'efficiency', label: 'Segment 5: Efficiency & Governance', data: audit?.efficiencyGovernance, icon: <Activity className="h-3 w-3 mr-2 text-blue-600" /> },
    { id: 'cashflow', label: 'Segment 6: Cash Flow Quality', data: audit?.cashFlowQuality, icon: <Activity className="h-3 w-3 mr-2 text-blue-600" /> },
    { id: 'margin', label: 'Segment 7: Margin Resilience', data: audit?.marginResilience, icon: <TrendingUp className="h-3 w-3 mr-2 text-blue-600" /> },
    { id: 'consistency', label: 'Segment 8: Historical Consistency', data: audit?.historicalConsistency, icon: <ShieldCheck className="h-3 w-3 mr-2 text-blue-600" /> }
  ];

  return (
    <div className="flex-1 flex flex-col pb-20 font-sans text-slate-800 bg-[#f8fafc]">
      
      {/* TickerTape Style Header Bar */}
      <div className="bg-white border-b border-slate-200 pt-6 shadow-sm sticky top-0 z-[100]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 text-left">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                 <Link to="/dashboard" className="hover:text-blue-600">Terminal</Link>
                 <ChevronRight className="h-2 w-2" />
                 <span className="text-slate-900">{symbol}</span>
              </div>
              <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                 <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{symbol}</h1>
                 <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-black text-slate-500 uppercase tracking-widest">{data?.industry || 'General'}</span>
                    <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      universe.includes('SUPER') ? 'bg-slate-900 text-white' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {universe}
                    </div>
                 </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">₹{data?.price?.toLocaleString() || '-'}</span>
              <div className={`flex items-center space-x-1 font-black text-xs ${Number(data?.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                 <span>{Number(data?.change) >= 0 ? '▲' : '▼'} {Math.abs(Number(data?.change) || 0).toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-8 md:space-x-12 py-4 border-t border-slate-100 overflow-x-auto no-scrollbar">
             <div className="flex flex-col shrink-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Market Cap</span>
                <div className="flex items-center space-x-2">
                   <span className="text-sm font-black text-slate-800">{formatCr(data?.marketCap)}</span>
                   <span className={`text-[8px] font-black uppercase tracking-tighter ${capTag.color}`}>{capTag.label}</span>
                </div>
             </div>
             {[
               { label: 'P/E Ratio', value: Number(data?.peRatio)?.toFixed(1) || 'N/A' },
               { label: 'Dividend Yield', value: `${data?.dividendYield || 0}%` },
               { label: '52W High', value: `₹${data?.fiftyTwoWeekHigh?.toLocaleString() || '-'}` },
               { label: '52W Low', value: `₹${data?.fiftyTwoWeekLow?.toLocaleString() || '-'}` },
               { label: 'Beta', value: Number(data?.beta)?.toFixed(2) || '1.0' }
             ].map((m, i) => (
               <div key={i} className="flex flex-col shrink-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{m.label}</span>
                  <span className="text-sm font-black text-slate-800">{m.value}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto w-full py-8 px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        <div className="lg:col-span-8 space-y-8">
          
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 md:p-10">
             <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest leading-none">Investment Audit</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batch 9 Core Engineering</p>
                   {data?.audit?.reason && (
                     <div className="mt-4 inline-block px-4 py-1.5 bg-slate-900 text-white rounded-lg">
                        <p className="text-[10px] font-black uppercase tracking-widest">{data.audit.reason}</p>
                     </div>
                   )}
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-5xl font-black tracking-tighter text-slate-900">{score.toFixed(0)}<span className="text-lg text-slate-300 ml-1">/100</span></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Model Score</span>
                </div>
             </div>

             {/* Informational Segment */}
             {informationalSegments.map((segment) => segment.data && (
               <div key={segment.id} className="mb-12 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center mb-6">
                   {segment.icon} {segment.label}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {(segment.data.checks || []).map((check: any, idx: number) => (
                     <div key={idx} className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{check.label}</span>
                        <span className={`text-[10px] font-black ${check.pass ? 'text-slate-900' : 'text-slate-400'}`}>{check.value}</span>
                     </div>
                   ))}
                 </div>
               </div>
             ))}

             {/* Weighted segments */}
             {weightedSegments.map((segment) => segment.data && (
               <div key={segment.id} className="mb-12 space-y-6">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                     {segment.icon} {segment.label}
                   </h3>
                   <span className="text-[10px] font-black text-slate-400">{segment.data.score}/{segment.data.max} Points</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {(segment.data.checks || []).map((check: any, idx: number) => (
                     <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${check.pass ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{check.label}</span>
                        </div>
                        <span className={`text-[10px] font-black ${check.pass ? 'text-slate-900' : 'text-slate-400'}`}>{check.value}</span>
                     </div>
                   ))}
                 </div>
               </div>
             ))}
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 border-b border-slate-100 pb-4">Financial Dashboard</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
                {[
                  { label: 'ROE', value: data?.returnOnEquity ? `${Number(data.returnOnEquity).toFixed(1)}%` : '-', trend: 'Institutional Grade' },
                  { label: 'ROCE', value: data?.roce ? `${Number(data.roce).toFixed(1)}%` : '-', trend: 'Capital Efficient' },
                  { label: 'ATH Sales', value: data?.athSales ? `₹${Number(data.athSales).toLocaleString()} Cr` : '-', trend: 'Peak Performance' },
                  { label: 'ATH Net Profit', value: data?.athNetProfit ? `₹${Number(data.athNetProfit).toLocaleString()} Cr` : '-', trend: 'Profitability High' },
                  { label: 'Sales Growth 3Y', value: data?.growth3Yr?.sales ? `${data.growth3Yr.sales}%` : '0%', trend: 'Expansion' },
                  { label: 'Net Debt / Eq', value: data?.netDebtToEquity !== undefined ? Number(data.netDebtToEquity).toFixed(2) : 'NaN', trend: 'Financial Safety' },
                  { label: 'Forward PE', value: data?.forwardPE ? Number(data.forwardPE).toFixed(1) : 'NaN', trend: 'Expected Valuation' },
                  { label: 'Audit Score', value: `${score}/100`, trend: 'Institutional Rank' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col space-y-2 group p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                     <span className="text-xl font-black text-slate-900 tracking-tight">{item.value || '-'}</span>
                     <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter opacity-40 group-hover:opacity-100">{item.trend}</span>
                  </div>
                ))}
             </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
           {/* PE Valuation Matrix */}
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
              <div className="flex justify-between items-center">
                 <div className="space-y-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                      <Target className="h-4 w-4 mr-2" /> Valuation Matrix
                    </h3>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-6">Institutional PE Audit</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                       <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Current PE</p>
                       <p className="text-2xl font-black text-slate-900 leading-none">{Number(data?.peRatio || 0).toFixed(1)}</p>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-[2rem] border border-slate-800 flex flex-col justify-center text-center">
                       <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Avg Median</p>
                       <p className="text-xl font-black text-white leading-none">
                          {((Number(data?.peMedians?.pe3Y||0) + Number(data?.peMedians?.pe5Y||0) + Number(data?.peMedians?.pe10Y||0))/3).toFixed(1)}
                       </p>
                    </div>
                 </div>

                 <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50 text-center">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${Number(data?.peRatio) < ((Number(data?.peMedians?.pe3Y||0) + Number(data?.peMedians?.pe5Y||0) + Number(data?.peMedians?.pe10Y||0))/3) ? 'text-emerald-600' : 'text-orange-600'}`}>
                       {Number(data?.peRatio) < ((Number(data?.peMedians?.pe3Y||0) + Number(data?.peMedians?.pe5Y||0) + Number(data?.peMedians?.pe10Y||0))/3) ? '▼ Trading Below Average' : '▲ Trading Above Average'}
                    </p>
                 </div>
                 <div className="space-y-3 px-1">
                    {[
                      { label: '3-Yr Median', val: data?.peMedians?.pe3Y },
                      { label: '5-Yr Median', val: data?.peMedians?.pe5Y },
                      { label: '10-Yr Median', val: data?.peMedians?.pe10Y }
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between group">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{row.label}</span>
                         <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-black text-slate-900">{Number(row.val || 0).toFixed(1)}</span>
                            <div className="w-20 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                               <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${Math.min(100, (Number(data?.peRatio)/(Number(row.val)||1))*50)}%` }} />
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-10 space-y-8">              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                 <PieIcon className="h-4 w-4 mr-2" /> Ownership Matrix
              </h3>
              <div className="space-y-6">
                 {[
                   { label: 'Promoters', value: data?.shareholding?.promoter, color: 'bg-slate-900' },
                   { label: 'FII Holding', value: data?.shareholding?.fii, color: 'bg-slate-600' },
                   { label: 'DII Holding', value: data?.shareholding?.dii, color: 'bg-slate-400' },
                   { label: 'Public & Others', value: data?.shareholding?.public || data?.shareholding?.publicAndOthers, color: 'bg-slate-100' }
                 ].map((holder, idx) => (
                   <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{holder.label}</span>
                         <span className="text-xs font-black text-slate-900">{holder.value || 0}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden flex">
                         <div className={`h-full ${holder.color} rounded-full`} style={{ width: `${holder.value || 0}%` }} />
                      </div>
                   </div>
                 ))}
                 
                 <div className="mt-10 pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-end justify-between">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-900 uppercase">Smart Money</span>
                          <span className="text-3xl font-black text-slate-900 tracking-tighter">{(Number(data?.shareholding?.smartMoneyTotal) || 0).toFixed(2)}%</span>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase block">Public</span>
                          <span className="text-lg font-black text-slate-400">{(100 - (Number(data?.shareholding?.smartMoneyTotal) || 0)).toFixed(2)}%</span>
                       </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                       <div className="h-full bg-slate-900" style={{ width: `${data?.shareholding?.smartMoneyTotal || 0}%` }} />
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
              <Activity className="absolute right-[-20px] top-[-20px] h-32 w-32 opacity-5" />
              <h3 className="text-lg font-black uppercase tracking-widest italic leading-none">Research Hub</h3>
              <div className="space-y-3 relative z-10">
                 <a href={`https://www.tradingview.com/symbols/NSE-${symbol}`} target="_blank" className="flex items-center justify-between w-full p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 group">
                    <span className="text-[10px] font-black uppercase tracking-widest">TradingView Charts</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                 </a>
                 <a href={`https://www.screener.in/company/${symbol}/consolidated/`} target="_blank" className="flex items-center justify-between w-full p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 group">
                    <span className="text-[10px] font-black uppercase tracking-widest">Screener Filings</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                 </a>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default StockFundamentalsPage;
