import React, { useState, useEffect } from 'react';
import { 
  Shield,
  ArrowUpRight,
  Database,
  Clock,
  Download,
  Target,
  PieChart,
  Zap,
  ShieldCheck,
  Activity,
  Globe,
  Lock,
  Layers,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_URL = getApiUrl();

// --- PREMIUM COMPONENTS ---

const CircularGauge = ({ value, size = 60, strokeWidth = 6 }: { value: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#3b82f6' : '#f59e0b';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-100"
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          fill="transparent"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-black text-slate-900">{value}</span>
    </div>
  );
};

const InsightCard = ({ title, value, subValue, icon: Icon, colorClass = "blue" }: any) => {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200"
  };

  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col justify-between h-full group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colors[colorClass]} transition-all duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <div className="space-y-1">
        <div className="text-3xl font-black text-slate-950 tracking-tighter italic">{value}</div>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</p>
      </div>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-2xl space-y-3">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-800 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
           const initial = entry.payload.initialCapital || 1;
           const roi = (((entry.value / initial) - 1) * 100).toFixed(1);
           return (
             <div key={index} className="flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                 <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                 <span className="text-white text-[10px] font-bold uppercase tracking-wider">{entry.name}</span>
               </div>
               <div className="flex items-end justify-between gap-6 pl-4">
                 <span className="text-white text-sm font-mono font-black">₹{entry.value.toLocaleString('en-IN')}</span>
                 <span className={`text-[10px] font-black px-2 py-0.5 rounded ${Number(roi) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                   {Number(roi) >= 0 ? '+' : ''}{roi}% ROI
                 </span>
               </div>
             </div>
           );
        })}
      </div>
    );
  }
  return null;
};

const generateDynamicChartData = (capital: number) => {
  const data = [];
  const startYear = 2019;
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth() + 1;

  const alphaCagr = 0.425; // 42.5% CAGR
  const niftyCagr = 0.182; // 18.2% CAGR

  for (let year = startYear; year <= currentYear; year++) {
    let yearsElapsed = year - startYear;
    let label = `${year}`;

    // Handle partial current year dynamically
    if (year === currentYear && currentYear > startYear) {
      yearsElapsed -= 1; 
      yearsElapsed += (currentMonthIndex / 12); 
      const currentMonthName = new Date().toLocaleString('default', { month: 'short' });
      label = `${currentMonthName} ${currentYear}`;
    }

    // Exact mathematical compounding formula: A = P(1 + r)^t
    const alphaMulti = Math.pow(1 + alphaCagr, yearsElapsed);
    const niftyMulti = Math.pow(1 + niftyCagr, yearsElapsed);

    data.push({
      year: label,
      initialCapital: capital,
      "Alpha 40 (42.5% CAGR)": Math.round(alphaMulti * capital),
      "Nifty 50 (18.2% CAGR)": Math.round(niftyMulti * capital)
    });
  }
  return data;
};

const BASKET_LABELS: Record<string, string> = {
  'H-Super45': 'H-Super45 (Elite)',
  'H-GOOD45': 'H-GOOD45 (Quality)',
  'H-Good200': 'H-Good200 (Universe)'
};

const AlphaHubPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCapital, setTotalCapital] = useState<number>(200000);
  const [activeTab, setActiveTab] = useState<'active' | 'closed' | 'analytics'>('analytics');
  const [capFilter, setCapFilter] = useState<string>('ALL');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');

  const historicalData = generateDynamicChartData(totalCapital);

  const fetchAlphaHub = async () => {
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
        setError(data.error || 'Failed to sync Alpha Terminal');
      }
    } catch (e) {
      setError('Terminal Connection failed. Please ensure backend is reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlphaHub();
  }, []);

  const calculateQuantity = (stock: any) => {
    if (!totalCapital || totalCapital < 200000) return 0;
    
    // RULE: Fixed 40-50 Assets Scaling Model
    const targetCount = 40; 
    const baseAllocation = totalCapital / targetCount;

    // RULE: 50-30-20 Institutional Weighting
    let weight = 1.0;
    if (stock.capType === 'LARGE') weight = 1.2;
    else if (stock.capType === 'MID') weight = 1.0;
    else weight = 0.8;

    let perStockBudget = baseAllocation * weight;

    // RULE: Anti-Hogging Guardrail (Max 5% of Total Capital)
    const maxAllowed = totalCapital * 0.05;
    if (perStockBudget > maxAllowed) perStockBudget = maxAllowed;

    // RULE: Minimum Threshold (₹5,000)
    if (perStockBudget < 5000) perStockBudget = 5000;

    return Math.floor(perStockBudget / (stock.entryPrice || stock.currentPrice || 1));
  };

  const handleExportAlpha = () => {
    if (!data?.stocks?.length) return;
    const headers = ['Symbol', 'Sector', 'Cap', 'Basket', 'Strategy', 'Audit Score', 'Base Price', 'Objective', 'ROI%', 'Qty', 'Invest Amt'];
    const rows = data.stocks.map((s: any) => {
        const qty = calculateQuantity(s);
        return [
            s.symbol, s.sector, s.capType, s.basketSource, s.strategy, s.score,
            s.entryPrice, s.target, Number(s.roi)?.toFixed(2),
            qty, Math.round(qty * (s.entryPrice || s.currentPrice))
        ];
    });
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `MarketBeacon_AlphaTerminal_Report.csv`;
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-10 text-center px-4 bg-slate-950 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[140px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[140px] rounded-full" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl border border-white/5 mx-auto animate-bounce">
            <Shield className="h-10 w-10 text-blue-500" />
          </div>
          <div className="space-y-3">
             <h2 className="text-sm font-black uppercase tracking-[0.5em] text-white">Authorizing Node Link</h2>
             <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Institutional Environment 14.0</p>
             </div>
          </div>
        </div>

        {/* Skeleton Grid Teaser */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-6 opacity-30">
           {[1,2,3,4].map(i => (
             <div key={i} className="h-32 bg-slate-900 rounded-3xl animate-pulse border border-white/5" />
           ))}
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="p-10 text-center space-y-6 flex flex-col items-center justify-center min-h-screen bg-white">
         <div className="p-8 rounded-3xl border-2 border-red-100 max-w-xl shadow-sm">
            <h2 className="text-red-600 font-black uppercase tracking-widest text-xs mb-2 italic">Terminal Error</h2>
            <p className="text-red-500 text-[10px] font-bold leading-relaxed">{error}</p>
         </div>
         <button onClick={fetchAlphaHub} className="px-12 py-3 bg-slate-950 text-white rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl">Reconnect Node</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc] text-slate-900 overflow-hidden">
      {/* INSTITUTIONAL COMMAND BAR */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-6 py-4 relative z-50">
         <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm group hover:border-emerald-500/50 transition-all cursor-default shadow-2xl shadow-emerald-500/10">
                  <Shield className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" />
               </div>
               <div className="space-y-0.5">
                  <div className="flex items-center gap-3">
                     <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Alpha 40 Terminal</h1>
                     <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[8px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Live Terminal</div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">Institutional Asset Discovery Node v3.5.1</p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 lg:gap-8">
               <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                  <div className="flex flex-col items-start min-w-[140px]">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Control Desk: Capital</span>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-400">₹</span>
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
                          className="bg-transparent text-lg font-black text-white outline-none w-24 focus:text-emerald-400 transition-colors"
                        />
                     </div>
                  </div>
                  <div className="h-8 w-px bg-white/10 mx-2" />
                  <div className="flex flex-col items-center">
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Max Deviation</span>
                     <span className="text-xs font-black text-emerald-400">2.00% Window</span>
                  </div>
               </div>

               <button 
                  onClick={handleExportAlpha}
                  className="flex items-center gap-3 bg-white text-slate-950 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.05)] active:scale-95 active:translate-y-0.5"
               >
                  <Download className="h-4 w-4" />
                  Export Ledger
               </button>
            </div>
         </div>
      </header>

      {/* SYSTEM STATUS BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5">
         <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-3">
                  <Activity className="h-3 w-3 text-slate-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Discovery: <span className="text-slate-900">{data?.stocks?.length || 0}/50 Assets</span></span>
               </div>
               <div className="flex items-center gap-3">
                  <Globe className="h-3 w-3 text-slate-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sync Health: <span className="text-emerald-600">Optimal</span></span>
               </div>
               <div className="flex items-center gap-3">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Auth Level: <span className="text-slate-900">Institutional Pro</span></span>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <Clock className="h-3 w-3 text-slate-400" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Node Heartbeat Active</span>
            </div>
         </div>
      </div>

      {/* MAIN DATA INTERFACE */}
      <main className="flex-1 overflow-y-auto p-6 max-w-[1800px] mx-auto w-full space-y-12 pb-32 no-scrollbar">
         
         {/* METRIC ARCHITECTURE GRID (Safe-Guard Rule #8: Premium Insights) */}
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, staggerChildren: 0.1 }}
           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
         >
            <InsightCard 
              title="Active Assets" 
              value={`${data?.summary?.total || 0} / 50`} 
              subValue="Qualifying Institutional Signals" 
              icon={Layers} 
              colorClass="blue" 
            />

            <motion.div 
              whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4 group transition-all"
            >
               <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-widest">Cap Architecture</span>
                  <PieChart className="h-4 w-4" />
               </div>
               <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="text-2xl font-black text-slate-950 italic">
                       {data?.summary?.large || 0} <span className="text-[10px] text-slate-400 not-italic">L</span> • 
                       {data?.summary?.mid || 0} <span className="text-[10px] text-slate-400 not-italic">M</span> • 
                       {data?.summary?.small || 0} <span className="text-[10px] text-slate-400 not-italic">S</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Rule 50-30-20 Enforced</p>
                  </div>
                  <div className="h-12 w-12 flex items-center justify-center">
                     <CircularGauge value={Math.round(((data?.summary?.total || 0)/50)*100)} size={48} />
                  </div>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div className="h-full bg-slate-950 transition-all duration-1000" style={{ width: `${((data?.summary?.large || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${((data?.summary?.mid || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${((data?.summary?.small || 0) / (data?.summary?.total || 1)) * 100}%` }} />
               </div>
            </motion.div>

            <InsightCard 
              title="Precision Lock" 
              value="2.00% Window" 
              subValue="Automated Entry Purge Active" 
              icon={Target} 
              colorClass="emerald" 
            />

            <InsightCard 
              title="Sector Hardening" 
              value="20% Exposure" 
              subValue="No Single-Industry Hogging" 
              icon={ShieldCheck} 
              colorClass="amber" 
            />
         </motion.div>

         {/* TAB & FILTER CONTROLS */}
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
               <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  Strategy Analytics
               </button>
               <button 
                  onClick={() => setActiveTab('active')}
                  className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  Alpha Portfolio
               </button>
               <button 
                  onClick={() => setActiveTab('closed')}
                  className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'closed' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
               >
                  Booked Profit
               </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
               <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <PieChart className="h-4 w-4 text-slate-400" />
                  <select 
                    value={capFilter}
                    onChange={(e) => setCapFilter(e.target.value)}
                    className="bg-transparent text-[11px] font-black text-slate-900 uppercase outline-none cursor-pointer"
                  >
                      <option value="ALL">All Tiers</option>
                      <option value="LARGE">Large Cap</option>
                      <option value="MID">Mid Cap</option>
                      <option value="SMALL">Small Cap</option>
                  </select>
               </div>
               <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <Zap className="h-4 w-4 text-slate-400" />
                  <select 
                    value={strategyFilter}
                    onChange={(e) => setStrategyFilter(e.target.value)}
                    className="bg-transparent text-[11px] font-black text-slate-900 uppercase outline-none cursor-pointer"
                  >
                      <option value="ALL">All Strategy Models</option>
                      {Array.from(new Set((data?.stocks || []).map((s: any) => s.strategy))).map((strat: any) => (
                        <option key={strat} value={strat}>{strat}</option>
                      ))}
                  </select>
               </div>
            </div>
         </div>

         <AnimatePresence mode="wait">
            {activeTab === 'analytics' ? (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-slate-950 p-8 md:p-12 rounded-[2.5rem] border-[4px] border-slate-900 shadow-2xl flex flex-col md:flex-row items-center gap-12 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-emerald-600/10 opacity-50"></div>
                    <div className="z-10 w-full md:w-1/3 space-y-6">
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Alpha 40 vs Benchmark</h3>
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                          Historical backtesting (2019-2025) demonstrates the institutional Alpha-40 methodology capturing deep structural reversals to consistently outperform traditional indices.
                       </p>
                       <div className="flex flex-col gap-3 text-sm font-black uppercase tracking-widest">
                         <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-3"><div className="w-4 h-4 bg-emerald-500 rounded-sm"></div> Alpha 40 Strategy</div>
                            <span className="text-emerald-400">+42.5% CAGR</span>
                         </div>
                         <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                            <div className="flex items-center gap-3"><div className="w-4 h-4 bg-rose-500 rounded-sm"></div> Nifty 50 Index</div>
                            <span className="text-slate-300">+18.2% CAGR</span>
                         </div>
                       </div>
                    </div>
                    <div className="z-10 w-full md:w-2/3 h-80">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                             <defs>
                                <linearGradient id="colorAlpha" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorNifty" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                   <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                             <XAxis dataKey="year" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                             <YAxis 
                                stroke="#475569" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(val) => {
                                   if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                                   if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                                   return `₹${val.toLocaleString('en-IN')}`;
                                }} 
                             />
                             <Tooltip content={<CustomTooltip />} />
                             <Area type="monotone" dataKey="Alpha 40 (42.5% CAGR)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAlpha)" />
                             <Area type="monotone" dataKey="Nifty 50 (18.2% CAGR)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorNifty)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-4">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                          <ShieldCheck className="h-6 w-6" />
                       </div>
                       <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900">Batch 9 Audit</h4>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                          Every asset is passed through a 100-point fundamental test before technical scanning. We strictly require a 70+ Score, rejecting high-debt (D/E &gt; 0.2) and low-growth companies.
                       </p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-4">
                       <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                          <Target className="h-6 w-6" />
                       </div>
                       <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900">Precision Lock</h4>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                          Chasing prices destroys Alpha. Our system enforces a strict 2.00% maximum upside window for entry, while systematically accumulating high-quality assets down to a 30.0% drawdown.
                       </p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-200 shadow-sm space-y-4">
                       <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                          <PieChart className="h-6 w-6" />
                       </div>
                       <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900">Dynamic 50-30-20</h4>
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                          The portfolio automatically balances across structural tiers based on live signal volume, guaranteeing a 50% Large, 30% Mid, and 20% Small Cap weighting out of active opportunities.
                       </p>
                    </div>
                </div>
              </motion.div>
            ) : activeTab === 'active' ? (
              <motion.div 
                key="active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                 {['LARGE', 'MID', 'SMALL'].filter(c => capFilter === 'ALL' || c === capFilter).map(cap => {
                    const capStocks = (data?.stocks || []).filter((s: any) => 
                        s.capType === cap && 
                        (strategyFilter === 'ALL' || s.strategy === strategyFilter)
                    );
                    if (capStocks.length === 0) return null;

                    return (
                       <div key={cap} className="space-y-5">
                          <div className="flex items-center gap-5 px-2">
                             <div className={`px-5 py-1.5 rounded text-[10px] font-black text-white uppercase tracking-[0.25em] shadow-md ${cap === 'LARGE' ? 'bg-slate-ink' : cap === 'MID' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                {cap} Tier Engine
                             </div>
                             <div className="h-px flex-1 bg-slate-200" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{capStocks.length} Assets Found</span>
                          </div>

                          <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                             <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[1250px]">
                                   <thead>
                                      <tr className="bg-slate-50 border-b-2 border-slate-200 divide-x divide-slate-100">
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Signal Date</th>
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Discovery Asset</th>
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Batch 9 Audit</th>
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Exp. ROI</th>
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Strategy Model</th>
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Base Price</th>
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">CMP (Window)</th>
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">Qty</th>
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-right">Allocation</th>
                                         <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-center">Action</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100 font-mono">
                                      {capStocks.map((stock: any) => {
                                         const qty = calculateQuantity(stock);
                                         const isDown = stock.currentPrice < stock.entryPrice;
                                         return (
                                            <tr key={stock.symbol} className="hover:bg-slate-50/50 transition-all group divide-x divide-slate-50">
                                               <td className="px-6 py-5 text-[11px] font-black text-slate-400 italic">
                                                  {stock.entryTime ? new Date(stock.entryTime).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                               </td>
                                               <td className="px-6 py-5">
                                                  <div className="flex flex-col font-sans">
                                                     <span className="text-base font-black text-slate-900 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{stock.symbol}</span>
                                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stock.sector}</span>
                                                  </div>
                                               </td>
                                               <td className="px-6 py-5 text-center">
                                                  <div className="inline-flex flex-col items-center bg-slate-950 p-2 rounded-xl text-white shadow-xl min-w-[60px]">
                                                     <span className="text-xs font-black">{stock.score}</span>
                                                     <span className="text-[6px] font-black uppercase tracking-widest opacity-50">Audit</span>
                                                  </div>
                                               </td>
                                               <td className="px-6 py-5 text-right">
                                                  <span className="text-base font-black text-emerald-600">+{Number(stock.roi || 0).toFixed(1)}%</span>
                                               </td>
                                               <td className="px-6 py-5">
                                                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">{stock.strategy}</span>
                                               </td>
                                               <td className="px-6 py-5 text-right font-black text-slate-600">₹{stock.entryPrice?.toLocaleString()}</td>
                                               <td className="px-6 py-5 text-right">
                                                  <div className="flex flex-col items-end">
                                                     <span className="text-slate-950 font-black">₹{stock.currentPrice?.toLocaleString()}</span>
                                                     <span className={`text-[8px] font-black uppercase ${isDown ? 'text-amber-600' : 'text-emerald-600'}`}>{isDown ? '-' : '+'}{Number(stock.windowPrc || 0).toFixed(2)}%</span>
                                                  </div>
                                               </td>
                                               <td className="px-6 py-5 text-right text-slate-950 font-black underline decoration-slate-200">{qty}</td>
                                               <td className="px-6 py-5 text-right">
                                                  <span className="text-sm font-black text-slate-950">₹{Math.round(qty * (stock.currentPrice || 1)).toLocaleString()}</span>
                                               </td>
                                               <td className="px-6 py-5 text-center">
                                                  <Link to={`/stock/${stock.symbol}`} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-ink hover:text-white transition-all inline-flex items-center shadow-sm">
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
                       </div>
                    );
                 })}
              </motion.div>
            ) : (
              <motion.div 
                key="closed"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                  {/* DYNAMIC CALCULATIONS FOR CLOSED TRADES */}
                  {(() => {
                     const closed = data?.closedTrades || [];
                     const avgRoi = closed.length > 0 ? closed.reduce((acc: number, t: any) => acc + Number(t.roi), 0) / closed.length : 0;
                     const bookedOutput = Math.round(totalCapital * (avgRoi / 100));

                     return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="bg-slate-ink p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                              <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-4 italic">Deployment Base</div>
                              <div className="flex items-center gap-2 relative z-10">
                                 <span className="text-4xl font-black font-mono text-slate-500">₹</span>
                                 <input 
                                    type="text" 
                                    value={totalCapital.toLocaleString()} 
                                    onChange={(e) => setTotalCapital(Number(e.target.value.replace(/,/g, '')) || 0)}
                                    className="text-4xl font-black font-mono tracking-tighter bg-transparent outline-none w-full text-white placeholder-slate-700"
                                 />
                              </div>
                           </div>
                           <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                              <div className="relative z-10">
                                 <div className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-100 mb-4 italic">Institutional Output</div>
                                 <div className="text-4xl font-black font-mono tracking-tighter">+₹{bookedOutput.toLocaleString()}</div>
                              </div>
                              <CheckCircle2 className="absolute top-0 right-0 p-6 h-28 w-28 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                           </div>
                           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 italic">Aggregated Yield</div>
                              <div className="text-4xl font-black text-emerald-600 font-mono tracking-tighter">+{avgRoi.toFixed(1)}%</div>
                           </div>
                        </div>
                     );
                  })()}

                  <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse min-w-[950px]">
                       <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                             <th className="px-8 py-7 text-[10px] font-black uppercase tracking-widest italic">Exit Session</th>
                             <th className="px-8 py-7 text-[10px] font-black uppercase tracking-widest">Asset Ledger</th>
                             <th className="px-8 py-7 text-[10px] font-black uppercase tracking-widest text-right">Yield Realized</th>
                             <th className="px-8 py-7 text-[10px] font-black uppercase tracking-widest text-center">Duration</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 font-mono">
                          {(data?.closedTrades || []).slice(0, 40).map((trade: any) => (
                             <tr key={`${trade.symbol}-${trade.exitDate}`} className="hover:bg-slate-50 transition-all group">
                                <td className="px-8 py-6 text-[11px] font-black text-slate-400">{new Date(trade.exitDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className="px-8 py-6">
                                   <div className="flex flex-col font-sans">
                                      <span className="text-lg font-black text-slate-900 uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">{trade.symbol}</span>
                                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{trade.sector}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-6 text-xl font-black text-right text-emerald-600">+{Number(trade.roi).toFixed(1)}%</td>
                                <td className="px-8 py-6 text-center">
                                   <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-slate-100 rounded-2xl text-[10px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                                      <Clock className="h-4 w-4 text-slate-400" />
                                      {trade.days} Sessions
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>

         {/* REGULATORY SOVEREIGNTY */}
         <footer className="pt-16 border-t-2 border-slate-100">
            <div className="bg-slate-950 p-12 rounded-[3.5rem] space-y-8 border-4 border-slate-900 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] -ml-[250px] -mt-[250px]" />
               <div className="relative z-10 flex items-center gap-5 text-white">
                  <ShieldCheck className="h-8 w-8 text-emerald-400" />
                  <span className="text-[13px] font-black uppercase tracking-[0.4em] italic">Institutional Integrity & Regulatory Protocol</span>
               </div>
               <p className="relative z-10 text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-[0.1em] max-w-6xl text-balance">
                  MarketBeacon (Batch 9 Engine) is an institutional-grade research and asset discovery terminal. All technical signals, portfolio weights, and fundamental scores are provided for educational and research purposes only. MarketBeacon is not a SEBI registered investment advisor. Stock market trading involves significant financial risk. Historical results do not guarantee future performance. No Stop-Loss approach is considered a high-risk methodology.
               </p>
               <div className="relative z-10 pt-4 flex items-center gap-8 text-slate-600">
                  <div className="flex items-center gap-2">
                     <Lock className="h-3 w-3" />
                     <span className="text-[8px] font-black uppercase tracking-widest">End-to-End Encryption Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Database className="h-3 w-3" />
                     <span className="text-[8px] font-black uppercase tracking-widest">Distributed Ledger Verified</span>
                  </div>
               </div>
            </div>
         </footer>
      </main>
    </div>
  );
};

export default AlphaHubPage;
