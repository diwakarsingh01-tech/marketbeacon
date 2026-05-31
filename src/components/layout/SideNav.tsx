import React from 'react';
import { NavLink } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo';
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
  Activity,
  Terminal,
  CreditCard,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'admin';

  const eliteItems = [
    { icon: LayoutGrid, label: 'Alpha-40 Hub', path: '/alpha-hub', desc: 'Institutional Basket', tag: 'PRO' },
    { icon: Zap, label: 'Signal Discovery', path: '/screener', desc: 'Active Opportunities' },
    { icon: Store, label: 'Marketplace', path: '/marketplace', desc: 'Hardened Strategies' },
  ];

  const tradeItems = [
    { icon: BookOpen, label: 'Trade Journal', path: '/trades', desc: 'Order Ledger' },
    { icon: Briefcase, label: 'My Portfolio', path: '/portfolio', desc: 'Wealth Manager' },
  ];

  const resourceItems = [
    { icon: ShieldCheck, label: 'Education', path: '/education', desc: 'Strategy Guides' },
    { icon: CreditCard, label: 'Membership', path: '/membership', desc: 'Billing & Access' },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-[110] w-72 bg-slate-900 flex flex-col shrink-0 border-r border-slate-800 shadow-2xl 
      transform transition-transform duration-300 ease-in-out h-screen
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}>
      {/* Brand Header */}
      <div className="p-8 pb-10">
        <BrandLogo variant="dark" size={40} />
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
        
        {/* SECTION 1: ELITE ACCESS */}
        <div className="space-y-2">
           <h3 className="px-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Elite Access</h3>
           {eliteItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center space-x-4 px-6 py-3.5 rounded-2xl transition-all group relative
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                       {item.tag && (
                         <span className="bg-emerald-500 text-[7px] font-black text-white px-1.5 py-0.5 rounded-md leading-none shadow-sm animate-pulse">
                            {item.tag}
                         </span>
                       )}
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-tighter ${isActive ? 'text-blue-100' : 'text-slate-600'}`}>{item.desc}</span>
                  </div>
                  {isActive && (
                    <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                  )}
                </>
              )}
            </NavLink>
           ))}
        </div>

        {/* SECTION 2: TRADING DESK */}
        <div className="space-y-2">
           <h3 className="px-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Trading Desk</h3>
           {tradeItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center space-x-4 px-6 py-3.5 rounded-2xl transition-all group relative
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                  <div className="flex flex-col flex-1">
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
        </div>

        {/* SECTION 3: RESOURCES */}
        <div className="space-y-2 pb-6">
           <h3 className="px-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Account & Insights</h3>
           {resourceItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center space-x-4 px-6 py-3.5 rounded-2xl transition-all group relative
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                  <div className="flex flex-col flex-1">
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

           {isAdmin && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center space-x-4 px-6 py-3.5 rounded-2xl transition-all group relative border border-blue-500/20 bg-blue-500/5 mt-4
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-xl' 
                  : 'text-blue-400 hover:text-white hover:bg-blue-600/10'}
              `}
            >
              <Terminal className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest">Admin Center</span>
                <span className="text-[8px] font-bold uppercase tracking-tighter opacity-70">Command Control</span>
              </div>
            </NavLink>
           )}
        </div>
      </nav>


      {/* Footer Section */}
      <div className="p-6 space-y-6 mt-auto">
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
              onClick={onClose}
              className={({ isActive }) => `p-2 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:text-white'}`}
            >
               <Settings className="h-4 w-4" />
            </NavLink>
            <div className="flex flex-col items-end">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Version</span>
               <span className="text-[10px] font-bold text-slate-300">3.5.1-PRO</span>            </div>
         </div>
      </div>
    </aside>
  );
};

export default SideNav;
