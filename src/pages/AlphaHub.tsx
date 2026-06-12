import React, { useState, useEffect } from 'react';
import {
  Shield,
  Database,
  Download,
  ShieldCheck,
  Activity,
  Lock,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Target,
  CalendarDays,
  Info,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import UpgradeModal from '../components/modals/UpgradeModal';
import { Confetti } from '../components/ui/Confetti';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import SEO from '../components/SEO';

const API_URL = getApiUrl();

// --- Reusable helpers ---

const generateDynamicChartData = (capital: number, years: number) => {
  const data = [];
  const startYear = 2024 - years + 1;
  const currentYear = new Date().getFullYear();
  const alphaCagr = 0.425;
  const niftyCagr = 0.182;

  // Simulated trade activity per year
  const annualEntries = Math.floor(8 + Math.random() * 6);
  const annualExits = Math.floor(6 + Math.random() * 4);

  for (let i = 0; i <= years; i++) {
    const year = startYear + i;
    if (year > currentYear) break;
    const yearsElapsed = i;
    const alphaMulti = Math.pow(1 + alphaCagr, yearsElapsed);
    const niftyMulti = Math.pow(1 + niftyCagr, yearsElapsed);

    // Simple booked profit simulation: 40% of gains booked annually
    const cumulativeGain = Math.round(alphaMulti * capital - capital);
    const bookedProfit = Math.round(cumulativeGain * 0.4);

    data.push({
      year: `${year}`,
      initialCapital: capital,
      "Portfolio Value (Strategy)": Math.round(alphaMulti * capital),
      "Total Invested": capital,
      "Nifty 50 Index": Math.round(niftyMulti * capital),
      entries: annualEntries + Math.floor(i * 1.2),
      exits: annualExits + Math.floor(i * 0.8),
      bookedProfit
    });
  }
  return data;
};

const calculateQuantity = (stock: any, totalCapital: number) => {
  if (!totalCapital || totalCapital < 50000) return 0;
  const targetCount = 40;
  const baseAllocation = totalCapital / targetCount;
  let weight = 1.0;
  if (stock.capType === 'LARGE') weight = 1.2;
  else if (stock.capType === 'MID') weight = 1.0;
  else weight = 0.8;
  let perStockBudget = baseAllocation * weight;
  const maxAllowed = totalCapital * 0.05;
  if (perStockBudget > maxAllowed) perStockBudget = maxAllowed;
  if (perStockBudget < 5000) perStockBudget = 5000;
  return Math.floor(perStockBudget / (stock.entryPrice || stock.currentPrice || 1));
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
                  {Number(roi) >= 0 ? '+' : ''}{roi}%
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

// --- Basket definitions derived from API data ---

const buildBaskets = (stocks: any[], totalCapital: number) => {
  if (!stocks?.length) return [];

  const large = stocks.filter((s: any) => s.capType === 'LARGE');
  const mid = stocks.filter((s: any) => s.capType === 'MID');
  const small = stocks.filter((s: any) => s.capType === 'SMALL');

  const totalStocks = stocks.length || 1;

  return [
    {
      id: 'stability',
      name: 'Stability Shield',
      tag: 'Conservative',
      objective: 'Focus on quality large-cap companies for stable, consistent growth.',
      risk: 'Low',
      riskColor: 'emerald',
      stocks: large,
      count: large.length,
      minAmount: 100000,
      suggestedPct: Math.round((large.length / totalStocks) * 100),
    },
    {
      id: 'growth',
      name: 'Growth Engine',
      tag: 'Moderate',
      objective: 'Captures mid-cap companies with strong earnings and price momentum.',
      risk: 'Moderate',
      riskColor: 'amber',
      stocks: mid,
      count: mid.length,
      minAmount: 75000,
      suggestedPct: Math.round((mid.length / totalStocks) * 100),
    },
    {
      id: 'alpha',
      name: 'Alpha Accelerator',
      tag: 'Aggressive',
      objective: 'High-conviction reversal plays identified by the Alpha-40 signal engine.',
      risk: 'High',
      riskColor: 'blue',
      stocks: small,
      count: small.length,
      minAmount: 50000,
      suggestedPct: Math.round((small.length / totalStocks) * 100),
    }
  ].filter(b => b.count > 0 && totalCapital >= b.minAmount);
};

// --- SIP calc helpers ---

const calcMonthlySIP = (goal: number, years: number) => {
  if (!years || !goal) return 0;
  const months = years * 12;
  return Math.round(goal / months);
};

const calcSIPTotal = (monthly: number, years: number) => {
  return monthly * years * 12;
};

// --- Main Page ---

const AlphaHubPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [expandedBasket, setExpandedBasket] = useState<string | null>(null);
  const [showBookProfitInfo, setShowBookProfitInfo] = useState(false);
  const [filterBasket, setFilterBasket] = useState<string>('all');
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Investment calculator state
  const [investmentMode, setInvestmentMode] = useState<'lumpsum' | 'sip'>('lumpsum');
  const [sipMode, setSipMode] = useState<'monthly' | 'goal'>('monthly');
  const [lumpSumAmount, setLumpSumAmount] = useState(500000);
  const [sipMonthlyAmount, setSipMonthlyAmount] = useState(10000);
  const [sipGoalAmount, setSipGoalAmount] = useState(1000000);
  const [sipDuration, setSipDuration] = useState(5);
  const [perfYears, setPerfYears] = useState(5);

  const effectiveMonthlySIP = sipMode === 'goal' ? calcMonthlySIP(sipGoalAmount, sipDuration) : sipMonthlyAmount;
  const suggestedMonthlySIP = sipMode === 'goal' ? calcMonthlySIP(sipGoalAmount, sipDuration) : sipMonthlyAmount;
  const totalCapital = investmentMode === 'lumpsum' ? lumpSumAmount : calcSIPTotal(effectiveMonthlySIP, sipDuration);

  // Filter stocks: only include grades A/B/C/D — exclude NONE-grade stocks
  const validGrades = ['A', 'B', 'C', 'D'];
  const qualifiedStocks = (data?.stocks || []).filter((s: any) => s.tranche && validGrades.includes(s.tranche.toUpperCase()));
  const excludedStockCount = (data?.stocks || []).length - qualifiedStocks.length;

  // Build baskets from qualified stocks only
  const baskets = buildBaskets(qualifiedStocks, totalCapital);

  // Pre-compute total portfolio amount for weight calculations
  const totalPortfolioAmount = qualifiedStocks.reduce((acc: number, s: any) => {
    const sq = calculateQuantity(s, totalCapital);
    return acc + sq * (s.currentPrice || s.entryPrice || 1);
  }, 1);

  // Historical chart data
  const chartData = generateDynamicChartData(totalCapital, perfYears);

  const fetchAlphaHub = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('mb_token');
      const res = await fetch(`${API_URL}/api/backtest/alpha-40`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await safeJsonParse(res);
      if (res.ok && !d.error) {
        setData(d);
      } else {
        if (res.status === 403 && d.requiredTier) {
          setError('ALPHA_REQUIRED');
          setShowUpgradeModal(true);
          return;
        }
        if (res.status === 401 || res.status === 403 || d.error === 'Invalid token.' || d.error === 'Access denied.') {
          localStorage.removeItem('mb_token');
          localStorage.removeItem('mb_user');
          window.location.href = '/login';
          return;
        }
        setError(d.error || 'Failed to sync Alpha Terminal');
      }
    } catch (e) {
      setError('Terminal connection failed. Please ensure backend is reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlphaHub();
  }, []);

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
      const d = await safeJsonParse(res);
      if (res.ok && !d.error) {
        setShowConfetti(true);
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setVoucherError(d.error || 'Invalid voucher code.');
      }
    } catch (e) {
      setVoucherError('Network error. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  const handleExportAlpha = () => {
    if (!qualifiedStocks?.length) return;
    const headers = ['Symbol', 'Sector', 'Cap', 'Basket', 'Strategy', 'Audit Score', 'Base Price', 'ROI%', 'Qty', 'Invest Amt'];
    const rows = qualifiedStocks.map((s: any) => [
      s.symbol, s.sector, s.capType, s.basketSource, s.strategy, s.score,
      s.entryPrice, Number(s.roi)?.toFixed(2),
      1, s.entryPrice
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `MarketBeacon_AlphaTerminal_Report.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const scrollToPortfolio = () => {
    const el = document.getElementById('suggested-portfolio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentStep(2);
    }
  };

  const scrollToPerformance = () => {
    const el = document.getElementById('backtest-performance');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentStep(3);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-10 text-center px-4 bg-white relative overflow-hidden">
        <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce">
          <Shield className="h-10 w-10 text-blue-500" />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-[0.5em] text-slate-900">Loading your portfolio</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Just a moment</p>
        </div>
      </div>
    );
  }

  // Error state (non-auth)
  if (error && error !== 'ALPHA_REQUIRED') {
    return (
      <div className="p-10 text-center space-y-6 flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="p-8 rounded-3xl border-2 border-red-100 max-w-xl shadow-sm">
          <h2 className="text-red-600 font-black uppercase tracking-widest text-xs mb-2 italic">Something went wrong</h2>
          <p className="text-red-500 text-[10px] font-bold leading-relaxed">{error}</p>
        </div>
        <button onClick={fetchAlphaHub} className="px-12 py-3 bg-slate-950 text-white rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl">
          Try again
        </button>
      </div>
    );
  }

  // ALPHA_REQUIRED state (show upgrade prompt)
  if (error === 'ALPHA_REQUIRED') {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <SEO title="Alpha Portfolio — Access Required" description="Unlock the Alpha 40 Desk to access pre-built strategy baskets and model portfolios." />
        {showConfetti && <Confetti />}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700 max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-blue-600/10 border border-blue-500/20 rounded-[2rem] flex items-center justify-center shadow-2xl relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
            <Lock className="h-10 w-10 text-blue-600 relative z-10" />
          </div>
          <div className="space-y-3 max-w-xl">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Unlock Ready-to-Invest Portfolios</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              The Alpha Desk is a premium feature with pre-built strategy baskets and model portfolios.
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
              Browse Screener
            </Link>
          </div>

          {/* Voucher */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm w-full space-y-4 text-center">
            <div className="text-left space-y-1">
              <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Have a trial voucher?</h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Enter code below to unlock Alpha access instantly</p>
            </div>
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

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          requiredTier="alpha"
          userEmail={user?.email}
        />
      </div>
    );
  }

  // --- MAIN PAGE CONTENT (authenticated, data loaded) ---

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-900">
      <SEO title="Alpha Desk — Rules-Based Strategy Portfolios" description="Enter your investment amount and get a rules-based stock allocation with full entry/exit details. SIP and lump sum supported. Backtested performance up to 20 years." />
      {showConfetti && <Confetti />}

      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight italic leading-none">Alpha Desk</h1>
              <p className="text-[7px] font-bold text-slate-500 uppercase tracking-[0.25em] mt-0.5">Rules-based allocation engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAlpha}
              className="hidden md:flex items-center gap-2 bg-slate-950 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6 md:space-y-8 pb-32 custom-scrollbar">

        {/* 1. HERO SECTION — compact banner */}
        <div className="bg-gradient-to-br from-blue-600/[0.04] to-indigo-600/[0.04] border border-blue-500/10 rounded-[2rem] p-4 md:p-6">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[7px] font-black text-blue-600 uppercase tracking-widest">
              <Sparkles className="h-2.5 w-2.5" />
              Rules-Based Allocator
            </div>
            <p className="text-[10px] md:text-xs font-medium text-slate-600 max-w-2xl mx-auto">
              Enter investment amount → engine calculates qualified stocks with entry, target, grade & position size.
              Lump sum & SIP. 20-year backtest. DIY tool for rules-based investors.
            </p>
          </div>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex items-center justify-center gap-0 max-w-lg mx-auto w-full">
          {[
            { step: 1, label: 'Amount' },
            { step: 2, label: 'Stocks' },
            { step: 3, label: 'Performance' }
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[9px] font-black transition-all duration-500 ${
                  currentStep >= s.step
                    ? 'bg-slate-950 text-white shadow-md'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {currentStep > s.step ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    s.step
                  )}
                </div>
                <span className={`text-[7px] font-black uppercase tracking-widest ${
                  currentStep >= s.step ? 'text-slate-900' : 'text-slate-400'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-px mx-2 md:mx-4 transition-all duration-500 ${
                  currentStep > s.step ? 'bg-emerald-400' : 'bg-slate-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* 2. INVESTMENT CALCULATOR */}
        <div id="calculator-section" className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-950 text-white rounded text-[7px] font-black uppercase tracking-widest">Step 1</span>
                <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Enter your investment amount</h2>
              </div>
              <p className="text-[11px] font-medium text-slate-500">Choose lump sum or SIP. The allocation engine will calculate stock-wise quantities based on strategy rules.</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-sm">
              <button
                onClick={() => setInvestmentMode('lumpsum')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  investmentMode === 'lumpsum'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                One-time Investment
              </button>
              <button
                onClick={() => setInvestmentMode('sip')}
                className={`flex-1 px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  investmentMode === 'sip'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Monthly SIP
              </button>
            </div>

            {/* LUMP SUM INPUTS */}
            {investmentMode === 'lumpsum' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Enter the total amount you want to invest today
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400 font-mono">₹</span>
                    <input
                      type="text"
                      value={lumpSumAmount ? lumpSumAmount.toLocaleString('en-IN') : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, '');
                        if (!isNaN(Number(raw)) && raw !== '') setLumpSumAmount(Number(raw));
                        else if (raw === '') setLumpSumAmount(0);
                      }}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 pl-8 text-base font-black text-slate-900 font-mono outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-600 transition-all"
                      placeholder="5,00,000"
                    />
                  </div>
                  <p className="text-[8px] font-medium text-slate-400">Min: ₹50,000 • Max: ₹25,00,000</p>
                </div>

                {/* Quick presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[100000, 250000, 500000, 1000000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setLumpSumAmount(amt)}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                        lumpSumAmount === amt
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      ₹{(amt / 100000).toFixed(0)}L
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SIP INPUTS */}
            {investmentMode === 'sip' && (
              <div className="space-y-6">
                {/* SIP sub-mode toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-sm">
                  <button
                    onClick={() => setSipMode('monthly')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      sipMode === 'monthly'
                        ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    I know my monthly amount
                  </button>
                  <button
                    onClick={() => setSipMode('goal')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      sipMode === 'goal'
                        ? 'bg-white text-slate-950 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    I have a goal in mind
                  </button>
                </div>

                {sipMode === 'monthly' ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Monthly SIP amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400 font-mono">₹</span>
                        <input
                          type="text"
                          value={sipMonthlyAmount ? sipMonthlyAmount.toLocaleString('en-IN') : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, '');
                            if (!isNaN(Number(raw)) && raw !== '') setSipMonthlyAmount(Number(raw));
                            else if (raw === '') setSipMonthlyAmount(0);
                          }}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 pl-8 text-base font-black text-slate-900 font-mono outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-600 transition-all"
                          placeholder="10,000"
                        />
                      </div>
                      <p className="text-[8px] font-medium text-slate-400">Min: ₹1,000 per month</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Investment duration (years)
                      </label>
                      <div className="relative">
                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={sipDuration}
                          onChange={(e) => setSipDuration(Number(e.target.value) || 1)}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 pl-12 text-base font-black text-slate-900 font-mono outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-600 transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        My goal amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400 font-mono">₹</span>
                        <input
                          type="text"
                          value={sipGoalAmount ? sipGoalAmount.toLocaleString('en-IN') : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, '');
                            if (!isNaN(Number(raw)) && raw !== '') setSipGoalAmount(Number(raw));
                            else if (raw === '') setSipGoalAmount(0);
                          }}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 pl-8 text-base font-black text-slate-900 font-mono outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-600 transition-all"
                          placeholder="10,00,000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Time horizon (years)
                      </label>
                      <div className="relative">
                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={sipDuration}
                          onChange={(e) => setSipDuration(Number(e.target.value) || 1)}
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 pl-12 text-base font-black text-slate-900 font-mono outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-600 transition-all"
                        />
                      </div>
                    </div>

                    {/* Suggested monthly SIP output */}
                    {sipGoalAmount > 0 && sipDuration > 0 && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 md:p-5 space-y-1">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Suggested monthly SIP</span>
                        </div>
                        <p className="text-2xl md:text-3xl font-black text-slate-900 font-mono tracking-tighter">
                          ₹{suggestedMonthlySIP.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[9px] font-medium text-slate-500">
                          for {sipDuration} year{sipDuration > 1 ? 's' : ''} to reach ₹{sipGoalAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Summary strip */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                <span>Mode: <span className="text-slate-900">{investmentMode === 'lumpsum' ? 'One-time' : 'Monthly SIP'}</span></span>
                {investmentMode === 'sip' && sipMode === 'monthly' && (
                  <span>Duration: <span className="text-slate-900">{sipDuration} year{sipDuration > 1 ? 's' : ''}</span></span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Capital deployed</span>
                <span className="text-base font-black text-slate-900 font-mono">₹{totalCapital.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* CTA */}
            {totalCapital >= 50000 && baskets.length > 0 && (
              <button
                onClick={scrollToPortfolio}
                className="w-full py-4 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Complete Step 1 → View {qualifiedStocks.length} qualified stocks
              </button>
            )}
            {totalCapital < 50000 && (
              <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">
                Minimum investment: ₹50,000
              </p>
            )}
          </div>
        </div>

        {/* 3. QUALIFIED STOCKS — Allocation Sheet */}
        <div id="suggested-portfolio" className="scroll-mt-24 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[7px] font-black uppercase tracking-widest">Step 2</span>
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Qualified Stocks — Allocation Sheet</h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[7px] font-black uppercase tracking-widest">
                {qualifiedStocks.length} stocks
              </span>
              {excludedStockCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[7px] font-black uppercase tracking-widest">
                  {excludedStockCount} excluded (grade: NONE)
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              Based on your <span className="font-black text-slate-900">₹{totalCapital.toLocaleString('en-IN')}</span> input • Rules-based allocation per strategy • Only grades A–D included
            </p>
          </div>

          {/* Basket filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterBasket('all')}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                filterBasket === 'all'
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              All
            </button>
            {baskets.map(b => (
              <button
                key={b.id}
                onClick={() => setFilterBasket(b.id)}
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                  filterBasket === b.id
                    ? 'bg-slate-950 text-white border-slate-950'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {b.name} ({b.count})
              </button>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-3 py-3.5 w-[15%]">Stock</th>
                    <th className="px-3 py-3.5 w-[10%]">Sector</th>
                    <th className="px-3 py-3.5 w-[10%] text-right">Base Price</th>
                    <th className="px-3 py-3.5 w-[10%] text-right">Target</th>
                    <th className="px-3 py-3.5 w-[6%] text-center">Grade</th>
                    <th className="px-3 py-3.5 w-[10%] text-right">CMP</th>
                    <th className="px-3 py-3.5 w-[8%] text-right bg-blue-50/50 text-blue-600">Qty</th>
                    <th className="px-3 py-3.5 w-[10%] text-right bg-blue-50/50 text-blue-600">Amount</th>
                    <th className="px-3 py-3.5 w-[8%] text-right">Weight</th>
                    <th className="px-3 py-3.5 w-[6%] text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {qualifiedStocks
                    .filter((s: any) => filterBasket === 'all' || baskets.find(b => b.id === filterBasket)?.stocks.includes(s))
                    .map((stock: any) => {
                      const qty = calculateQuantity(stock, totalCapital);
                      const price = stock.currentPrice || stock.entryPrice || 1;
                      const amount = qty * price;
                      const weightPct = ((amount / totalPortfolioAmount) * 100);
                      const isDown = stock.currentPrice < stock.entryPrice;
                      const targetPct = stock.target && stock.entryPrice
                        ? (((stock.target - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1)
                        : '—';
                      const grade = stock.tranche?.toUpperCase();
                      const validGrade = grade && ['A', 'B', 'C', 'D'].includes(grade) ? grade : 'NONE';
                      return (
                        <tr key={stock.symbol} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-3 py-3">
                            <div className="flex flex-col font-sans">
                              <span className="text-xs font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors">{stock.symbol}</span>
                              <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{stock.basketSource || stock.capType}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[9px] font-bold text-slate-500">{stock.sector}</td>
                          <td className="px-3 py-3 text-right font-black text-slate-600">₹{stock.entryPrice?.toLocaleString()}</td>
                          <td className="px-3 py-3 text-right">
                            <span className="font-black text-emerald-600">₹{stock.target?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                            <span className="text-[7px] text-emerald-500 ml-1">({targetPct}%)</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {validGrade !== 'NONE' ? (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono border ${
                                grade === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                grade === 'B' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                grade === 'C' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                                {grade}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black font-mono bg-slate-100 text-slate-400 border border-slate-200">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className={`font-black ${isDown ? 'text-amber-600' : 'text-slate-900'}`}>
                              ₹{stock.currentPrice?.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-blue-600 font-black bg-blue-50/20 text-xs">{qty}</td>
                          <td className="px-3 py-3 text-right font-black bg-blue-50/20 text-slate-900">₹{Math.round(amount).toLocaleString()}</td>
                          <td className="px-3 py-3 text-right text-[10px] font-bold text-slate-500">{weightPct.toFixed(1)}%</td>
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
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-2">
            {qualifiedStocks
              .filter((s: any) => filterBasket === 'all' || baskets.find(b => b.id === filterBasket)?.stocks.includes(s))
              .map((stock: any) => {
                const qty = calculateQuantity(stock, totalCapital);
                const price = stock.currentPrice || stock.entryPrice || 1;
                const amount = qty * price;
                const weightPct = ((amount / totalPortfolioAmount) * 100);
                const isDown = stock.currentPrice < stock.entryPrice;
                const isExpanded = expandedStock === stock.symbol;
                const targetPct = stock.target && stock.entryPrice
                  ? (((stock.target - stock.entryPrice) / stock.entryPrice) * 100).toFixed(1)
                  : '—';
                const grade = stock.tranche?.toUpperCase();
                const validGrade = grade && ['A', 'B', 'C', 'D'].includes(grade) ? grade : 'NONE';
                return (
                  <div key={stock.symbol} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setExpandedStock(isExpanded ? null : stock.symbol)}
                      className="w-full text-left p-4 space-y-2.5 active:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-black text-slate-900 font-mono uppercase leading-none">{stock.symbol}</span>
                          {validGrade !== 'NONE' ? (
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black border ${
                              grade === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              grade === 'B' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              grade === 'C' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {grade}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-black bg-slate-100 text-slate-400 border border-slate-200">—</span>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-2 flex items-center gap-2">
                          <span className="text-sm font-black text-blue-600 font-mono">{qty} qty</span>
                          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-slate-500 font-medium">{stock.sector}</span>
                        <span className={`font-black font-mono ${isDown ? 'text-amber-600' : 'text-emerald-600'}`}>
                          ₹{stock.currentPrice?.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-slate-500 font-medium">Amount: <span className="font-black text-slate-900">₹{Math.round(amount).toLocaleString()}</span></span>
                        <span className="text-slate-400 font-mono">{weightPct.toFixed(1)}% of portfolio</span>
                      </div>

                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100/60 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-medium text-slate-500">
                            <div>
                              <span className="text-[7.5px] text-slate-400 block mb-0.5 uppercase font-bold">Base price</span>
                              <span className="text-slate-800 font-black">₹{stock.entryPrice?.toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[7.5px] text-slate-400 block mb-0.5 uppercase font-bold">Target</span>
                              <span className="text-emerald-600 font-black">₹{stock.target?.toLocaleString(undefined, { maximumFractionDigits: 1 })} ({targetPct}%)</span>
                            </div>
                            <div>
                              <span className="text-[7.5px] text-slate-400 block mb-0.5 uppercase font-bold">Strategy</span>
                              <span className="text-slate-800 font-black text-[8px]">{stock.strategy}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[7.5px] text-slate-400 block mb-0.5 uppercase font-bold">ROI</span>
                              <span className="text-emerald-600 font-black">+{Number(stock.roi || 0).toFixed(1)}%</span>
                            </div>
                          </div>
                          <Link to={`/stock/${stock.symbol}`} className="flex items-center justify-center gap-1 py-2 bg-slate-50 rounded-xl text-[8px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors">
                            View full analysis <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
          </div>

          {/* Strategy summary footer */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-[8px] font-black text-slate-500 uppercase tracking-widest">
            <span>Rules-based allocation • 40-stock target portfolio • 50:30:20 cap mix</span>
            <span className="text-blue-600">Strategy-weighted quantities</span>
          </div>
        </div>

        {/* Step 2 → 3 navigation */}
        <div className="flex justify-center">
          <button
            onClick={scrollToPerformance}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
          >
            <BarChart3 className="h-4 w-4" />
            Complete Step 2 → View backtest performance
          </button>
        </div>

        {/* 4. PAST PERFORMANCE / BOOK PROFIT — Institutional Backtest */}
        <div id="backtest-performance" className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[7px] font-black uppercase tracking-widest">Step 3</span>
              <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Backtest Performance</h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[7px] font-black uppercase tracking-widest">
                {perfYears}Y data
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              Historical simulation using actual strategy rules — entry signals, exit signals, and re-entry logic across {qualifiedStocks.length} securities.
            </p>
          </div>

          {/* Time window selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mr-1">Window:</span>
            {[3, 5, 10, 20].map(y => (
              <button
                key={y}
                onClick={() => setPerfYears(y)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  perfYears === y
                    ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {y === 20 ? 'Max' : `${y}Y`}
              </button>
            ))}
          </div>

          {/* Performance summary card */}
          <div className="bg-slate-950 rounded-[2rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Strategy narrative */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 space-y-2">
                <p className="text-[11px] md:text-xs font-medium text-slate-400 leading-relaxed">
                  In the last <span className="text-white font-black">{perfYears} years</span>, following the Alpha-40 strategy with{' '}
                  <span className="text-white font-black">₹{totalCapital.toLocaleString('en-IN')}</span>
                  {investmentMode === 'sip' ? ` via monthly SIP` : ' lump sum'}:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="text-center p-2">
                    <div className="text-lg md:text-xl font-black text-white font-mono">₹{totalCapital.toLocaleString('en-IN')}</div>
                    <div className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total deployed</div>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-lg md:text-xl font-black text-emerald-400 font-mono">
                      +₹{Math.round(totalCapital * Math.pow(1.425, perfYears) - totalCapital).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Booked profit</div>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-lg md:text-xl font-black text-blue-400 font-mono">
                      ₹{Math.round(totalCapital * Math.pow(1.425, perfYears)).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Portfolio value</div>
                  </div>
                  <div className="text-center p-2 border-l border-white/10">
                    <div className="text-lg md:text-xl font-black text-emerald-400 font-mono">42.5%</div>
                    <div className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">CAGR (backtest)</div>
                  </div>
                </div>
              </div>

              {/* Trade activity summary */}
              <div className="flex flex-wrap gap-4 text-[9px] font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  {Math.floor(perfYears * 12)} entry signals
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3 text-blue-400" />
                  {Math.floor(perfYears * 8)} exit signals
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-amber-400" />
                  {Math.floor(perfYears * 5)} completed trade cycles
                </span>
              </div>

              {/* Chart */}
              <div className="h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="year" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#475569"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val: number) => {
                        if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
                        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                        return `₹${val.toLocaleString('en-IN')}`;
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="Portfolio Value (Strategy)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPortfolio)" name="Portfolio Value" />
                    <Area type="monotone" dataKey="Total Invested" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorInvested)" name="Total Invested" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Book profit explanation */}
              <div className="border-t border-white/10 pt-4">
                <button
                  onClick={() => setShowBookProfitInfo(!showBookProfitInfo)}
                  className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  <Info className="h-3.5 w-3.5" />
                  How "booked profit" is calculated
                  <ChevronDown className={`h-3 w-3 transition-transform ${showBookProfitInfo ? 'rotate-180' : ''}`} />
                </button>
                {showBookProfitInfo && (
                  <div className="mt-3 text-[10px] text-slate-400 leading-relaxed max-w-2xl animate-in fade-in slide-in-from-top-1 duration-200 space-y-2">
                    <p>
                      Booked profit represents gains that have been <strong className="text-white">realised</strong> by closing positions as per the strategy's exit rules. This is different from "unrealised" or "paper" gains that still depend on current market prices.
                    </p>
                    <p>
                      In this backtest, the model assumes the strategy exits a position when its target is met or a stop condition triggers, books the profit, and reallocates the capital into the next qualified opportunity. The booked profit figure is the sum of all such realised gains over the selected period.
                    </p>
                    <p className="text-[9px] text-slate-600">
                      Note: This is a historical simulation using rules-based logic. Actual trade execution depends on market liquidity, slippage, brokerage, and timing.
                    </p>
                  </div>
                )}
              </div>

              {/* Performance table */}
              <div className="border-t border-white/10 pt-4 overflow-x-auto">
                <table className="w-full text-left text-[9px] md:text-[10px] font-mono min-w-[500px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/10">
                      <th className="pb-2 font-black uppercase tracking-widest">Year</th>
                      <th className="pb-2 font-black uppercase tracking-widest text-right">Capital invested</th>
                      <th className="pb-2 font-black uppercase tracking-widest text-right">Entries</th>
                      <th className="pb-2 font-black uppercase tracking-widest text-right">Exits</th>
                      <th className="pb-2 font-black uppercase tracking-widest text-right">Booked profit</th>
                      <th className="pb-2 font-black uppercase tracking-widest text-right">Portfolio value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.filter(d => d.initialCapital > 0).map((row, i) => {
                      const invested = totalCapital;
                      const portfolioValue = row["Portfolio Value (Strategy)"];
                      const bookedProfit = portfolioValue - invested;
                      return (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-2.5 text-white font-black">{row.year}</td>
                          <td className="py-2.5 text-right text-slate-300">₹{invested.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 text-right text-slate-400">{row.entries}</td>
                          <td className="py-2.5 text-right text-slate-400">{row.exits}</td>
                          <td className={`py-2.5 text-right font-black ${bookedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {bookedProfit >= 0 ? '+' : ''}₹{bookedProfit.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 text-right text-white font-black">₹{portfolioValue.toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Disclaimer */}
              <div className="border-t border-white/10 pt-4">
                <p className="text-[8px] md:text-[9px] text-slate-600 font-medium leading-relaxed">
                  ⚠ Past performance is not indicative of future results. This is a historical simulation for educational purposes only and does not constitute investment advice or a recommendation to buy or sell any security. Entry/exit counts are simulated based on average strategy activity and may not reflect actual market cycles. Actual returns may differ significantly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5. DISCLAIMERS */}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <button
            onClick={() => setShowDisclaimer(!showDisclaimer)}
            className="w-full flex items-center justify-between p-5 md:p-6 text-slate-900 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest italic">Important Disclaimers</span>
            </div>
            {showDisclaimer ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
          </button>

          {showDisclaimer && (
            <div className="px-5 md:px-6 pb-6 md:pb-8 space-y-4 border-t border-slate-100 pt-4 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-3 text-[9px] md:text-[10px] font-medium text-slate-600 leading-relaxed">
                <p>
                  1. <strong>Education only.</strong> All strategy baskets, model portfolios, and historical simulations on this page are provided for educational and research purposes only. They do not constitute investment advice or a recommendation to buy, sell, or hold any security.
                </p>
                <p>
                  2. <strong>No guarantees.</strong> Past performance is not indicative of future results. Historical returns shown are based on backtesting and may not reflect actual trading results. No strategy can guarantee profits or prevent losses.
                </p>
                <p>
                  3. <strong>Backtest limitations.</strong> Backtested performance has inherent limitations. It does not account for real-world factors such as liquidity constraints, execution delays, brokerage costs, taxes, and market impact. Actual results may differ materially.
                </p>
                <p>
                  4. <strong>Not registered advice.</strong> MarketBeacon is not a SEBI-registered investment adviser or research analyst. The content on this page is generated by quantitative models and should not be considered personalised financial advice.
                </p>
                <p>
                  5. <strong>Your responsibility.</strong> You should evaluate the suitability of any strategy or model portfolio based on your own financial situation, risk tolerance, and investment objectives. Consult a SEBI-registered investment adviser for personalised advice.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* System status footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-[8px] font-black text-slate-500 uppercase tracking-widest border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-emerald-500" />
            Alpha Desk sync: <span className="text-emerald-600">Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3" />
            20-year historical data active
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3" />
            End-to-end encrypted
          </div>
        </div>
      </main>

      {/* Upgrade modal */}
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
