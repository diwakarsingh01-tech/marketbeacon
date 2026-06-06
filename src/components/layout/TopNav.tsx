import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, User, Store, Menu, Search, Bell, Command, ChevronRight, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BASKETS } from '../../data/stocks';
import BrandLogo from '../brand/BrandLogo';

import { safeJsonParse, getApiUrl } from '../../lib/api-utils';

const API_URL = getApiUrl();

// Build a flat list of unique stocks for search
const ALL_STOCKS = Array.from(new Set(Object.values(BASKETS).flat())).sort();

const COMPANY_NAMES: Record<string, string> = {
  RELAXO: 'Relaxo Footwears Limited',
  TCS: 'Tata Consultancy Services Limited',
  HDFCBANK: 'HDFC Bank Limited',
  INFY: 'Infosys Limited',
  ITC: 'ITC Limited',
  BAJAJ_AUTO: 'Bajaj Auto Limited',
  WIPRO: 'Wipro Limited',
  HCLTECH: 'HCL Technologies Limited',
  TITAN: 'Titan Company Limited',
  SANOFI: 'Sanofi India Limited',
  COLPAL: 'Colgate-Palmolive (India) Limited',
  DABUR: 'Dabur India Limited',
};

const SIMULATED_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Alpha Signal Triggered',
    message: 'RELAXO entered strict 5% Buy Zone (SMA-BCD Stacking). Entry: ₹854.50.',
    time: '2 mins ago',
    type: 'signal',
    unread: true
  },
  {
    id: 2,
    title: 'Audit Upgrade',
    message: 'HDFC BANK Batch-9 audit score upgraded from 82 to 90 (PASS).',
    time: '15 mins ago',
    type: 'audit',
    unread: true
  },
  {
    id: 3,
    title: 'Target Objective Met',
    message: 'TCS completed Cup & Handle breakout at ₹4,120. Net Yield: +15.4%.',
    time: '2 hours ago',
    type: 'target',
    unread: false
  },
  {
    id: 4,
    title: 'System Node Sync',
    message: 'Worker completed full scan of 336 symbols. Snapshot cache refreshed.',
    time: '4 hours ago',
    type: 'system',
    unread: false
  }
];

