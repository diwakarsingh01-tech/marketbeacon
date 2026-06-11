import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo';
import { 
  Zap, 
  Briefcase, 
  BookOpen,
  Store,
  ShieldCheck,
  Terminal,
  LayoutGrid,
  ChevronRight,
  TrendingUp,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'admin';

  const sections = [
    {
      title: 'Institutional Core',
      items: [
        { icon: LayoutGrid, label: 'Alpha Hub', path: '/alpha-hub', desc: 'Main Terminal', tag: 'USP' },
        { icon: Zap, label: 'Screener', path: '/screener', desc: 'Real-time Matrix' },
      ]
    },
    {
      title: 'Portfolio Desk',
      items: [
        { icon: Briefcase, label: 'Manager', path: '/portfolio', desc: 'Wealth Tracking' },
        { icon: BookOpen, label: 'Journal', path: '/trades', desc: 'Verified Ledger' },
        {icon: Store, label: 'License Desk', path: '/license-desk', desc: 'Subscription Desk' },
      ]
    },
    {
      title: 'System Access',
      items: [
        { icon: ShieldCheck, label: 'Education', path: '/education', desc: 'SOP Guides' },
      ]
    }
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-[110] w-64 bg-slate-950 flex flex-col shrink-0 border-r border-white/[0.03] shadow-2xl 
      transform transition-all duration-500 ease-in-out h-screen
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `} tabIndex={-1} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      
      {/* Brand Identity */}
      <div className="p-6 pb-8 border-b border-white/[0.03] flex items-center justify-between">
        <BrandLogo variant="dark" size={30} hideText={false} />
        <div className="md:hidden">
           <button onClick={onClose} className="outline-none p-3 text-slate-500 hover:text-white transition-all rounded-xl bg-white/5 border border-white/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none">
              <ChevronRight className="h-4 w-4 rotate-180" />
           </button>
        </div>
      </div>

      {/* Navigation Matrix */}
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto no-scrollbar">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <div className="px-5 flex items-center justify-between mb-2">
               <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">{section.title}</h3>
            </div>
            
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center group px-5 py-3 transition-all duration-300 relative outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600/15 to-transparent text-white border-l-[4px] border-blue-500' 
                      : 'text-slate-500 hover:text-white hover:bg-white/[0.02] border-l-[4px] border-transparent hover:translate-x-1'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-2 rounded-xl mr-3.5 transition-all duration-300 border ${
                        isActive 
                          ? 'bg-blue-600/20 text-blue-400 border-blue-500/30 shadow-md shadow-blue-500/5' 
                          : 'bg-slate-900/40 text-slate-500 border-slate-850/50 group-hover:text-blue-400 group-hover:bg-slate-900 group-hover:border-slate-800'
                      }`}>
                         <item.icon className={`h-4 w-4 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:rotate-6'}`} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                           <span className="text-[11px] font-black uppercase tracking-widest leading-none">{item.label}</span>
                           {item.tag && (
                             <span className="bg-blue-500 text-[7px] font-black text-white px-1.5 py-0.5 rounded uppercase leading-none tracking-widest shadow-lg shadow-blue-600/20">
                                {item.tag}
                             </span>
                           )}
                        </div>
                        <span className={`text-[8.5px] font-bold uppercase tracking-tighter mt-1 ${isActive ? 'text-blue-400/80' : 'text-slate-600'}`}>{item.desc}</span>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* Telegram Community Button */}
        <div className="px-3 pt-4">
           <a 
             href="https://t.me/Marketbeconpro" 
             target="_blank" 
             rel="noopener noreferrer"
             className="outline-none flex flex-col p-4 bg-gradient-to-br from-blue-600/10 to-indigo-600/5 hover:from-blue-600/15 hover:to-indigo-600/10 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl group transition-all shadow-md relative overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative z-10">
               <div className="p-1.5 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400 group-hover:scale-105 transition-transform">
                  <TrendingUp className="h-3.5 w-3.5" />
               </div>
               <span className="bg-emerald-500/15 border border-emerald-500/30 text-[7px] font-black text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Join Live</span>
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-wider relative z-10">Alpha Community</span>
            <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest mt-1 relative z-10 group-hover:text-blue-400 transition-colors">Real-time alerts</span>
          </a>
        </div>

        {isAdmin && (
          <div className="pt-4 border-t border-white/[0.03]">
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center px-5 py-4 transition-all duration-300 relative group outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600/15 to-transparent text-white border-l-[4px] border-blue-500' 
                  : 'text-blue-400 border-l-[4px] border-transparent hover:translate-x-1'}
              `}
            >
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl mr-3.5 text-blue-400 group-hover:scale-110 transition-transform">
                 <Terminal className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest">Admin Control</span>
                <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-500">Command Center</span>
              </div>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Sidebar Footer: Connectivity Info */}
      <div className="p-6 mt-auto border-t border-white/[0.03] space-y-4 bg-slate-950/20">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-1.5">
               <Link to="/profile" onClick={onClose} className="outline-none p-3 text-slate-500 hover:text-white transition-all rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none" title="Settings">
                  <Settings className="h-4 w-4" />
               </Link>
               <Link to="/education" onClick={onClose} className="outline-none p-3 text-slate-500 hover:text-white transition-all rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none" title="Help">
                 <HelpCircle className="h-4 w-4" />
              </Link>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Link Protocol</span>
              <div className="flex items-center gap-1.5">
                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Node</span>
              </div>
           </div>
        </div>
        
        <div className="text-center">
           <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">MB-PRO v18.0.8 SECURE</p>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
