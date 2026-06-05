import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, User, Store, Menu, Search, Bell, Command, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BASKETS } from '../../data/stocks';

import { safeJsonParse, getApiUrl } from '../../lib/api-utils';

const API_URL = getApiUrl();

// Build a flat list of unique stocks for search
const ALL_STOCKS = Array.from(new Set(Object.values(BASKETS).flat())).sort();

interface TopNavProps {
  onMenuClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
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
      {/* Left: Menu & Market Pulse */}
      <div className="flex items-center space-x-6 shrink-0">
        <button 
          onClick={onMenuClick}
          className="p-2.5 -ml-2 text-slate-500 hover:text-slate-900 md:hidden hover:bg-slate-50 rounded-xl transition-all"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-3 group cursor-default">
          <div className="bg-slate-950 p-2.5 rounded-xl text-white shadow-lg shadow-slate-950/20 group-hover:scale-105 transition-transform duration-500">
            <Activity className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <div className="flex items-center space-x-2">
               <span className="text-[11px] font-black text-slate-950 uppercase tracking-tighter leading-none italic">Institutional Pulse</span>
               <div className={`w-2 h-2 rounded-full ${marketStatus === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            </div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{marketStatus} Mode</span>
          </div>
        </div>
      </div>

      {/* Center: Smart Search Dropdown (Desktop Only) */}
      <div className="hidden lg:flex flex-1 max-w-xl mx-12 relative">
        <form onSubmit={handleSearch} className="w-full relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Smart Search (e.g. RELAXO, TCS)..." 
            className="w-full bg-slate-50 border-2 border-transparent py-3 pl-12 pr-16 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-950 outline-none focus:bg-white focus:border-blue-500/20 focus:shadow-xl focus:shadow-blue-500/5 transition-all"
            value={searchQuery}
            onChange={onSearchChange}
            onFocus={() => searchQuery.length >= 1 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md pointer-events-none opacity-50">
            <Command className="h-2.5 w-2.5 text-slate-500" />
            <span className="text-[8px] font-black text-slate-500">K</span>
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-slate-50 bg-slate-50/50">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Institutional Match</span>
            </div>
            <div className="max-h-80 overflow-y-auto no-scrollbar">
              {suggestions.map((sym) => (
                <button
                  key={sym}
                  onClick={() => selectStock(sym)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-blue-50 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:border-blue-200 transition-all">
                       <Zap className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-slate-900 tracking-tighter">{sym}</span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Asset Node</span>
                    </div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
        {/* Indices Bar (Sleeker version) */}
        <div className="hidden xl:flex items-center space-x-8 pr-6 border-r border-slate-100">
           {Array.isArray(indices) && indices.slice(0, 2).map((idx) => (
             <div key={idx.name} className="flex flex-col">
                <div className="flex items-center space-x-3">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{idx.name}</span>
                   <span className={`text-[11px] font-black font-mono ${idx.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {idx.price.toLocaleString()}
                   </span>
                </div>
             </div>
           ))}
        </div>

        <button className="relative p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all hidden sm:flex">
          <Bell className="h-5 w-5" />
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
        </button>

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
