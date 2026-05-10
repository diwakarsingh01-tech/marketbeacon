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

  const calculateScoring = () => {
    if (!data) return { score: 0, hardReject: false, checks: [], universe: 'REJECT' };
    const pe = parseFloat(data.peRatio);
    const netDebtEq = parseFloat(data.netDebtToEquity);
    const roe = parseFloat(data.returnOnEquity);
    const roce = parseFloat(data.roce);
    const pe5y = parseFloat(data.peComparison?.fiveYearAvg);

    // FIXED LOGIC: PE < Historical Average is GOOD (PASS)
    const isPEValid = pe > 0 && pe <= 70;
    const isPECheap = pe < pe5y;
    const isDebtValid = netDebtEq < 0.2;
    const hardReject = !isPEValid || !isDebtValid;

    const checks = [
      { category: 'Quality', label: 'Positive Rev Growth', pass: parseFloat(data.revenueGrowth) > 0, value: `${data.revenueGrowth}%` },
      { category: 'Quality', label: 'Positive EPS Growth', pass: parseFloat(data.epsGrowth) > 0, value: `${data.epsGrowth}%` },
      { category: 'Safety', label: 'Net Debt/Equity < 0.2', pass: isDebtValid, value: data.netDebtToEquity },
      { category: 'Efficiency', label: 'ROE > 15%', pass: roe > 15, value: `${data.returnOnEquity}%` },
      { category: 'Efficiency', label: 'ROCE > 15%', pass: roce > 15, value: `${data.roce}%` },
      { category: 'Valuation', label: 'PE < 70', pass: isPEValid, value: data.peRatio?.toFixed(1) },
      { category: 'Valuation', label: 'PE < 5Y Median', pass: isPECheap, value: data.peRatio?.toFixed(1) },
      { category: 'Governance', label: 'Promoter > 40%', pass: parseFloat(data.shareholding?.promoter) > 40, value: `${data.shareholding?.promoter}%` },
      { category: 'Governance', label: 'Pledged Shares == 0', pass: parseFloat(data.shareholding?.pledged) === 0, value: `${data.shareholding?.pledged}%` }
    ];

    const passedCount = checks.filter(c => c.pass).length;
    let score = (passedCount / checks.length) * 100;
    if (hardReject) score = Math.min(score, 50);

    // UPDATED UNIVERSE NAMES
    let universe = 'WATCH ONLY';
    if (!hardReject) {
      if (score >= 85) universe = 'BLUECHIP';
      else if (score >= 70) universe = 'HIGH BETA';
      else if (score >= 55) universe = 'PROFIT PRUDENCE';
    }

    return { score, hardReject, checks, universe };
  };

  const model = calculateScoring();

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const formatCr = (val: number) => {
    if (!val) return 'N/A';
    return `₹ ${(val / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr.`;
  };

  return (
    <div className="flex-1 flex flex-col pb-20 font-sans text-slate-800">
      
      {/* TickerTape Style Header Bar - FIXED OVERLAP */}
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
                 <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">{symbol}</h1>
                 <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-black text-slate-500 uppercase tracking-widest">{data?.industry}</span>
                    <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      model.universe === 'BLUECHIP' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' :
                      model.universe === 'HIGH BETA' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' :
                      'bg-slate-900 text-white'
                    }`}>
                      {model.universe}
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
             {[
               { label: 'Market Cap', value: formatCr(data?.marketCap) },
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

      {/* Main Content - No overlap from behind */}
      <main className="max-w-[1440px] mx-auto w-full py-8 px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        <div className="lg:col-span-8 space-y-8">
          
          <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 overflow-hidden relative">
             <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Investment Checklist</h2>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Core Engineering Audit</p>
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-5xl font-black tracking-tighter text-blue-600">{model.score.toFixed(0)}<span className="text-lg text-slate-300 ml-1">/100</span></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Model Score</span>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {model.checks.map((check, idx) => (
                  <div key={idx} className="flex items-start justify-between py-4 border-b border-slate-50 last:border-0 group">
                     <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-xl transition-all ${check.pass ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                           {check.pass ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{check.label}</span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{check.category}</span>
                        </div>
                     </div>
                     <div className="flex flex-col items-end text-right">
                        <span className={`text-xs font-black ${check.pass ? 'text-green-600' : 'text-red-500'}`}>{check.value}</span>
                        {check.label === 'PE < 5Y Median' && (
                           <span className={`text-[8px] font-bold uppercase italic ${check.pass ? 'text-green-500' : 'text-slate-400'}`}>
                              {check.pass ? 'Cheap vs History' : 'Expensive vs History'}
                           </span>
                        )}
                     </div>
                  </div>
                ))}
             </div>

             {model.hardReject && (
                <div className="mt-8 p-6 bg-red-600 rounded-3xl text-white flex items-center space-x-6 shadow-xl shadow-red-500/30">
                   <AlertCircle className="h-10 w-10 shrink-0" />
                   <div>
                      <h4 className="text-lg font-black uppercase tracking-widest">Hard Filter Rejected</h4>
                      <p className="text-xs font-bold text-red-100 uppercase leading-relaxed mt-1">Fails absolute institutional safety (Debt/Equity or Valuation Ceiling).</p>
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
                  { label: 'ROE 3Yr Avg', value: `${data?.growth3Yr?.roe}%`, trend: 'Consistency' },
                  { label: 'Sales Growth 3Y', value: `${data?.growth3Yr?.sales}%`, trend: 'Expansion' },
                  { label: 'Net Debt / Eq', value: data?.netDebtToEquity, trend: 'Financial Safety' },
                  { label: 'Forward PE', value: data?.forwardPE?.toFixed(1), trend: 'Expected Valuation' },
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
                   { label: 'Public & Others', value: data?.shareholding?.public, color: 'bg-slate-100' }
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
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                 <div className="flex items-center space-x-2 text-red-600">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Pledged Status</span>
                 </div>
                 <p className="text-2xl font-black text-slate-900">{data?.shareholding?.pledged}%</p>
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
