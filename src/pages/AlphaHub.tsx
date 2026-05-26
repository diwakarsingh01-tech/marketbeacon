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
  LayoutGrid
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
    link.download = `Alpha40_Audit_${new Date().toISOString().split('T')[0]}.csv`;
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

  // --- Pro Allocation Logic: 50-30-20 Weighted ---
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
           <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Alpha-40 Core Initializing</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Auditing 500+ Stocks across 10-Strategy Matrix</p>
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
               <div className="bg-white/50 p-4 rounded-2xl border border-red-100 font-mono text-[9px] text-slate-600 break-all">
                  <p className="mb-1 font-black uppercase text-slate-400">Diagnostic Info:</p>
                  <p>Target API: {API_URL}</p>
                  <p>Origin: {window.location.origin}</p>
               </div>
            </div>
         </div>
         <div className="flex items-center justify-center space-x-3">
            <button onClick={fetchAlphaHub} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-black">Retry Deployment</button>
            <Link 
              to="/connect"
              className="px-6 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all shadow-sm flex items-center"
            >
              Fix Connectivity
            </Link>
         </div>
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
              <span className="text-[11px] font-black uppercase tracking-[0.4em]">Strategic Hub</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Alpha-40</h1>
           <p className="text-sm md:text-lg text-slate-500 font-medium max-w-xl leading-relaxed">
             Top 40 institutional picks mapped to the 50-30-20 rule. Minimum ₹2L capital required.
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
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic text-center">50-30-20 Weightage Active</p>
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qualified Stocks</p>
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
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">L-M-S</span>
                  <span className="text-xs font-black text-slate-900">{data?.summary?.large || 0}-{data?.summary?.mid || 0}-{data?.summary?.small || 0}</span>
               </div>
               <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-50">
                  <div className="h-full bg-slate-900" style={{ width: `${((data?.summary?.large || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-slate-600" style={{ width: `${((data?.summary?.mid || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-slate-400" style={{ width: `${((data?.summary?.small || 0) / (data?.summary?.total || 1)) * 100}%` }} />
               </div>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center italic">Institutional 50-30-20 Rule</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Global Audit</span>
               <div className="flex items-center space-x-2">
                 <button 
                   onClick={handleExportAlpha}
                   title="Export Strategic Audit"
                   className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                 >
                   <Download className="h-4 w-4" />
                 </button>
                 <button onClick={fetchAlphaHub} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><RefreshCw className="h-4 w-4" /></button>
               </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter text-emerald-600">Verified</h3>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Exp. Yield</span>
               <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-3xl font-black tracking-tighter text-emerald-600">25-30%</h3>
         </div>
      </div>

      {['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'].map(basket => {
        const basketStocks = (data?.stocks || []).filter((s: any) => s.basketSource === basket);
        if (basketStocks.length === 0) return null;

        return (
          <div key={basket} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{basket.replace('_', ' ')} Tier</h2>
                <div className="h-px flex-1 bg-slate-100" />
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">{basketStocks.length} Assets</span>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Obs</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Symbol</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Strategy</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Entry</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Target</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600 whitespace-nowrap">ROI%</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Qty</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {basketStocks.map((stock: any) => {
                      const qty = calculateQuantity(stock);
                      return (
                        <tr key={stock.symbol} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5 text-[10px] font-black text-slate-400 whitespace-nowrap">
                             {stock.entryTime ? new Date(stock.entryTime).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '-'}
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex flex-col min-w-[120px]">
                                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{stock.symbol}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{stock.sector}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">{stock.strategy}</td>
                          <td className="px-8 py-5 text-xs font-black text-slate-900 whitespace-nowrap">₹{Number(stock.entryPrice)?.toLocaleString()}</td>
                          <td className="px-8 py-5 text-xs font-black text-slate-900 whitespace-nowrap">₹{Number(stock.target)?.toLocaleString()}</td>
                          <td className="px-8 py-5 text-xs font-black text-emerald-600 whitespace-nowrap">+{Number(stock.roi)?.toFixed(1)}%</td>
                          <td className="px-8 py-5 text-xs font-black text-slate-900 whitespace-nowrap">{qty}</td>
                          <td className="px-8 py-5">
                             <div className="flex items-center space-x-2">
                                <Link to={`/stock/${stock.symbol}`} className="p-2.5 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white rounded-xl text-slate-400 transition-all inline-block"><ArrowUpRight className="h-4 w-4" /></Link>
                             </div>
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

      {data?.closedTrades?.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-black text-slate-400 uppercase italic tracking-tighter">Profit Audit (Closed)</h2>
              <div className="h-px flex-1 bg-slate-100" />
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exit Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Symbol</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategy</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-600">ROI%</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.closedTrades.map((trade: any) => (
                    <tr key={`${trade.symbol}-${trade.exitDate}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 text-[10px] font-black text-slate-400">{new Date(trade.exitDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-900 uppercase">{trade.symbol}</td>
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase">{trade.strategy}</td>
                      <td className="px-8 py-5 text-xs font-black text-emerald-600">+{Number(trade.roi).toFixed(1)}%</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-400 uppercase">{trade.days} Trading Days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AlphaHubPage;
