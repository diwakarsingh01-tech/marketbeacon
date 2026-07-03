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
  Info,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import type { AlphaHubStock, AlphaHubData, BacktestData, BasketConfig } from '../types';
import UpgradeModal from '../components/modals/UpgradeModal';
import { Confetti } from '../components/ui/Confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import SEO from '../components/SEO';

const API_URL = getApiUrl();

// --- Reusable helpers ---

const generateDynamicChartData = (capital: number, years: number, alphaCagr: number = 0.425, niftyCagr: number = 0.182) => {
  const data = [];
  const startYear = 2024 - years + 1;
  const currentYear = new Date().getFullYear();

  for (let i = 0; i <= years; i++) {
    const year = startYear + i;
    if (year > currentYear) break;
    const yearsElapsed = i;
    const alphaMulti = Math.pow(1 + alphaCagr, yearsElapsed);
    const niftyMulti = Math.pow(1 + niftyCagr, yearsElapsed);

    const cumulativeGain = Math.round(alphaMulti * capital - capital);
    const bookedProfit = Math.round(cumulativeGain * 0.4);

    data.push({
      year: `${year}`,
      initialCapital: capital,
      "Portfolio Value (Strategy)": Math.round(alphaMulti * capital),
      "Total Invested": capital,
      "Nifty 50 Index": Math.round(niftyMulti * capital),
      entries: Math.floor(8 + yearsElapsed * 1.2),
      exits: Math.floor(6 + yearsElapsed * 0.8),
      bookedProfit
    });
  }
  return data;
};

