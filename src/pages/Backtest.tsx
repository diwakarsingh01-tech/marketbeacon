import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  History as HistoryIcon, 
  TrendingUp, 
  ArrowUpRight, 
  Target, 
  Zap, 
  ShieldCheck, 
  RefreshCw,
  Wallet,
  Clock,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Info,
  Calendar,
  Layers,
  Activity,
  ArrowLeft,
  Filter,
  BarChart,
  Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STRATEGIES, BASKETS } from '../data/stocks';

const BacktestPage: React.FC = () => {
  const navigate = useNavigate();
  const [strategyId, setStrategyId] = useState(STRATEGIES[0].id);
  const [activeBasket, setActiveBasket] = useState('BLUECHIP');
  const [capital, setCapital] = useState(1000000);
  const [fromDate, setFromDate] = useState('2023-01-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const currentStrategy = useMemo(() => STRATEGIES.find(s => s.id === strategyId) || STRATEGIES[0], [strategyId]);

  useEffect(() => {
    // If the current strategy doesn't support the active basket, switch to the first supported basket
    if (!currentStrategy.baskets.includes(activeBasket)) {
      setActiveBasket(currentStrategy.baskets[0]);
    }
  }, [strategyId, currentStrategy, activeBasket]);

  const runSimulation = useCallback(async (isManual = false) => {
    setIsRefreshing(true); 
    try {
      const res = await fetch(`import.meta.env.VITE_API_URL || "http://localhost:3001"/api/backtest/simulate?strategy=${strategyId}&basket=${activeBasket}&capital=${capital}&from=${fromDate}&to=${toDate}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
      setLoading(false);
    }
  }, [strategyId, activeBasket, capital, fromDate, toDate]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  if (loading || !data) return (
    <div className="flex-1 flex items-center justify-center">
       <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Auditing Historical Precision...</p>
       </div>
    </div>
  );

  const symbols = Object.keys(data.symbolPerformance);
  const strategyROI = parseFloat(data.summary.totalROI);
  const niftyROI = parseFloat(data.summary.niftyReturn);
  const strategyCAGR = parseFloat(data.summary.cagr);
  const niftyCAGR = parseFloat(data.summary.niftyCAGR);
  const alphaValue = (strategyCAGR - niftyCAGR).toFixed(1);
  const isAlphaPositive = parseFloat(alphaValue) >= 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 py-6 px-10 space-y-6 overflow-hidden font-sans bg-[#f8fafc]">
      
      {/* 1. Header & Dynamic Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200/60 pb-6 gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 px-3 py-1 bg-amber-500/10 w-fit rounded-lg border border-amber-500/20 mb-3">
             <BarChart3 className="h-3 w-3 text-amber-600" />
             <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Performance Lab</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Strategy Audit</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.summary.period}</p>
        </div>

        <div className="flex items-end space-x-3">
          <div className="flex flex-col space-y-2 items-end">
             {/* Unified Filter Bar */}
             <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 shadow-sm space-x-4 px-4 items-center">
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-slate-400 uppercase ml-1">Cap</span>
                   <input type="number" value={capital} onChange={(e) => setCapital(parseInt(e.target.value))} className="bg-transparent border-none p-0 text-xs font-black w-20 focus:ring-0 text-slate-900" />
                </div>
                <div className="h-6 w-px bg-slate-200/50" />
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-slate-400 uppercase">From</span>
                   <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent border-none p-0 text-[10px] font-black focus:ring-0 text-slate-700" />
                </div>
                <div className="h-6 w-px bg-slate-200/50" />
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-slate-400 uppercase">To</span>
                   <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent border-none p-0 text-[10px] font-black focus:ring-0 text-slate-700" />
                </div>
             </div>

             <div className="flex items-center space-x-2 w-full">
                {/* Dynamic Universe Filter */}
                <div className="relative group flex-1 min-w-[160px]">
                   <select 
                     value={activeBasket}
                     onChange={(e) => setActiveBasket(e.target.value)}
                     className="appearance-none w-full bg-white border border-slate-100 rounded-2xl pl-10 pr-8 py-3 text-[10px] font-black uppercase tracking-[0.1em] focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                   >
                     {currentStrategy.baskets.map(b => (
                        <option key={b} value={b}>UNIVERSE: {b.replace('_', ' ')}</option>
                     ))}
                   </select>
                   <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-600" />
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                </div>

                <div className="relative group flex-2 min-w-[200px]">
                   <select 
                     value={strategyId}
                     onChange={(e) => setStrategyId(e.target.value)}
                     className="appearance-none w-full bg-white border border-slate-100 rounded-2xl pl-10 pr-12 py-3 text-[10px] font-black uppercase tracking-[0.1em] focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                   >
                     {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name} {s.isLive ? '🟢' : '⏳'}</option>)}
                   </select>
                   <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-600 fill-blue-600" />
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                </div>
             </div>
          </div>
          
          <button 
            onClick={() => runSimulation(true)}
            className={`p-4 rounded-2xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. High-Impact Performance HUD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
         
         {/* STRATEGY PERFORMANCE */}
         <div className="bg-slate-900 rounded-[2rem] p-5 text-white relative overflow-hidden shadow-xl border border-slate-800">
            <div className="absolute right-[-10px] bottom-[-10px] h-20 w-20 opacity-10 bg-blue-500 rounded-full" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Strategy Performance</p>
            <h3 className={`text-2xl font-black ${strategyROI >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
               {strategyROI >= 0 ? '+' : ''}{data.summary.totalROI}%
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 block italic">Dynamic Period Yield</span>
         </div>

         {/* BENCHMARK PERFORMANCE */}
         <div className="bg-white rounded-[2rem] p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Benchmark (Nifty 50)</p>
            <h3 className={`text-2xl font-black ${niftyROI >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
               {niftyROI >= 0 ? '+' : ''}{data.summary.niftyReturn}%
            </h3>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 italic tracking-widest">Base Market Return</p>
         </div>

         {/* INSTITUTIONAL ALPHA */}
         <div className={`rounded-[2rem] p-5 text-white shadow-lg relative transition-all duration-700 overflow-hidden ${isAlphaPositive ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-red-600 shadow-red-500/30 animate-pulse'}`}>
            <TrendingUp className="absolute right-[-10px] bottom-[-10px] h-24 w-24 opacity-10 rotate-12" />
            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Institutional Alpha</p>
            <h3 className="text-3xl font-black">
               {isAlphaPositive ? '+' : ''}{alphaValue}%
            </h3>
            <span className={`mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase ${isAlphaPositive ? 'bg-white/20' : 'bg-black/20'}`}>
               {isAlphaPositive ? 'Outperforming Market' : 'Market Laggard'}
            </span>
         </div>

         {/* AVERAGE HOLDING PERIOD */}
         <div className="bg-blue-600 rounded-[2rem] p-5 text-white shadow-lg shadow-blue-500/20 relative">
            <Clock className="absolute right-6 top-6 h-6 w-6 opacity-20" />
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-widest mb-1">Avg. Holding Period</p>
            <div className="flex items-baseline space-x-2">
               <h3 className="text-2xl font-black">{data.summary.avgHoldingDays}</h3>
               <span className="text-xs font-black uppercase opacity-60">Days</span>
            </div>
            <p className="text-[8px] font-bold uppercase mt-1 italic opacity-80">Time-Weighted Risk Exposure</p>
         </div>
      </div>

      {/* 3. Transaction Ledger Grid - WITH BLUR LOADING */}
      <div className={`flex-1 flex flex-col min-h-0 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative transition-all duration-500 ${isRefreshing ? 'opacity-40 blur-[2px] scale-[0.99]' : 'opacity-100 blur-0 animate-in fade-in zoom-in-95'}`}>
         {isRefreshing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center space-y-3 bg-white/10 backdrop-blur-[1px]">
               <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
               <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em]">Recalibrating Strategy Alpha...</p>
            </div>
         )}
         
         <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20 backdrop-blur-md">
            <div className="flex items-center space-x-3">
               <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                  <Activity className="h-4 w-4" />
               </div>
               <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Transaction Audit Ledger</h3>
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
               {symbols.length} Scanned • {data.summary.totalTrades} Targets Realized
            </span>
         </div>
         
         <div className="flex-1 overflow-auto custom-scrollbar px-2">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-[65px] z-10">
                     <th className="px-8 py-4">Instrument</th>
                     <th className="px-8 py-4 text-center">Signals</th>
                     <th className="px-8 py-4 text-right">Aggregate ROI</th>
                     <th className="px-8 py-4 text-right">Avg Holding Period</th>
                     <th className="px-8 py-4 text-right">Audit</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100/50 text-right">
                  {symbols.map((symbol) => {
                    const perf = data.symbolPerformance[symbol];
                    const isExpanded = expandedSymbol === symbol;
                    const symbolTrades = data.allTrades.filter((t:any) => t.symbol === symbol);

                    return (
                      <React.Fragment key={symbol}>
                        <tr className={`hover:bg-blue-50/20 transition-colors ${perf?.tradeCount > 0 ? 'bg-transparent' : 'opacity-30'}`}>
                           <td className="px-8 py-4 text-left">
                              <span className="text-xs font-black text-slate-900">{symbol}</span>
                           </td>
                           <td className="px-8 py-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${perf?.tradeCount > 0 ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-400'}`}>
                                 {perf?.tradeCount || 0}
                              </span>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <span className={`text-[11px] font-black ${perf?.totalROI > 0 ? 'text-green-600' : perf?.totalROI < 0 ? 'text-red-600' : 'text-slate-300'}`}>
                                 {perf?.totalROI > 0 ? '+' : ''}{perf?.totalROI.toFixed(1)}%
                              </span>
                           </td>
                           <td className="px-8 py-4 text-right font-bold text-slate-500 text-[10px] italic">
                              {perf?.avgDays > 0 ? `${perf.avgDays}d` : '-'}
                           </td>
                           <td className="px-8 py-4 text-right">
                              {perf?.tradeCount > 0 && (
                                <button 
                                  onClick={() => setExpandedSymbol(isExpanded ? null : symbol)}
                                  className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-slate-900 text-white shadow-lg' : 'bg-white/60 text-blue-600 border border-slate-200/50 hover:bg-white shadow-sm'}`}
                                >
                                   {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              )}
                           </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/20">
                             <td colSpan={5} className="px-12 py-8 border-l-4 border-l-blue-600">
                                <div className="space-y-3">
                                   {symbolTrades.map((t:any, i:number) => (
                                     <div key={i} className="bg-white border border-slate-100 rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group/item">
                                        <div className="flex items-center space-x-12">
                                           <div className="flex items-center space-x-6 text-left">
                                              <div className="flex flex-col">
                                                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Signal</span>
                                                 <span className="text-[10px] font-bold text-slate-900">{t.entryDate}</span>
                                              </div>
                                              <ArrowUpRight className="h-4 w-4 text-slate-200 group-hover/item:text-blue-500 transition-colors" />
                                              <div className="flex flex-col">
                                                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Realized</span>
                                                 <span className="text-[10px] font-bold text-slate-900">{t.exitDate}</span>
                                              </div>
                                           </div>
                                           
                                           <div className="h-8 w-px bg-slate-100" />

                                           <div className="flex flex-col text-left">
                                              <span className="text-[7px] font-black text-slate-400 uppercase mb-2 leading-none">Phases Deployed</span>
                                              <div className="flex items-center space-x-1.5">
                                                 {t.lots.split('+').map((lot:string) => (
                                                    <span key={lot} className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black border ${lot === 'A' ? 'bg-blue-600 text-white border-blue-700' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                                                       {lot}
                                                    </span>
                                                 ))}
                                              </div>
                                           </div>
                                        </div>
                                        <div className="flex items-center space-x-8">
                                           <div className="flex flex-col items-end">
                                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Duration</span>
                                              <div className="flex items-center space-x-1.5 text-slate-800">
                                                 <Clock className="h-3 w-3 text-slate-400" />
                                                 <span className="text-xs font-black">{t.daysHeld} Days</span>
                                              </div>
                                           </div>
                                           <div className="h-10 w-px bg-slate-100" />
                                           <div className={`px-5 py-2.5 rounded-2xl border-2 flex flex-col items-center justify-center min-w-[100px] ${t.roi >= 0 ? 'bg-green-50/50 border-green-100 text-green-700' : 'bg-red-50/50 border-red-100 text-red-700'}`}>
                                              <span className="text-[8px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Yield Recalibrated</span>
                                              <span className="text-sm font-black">+{t.roi.toFixed(1)}%</span>
                                           </div>
                                        </div>
                                     </div>
                                   ))}
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
      </div>

      {/* 4. Footer */}
      <div className="py-2 flex items-center justify-between opacity-50 shrink-0 border-t border-slate-200/60 pt-4">
         <div className="flex items-center space-x-2">
            <Info className="h-3 w-3" />
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic leading-none">Simulation engine calibrated for Batch 9 compliance. Performance vs Nifty 50 reflects precise time-weighted recalibration.</p>
         </div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">MarketBeacon Lab</p>
      </div>
    </div>
  );
};

export default BacktestPage;
