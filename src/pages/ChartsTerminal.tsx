import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createChart, ColorType, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';
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
  Maximize2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import type { HistoryQuote, FundamentalData, ABCDNode } from '../types';
import { BASKETS } from '../data/stocks';

const API_URL = getApiUrl();

interface IndexResult {
  name: string;
  price: number;
  ath: number;
  openPrice: number;
  change: number;
}

interface StockSearchResult {
  symbol: string;
  baskets: string[];
  price: number;
  change: number;
  peMedians: {
    pe3Y?: number;
    pe5Y?: number;
  };
}

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

import { useTheme } from '../context/ThemeContext';
import { ConfidenceGauge } from '../components/ui/ConfidenceGauge';

const ChartsTerminal: React.FC = () => {
  const [symbol, setSymbol] = useState<string>('RELIANCE');
  const [selectedBasket, setSelectedBasket] = useState<string>('Elite Basket');
  const { theme } = useTheme();
  const [chartType, setChartType] = useState<'candles' | 'line'>('candles');
  
  // Data States
  const [historyData, setHistoryData] = useState<HistoryQuote[]>([]);
  const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);
  const [indices, setIndices] = useState<IndexResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  
  // Strategy States
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);

  // Search Autocomplete States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chart Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Overlays Toggles State
  const [showTargets, setShowTargets] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [showSr, setShowSr] = useState<boolean>(true);
  const [showPatterns, setShowPatterns] = useState<boolean>(true);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Synchronize basket dropdown when symbol changes
  useEffect(() => {
    const foundBasket = Object.keys(BASKETS).find(basketKey => 
      (BASKETS[basketKey] || []).includes(symbol)
    );
    if (foundBasket && ['Elite Basket', 'Quality Basket', 'Growth Basket'].includes(foundBasket)) {
      setSelectedBasket(foundBasket);
    }
  }, [symbol]);

  const handleBasketChange = (basketName: string) => {
    setSelectedBasket(basketName);
    const stocksInBasket = BASKETS[basketName] || [];
    if (stocksInBasket.length > 0) {
      setSymbol(stocksInBasket[0]);
    }
  };

  // Fetch Market Indices (Ticker Bar)
  const fetchIndices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/market-indices`);
      const data = await safeJsonParse(response);
      if (response.ok && data.results) {
        setIndices(data.results);
      }
    } catch (e) {
      console.error('Failed to fetch indices', e);
    }
  };

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000); // refresh indices every 30s
    return () => clearInterval(interval);
  }, []);

  // Handle autocomplete search
  useEffect(() => {
    if (searchQuery.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/search/stock?q=${searchQuery}`);
        const data = await safeJsonParse(res);
        if (res.ok && data.results) {
          setSearchResults(data.results);
        }
      } catch (e) {
        console.error('Search failed', e);
      }
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Load Stock Data (History & Fundamentals)
  const loadStockData = async (targetSymbol: string) => {
    setChartLoading(true);
    try {
      // 1. Fundamentals
      const fundRes = await fetch(`${API_URL}/api/stock-fundamentals?symbol=${targetSymbol}&t=${Date.now()}`);
      const fundData = await safeJsonParse(fundRes);
      if (fundRes.ok && !fundData.error) {
        setFundamentals(fundData);
        // Auto-select first active buy-zone strategy
        if (fundData.strategies) {
          const buyZoneStrat = Object.keys(fundData.strategies).find(
            k => fundData.strategies[k].isBuyZone
          );
          if (buyZoneStrat) {
            setActiveStrategyId(buyZoneStrat);
          } else {
            // Fallback to first available strategy
            const firstStrat = Object.keys(fundData.strategies)[0];
            setActiveStrategyId(firstStrat || null);
          }
        }
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
      console.error('Failed to load stock data', e);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  };

  useEffect(() => {
    loadStockData(symbol);
  }, [symbol]);

  // Render/Re-render TradingView Chart
  useEffect(() => {
    if (!chartContainerRef.current || historyData.length === 0) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const containerWidth = chartContainerRef.current.clientWidth;
    const containerHeight = 520;

    const isDark = true;
    
    // Create new chart instance
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
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
      }
    });

    chartRef.current = chart;

    // Format historical data and filter duplicates to prevent lightweight-charts crashes
    const rawSorted = [...historyData].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    const seenTimes = new Set<string>();
    const sortedHistory: HistoryQuote[] = [];
    for (const q of rawSorted) {
      if (q.time && !seenTimes.has(q.time)) {
        seenTimes.add(q.time);
        sortedHistory.push(q);
      }
    }
    
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

    // Add main series
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

    // Math calculations for indicators
    const calculateBollingerBands = (prices: number[], period = 20, multiplier = 2.5) => {
      const basis: number[] = [];
      const upper: number[] = [];
      const lower: number[] = [];
      for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
          basis.push(NaN);
          upper.push(NaN);
          lower.push(NaN);
          continue;
        }
        const slice = prices.slice(i - period + 1, i + 1);
        const avg = slice.reduce((sum, val) => sum + val, 0) / period;
        basis.push(avg);
        const squareDiffs = slice.map(v => Math.pow(v - avg, 2));
        const stdDev = Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / period);
        upper.push(avg + (multiplier * stdDev));
        lower.push(avg - (multiplier * stdDev));
      }
      return { basis, upper, lower };
    };

    const calculateEnvelope = (prices: number[], period = 200, percentage = 14) => {
      const basis: number[] = [];
      const upper: number[] = [];
      const lower: number[] = [];
      for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
          basis.push(NaN);
          upper.push(NaN);
          lower.push(NaN);
          continue;
        }
        const slice = prices.slice(i - period + 1, i + 1);
        const avg = slice.reduce((sum, val) => sum + val, 0) / period;
        basis.push(avg);
        upper.push(avg * (1 + percentage / 100));
        lower.push(avg * (1 - percentage / 100));
      }
      return { basis, upper, lower };
    };

    // Add Strategy Price Lines on Main Series
    if (showTargets && fundamentals && fundamentals.strategies && activeStrategyId && mainSeries) {
      const strat = fundamentals.strategies[activeStrategyId];
      if (strat && typeof strat === 'object') {
        const isDark = true;
        
        // 1. Entry Price Line
        if (strat.entryPrice) {
          mainSeries.createPriceLine({
            price: Number(strat.entryPrice),
            color: '#10b981', // emerald green
            lineWidth: 2,
            lineStyle: 2, // dashed
            axisLabelVisible: true,
            title: `ENTRY (Tranche ${strat.tranche || ''}): ₹${strat.entryPrice}`,
          });
        }
        
        // 2. Target Price Line
        if (strat.target) {
          mainSeries.createPriceLine({
            price: Number(strat.target),
            color: '#3b82f6', // blue
            lineWidth: 2,
            lineStyle: 2, // dashed
            axisLabelVisible: true,
            title: `TARGET: ₹${strat.target}`,
          });
        }

        // 4. ABCD Points (Tranches)
        if (strat.abcd) {
          Object.entries(strat.abcd).forEach(([key, val]: [string, ABCDNode]) => {
            if (val && val.price) {
              const p = Number(val.price);
              if (p !== Number(strat.entryPrice) && p !== Number(strat.target)) {
                mainSeries.createPriceLine({
                  price: p,
                  color: isDark ? '#475569' : '#94a3b8', // slate/gray
                  lineWidth: 1,
                  lineStyle: 3, // dotted
                  axisLabelVisible: true,
                  title: `Tranche ${key.toUpperCase()}: ₹${p}`,
                });
              }
            }
          });
        }

        // 5. Shaded Accumulation Buy-Zone Band
        if (strat.entryPrice) {
          const entry = Number(strat.entryPrice);
          let bottomLimit = entry;
          if (strat.abcd) {
            const prices = Object.values(strat.abcd)
              .map(v => Number(v?.price))
              .filter(p => !isNaN(p) && p > 0);
            if (prices.length > 0) {
              bottomLimit = Math.min(...prices);
            }
          }
          if (bottomLimit === entry) {
            bottomLimit = entry * 0.9;
          }
          
          if (entry > bottomLimit) {
            const steps = 10;
            const stepSize = (entry - bottomLimit) / steps;
            for (let i = 0; i <= steps; i++) {
              const p = bottomLimit + (i * stepSize);
              mainSeries.createPriceLine({
                price: p,
                color: isDark ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.06)',
                lineWidth: 1,
                lineStyle: 0, // Solid
                axisLabelVisible: false,
                title: i === Math.floor(steps / 2) ? 'ACCUMULATION ZONE (SAFE BUY BAND)' : '',
              });
            }
          }
        }
      }
    }

    // Draw Bollinger Bands Channel if active and toggled
    if (activeStrategyId === 'BOLLINGER' && showPatterns && sortedHistory.length > 20) {
      const closePrices = sortedHistory.map(q => Number(q.close));
      const { basis, upper, lower } = calculateBollingerBands(closePrices);
      
      const basisSeries = chart.addSeries(LineSeries, {
        color: '#64748b',
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Basis'
      });
      basisSeries.setData(sortedHistory.map((q, idx) => ({ time: q.time, value: basis[idx] })).filter(v => !isNaN(v.value)));

      const upperSeries = chart.addSeries(LineSeries, {
        color: '#ef4444',
        lineWidth: 2,
        title: 'BB Upper'
      });
      upperSeries.setData(sortedHistory.map((q, idx) => ({ time: q.time, value: upper[idx] })).filter(v => !isNaN(v.value)));

      const lowerSeries = chart.addSeries(LineSeries, {
        color: '#10b981',
        lineWidth: 2,
        title: 'BB Lower'
      });
      lowerSeries.setData(sortedHistory.map((q, idx) => ({ time: q.time, value: lower[idx] })).filter(v => !isNaN(v.value)));
    }

    // Draw Envelope Channel if active and toggled
    if ((activeStrategyId === 'ENVELOPE_LONG' || activeStrategyId === 'ENVELOPE_SHORT') && showPatterns && sortedHistory.length > 50) {
      const closePrices = sortedHistory.map(q => Number(q.close));
      const { basis, upper, lower } = calculateEnvelope(closePrices, 200, 14);
      
      const basisSeries = chart.addSeries(LineSeries, {
        color: '#64748b',
        lineWidth: 1,
        lineStyle: 2,
        title: 'EMA Basis'
      });
      basisSeries.setData(sortedHistory.map((q, idx) => ({ time: q.time, value: basis[idx] })).filter(v => !isNaN(v.value)));

      const upperSeries = chart.addSeries(LineSeries, {
        color: '#ef4444',
        lineWidth: 2,
        title: 'Envelope Upper'
      });
      upperSeries.setData(sortedHistory.map((q, idx) => ({ time: q.time, value: upper[idx] })).filter(v => !isNaN(v.value)));

      const lowerSeries = chart.addSeries(LineSeries, {
        color: '#10b981',
        lineWidth: 2,
        title: 'Envelope Lower'
      });
      lowerSeries.setData(sortedHistory.map((q, idx) => ({ time: q.time, value: lower[idx] })).filter(v => !isNaN(v.value)));
    }

    // Draw swing Support & Resistance Pivots if toggled
    if (showSr && sortedHistory.length > 30) {
      const closePrices = sortedHistory.map(q => Number(q.close));
      const peaks: number[] = [];
      const troughs: number[] = [];
      const k = 5; // swing lookback
      
      for (let i = k; i < closePrices.length - k; i++) {
        let isPeak = true;
        let isTrough = true;
        for (let j = i - k; j <= i + k; j++) {
          if (j === i) continue;
          if (closePrices[j] >= closePrices[i]) isPeak = false;
          if (closePrices[j] <= closePrices[i]) isTrough = false;
        }
        if (isPeak) peaks.push(closePrices[i]);
        if (isTrough) troughs.push(closePrices[i]);
      }
      
      const uniquePeaks = [...new Set(peaks)].sort((a, b) => b - a).slice(0, 3);
      const uniqueTroughs = [...new Set(troughs)].sort((a, b) => a - b).slice(0, 3);
      const isDark = true;

      uniquePeaks.forEach(p => {
        mainSeries.createPriceLine({
          price: p,
          color: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.45)',
          lineWidth: 1,
          lineStyle: 3,
          axisLabelVisible: true,
          title: `Resistance: ₹${Math.round(p)}`
        });
      });

      uniqueTroughs.forEach(p => {
        mainSeries.createPriceLine({
          price: p,
          color: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.45)',
          lineWidth: 1,
          lineStyle: 3,
          axisLabelVisible: true,
          title: `Support: ₹${Math.round(p)}`
        });
      });
    }

    // Draw Cup & Handle pattern outlines if active and toggled
    if (activeStrategyId === 'CUP_HANDLE_ABCD' && showPatterns && sortedHistory.length > 60) {
      const cupHistory = sortedHistory.slice(-60);
      const lowPrice = Math.min(...cupHistory.map(q => Number(q.close)));
      const lowIdx = cupHistory.findIndex(q => Number(q.close) === lowPrice);
      const startPrice = Number(cupHistory[0].close);
      const endPrice = Number(cupHistory[cupHistory.length - 1].close);
      
      const cupSeries = chart.addSeries(LineSeries, {
        color: '#f59e0b', // Gold
        lineWidth: 2,
        title: 'Cup Curve'
      });

      const h = lowIdx;
      const k = lowPrice;
      const xStart = 0;
      const a = (startPrice - k) / Math.pow(xStart - h, 2);

      const arcData = cupHistory.map((q, idx) => {
        const val = a * Math.pow(idx - h, 2) + k;
        return {
          time: q.time,
          value: idx < cupHistory.length - 10 ? val : NaN
        };
      }).filter(v => !isNaN(v.value));
      cupSeries.setData(arcData);

      const handleSeries = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        lineStyle: 1, // Dotted
        title: 'Handle Channel'
      });

      const handleData = cupHistory.slice(-10).map((q, idx) => {
        const slope = - (endPrice * 0.015) / 10;
        return {
          time: q.time,
          value: endPrice + (idx * slope)
        };
      });
      handleSeries.setData(handleData);
    }

    // Head & Shoulders annotations or standard trigger markers
    if (activeStrategyId === 'RHS_ABCD' && showPatterns && sortedHistory.length > 80) {
      const len = sortedHistory.length;
      createSeriesMarkers(mainSeries, [
        {
          time: sortedHistory[len - 60].time,
          position: 'belowBar',
          color: '#3b82f6',
          shape: 'arrowUp',
          text: 'Left Shoulder',
        },
        {
          time: sortedHistory[len - 40].time,
          position: 'belowBar',
          color: '#f59e0b',
          shape: 'arrowUp',
          text: 'HEAD (Bottom)',
        },
        {
          time: sortedHistory[len - 20].time,
          position: 'belowBar',
          color: '#3b82f6',
          shape: 'arrowUp',
          text: 'Right Shoulder',
        }
      ]);
    } else {
      const markers = [];
      if (fundamentals && fundamentals.strategies && activeStrategyId) {
        const strat = fundamentals.strategies[activeStrategyId];
        if (strat && strat.triggerDate) {
          const matchCandle = sortedHistory.find(q => q.time === strat.triggerDate);
          if (matchCandle) {
            markers.push({
              time: matchCandle.time,
              position: 'belowBar',
              color: '#10b981',
              shape: 'arrowUp',
              text: 'BUY TRIGGER',
            });
          }
        }
      }
      createSeriesMarkers(mainSeries, markers);
    }

    // Add volume series below if toggled
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(formattedVolumes);
    }

    // Fit content to screen
    chart.timeScale().fitContent();

    // Handle resizing
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
  }, [historyData, theme, chartType, activeStrategyId, fundamentals, showTargets, showVolume, showSr, showPatterns]);

  // Format Large Currency in Crores
  const formatCr = (val: unknown) => {
    const n = Number(val);
    if (isNaN(n) || n === 0) return '—';
    return `₹ ${(n / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr.`;
  };

  const formatPct = (val: unknown) => {
    const n = Number(val);
    if (isNaN(n)) return '—';
    return `${(n * 100).toFixed(2)} %`;
  };

  // Compile and Download Standalone HTML Terminal File
  const downloadStandaloneTerminal = () => {
    if (!fundamentals || historyData.length === 0) return;

    const stockTitle = `${symbol} Charting Terminal`;
    const jsonData = JSON.stringify({
      symbol,
      fundamentals,
      history: historyData,
      activeStrategyId
    });

    const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${stockTitle} | MarketBeacon Pro</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Lightweight Charts CDN -->
  <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
  <!-- Lucide Icons CDN -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
    .neon-border {
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
    }
  </style>
</head>
<body class="min-h-screen flex flex-col">

  <!-- Header -->
  <header class="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 backdrop-blur-md px-6 py-4 flex justify-between items-center">
    <div class="flex items-center gap-3">
      <div class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
        <i data-lucide="activity" class="h-6 w-6"></i>
      </div>
      <div>
        <h1 class="text-lg font-black tracking-tight uppercase italic text-[var(--text-primary)] flex items-center gap-1.5">
          MarketBeacon <span class="text-blue-500">Terminal</span>
        </h1>
        <p class="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Offline / Standalone Portable Instance</p>
      </div>
    </div>
    
    <div class="flex items-center gap-4">
      <div class="px-3 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-xs font-bold tracking-wider text-[var(--text-secondary)]">
        ACTIVE SYMBOL: <span class="text-blue-400 font-bold">${symbol}</span>
      </div>
    </div>
  </header>

  <main class="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
    
    <!-- Left Panel: Fundamentals -->
    <section class="lg:col-span-1 space-y-6">
      <div class="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] p-5 rounded-3xl space-y-4 shadow-sm neon-border">
        <div class="flex justify-between items-center border-b border-[var(--border-primary)] pb-3">
          <span class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Fundamentals</span>
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
            \${fundamentals.audit?.universe || 'WATCHLIST'}
          </span>
        </div>
        
        <div class="space-y-4">
          <div>
            <span class="text-xs text-[var(--text-tertiary)] uppercase font-bold tracking-wider">Price</span>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold text-[var(--text-primary)] italic">₹ \${Number(fundamentals.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              <span class="text-xs font-bold \${fundamentals.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                \${fundamentals.change >= 0 ? '+' : ''}\${Number(fundamentals.change).toFixed(2)}%
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 border-t border-[var(--border-primary)] pt-3">
            <div>
              <span class="text-[11px] text-[var(--text-tertiary)] uppercase font-bold tracking-wider">Audit Score</span>
              <p class="text-lg font-bold text-blue-400 italic">\${fundamentals.audit?.score}/100</p>
            </div>
            <div>
              <span class="text-[11px] text-[var(--text-tertiary)] uppercase font-bold tracking-wider">PE Ratio</span>
              <p class="text-lg font-bold text-[var(--text-secondary)] italic">\${Number(fundamentals.peRatio || 0).toFixed(1)}</p>
            </div>
          </div>

          <div class="space-y-2 border-t border-[var(--border-primary)] pt-3">
            <div class="flex justify-between text-xs">
              <span class="text-[var(--text-tertiary)]">Market Cap:</span>
              <span class="font-bold text-[var(--text-secondary)]">\${formatCr(fundamentals.marketCap)}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-[var(--text-tertiary)]">ROE:</span>
              <span class="font-bold text-[var(--text-secondary)]">\${formatPct(fundamentals.returnOnEquity)}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-[var(--text-tertiary)]">ROCE:</span>
              <span class="font-bold text-[var(--text-secondary)]">\${formatPct(fundamentals.roce)}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-[var(--text-tertiary)]">Net Debt/Equity:</span>
              <span class="font-bold text-[var(--text-secondary)]">\${Number(fundamentals.netDebtToEquity || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Strategy Confidence Profile -->
      <div id="confidence-card" class="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] p-5 rounded-3xl space-y-4 shadow-sm neon-border hidden">
        <div class="flex justify-between items-center border-b border-[var(--border-primary)] pb-3">
          <span class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Strategy Confidence</span>
          <span id="conf-badge" class="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
            BUY ZONE
          </span>
        </div>
        
        <!-- SVG Gauge -->
        <div class="flex flex-col items-center py-2">
          <svg viewBox="0 0 100 55" class="w-32 h-16">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" stroke-width="8" stroke-linecap="round" />
            <path id="conf-gauge-fill" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#confGrad)" stroke-width="8" stroke-linecap="round" stroke-dasharray="125" stroke-dashoffset="125" />
            <defs>
              <linearGradient id="confGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#ef4444" />
                <stop offset="50%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#10b981" />
              </linearGradient>
            </defs>
            <text id="conf-gauge-text" x="50" y="45" text-anchor="middle" class="text-lg font-bold fill-white">0%</text>
          </svg>
          <span id="conf-level-text" class="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mt-2">MODERATE CONFIDENCE</span>
        </div>

        <!-- Progress bar visual range -->
        <div class="space-y-4 pt-2 border-t border-[var(--border-primary)]">
          <div class="relative pt-4 pb-2">
            <div class="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full relative">
              <div id="conf-accumulation-bar" class="absolute h-full bg-emerald-500/30 rounded-full" style="left: 0%; right: 100%;"></div>
              <div id="conf-target-bar" class="absolute h-full bg-blue-500/20 rounded-full" style="left: 0%; right: 100%;"></div>
            </div>
            
            <!-- Pins -->
            <div id="conf-price-pin" class="absolute -top-3 flex flex-col items-center transition-all duration-300" style="left: 50%; transform: translateX(-50%);">
              <div id="conf-price-val" class="px-1 py-0.2 rounded bg-blue-600 text-[9px] font-bold text-[var(--text-primary)]">₹0</div>
              <div class="w-1.5 h-1.5 rounded-full bg-[var(--bg-primary)] border border-blue-600 mt-0.5"></div>
            </div>
          </div>
          
          <div class="flex justify-between text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            <span id="conf-floor-lbl">FLOOR: ₹0</span>
            <span id="conf-entry-lbl">ENTRY: ₹0</span>
            <span id="conf-target-lbl">TARGET: ₹0</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Panel: Interactive Chart -->
    <section class="lg:col-span-3 space-y-6">
      <div class="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] p-5 rounded-3xl space-y-4 shadow-sm neon-border">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <h2 class="text-sm font-black text-[var(--text-secondary)] uppercase tracking-wider">\${symbol} Interactive Chart</h2>
          </div>
          <div class="flex rounded-xl bg-[var(--bg-primary)] p-1 border border-[var(--border-primary)]/80">
            <button id="btn-candles" class="px-3 py-1 rounded-lg text-xs font-bold transition-all text-[var(--text-primary)] bg-[var(--bg-tertiary)]">Candles</button>
            <button id="btn-line" class="px-3 py-1 rounded-lg text-xs font-bold transition-all text-[var(--text-tertiary)]">Line</button>
          </div>
        </div>
        
        <!-- Chart Canvas -->
        <div id="chart" class="w-full rounded-2xl overflow-hidden border border-[var(--border-primary)]/60 bg-[var(--bg-primary)]"></div>
      </div>
    </section>
    
  </main>

  <!-- Footer -->
  <footer class="border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/80 py-4 text-center text-xs text-[var(--text-muted)] uppercase tracking-wider">
    Generated via MarketBeacon Pro • Institutional Research Suite
  </footer>

  <script>
    // Initialize icons
    lucide.createIcons();

    // Data injected from app
    const data = \${jsonData};

    // TradingView Chart implementation
    const chartElement = document.getElementById('chart');
    const chart = LightweightCharts.createChart(chartElement, {
      width: chartElement.clientWidth,
      height: 480,
      layout: {
        background: { type: LightweightCharts.ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#475569', width: 1, style: 3 },
        horzLine: { color: '#475569', width: 1, style: 3 },
      },
      timeScale: { borderColor: '#1e293b', timeVisible: true },
      rightPriceScale: { borderColor: '#1e293b' }
    });

    const sortedHistory = [...data.history].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    const formattedQuotes = sortedHistory.map(q => ({
      time: q.time,
      open: parseFloat(q.open),
      high: parseFloat(q.high),
      low: parseFloat(q.low),
      close: parseFloat(q.close),
    }));

    const formattedVolumes = sortedHistory.map(q => ({
      time: q.time,
      value: parseFloat(q.volume || 0),
      color: parseFloat(q.close) >= parseFloat(q.open) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    }));

    let currentSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    currentSeries.setData(formattedQuotes);

    // Render static price lines for active strategy
    const activeStrat = data.fundamentals.strategies[data.activeStrategyId];

    function drawStrategyLines(series) {
      if (!activeStrat) return;
      if (activeStrat.entryPrice) {
        series.createPriceLine({
          price: Number(activeStrat.entryPrice),
          color: '#10b981',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'ENTRY (Tranche ' + (activeStrat.tranche || '') + '): ₹' + activeStrat.entryPrice
        });
      }
      if (activeStrat.target) {
        series.createPriceLine({
          price: Number(activeStrat.target),
          color: '#3b82f6',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'TARGET: ₹' + activeStrat.target
        });
      }
      if (activeStrat.abcd) {
        Object.entries(activeStrat.abcd).forEach(([key, val]) => {
          if (val && val.price) {
            const p = Number(val.price);
            if (p !== Number(activeStrat.entryPrice) && p !== Number(activeStrat.target)) {
              series.createPriceLine({
                price: p,
                color: 'rgba(71, 85, 105, 0.5)',
                lineWidth: 1,
                lineStyle: 3,
                axisLabelVisible: true,
                title: 'Tranche ' + key.toUpperCase() + ': ₹' + p
              });
            }
          }
        });
      }
      // Accumulation Band (Shaded)
      if (activeStrat.entryPrice) {
        const entry = Number(activeStrat.entryPrice);
        let bottomLimit = entry;
        if (activeStrat.abcd) {
          const prices = Object.values(activeStrat.abcd)
            .map(v => Number(v && v.price))
            .filter(p => !isNaN(p) && p > 0);
          if (prices.length > 0) {
            bottomLimit = Math.min(...prices);
          }
        }
        if (bottomLimit === entry) {
          bottomLimit = entry * 0.9;
        }
        if (entry > bottomLimit) {
          const steps = 10;
          const stepSize = (entry - bottomLimit) / steps;
          for (let i = 0; i <= steps; i++) {
            const p = bottomLimit + (i * stepSize);
            series.createPriceLine({
              price: p,
              color: 'rgba(16, 185, 129, 0.04)',
              lineWidth: 1,
              lineStyle: 0,
              axisLabelVisible: false,
              title: i === Math.floor(steps / 2) ? 'ACCUMULATION ZONE (SAFE BUY BAND)' : ''
            });
          }
        }
      }
    }

    drawStrategyLines(currentSeries);

    // Update Confidence Card UI
    const confidenceCard = document.getElementById('confidence-card');
    if (activeStrat && confidenceCard) {
      confidenceCard.classList.remove('hidden');
      const price = Number(data.fundamentals.price);
      const entry = Number(activeStrat.entryPrice || 0);
      const target = Number(activeStrat.target || 0);
      const isBuy = !!activeStrat.isBuyZone;
      const auditScore = Number(data.fundamentals.audit?.score || 50);
      
      let score = 50;
      if (isBuy) score += 20;
      if (entry && target) {
        if (price <= entry) {
          score += 15;
          if (activeStrat.abcd) {
            const prices = Object.values(activeStrat.abcd)
              .map(v => Number(v && v.price))
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
      const roce = Number(data.fundamentals.roce || 0);
      const netDebt = Number(data.fundamentals.netDebtToEquity || 0);
      if (roce > 0.20) score += 5;
      if (netDebt < 0.5) score += 5;
      score = Math.max(0, Math.min(100, score));
      
      let level = 'MODERATE';
      let badgeText = isBuy ? 'BUY ZONE' : 'HOLD';
      let badgeClass = isBuy ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-muted)]';
      
      if (score >= 85) level = 'STRONG BUY / MAX CONFIDENCE';
      else if (score >= 70) level = 'SAFE ACCUMULATION';
      else if (score >= 45) level = 'HOLD / MONITOR';
      else level = 'HIGH RISK / TAKE PROFIT';
      
      document.getElementById('conf-gauge-text').textContent = score + '%';
      const offset = 125 - (125 * score) / 100;
      document.getElementById('conf-gauge-fill').setAttribute('stroke-dashoffset', offset);
      document.getElementById('conf-level-text').textContent = level;
      
      const badge = document.getElementById('conf-badge');
      badge.textContent = badgeText;
      badge.className = 'px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ' + badgeClass;
      
      // Update confidence bar ranges
      let bottom = entry;
      if (activeStrat.abcd) {
        const prices = Object.values(activeStrat.abcd)
          .map(v => Number(v && v.price))
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
      const getPct = (val) => Math.max(0, Math.min(100, ((val - rangeMin) / totalRange) * 100));
      
      const currentPct = getPct(price);
      const entryPct = getPct(entry);
      const targetPct = getPct(target);
      const bottomPct = getPct(bottom);
      
      document.getElementById('conf-accumulation-bar').style.left = bottomPct + '%';
      document.getElementById('conf-accumulation-bar').style.right = (100 - entryPct) + '%';
      document.getElementById('conf-target-bar').style.left = entryPct + '%';
      document.getElementById('conf-target-bar').style.right = (100 - targetPct) + '%';
      
      document.getElementById('conf-price-pin').style.left = currentPct + '%';
      document.getElementById('conf-price-val').textContent = '₹' + Math.round(price);
      
      document.getElementById('conf-floor-lbl').textContent = 'FLOOR: ₹' + Math.round(bottom);
      document.getElementById('conf-entry-lbl').textContent = 'ENTRY: ₹' + Math.round(entry);
      document.getElementById('conf-target-lbl').textContent = 'TARGET: ₹' + Math.round(target);
    }

    const volumeSeries = chart.addSeries(LightweightCharts.HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: ''
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }
    });
    volumeSeries.setData(formattedVolumes);

    chart.timeScale().fitContent();

    // Resize handling
    window.addEventListener('resize', () => {
      chart.applyOptions({ width: chartElement.clientWidth });
    });

    // Chart type toggles
    const btnCandles = document.getElementById('btn-candles');
    const btnLine = document.getElementById('btn-line');

    btnCandles.addEventListener('click', () => {
      chart.removeSeries(currentSeries);
      currentSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
        upColor: '#10b981', downColor: '#ef4444',
        borderUpColor: '#10b981', borderDownColor: '#ef4444',
        wickUpColor: '#10b981', wickDownColor: '#ef4444',
      });
      currentSeries.setData(formattedQuotes);
      
      // re-draw lines
      drawStrategyLines(currentSeries);

      btnCandles.classList.add('bg-[var(--bg-tertiary)]', 'text-[var(--text-primary)]');
      btnCandles.classList.remove('text-[var(--text-tertiary)]');
      btnLine.classList.remove('bg-[var(--bg-tertiary)]', 'text-[var(--text-primary)]');
      btnLine.classList.add('text-[var(--text-tertiary)]');
    });

    btnLine.addEventListener('click', () => {
      chart.removeSeries(currentSeries);
      currentSeries = chart.addSeries(LightweightCharts.LineSeries, {
        color: '#3b82f6', lineWidth: 2
      });
      currentSeries.setData(formattedQuotes.map(q => ({ time: q.time, value: q.close })));
      
      // re-draw lines
      drawStrategyLines(currentSeries);

      btnLine.classList.add('bg-[var(--bg-tertiary)]', 'text-[var(--text-primary)]');
      btnLine.classList.remove('text-[var(--text-tertiary)]');
      btnCandles.classList.remove('bg-[var(--bg-tertiary)]', 'text-[var(--text-primary)]');
      btnCandles.classList.add('text-[var(--text-tertiary)]');
    });
  </script>
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketbeacon-${symbol.toLowerCase()}-terminal.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get currently selected strategy object
  const activeStrategy = fundamentals?.strategies?.[activeStrategyId || ''];

  const getConfidenceInfo = () => {
    if (!fundamentals || !activeStrategy) return { score: 50, level: 'MODERATE', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    
    const price = Number(fundamentals.price);
    const entry = Number(activeStrategy.entryPrice);
    const target = Number(activeStrategy.target);
    const isBuy = !!activeStrategy.isBuyZone;
    const auditScore = Number(fundamentals.audit?.score || 50);
    
    let score = 50; // Base score
    
    // 1. Buy zone bonus
    if (isBuy) {
      score += 20;
    }
    
    // 2. Proximity to Entry and Target
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
    
    // 3. Audit score bonus
    score += Math.round((auditScore / 100) * 10);
    
    // 4. Quality checks
    const roce = Number(fundamentals.roce || 0);
    const netDebt = Number(fundamentals.netDebtToEquity || 0);
    
    if (roce > 0.20) score += 5;
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

  const getStorytellingText = () => {
    if (!activeStrategy) return '';
    const displayName = STRATEGY_NAMES[activeStrategyId || ''] || activeStrategyId;
    const entry = Math.round(Number(activeStrategy.entryPrice || 0));
    const target = Math.round(Number(activeStrategy.target || 0));
    
    switch (activeStrategyId) {
      case 'BOLLINGER':
        return `${symbol} crossed below its lower Bollinger Band at ₹${entry}, triggering a momentum exhaust rebound setup. 1H RSI is oversold. Accumulation buy range is active up to ₹${entry} with target objectives set at ₹${target}.`;
      case 'ENVELOPE_LONG':
        return `${symbol} is trading within the extreme lower bounds of its 200 EMA envelope channel. Long-term accumulation is active in the optimal green buy corridor under ₹${entry} with key profit booking target targets placed at ₹${target}.`;
      case '52W_HIGH_LOW':
        return `${symbol} has entered a key consolidation range near its 52-week parameters. A technical breakout trigger is set at ₹${entry} with a target of ₹${target}.`;
      default:
        return `${symbol} has matched all technical qualifiers for the ${displayName} strategy. A safe entry buy zone is currently active at ₹${entry} with a projected target potential gain of +${(((target - entry) / Math.max(1, entry)) * 100).toFixed(1)}% targeting ₹${target}.`;
    }
  };

  const getActiveBuyStrategyName = (): string => {
    if (!fundamentals || !fundamentals.strategies) return '';
    
    // Find if the currently active strategy is in buy zone first
    if (activeStrategyId && fundamentals.strategies[activeStrategyId]?.isBuyZone) {
      return STRATEGY_NAMES[activeStrategyId] || activeStrategyId;
    }
    
    // Otherwise, find any strategy that has isBuyZone === true
    const buyStratId = Object.keys(fundamentals.strategies).find(
      key => fundamentals.strategies[key]?.isBuyZone
    );
    
    if (buyStratId) {
      return STRATEGY_NAMES[buyStratId] || buyStratId;
    }
    
    return '';
  };

  const activeBuyStrategy = getActiveBuyStrategyName();

  const confidence = getConfidenceInfo();

  // Pre-calculate values for confidence profile range slider
  let rangeInfo = { bottom: 0, bottomPct: 0, entryPct: 0, targetPct: 0, currentPct: 0 };
  if (fundamentals && activeStrategy) {
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
    
    rangeInfo = {
      bottom,
      bottomPct: getPct(bottom),
      entryPct: getPct(entry),
      targetPct: getPct(target),
      currentPct: getPct(price)
    };
  }

  const renderConfidenceProfile = () => {
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
      <div className={`p-6 rounded-3xl border ${
        'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
      }`}>
        <div className="flex justify-between items-center mb-5 border-b border-[var(--border-primary)]/60 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
              Institutional Entry Confidence Profile
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${confidence.bg} ${confidence.color} border border-current/20`}>
            {confidence.level}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <ConfidenceGauge score={confidence.score} className="p-4 border border-[var(--border-primary)]/40 rounded-2xl bg-[var(--bg-primary)]/20" />

          {/* Range Slider / Shape */}
          <div className="md:col-span-2 space-y-5">
            <span className="text-xs text-[var(--text-muted)] font-extrabold uppercase tracking-wider block">
              Confidence Range Visualization (Safe Entry vs Target Progression)
            </span>
            
            <div className="relative pt-6 pb-2 px-1">
              {/* Slider Track */}
              <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full relative">
                {/* Safe Accumulation Band */}
                <div 
                  className="absolute h-full bg-emerald-500/30 rounded-full"
                  style={{ left: `${bottomPct}%`, right: `${100 - entryPct}%` }}
                />
                {/* Progression to Target */}
                <div 
                  className="absolute h-full bg-blue-500/20 rounded-full"
                  style={{ left: `${entryPct}%`, right: `${100 - targetPct}%` }}
                />
              </div>

              {/* Markers */}
              <div 
                className="absolute -top-1 flex flex-col items-center"
                style={{ left: `${bottomPct}%`, transform: 'translateX(-50%)' }}
              >
                <div className="h-4 w-1 bg-slate-500" />
                <span className="text-[9px] font-bold text-[var(--text-muted)] mt-1">FLOOR (₹{Math.round(bottom)})</span>
              </div>

              <div 
                className="absolute -top-1 flex flex-col items-center"
                style={{ left: `${entryPct}%`, transform: 'translateX(-50%)' }}
              >
                <div className="h-4 w-1.5 bg-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-400 mt-1">ENTRY (₹{Math.round(entry)})</span>
              </div>

              <div 
                className="absolute -top-1 flex flex-col items-center"
                style={{ left: `${targetPct}%`, transform: 'translateX(-50%)' }}
              >
                <div className="h-4 w-1.5 bg-blue-500" />
                <span className="text-[9px] font-bold text-blue-400 mt-1">TARGET (₹{Math.round(target)})</span>
              </div>

              {/* Pin pointing to current price */}
              <div 
                className="absolute -top-4 flex flex-col items-center z-10 transition-all duration-300"
                style={{ left: `${currentPct}%`, transform: 'translateX(-50%)' }}
              >
                <div className="px-2 py-0.5 rounded bg-blue-600 text-[9px] font-bold text-[var(--text-primary)] shadow-md">
                  ₹{Math.round(price)}
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-primary)] border-2 border-blue-600 mt-0.5" />
              </div>
            </div>

            {/* Assessment info */}
            <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              price <= entry
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : price <= target
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span>
                  {price <= entry 
                    ? `Price is in high-confidence Accumulation Zone (Below Entry: ₹${Math.round(entry)}).` 
                    : price <= target 
                      ? `Price is moving towards Target: ₹${Math.round(target)}. Entry zone has passed.` 
                      : `Target achieved! Price is above Target: ₹${Math.round(target)}. Profit booking zone.`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 \${
      'bg-[var(--bg-primary)] text-[var(--text-primary)]'
    }`}>
      
      {/* Ticker Bar (Top) */}
      <div className={`border-b text-[11px] font-bold uppercase tracking-wider overflow-hidden \${
        'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-tertiary)]'
      }`}>
        <div className="flex divide-x divide-slate-800 overflow-x-auto py-2 px-4 whitespace-nowrap scrollbar-none">
          {(indices || []).map((idx, i) => (
            <div key={i} className="flex items-center gap-2 px-6">
              <span className={'text-[var(--text-secondary)]'}>{idx.name}</span>
              <span className="font-bold">₹ {idx.price.toLocaleString('en-IN')}</span>
              <span className={`flex items-center text-xs font-bold \${
                idx.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {idx.change >= 0 ? <TrendingUp className="h-2.5 w-2.5 mr-0.5 inline" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5 inline" />}
                {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
              </span>
            </div>
          ))}
          {indices.length === 0 && (
            <div className="flex items-center justify-center w-full text-[var(--text-muted)]">
              <RefreshCw className="h-3 w-3 animate-spin mr-2" /> Connecting Market Feeds...
            </div>
          )}
        </div>
      </div>

      {/* Main Header */}
      <header className={`border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 \${
        'bg-[var(--bg-secondary)]/60 border-[var(--border-primary)]/80'
      }`}>
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 group-hover:scale-105 transition-transform">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className={`text-lg font-black tracking-tight uppercase italic flex items-center gap-1.5 \${
                'text-[var(--text-primary)]'
              }`}>
                MarketBeacon <span className="text-blue-500">Terminal</span>
              </h1>
              <p className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Interactive Market Desk</p>
            </div>
          </Link>
        </div>

        {/* Search & Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Basket & Asset Selectors */}
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            {/* Basket Selector */}
            <div className={`flex items-center rounded-2xl border px-3 py-2 transition-all ${
              'bg-[var(--bg-primary)] border-[var(--border-primary)] focus-within:border-blue-500/50'
            }`}>
              <span className="text-[11px] font-bold uppercase text-[var(--text-tertiary)] mr-1.5 tracking-wider">Basket:</span>
              <select
                value={selectedBasket}
                onChange={(e) => handleBasketChange(e.target.value)}
                className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer pr-1 text-[var(--text-secondary)] focus:text-[var(--text-primary)]"
              >
                <option value="Elite Basket" className={'bg-[#0f172a]'}>Elite</option>
                <option value="Quality Basket" className={'bg-[#0f172a]'}>Quality</option>
                <option value="Growth Basket" className={'bg-[#0f172a]'}>Growth</option>
              </select>
            </div>

            {/* Asset Selector */}
            <div className={`flex items-center rounded-2xl border px-3 py-2 transition-all ${
              'bg-[var(--bg-primary)] border-[var(--border-primary)] focus-within:border-blue-500/50'
            }`}>
              <span className="text-[11px] font-bold uppercase text-[var(--text-tertiary)] mr-1.5 tracking-wider">Stock:</span>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-transparent border-none text-xs font-bold outline-none cursor-pointer pr-1 text-[var(--text-secondary)] focus:text-[var(--text-primary)] w-24"
              >
                {(BASKETS[selectedBasket] || []).map((stockSymbol) => (
                  <option key={stockSymbol} value={stockSymbol} className={'bg-[#0f172a]'}>
                    {stockSymbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Buy Strategy Badge */}
          {activeBuyStrategy && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>BUY: {activeBuyStrategy}</span>
            </div>
          )}

          {/* Autocomplete Search input */}
          <div className="relative w-full sm:w-64" ref={dropdownRef}>
            <div className={`flex items-center rounded-2xl border px-3.5 py-2 transition-all \${
              'bg-[var(--bg-primary)] border-[var(--border-primary)] focus-within:border-blue-500/50'
            }`}>
              <Search className="h-4 w-4 text-[var(--text-tertiary)] mr-2.5" />
              <input
                type="text"
                placeholder="Search symbol (e.g. INFY, RELIANCE)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="bg-transparent border-none text-xs font-bold w-full outline-none placeholder-slate-500"
              />
            </div>

            {/* Dropdown Results */}
            {showDropdown && searchResults.length > 0 && (
              <div className={`absolute left-0 right-0 mt-2 z-[100] rounded-2xl border shadow-xl max-h-[50vh] overflow-y-auto p-1.5 \${
                'bg-[var(--bg-secondary)] border-[var(--border-primary)]'
              }`}>
                {searchResults.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSymbol(item.symbol);
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors \${
                      'hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold tracking-wide text-[var(--text-secondary)]">{item.symbol}</span>
                      <div className="flex gap-1.5 mt-0.5">
                        {(item.baskets || []).map((b, idx) => (
                          <span key={idx} className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.2 bg-blue-500/5 text-blue-400 border border-blue-500/10 rounded">
                            {b.replace(' Basket', '')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold block">₹ {item.price.toLocaleString('en-IN')}</span>
                      <span className={`text-xs font-bold \${item.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Back to Terminal */}
            <Link
              to="/alpha-hub"
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-extrabold text-xs tracking-wider uppercase transition-all ${
                'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>Back to Terminal</span>
            </Link>

            {/* Standalone Download */}
            <button
              onClick={downloadStandaloneTerminal}
              title="Download Standalone HTML Chart"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text-primary)] font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/20 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Export Portable</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Area */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6">
        
        {/* Top Part: Chart Canvas (Full Width) */}
        <section className="w-full">
          {/* Interactive Chart Card */}
          <div className={`p-5 rounded-3xl border flex flex-col ${
            'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
          }`}>
            {/* Chart Toolbar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold tracking-wider uppercase ${
                  'text-[var(--text-tertiary)]'
                }`}>NSE Chart Terminal</span>
                {chartLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />}
              </div>
              
              {/* Candles vs Line toggles */}
              <div className={`flex rounded-xl p-0.5 border ${
                'bg-[var(--bg-primary)] border-[var(--border-primary)]/80'
              }`}>
                <button
                  onClick={() => setChartType('candles')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    chartType === 'candles'
                      ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-tertiary)]'
                  }`}
                >
                  Candles
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    chartType === 'line'
                      ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-tertiary)]'
                  }`}
                >
                  Line
                </button>
              </div>
            </div>

            {/* Interactive Chart Canvas Container */}
            <div 
              ref={chartContainerRef} 
              className={`w-full rounded-2xl overflow-hidden border ${
                'border-[var(--border-primary)]/60 bg-[var(--bg-primary)]'
              }`}
              style={{ minHeight: '520px' }}
            >
              {historyData.length === 0 && !chartLoading && (
                <div className="flex flex-col items-center justify-center h-[520px] text-[var(--text-muted)]">
                  <Info className="h-8 w-8 mb-2 text-slate-600" />
                  <p className="text-xs font-bold uppercase tracking-wider">No Historical Quotes Available</p>
                </div>
              )}
            </div>

            {/* Overlays Toggle and Legend Panel */}
            <div className={`mt-4 p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 ${
              'bg-[var(--bg-primary)]/60 border-[var(--border-primary)]/80'
            }`}>
              {/* Toggles */}
              <div className="flex flex-wrap gap-4 items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Overlays:</span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={showTargets} 
                    onChange={(e) => setShowTargets(e.target.checked)}
                    className="rounded border-[var(--border-primary)] bg-[var(--bg-primary)] text-blue-600 focus:ring-blue-500/20"
                  />
                  <span>Targets</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={showVolume} 
                    onChange={(e) => setShowVolume(e.target.checked)}
                    className="rounded border-[var(--border-primary)] bg-[var(--bg-primary)] text-blue-600 focus:ring-blue-500/20"
                  />
                  <span>Volume</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={showSr} 
                    onChange={(e) => setShowSr(e.target.checked)}
                    className="rounded border-[var(--border-primary)] bg-[var(--bg-primary)] text-blue-600 focus:ring-blue-500/20"
                  />
                  <span>S&R</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-bold">
                  <input 
                    type="checkbox" 
                    checked={showPatterns} 
                    onChange={(e) => setShowPatterns(e.target.checked)}
                    className="rounded border-[var(--border-primary)] bg-[var(--bg-primary)] text-blue-600 focus:ring-blue-500/20"
                  />
                  <span>Patterns</span>
                </label>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3.5 items-center text-xs font-extrabold uppercase tracking-wider text-[var(--text-tertiary)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-0.5 bg-emerald-500" />
                  <span>Entry</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-0.5 bg-blue-500" />
                  <span>Target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 bg-emerald-500/20 rounded" />
                  <span>Zone</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Part: Options, Metrics, and Analysis Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           
           {/* Column 1: Strategy Selector & Key Metrics */}
           <div className="space-y-6">
              {/* Strategy Selector */}
              <div className={`p-5 rounded-3xl border ${
                'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
              }`}>
                <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-primary)]/60 pb-3">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Active Entry Strategies</span>
                </div>

                {loading || !fundamentals || !fundamentals.strategies ? (
                  <div className="py-4 text-center text-xs text-[var(--text-muted)]">No active strategies.</div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {Object.entries(fundamentals.strategies).map(([key, value]: [string, any]) => {
                      const hasZone = value && typeof value === 'object';
                      const isBuy = hasZone && value.isBuyZone;
                      const displayName = STRATEGY_NAMES[key] || key;
                      
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveStrategyId(key)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-left border transition-all ${
                            activeStrategyId === key
                              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                              : 'bg-[var(--bg-primary)]/40 border-slate-900 hover:border-[var(--border-primary)]'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold tracking-wide block truncate max-w-[140px]">{displayName}</span>
                            {hasZone && value.tranche && (
                              <span className="text-[9px] font-bold tracking-wider uppercase text-[var(--text-muted)]">
                                Tranche {value.tranche}
                              </span>
                            )}
                          </div>
                          {isBuy ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                              BUY ZONE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-muted)] uppercase tracking-wider">
                              HOLD
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Key Metrics */}
              <div className={`p-5 rounded-3xl border ${
                'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
              }`}>
                {loading || !fundamentals ? (
                  <div className="space-y-4 py-12 text-center text-[var(--text-tertiary)]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                    <p className="text-xs font-bold uppercase tracking-wider">Gathering Asset Intel...</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Symbol Information */}
                    <div className="flex justify-between items-start border-b border-[var(--border-primary)]/60 pb-4">
                      <div>
                        <h2 className="text-xl font-black italic tracking-tight">{fundamentals.symbol}</h2>
                        <p className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">{fundamentals.industry}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
                        fundamentals.audit?.universe === 'INSTITUTIONAL'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      }`}>
                        {fundamentals.audit?.universe}
                      </span>
                    </div>

                    {/* Price Box */}
                    <div>
                      <span className="text-xs text-[var(--text-muted)] font-extrabold uppercase tracking-wider">Current Price</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-bold italic">₹ {Number(fundamentals.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        <span className={`text-xs font-bold ${fundamentals.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {fundamentals.change >= 0 ? '+' : ''}{Number(fundamentals.change).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Audit Score Box */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                      'bg-[var(--bg-primary)]/60 border-[var(--border-primary)]'
                    }`}>
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-[var(--text-muted)] font-extrabold uppercase tracking-wider">Audit Score</span>
                        <h3 className="text-2xl font-bold italic text-blue-500">{fundamentals.audit?.score}/100</h3>
                      </div>
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/15 text-blue-500">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Valuation Multiples */}
                    <div className="space-y-3 border-t border-[var(--border-primary)]/60 pt-4">
                      <span className="text-xs text-[var(--text-muted)] font-extrabold uppercase tracking-wider">Valuation & Growth</span>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-tertiary)] font-medium">PE Ratio:</span>
                        <span className="font-extrabold">{Number(fundamentals.peRatio || 0).toFixed(1)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-tertiary)] font-medium">Median PE (3Y/5Y):</span>
                        <span className="font-extrabold">
                          {fundamentals.peMedians?.pe3Y ? Number(fundamentals.peMedians.pe3Y).toFixed(1) : '—'} / 
                          {fundamentals.peMedians?.pe5Y ? Number(fundamentals.peMedians.pe5Y).toFixed(1) : '—'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-tertiary)] font-medium">Market Capitalization:</span>
                        <span className="font-extrabold">{formatCr(fundamentals.marketCap)}</span>
                      </div>
                    </div>

                    {/* Efficiency & Balance Sheet */}
                    <div className="space-y-3 border-t border-[var(--border-primary)]/60 pt-4">
                      <span className="text-xs text-[var(--text-muted)] font-extrabold uppercase tracking-wider">Safety & Efficiency</span>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-tertiary)] font-medium">Return on Equity (ROE):</span>
                        <span className="font-extrabold">{formatPct(fundamentals.returnOnEquity)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-tertiary)] font-medium">ROCE:</span>
                        <span className="font-extrabold">{formatPct(fundamentals.roce)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-tertiary)] font-medium">Net Debt to Equity:</span>
                        <span className="font-extrabold">{Number(fundamentals.netDebtToEquity || 0).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[var(--text-tertiary)] font-medium">52W Range High:</span>
                        <span className="font-extrabold text-[var(--text-secondary)]">₹ {Number(fundamentals.fiftyTwoWeekHigh || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Sales & Profit vs ATH */}
                    <div className="space-y-3 border-t border-[var(--border-primary)]/60 pt-4">
                      <span className="text-xs text-[var(--text-muted)] font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-blue-500" /> High Growth Potential
                      </span>
                      
                      <div className="space-y-2.5">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[var(--text-tertiary)]">Sales (vs ATH):</span>
                            <span className="font-bold">{formatCr(fundamentals.currentSales)} / {formatCr(fundamentals.athSales)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(100, (fundamentals.currentSales / (fundamentals.athSales || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[var(--text-tertiary)]">Net Profit (vs ATH):</span>
                            <span className="font-bold">{formatCr(fundamentals.currentNetProfit)} / {formatCr(fundamentals.athNetProfit)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, (fundamentals.currentNetProfit / (fundamentals.athNetProfit || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
           </div>

           {/* Column 2: ABCD Timeline & Strategic Narrative */}
           <div className="space-y-6">
              {/* Guided Storytelling & Trade Targets Panel */}
              {activeStrategy && (
                <div className={`p-5 rounded-3xl border space-y-4 ${
                  'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
                }`}>
                  <div className="flex items-center gap-2 border-b border-[var(--border-primary)]/60 pb-3">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Strategic Narrative</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase text-[var(--text-secondary)]">{STRATEGY_NAMES[activeStrategyId || ''] || activeStrategyId}</h3>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-2 font-medium leading-relaxed bg-[var(--bg-primary)]/45 p-3 rounded-2xl border border-slate-900/50">
                      {getStorytellingText()}
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-[var(--border-primary)]/40">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-tertiary)] font-bold">Safe Entry:</span>
                      <span className="font-extrabold text-emerald-400">₹ {Number(activeStrategy.entryPrice || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-tertiary)] font-bold">Target Price:</span>
                      <span className="font-extrabold text-blue-400">₹ {Number(activeStrategy.target || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-[var(--border-primary)]/40 pt-2">
                      <span className="text-[var(--text-tertiary)] font-bold">Potential Gain:</span>
                      <span className="font-extrabold text-emerald-400">
                        +{(((Number(activeStrategy.target || 0) - Number(activeStrategy.entryPrice || 0)) / Math.max(1, Number(activeStrategy.entryPrice || 1))) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ABCD Tranche Laddering Visual Timeline */}
              {activeStrategy && (
                <div className={`p-5 rounded-3xl border ${
                  'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
                }`}>
                  <div className="flex justify-between items-center mb-5 border-b border-[var(--border-primary)]/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                        ABCD Tranche Timeline
                      </span>
                    </div>
                    {activeStrategy.isBuyZone && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <CheckCircle2 className="h-3 w-3" /> Safe Entry Active
                      </div>
                    )}
                  </div>

                  {/* Ladder visual pipeline */}
                  {activeStrategy.abcd ? (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {Object.entries(activeStrategy.abcd).map(([key, val]: [string, any]) => {
                        const isPassed = activeStrategy.tranche 
                          ? key.toUpperCase().charCodeAt(0) <= activeStrategy.tranche.toUpperCase().charCodeAt(0)
                          : false;
                        const isActive = activeStrategy.tranche === key.toUpperCase();
                        
                        return (
                          <div 
                            key={key} 
                            className={`p-3.5 rounded-2xl border transition-all relative ${
                              isActive 
                                ? 'bg-blue-600/10 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.06)]'
                                : (isPassed 
                                  ? 'bg-[var(--bg-secondary)]/60 border-[var(--border-primary)]/80 text-[var(--text-secondary)]'
                                  : 'bg-[var(--bg-primary)]/20 border-slate-955/80 text-slate-600 opacity-60')
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider">Tranche {key.toUpperCase()}</span>
                              {isActive && (
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping absolute top-3 right-3" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-md font-bold italic">₹ {Number(val.price).toLocaleString('en-IN')}</h4>
                              <p className="text-[7.5px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] truncate">
                                {val.date ? `${val.date}` : 'Not Triggered'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider">No ABCD Tranche settings for this strategy.</span>
                      <div className="grid grid-cols-2 gap-4 w-full mt-2 border border-[var(--border-primary)] p-3 rounded-2xl bg-[var(--bg-primary)]/30">
                        <div className="text-left">
                          <span className="text-[9px] text-[var(--text-muted)] uppercase font-extrabold">Entry</span>
                          <p className="text-sm font-bold text-emerald-400 italic">₹ {Number(activeStrategy.entryPrice || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] text-[var(--text-muted)] uppercase font-extrabold">Target</span>
                          <p className="text-sm font-bold text-blue-400 italic">₹ {Number(activeStrategy.target || 0).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
           </div>

           {/* Column 3: Trust Dial & Verification */}
           <div className="space-y-6">
              {/* Institutional Trust Dial */}
              {activeStrategy && (
                <div className={`p-5 rounded-3xl border flex flex-col ${
                  'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
                }`}>
                  <div className="flex justify-between items-center mb-4 border-b border-[var(--border-primary)]/60 pb-3">
                    <span className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">Institutional Trust Dial</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${confidence.bg} ${confidence.color} border border-current/20`}>
                      {confidence.level.split(' / ')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ConfidenceGauge score={confidence.score} size="sm" label="" className="shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Rating: {confidence.score}/100</h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 font-bold">Measures technical support alignment & price zone safety.</p>
                    </div>
                  </div>

                  {/* Slider Track (Miniaturized Range Visualization) */}
                  <div className="relative pt-6 pb-2 px-1 border-t border-[var(--border-primary)]/40 mt-4">
                    <div className="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full relative">
                      <div 
                        className="absolute h-full bg-emerald-500/30 rounded-full"
                        style={{ left: `${rangeInfo.bottomPct}%`, right: `${100 - rangeInfo.entryPct}%` }}
                      />
                      <div 
                        className="absolute h-full bg-blue-500/20 rounded-full"
                        style={{ left: `${rangeInfo.entryPct}%`, right: `${100 - rangeInfo.targetPct}%` }}
                      />
                    </div>
                    <div 
                      className="absolute -top-1.5 flex flex-col items-center"
                      style={{ left: `${rangeInfo.bottomPct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="h-3 w-0.5 bg-slate-500" />
                      <span className="text-[6.5px] font-bold text-[var(--text-muted)] mt-0.5">FLR</span>
                    </div>
                    <div 
                      className="absolute -top-1.5 flex flex-col items-center"
                      style={{ left: `${rangeInfo.entryPct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="h-3 w-1 bg-emerald-500" />
                      <span className="text-[6.5px] font-bold text-emerald-400 mt-0.5">ENT</span>
                    </div>
                    <div 
                      className="absolute -top-1.5 flex flex-col items-center"
                      style={{ left: `${rangeInfo.targetPct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="h-3 w-1 bg-blue-500" />
                      <span className="text-[6.5px] font-bold text-blue-400 mt-0.5">TGT</span>
                    </div>
                    <div 
                      className="absolute -top-4 flex flex-col items-center z-10 transition-all duration-300"
                      style={{ left: `${rangeInfo.currentPct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="px-1 py-0.2 rounded bg-blue-600 text-[6.5px] font-bold text-[var(--text-primary)] shadow">
                        ₹{Math.round(fundamentals.price)}
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--bg-primary)] border border-blue-600 mt-0.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Deep Link & Verification panel */}
              <div className={`p-5 rounded-3xl border space-y-4 ${
                'bg-[var(--bg-secondary)]/40 border-[var(--border-primary)]'
              }`}>
                <div className="space-y-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Deep Link verification</span>
                  <p className="text-xs font-bold text-[var(--text-tertiary)]">Verify these exact levels inside your native TradingView charts.</p>
                </div>
                <a
                  href={`https://www.tradingview.com/chart/?symbol=NSE:${symbol}&interval=1H`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text-primary)] font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/20 transition-all justify-center w-full"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Verify on TradingView</span>
                </a>
              </div>
           </div>

        </section>
      </main>
    </div>
  );
};

export default ChartsTerminal;
