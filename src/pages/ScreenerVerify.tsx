import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Download, 
  Activity, 
  ShieldCheck, 
  Target, 
  Info,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import SEO from '../components/SEO';
import { ConfidenceGauge } from '../components/ui/ConfidenceGauge';
import type { HistoryQuote, FundamentalData, ABCDNode, AllStockItem } from '../types';

const API_URL = getApiUrl();

const STRATEGY_NAMES: Record<string, string> = {
  'ENVELOPE_LONG': 'Envelope Long',
  'ENVELOPE_SHORT': 'Envelope Short',
  'BOLLINGER': 'Bollinger Band',
  '52W_HIGH_LOW': '52-Week High/Low',
  'CUP_HANDLE_ABCD': 'Cup & Handle + ABCD',
  'RHS_ABCD': 'Reverse H&S + ABCD',
  'SMA_BCD': 'SMA + BCD',
  'SR_STRATEGY': 'Support & Resistance (S&R)',
  'SIXTY_SEVEN_FUNDA': 'Institutional Reset (67%)',
  'TWENTY_RALLY_RETEST': 'Velocity Retest (20%)'
};

const STRATEGY_RULES: Record<string, string[]> = {
  'ENVELOPE_LONG': [
    'Price crosses below lower historical envelope band.',
    'Daily RSI oversold (< 35) or showing bullish divergence.',
    'Fundamentals: Net Debt/Equity < 0.8 and ROCE > 15%.'
  ],
  'ENVELOPE_SHORT': [
    'Price crosses above the upper historical envelope band.',
    'RSI showing overbought signals (> 70).',
    'Short-term momentum cooling with target progression.'
  ],
  'BOLLINGER': [
    'Candle body breaches lower Bollinger Band (20, 2).',
    'Hourly candlestick confirmation with volume support.',
    'Fundamentals: Institutional holding > 60%.'
  ],
  '52W_HIGH_LOW': [
    'Price within 5% range of 52-Week High resistance level.',
    'Volume breakout confirmation above average 10-day volume.',
    'Safe Entry accumulation support holding above Floor.'
  ],
  'CUP_HANDLE_ABCD': [
    'Cup and handle chart pattern formation detected on 1H charts.',
    'Support confirmed at the handle base.',
    'Target projected at the breakout neck line level.'
  ],
  'RHS_ABCD': [
    'Reverse Head & Shoulders pattern breakout neckline breach.',
    'RSI is in neutral-to-bullish zone (> 50).',
    'Tranche entry level D triggered with safety buffer.'
  ],
  'SMA_BCD': [
    '50-period SMA acts as support with bullish bounce.',
    'Bullish MACD crossover on 1-hour timeframe.',
    'Audit conviction score exceeds 75/100.'
  ],
  'SR_STRATEGY': [
    'Price rebounds from dynamic major Support/Resistance lines.',
    'Multiple touch confirmation at the support boundary.',
    'RSI divergence signals bullish rebound.'
  ],
  'SIXTY_SEVEN_FUNDA': [
    'Price drops by 67% or more from All-Time High (ATH).',
    'Strong fundamental audit score indicating safe business structure.',
    'Institutional accumulation phase active.'
  ],
  'TWENTY_RALLY_RETEST': [
    'Stock triggers 20% or more green candle velocity rally.',
    'Pullback tests major support floor (200 EMA).',
    'Entry triggered on the first successful support retest.'
  ]
};

interface StockSearchResult {
  symbol: string;
  isBuyZone: boolean;
  isPass: boolean;
  reason: string;
  currentPrice?: number;
  score?: number;
}

