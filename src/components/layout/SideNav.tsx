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
  CreditCard,
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
        { icon: LayoutGrid, label: 'Alpha Hub', path: '/alpha-hub', desc: 'Main Terminal', tag: 'Alpha' },
        { icon: Zap, label: 'Screener', path: '/screener', desc: 'Real-time Matrix' },
      ]
    },
    {
      title: 'Portfolio Desk',
      items: [
        { icon: Briefcase, label: 'Manager', path: '/portfolio', desc: 'Wealth Tracking' },
        { icon: BookOpen, label: 'Journal', path: '/trades', desc: 'Verified Ledger' },
        { icon: Store, label: 'Marketplace', path: '/marketplace', desc: 'Membership & Node Licenses' },
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
      fixed inset-y-0 left-0 z-[110] w-64 bg-slate-ink flex flex-col shrink-0 border-r border-white/5 shadow-2xl 
      transform transition-all duration-500 ease-in-out h-screen
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `} style={{ backgroundColor: 'var(--slate-ink)' }}>
      
      {/* Brand Identity */}
      <div className="p-8 pb-12 flex items-center justify-between">
        <BrandLogo variant="dark" size={32} hideText={false} />
        <div className="md:hidden">
           <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
              <ChevronRight className="h-5 w-5 rotate-180" />
           </button>
        </div>
      </div>

      {/* Navigation Matrix */}
      <nav className="flex-1 px-4 space-y-10 overflow-y-auto no-scrollbar">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <div className="px-5 flex items-center justify-between mb-4">
               <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">{section.title}</h3>
               <div className="h-px flex-1 bg-white/5 ml-4" />
            </div>
            
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center group px-5 py-3.5 rounded-2xl transition-all relative
                    ${isActive 
                      ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`h-4.5 w-4.5 mr-4 transition-all duration-300 ${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-blue-400 group-hover:rotate-6'}`} />
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                           <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                           {item.tag && (
                             <span className="bg-blue-600 text-[6px] font-black text-white px-1.5 py-0.5 rounded uppercase leading-none shadow-lg shadow-blue-600/20">
                                {item.tag}
                             </span>
                           )}
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-tighter mt-0.5 ${isActive ? 'text-blue-400/80' : 'text-slate-600'}`}>{item.desc}</span>
                      </div>
                      
                      {isActive && (
                        <div className="absolute right-4 h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {isAdmin && (
          <div className="pt-4 border-t border-white/5">
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center px-5 py-4 rounded-2xl transition-all border
                ${isActive 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-slate-900/50 text-blue-400 border-blue-500/20 hover:border-blue-500/40'}
              `}
            >
              <Terminal className="h-4.5 w-4.5 mr-4" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest">Admin Node</span>
                <span className="text-[8px] font-bold uppercase tracking-tighter opacity-60">Authorized Only</span>
              </div>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Sidebar Footer: Connectivity Info */}
      <div className="p-6 mt-auto border-t border-white/5 space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center space-x-4">
              <Link to="/profile" onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                 <Settings className="h-4 w-4" />
              </Link>
              <Link to="/education" onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                 <HelpCircle className="h-4 w-4" />
              </Link>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Environment</span>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Live Secure</span>
           </div>
        </div>
        
        <div className="text-center">
           <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">v14.0 Institutional</p>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