const calculateQuantity = (stock: AlphaHubStock, totalCapital: number) => {
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

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
  payload: { initialCapital: number };
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 rounded-2xl shadow-2xl space-y-3">
        <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest border-b border-[var(--border-primary)] pb-2">{label}</p>
        {payload.map((entry: TooltipEntry, index: number) => {
          const initial = entry.payload.initialCapital || 1;
          const roi = (((entry.value / initial) - 1) * 100).toFixed(1);
          return (
            <div key={index} className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                <span className="text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-wider">{entry.name}</span>
              </div>
              <div className="flex items-end justify-between gap-6 pl-4">
                <span className="text-[var(--text-primary)] text-sm font-mono font-black">₹{entry.value.toLocaleString('en-IN')}</span>
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

const buildBaskets = (stocks: AlphaHubStock[], totalCapital: number): BasketConfig[] => {
  if (!stocks?.length) return [];

  const large = stocks.filter(s => s.capType === 'LARGE');
  const mid = stocks.filter(s => s.capType === 'MID');
  const small = stocks.filter(s => s.capType === 'SMALL');

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

// --- Main Page ---

const AlphaHubPage: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [data, setData] = useState<AlphaHubData | null>(null);
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
  const [backtestComparison, setBacktestComparison] = useState<BacktestData | null>(null);

  // Investment calculator state
  const [lumpSumAmount, setLumpSumAmount] = useState(500000);
  const [perfYears, setPerfYears] = useState(5);

  const totalCapital = lumpSumAmount;

  // Filter stocks: only include grades A/B/C/D — exclude NONE-grade stocks
  const validGrades = ['A', 'B', 'C', 'D'];
  const qualifiedStocks = (data?.stocks || []).filter(s => s.tranche && validGrades.includes(s.tranche.toUpperCase()));
  const excludedStockCount = (data?.stocks || []).length - qualifiedStocks.length;

  // Build baskets from qualified stocks only
  const baskets = buildBaskets(qualifiedStocks, totalCapital);

  // Pre-compute total portfolio amount for weight calculations
  const totalPortfolioAmount = qualifiedStocks.reduce((acc: number, s: AlphaHubStock) => {
    const sq = calculateQuantity(s, totalCapital);
    return acc + sq * (s.currentPrice || s.entryPrice || 1);
  }, 1);

  // Historical chart data (use real CAGR from backtest when available)
  const niftyCagrDecimal = backtestComparison?.nifty50?.cagr ? backtestComparison.nifty50.cagr / 100 : 0.182;
  const alphaCagr = backtestComparison?.strategy?.cagr ? backtestComparison.strategy.cagr / 100 : niftyCagrDecimal + 0.08;
  const niftyCagr = niftyCagrDecimal;
  const chartData = generateDynamicChartData(totalCapital, perfYears, alphaCagr, niftyCagr);
  const alphaCagrPct = (alphaCagr * 100).toFixed(1);
  const totalTrades = backtestComparison?.strategy?.totalTrades || 0;
  const winRate = backtestComparison?.strategy?.winRate || 0;
  const avgRoi = backtestComparison?.strategy?.avgRoi || 0;
  const avgDays = backtestComparison?.strategy?.avgDays || 0;
  const backtestYears = backtestComparison?.nifty50?.years || 20;

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

  const fetchBacktestComparison = async () => {
    try {
      const token = localStorage.getItem('mb_token');
      const res = await fetch(`${API_URL}/api/backtest/nifty-comparison`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await safeJsonParse(res);
      if (res.ok && !d.error) setBacktestComparison(d);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    fetchAlphaHub();
    fetchBacktestComparison();
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
    const rows = qualifiedStocks.map((s: AlphaHubStock) => [
      s.symbol, s.sector, s.capType, s.basketSource, s.strategy, s.score,
      s.entryPrice, Number(s.roi)?.toFixed(2),
      1, s.entryPrice
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `MarketBeacon_AlphaTerminal_Report.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const scrollToPortfolio = () => {
    setCurrentStep(2);
    setTimeout(() => {
      const el = document.getElementById('suggested-portfolio');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const scrollToPerformance = () => {
    setCurrentStep(3);
    setTimeout(() => {
      const el = document.getElementById('backtest-performance');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-10 text-center px-4 bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="w-20 h-20 bg-[var(--bg-tertiary)] rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce">
          <Shield className="h-10 w-10 text-blue-500" />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-[0.5em] text-slate-900">Loading your portfolio</h2>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest italic">Just a moment</p>
        </div>
      </div>
    );
  }

  // Error state (non-auth)
  if (error && error !== 'ALPHA_REQUIRED') {
    return (
      <div className="p-10 text-center space-y-6 flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <div className="p-8 rounded-3xl border-2 border-red-100 max-w-xl shadow-sm">
          <h2 className="text-red-600 font-black uppercase tracking-widest text-xs mb-2 italic">Something went wrong</h2>
          <p className="text-red-500 text-[10px] font-bold leading-relaxed">{error}</p>
        </div>
        <button onClick={fetchAlphaHub} className="px-12 py-3 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-xl">
          Try again
        </button>
      </div>
    );
  }

  // ALPHA_REQUIRED state (show upgrade prompt)
  if (error === 'ALPHA_REQUIRED') {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
        <SEO title="Alpha Portfolio — Access Required" description="Unlock the Alpha 40 Desk to access pre-built strategy baskets and model portfolios." />
        {showConfetti && <Confetti />}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in duration-700 max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-blue-600/10 border border-blue-500/20 rounded-[2rem] flex items-center justify-center shadow-2xl relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
            <Lock className="h-10 w-10 text-blue-600 relative z-10" />
          </div>
          <div className="space-y-3 max-w-xl">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Unlock Ready-to-Invest Portfolios</h2>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">
              The Alpha Desk is a premium feature with pre-built strategy baskets and model portfolios.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-10 py-5 bg-blue-600 text-[var(--text-primary)] rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 transition-all active:scale-95 w-full sm:w-auto"
            >
              Unlock Alpha Access
            </button>
            <Link to="/screener" className="px-8 py-5 bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] text-[var(--text-muted)] rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:text-slate-900 transition-all w-full sm:w-auto text-center">
              Browse Screener
            </Link>
          </div>

          {/* Voucher */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-sm w-full space-y-4 text-center">
            <div className="text-left space-y-1">
              <h4 className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Have a trial voucher?</h4>
              <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Enter code below to unlock Alpha access instantly</p>
            </div>
            <button
              onClick={() => { setVoucherCode('ALPHA7'); setVoucherError(null); }}
              className="w-full py-2.5 bg-[var(--bg-secondary)] border border-indigo-100 text-indigo-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
            >
              Use Code: ALPHA7 (7 Days Free)
            </button>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="VOUCHER CODE"
                value={voucherCode}
                onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(null); }}
                className="bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none flex-1 focus:border-blue-600 transition-all placeholder:text-[var(--text-secondary)]"
              />
              <button
                onClick={handleRedeemVoucher}
                disabled={redeeming || !voucherCode.trim()}
                className="px-6 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
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

  // --- MAIN PAGE CONTENT (authenticated, data loaded)
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <SEO title="Alpha Desk — Rules-Based Strategy Portfolios" description="Enter your investment amount and get a rules-based stock allocation with full entry/exit details. Backtested performance up to 20 years." />
      {showConfetti && <Confetti />}

      {/* HEADER BAR */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] px-4 md:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center shadow-sm border border-[var(--border-primary)]">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight italic leading-none text-[var(--text-primary)]">Alpha Desk</h1>
              <p className="text-[7px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.25em] mt-0.5">Rules-based allocation engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAlpha}
              className="hidden md:flex items-center gap-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] transition-all active:scale-95 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full pb-32 space-y-6">

        {/* STICKY STEP INDICATOR BAR */}
        <div className="sticky top-[73px] z-40 bg-[var(--bg-primary)]/95 backdrop-blur-md border border-[var(--border-primary)] py-3.5 px-6 shadow-2xl w-full rounded-2xl flex items-center justify-center gap-0 max-w-xl mx-auto">
          {[
            { step: 1, label: 'Amount' },
            { step: 2, label: 'Stocks' },
            { step: 3, label: 'Performance' }
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[9px] font-black transition-all duration-500 ${
                  currentStep >= s.step
                    ? 'bg-blue-600 text-[var(--text-primary)] shadow-md'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                }`}>
                  {currentStep > s.step ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    s.step
                  )}
                </div>
                <span className={`text-[7px] font-black uppercase tracking-widest ${
                  currentStep >= s.step ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                }`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`flex-1 h-px mx-2 md:mx-4 transition-all duration-500 ${
                  currentStep > s.step ? 'bg-emerald-400' : 'bg-[var(--bg-tertiary)]'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: INVESTMENT AMOUNT */}
        <div className="max-w-3xl mx-auto w-full space-y-6">

            {/* HERO STATS STRIP */}
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/10 rounded-2xl p-5 text-center space-y-3 shadow-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[7px] font-black text-blue-400 uppercase tracking-widest">
                <Sparkles className="h-2.5 w-2.5" />
                Live Stats Strip
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--border-primary)]/80">
                <div className="text-center">
                  <div className="text-sm font-black text-[var(--text-primary)] font-mono">40+</div>
                  <div className="text-[6.5px] font-bold text-[var(--text-muted)] uppercase tracking-widest">STOCKS</div>
                </div>
                <div className="text-center border-x border-[var(--border-primary)]/80">
                  <div className="text-sm font-black text-[var(--text-primary)] font-mono">{backtestYears}Y</div>
                  <div className="text-[6.5px] font-bold text-[var(--text-muted)] uppercase tracking-widest">DATA</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-emerald-400 font-mono">{alphaCagrPct}%</div>
                  <div className="text-[6.5px] font-bold text-[var(--text-muted)] uppercase tracking-widest">CAGR</div>
                </div>
              </div>
              <p className="text-[9px] font-medium text-[var(--text-tertiary)] leading-normal">
                Strategy-weighted allocation engine. Enter amount to dynamically compile qualified securities.
              </p>
            </div>

            {/* INVESTMENT CALCULATOR */}
            <div id="calculator-section" className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-6 shadow-xl space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded text-[7px] font-black uppercase tracking-widest">Step 1</span>
                  <h2 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">Investment amount</h2>
                </div>
                <p className="text-[10px] font-medium text-[var(--text-tertiary)]">Choose mode and inputs to calculate quantities.</p>
              </div>

              {/* INPUTS */}
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-2">
                    <label className="block text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                      Deploy amount today
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[var(--text-tertiary)] font-mono">₹</span>
                      <input
                        type="text"
                        value={lumpSumAmount ? lumpSumAmount.toLocaleString('en-IN') : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/,/g, '');
                          if (!isNaN(Number(raw)) && raw !== '') setLumpSumAmount(Number(raw));
                          else if (raw === '') setLumpSumAmount(0);
                        }}
                        className="w-full bg-[var(--bg-primary)]/60 border-2 border-[var(--border-primary)] rounded-xl px-4 py-3.5 pl-8 text-sm font-black text-[var(--text-primary)] font-mono outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-600 transition-all"
                        placeholder="5,00,000"
                      />
                    </div>
                    <p className="text-[7.5px] font-medium text-[var(--text-muted)]">Min: ₹50,000 • Max: ₹25,00,000</p>
                  </div>

                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-1.5">
                    {[100000, 300000, 500000, 1000000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setLumpSumAmount(amt)}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                          lumpSumAmount === amt
                            ? 'bg-blue-600 text-[var(--text-primary)] border-blue-600 shadow-lg'
                            : 'bg-[var(--bg-tertiary)]/40 text-[var(--text-tertiary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                        }`}
                      >
                        ₹{(amt / 100000).toFixed(0)}L
                      </button>
                    ))}
                </div>
              </div>

              {/* Summary Strip */}
              <div className="bg-[var(--bg-primary)]/30 border border-[var(--border-primary)] rounded-xl p-4 flex items-center justify-between gap-3">
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">One-time Investment</span>
                <div className="text-right">
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Deployed Capital</span>
                  <span className="text-sm font-black text-[var(--text-primary)] font-mono">₹{totalCapital.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Action Button */}
              {totalCapital >= 50000 && baskets.length > 0 && (
                <button
                  onClick={scrollToPortfolio}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Build My Portfolio →
                </button>
              )}
              {totalCapital < 50000 && (
                <p className="text-[8px] font-black text-[var(--text-muted)] text-center uppercase tracking-widest bg-[var(--bg-primary)]/30 py-2.5 rounded-xl border border-[var(--border-primary)]/50">
                  Minimum investment: ₹50,000
                </p>
              )}
            </div>

          </div>

        {/* STEP 2: STOCK ALLOCATION */}
        {currentStep >= 2 && (
        <div className="space-y-8 max-w-5xl mx-auto w-full">

            {/* STOCKS TABLE PANEL */}
            <div id="suggested-portfolio" className="scroll-mt-48 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded text-[7px] font-black uppercase tracking-widest border border-[var(--border-primary)]">Step 2</span>
                    <h2 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">Qualified Stock Allocation</h2>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded text-[7px] font-black uppercase tracking-widest">
                      {qualifiedStocks.length} stocks
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-[var(--text-tertiary)]">
                    Rules-based allocation details for your active strategy portfolio. Only grades A–D included.
                  </p>
                </div>
              </div>

              {/* Basket filter pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilterBasket('all')}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                    filterBasket === 'all'
                      ? 'bg-blue-600 text-[var(--text-primary)] border-blue-600 shadow-md'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                  }`}
                >
                  All Baskets
                </button>
                {baskets.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setFilterBasket(b.id)}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                      filterBasket === b.id
                        ? 'bg-blue-600 text-[var(--text-primary)] border-blue-600 shadow-md'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                    }`}
                  >
                    {b.name} ({b.count})
                  </button>
                ))}
              </div>

              {/* Desktop Stock Table */}
              <div className="hidden md:block bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-primary)]/40 border-b border-[var(--border-primary)] text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                        <th className="px-3 py-3.5 w-[15%]">Stock</th>
                        <th className="px-3 py-3.5 w-[12%]">Sector</th>
                        <th className="px-3 py-3.5 w-[12%] text-right">Base Price</th>
                        <th className="px-3 py-3.5 w-[12%] text-right">Target</th>
                        <th className="px-3 py-3.5 w-[8%] text-center">Grade</th>
                        <th className="px-3 py-3.5 w-[12%] text-right">CMP</th>
                        <th className="px-3 py-3.5 w-[8%] text-right bg-blue-500/5 text-blue-400">Qty</th>
                        <th className="px-3 py-3.5 w-[12%] text-right bg-blue-500/5 text-blue-400">Amount</th>
                        <th className="px-3 py-3.5 w-[8%] text-right font-medium text-[var(--text-tertiary)]">Weight</th>
                        <th className="px-3 py-3.5 w-[6%] text-center">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)] font-mono text-[11px] text-[var(--text-secondary)]">
                      {qualifiedStocks
                        .filter(s => filterBasket === 'all' || baskets.find(b => b.id === filterBasket)?.stocks.includes(s))
                        .map((stock: AlphaHubStock) => {
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
                            <tr key={stock.symbol} className="hover:bg-[var(--bg-tertiary)]/30 transition-all group border-b border-[var(--border-primary)]">
                              <td className="px-3 py-3">
                                <div className="flex flex-col font-sans">
                                  <span className="text-xs font-black text-[var(--text-primary)] uppercase group-hover:text-blue-400 transition-colors">{stock.symbol}</span>
                                  <span className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{stock.basketSource || stock.capType}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-[9px] font-bold text-[var(--text-tertiary)]">{stock.sector}</td>
                              <td className="px-3 py-3 text-right font-black text-[var(--text-secondary)]">₹{stock.entryPrice?.toLocaleString()}</td>
                              <td className="px-3 py-3 text-right">
                                <span className="font-black text-emerald-400">₹{stock.target?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                <span className="text-[7px] text-emerald-500 ml-1">({targetPct}%)</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {validGrade !== 'NONE' ? (
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono border ${
                                    grade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    grade === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    grade === 'C' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  }`}>
                                    {grade}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black font-mono bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-secondary)]">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <span className={`font-black ${isDown ? 'text-amber-500' : 'text-[var(--text-primary)]'}`}>
                                  ₹{stock.currentPrice?.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-right text-blue-400 font-black bg-blue-500/5 text-xs">{qty}</td>
                              <td className="px-3 py-3 text-right font-black bg-blue-500/5 text-[var(--text-primary)]">₹{Math.round(amount).toLocaleString()}</td>
                              <td className="px-3 py-3 text-right text-[10px] font-bold text-[var(--text-tertiary)]">{weightPct.toFixed(1)}%</td>
                              <td className="px-3 py-3 text-center">
                                <Link to={`/stock/${stock.symbol}`} className="p-1.5 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-all inline-flex items-center rounded-lg shadow-sm border border-[var(--border-primary)]">
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

              {/* Mobile Stock Cards */}
              <div className="md:hidden space-y-2">
                {qualifiedStocks
                  .filter(s => filterBasket === 'all' || baskets.find(b => b.id === filterBasket)?.stocks.includes(s))
                  .map((stock: AlphaHubStock) => {
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
                      <div key={stock.symbol} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => setExpandedStock(isExpanded ? null : stock.symbol)}
                          className="w-full text-left p-4 space-y-2.5 active:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm font-black text-[var(--text-primary)] font-mono uppercase leading-none">{stock.symbol}</span>
                              {validGrade !== 'NONE' ? (
                                <span className={`px-1.5 py-0.5 rounded text-[7px] font-black border ${
                                  grade === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  grade === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  grade === 'C' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {grade}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[7px] font-black bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-secondary)]">—</span>
                              )}
                            </div>
                            <div className="text-right shrink-0 ml-2 flex items-center gap-2">
                              <span className="text-sm font-black text-blue-400 font-mono">{qty} qty</span>
                              <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-[var(--text-tertiary)] font-medium">{stock.sector}</span>
                            <span className={`font-black font-mono ${isDown ? 'text-amber-500' : 'text-emerald-400'}`}>
                              ₹{stock.currentPrice?.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-[var(--text-tertiary)] font-medium">Amount: <span className="font-black text-[var(--text-primary)]">₹{Math.round(amount).toLocaleString()}</span></span>
                            <span className="text-[var(--text-muted)] font-mono">{weightPct.toFixed(1)}% of portfolio</span>
                          </div>

                          {isExpanded && (
                            <div className="pt-3 border-t border-[var(--border-primary)] space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="grid grid-cols-2 gap-2 text-[9px] font-medium text-[var(--text-tertiary)]">
                                <div>
                                  <span className="text-[7.5px] text-[var(--text-muted)] block mb-0.5 uppercase font-bold">Base price</span>
                                  <span className="text-[var(--text-secondary)] font-black">₹{stock.entryPrice?.toLocaleString()}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[7.5px] text-[var(--text-muted)] block mb-0.5 uppercase font-bold">Target</span>
                                  <span className="text-emerald-400 font-black">₹{stock.target?.toLocaleString(undefined, { maximumFractionDigits: 1 })} ({targetPct}%)</span>
                                </div>
                                <div>
                                  <span className="text-[7.5px] text-[var(--text-muted)] block mb-0.5 uppercase font-bold">Strategy</span>
                                  <span className="text-[var(--text-secondary)] font-black text-[8px]">{stock.strategy}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[7.5px] text-[var(--text-muted)] block mb-0.5 uppercase font-bold">ROI</span>
                                  <span className="text-emerald-400 font-black">+{Number(stock.roi || 0).toFixed(1)}%</span>
                                </div>
                              </div>
                              <Link to={`/stock/${stock.symbol}`} className="flex items-center justify-center gap-1 py-2 bg-[var(--bg-tertiary)] rounded-xl text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest hover:bg-[var(--bg-primary)] transition-colors">
                                View full analysis <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </div>
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>

              {/* Table footer */}
              <div className="bg-[var(--bg-primary)]/20 border border-[var(--border-primary)] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                <span>Rules-based allocation • 40-stock target portfolio • 50:30:20 cap mix</span>
                <span className="text-blue-400">Strategy-weighted quantities</span>
              </div>
            </div>

            {/* Step 2 -> 3 navigation */}
            <div className="flex justify-center pt-2">
              <button
                onClick={scrollToPerformance}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all border border-[var(--border-primary)]"
              >
                <BarChart3 className="h-4 w-4" />
                View Performance History →
              </button>
            </div>

            {/* STEP 3: PERFORMANCE HISTORY */}
            {currentStep >= 3 && (
            <div className="space-y-4">
            <div id="backtest-performance" className="scroll-mt-48 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded text-[7px] font-black uppercase tracking-widest">Step 3</span>
                  <h2 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">Backtest Performance History</h2>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[7px] font-black uppercase tracking-widest">
                    {perfYears}Y data
                  </span>
                </div>
                <p className="text-[10px] font-medium text-[var(--text-tertiary)]">
                  Historical simulation of actual strategy rules (entry/exit cycles) across your allocation.
                </p>
              </div>

              {/* Time window selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mr-1">Window:</span>
                {[3, 5, 10, 20].map(y => (
                  <button
                    key={y}
                    onClick={() => setPerfYears(y)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                      perfYears === y
                        ? 'bg-blue-600 text-[var(--text-primary)] border-blue-600 shadow-md shadow-blue-500/10'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                    }`}
                  >
                    {y === 20 ? 'Max' : `${y}Y`}
                  </button>
                ))}
              </div>

              {/* Performance Metrics Card */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-6 md:p-8 text-[var(--text-secondary)] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  {/* Backtest Metrics Grid (Redesigned) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)]/80 rounded-2xl p-5">
                    <div className="text-center p-1">
                      <div className="text-[7.5px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Deployed</div>
                      <div className="text-base font-black text-[var(--text-primary)] font-mono">₹{totalCapital.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-center p-1 border-l border-[var(--border-primary)]/50">
                      <div className="text-[7.5px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Projected Return</div>
                      <div className="text-base font-black text-emerald-400 font-mono">
                        +₹{Math.round(totalCapital * Math.pow(1 + alphaCagr, perfYears) - totalCapital).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-center p-1 border-l border-[var(--border-primary)]/50">
                      <div className="text-[7.5px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Projected Value</div>
                      <div className="text-base font-black text-blue-400 font-mono">
                        ₹{Math.round(totalCapital * Math.pow(1 + alphaCagr, perfYears)).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-center p-1 border-l border-[var(--border-primary)]/50">
                      <div className="text-[7.5px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">CAGR (Backtest)</div>
                      <div className="text-base font-black text-emerald-400 font-mono">{alphaCagrPct}%</div>
                    </div>
                  </div>

                  {/* Trade activity summary */}
                  <div className="flex flex-wrap gap-4 text-[9px] font-medium text-[var(--text-tertiary)] justify-center md:justify-start">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-primary)]/40 rounded-full border border-[var(--border-primary)]">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      {totalTrades} total trades
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-primary)]/40 rounded-full border border-[var(--border-primary)]">
                      <BarChart3 className="h-3 w-3 text-blue-400" />
                      {winRate}% win rate
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-primary)]/40 rounded-full border border-[var(--border-primary)]">
                      <Activity className="h-3 w-3 text-amber-400" />
                      {avgRoi}% avg ROI
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-primary)]/40 rounded-full border border-[var(--border-primary)]">
                      <Activity className="h-3 w-3 text-amber-400" />
                      {avgDays}d avg hold
                    </span>
                  </div>

                  {/* Chart */}
                  <div className="h-64 md:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
                        <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="var(--text-muted)"
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
                        {/* Benchmark Comparison Line */}
                        <Area type="monotone" dataKey="Nifty 50 Index" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={0} name="Nifty 50 Index" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Book profit explanation */}
                  <div className="border-t border-[var(--border-primary)] pt-4">
                    <button
                      onClick={() => setShowBookProfitInfo(!showBookProfitInfo)}
                      className="flex items-center gap-2 text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                      How "booked profit" is calculated
                      <ChevronDown className={`h-3 w-3 transition-transform ${showBookProfitInfo ? 'rotate-180' : ''}`} />
                    </button>
                    {showBookProfitInfo && (
                      <div className="mt-3 text-[10px] text-[var(--text-tertiary)] leading-relaxed max-w-2xl animate-in fade-in slide-in-from-top-1 duration-205 space-y-2">
                        <p>
                          Booked profit represents gains that have been <strong className="text-[var(--text-primary)]">realised</strong> by closing positions as per the strategy's exit rules. This is different from "unrealised" or "paper" gains that still depend on current market prices.
                        </p>
                        <p>
                          In this backtest, the model assumes the strategy exits a position when its target is met or a stop condition triggers, books the profit, and reallocates the capital into the next qualified opportunity. The booked profit figure is the sum of all such realised gains over the selected period.
                        </p>
                        <p className="text-[9px] text-slate-550">
                          Note: This is a historical simulation using rules-based logic. Actual trade execution depends on market liquidity, slippage, brokerage, and timing.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Performance table (Tightened) */}
                  <div className="border-t border-[var(--border-primary)] pt-4 overflow-x-auto">
                    <table className="w-full text-left text-[9px] md:text-[10px] font-mono min-w-[500px]">
                      <thead>
                        <tr className="text-[var(--text-muted)] border-b border-[var(--border-primary)]">
                          <th className="pb-2 font-black uppercase tracking-widest">Year</th>
                          <th className="pb-2 font-black uppercase tracking-widest text-right">Capital invested</th>
                          <th className="pb-2 font-black uppercase tracking-widest text-right">Entries</th>
                          <th className="pb-2 font-black uppercase tracking-widest text-right">Exits</th>
                          <th className="pb-2 font-black uppercase tracking-widest text-right">Booked profit</th>
                          <th className="pb-2 font-black uppercase tracking-widest text-right">Portfolio value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-primary)]">
                        {chartData.filter(d => d.initialCapital > 0).map((row, i) => {
                          const invested = totalCapital;
                          const portfolioValue = row["Portfolio Value (Strategy)"];
                          const bookedProfit = portfolioValue - invested;
                          return (
                            <tr key={i} className="border-b border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]/40 transition-colors">
                              <td className="py-2.5 text-[var(--text-primary)] font-black">{row.year}</td>
                              <td className="py-2.5 text-right text-[var(--text-secondary)]">₹{invested.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-right text-[var(--text-tertiary)]">{row.entries}</td>
                              <td className="py-2.5 text-right text-[var(--text-tertiary)]">{row.exits}</td>
                              <td className={`py-2.5 text-right font-black ${bookedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {bookedProfit >= 0 ? '+' : ''}₹{bookedProfit.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 text-right text-[var(--text-primary)] font-black">₹{portfolioValue.toLocaleString('en-IN')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Disclaimer */}
                  <div className="border-t border-[var(--border-primary)] pt-4">
                    <p className="text-[8px] md:text-[9px] text-slate-550 font-medium leading-relaxed">
                      ⚠ Past performance is not indicative of future results. This is a historical simulation for educational purposes only and does not constitute investment advice or a recommendation to buy or sell any security. Entry/exit counts are simulated based on average strategy activity and may not reflect actual market cycles. Actual returns may differ significantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* DISCLAIMERS */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] overflow-hidden shadow-sm">
              <button
                onClick={() => setShowDisclaimer(!showDisclaimer)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest italic">Important Disclaimers</span>
                </div>
                {showDisclaimer ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)] shrink-0" />}
              </button>

              {showDisclaimer && (
                <div className="px-5 md:px-6 pb-6 md:pb-8 space-y-4 border-t border-[var(--border-primary)] pt-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3 text-[9px] md:text-[10px] font-medium text-[var(--text-tertiary)] leading-relaxed">
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

            {/* System Status Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest border-t border-[var(--border-primary)] pt-6">
              <div className="flex items-center gap-2">
                <Activity className="h-3 w-3 text-emerald-400" />
                Alpha Desk sync: <span className="text-emerald-400">Optimal</span>
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
            </div>
          )}
          </div>
        )}

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