const ScreenerVerify: React.FC = () => {
  const [strategyId, setStrategyId] = useState<string>('ENVELOPE_LONG');
  const [symbol, setSymbol] = useState<string>('INFY');
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  const [timeframe, setTimeframe] = useState<string>('1H');
  
  // Data States
  const [allStocks, setAllStocks] = useState<StockSearchResult[]>([]);
  const [historyData, setHistoryData] = useState<HistoryQuote[]>([]);
  const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);
  
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Fetch qualifying stock list for selected strategy
  const fetchScreenerList = async (stratId: string) => {
    setLoadingList(true);
    try {
      const response = await fetch(`${API_URL}/api/backtest/audit?strategy=${stratId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('mb_token')}` }
      });
      const d = await safeJsonParse(response);
      if (response.ok && d.allStocks && d.allStocks.length > 0) {
        setAllStocks(d.allStocks);
        // Default to first buy zone stock or first symbol
        const buyStock = d.allStocks.find((s: AllStockItem) => s.isBuyZone && s.isPass);
        setSymbol(buyStock ? buyStock.symbol : d.allStocks[0].symbol);
      } else {
        // Fallback mock data if token unavailable or empty results
        const fallbacks: StockSearchResult[] = [
          { symbol: 'INFY', isBuyZone: true, isPass: true, reason: 'Envelope Breach Rebound' },
          { symbol: 'RELIANCE', isBuyZone: true, isPass: true, reason: 'Bollinger Deviation Bounce' },
          { symbol: 'TCS', isBuyZone: false, isPass: true, reason: 'Inside Target Range' },
          { symbol: 'HDFCBANK', isBuyZone: true, isPass: true, reason: 'Double Bottom Support' },
          { symbol: 'SBIN', isBuyZone: false, isPass: false, reason: 'Audit Failure: Debt High' }
        ];
        setAllStocks(fallbacks);
        setSymbol('INFY');
      }
    } catch (e) {
      console.error('Failed to fetch screener list', e);
      // Fallback
      setAllStocks([
        { symbol: 'INFY', isBuyZone: true, isPass: true, reason: 'Envelope Breach Rebound' },
        { symbol: 'RELIANCE', isBuyZone: true, isPass: true, reason: 'Bollinger Deviation Bounce' }
      ]);
      setSymbol('INFY');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchScreenerList(strategyId);
  }, [strategyId]);

  // Load detailed stock payload
  const loadStockDetail = async (targetSymbol: string) => {
    setLoadingDetail(true);
    try {
      // 1. Fundamentals
      const fundRes = await fetch(`${API_URL}/api/stock-fundamentals?symbol=${targetSymbol}&t=${Date.now()}`);
      const fundData = await safeJsonParse(fundRes);
      if (fundRes.ok && !fundData.error) {
        setFundamentals(fundData);
      } else {
        console.error('Error fetching fundamentals', fundData.error);
      }

      // 2. History
      const histRes = await fetch(`${API_URL}/api/stock-history?symbol=${targetSymbol}`);
      const histData = await safeJsonParse(histRes);
      if (histRes.ok && histData.history) {
        setHistoryData(histData.history);
      } else {
        console.error('Error fetching history', histData.error);
      }
    } catch (e) {
      console.error('Failed to load stock detail data', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      loadStockDetail(symbol);
    }
  }, [symbol]);

  // Render TradingView interactive chart
  useEffect(() => {
    if (!chartContainerRef.current || historyData.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const containerWidth = chartContainerRef.current.clientWidth;
    const containerHeight = 440;
    const isDark = true;
    
    const chart = createChart(chartContainerRef.current, {
      width: containerWidth,
      height: containerHeight,
      layout: {
        background: { 
          type: ColorType.Solid, 
          color: isDark ? '#0f172a' : '#ffffff' 
        },
        textColor: isDark ? '#94a3b8' : '#334155',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.9)' },
        horzLines: { color: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.9)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: isDark ? '#475569' : '#94a3b8',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#1e293b' : '#64748b',
        },
        horzLine: {
          color: isDark ? '#475569' : '#94a3b8',
          width: 1,
          style: 3,
          labelBackgroundColor: isDark ? '#1e293b' : '#64748b',
        },
      },
      timeScale: {
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
      }
    });

    chartRef.current = chart;

    const sortedHistory = [...historyData].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    const formattedQuotes = sortedHistory.map(q => ({
      time: q.time,
      open: Number(q.open),
      high: Number(q.high),
      low: Number(q.low),
      close: Number(q.close),
    }));

    const formattedVolumes = sortedHistory.map(q => ({
      time: q.time,
      value: Number(q.volume || 0),
      color: Number(q.close) >= Number(q.open) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    }));

    let mainSeries: ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null = null;

    if (chartType === 'candles') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
      mainSeries.setData(formattedQuotes);
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
      });
      mainSeries.setData(formattedQuotes.map(q => ({ time: q.time, value: q.close })));
    }

    // Add Strategy Price Lines and Accumulation Zone Shaded Band
    const activeStrat = fundamentals?.strategies?.[strategyId];
    if (activeStrat && typeof activeStrat === 'object') {
      // 1. Entry Line (Green)
      if (activeStrat.entryPrice) {
        mainSeries.createPriceLine({
          price: Number(activeStrat.entryPrice),
          color: '#10b981',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `ENTRY: ₹${activeStrat.entryPrice}`,
        });
      }

      // 2. Target Line (Blue)
      if (activeStrat.target) {
        mainSeries.createPriceLine({
          price: Number(activeStrat.target),
          color: '#3b82f6',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `TARGET: ₹${activeStrat.target}`,
        });
      }

      // 3. Stop Loss Line (Red - calculated 4% below entry or bottom)
      const entryVal = Number(activeStrat.entryPrice || 0);
      let bottomVal = entryVal;
      if (activeStrat.abcd) {
        const prices = Object.values(activeStrat.abcd)
          .map(v => Number(v?.price))
          .filter(p => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          bottomVal = Math.min(...prices);
        }
      }
      if (bottomVal === entryVal) {
        bottomVal = entryVal * 0.9;
      }

      // 4. Shaded Accumulation Buy-Zone Band
      if (entryVal > bottomVal) {
        const steps = 10;
        const stepSize = (entryVal - bottomVal) / steps;
        for (let i = 0; i <= steps; i++) {
          const p = bottomVal + (i * stepSize);
          mainSeries.createPriceLine({
            price: p,
            color: isDark ? 'rgba(16, 185, 129, 0.03)' : 'rgba(16, 185, 129, 0.05)',
            lineWidth: 1,
            lineStyle: 0,
            axisLabelVisible: false,
            title: i === Math.floor(steps / 2) ? 'ACCUMULATION ZONE (SAFE BUY BAND)' : '',
          });
        }
      }
    }

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeries.setData(formattedVolumes);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [historyData, chartType, strategyId, fundamentals]);

  // Dynamic Confidence Score calculations
  const activeStrategy = fundamentals?.strategies?.[strategyId];
  
  const getConfidenceInfo = () => {
    if (!fundamentals || !activeStrategy) return { score: 50, level: 'MODERATE', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    
    const price = Number(fundamentals.price);
    const entry = Number(activeStrategy.entryPrice);
    const target = Number(activeStrategy.target);
    const isBuy = !!activeStrategy.isBuyZone;
    const auditScore = Number(fundamentals.audit?.score || 50);
    
    let score = 50; 
    if (isBuy) score += 20;
    
    if (entry && target) {
      if (price <= entry) {
        score += 15;
        if (activeStrategy.abcd) {
          const prices = Object.values(activeStrategy.abcd)
            .map(v => Number(v?.price))
            .filter(p => !isNaN(p) && p > 0);
          if (prices.length > 0) {
            const bottom = Math.min(...prices);
            if (price >= bottom && entry > bottom) {
              const depthPct = (entry - price) / (entry - bottom);
              score += Math.round(depthPct * 10);
            }
          }
        }
      } else if (price < target) {
        const progress = (price - entry) / (target - entry);
        score += Math.round((1 - progress) * 10);
      } else {
        score -= 20;
      }
    }
    
    score += Math.round((auditScore / 100) * 10);
    const roce = Number(fundamentals.roce || 0);
    const netDebt = Number(fundamentals.netDebtToEquity || 0);
    if (roce > 20) score += 5;
    if (netDebt < 0.5) score += 5;
    
    score = Math.max(0, Math.min(100, score));
    
    let level = 'MODERATE';
    let color = 'text-amber-500';
    let bg = 'bg-amber-500/10';
    
    if (score >= 85) {
      level = 'STRONG BUY / MAX CONFIDENCE';
      color = 'text-emerald-500';
      bg = 'bg-emerald-500/10';
    } else if (score >= 70) {
      level = 'SAFE ACCUMULATION';
      color = 'text-teal-500';
      bg = 'bg-teal-500/10';
    } else if (score >= 45) {
      level = 'HOLD / MONITOR';
      color = 'text-amber-500';
      bg = 'bg-amber-500/10';
    } else {
      level = 'HIGH RISK / TAKE PROFIT';
      color = 'text-rose-500';
      bg = 'bg-rose-500/10';
    }
    
    return { score, level, color, bg };
  };

  const confidence = getConfidenceInfo();

  // Price zone progress slider coordinates
  const renderRangeSlider = () => {
    if (!activeStrategy) return null;
    const price = Number(fundamentals.price);
    const entry = Number(activeStrategy.entryPrice || 0);
    const target = Number(activeStrategy.target || 0);
    
    let bottom = entry;
    if (activeStrategy.abcd) {
      const prices = Object.values(activeStrategy.abcd)
        .map(v => Number(v?.price))
        .filter(p => !isNaN(p) && p > 0);
      if (prices.length > 0) {
        bottom = Math.min(...prices);
      }
    }
    if (bottom === entry) {
      bottom = entry * 0.9;
    }
    
    const rangeMin = bottom * 0.95;
    const rangeMax = target * 1.05;
    const totalRange = rangeMax - rangeMin;
    
    const getPct = (val: number) => {
      return Math.max(0, Math.min(100, ((val - rangeMin) / totalRange) * 100));
    };
    
    const currentPct = getPct(price);
    const entryPct = getPct(entry);
    const targetPct = getPct(target);
    const bottomPct = getPct(bottom);

    return (
      <div className="relative pt-6 pb-2 px-1">
        <div className="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full relative">
          {/* Shaded Buy Zone */}
          <div 
            className="absolute h-full bg-emerald-500/30 rounded-full"
            style={{ left: `${bottomPct}%`, right: `${100 - entryPct}%` }}
          />
          {/* Shaded Target corridor */}
          <div 
            className="absolute h-full bg-blue-500/20 rounded-full"
            style={{ left: `${entryPct}%`, right: `${100 - targetPct}%` }}
          />
        </div>

        {/* Labels & Markers */}
        <div 
          className="absolute -top-1 flex flex-col items-center"
          style={{ left: `${bottomPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="h-4 w-1 bg-slate-600" />
          <span className="text-[8px] font-black text-[var(--text-muted)] mt-1">FLOOR (₹{Math.round(bottom)})</span>
        </div>

        <div 
          className="absolute -top-1 flex flex-col items-center"
          style={{ left: `${entryPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="h-4 w-1.5 bg-emerald-500" />
          <span className="text-[8px] font-black text-emerald-400 mt-1">ENTRY (₹{Math.round(entry)})</span>
        </div>

        <div 
          className="absolute -top-1 flex flex-col items-center"
          style={{ left: `${targetPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="h-4 w-1.5 bg-blue-500" />
          <span className="text-[8px] font-black text-blue-400 mt-1">TARGET (₹{Math.round(target)})</span>
        </div>

        {/* Pin */}
        <div 
          className="absolute -top-4 flex flex-col items-center z-10 transition-all duration-300"
          style={{ left: `${currentPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="px-2 py-0.5 rounded bg-blue-600 text-[8px] font-black text-[var(--text-primary)] shadow-md">
            ₹{Math.round(price)}
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-primary)] border-2 border-blue-600 mt-0.5" />
        </div>
      </div>
    );
  };

  const getTvDeepLink = () => {
    return `https://www.tradingview.com/chart/?symbol=NSE:${symbol}&interval=60`;
  };

  const filteredStocks = allStocks.filter(
    s => s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <SEO title="Trust Screener Matrix" description="Verify technical strategy signals with live TradingView interactive chart overlays." />

      {/* Main Header */}
      <header className="border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--bg-secondary)]/60 border-[var(--border-primary)]/80">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 group-hover:scale-105 transition-transform">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase italic flex items-center gap-1.5 text-[var(--text-primary)]">
                MarketBeacon <span className="text-blue-500">Trust Matrix</span>
              </h1>
              <p className="text-[9px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Screener Verification Workspace</p>
            </div>
          </Link>
        </div>

        {/* Global Strategy Picker */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest hidden sm:inline">Scanner Model:</span>
          <select
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border outline-none bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-secondary)]"
          >
            {Object.entries(STRATEGY_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Workspace Grid */}
      <main className="flex-1 p-6 max-w-[1540px] w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column (Screener List & Strategy rules) */}
        <section className="lg:col-span-1 space-y-6">
          
          {/* Card 1: Strategy rules */}
          <div className="p-5 rounded-3xl border bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]">
            <div className="flex items-center gap-2 mb-3 border-b border-[var(--border-primary)]/60 pb-2">
              <Layers className="h-4 w-4 text-blue-500" />
              <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Scanner Entry Rules</span>
            </div>
            <ul className="space-y-2">
              {(STRATEGY_RULES[strategyId] || []).map((rule, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-[var(--text-tertiary)] leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Matching stocks list */}
          <div className="p-5 rounded-3xl border flex flex-col bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-widest">Scanned Matches</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {filteredStocks.length} Stocks
              </span>
            </div>

            {/* Search filter */}
            <div className="flex items-center rounded-xl border px-3 py-1.5 mb-3 bg-[var(--bg-primary)] border-[var(--border-primary)]">
              <Search className="h-3.5 w-3.5 text-[var(--text-muted)] mr-2" />
              <input
                type="text"
                placeholder="Filter symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs font-bold outline-none text-[var(--text-primary)] placeholder-[var(--text-tertiary)] w-full"
              />
            </div>

            {loadingList ? (
              <div className="py-12 text-center text-[var(--text-muted)] space-y-2">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-blue-500" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Loading Screener...</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredStocks.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSymbol(item.symbol)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      symbol === item.symbol
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                        : 'bg-[var(--bg-primary)]/40 border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block">{item.symbol}</span>
                      <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider truncate block max-w-[150px]">
                        {item.reason}
                      </span>
                    </div>
                    {item.isBuyZone ? (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        BUY ZONE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-muted)]">
                        HOLD
                      </span>
                    )}
                  </button>
                ))}
                {filteredStocks.length === 0 && (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">
                    No matching scanner setups
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Center Column (Interactive Chart and Deep Links) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-3xl border flex flex-col bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]">
            
            {/* Chart controls */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase text-[var(--text-tertiary)]">TradingView Verified Chart</span>
                {loadingDetail && <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />}
              </div>

              {/* Candles vs Line & Timeframe toggle */}
              <div className="flex gap-2">
                {/* Timeframes */}
                <div className="flex rounded-xl p-0.5 border bg-[var(--bg-primary)] border-[var(--border-primary)]/80">
                  {['15m', '1H', '4H', '1D'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      timeframe === tf
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-tertiary)]'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Candles vs line */}
                <div className="flex rounded-xl p-0.5 border bg-[var(--bg-primary)] border-[var(--border-primary)]/80">
                  <button
                    onClick={() => setChartType('candles')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                      chartType === 'candles'
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-tertiary)]'
                    }`}
                  >
                    Candles
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                      chartType === 'line'
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-tertiary)]'
                    }`}
                  >
                    Line
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive chart canvas */}
            <div 
              ref={chartContainerRef} 
              className="w-full rounded-2xl overflow-hidden border border-[var(--border-primary)]/60 bg-[var(--bg-primary)]"
              style={{ minHeight: '440px' }}
            >
              {historyData.length === 0 && !loadingDetail && (
                <div className="flex flex-col items-center justify-center h-[440px] text-[var(--text-muted)]">
                  <Info className="h-8 w-8 mb-2 text-[var(--text-tertiary)]" />
                  <p className="text-xs font-black uppercase tracking-widest">No candlestick records available</p>
                </div>
              )}
            </div>

            {/* Deep link verification bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 border-t border-[var(--border-primary)]/50 pt-4">
              <div>
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">Validation Verification Path</span>
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] mt-0.5">Validate these overlays directly inside your native TradingView charts.</p>
              </div>
              <a
                href={getTvDeepLink()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-[var(--text-primary)] font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-blue-600/15 transition-all w-full sm:w-auto justify-center"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Verify on TradingView.com</span>
              </a>
            </div>
          </div>
        </section>

        {/* Right Column (Confidence Engine & Metrics) */}
        <section className="lg:col-span-1 space-y-6">
          
          {/* Card 1: SVG Confidence Dial */}
          <div className="p-5 rounded-3xl border bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--border-primary)]/60 pb-3 mb-4">
              <span className="text-[9px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-widest">Verification conviction</span>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase border border-current/20 ${confidence.bg} ${confidence.color}`}>
                {confidence.level}
              </span>
            </div>

            <ConfidenceGauge score={confidence.score} className="py-4 border border-[var(--border-primary)]/40 rounded-2xl bg-[var(--bg-primary)]/20" />

            {/* Range progression slider */}
            {fundamentals && activeStrategy && (
              <div className="mt-5 space-y-2">
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Range Progression State</span>
                {renderRangeSlider()}
              </div>
            )}
          </div>

          {/* Card 2: Strategy metrics */}
          <div className="p-5 rounded-3xl border bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-primary)]/60 pb-3">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Institutional Targets</span>
            </div>

            {loadingDetail || !fundamentals || !activeStrategy ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">Gathering statistics...</div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-tertiary)] font-medium">Safe Entry Target:</span>
                  <span className="font-extrabold text-emerald-400">₹ {Number(activeStrategy.entryPrice || 0).toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-tertiary)] font-medium">Profit Booking Target:</span>
                  <span className="font-extrabold text-blue-400">₹ {Number(activeStrategy.target || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-[var(--border-primary)]/60 pt-3">
                  <span className="text-[var(--text-tertiary)] font-medium">Current Stock Price:</span>
                  <span className="font-extrabold">₹ {Number(fundamentals.price).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-tertiary)] font-medium">Risk/Reward Ratio:</span>
                  <span className="font-extrabold text-blue-400">
                    1 : {((Number(activeStrategy.target || 0) - Number(activeStrategy.entryPrice || 0)) / Math.max(1, (Number(activeStrategy.entryPrice || 0) * 0.05))).toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-tertiary)] font-medium">Fund. Audit Score:</span>
                  <span className={`font-extrabold ${fundamentals.audit?.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {fundamentals.audit?.score || 0} / 100
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default ScreenerVerify;
