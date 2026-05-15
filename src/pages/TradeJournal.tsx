import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RotateCcw,
  History, 
  TrendingUp, 
  ArrowUpRight, 
  X,
  PlusCircle,
  FileSpreadsheet,
  Upload,
  ArrowUpDown,
  Square,
  CheckSquare,
  ShieldCheck
} from 'lucide-react';
import Papa from 'papaparse';
import { BASKETS, STRATEGIES } from '../data/stocks';

const API_URL = import.meta.env.VITE_API_URL || (window.location.protocol === 'https:' ? 'https://' + window.location.host : 'http://localhost:3001');

const TradeJournalPage: React.FC = () => {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState<any>(null);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'entry_date', direction: 'desc' });

  // Form State
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    entry_price: '',
    quantity: '',
    target_price: '',
    level: 'A',
    entry_date: new Date().toISOString().split('T')[0],
    strategy: STRATEGIES[0].name,
    notes: ''
  });

  // Close Form State
  const [closeTradeData, setCloseTradeData] = useState({
    exit_price: '',
    quantity_to_close: '',
    notes: 'Target Hit'
  });

  const allSymbols = useMemo(() => {
    const symbols = new Set<string>();
    Object.values(BASKETS).forEach(list => list.forEach(s => symbols.add(s)));
    return Array.from(symbols).sort();
  }, []);

  const filteredSearchSymbols = useMemo(() => {
    const query = symbolSearch.trim().toLowerCase();
    if (!query) return [];
    return allSymbols.filter(s => s.toLowerCase().includes(query)).slice(0, 10);
  }, [symbolSearch, allSymbols]);

  const fetchTrades = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      console.log(`[LEDGER] Fetching from ${API_URL}/api/trades`);
      const res = await fetch(`${API_URL}/api/trades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[LEDGER] Fetched ${data.length} trades`);
        setTrades(data);
        const symbolsToFetch = Array.from(new Set(data.filter((t:any) => t.status === 'OPEN').map((t:any) => t.symbol)));
        if (symbolsToFetch.length > 0) fetchLivePrices(symbolsToFetch as string[]);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchLivePrices = async (symbols: string[]) => {
    try {
      const res = await fetch(`${API_URL}/api/stocks?symbols=${symbols.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        const prices: any = {};
        data.forEach((s: any) => prices[s.symbol] = s.price);
        setLivePrices(prices);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

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
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedTrades = useMemo(() => {
    const tradeData = trades.filter(t => t.status === activeSegment).map(t => {
      const cmp = livePrices[t.symbol] || t.entry_price;
      const price = activeSegment === 'OPEN' ? cmp : (t.exit_price || t.entry_price);
      const invested = (Number(t.quantity) || 0) * (Number(t.entry_price) || 0);
      const currentVal = (Number(t.quantity) || 0) * (Number(price) || 0);
      const pnl = currentVal - invested;
      const pnlPer = invested > 0 ? (pnl / invested) * 100 : 0;
      const targetVal = t.target_price || (t.entry_price * 1.25);
      const gap = ((targetVal - cmp) / (cmp || 1)) * 100;
      
      const d1 = new Date(t.entry_date).getTime();
      const d2 = t.exit_date ? new Date(t.exit_date).getTime() : new Date().getTime();
      const days = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
      const annualGain = days > 0 ? (pnlPer / days * 365) : 0;

      return { ...t, cmp, price, invested, currentVal, pnl, pnlPer, targetVal, gap, days, annualGain };
    });

    if (sortConfig) {
      tradeData.sort((a: any, b: any) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return tradeData;
  }, [trades, activeSegment, livePrices, sortConfig]);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected records?`)) return;
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/trades/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchTrades();
      }
    } catch (e) { console.error(e); }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: false,
      skipEmptyLines: 'greedy',
      complete: async (results) => {
        const token = localStorage.getItem('mb_token');
        try {
          const rawRows = results.data as string[][];
          const headerIdx = rawRows.findIndex(r => r.some(c => ['stock', 'symbol', 'instrument'].includes(String(c).toLowerCase().trim())));

          if (headerIdx === -1) {
            alert("No valid trade header found (Needs 'Stock' or 'Symbol' column).");
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
            const buyPrice = findVal(['buyprice', 'buyrate', 'avg', 'cost']);
            const qty = findVal(['qty', 'quantity', 'units']);
            const rawBuyDate = findVal(['buydate', 'entrydate', 'date']);
            const sellPrice = findVal(['sellprice', 'exitprice', 'cmp']);
            const rawSellDate = findVal(['selldate', 'exitdate']);
            const status = findVal(['status', 'type', 'state']);

            if (!symbol || !buyPrice || !qty || String(symbol).toLowerCase().includes('total')) return null;

            const formatDate = (raw: any) => {
              if (!raw) return new Date().toISOString().split('T')[0];
              const d = new Date(raw);
              return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
            };

            const buyDate = formatDate(rawBuyDate);
            const sellDate = rawSellDate ? formatDate(rawSellDate) : null;
            const tradeStatus = (sellDate || (status && String(status).toLowerCase().includes('booked'))) ? 'CLOSED' : 'OPEN';

            return {
              symbol: String(symbol).toUpperCase().trim(),
              entry_price: parseFloat(String(buyPrice).replace(/[^0-9.]/g, '')),
              quantity: parseInt(String(qty).replace(/[^0-9]/g, '')),
              target_price: parseFloat(String(findVal(['target']) || '0')) || 0,
              level: findVal(['level']) || 'A',
              entry_date: buyDate,
              exit_date: sellDate,
              exit_price: sellPrice ? parseFloat(String(sellPrice).replace(/[^0-9.]/g, '')) : null,
              status: tradeStatus,
              strategy: findVal(['strategy']) || 'CSV Import',
              notes: findVal(['notes', 'remark']) || ''
            };
          }).filter((t: any) => t && t.symbol && t.entry_price > 0);

          if (tradesToImport.length === 0) {
            alert("No valid data found in the remaining rows.");
            setIsImporting(false);
            return;
          }

          const res = await fetch(`${API_URL}/api/trades/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ trades: tradesToImport })
          });

          if (res.ok) {
            const openCount = tradesToImport.filter(t => t.status === 'OPEN').length;
            const closedCount = tradesToImport.filter(t => t.status === 'CLOSED').length;
            alert(`Import Successful!\n- ${openCount} Open Trades\n- ${closedCount} Closed Trades`);
            fetchTrades();
          } else {
            const errData = await res.json().catch(() => ({}));
            alert(`Server Error: ${errData.error || 'Failed to save trades.'}`);
          }
        } catch (err) { 
          console.error(err);
          alert("Error processing file."); 
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
    const token = localStorage.getItem('mb_token');
    const entryPrice = parseFloat(newTrade.entry_price);
    const payload = { ...newTrade, entry_price: entryPrice, quantity: parseInt(newTrade.quantity), target_price: newTrade.target_price ? parseFloat(newTrade.target_price) : (entryPrice * 1.25) };
    try {
      const res = await fetch(`${API_URL}/api/trades`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      if (res.ok) { setShowAddModal(false); setNewTrade({ symbol: '', entry_price: '', quantity: '', target_price: '', level: 'A', entry_date: new Date().toISOString().split('T')[0], strategy: STRATEGIES[0].name, notes: '' }); setSymbolSearch(''); fetchTrades(); }
    } catch (e) { console.error(e); }
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/trades/${showCloseModal.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ exit_price: parseFloat(closeTradeData.exit_price), exit_date: new Date().toISOString().split('T')[0], quantity_to_close: parseInt(closeTradeData.quantity_to_close), notes: closeTradeData.notes })
      });
      if (res.ok) { setShowCloseModal(null); fetchTrades(); }
    } catch (e) { console.error(e); }
  };

  const handleReopenTrade = async (id: number) => {
    if (!window.confirm('Re-open?')) return;
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/trades/${id}/reopen`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) fetchTrades();
    } catch (e) { console.error(e); }
  };

  const handleDeleteTrade = async (id: number) => {
    if (!window.confirm('Delete?')) return;
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/trades/` + id, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) fetchTrades();
    } catch (e) { console.error(e); }
  };

  const SortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="h-2 w-2 ml-1 opacity-20" />;
    return <ArrowUpDown className={`h-2 w-2 ml-1 ${sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-slate-400'}`} />;
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 py-6 px-10 space-y-6 overflow-hidden font-sans bg-[#f8fafc]">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-6 gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/10 w-fit rounded-lg border border-blue-500/20 mb-3"><BookOpen className="h-3 w-3 text-blue-600" /><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Journal</span></div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Trade Ledger</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Order Execution Audit</p>
        </div>
        <div className="flex items-center space-x-3">
           <div className="flex flex-col items-end px-4 border-r border-slate-100 text-right"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Realized</span><h3 className={`text-xl font-black ${stats.totalRealized >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>₹{Math.abs(stats.totalRealized).toLocaleString()}</h3></div>
           <div className="flex flex-col items-end px-4 text-right"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Unrealized</span><h3 className={`text-xl font-black ${stats.totalUnrealized >= 0 ? 'text-blue-600' : 'text-red-600'}`}>₹{Math.abs(stats.totalUnrealized).toLocaleString()}</h3></div>
           <div className="flex items-center space-x-2 ml-4">
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCSVUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl shadow-sm hover:bg-slate-50 flex items-center space-x-2"><Upload className={`h-4 w-4 ${isImporting ? 'animate-bounce' : ''}`} /><span className="text-[10px] font-black uppercase tracking-widest">Import</span></button>
              <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Record</span></button>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between shrink-0">
         <div className="flex items-center space-x-4">
            <button onClick={() => { setActiveSegment('OPEN'); setSelectedIds([]); }} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSegment === 'OPEN' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'}`}>Open Positions</button>
            <button onClick={() => { setActiveSegment('CLOSED'); setSelectedIds([]); }} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSegment === 'CLOSED' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Closed History</button>
         </div>
         {selectedIds.length > 0 && <button onClick={handleBulkDelete} className="flex items-center space-x-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all"><Trash2 className="h-3 w-3" /><span>Delete ({selectedIds.length})</span></button>}
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden relative">
         <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                     <th className="px-6 py-4 w-10"><button onClick={() => { if (selectedIds.length === processedTrades.length) setSelectedIds([]); else setSelectedIds(processedTrades.map(t => t.id)); }} className="text-slate-300">{selectedIds.length === processedTrades.length && processedTrades.length > 0 ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}</button></th>
                     <th className="px-4 py-4 cursor-pointer" onClick={() => handleSort('symbol')}>Instrument {SortIcon('symbol')}</th>
                     {activeSegment === 'OPEN' ? (
                       <>
                         <th className="px-4 py-4 cursor-pointer" onClick={() => handleSort('entry_date')}>Entry {SortIcon('entry_date')}</th>
                         <th className="px-4 py-4 text-center">Qty</th>
                         <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('level')}>Level {SortIcon('level')}</th>
                         <th className="px-4 py-4 text-right">Avg Price</th>
                         <th className="px-4 py-4 text-right text-blue-600">CMP</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('pnl')}>P&L Amt {SortIcon('pnl')}</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('pnlPer')}>ROI % {SortIcon('pnlPer')}</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('gap')}>Target/Gap {SortIcon('gap')}</th>
                       </>
                     ) : (
                       <>
                         <th className="px-4 py-4 cursor-pointer" onClick={() => handleSort('entry_date')}>Buy Date {SortIcon('entry_date')}</th>
                         <th className="px-4 py-4 text-center">Qty</th>
                         <th className="px-4 py-4 text-right">Buy Price</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('exit_date')}>Sell Date {SortIcon('exit_date')}</th>
                         <th className="px-4 py-4 text-right">Sell Price</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('pnl')}>Gain {SortIcon('pnl')}</th>
                         <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('days')}>Days {SortIcon('days')}</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('pnlPer')}>% Gain {SortIcon('pnlPer')}</th>
                         <th className="px-4 py-4 text-right cursor-pointer" onClick={() => handleSort('annualGain')}>% Annual {SortIcon('annualGain')}</th>
                       </>
                     )}
                     <th className="px-6 py-4 text-center">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 text-[10px] font-black">
                  {processedTrades.map((t) => (
                      <tr key={t.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(t.id) ? 'bg-blue-50/50' : ''}`}>
                         <td className="px-6 py-3"><button onClick={() => setSelectedIds(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])} className={selectedIds.includes(t.id) ? 'text-blue-600' : 'text-slate-200'}>{selectedIds.includes(t.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}</button></td>
                         <td className="px-4 py-3"><div className="flex flex-col uppercase tracking-tighter"><span className="text-slate-900">{t.symbol}</span><span className="text-[7px] text-slate-400">{t.strategy}</span></div></td>
                         {activeSegment === 'OPEN' ? (
                           <>
                             <td className="px-4 py-3 text-slate-400 font-bold">{t.entry_date}</td>
                             <td className="px-4 py-3 text-center text-slate-900">{t.quantity}</td>
                             <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${t.level === 'A' ? 'bg-blue-600 text-white' : t.level === 'B' ? 'bg-amber-500 text-white' : t.level === 'C' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>{t.level}</span></td>
                             <td className="px-4 py-3 text-right text-slate-600">₹{t.entry_price.toLocaleString()}</td>
                             <td className="px-4 py-3 text-right font-black text-blue-600">₹{t.cmp.toLocaleString()}</td>
                             <td className={`${t.pnl >= 0 ? 'text-green-600' : 'text-red-600'} px-4 py-3 text-right`}>₹{Math.abs(t.pnl).toLocaleString()}</td>
                             <td className={`${t.pnl >= 0 ? 'text-green-600' : 'text-red-600'} px-4 py-3 text-right`}>{t.pnl >= 0 ? '+' : ''}{t.pnlPer.toFixed(2)}%</td>
                             <td className="px-4 py-3 text-right"><div className="flex flex-col items-end"><span className="text-slate-400">₹{t.targetVal.toLocaleString()}</span><span className={`${t.gap > 0 ? 'text-orange-500' : 'text-green-500'} text-[8px]`}>{t.gap > 0 ? `${t.gap.toFixed(1)}% Gap` : 'TARGET HIT'}</span></div></td>
                           </>
                         ) : (
                           <>
                             <td className="px-4 py-3 text-slate-400 font-bold">{t.entry_date}</td>
                             <td className="px-4 py-3 text-center text-slate-900">{t.quantity}</td>
                             <td className="px-4 py-3 text-right text-slate-600">₹{t.entry_price.toLocaleString()}</td>
                             <td className="px-4 py-3 text-right text-slate-400 font-bold">{t.exit_date}</td>
                             <td className="px-4 py-3 text-right text-slate-900">₹{t.exit_price?.toLocaleString() || '-'}</td>
                             <td className={`${t.pnl >= 0 ? 'text-green-600' : 'text-red-600'} px-4 py-3 text-right font-black`}>₹{Math.abs(t.pnl).toLocaleString()}</td>
                             <td className="px-4 py-3 text-center text-slate-500">{t.days}</td>
                             <td className={`${t.pnl >= 0 ? 'text-green-600' : 'text-red-600'} px-4 py-3 text-right`}>{t.pnl >= 0 ? '+' : ''}{t.pnlPer.toFixed(2)}%</td>
                             <td className={`${t.annualGain >= 0 ? 'text-blue-600' : 'text-red-600'} px-4 py-3 text-right`}>{t.annualGain >= 0 ? '+' : ''}{t.annualGain.toFixed(0)}%</td>
                           </>
                         )}
                         <td className="px-6 py-3 text-center"><div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">{activeSegment === 'OPEN' ? <button onClick={() => { setCloseTradeData({ exit_price: String(t.cmp), quantity_to_close: String(t.quantity), notes: 'Target Hit' }); setShowCloseModal(t); }} className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle2 className="h-3.5 w-3.5" /></button> : <button onClick={() => handleReopenTrade(t.id)} className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all"><RotateCcw className="h-3.5 w-3.5" /></button>} <button onClick={() => handleDeleteTrade(t.id)} className="p-1 bg-slate-50 text-slate-400 rounded hover:bg-red-600 hover:text-white transition-all"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                      </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {showAddModal && <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"><div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300"><div className="p-8 border-b border-slate-100 flex items-center justify-between"><h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">New Trade Entry</h3><button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button></div><form onSubmit={handleAddTrade} className="p-8 space-y-6 text-left"><div className="grid grid-cols-2 gap-x-6 gap-y-4"><div className="col-span-2 relative"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Instrument</label><input type="text" required value={symbolSearch} onChange={(e) => { const val = e.target.value.toUpperCase(); setSymbolSearch(val); setNewTrade(prev => ({...prev, symbol: val})); }} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-1 focus:ring-blue-500/20" /></div><div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Entry Price</label><input type="number" step="0.05" required value={newTrade.entry_price} onChange={(e) => setNewTrade({...newTrade, entry_price: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-1 focus:ring-blue-500/20" /></div><div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label><input type="number" required value={newTrade.quantity} onChange={(e) => setNewTrade({...newTrade, quantity: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-1 focus:ring-blue-500/20" /></div><div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategy</label><select value={newTrade.strategy} onChange={(e) => setNewTrade({...newTrade, strategy: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black appearance-none"><{STRATEGIES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}></select></div></div><button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl text-xs font-black uppercase tracking-widest mt-4 text-center">Confirm Trade Record</button></form></div></div>}

      {showCloseModal && <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"><div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300"><h3 className="text-xl font-black text-slate-900 uppercase italic mb-6">Realize Profit: {showCloseModal.symbol}</h3><form onSubmit={handleConfirmClose} className="space-y-6 text-left"><div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Exit Price</label><input type="number" step="0.05" required value={closeTradeData.exit_price} onChange={(e) => setCloseTradeData({...closeTradeData, exit_price: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-1 focus:ring-emerald-500/20" /></div><div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Quantity to Book</label><input type="number" required value={closeTradeData.quantity_to_close} onChange={(e) => setCloseTradeData({...closeTradeData, quantity_to_close: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black focus:ring-1 focus:ring-emerald-500/20" /></div><div className="flex space-x-3 mt-8"><button type="button" onClick={() => setShowCloseModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-xs font-black uppercase">Cancel</button><button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg">Confirm Booking</button></div></form></div></div>}

      {isImporting && <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center flex-col space-y-4"><div className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin" /><p className="text-white text-xs font-black uppercase tracking-[0.3em]">Auditing Spreadsheet Chunks...</p></div>}
    </div>
  );
};

export default TradeJournalPage;
