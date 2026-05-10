import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Zap, RefreshCw, LogOut, User, Store, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface TopNavProps {
  onMenuClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [marketStatus, setMarketStatus] = useState('LIVE');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [indices, setIndices] = useState<any[]>([]);

  const fetchIndices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/market-indices`);
      if (res.ok) {
        const data = await res.json();
        setIndices(data.results || []);
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
    <nav className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-[100] shadow-sm">
      {/* Menu Toggle & Market Pulse Ticker */}
      <div className="flex items-center space-x-3 md:space-x-8 overflow-hidden">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <Activity className="h-4 w-4 text-emerald-600 animate-pulse" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none italic">Market Pulse</span>
            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Live Trading Window</span>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-100 shrink-0 hidden md:block" />

        {/* Dynamic Indices - Scrollable on mobile */}
        <div className="flex items-center space-x-8 overflow-x-auto no-scrollbar pr-4">
           {Array.isArray(indices) && indices.map((idx) => (
             <div key={idx.symbol} className="flex flex-col shrink-0">
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{idx.name}</span>
                   <span className={`text-[10px] font-black ${idx.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {idx.price.toLocaleString()}
                   </span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                   <span className={`text-[8px] font-bold ${idx.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.changePercent).toFixed(2)}%
                   </span>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
        <Link to="/marketplace" className="flex items-center space-x-2 bg-blue-600/10 px-3 md:px-4 py-2 rounded-2xl border border-blue-600/20 group hover:bg-blue-600 transition-all">
           <Store className="h-3 w-3 text-blue-600 group-hover:text-white transition-colors" />
           <span className="text-[9px] font-black text-blue-600 group-hover:text-white uppercase tracking-widest transition-colors hidden sm:inline">Marketplace</span>
        </Link>

        <div className="h-8 w-px bg-slate-100 hidden sm:block" />

        <div className="relative">
          {user ? (
            <>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-1 pr-3 bg-slate-900 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all shadow-xl group"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                   {user?.name?.[0].toUpperCase()}
                </div>
                <div className="flex flex-col items-start hidden sm:flex">
                   <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{user?.name}</span>
                   <span className="text-[7px] font-bold text-blue-400 uppercase tracking-widest mt-1">Institutional</span>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100] animate-in slide-in-from-top-2 duration-200">
                   <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-all group">
                      <User className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest">My Profile</span>
                   </Link>
                   <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-all group text-left">
                      <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-600" />
                      <span className="text-xs font-black text-slate-600 uppercase tracking-widest group-hover:text-red-600">Logout</span>
                   </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-3">
               <Link to="/login" className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 transition-colors">Login</Link>
               <Link to="/register" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Join</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
