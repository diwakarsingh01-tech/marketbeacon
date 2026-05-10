import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Zap, 
  Globe, 
  Briefcase, 
  BookOpen,
  Store,
  BarChart3, 
  Settings,
  ShieldCheck,
  History as HistoryIcon,
  Activity
} from 'lucide-react';

const SideNav: React.FC = () => {
  const navItems = [
    { icon: Zap, label: 'Screener', path: '/screener', desc: 'Signal Discovery' },
    { icon: Globe, label: 'Market Watch', path: '/market', desc: 'Universe Scan' },
    { icon: Briefcase, label: 'My Portfolio', path: '/portfolio', desc: 'Wealth Manager' },
    { icon: BookOpen, label: 'Trade Journal', path: '/journal', desc: 'Order Ledger' },
    { icon: Store, label: 'Marketplace', path: '/marketplace', desc: 'Premium Alpha' },
    { icon: HistoryIcon, label: 'Performance Lab', path: '/backtest', desc: 'Backtest Engine' }
  ];

  return (
    <aside className="w-72 bg-slate-900 h-screen flex flex-col shrink-0 border-r border-slate-800 shadow-2xl relative z-[110]">
      {/* Brand Header */}
      <div className="p-8 pb-12">
        <div className="flex items-center space-x-3 group cursor-default">
          <div className="bg-blue-600 p-2 rounded-2xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase italic text-white leading-none">MarketBeacon</span>
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em] mt-1 ml-0.5">Terminal Pro</span>
          </div>
        </div>
      </div>

      {/* Main Nav Links */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all group relative
              ${isActive 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                  <span className={`text-[8px] font-bold uppercase tracking-tighter ${isActive ? 'text-blue-100' : 'text-slate-600'}`}>{item.desc}</span>
                </div>
                {isActive && (
                   <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="p-6 space-y-6">
         <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400">
               <ShieldCheck className="h-3 w-3" />
               <span className="text-[9px] font-black uppercase tracking-widest leading-none">System Secure</span>
            </div>
            <p className="text-[8px] font-medium text-slate-500 leading-relaxed uppercase">Institutional Data Flow Active. Batch 9 Algorithm Verified.</p>
         </div>

         <div className="flex items-center justify-between px-2">
            <NavLink 
              to="/profile" 
              className={({ isActive }) => `p-2 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:text-white'}`}
            >
               <Settings className="h-4 w-4" />
            </NavLink>
            <div className="flex flex-col items-end">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Version</span>
               <span className="text-[10px] font-bold text-slate-300">3.5.0-PRO</span>
            </div>
         </div>
      </div>
    </aside>
  );
};

export default SideNav;
