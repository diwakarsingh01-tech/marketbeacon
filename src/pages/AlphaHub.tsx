import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  PieChart, 
  Target, 
  RefreshCw, 
  ChevronRight, 
  Activity,
  ArrowUpRight,
  Database,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { Download } from 'lucide-react';
const API_URL = getApiUrl();

const AlphaHubPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCapital, setTotalCapital] = useState<number>(200000);
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');

  const handleExportAlpha = () => {
    if (!data?.stocks?.length) return;
    const headers = ['Symbol', 'Sector', 'Cap', 'Strategy', 'Audit Score', 'Smart Money %', 'Entry Price', 'Target', 'ROI%', 'Allocation (Qty)'];
    const rows = data.stocks.map((s: any) => [
      s.symbol,
      s.sector,
      s.capType,
      s.strategy,
      s.score,
      s.smartMoney,
      s.entryPrice,
      s.target,
      Number(s.roi)?.toFixed(2),
      calculateQuantity(s)
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `AlphaHub_Portfolio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const fetchAlphaHub = async () => {
    if (!API_URL || API_URL.includes('missing-backend')) {
       setError("System Configuration Error: VITE_API_URL is missing or invalid in Vercel settings.");
       setLoading(false);
       return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('mb_token');
      const res = await fetch(`${API_URL}/api/backtest/alpha-40`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        setData(data);
      } else {
        setError(data.error || 'Failed to sync Alpha Hub');
      }
    } catch (e) {
      setError('Connection failed. Please ensure backend is reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlphaHub();
  }, []);

  const calculateQuantity = (stock: any) => {
    if (!totalCapital || totalCapital < 200000) return 0;
    
    // Rule: 50-30-20 contribution
    let perStockBudget = 0;
    if (stock.capType === 'LARGE') perStockBudget = (totalCapital * 0.50) / 25; 
    else if (stock.capType === 'MID') perStockBudget = (totalCapital * 0.30) / 15; 
    else perStockBudget = (totalCapital * 0.20) / 10; 

    if (perStockBudget < 2000) return 0;
    return Math.floor(perStockBudget / (stock.entryPrice || stock.currentPrice || 1));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6 text-center px-4 bg-[#f8fafc]">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
        <div className="space-y-2">
           <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Elite 50-30-20 Portfolio Sync</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Optimizing Sector Exposure & Growth Allocation</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center space-y-6 flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
         <div className="bg-red-50 p-8 rounded-[3.5rem] inline-block border border-red-100 max-w-xl shadow-xl">
            <h2 className="text-red-600 font-black uppercase tracking-widest text-sm mb-4">Alpha Hub Connection Error</h2>
            <p className="text-red-500 text-xs font-bold leading-relaxed">{error}</p>
         </div>
         <button onClick={fetchAlphaHub} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-black">Retry Deployment</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-32 bg-[#f8fafc] min-h-screen overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-3">
           <div className="flex items-center space-x-3 text-slate-900">
              <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                 <Shield className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Elite Portfolio v11.5</span>
           </div>
           <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Alpha Hub</h1>
           <p className="text-xs md:text-sm text-slate-500 font-medium max-w-xl leading-relaxed">
             Institutional Portfolio managed by the **50-30-20 Rule** and **20% Sector Limit**.
           </p>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 shadow-2xl space-y-4 min-w-[300px] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl -mr-12 -mt-12 group-hover:bg-white/10 transition-all" />
           <div className="flex justify-between items-center text-slate-500 relative z-10">
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Investment Simulator</span>
              <Target className="h-4 w-4" />
           </div>
           <div className="space-y-3 relative z-10">
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">₹</span>
                 <input
                   type="text"
                   value={totalCapital ? totalCapital.toLocaleString('en-IN') : ''}
                   onChange={(e) => {
                     const rawValue = e.target.value.replace(/,/g, '');
                     if (!isNaN(Number(rawValue)) && rawValue !== '') {
                       setTotalCapital(Number(rawValue));
                     } else if (rawValue === '') {
                       setTotalCapital(0);
                     }
                   }}
                   className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl pl-8 pr-4 py-3 text-xl font-black text-white focus:border-white transition-all outline-none"
                 />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-slate-800 shadow-2xl">
            <div className="relative z-10 space-y-6">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Assets</span>
                  <Layers className="h-4 w-4 text-slate-600" />
               </div>
               <div className="space-y-1">
                  <h3 className="text-4xl font-black tracking-tighter">{data?.summary?.total || 0}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Stocks</p>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Cap Allocation</span>
               <PieChart className="h-4 w-4" />
            </div>
            <div className="space-y-3">
               <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-900">L: {data?.summary?.large || 0} | M: {data?.summary?.mid || 0} | S: {data?.summary?.small || 0}</span>
               </div>
               <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-50">
                  <div className="h-full bg-slate-900" style={{ width: `${((data?.summary?.large || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${((data?.summary?.mid || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-slate-300" style={{ width: `${((data?.summary?.small || 0) / (data?.summary?.total || 1)) * 100}%` }} />
               </div>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center italic">Institutional 50-30-20 Mix</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Closed Accuracy</span>
               <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="space-y-1">
               <h3 className="text-4xl font-black tracking-tighter text-emerald-600">{data?.summary?.accuracy || 100}%</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Targets Achieved</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Exposure Guard</span>
               <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="space-y-1">
               <h3 className="text-3xl font-black tracking-tighter text-emerald-600">Active</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max 20% Per Sector</p>
            </div>
         </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-2 rounded-[2rem] border border-slate-100 w-fit shadow-sm">
         <button 
           onClick={() => setActiveTab('active')}
           className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
         >
           Alpha Portfolio
         </button>
         <button 
           onClick={() => setActiveTab('closed')}
           className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'closed' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
         >
           Profit Audit
         </button>
      </div>

      {activeTab === 'active' ? (
        <div className="space-y-12">
          {['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'].map(basket => {
            const basketStocks = (data?.stocks || []).filter((s: any) => s.basketSource === basket);
            if (basketStocks.length === 0) return null;

            return (
              <div key={basket} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{basket.replace('_', ' ')}</h2>
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">{basketStocks.length} Stocks</span>
                 </div>

                 <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Obs Date</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asset & Sector</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Cap Tier</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Strategy</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fundamentals</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Entry</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Target</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-emerald-600 text-right">ROI%</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Quantity</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {basketStocks.map((stock: any) => {
                          const qty = calculateQuantity(stock);
                          return (
                            <tr key={stock.symbol} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4 text-[10px] font-black text-slate-400 whitespace-nowrap">
                                 {stock.entryTime ? new Date(stock.entryTime).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '-'}
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{stock.symbol}</span>
                                        {stock.stockName && stock.stockName !== stock.symbol && (
                                            <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={stock.stockName}>{stock.stockName}</span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stock.sector}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${stock.capType === 'LARGE' ? 'bg-indigo-50 text-indigo-600' : (stock.capType === 'MID' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600')}`}>
                                    {stock.capType}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">{stock.strategy}</span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col space-y-1">
                                    <div className="flex items-center space-x-2">
                                       <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                                          <div className="h-full bg-emerald-500" style={{ width: `${stock.smartMoney}%` }} />
                                       </div>
                                       <span className="text-[9px] font-black text-slate-700">SM: {stock.smartMoney?.toFixed(1)}%</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audit Score: {stock.score}/100</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="font-mono text-xs font-bold text-slate-600">₹{stock.entryPrice?.toLocaleString('en-IN') || stock.currentPrice?.toLocaleString('en-IN')}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="font-mono text-xs font-black text-emerald-600">₹{stock.target?.toLocaleString('en-IN') || '-'}</div>
                              </td>
                              <td className="px-6 py-4 text-sm font-black text-emerald-600 text-right">+{Number(stock.roi)?.toFixed(1)}%</td>
                              <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{qty}</td>
                              <td className="px-6 py-4 text-center">
                                 <Link to={`/stock/${stock.symbol}`} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all mx-auto shadow-sm">
                                   <ArrowUpRight className="h-4 w-4" />
                                 </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                 </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exit Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset & Sector</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">ROI%</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">Est. P/L</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.closedTrades?.map((trade: any) => {
                    const estQty = 200000 / 40 / trade.entryPrice; 
                    const profitValue = Math.round(estQty * (trade.targetPrice - trade.entryPrice));
                    return (
                      <tr key={`${trade.symbol}-${trade.exitDate}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-[10px] font-black text-slate-400">{new Date(trade.exitDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{trade.symbol}</span>
                                  {trade.stockName && trade.stockName !== trade.symbol && (
                                      <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={trade.stockName}>{trade.stockName}</span>
                                  )}
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{trade.sector}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase">{trade.strategy}</td>
                        <td className="px-8 py-5 text-sm font-black text-emerald-600">+{Number(trade.roi).toFixed(1)}%</td>
                        <td className="px-8 py-5 text-sm font-black text-emerald-600">₹{profitValue.toLocaleString()}</td>
                        <td className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <div className="flex items-center space-x-2">
                              <Clock className="h-3 w-3" />
                              <span>{trade.days} Trading Days</span>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(!data?.closedTrades || data.closedTrades.length === 0) && (
                <div className="p-20 text-center space-y-4">
                   <Briefcase className="h-12 w-12 text-slate-100 mx-auto" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No closed trades in current audit cycle</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default AlphaHubPage;
