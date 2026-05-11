import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, LogOut, User, Store, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopNavProps {
  onMenuClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-[100] shadow-sm">
      {/* Menu Toggle & Brand Indicator */}
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
