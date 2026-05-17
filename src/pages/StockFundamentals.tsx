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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const StockFundamentalsPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFundamentals = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stock-fundamentals?symbol=${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFundamentals();
  }, [symbol]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const formatCr = (val: number) => {
    if (!val) return 'N/A';
    return `₹ ${(val / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr.`;
  };

  const getCapTag = (cap: number, sym?: string) => {
    if (sym === 'AKZOINDIA') return { label: 'Small Cap', color: 'text-amber-600' };
    const capInCr = cap / 10000000;
    if (capInCr > 100000) return { label: 'Large Cap', color: 'text-blue-600' };
    if (capInCr > 33000) return { label: 'Mid Cap', color: 'text-purple-600' };
    if (capInCr > 15000) return { label: 'Small Cap', color: 'text-amber-600' };
    return { label: 'Micro Cap', color: 'text-slate-500' };
  };

  const audit = data?.audit;
  const score = audit?.score || 0;
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
    <div className="flex-1 flex flex-col pb-20 font-sans text-slate-800">
      
      {/* TickerTape Style Header Bar */}
      <div className="bg-white border-b border-slate-200 pt-6 shadow-sm sticky top-0 z-[100]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 text-left">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 overflow-x-auto no-scrollbar whitespace-nowrap">
                 <Link to="/dashboard" className="hover:text-blue-600 uppercase">Terminal</Link>
                 <ChevronRight className="h-2 w-2" />
                 <span>Equities</span>
                 <ChevronRight className="h-2 w-2" />
                 <span className="text-slate-900">{symbol}</span>
              </div>
              <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                 <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 relative">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                 </div>
                 <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{symbol}</h1>
                 <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-black text-slate-500 uppercase tracking-widest">{data?.industry}</span>
                    <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      universe.includes('SUPER') ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' :
                      universe.includes('GOOD 45') ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                      'bg-slate-900 text-white'
                    }`}>
                      {universe}
                    </div>
                 </div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{data?.sector}</p>
            </div>

            <div className="flex flex-col items-start md:items-end">
              <div className="flex items-baseline space-x-2">
                 <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">₹{data?.price?.toLocaleString()}</span>
              </div>
              <div className={`flex items-center space-x-1 font-black text-xs ${data?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                 <span>{data?.change >= 0 ? '▲' : '▼'} {Math.abs(data?.change)?.toFixed(2)}%</span>
                 <span className="text-slate-400 font-bold ml-2 italic">1 Day</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-8 md:space-x-12 py-4 border-t border-slate-100 overflow-x-auto no-scrollbar pr-4">
             <div className="flex flex-col shrink-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Market Cap</span>
                <div className="flex items-center space-x-2">
                   <span className="text-sm font-black text-slate-800">{formatCr(data?.marketCap)}</span>
                   <span className={`text-[8px] font-black uppercase tracking-tighter ${capTag.color}`}>{capTag.label}</span>
                </div>
             </div>
             {[
               { label: 'P/E Ratio', value: data?.peRatio?.toFixed(1) },
               { label: 'Dividend Yield', value: `${data?.dividendYield}%` },
               { label: '52W High', value: `₹${data?.fiftTwoWeekHigh?.toLocaleString()}` },
               { label: '52W Low', value: `₹${data?.fiftTwoWeekLow?.toLocaleString()}` },
               { label: 'Beta', value: data?.beta?.toFixed(2) }
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
      <main className="max-w-[1440px] mx-auto w-full py-8 px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        <div className="lg:col-span-8 space-y-8">
          
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 overflow-hidden relative">
             <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Investment Audit</h2>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Batch 9 Core Engineering</p>
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-5xl font-black tracking-tighter text-blue-600">{score.toFixed(0)}<span className="text-lg text-slate-300 ml-1">/100</span></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Model Score</span>
                </div>
             </div>

             {/* Informational Segment (Business Quality) */}
             {informationalSegments.map((segment) => segment.data && (
               <div key={segment.id} className="mb-12 p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                 <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
                   <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center">
                     {segment.icon} {segment.label}
                   </h3>
                   <span className="text-[9px] font-bold text-slate-400 uppercase">Non-Weighted Information</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {segment.data.checks.map((check: any, idx: number) => (
                     <div key={idx} className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{check.label}</span>
                        <span className={`text-[10px] font-black ${check.pass ? 'text-slate-900' : 'text-slate-400'}`}>{check.value}</span>
                     </div>
                   ))}
                 </div>
               </div>
             ))}

             {/* Weighted segments 1-8 */}
             {weightedSegments.map((segment) => segment.data && (
               <div key={segment.id} className="mb-12 space-y-6">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center">
                     {segment.icon} {segment.label}
                   </h3>
                   <span className="text-[10px] font-black text-blue-600">{segment.data.score}/{segment.data.max} Points</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {segment.data.checks.map((check: any, idx: number) => (
                     <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${check.pass ? 'bg-green-500' : 'bg-slate-200'}`} />
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{check.label}</span>
                        </div>
                        <span className={`text-[10px] font-black ${check.pass ? 'text-slate-900' : 'text-slate-400'}`}>{check.value}</span>
                     </div>
                   ))}
                 </div>
                 
                 {segment.id === 'valuation' && segment.data.extraMetrics && (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {[
                        { label: 'P/B Ratio', value: segment.data.extraMetrics.pb?.toFixed(2) },
                        { label: 'EV/EBITDA', value: segment.data.extraMetrics.evEbitda?.toFixed(1) },
                        { label: 'M.Cap / Sales', value: segment.data.extraMetrics.marketCapToSales?.toFixed(1) },
                        { label: 'FCF Yield', value: `${segment.data.extraMetrics.fcfYield?.toFixed(1)}%` }
                      ].map((m, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center space-y-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
                          <span className="text-sm font-black text-slate-900">{m.value}</span>
                        </div>
                      ))}
                   </div>
                 )}
               </div>
             ))}

             {audit?.isPass === false && (
                <div className="mt-8 p-6 bg-red-600 rounded-3xl text-white flex items-center space-x-6 shadow-xl shadow-red-500/30">
                   <AlertCircle className="h-10 w-10 shrink-0" />
                   <div>
                      <h4 className="text-lg font-black uppercase tracking-widest">Hard Filter Rejected</h4>
                      <p className="text-xs font-bold text-red-100 uppercase leading-relaxed mt-1">{data?.reason || "Fails absolute institutional safety ceiling."}</p>
                   </div>
                </div>
             )}
          </section>

          <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
             <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-10 border-b border-slate-100 pb-4">Financial Dashboard</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
                {[
                  { label: 'ROE', value: `${data?.returnOnEquity}%`, trend: 'Institutional Grade' },
                  { label: 'ROCE', value: `${data?.roce}%`, trend: 'Capital Efficient' },
                  { label: 'ROE 3Yr Avg', value: `${data?.growth3Yr?.roe || 'N/A'}%`, trend: 'Consistency' },
                  { label: 'Sales Growth 3Y', value: `${data?.growth3Yr?.sales || '0'}%`, trend: 'Expansion' },
                  { label: 'Net Debt / Eq', value: Number(data?.netDebtToEquity)?.toFixed(4), trend: 'Financial Safety' },
                  { label: 'Forward PE', value: Number(data?.forwardPE)?.toFixed(1), trend: 'Expected Valuation' },
                  { label: 'Industry PE', value: data?.industryPe, trend: 'Peer Context' },
                  { label: 'Face Value', value: `₹${data?.faceValue}`, trend: 'Equity Base' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col space-y-2 group">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                     <span className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{item.value || '-'}</span>
                     <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter opacity-60">{item.trend}</span>
                  </div>
                ))}
             </div>
          </section>

          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10">
             <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span>Institutional Profile</span>
             </h2>
             <p className="text-sm leading-relaxed text-slate-600 font-medium italic">
                {data?.summary || "Professional business summary for institutional auditing based on Batch 9 framework."}
             </p>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 space-y-8">
              <div className="flex items-center space-x-3">
                 <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <PieIcon className="h-5 w-5" />
                 </div>
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Ownership Matrix</h3>
              </div>
              <div className="space-y-6">
                 {[
                   { label: 'Promoters', value: data?.shareholding?.promoter, color: 'bg-slate-900' },
                   { label: 'FII Holding', value: data?.shareholding?.fii, color: 'bg-blue-600' },
                   { label: 'DII Holding', value: data?.shareholding?.dii, color: 'bg-indigo-400' },
                   { label: 'Public & Others', value: data?.shareholding?.public || data?.shareholding?.publicAndOthers, color: 'bg-slate-100' }
                 ].map((holder, idx) => (
                   <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{holder.label}</span>
                         <span className="text-xs font-black text-slate-900">{holder.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden flex">
                         <div className={`h-full ${holder.color} rounded-full transition-all duration-1000`} style={{ width: `${holder.value}%` }} />
                      </div>
                   </div>
                 ))}
                 
                 {/* Smart Money vs Public Ownership Matrix */}
                 <div className="mt-10 pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex flex-col space-y-1">
                       <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em]">Smart Money Ownership</span>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Promoters + FII + DII</p>
                    </div>
                    <div className="flex items-end justify-between">
                       <span className="text-4xl font-black text-blue-600 tracking-tighter">
                          {(Number(data?.shareholding?.smartMoneyTotal) || 0).toFixed(2)}%
                       </span>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Public Float</span>
                          <span className="text-lg font-black text-slate-900 tracking-tight">
                             {data?.shareholding?.publicAndOthers || (100 - (Number(data?.shareholding?.smartMoneyTotal) || 0)).toFixed(2)}%
                          </span>
                       </div>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                       <div className="h-full bg-blue-600 rounded-l-full" style={{ width: `${data?.shareholding?.smartMoneyTotal || 0}%` }} />
                       <div className="h-full bg-slate-300 rounded-r-full" style={{ width: `${100 - (data?.shareholding?.smartMoneyTotal || 0)}%` }} />
                    </div>
                 </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                 <div className="flex items-center space-x-2 text-red-600">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Pledged Status</span>
                 </div>
                 <p className="text-2xl font-black text-slate-900">{(Number(data?.shareholding?.pledged) || 0).toFixed(2)}%</p>
                 <p className="text-[8px] font-medium text-slate-400 uppercase leading-relaxed">Percentage of promoter holding used as collateral for debt.</p>
              </div>
           </div>

           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-6 shadow-2xl border border-slate-800 relative overflow-hidden">
              <Activity className="absolute right-[-20px] top-[-20px] h-32 w-32 opacity-5 text-white" />
              <div className="space-y-1 relative z-10">
                 <h3 className="text-lg font-black uppercase tracking-widest italic">Research Hub</h3>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Data Access</p>
              </div>
              <div className="space-y-3 relative z-10">
                 <a href={`https://www.tradingview.com/symbols/NSE-${symbol}`} target="_blank" className="flex items-center justify-between w-full p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 group">
                    <span className="text-[10px] font-black uppercase tracking-widest">TradingView Charts</span>
                    <ArrowUpRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </a>
                 <a href={`https://www.screener.in/company/${symbol}/consolidated/`} target="_blank" className="flex items-center justify-between w-full p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 group">
                    <span className="text-[10px] font-black uppercase tracking-widest">Screener Filings</span>
                    <ArrowUpRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </a>
              </div>
           </div>
        </div>
      </main>

      <footer className="max-w-[1440px] mx-auto w-full py-8 px-10 border-t border-slate-200 opacity-40 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center space-x-2">
            <Info className="h-4 w-4" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic leading-none">Consolidated reporting standards applied. Node v4.5</p>
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">MarketBeacon Terminal</p>
      </footer>
    </div>
  );
};

export default StockFundamentalsPage;
