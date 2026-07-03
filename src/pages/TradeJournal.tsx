import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  Clock,
  Wallet,
  TrendingUp,
  Activity,
  Download,
  Plus, 
  Trash2, 
  CheckCircle2, 
  RotateCcw,
  X,
  Upload,
  ArrowUpDown,
  Square,
  CheckSquare,
  Share2
} from 'lucide-react';
import Papa from 'papaparse';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { authFetch } from '../lib/authFetch';
import { toast } from 'sonner';
import type { TradeRecord, StockPriceResult } from '../types';

const API_URL = getApiUrl();

const TradeJournalPage: React.FC = () => {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState<TradeRecord | null>(null);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'entry_date', direction: 'desc' });

  const [newTrade, setNewTrade] = useState({
    symbol: '',
    entry_price: '',
    quantity: '',
    target_price: '',
    stop_loss: '',
    level: 'A',
    entry_date: new Date().toISOString().split('T')[0],
    strategy: STRATEGIES[0].name,
    notes: ''
  });

  const [closeTradeData, setCloseTradeData] = useState({
    exit_price: '',
    quantity_to_close: '',
    notes: 'Target Hit'
  });

  const fetchLivePrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    try {
      const res = await fetch(`${API_URL}/api/stock-prices?symbols=${symbols.join(',')}`);
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        const prices: Record<string, number> = {};
        data.forEach((s: StockPriceResult) => {
          if (s.price) prices[s.symbol] = s.price;
        });
        setLivePrices(prices);
      }
    } catch (e) { console.error('Price fetch failed:', e); }
  }, []);

  const fetchTrades = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch('/api/trades');
      const data = await safeJsonParse(res);
      if (res.status === 401 || res.status === 403 || data?.error === 'Invalid token.' || data?.error === 'Access denied.') {
        localStorage.removeItem('mb_token');
        localStorage.removeItem('mb_user');
        window.location.href = '/login';
        return;
      }
      if (res.ok && !data.error) {
        setTrades(data);
        if (data.length > 0) fetchLivePrices(data.map((t: TradeRecord) => t.symbol));
      }
    } catch (e) { console.error('Trades fetch failed:', e); }
    finally { setLoading(false); }
  }, [fetchLivePrices]);

  useEffect(() => { 
    fetchTrades(); 
  }, [fetchTrades]);

  // Polling for Live Prices
  useEffect(() => {
    const openSymbols = Array.from(new Set(
      trades.filter(t => t.status === 'OPEN').map(t => t.symbol)
    ));

    if (openSymbols.length === 0) return;

    fetchLivePrices(openSymbols);
    const interval = setInterval(() => fetchLivePrices(openSymbols), 30000); // 30s poll
    return () => clearInterval(interval);
  }, [trades, fetchLivePrices]);

  const stats = useMemo(() => {
    const openTrades = trades.filter(t => t.status === 'OPEN');
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const totalRealized = closedTrades.reduce((acc, t) => acc + ( ((t.exit_price || 0) - (t.entry_price || 0)) * (t.quantity || 0) ), 0);
    const totalUnrealized = openTrades.reduce((acc, t) => {
      const cmp = livePrices[t.symbol] || t.entry_price;
      return acc + ( (cmp - t.entry_price) * t.quantity );
    }, 0);
    return { totalRealized, totalUnrealized };
  }, [trades, livePrices]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const processedTrades = useMemo(() => {
    const tradeData = trades.filter(t => t.status === activeSegment).map(t => {
      const entryPrice = Number(t.entry_price) || 0;
      const quantity = Number(t.quantity) || 0;
      const cmp = Number(livePrices[t.symbol]) || entryPrice;
      const price = activeSegment === 'OPEN' ? cmp : (Number(t.exit_price) || entryPrice);
      
      const invested = quantity * entryPrice;
      const currentVal = quantity * price;
      const pnl = currentVal - invested;
      const pnlPer = invested > 0 ? (pnl / invested) * 100 : 0;
      
      const targetPrice = Number(t.target_price) || (entryPrice * 1.25);
      const targetVal = targetPrice;
      const gap = ((targetPrice - cmp) / (cmp || 1)) * 100;
      
      const d1 = t.entry_date ? new Date(t.entry_date).getTime() : Date.now();
      const d2 = (t.exit_date && activeSegment === 'CLOSED') ? new Date(t.exit_date).getTime() : Date.now();
      const diff = d2 - d1;
      const days = isNaN(diff) ? 1 : Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      const annualGain = days > 0 ? (pnlPer / days * 365) : 0;
      
      return { ...t, cmp, price, invested, currentVal, pnl, pnlPer, targetVal, gap, days, annualGain };
    });
    if (sortConfig) {
      tradeData.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return tradeData;
  }, [trades, activeSegment, livePrices, sortConfig]);

  const summaryStats = useMemo(() => {
    const totalBuyValue = processedTrades.reduce((acc, t) => acc + (t.invested || 0), 0);
    const totalPnl = processedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const totalPnlPer = totalBuyValue > 0 ? (totalPnl / totalBuyValue) * 100 : 0;
    
    const totalDays = processedTrades.reduce((acc, t) => acc + (t.days || 0), 0);
    const avgDays = processedTrades.length > 0 ? totalDays / processedTrades.length : 0;
    const avgAnnualGain = avgDays > 0 ? (totalPnlPer / avgDays * 365) : 0;

    return { totalBuyValue, totalPnl, totalPnlPer, avgDays, avgAnnualGain };
  }, [processedTrades]);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} records?`)) return;
    try {
      const res = await authFetch('/api/trades/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) { setSelectedIds([]); fetchTrades(); }
    } catch (e) { console.error(e); }
  };

  const handleDownloadTemplate = (type: 'OPEN' | 'CLOSED') => {
    let headers: string[];
    let sampleData: string[][];
    let fileName: string;

    if (type === 'OPEN') {
      headers = ['Symbol', 'Quantity', 'Open Price', 'Open Date', 'Objective Price', 'Level', 'Strategy', 'Notes'];
      sampleData = [
        ['RELIANCE', '10', '2500.50', new Date().toISOString().split('T')[0], '3000', 'A', 'Institutional Floor', 'Long term hold'],
        ['HDFCBANK', '25', '1450.00', new Date().toISOString().split('T')[0], '1800', 'B', 'Momentum Ceiling', 'Accumulating at support']
      ];
      fileName = 'MarketBeacon_Open_Trades_Template.csv';
    } else {
      headers = ['Symbol', 'Quantity', 'Open Price', 'Open Date', 'Close Price', 'Close Date', 'Strategy', 'Notes'];
      sampleData = [
        ['TCS', '5', '3800.00', '2026-05-10', '4150.00', '2026-05-18', 'Institutional Floor', 'Target hit'],
        ['INFY', '15', '1600.00', '2026-04-20', '1750.00', '2026-05-15', 'Velocity Retest', 'Profit booked']
      ];
      fileName = 'MarketBeacon_Closed_History_Template.csv';
    }
    
    const csvContent = [headers.join(','), ...sampleData.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.click();
  };

  const handleExportTrades = () => {
    const headers = ['Symbol', 'Quantity', 'Open Price', 'Open Date', 'Objective Price', 'Level', 'Close Price', 'Close Date', 'Strategy', 'Status', 'Notes'];
    const rows = trades.map(t => [
      t.symbol, t.quantity, t.entry_price, t.entry_date, t.target_price, t.level, t.exit_price || '', t.exit_date || '', t.strategy, t.status, t.notes || ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MarketBeacon_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleShareTrade = (trade: TradeRecord & { pnlPer?: number; pnl?: number; days?: number }) => {
    const isClosed = trade.status === 'CLOSED';
    const text = isClosed 
      ? `✅ *Trade Booked: ${trade.symbol}*
📈 Yield: ${trade.pnlPer.toFixed(2)}% (+₹${Math.abs(trade.pnl).toLocaleString()})
⚡️ Strategy: ${trade.strategy}
📅 Duration: ${trade.days} Days

#MarketBeacon #ResearchSuccess #InstitutionalMatrix`
      : `🔥 *Research Tracking: ${trade.symbol}*
⚡️ Strategy: ${trade.strategy}
🎯 Objective: ₹${trade.target_price || '-'}
📊 Live ROI: ${trade.pnlPer.toFixed(2)}%

#MarketBeacon #LiveResearch #TradingTerminal`;

    navigator.clipboard.writeText(text);
    toast(`${trade.symbol} details copied! Ready to post.`);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        try {
          const rawRows = results.data as string[][];
          const headerIdx = rawRows.findIndex(r => r.some(c => ['stock', 'symbol', 'instrument'].includes(String(c).toLowerCase().trim())));
          if (headerIdx === -1) { 
            toast("No valid header found. Ensure your CSV has a column named 'Symbol' or 'Stock'."); 
            setIsImporting(false); 
            return; 
          }
          
          const headerRow = rawRows[headerIdx].map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''));
          const dataRows = rawRows.slice(headerIdx + 1);
          const tradesToImport = dataRows.map((row) => {
            const findVal = (keywords: string[]) => {
              const colIdx = headerRow.findIndex(h => keywords.some(kw => h.includes(kw)));
              return colIdx !== -1 ? row[colIdx] : null;
            };
            const symbol = findVal(['symbol', 'stock', 'instrument']);
            const buyPrice = findVal(['buyprice', 'buyrate', 'avg', 'cost', 'entryprice']);
            const qty = findVal(['qty', 'quantity', 'units']);
            const rawBuyDate = findVal(['buydate', 'entrydate', 'date']);
            const sellPrice = findVal(['sellprice', 'exitprice', 'cmp']);
            const rawSellDate = findVal(['selldate', 'exitdate']);
            const status = findVal(['status', 'type', 'state']);

            if (!symbol || !buyPrice || !qty || String(symbol).toLowerCase().includes('total')) return null;

            const formatDate = (raw: unknown) => {
              if (!raw) return new Date().toISOString().split('T')[0];
              const d = new Date(raw as string | number);
              return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
            };

            const buyDate = formatDate(rawBuyDate);
            const sellDate = rawSellDate ? formatDate(rawSellDate) : null;
            const tradeStatus = (sellDate || (status && String(status).toLowerCase().includes('booked'))) ? 'CLOSED' : 'OPEN';

            return {
              symbol: String(symbol).toUpperCase().trim(),
              entry_price: parseFloat(String(buyPrice).replace(/[^0-9.]/g, '')),
              quantity: parseInt(String(qty).replace(/[^0-9]/g, '')),
              target_price: parseFloat(String(findVal(['target', 'objective']) || '0')) || 0,
              level: findVal(['level']) || 'A',
              entry_date: buyDate,
              exit_date: sellDate,
              exit_price: sellPrice ? parseFloat(String(sellPrice).replace(/[^0-9.]/g, '')) : null,
              status: tradeStatus,
              strategy: findVal(['strategy']) || 'CSV Import',
              notes: findVal(['notes', 'remark']) || ''
            };
          }).filter((t) => t && t.symbol && t.entry_price > 0);

          if (tradesToImport.length === 0) { 
            toast("No valid trades detected. Check column names like 'Symbol', 'Open Price', and 'Qty'."); 
            setIsImporting(false); 
            return; 
          }

          const res = await authFetch('/api/trades/batch', {
            method: 'POST',
            body: JSON.stringify({ trades: tradesToImport })
          });

          const data = await safeJsonParse(res);
          if (res.ok && !data.error) {
            toast(`Import Successful!`);
            fetchTrades();
          } else { 
            toast("Server Error: " + (data.error || "Failed to save trades.")); 
          }
        } catch (err: unknown) { 
          toast("Processing Error: " + (err instanceof Error ? err.message : 'Unknown error')); 
        } finally { 
          setIsImporting(false); 
          if (fileInputRef.current) fileInputRef.current.value = ''; 
        }
      }
    });
  };

  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrade.symbol) return;
    const entryPrice = parseFloat(newTrade.entry_price);
    const payload = { 
      ...newTrade, 
      entry_price: entryPrice, 
      quantity: parseInt(newTrade.quantity), 
      target_price: newTrade.target_price ? parseFloat(newTrade.target_price) : (entryPrice * 1.25),
      stop_loss: newTrade.stop_loss ? parseFloat(newTrade.stop_loss) : null
    };
    try {
      const res = await authFetch('/api/trades', { method: 'POST', body: JSON.stringify(payload) });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) { 
        setShowAddModal(false); 
        setNewTrade({ symbol: '', entry_price: '', quantity: '', target_price: '', stop_loss: '', level: 'A', entry_date: new Date().toISOString().split('T')[0], strategy: STRATEGIES[0].name, notes: '' }); 
        setSymbolSearch(''); 
        fetchTrades(); 
      }
    } catch (e) { console.error(e); }
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch(`/api/trades/${showCloseModal.id}/close`, {
        method: 'POST',
        body: JSON.stringify({ exit_price: parseFloat(closeTradeData.exit_price), exit_date: new Date().toISOString().split('T')[0], quantity_to_close: parseInt(closeTradeData.quantity_to_close), notes: closeTradeData.notes })
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) { setShowCloseModal(null); fetchTrades(); }
    } catch (e) { console.error(e); }
  };

  const SortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="h-2 w-2 ml-1 opacity-20" />;
    return <ArrowUpDown className={`h-2 w-2 ml-1 ${sortConfig.direction === 'asc' ? 'text-blue-400' : 'text-[var(--text-tertiary)]'}`} />;
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[var(--border-primary)] border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 py-6 px-4 md:px-8 lg:px-10 space-y-6 overflow-hidden font-sans bg-[#f8fafc]">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-primary)] pb-6 gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/10 w-fit rounded-lg border border-blue-500/20 mb-3"><BookOpen className="h-3 w-3 text-blue-400" /><span className="text-xs font-bold text-blue-400 uppercase tracking-wider leading-none">Journal</span></div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter italic uppercase leading-none">Trade Ledger</h1>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">Institutional Order Execution Audit</p>
        </div>
        <div className="flex items-center space-x-3">
           <div className="flex items-center space-x-2 ml-4">
              <button onClick={() => handleDownloadTemplate('OPEN')} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-muted)] rounded-2xl shadow-sm hover:bg-blue-500/10 hover:text-blue-400 transition-all flex items-center space-x-2" title="Download Template for Open Trades"><Download className="h-4 w-4" /><span className="text-caption">Tpl (Open)</span></button>
              <button onClick={() => handleDownloadTemplate('CLOSED')} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-muted)] rounded-2xl shadow-sm hover:bg-indigo-500/10 hover:text-indigo-400 transition-all flex items-center space-x-2" title="Download Template for Closed History"><Download className="h-4 w-4" /><span className="text-caption">Tpl (Closed)</span></button>
              <button onClick={handleExportTrades} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-muted)] rounded-2xl shadow-sm hover:bg-emerald-500/10 hover:text-emerald-400 transition-all flex items-center space-x-2" title="Export Your Trades"><Download className="h-4 w-4" /><span className="text-caption">Export</span></button>
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-muted)] rounded-2xl shadow-sm hover:bg-[var(--bg-secondary)] flex items-center space-x-2"><Upload className={`h-4 w-4 ${isImporting ? 'animate-bounce' : ''}`} /><span className="text-caption">Import</span></button>
              <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-caption shadow-lg shadow-blue-500/20 flex items-center space-x-2 hover:from-blue-500 hover:to-indigo-500"><Plus className="h-4 w-4" /><span>Record</span></button>
           </div>
        </div>
      </div>

      {/* 2. Institutional Performance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
         <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 border border-[var(--border-primary)] shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl -mr-8 -mt-8" />
            <div className="flex items-center justify-between mb-3">
               <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none">Total Exposure</span>
               <Wallet className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">₹{summaryStats.totalBuyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
            <p className="text-caption text-[var(--text-muted)] uppercase tracking-wider mt-1">Capital in Play</p>
         </div>

         <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 border border-[var(--border-primary)] shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
               <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none">
                  {activeSegment === 'OPEN' ? 'Running Yield (Live)' : 'Net Segment Yield'}
               </span>
               <TrendingUp className={`h-3.5 w-3.5 ${summaryStats.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
            </div>
            <div className="flex items-end space-x-2">
               <h3 className={`text-2xl font-bold ${summaryStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-600'}`}>
                  {summaryStats.totalPnl >= 0 ? '+' : '-'}{summaryStats.totalPnlPer.toFixed(2)}%
               </h3>
               <span className={`text-xs font-bold uppercase mb-1 ${summaryStats.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {summaryStats.totalPnl >= 0 ? '+' : '-'}₹{Math.abs(summaryStats.totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
               </span>
            </div>
            <p className="text-caption text-[var(--text-muted)] uppercase tracking-wider mt-1">
               {summaryStats.totalPnl >= 0 ? 'Net Gain' : 'Net Loss'}: ₹{Math.abs(summaryStats.totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
         </div>

         <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 border border-[var(--border-primary)] shadow-sm group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
               <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none">Avg. Velocity</span>
               <Clock className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">{summaryStats.avgDays.toFixed(1)} Days</h3>
            <p className="text-caption text-[var(--text-muted)] uppercase tracking-wider mt-1">Holding Duration</p>
         </div>

         <div className="bg-[var(--bg-tertiary)] rounded-3xl p-6 text-[var(--text-primary)] shadow-xl shadow-[var(--border-primary)] group hover:scale-[1.02] transition-all">
            <div className="flex items-center justify-between mb-3">
               <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none">Annual Projection</span>
               <Activity className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">{summaryStats.avgAnnualGain.toFixed(0)}%</h3>
            <p className="text-caption text-blue-400 uppercase tracking-wider mt-1">12-Strategy Alpha</p>
         </div>
      </div>

      <div className="flex items-center justify-between shrink-0">
         <div className="flex items-center space-x-4">
            <button onClick={() => { setActiveSegment('OPEN'); setSelectedIds([]); }} className={`px-8 py-3 rounded-2xl text-caption transition-all ${activeSegment === 'OPEN' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>Open Positions</button>
            <button onClick={() => { setActiveSegment('CLOSED'); setSelectedIds([]); }} className={`px-8 py-3 rounded-2xl text-caption transition-all ${activeSegment === 'CLOSED' ? 'bg-blue-600 text-white shadow-xl' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>Closed History</button>
         </div>
         {selectedIds.length > 0 && <button onClick={handleBulkDelete} className="flex items-center space-x-2 px-6 py-3 bg-rose-500/10 text-rose-400 rounded-2xl text-caption border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all"><Trash2 className="h-3 w-3" /><span>Delete ({selectedIds.length})</span></button>}
      </div>

      <div className="hidden md:flex flex-1 flex flex-col min-h-0 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border-primary)] shadow-xl overflow-hidden relative">
         <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-[var(--bg-secondary)] text-caption text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-primary)] sticky top-0 z-10">
                     <th className="px-6 py-4 w-10"><button onClick={() => { if (selectedIds.length === processedTrades.length) setSelectedIds([]); else setSelectedIds(processedTrades.map(t => t.id)); }} className="text-[var(--text-tertiary)]">{selectedIds.length === processedTrades.length && processedTrades.length > 0 ? <CheckSquare className="h-4 w-4 text-blue-400" /> : <Square className="h-4 w-4" />}</button></th>
                     <th className="px-4 py-4 cursor-pointer" onClick={() => handleSort('symbol')}>Instrument {SortIcon('symbol')}</th>
                     {activeSegment === 'OPEN' ? (
                       <>
                         <th className="px-4 py-4 cursor-pointer" onClick={() => handleSort('entry_date')}>Open {SortIcon('entry_date')}</th>
                         <th className="px-4 py-4 text-center">Qty</th>
                         <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('level')}>Level {SortIcon('level')}</th>
                         <th className="px-4 py-4 text-right">Avg Price</th>
                         <th className="px-4 py-4 text-right text-blue-400">CMP</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('pnl')}>Gain Amt {SortIcon('pnl')}</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('pnlPer')}>Yield % {SortIcon('pnlPer')}</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('gap')}>Objective/Gap {SortIcon('gap')}</th>
                       </>
                     ) : (
                       <>
                         <th className="px-4 py-4 cursor-pointer" onClick={() => handleSort('entry_date')}>Open Date {SortIcon('entry_date')}</th>
                         <th className="px-4 py-4 text-center">Qty</th>
                         <th className="px-4 py-4 text-right">Open Price</th>
                         <th className="px-4 py-4 cursor-pointer" onClick={() => handleSort('exit_date')}>Close Date {SortIcon('exit_date')}</th>
                         <th className="px-4 py-4 text-right">Close Price</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('pnl')}>Net Gain {SortIcon('pnl')}</th>
                         <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('days')}>Days {SortIcon('days')}</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('pnlPer')}>% Gain {SortIcon('pnlPer')}</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('annualGain')}>% Annual {SortIcon('annualGain')}</th>
                       </>
                     )}
                     <th className="px-6 py-4 text-center">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[var(--border-primary)] text-xs font-bold">
                  {processedTrades.map((t) => (
                      <tr key={t.id} className={`hover:bg-[var(--bg-secondary)] transition-colors group ${selectedIds.includes(t.id) ? 'bg-blue-500/10' : ''}`}>
                         <td className="px-6 py-3"><button onClick={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])} className={selectedIds.includes(t.id) ? 'text-blue-400' : 'text-[var(--text-tertiary)]'}>{selectedIds.includes(t.id) ? <CheckSquare className="h-4 w-4 text-blue-400" /> : <Square className="h-4 w-4" />}</button></td>
                         <td className="px-4 py-3">
                            <div className="flex flex-col uppercase tracking-tighter relative group/item">
                               <div className="flex items-center space-x-2">
                                  <span className="text-[var(--text-primary)] font-bold">{t.symbol}</span>
                                  <button onClick={() => handleShareTrade(t)} className="opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-tertiary)]" title="Share Trade"><Share2 className="h-2.5 w-2.5" /></button>
                               </div>
                               <span className="text-xs text-[var(--text-tertiary)]">{t.strategy}</span>
                            </div>
                         </td>
                         {activeSegment === 'OPEN' ? (
                           <>
                             <td className="px-4 py-3 text-[var(--text-muted)] font-bold">{t.entry_date}</td>
                             <td className="px-4 py-3 text-center text-[var(--text-primary)]">{t.quantity}</td>
                             <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-lg text-caption border ${t.level === 'A' ? 'bg-blue-600 text-white' : t.level === 'B' ? 'bg-amber-600 text-white' : t.level === 'C' ? 'bg-indigo-600 text-white' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)]'}`}>{t.level}</span></td>
                             <td className="px-4 py-3 text-right text-[var(--text-secondary)]">₹{t.entry_price.toLocaleString()}</td>
                             <td className="px-4 py-3 text-right font-bold text-blue-400">₹{t.cmp.toLocaleString()}</td>
                             <td className={`${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} px-4 py-3 text-right`}>₹{Math.abs(t.pnl).toLocaleString()}</td>
                             <td className={`${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} px-4 py-3 text-right`}>{t.pnl >= 0 ? '+' : ''}{t.pnlPer.toFixed(2)}%</td>
                             <td className="px-4 py-3 text-right"><div className="flex flex-col items-end"><span className="text-[var(--text-muted)]">₹{t.targetVal.toLocaleString()}</span><span className={`${t.gap > 0 ? 'text-orange-400' : 'text-emerald-400'} text-xs`}>{t.gap > 0 ? `${t.gap.toFixed(1)}% Gap` : 'OBJ REACHED'}</span></div></td>
                           </>
                         ) : (
                           <>
                             <td className="px-4 py-3 text-[var(--text-muted)] font-bold">{t.entry_date}</td>
                             <td className="px-4 py-3 text-center text-[var(--text-primary)]">{t.quantity}</td>
                             <td className="px-4 py-3 text-right text-[var(--text-secondary)]">₹{t.entry_price.toLocaleString()}</td>
                             <td className="px-4 py-3 text-right text-[var(--text-muted)] font-bold">{t.exit_date}</td>
                             <td className="px-4 py-3 text-right text-[var(--text-primary)]">₹{t.exit_price?.toLocaleString() || '-'}</td>
                             <td className={`${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} px-4 py-3 text-right font-bold`}>₹{Math.abs(t.pnl).toLocaleString()}</td>
                             <td className="px-4 py-3 text-center text-[var(--text-muted)]">{t.days}</td>
                             <td className={`${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} px-4 py-3 text-right`}>{t.pnl >= 0 ? '+' : ''}{t.pnlPer.toFixed(2)}%</td>
                             <td className={`${t.annualGain >= 0 ? 'text-blue-400' : 'text-rose-400'} px-4 py-3 text-right`}>{t.annualGain >= 0 ? '+' : ''}{t.annualGain.toFixed(0)}%</td>
                           </>
                         )}
                         <td className="px-6 py-3 text-center"><div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">{activeSegment === 'OPEN' ? <button onClick={() => { setCloseTradeData({ exit_price: String(t.cmp), quantity_to_close: String(t.quantity), notes: 'Target Hit' }); setShowCloseModal(t); }} className="p-1 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle2 className="h-3.5 w-3.5" /></button> : <button onClick={() => { if(window.confirm('Re-open?')) { authFetch(`/api/trades/${t.id}/reopen`, { method: 'PATCH' }).then(res => res.ok && fetchTrades()); } }} className="p-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all"><RotateCcw className="h-3.5 w-3.5" /></button>} <button onClick={() => { if(window.confirm('Delete?')) { authFetch(`/api/trades/${t.id}`, { method: 'DELETE' }).then(res => res.ok && fetchTrades()); } }} className="p-1 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] rounded hover:bg-red-600 hover:text-white transition-all"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                      </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Mobile Positions / History Card List */}
      <div className="md:hidden space-y-3 px-2 flex-1 overflow-auto py-2 custom-scrollbar">
         {processedTrades.map((t) => {
            const isGain = t.pnl >= 0;
            return (
              <div 
                 key={t.id} 
                 className="bg-[var(--bg-secondary)] rounded-[1.25rem] border border-[var(--border-primary)]/80 shadow-md shadow-[var(--bg-primary)] p-4 space-y-3 animate-in fade-in duration-250"
              >
                 {/* Card Header */}
                 <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                       <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight font-mono uppercase">{t.symbol}</span>
                          {activeSegment === 'OPEN' && (
                             <span className={`px-1.5 py-0.5 rounded-[0.25rem] text-[6.5px] font-bold border tracking-wider leading-none ${
                                t.level === 'A' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                t.level === 'B' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                t.level === 'C' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-secondary)]'
                             }`}>
                                L-{t.level}
                             </span>
                          )}
                       </div>
                       <span className="text-[7.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{t.strategy}</span>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                       <span className={`text-sm font-bold font-mono ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ₹{Math.abs(t.pnl).toLocaleString()}
                       </span>
                       <span className={`text-[8.5px] font-bold font-mono mt-0.5 ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isGain ? '+' : ''}{t.pnlPer.toFixed(2)}%
                       </span>
                    </div>
                 </div>

                 {/* Metrics Grid */}
                 <div className="grid grid-cols-2 gap-2 bg-[var(--bg-secondary)]/50 p-3 rounded-[0.75rem] border border-[var(--border-primary)]/50 text-xs font-semibold text-[var(--text-secondary)]">
                    {activeSegment === 'OPEN' ? (
                       <>
                          <div className="flex justify-between">
                             <span className="text-[var(--text-muted)] uppercase text-caption tracking-wider">Qty:</span>
                             <span className="font-bold font-mono text-[var(--text-primary)]">{t.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[var(--text-muted)] uppercase text-caption tracking-wider">Avg Price:</span>
                             <span className="font-bold font-mono text-[var(--text-primary)]">₹{t.entry_price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[var(--text-muted)] uppercase text-caption tracking-wider">CMP:</span>
                             <span className="font-bold font-mono text-blue-400">₹{t.cmp.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[var(--text-muted)] uppercase text-caption tracking-wider">Objective:</span>
                             <span className="font-bold font-mono text-[var(--text-primary)]">₹{t.targetVal.toLocaleString()}</span>
                          </div>
                       </>
                    ) : (
                       <>
                          <div className="flex justify-between">
                             <span className="text-[var(--text-muted)] uppercase text-caption tracking-wider">Qty:</span>
                             <span className="font-bold font-mono text-[var(--text-primary)]">{t.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[var(--text-muted)] uppercase text-caption tracking-wider">Hold Days:</span>
                             <span className="font-bold font-mono text-[var(--text-primary)]">{t.days} Days</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[var(--text-muted)] uppercase text-caption tracking-wider">Open Price:</span>
                             <span className="font-bold font-mono text-[var(--text-primary)]">₹{t.entry_price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[var(--text-muted)] uppercase text-caption tracking-wider">Close Price:</span>
                             <span className="font-bold font-mono text-[var(--text-primary)]">₹{t.exit_price?.toLocaleString() || '-'}</span>
                          </div>
                       </>
                    )}
                 </div>

                 {/* Date & Actions row */}
                 <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
                    <div>
                       {activeSegment === 'OPEN' ? (
                          <span>Opened: <strong className="text-[var(--text-secondary)]">{t.entry_date}</strong></span>
                       ) : (
                          <span>Period: <strong className="text-[var(--text-secondary)]">{t.entry_date} - {t.exit_date}</strong></span>
                       )}
                    </div>
                    
                    <div className="flex items-center space-x-1.5">
                       <button 
                          onClick={() => handleShareTrade(t)} 
                          className="p-1.5 bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-tertiary)]"
                       >
                          <Share2 className="h-3.5 w-3.5" />
                       </button>

                       {activeSegment === 'OPEN' ? (
                          <button 
                             onClick={() => { setCloseTradeData({ exit_price: String(t.cmp), quantity_to_close: String(t.quantity), notes: 'Target Hit' }); setShowCloseModal(t); }} 
                             className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[8.5px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-emerald-600 hover:text-white"
                          >
                             <CheckCircle2 className="h-3 w-3" /> Close
                          </button>
                       ) : (
                          <button 
onClick={() => { if(window.confirm('Re-open?')) { authFetch(`/api/trades/${t.id}/reopen`, { method: 'PATCH' }).then(res => res.ok && fetchTrades()); } }}
                              className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white"
                           >
                              <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                       )}

                       <button 
onClick={() => { if(window.confirm('Delete?')) { authFetch(`/api/trades/${t.id}`, { method: 'DELETE' }).then(res => res.ok && fetchTrades()); } }}
                          className="p-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-600 hover:text-white"
                        >
                           <Trash2 className="h-3.5 w-3.5" />
                       </button>
                    </div>
                 </div>
              </div>
            );
         })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[var(--bg-primary)]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[var(--bg-secondary)] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)]/30">
                <div className="space-y-1">
                   <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tighter italic">New Research Note</h3>
                   <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Add Stock to Ledger</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-all"><X className="h-6 w-6" /></button>
             </div>
             
             <form onSubmit={handleAddTrade} className="p-8 space-y-6 text-left max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                   <div className="col-span-2 relative">
                      <label className="text-caption text-[var(--text-muted)] uppercase tracking-wider ml-1 mb-2 block">Instrument Symbol</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. RELIANCE"
                        value={symbolSearch} 
                        onChange={(e) => { 
                          const val = e.target.value.toUpperCase(); 
                          setSymbolSearch(val); 
                          setNewTrade(prev => ({...prev, symbol: val})); 
                        }} 
                        className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner" 
                      />
                   </div>
                   
                   <div>
<label className="text-caption text-[var(--text-muted)] uppercase tracking-wider ml-1 mb-2 block">Open Price</label>
                       <input 
                         type="number" 
                         step="0.05" 
                         required 
                         placeholder="0.00"
                        value={newTrade.entry_price} 
                        onChange={(e) => setNewTrade({...newTrade, entry_price: e.target.value})} 
                        className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner" 
                      />
                   </div>
                   
                   <div>
                      <label className="text-caption text-[var(--text-muted)] uppercase tracking-wider ml-1 mb-2 block">Quantity</label>
                      <input 
                        type="number" 
                        required 
                        placeholder="0"
                        value={newTrade.quantity} 
                        onChange={(e) => setNewTrade({...newTrade, quantity: e.target.value})} 
                        className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner" 
                      />
                   </div>

                   <div>
                      <label className="text-caption text-[var(--text-muted)] uppercase tracking-wider ml-1 mb-2 block">Objective Price (Optional)</label>
                      <input 
                        type="number" 
                        step="0.05" 
                        placeholder="Defaults to Open * 1.25"
                        value={newTrade.target_price} 
                        onChange={(e) => setNewTrade({...newTrade, target_price: e.target.value})} 
                        className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner" 
                      />
                   </div>

                   <div>
                      <label className="text-caption text-[var(--text-muted)] uppercase tracking-wider ml-1 mb-2 block">Risk Guard (Optional)</label>
                      <input 
                        type="number" 
                        step="0.05" 
                        placeholder="Risk Guard level"
                        value={newTrade.stop_loss} 
                        onChange={(e) => setNewTrade({...newTrade, stop_loss: e.target.value})} 
                        className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner" 
                      />
                   </div>

                   <div>
                      <label className="text-caption text-[var(--text-muted)] uppercase tracking-wider ml-1 mb-2 block">Open Level</label>
                      <select 
                        value={newTrade.level} 
                        onChange={(e) => setNewTrade({...newTrade, level: e.target.value})} 
                        className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold appearance-none focus:border-blue-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner"
                      >
                         <option value="A">Level A (Primary)</option>
                         <option value="B">Level B (Secondary)</option>
                         <option value="C">Level C (Tertiary)</option>
                         <option value="D">Level D (Objective Zone)</option>
                      </select>
                   </div>

                   <div>
                      <label className="text-caption text-[var(--text-muted)] uppercase tracking-wider ml-1 mb-2 block">Open Date</label>
                      <input 
                        type="date" 
                        required
                        value={newTrade.entry_date} 
                        onChange={(e) => setNewTrade({...newTrade, entry_date: e.target.value})} 
                        className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner" 
                      />
                   </div>
                   
                   <div className="col-span-2">
                      <label className="text-caption text-[var(--text-muted)] uppercase tracking-wider ml-1 mb-2 block">Matrix Strategy</label>
                      <select 
                        value={newTrade.strategy} 
                        onChange={(e) => setNewTrade({...newTrade, strategy: e.target.value})} 
                        className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold appearance-none focus:border-blue-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner"
                      >
                         {STRATEGIES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                   </div>

                   <div className="col-span-2">
                      <label className="text-caption text-[var(--text-muted)] uppercase tracking-wider ml-1 mb-2 block">Transaction Notes</label>
                      <textarea 
                        placeholder="Log strategy details, logic parameters, or observations..."
                        value={newTrade.notes} 
                        onChange={(e) => setNewTrade({...newTrade, notes: e.target.value})} 
                        rows={3}
                        className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner font-sans resize-none" 
                      />
                   </div>
                </div>
                
                <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] text-xs font-bold uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all active:scale-95 hover:from-blue-500 hover:to-indigo-500 mt-4">
                   Commit to Ledger
                </button>
             </form>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[var(--bg-primary)]/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-[var(--bg-secondary)] w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
              <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase italic mb-6">Realize Research: {showCloseModal.symbol}</h3>
              <form onSubmit={handleConfirmClose} className="space-y-6 text-left">
                 <div>
                    <label className="text-caption text-[var(--text-muted)] uppercase ml-1 mb-2 block">Close Level</label>
                    <input type="number" step="0.05" required value={closeTradeData.exit_price} onChange={(e) => setCloseTradeData({...closeTradeData, exit_price: e.target.value})} className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-emerald-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner" />
                 </div>
                 <div>
                    <label className="text-caption text-[var(--text-muted)] uppercase ml-1 mb-2 block">Quantity to Close</label>
                    <input type="number" required value={closeTradeData.quantity_to_close} onChange={(e) => setCloseTradeData({...closeTradeData, quantity_to_close: e.target.value})} className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] rounded-2xl px-6 py-4 text-sm font-bold focus:border-emerald-600 focus:bg-[var(--bg-secondary)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none shadow-inner" />
                 </div>
                 <div className="flex space-x-3 mt-8">
                    <button type="button" onClick={() => setShowCloseModal(null)} className="flex-1 py-4 bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded-2xl text-xs font-bold uppercase hover:bg-slate-200 transition-all">Cancel</button>
                    <button type="submit" className="flex-[2] py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl text-xs font-bold uppercase shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 transition-all active:scale-95">Verify & Close</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isImporting && (
        <div className="fixed inset-0 z-[300] bg-[var(--bg-primary)]/95 backdrop-blur-xl flex items-center justify-center flex-col space-y-4">
           <div className="w-12 h-12 border-4 border-[var(--border-primary)] border-t-blue-500 rounded-full animate-spin" />
           <p className="text-[var(--text-primary)] text-xs font-bold uppercase tracking-[0.4em] animate-pulse">Auditing Spreadsheet Integrity...</p>
        </div>
      )}
    </div>
  );
};

export default TradeJournalPage;