interface TopNavProps {
  onMenuClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(SIMULATED_NOTIFICATIONS);
  const [indices, setIndices] = useState<any[]>([]);
  const [marketStatus, setMarketStatus] = useState('CLOSED');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      navigate(`/stock/${searchQuery.toUpperCase()}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 1) {
      const filtered = ALL_STOCKS.filter(s => 
        s.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
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

  return (
    <nav className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-[100] shadow-sm transition-all duration-300">
      {/* Left: Menu (Mobile) & Market Pulse Status (Desktop) */}
      <div className="flex items-center space-x-4 shrink-0">
        <button 
          onClick={onMenuClick}
          className="p-2.5 -ml-2 text-slate-500 hover:text-slate-900 md:hidden hover:bg-slate-50 rounded-xl transition-all"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile-only Brand Logo */}
        <div className="flex items-center md:hidden">
          <Link to="/alpha-hub" className="transition-all hover:opacity-90 active:scale-95">
            <BrandLogo variant="light" size={26} hideText={true} />
          </Link>
        </div>

        {/* Desktop-only Pulse Status */}
        <div className="hidden md:flex flex-col h-8 justify-center">
          <div className="flex items-center space-x-2">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Pulse Status</span>
             <div className={`w-1.5 h-1.5 rounded-full ${marketStatus === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          </div>
          <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">{marketStatus} Mode</span>
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
            className="w-full bg-blue-50/5 border-2 border-blue-500/10 py-3.5 pl-12 pr-16 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-950 outline-none hover:border-blue-500/25 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/5 focus:shadow-2xl focus:shadow-blue-500/10 transition-all duration-300"
            value={searchQuery}
            onChange={onSearchChange}
            onFocus={() => searchQuery.length >= 1 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md pointer-events-none opacity-50 shadow-sm">
            <Command className="h-2.5 w-2.5 text-slate-500" />
            <span className="text-[8px] font-black text-slate-500">K</span>
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2.5 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100/80 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Institutional Match</span>
               <span className="text-[7px] font-bold text-slate-450 uppercase tracking-widest px-2">Press Enter</span>
            </div>
            <div className="max-h-80 overflow-y-auto overflow-x-hidden no-scrollbar p-1.5 space-y-0.5">
              {suggestions.map((sym) => {
                const fullName = COMPANY_NAMES[sym.toUpperCase()] || 'NSE Equity Asset';
                return (
                  <button
                    key={sym}
                    onClick={() => selectStock(sym)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-xl transition-all group text-left border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white group-hover:border-blue-200 transition-all shrink-0">
                         <Zap className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex flex-col min-w-0">
                         <span className="text-sm font-black text-slate-900 tracking-tighter leading-none">{sym}</span>
                         <span className="text-[8.5px] font-medium text-slate-400 truncate mt-1.5 uppercase tracking-wider">{fullName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="opacity-0 group-hover:opacity-100 text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md transition-all">Select Node</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
        {/* Indices Bar (Sleeker version) */}
        <div className="hidden xl:flex items-center space-x-8 pr-6 border-r border-slate-100">
           {Array.isArray(indices) && indices.slice(0, 2).map((idx) => {
             const athDiff = idx.ath && idx.price ? ((idx.ath - idx.price) / idx.ath) * 100 : 0;
             return (
              <div key={idx.name} className="flex flex-col items-start space-y-1">
                 <div className="flex items-center space-x-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{idx.name}</span>
                    <span className={`text-[11px] font-black font-mono leading-none ${idx.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                       {idx.price ? idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </span>
                 </div>
                 {idx.ath > 0 && athDiff > 0 && (
                   <span className="text-[7.5px] font-black text-rose-500 uppercase tracking-wider block leading-none">
                     ▼ {athDiff.toFixed(2)}% from High (ATH: {idx.ath.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                   </span>
                 )}
              </div>
             );
           })}
        </div>

        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={`relative p-2.5 rounded-xl transition-all hidden sm:flex ${showNotifications ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <Bell className="h-5 w-5" />
            {notifications.some(n => n.unread) && (
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-white rounded-[1.8rem] shadow-2xl border border-slate-100 p-3 z-[110] animate-in zoom-in-95 duration-200">
               <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Alerts</span>
                  {notifications.some(n => n.unread) && (
                    <button 
                      onClick={() => setNotifications(p => p.map(n => ({ ...n, unread: false })))}
                      className="text-[8px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest"
                    >
                      Mark all read
                    </button>
                  )}
               </div>
               <div className="max-h-80 overflow-y-auto no-scrollbar space-y-1">
                 {notifications.map((n) => (
                   <div 
                     key={n.id} 
                     className={`p-3 rounded-2xl flex items-start gap-3 transition-all hover:bg-slate-50 relative ${n.unread ? 'bg-blue-50/20' : ''}`}
                   >
                     {n.unread && (
                       <div className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute top-5 right-4" />
                     )}
                     <div className={`p-2 rounded-xl mt-0.5 ${
                       n.type === 'signal' ? 'bg-blue-50 text-blue-600' :
                       n.type === 'audit' ? 'bg-amber-50 text-amber-600' :
                       n.type === 'target' ? 'bg-emerald-50 text-emerald-600' :
                       'bg-slate-100 text-slate-500'
                     }`}>
                       {n.type === 'signal' ? <Zap className="h-3.5 w-3.5" /> :
                        n.type === 'audit' ? <ShieldCheck className="h-3.5 w-3.5" /> :
                        n.type === 'target' ? <TrendingUp className="h-3.5 w-3.5" /> :
                        <Activity className="h-3.5 w-3.5" />}
                     </div>
                     <div className="flex-1 min-w-0 pr-2">
                       <p className="text-[11px] font-black text-slate-900 tracking-tight leading-none mb-1">{n.title}</p>
                       <p className="text-[9px] font-medium text-slate-500 leading-relaxed break-words">{n.message}</p>
                       <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{n.time}</span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        <a 
          href="https://t.me/Marketbeconpro" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm border border-blue-100 flex items-center space-x-2 group"
        >
          <TrendingUp className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Join Community</span>
        </a>

        <div className="relative">
          {user ? (
            <>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-1.5 pr-4 bg-slate-ink hover:bg-slate-900 transition-all rounded-[1.2rem] group"
                style={{ backgroundColor: 'var(--slate-ink)' }}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                   {user?.name?.[0].toUpperCase()}
                </div>
                <div className="flex flex-col items-start hidden sm:flex">
                   <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{user?.name}</span>
                   <div className="flex items-center space-x-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${(user as any)?.tier === 'alpha' ? 'bg-blue-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{(user as any)?.tier || 'Free'} Node</span>
                   </div>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-[1.8rem] shadow-2xl border border-slate-100 p-2.5 z-[100] animate-in zoom-in-95 duration-200">
                   <div className="px-4 py-3 border-b border-slate-50 mb-1">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Identity</p>
                      <p className="text-xs font-black text-slate-900 truncate">{user?.email}</p>
                   </div>
                   <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-2xl transition-all group">
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                        <span className="text-xs font-black text-slate-600 uppercase tracking-widest">My Profile</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-300" />
                   </Link>
                   <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-rose-50 rounded-2xl transition-all group text-left">
                      <LogOut className="h-4 w-4 text-slate-400 group-hover:text-rose-600" />
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest group-hover:text-rose-600">Logout Terminal</span>
                   </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-4">
               <Link to="/login" className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-950 transition-colors">Login</Link>
               <Link to="/login" className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">Launch</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
