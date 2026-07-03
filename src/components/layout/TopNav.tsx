import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, User, Menu, Search, Bell, Command, ChevronRight, Zap, TrendingUp, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BASKETS } from '../../data/stocks';
import BrandLogo from '../brand/BrandLogo';
import { AnimatePresence, motion } from 'framer-motion';
import { WHATSAPP_BASE } from '../../lib/constants';

import type { Notification, IndexResult, StockSearchResult } from '../../types';
import { safeJsonParse, getApiUrl } from '../../lib/api-utils';

const API_URL = getApiUrl();

// Build a flat list of unique stocks for search
const ALL_STOCKS = Array.from(new Set(Object.values(BASKETS).flat())).sort();

const COMPANY_NAMES: Record<string, string> = {
  'TCS': 'Tata Consultancy Services Ltd',
  'INFY': 'Infosys Limited',
  'HDFCBANK': 'HDFC Bank Limited',
  'ICICIBANK': 'ICICI Bank Limited',
  'RELIANCE': 'Reliance Industries Ltd',
  'KOTAKBANK': 'Kotak Mahindra Bank Ltd',
  'AXISBANK': 'Axis Bank Limited',
  'SBIN': 'State Bank of India',
  'LT': 'Larsen & Toubro Limited',
  'ITC': 'ITC Limited',
  'HINDUNILVR': 'Hindustan Unilever Ltd',
  'ASIANPAINT': 'Asian Paints Limited',
  'TITAN': 'Titan Company Limited',
  'BAJFINANCE': 'Bajaj Finance Limited',
  'BAJAJFINSV': 'Bajaj Finserv Limited',
  'BHARTIARTL': 'Bharti Airtel Limited',
  'M&M': 'Mahindra & Mahindra Ltd',
  'MARUTI': 'Maruti Suzuki India Ltd',
  'SUNPHARMA': 'Sun Pharmaceutical Industries',
  'DRREDDY': 'Dr. Reddys Laboratories',
  'CIPLA': 'Cipla Limited',
  'ULTRACEMCO': 'UltraTech Cement Ltd',
  'NESTLEIND': 'Nestle India Limited',
  'BRITANNIA': 'Britannia Industries Ltd',
  'JSWSTEEL': 'JSW Steel Limited',
  'TATASTEEL': 'Tata Steel Limited',
  'NTPC': 'NTPC Limited',
  'ONGC': 'Oil & Natural Gas Corp Ltd',
  'POWERGRID': 'Power Grid Corp of India',
  'COALINDIA': 'Coal India Limited',
  'PIDILITIND': 'Pidilite Industries Ltd',
  'HAVELLS': 'Havells India Limited',
  'EICHERMOT': 'Eicher Motors Limited'
};

