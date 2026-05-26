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
  Briefcase
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
    const headers = ['Symbol', 'Basket', 'Strategy', 'Entry Price', 'Target', 'ROI%', 'Allocation (Qty)'];
    const rows = data.stocks.map((s: any) => [
      s.symbol,
      s.basketSource,
      s.strategy,
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
    const capCr = (Number(stock.marketCap) || 0) / 10000000;
    let perStockBudget = 0;
    if (capCr >= 20000) perStockBudget = (totalCapital * 0.50) / 20; 
    else if (capCr >= 5000) perStockBudget = (totalCapital * 0.30) / 12; 
    else perStockBudget = (totalCapital * 0.20) / 8; 
    if (perStockBudget < 5000) return 0;
    return Math.floor(perStockBudget / (stock.entryPrice || stock.currentPrice || 1));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6 text-center px-4 bg-[#f8fafc]">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
        <div className="space-y-2">
           <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Elite Portfolio Initializing</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Recalculating 10-Strategy Matrix across 300+ Stocks</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center space-y-6 flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
         <div className="bg-red-50 p-8 rounded-[3.5rem] inline-block border border-red-100 max-w-xl shadow-xl">
            <h2 className="text-red-600 font-black uppercase tracking-widest text-sm mb-4">Alpha Hub Connection Error</h2>
            <div className="space-y-4 text-left">
               <p className="text-red-500 text-xs font-bold leading-relaxed">{error}</p>
            </div>
         </div>
         <button onClick={fetchAlphaHub} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-black">Retry Deployment</button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 lg:p-16 max-w-7xl mx-auto space-y-12 pb-32 bg-[#f8fafc] min-h-screen overflow-y-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-slate-100 pb-12">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-slate-900">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                 <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em]">Elite Portfolio</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Alpha Hub</h1>
           <p className="text-sm md:text-lg text-slate-500 font-medium max-w-xl leading-relaxed">
             Top 40-60 institutional picks with 70% Smart Money and 20% Sector Exposure Limit.
           </p>
        </div>
        
        <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl space-y-5 min-w-[340px] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
           <div className="flex justify-between items-center text-slate-500 relative z-10">
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Investment Simulator</span>
              <Target className="h-4 w-4" />
           </div>
           <div className="space-y-3 relative z-10">
              <div className="relative">
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">₹</span>
                 <input 
                   type="number" 
                   value={totalCapital}
                   onChange={(e) => setTotalCapital(Number(e.target.value))}
                   className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl pl-10 pr-6 py-5 text-2xl font-black text-white focus:border-white transition-all outline-none"
                 />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-slate-800 shadow-2xl">
            <div className="relative z-10 space-y-6">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Scale</span>
                  <Database className="h-4 w-4 text-slate-600" />
               </div>
               <div className="space-y-1">
                  <h3 className="text-4xl font-black tracking-tighter">{data?.summary?.total || 0}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qualified Assets</p>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Cap Distribution</span>
               <PieChart className="h-4 w-4" />
            </div>
            <div className="space-y-3">
               <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-900">L-M-S</span>
                  <span className="text-xs font-black text-slate-900">{data?.summary?.large || 0}-{data?.summary?.mid || 0}-{data?.summary?.small || 0}</span>
               </div>
               <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-50">
                  <div className="h-full bg-slate-900" style={{ width: `${((data?.summary?.large || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-slate-600" style={{ width: `${((data?.summary?.mid || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-slate-400" style={{ width: `${((data?.summary?.small || 0) / (data?.summary?.total || 1)) * 100}%` }} />
               </div>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center italic">Institutional Exposure Rule</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Strategy Accuracy</span>
               <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="space-y-1">
               <h3 className="text-4xl font-black tracking-tighter text-emerald-600">{data?.summary?.accuracy || 100}%</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Verified</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Avg Upside</span>
               <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-3xl font-black tracking-tighter text-emerald-600">+{Number(data?.summary?.avgRoi || 0).toFixed(1)}%</h3>
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
                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">{basketStocks.length} Assets</span>
                 </div>

                 <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Obs Date</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">ROI%</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Allocation (Qty)</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {basketStocks.map((stock: any) => {
                          const qty = calculateQuantity(stock);
                          return (
                            <tr key={stock.symbol} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-5 text-[10px] font-black text-slate-400 whitespace-nowrap">
                                 {stock.entryTime ? new Date(stock.entryTime).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{stock.symbol}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stock.sector}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">{stock.strategy}</span>
                              </td>
                              <td className="px-8 py-5 text-sm font-black text-slate-900">₹{Number(stock.entryPrice)?.toLocaleString()}</td>
                              <td className="px-8 py-5 text-sm font-black text-slate-900">₹{Number(stock.target)?.toLocaleString()}</td>
                              <td className="px-8 py-5 text-sm font-black text-emerald-600">+{Number(stock.roi)?.toFixed(1)}%</td>
                              <td className="px-8 py-5 text-sm font-black text-slate-900">{qty}</td>
                              <td className="px-8 py-5 text-right">
                                 <Link to={`/stock/${stock.symbol}`} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all inline-flex items-center shadow-lg shadow-slate-200">
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
           <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exit Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">ROI%</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.closedTrades?.map((trade: any) => (
                    <tr key={`${trade.symbol}-${trade.exitDate}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-[10px] font-black text-slate-400">{new Date(trade.exitDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-8 py-5">
                         <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{trade.symbol}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{trade.sector}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase">{trade.strategy}</td>
                      <td className="px-8 py-5 text-sm font-black text-emerald-600">+{Number(trade.roi).toFixed(1)}%</td>
                      <td className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{trade.days} Trading Days</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center w-fit">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Target Hit
                         </span>
                      </td>
                    </tr>
                  ))}
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
