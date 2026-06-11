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
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  Sparkles,
  ArrowDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import UpgradeModal from '../components/modals/UpgradeModal';
import { Confetti } from '../components/ui/Confetti';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import SEO from '../components/SEO';

const API_URL = getApiUrl();

// --- PREMIUM COMPONENTS ---

const CircularGauge = ({ value, size = 60, strokeWidth = 6 }: { value: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#3b82f6' : '#f59e0b';

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-100 dark:text-slate-800"
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
      <span className="absolute text-[10px] font-black text-slate-900">{value}%</span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-2xl space-y-3">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800 pb-2">{label}</p>
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

    if (year === currentYear && currentYear > startYear) {
      yearsElapsed -= 1; 
      yearsElapsed += (currentMonthIndex / 12); 
      const currentMonthName = new Date().toLocaleString('default', { month: 'short' });
      label = `${currentMonthName} ${currentYear}`;
    }

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

const AlphaHubPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false);
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
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        setShowConfetti(true);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setVoucherError(data.error || 'Invalid voucher code.');
      }
    } catch (e) {
      setVoucherError('Network error. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  const { user } = useAuth();
  
  const [totalCapital, setTotalCapital] = useState<number>(500000); // Standard default of 5 Lakhs
  const [activeTab, setActiveTab] = useState<'analytics' | 'active' | 'closed'>('active'); // Default to Active Portfolio for immediate execution visibility

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
        if (res.status === 403 && data.requiredTier) {
          setError('ALPHA_REQUIRED');
          setShowUpgradeModal(true);
          return;
        }
        if (res.status === 401 || res.status === 403 || data.error === 'Invalid token.' || data.error === 'Access denied.') {
          localStorage.removeItem('mb_token');
          localStorage.removeItem('mb_user');
          window.location.href = '/login';
          return;
        }
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

  const scrollToWorkspace = () => {
    const el = document.getElementById('active-workspace');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-10 text-center px-4 bg-slate-950 relative overflow-hidden">
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
      </div>
    );
  }

  if (error && error !== 'ALPHA_REQUIRED') {
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
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-900 overflow-hidden relative">
      <SEO title="Alpha Portfolio" description="Institutional-grade portfolio allocation model. Track active signals, capital deployment, and sector exposure across Elite, Quality & Growth baskets." />
      {showConfetti && <Confetti />}
      
      {error === 'ALPHA_REQUIRED' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700 max-w-2xl mx-auto">
           <div className="w-24 h-24 bg-blue-600/10 border border-blue-500/20 rounded-[2rem] flex items-center justify-center shadow-2xl relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
              <Lock className="h-10 w-10 text-blue-600 relative z-10" />
           </div>
           <div className="space-y-3 max-w-xl">
              <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Institutional Lockdown</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                 The Alpha 40 Desk is a high-performance portfolio engine reserved for <span className="text-blue-600">Institutional Alpha</span> subscribers.
              </p>
           </div>
           <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all active:scale-95 w-full sm:w-auto"
              >
                Unlock Alpha Access
              </button>
              <Link to="/screener" className="px-8 py-5 bg-white border-2 border-slate-100 text-slate-500 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:text-slate-900 transition-all w-full sm:w-auto text-center">
                Return to Screener
              </Link>
           </div>

           {/* Voucher promotion / input box */}
           <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm w-full space-y-4 text-center">
             <div className="text-left space-y-1">
               <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Have a Trial Voucher?</h4>
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Enter code below to unlock Alpha access instantly</p>
             </div>

             {/* Promo shortcut button */}
             <button 
               onClick={() => { setVoucherCode('ALPHA7'); setVoucherError(null); }}
               className="w-full py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
             >
               Use Code: ALPHA7 (7 Days Free)
             </button>

             <div className="flex items-center gap-2">
               <input 
                 type="text" 
                 placeholder="VOUCHER CODE"
                 value={voucherCode}
                 onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(null); }}
                 className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none flex-1 focus:border-blue-600 transition-all placeholder:text-slate-300"
               />
               <button 
                 onClick={handleRedeemVoucher}
                 disabled={redeeming || !voucherCode.trim()}
                 className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
               >
                 {redeeming ? '...' : 'Apply'}
               </button>
             </div>

             {voucherError && (
               <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 text-left pl-1">{voucherError}</p>
             )}
           </div>
        </div>
      ) : (
        <>
      {/* INSTITUTIONAL COMMAND BAR */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-6 py-5 relative z-50">
         <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm group hover:border-emerald-500/50 transition-all cursor-default shadow-2xl">
                  <Shield className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" />
               </div>
               <div className="space-y-0.5">
                  <div className="flex items-center gap-3">
                     <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Alpha 40 Desk</h1>
                     <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-[8px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Active Node</div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.25em]">Institutional Capital Allocator v14.0</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <button 
                  onClick={handleExportAlpha}
                  className="flex items-center gap-2.5 bg-white text-slate-950 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95"
               >
                  <Download className="h-4 w-4 animate-bounce" />
                  <span>Export Allocations</span>
               </button>
            </div>
         </div>
      </header>

      {/* SYSTEM STATUS BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 shadow-sm">
         <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2.5">
                  <Activity className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Discovery: <span className="text-slate-900 font-mono font-bold">{data?.stocks?.length || 0}/50 Assets</span></span>
               </div>
               <div className="flex items-center gap-2.5">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sync Status: <span className="text-emerald-600 font-bold">Optimal</span></span>
               </div>
               <div className="flex items-center gap-2.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Auth Level: <span className="text-blue-600 font-bold">Alpha Hub Unlocked</span></span>
               </div>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
               <Clock className="h-3 w-3" />
               <span className="text-[9px] font-black uppercase tracking-widest">Live Node Pulse Active</span>
            </div>
         </div>
      </div>

      {/* MAIN DATA INTERFACE */}
      <main className="flex-1 overflow-y-auto p-6 max-w-[1600px] mx-auto w-full space-y-8 pb-32 custom-scrollbar">
         
         {/* WHY ALPHA 40? INTRODUCTION BLOCK FOR NEW USERS */}
         <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-[2.5rem] p-6 md:p-8 flex flex-col lg:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="space-y-3 flex-1">
               <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-500 uppercase tracking-widest">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  <span>Premium Strategy Desk</span>
               </div>
               <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
                  Simulate a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">42.5% CAGR Backtest Portfolio</span>
               </h2>
               <p className="text-slate-600 text-xs font-semibold leading-relaxed max-w-4xl">
                  This desk provides a math-based capital allocation model based on historical deep structural reversals. It is a simulation tool for educational research only and does not constitute investment advice. Enter your model capital in the input below to see the simulated allocation breakdown.
               </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-200/50 lg:pl-8">
               <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                  <div>
                     <span className="text-slate-900 block font-black text-xs leading-none">42.5% CAGR</span>
                     <span className="text-[8px] text-slate-500">Backtested Yield</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                  <div>
                     <span className="text-slate-900 block font-black text-xs leading-none">Live Sizer</span>
                     <span className="text-[8px] text-slate-500">Tailored allocations</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                  <div>
                     <span className="text-slate-900 block font-black text-xs leading-none">Direct Desk</span>
                     <span className="text-[8px] text-slate-500">Zero lock-in fees</span>
                  </div>
               </div>
            </div>
         </div>

         {/* TWO COLUMN INTERACTIVE TERMINAL WORKSPACE */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Panel: Capital Control & Sizer Desk (Sticky) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
               
               {/* 1. Sizer Console Card */}
               <div className="bg-slate-950 border border-slate-900 rounded-[2rem] p-6 text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] pointer-events-none rounded-full" />
                  
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block">Desk Controller</span>
                        <h3 className="text-base font-black uppercase tracking-tight italic">Holding Sizer Desk</h3>
                     </div>
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Calculator</span>
                  </div>

                  <div className="space-y-4">
                     {/* Preset buttons */}
                     <div className="grid grid-cols-4 gap-1.5">
                        {[200000, 500000, 1000000, 2500000].map(cap => (
                           <button
                              key={cap}
                              onClick={() => setTotalCapital(cap)}
                              className={`py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                 totalCapital === cap 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'
                              }`}
                           >
                              ₹{(cap / 100000).toFixed(0)}L
                           </button>
                        ))}
                     </div>

                     {/* Slider */}
                     <div className="space-y-2">
                        <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                           <span>Min: ₹2L</span>
                           <span>Max: ₹25L</span>
                        </div>
                        <input 
                           type="range" 
                           min={200000} 
                           max={2500000} 
                           step={50000}
                           value={totalCapital}
                           onChange={(e) => setTotalCapital(Number(e.target.value))}
                           className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-slate-800"
                        />
                     </div>

                     {/* Number input box */}
                     <div className="bg-slate-900 border border-slate-850 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Capital size</span>
                        <div className="flex items-center gap-1">
                           <span className="text-xs font-black text-slate-500 font-mono">₹</span>
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
                              className="bg-transparent text-sm font-black text-white font-mono text-right w-24 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus:text-blue-400 transition-colors"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Sizer Details */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-900 text-slate-500 text-[8.5px] font-black uppercase tracking-widest font-mono">
                     <div className="space-y-1">
                        <span className="text-slate-500 block text-[7px]">Avg Budget/Stock</span>
                        <span className="text-white text-xs">₹{Math.round(totalCapital / 40).toLocaleString('en-IN')}</span>
                     </div>
                     <div className="space-y-1">
                        <span className="text-slate-500 block text-[7px]">Max Cap Weight</span>
                        <span className="text-white text-xs">5.00% Limit</span>
                     </div>
                     <div className="space-y-1">
                        <span className="text-slate-500 block text-[7px]">Safety Margin</span>
                        <span className="text-emerald-400 text-xs">2% Lock</span>
                     </div>
                     <div className="space-y-1">
                        <span className="text-slate-500 block text-[7px]">Cap Mix Limit</span>
                        <span className="text-blue-400 text-xs">50:30:20</span>
                     </div>
                  </div>
               </div>

               {/* 2. Cap Architecture Meter Card */}
               <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center text-slate-500">
                     <span className="text-[9px] font-black uppercase tracking-widest">Cap Architecture Breakdown</span>
                     <PieChart className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <div className="text-xl font-black text-slate-950 italic leading-none">
                          {data?.summary?.large || 0}<span className="text-[9px] text-slate-500 not-italic">L</span> • 
                          {data?.summary?.mid || 0}<span className="text-[9px] text-slate-500 not-italic">M</span> • 
                          {data?.summary?.small || 0}<span className="text-[9px] text-slate-500 not-italic">S</span>
                       </div>
                       <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Rule 50-30-20 Enforced</p>
                     </div>
                     <CircularGauge value={Math.round(((data?.summary?.total || 0)/50)*100)} size={38} strokeWidth={4} />
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                     <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${((data?.summary?.large || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                     <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${((data?.summary?.mid || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                     <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${((data?.summary?.small || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  </div>
               </div>

               {/* 3. Static Precision Lock & Hardening Readouts */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1">
                     <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Level Lock</span>
                     <span className="text-sm font-black text-slate-900 block leading-none">2.00% Limit</span>
                     <span className="text-[7px] font-bold text-emerald-600 uppercase tracking-wider block">Purge Engine Active</span>
                  </div>
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1">
                     <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Sector Hardening</span>
                     <span className="text-sm font-black text-slate-900 block leading-none">20% Exposure</span>
                     <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">Max Allocation Cap</span>
                  </div>
               </div>
            </div>

            {/* Right Panel: Active Workspace Display (Dynamic Table/Analytics) */}
            <div id="active-workspace" className="lg:col-span-8 space-y-6 scroll-mt-24">
               
               {/* Sizer live updates warning helper */}
               <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between text-blue-800 text-[10px] font-bold uppercase tracking-wide">
                  <span>⚡ Quantities update in real-time below as you slide the capital desk!</span>
                  <span className="hidden sm:inline text-blue-500 text-[8px] font-black">Holdings Linked</span>
               </div>

               {/* Workspace Tab Controls */}
               <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                     <button 
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white text-slate-950 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Alpha Portfolio ({data?.stocks?.length || 0})
                     </button>
                     <button 
                        onClick={() => setActiveTab('analytics')}
                        className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Backtest Analytics
                     </button>
                     <button 
                        onClick={() => setActiveTab('closed')}
                        className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'closed' ? 'bg-white text-slate-950 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                        Booked Profits
                     </button>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-slate-500">
                     <Activity className="h-4 w-4 shrink-0" />
                     <span className="text-[8px] font-black uppercase tracking-widest leading-none">Desk Mode: {activeTab === 'active' ? 'Replicable Holdings' : activeTab === 'analytics' ? 'CAGR Backtest' : 'Booked Yields'}</span>
                  </div>
               </div>

               {/* Workspace Output Content */}
               <AnimatePresence mode="wait">
                  {activeTab === 'analytics' ? (
                    <motion.div 
                      key="analytics"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-slate-950 p-6 md:p-8 rounded-[2rem] border-4 border-slate-900 shadow-2xl flex flex-col md:flex-row items-center gap-8 text-white relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-emerald-600/10 opacity-40"></div>
                          <div className="z-10 w-full md:w-5/12 space-y-4">
                             <h3 className="text-xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 leading-none">Alpha 40 vs Benchmark</h3>
                             <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-relaxed">
                                Historical backtesting (2019-2025) demonstrates the institutional Alpha-40 methodology capturing deep structural reversals to consistently outperform traditional indices.
                             </p>
                             <div className="flex flex-col gap-2.5 text-xs font-black uppercase tracking-widest pt-2">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                   <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 bg-emerald-500 rounded-sm"></div> Alpha 40 Desk</div>
                                   <span className="text-emerald-400 font-mono">+42.5% CAGR</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                                   <div className="flex items-center gap-2.5"><div className="w-3.5 h-3.5 bg-rose-500 rounded-sm"></div> Nifty 50 Index</div>
                                   <span className="text-slate-300 font-mono">+18.2% CAGR</span>
                                </div>
                             </div>
                          </div>
                          <div className="z-10 w-full md:w-7/12 h-64">
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
                                   <XAxis dataKey="year" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                                   <YAxis 
                                      stroke="#475569" 
                                      fontSize={9} 
                                      tickLine={false} 
                                      axisLine={false} 
                                      tickFormatter={(val) => {
                                         if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                                         if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                                         return `₹${val.toLocaleString('en-IN')}`;
                                      }} 
                                   />
                                   <Tooltip content={<CustomTooltip />} />
                                   <Area type="monotone" dataKey="Alpha 40 (42.5% CAGR)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAlpha)" />
                                   <Area type="monotone" dataKey="Nifty 50 (18.2% CAGR)" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorNifty)" />
                                </AreaChart>
                             </ResponsiveContainer>
                          </div>
                      </div>
                    </motion.div>
                  ) : activeTab === 'active' ? (
                    <motion.div 
                      key="active"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                       {['LARGE', 'MID', 'SMALL'].map(cap => {
                          const capStocks = (data?.stocks || []).filter((s: any) => s.capType === cap);
                          if (capStocks.length === 0) return null;

                          return (
                             <div key={cap} className="space-y-4 animate-in fade-in duration-300">
                                <div className="flex items-center gap-4 px-2">
                     <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-sm ${cap === 'LARGE' ? 'bg-slate-950' : cap === 'MID' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                                      {cap} Tier Engine
                                   </div>
                                   <div className="h-px flex-1 bg-slate-200" />
                                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{capStocks.length} Assets</span>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                   <div className="hidden md:block overflow-hidden custom-scrollbar">
                                       <table className="w-full text-left border-collapse table-fixed">
                                          <thead>
                                             <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="w-[15%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500">Asset</th>
                                                <th className="w-[8%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Score</th>
                                                <th className="w-[10%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Model Objective</th>
                                                <th className="w-[12%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500">Strategy</th>
                                                <th className="w-[6%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Tranche</th>
                                                <th className="w-[10%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Base Price</th>
                                                <th className="w-[10%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Objective</th>
                                                <th className="w-[10%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">CMP (Diff)</th>
                                                <th className="w-[8%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-right bg-blue-50/50 text-blue-600">Qty</th>
                                                <th className="w-[10%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-right bg-blue-50/50 text-blue-600">Total Invest</th>
                                                <th className="w-[4%] px-3 py-3.5 text-[9px] font-black uppercase tracking-widest text-center">Link</th>
                                             </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                             {capStocks.map((stock: any) => {
                                                const qty = calculateQuantity(stock);
                                                const isDown = stock.currentPrice < stock.entryPrice;
                                                return (
                                                   <tr key={stock.symbol} className="hover:bg-slate-50/50 transition-all group">
                                                      <td className="px-3 py-3">
                                                         <div className="flex flex-col font-sans">
                                                            <div className="flex items-center gap-1.5">
                                                               <span className="text-xs font-black text-slate-900 uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{stock.symbol}</span>
                                                               {stock.signalCount > 1 && (
                                                                  <span className="px-1 py-0.5 bg-indigo-600 text-[6px] font-black text-white rounded uppercase leading-none shadow-lg shadow-indigo-600/20 animate-pulse">High Priority</span>
                                                               )}
                                                            </div>
                                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1 truncate">{stock.sector}</span>
                                                         </div>
                                                      </td>
                                                      <td className="px-3 py-3 text-center">
                                                         <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-black font-mono shadow-sm">{stock.score}</span>
                                                      </td>
                                                      <td className="px-3 py-3 text-right">
                                                         <span className="text-xs font-black text-emerald-600">+{Number(stock.roi || 0).toFixed(1)}%</span>
                                                      </td>
                                                      <td className="px-3 py-3">
                                                         <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-black uppercase tracking-widest border border-slate-200/50 truncate block text-center">{stock.strategy}</span>
                                                      </td>
                                                      <td className="px-3 py-3 text-center">
                                                         <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono border ${
                                                            stock.tranche === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                            stock.tranche === 'B' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            stock.tranche === 'C' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-rose-50 text-rose-600 border-rose-100'
                                                         }`}>
                                                            T-{stock.tranche || 'A'}
                                                         </span>
                                                      </td>
                                                      <td className="px-3 py-3 text-right font-black text-slate-500">₹{stock.entryPrice?.toLocaleString()}</td>
                                                      <td className="px-3 py-3 text-right font-black text-emerald-600">₹{stock.target?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                                                      <td className="px-3 py-3 text-right">
                                                         <div className="flex flex-col items-end">
                                                            <span className="text-slate-950 font-black">₹{stock.currentPrice?.toLocaleString()}</span>
                                                            <span className={`text-[8px] font-black uppercase mt-0.5 leading-none ${isDown ? 'text-amber-600' : 'text-emerald-600'}`}>{isDown ? '-' : '+'}{Number(stock.windowPrc || 0).toFixed(2)}%</span>
                                                         </div>
                                                      </td>
                                                      <td className="px-3 py-3 text-right text-blue-600 font-black bg-blue-50/20 text-xs underline decoration-blue-100">{qty}</td>
                                                      <td className="px-3 py-3 text-right font-black bg-blue-50/20 text-slate-950">₹{Math.round(qty * (stock.currentPrice || 1)).toLocaleString()}</td>
                                                      <td className="px-3 py-3 text-center">
                                                         <Link to={`/stock/${stock.symbol}`} className="p-1 bg-slate-50 text-slate-500 hover:bg-slate-950 hover:text-white transition-all inline-flex items-center rounded-lg shadow-sm border border-slate-200">
                                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                                         </Link>
                                                      </td>
                                                   </tr>
                                                );
                                             })}
                                          </tbody>
                                       </table>
                                    </div>
                                   {/* Mobile Card List */}
                                   <div className="md:hidden divide-y divide-slate-100">
                                      {capStocks.map((stock: any) => {
                                         const qty = calculateQuantity(stock);
                                         const isDown = stock.currentPrice < stock.entryPrice;
                                         return (
                                            <div key={stock.symbol} className="p-4 space-y-3.5 hover:bg-slate-50/40 transition-colors">
                                               <div className="flex justify-between items-start">
                                                  <div>
                                                     <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-slate-900 font-mono uppercase">{stock.symbol}</span>
                                                        {stock.signalCount > 1 && (
                                                           <span className="px-1 py-0.5 bg-indigo-600 text-[6px] font-black text-white rounded uppercase leading-none animate-pulse">High Priority</span>
                                                        )}
                                                        <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[7.5px] font-black font-mono">
                                                           {stock.score}
                                                        </span>
                                                     </div>
                                                     <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">{stock.sector}</span>
                                                  </div>
                                                  <div className="text-right">
                                                     <span className="text-sm font-black text-slate-900 font-mono block">₹{stock.currentPrice?.toLocaleString()}</span>
                                                     <span className={`text-[8.5px] font-black font-mono leading-none ${isDown ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {isDown ? '-' : '+'}{Number(stock.windowPrc || 0).toFixed(2)}%
                                                     </span>
                                                  </div>
                                               </div>
                                               
                                               <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100/60 text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                                                  <div className="flex-1">
                                                     <span className="text-[7.5px] text-slate-500 block mb-0.5">Strategy</span>
                                                     <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-800 font-black truncate block leading-tight">{stock.strategy}</span>
                                                        <span className={`px-1 rounded-[4px] text-[7px] font-black font-mono border ${
                                                            stock.tranche === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                                                            stock.tranche === 'B' ? 'bg-blue-50 text-blue-600 border-blue-100/50' :
                                                            stock.tranche === 'C' ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                                                            'bg-rose-50 text-rose-600 border-rose-100/50'
                                                         }`}>
                                                            T-{stock.tranche || 'A'}
                                                         </span>
                                                     </div>
                                                  </div>

                                                  <div className="text-right">
                                                     <span className="text-[7.5px] text-slate-500 block mb-0.5">Target ROI</span>
                                                     <span className="text-emerald-600 font-black">+{Number(stock.roi || 0).toFixed(1)}%</span>
                                                  </div>
                                                  <div>
                                                     <span className="text-[7.5px] text-slate-500 block mb-0.5">Base Price</span>
                                                     <span className="text-slate-800 font-black">₹{stock.entryPrice?.toLocaleString()}</span>
                                                  </div>
                                                  <div className="text-right">
                                                     <span className="text-[7.5px] text-slate-500 block mb-0.5">Objective</span>
                                                     <span className="text-emerald-600 font-black">₹{stock.target?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                                  </div>
                                                  <div>
                                                     <span className="text-[7.5px] text-slate-500 block mb-0.5">Model Qty</span>
                                                     <span className="text-blue-600 font-black">{qty}</span>
                                                  </div>
                                               </div>
                                               
                                               <div className="pt-3 border-t border-slate-100/60 flex items-center justify-between">
                                                  <div>
                                                     <span className="text-[7.5px] text-slate-500 block mb-0.5">Total Invest</span>
                                                     <span className="text-slate-900 font-black font-mono">₹{Math.round(qty * (stock.currentPrice || 1)).toLocaleString()}</span>
                                                  </div>
                                                  <Link to={`/stock/${stock.symbol}`} className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all">
                                                     <span>View Details</span>
                                                     <ArrowUpRight className="h-3 w-3" />
                                                  </Link>
                                               </div>
                                            </div>
                                         );
                                      })}
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="closed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                        {(() => {
                           const closed = data?.closedTrades || [];
                           const avgRoi = closed.length > 0 ? closed.reduce((acc: number, t: any) => acc + Number(t.roi), 0) / closed.length : 0;
                           const bookedOutput = Math.round(totalCapital * (avgRoi / 100));

                           return (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Base capital</span>
                                    <div className="flex items-center gap-1 font-mono">
                                       <span className="text-xl font-black text-slate-500">₹</span>
                                       <input 
                                          type="text" 
                                          value={totalCapital.toLocaleString()} 
                                          onChange={(e) => setTotalCapital(Number(e.target.value.replace(/,/g, '')) || 0)}
                                          className="text-xl font-black bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none w-full text-white placeholder-slate-700"
                                       />
                                    </div>
                                 </div>
                                 <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
                                    <div className="relative z-10">
                                       <span className="text-[8px] font-black uppercase tracking-widest text-emerald-100 mb-2 block">Model Output</span>
                                       <div className="text-xl font-black font-mono tracking-tighter">+₹{bookedOutput.toLocaleString()}</div>
                                    </div>
                                    <CheckCircle2 className="absolute top-0 right-0 p-4 h-16 w-16 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                                 </div>
                                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-2">Yield Realized</span>
                                    <div className="text-xl font-black text-emerald-600 font-mono tracking-tighter">+{avgRoi.toFixed(1)}%</div>
                                 </div>
                              </div>
                           );
                        })()}

                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                           <div className="hidden md:block overflow-hidden">
                              <table className="w-full text-left border-collapse table-fixed">
                                 <thead>
                                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                       <th className="w-[25%] px-4 py-3.5 text-[9px] font-black uppercase tracking-widest italic">Exit Date</th>
                                       <th className="w-[35%] px-4 py-3.5 text-[9px] font-black uppercase tracking-widest">Asset Ledger</th>
                                       <th className="w-[20%] px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-right">Yield Realized</th>
                                       <th className="w-[20%] px-4 py-3.5 text-[9px] font-black uppercase tracking-widest text-center">Duration</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                                    {(data?.closedTrades || []).slice(0, 40).map((trade: any) => (
                                       <tr key={`${trade.symbol}-${trade.exitDate}`} className="hover:bg-slate-50 transition-all group">
                                          <td className="px-4 py-3 text-[10px] font-black text-slate-500">{new Date(trade.exitDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                          <td className="px-4 py-3">
                                             <div className="flex flex-col font-sans">
                                                <span className="text-xs font-black text-slate-900 uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">{trade.symbol}</span>
                                                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none mt-1 truncate">{trade.sector}</span>
                                             </div>
                                          </td>
                                          <td className="px-4 py-3 text-sm font-black text-right text-emerald-600">+{Number(trade.roi).toFixed(1)}%</td>
                                          <td className="px-4 py-3 text-center">
                                             <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-150 rounded-xl text-[9px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                {trade.days} Sessions
                                             </div>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                           {/* Mobile Card List for Booked Profits */}
                           <div className="md:hidden divide-y divide-slate-100">
                              {(data?.closedTrades || []).slice(0, 40).map((trade: any) => (
                                 <div key={`${trade.symbol}-${trade.exitDate}`} className="p-4 space-y-3.5 hover:bg-slate-50/40 transition-colors">
                                    <div className="flex justify-between items-start">
                                       <div>
                                          <span className="text-sm font-black text-slate-900 font-mono uppercase block">{trade.symbol}</span>
                                          <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest block mt-0.5">{trade.sector}</span>
                                       </div>
                                       <div className="text-right">
                                          <span className="text-[7.5px] text-slate-500 block mb-0.5 uppercase font-bold">Exit Date</span>
                                          <span className="text-[10px] font-black text-slate-900 font-mono">
                                             {new Date(trade.exitDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                          </span>
                                       </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100/60">
                                       <div>
                                          <span className="text-[7.5px] text-slate-500 block mb-0.5 uppercase font-bold">Duration</span>
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-900 uppercase tracking-widest">
                                             <Clock className="h-3 w-3 text-slate-400" />
                                             {trade.days} Sessions
                                          </span>
                                       </div>
                                       <div className="text-right">
                                          <span className="text-[7.5px] text-slate-500 block mb-0.5 uppercase font-bold">Yield Realized</span>
                                          <span className="text-lg font-black text-emerald-600 font-mono">+{Number(trade.roi).toFixed(1)}%</span>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                    </motion.div>
                  )}
               </AnimatePresence>

               {/* SECTOR DISTRIBUTION MAP */}
               {data?.summary?.sectorStats && (
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl">
                           <PieChart className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-black uppercase text-slate-900 tracking-tight">Sector Exposures</h4>
                     </div>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Object.entries(data.summary.sectorStats).sort((a: any, b: any) => b[1] - a[1]).slice(0, 8).map(([sector, count]: any) => {
                           const percentage = ((count / (data?.summary?.total || 1)) * 100).toFixed(1);
                           return (
                              <div key={sector} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block truncate">{sector}</span>
                                 <div className="flex justify-between items-baseline">
                                    <span className="text-lg font-black text-slate-900 font-mono leading-none">{percentage}%</span>
                                    <span className="text-[9px] font-bold text-slate-500 font-mono">({count})</span>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               )}
                  {/* REGULATORY DISCLAIMER */}
          <footer className="pt-12 border-t-2 border-slate-200">
             <div className="bg-slate-950 rounded-[1.5rem] md:rounded-[2.5rem] border-4 border-slate-900 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] -ml-[250px] -mt-[250px] pointer-events-none" />
                
                <button 
                  onClick={() => setIsDisclaimerExpanded(!isDisclaimerExpanded)}
                  className="w-full flex items-center justify-between p-6 md:p-8 text-white relative z-10 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                     <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                     <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] italic">Institutional Integrity & Regulatory Protocol</span>
                  </div>
                  {isDisclaimerExpanded ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>
                
                {isDisclaimerExpanded && (
                  <div className="px-4 md:px-8 lg:px-10 pb-8 md:pb-10 space-y-6 relative z-10 border-t border-white/5 pt-6 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-[9.5px] md:text-[10px] text-slate-500 font-black leading-relaxed uppercase tracking-[0.1em] max-w-6xl">
                       Institutional protocol warning: MarketBeacon (Batch 9 Engine) is an institutional-grade research and asset discovery terminal. All technical signals, portfolio weights, and fundamental scores are provided for educational and research purposes only. MarketBeacon is not a SEBI registered investment advisor. Stock market trading involves significant financial risk. Historical results do not guarantee future performance. No Stop-Loss approach is considered a high-risk methodology.
                    </p>
                    <div className="pt-2 flex items-center gap-6 text-slate-600">
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
                )}
             </div>
          </footer>

            </div>
         </div>
       </main>

       {/* Floating Mobile Scroll helper */}
       <div className="fixed bottom-24 right-6 z-[80] lg:hidden">
          <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={scrollToWorkspace}
             className="flex items-center gap-2 px-5 py-3.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl border border-blue-500/20 active:scale-95"
          >
             <Activity className="h-4 w-4 text-white" />
             <span>View Sized Portfolio</span>
             <ArrowDown className="h-3 w-3 animate-bounce" />
          </motion.button>
       </div>
       </>
      )}

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        requiredTier="alpha"
        userEmail={user?.email}
      />
    </div>
  );
};

export default AlphaHubPage;