interface TopNavProps {
  onMenuClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('mb_token')}` }
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) setNotifications(data || []);
    } catch (e) { console.error('Notifications fetch failed'); }
  }, []);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('mb_token')}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: 0 } : n));
      }
    } catch (e) { }
  };
  const [indices, setIndices] = useState<IndexResult[]>([]);
  const [marketStatus, setMarketStatus] = useState('CLOSED');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      navigate(`/stock/${searchQuery.toUpperCase()}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, []);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${API_URL}/api/search/stock?q=${encodeURIComponent(val)}`, { signal: controller.signal });
          clearTimeout(timeout);
          const data = await safeJsonParse(res);
          if (res.ok && data?.results) {
            setSuggestions(data.results.slice(0, 8));
            setShowSuggestions(true);
            return;
          }
        } catch {}
        // Fallback: local filter if API fails
        const local = ALL_STOCKS.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
        if (local.length > 0) {
          setSuggestions(local.map(s => ({ symbol: s, baskets: [], strategies: [], price: 0, change: 0, peMedians: {} })));
          setShowSuggestions(true);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectStock = (sym: string) => {
    navigate(`/stock/${sym}`);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const basketColors: Record<string, string> = {
    'Elite Basket': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Quality Basket': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Growth Basket': 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  const fetchIndices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/market-indices`);
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        setIndices(data.results || []);
        setMarketStatus(data.status || 'CLOSED');
      }
    } catch (e) {
      console.error('Failed to fetch indices');
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, [fetchIndices]);

  const getTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <nav className="h-20 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-primary)] flex items-center justify-between px-4 md:px-10 sticky top-0 z-[100] shadow-sm transition-all duration-300">
      {/* Left: Menu (Mobile) & Market Pulse Status (Desktop) */}
      <div className="flex items-center space-x-4 shrink-0">
        <button 
          onClick={onMenuClick}
          className="p-2.5 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] md:hidden hover:bg-[var(--bg-tertiary)] rounded-xl transition-all"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile-only Brand Logo */}
        <div className="flex items-center md:hidden">
          <Link to="/app" className="transition-all hover:opacity-90 active:scale-95">
            <BrandLogo variant="light" size={26} hideText={true} />
          </Link>
        </div>

        {/* Desktop-only Pulse Status */}
        <div className="hidden md:flex flex-col h-8 justify-center">
          <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none">Pulse Status</span>
             <div className={`w-1.5 h-1.5 rounded-full ${marketStatus === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{marketStatus} Mode</span>
        </div>
      </div>

      {/* Center: Smart Search Dropdown (Desktop Only) */}
      <div className="hidden lg:flex flex-1 max-w-3xl mx-8 relative">
        <form onSubmit={handleSearch} className="w-full relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Smart Search (e.g. RELAXO, TCS)..." 
             className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] py-3.5 pl-12 pr-16 rounded-2xl text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none hover:border-blue-500/40 focus:bg-[var(--bg-elevated)] focus:border-blue-500/40 focus:shadow-2xl focus:shadow-black/50 transition-all duration-300"
            value={searchQuery}
            onChange={onSearchChange}
            onFocus={() => searchQuery.length >= 1 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-md pointer-events-none opacity-50 shadow-sm">
            <Command className="h-2.5 w-2.5 text-[var(--text-tertiary)]" />
            <span className="text-[10px] font-bold text-[var(--text-tertiary)]">K</span>
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2.5 bg-[var(--bg-primary)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[var(--border-primary)] overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] flex justify-between items-center">
               <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2">Institutional Match</span>
               <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider px-2">Press Enter</span>
            </div>
            <div className="max-h-80 overflow-y-auto overflow-x-hidden no-scrollbar p-1.5 space-y-0.5">
              {suggestions.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => selectStock(stock.symbol)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[var(--bg-secondary)] rounded-xl transition-all group text-left border border-transparent hover:border-[var(--border-primary)]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] group-hover:bg-[var(--bg-primary)] group-hover:border-blue-500/30 transition-all shrink-0">
                       <Zap className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-[var(--text-primary)] tracking-tighter leading-none">{stock.symbol}</span>
                       <span className="flex flex-wrap gap-1 mt-1">
                         {stock.baskets?.map((b: string) => (
                            <span key={b} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${basketColors[b] || 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-secondary)]'}`}>
                             {b.replace(' Basket', '')}
                           </span>
                         ))}
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    {stock.strategies?.slice(0, 2).map((s) => (
                      <span key={s.id} className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        {s.id.slice(0, 8)}
                      </span>
                    ))}
                    <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              ))}
                </div>
              </div>
            )}
          </div>

      {/* Right: Actions & User */}
      <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
        {/* Indices Bar (Sleeker version) */}
        <div className="hidden xl:flex items-center space-x-8 pr-6 border-r border-[var(--border-primary)]">
           {Array.isArray(indices) && indices.slice(0, 2).map((idx) => {
             const athDiff = idx.ath && idx.price ? ((idx.ath - idx.price) / idx.ath) * 100 : 0;
             return (
              <div key={idx.name} className="flex flex-col items-start space-y-1">
                 <div className="flex items-center space-x-3">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none">{idx.name}</span>
                    <span className={`text-[11px] font-black font-mono leading-none ${idx.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                       {idx.price ? idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </span>
                 </div>
                 {idx.ath > 0 && athDiff > 0 && (
                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block leading-none">
                     ▼ {athDiff.toFixed(2)}% from High (ATH: {idx.ath.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                   </span>
                 )}
              </div>
             );
           })}
        </div>
        {/* Mobile Search Trigger Button */}
        <button 
          onClick={() => setShowMobileSearch(true)}
          className="p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] lg:hidden hover:bg-[var(--bg-tertiary)] rounded-xl transition-all"
          title="Search Stocks"
        >
          <Search className="h-5 w-5" />
        </button>

        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={`relative p-2.5 rounded-xl transition-all flex ${showNotifications ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
          >
            <Bell className={`h-5 w-5 ${notifications.some(n => n.unread) ? 'animate-[ring_2s_ease-in-out_infinite]' : ''}`} />
            <AnimatePresence>
            {notifications.some(n => n.unread) && (
              <motion.div 
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" 
              />
            )}
            </AnimatePresence>
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
          {showNotifications && (
            <motion.div 
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-[var(--bg-primary)] rounded-[1.8rem] shadow-2xl border border-[var(--border-primary)] p-3 z-[110] max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:w-auto"
            >
               <div className="px-4 py-3 border-b border-[var(--border-primary)] flex items-center justify-between mb-2">
                   <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">System Alerts</span>
                  {notifications.some(n => n.unread) && (
                    <button 
                      onClick={() => {
                        notifications.forEach(n => {
                          if (n.unread) markAsRead(n.id);
                        });
                      }}
                       className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto no-scrollbar space-y-1">
                  {notifications.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 text-center flex flex-col items-center space-y-3"
                    >
                       <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                          <Bell className="h-5 w-5 text-slate-200" />
                       </div>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">No New Alerts</span>
                    </motion.div>
                  ) : (
                    notifications.map((n, i) => (
                      <motion.div 
                        key={n.id} 
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03, ease: 'easeOut' }}
                        onClick={() => n.unread && markAsRead(n.id)}
                        className={`p-3 rounded-2xl flex items-start gap-3 transition-all hover:bg-[var(--bg-tertiary)] relative cursor-pointer ${n.unread ? 'bg-blue-50/20' : ''}`}
                      >
                       <AnimatePresence>
                       {n.unread && (
                         <motion.div 
                           key="unread-dot"
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           exit={{ scale: 0, opacity: 0 }}
                           transition={{ duration: 0.2 }}
                           className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute top-5 right-4" 
                         />
                       )}
                       </AnimatePresence>
                       <div className={`p-2 rounded-xl mt-0.5 ${
                         n.type === 'signal' ? 'bg-blue-50 text-blue-600' :
                         n.type === 'audit' ? 'bg-amber-50 text-amber-600' :
                         n.type === 'target' ? 'bg-emerald-50 text-emerald-600' :
                         'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                       }`}>
                         {n.type === 'signal' ? <Zap className="h-3.5 w-3.5" /> :
                          n.type === 'audit' ? <ShieldCheck className="h-3.5 w-3.5" /> :
                          n.type === 'target' ? <TrendingUp className="h-3.5 w-3.5" /> :
                          <Activity className="h-3.5 w-3.5" />}
                       </div>
                       <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-bold text-[var(--text-primary)] tracking-tight leading-none mb-1">{n.title}</p>
                          <p className="text-[11px] font-medium text-[var(--text-muted)] leading-relaxed break-words">{n.message}</p>
                           <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1 block">{getTimeAgo(n.created_at || n.timestamp)}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
             </motion.div>
           )}
           </AnimatePresence>
         </div>

        <a 
          href={WHATSAPP_BASE} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-[var(--text-primary)] rounded-xl transition-all shadow-sm border border-emerald-100 flex items-center space-x-2 group"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 group-hover:scale-110 transition-transform">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider hidden lg:inline">WhatsApp</span>
        </a>
        <a 
          href="https://t.me/asktoceo" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-[var(--text-primary)] rounded-xl transition-all shadow-sm border border-blue-100 flex items-center space-x-2 group"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 group-hover:scale-110 transition-transform">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider hidden lg:inline">Join Community</span>
        </a>

        <div className="relative">
          {user ? (
            <>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-1.5 pr-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-all rounded-[1.2rem] group border border-[var(--border-primary)]"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-[var(--text-primary)] font-black text-xs shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                   {user?.name?.[0].toUpperCase()}
                </div>
                <div className="flex flex-col items-start hidden sm:flex">
                    <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider leading-none">{user?.name}</span>
                   <div className="flex items-center space-x-1.5 mt-1">
                       <div className={`w-1.5 h-1.5 rounded-full ${user?.tier === 'alpha' ? 'bg-blue-400 animate-pulse' : 'bg-slate-400'}`} />
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{user?.tier || 'Free'} Node</span>
                   </div>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-[var(--bg-primary)] rounded-[1.8rem] shadow-2xl border border-[var(--border-primary)] p-2.5 z-[100] animate-in zoom-in-95 duration-200">
                   <div className="px-4 py-3 border-b border-[var(--border-primary)] mb-1">
                       <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Account Identity</p>
                       <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.email}</p>
                   </div>
                   <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] rounded-2xl transition-all group">
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                         <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">My Profile</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-300" />
                   </Link>
                   <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-rose-50 rounded-2xl transition-all group text-left">
                      <LogOut className="h-4 w-4 text-slate-400 group-hover:text-rose-600" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider group-hover:text-rose-600">Logout Terminal</span>
                   </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-4">
               <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-slate-950 transition-colors">Login</Link>
               <Link to="/login" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text-primary)] rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">Launch</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="absolute inset-0 bg-[var(--bg-primary)]/95 backdrop-blur-md z-[120] flex flex-col p-4 animate-in fade-in slide-in-from-top duration-300" tabIndex={-1} onKeyDown={(e) => e.key === 'Escape' && setShowMobileSearch(false)}>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search stock..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] py-3 pl-11 pr-4 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus:border-[var(--border-secondary)] focus:bg-[var(--bg-primary)] transition-all shadow-inner"
                value={searchQuery}
                onChange={onSearchChange}
              />
            </form>
            <button 
              onClick={() => {
                setShowMobileSearch(false);
                setSearchQuery('');
                setSuggestions([]);
              }}
              className="p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Suggestions List in mobile view */}
          {suggestions.length > 0 && (
            <div className="mt-3 bg-[var(--bg-primary)] border border-[var(--border-primary)]/85 rounded-2xl shadow-2xl overflow-y-auto max-h-[70vh] p-1.5 space-y-0.5 z-[130] animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="p-2.5 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50 flex justify-between items-center rounded-t-xl">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Match Suggestions</span>
              </div>
              {suggestions.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    selectStock(stock.symbol);
                    setShowMobileSearch(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--bg-tertiary)] rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] shrink-0">
                       <Zap className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[var(--text-primary)] tracking-tighter leading-none">{stock.symbol}</span>
                       <span className="flex flex-wrap gap-1 mt-1">
                         {stock.baskets?.map((b: string) => (
                            <span key={b} className={`text-[8px] font-bold px-1 py-0.5 rounded-sm border ${basketColors[b] || 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-secondary)]'}`}>
                             {b.replace(' Basket', '')}
                           </span>
                         ))}
                       </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {stock.strategies?.slice(0, 1).map((s) => (
                      <span key={s.id} className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                        {s.id.slice(0, 8)}
                      </span>
                    ))}
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default TopNav;
