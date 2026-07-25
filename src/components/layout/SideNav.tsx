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
  Settings,
  HelpCircle,
  LineChart,
  Bot,
  FlaskConical,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_VERSION_DISPLAY } from '../../lib/version';

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const sections = [
    {
      title: 'Overview',
      items: [
        { icon: LayoutGrid, label: 'Launchpad', path: '/app', desc: 'Command Center', tag: 'HOME' },
      ]
    },
    {
      title: 'Investment Core',
      items: [
        { icon: Zap, label: 'Alpha Hub', path: '/alpha-hub', desc: 'Main Terminal', tag: 'USP' },
        { icon: Search, label: 'Screener', path: '/screener', desc: 'Stock Screener' },
        { icon: LineChart, label: 'Chart Terminal', path: '/charts', desc: 'Technical Charting' },
      ]
    },
    {
      title: 'Portfolio Desk',
      items: [
        { icon: Briefcase, label: 'Manager', path: '/portfolio', desc: 'Wealth Tracking' },
        { icon: BookOpen, label: 'Journal', path: '/trades', desc: 'Trade Ledger' },
      ]
    },
    {
      title: 'Learning & AI',
      items: [
        { icon: ShieldCheck, label: 'Institutional Course', path: '/education', desc: 'Video Course' },
        { icon: Bot, label: 'BeaconAI', path: '/ai-assistant', desc: 'Strategy AI', tag: 'NEW' },
      ]
    },
    {
      title: 'Account',
      items: [
        {icon: Store, label: 'License Desk', path: '/license-desk', desc: 'Subscription' },
      ]
    }
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-[110] w-64 bg-[var(--bg-secondary)] flex flex-col shrink-0 border-r border-[var(--border-primary)] shadow-2xl 
      transform transition-all duration-500 ease-in-out h-screen
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `} tabIndex={-1} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      
      {/* Brand Identity */}
      <div className="p-6 pb-8 border-b border-[var(--border-primary)] flex items-center justify-between">
        <BrandLogo variant="light" size={30} hideText={false} />
        <div>
           <button onClick={onClose} className="outline-none p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] active:scale-95">
              <ChevronRight className="h-4 w-4 rotate-180" />
           </button>
        </div>
      </div>

      {/* Navigation Matrix */}
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto no-scrollbar">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <div className="px-5 flex items-center justify-between mb-2">
               <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.25em]">{section.title}</h3>
            </div>
            
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center group px-5 py-3 transition-all duration-300 relative outline-none
                    ${isActive 
                      ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-l-[4px] border-[var(--border-accent)] font-bold' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border-l-[4px] border-transparent hover:translate-x-1'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-2 rounded-xl mr-3.5 transition-all duration-300 border ${
                        isActive 
                          ? 'bg-[var(--border-accent)]/10 text-[var(--border-accent)] border-[var(--border-accent)]/20 shadow-md shadow-[var(--border-accent)]/5' 
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-primary)] group-hover:text-[var(--border-accent)] group-hover:bg-[var(--bg-tertiary)] group-hover:border-[var(--border-primary)]'
                      }`}>
                         <item.icon className={`h-4 w-4 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:rotate-6'}`} />
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-caption leading-none">{item.label}</span>
                            {item.tag && (
                              <span className="bg-[var(--border-accent)] text-caption text-white px-1.5 py-0.5 rounded uppercase leading-none tracking-wider shadow-lg shadow-[var(--border-accent)]/20">
                                {item.tag}
                              </span>
                            )}
                        </div>
                        <span className={`text-[8.5px] font-bold uppercase tracking-tighter mt-1 ${isActive ? 'text-[var(--border-accent)]' : 'text-[var(--text-muted)]'}`}>{item.desc}</span>
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div className="flex-1" />

        {isAdmin && (
          <div className="pt-4 border-t border-[var(--border-primary)]">
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center px-5 py-4 transition-all duration-300 relative group outline-none
                ${isActive 
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-l-[4px] border-[var(--border-accent)] font-bold' 
                  : 'text-[var(--text-secondary)] border-l-[4px] border-transparent hover:translate-x-1 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}
              `}
            >
              <div className="p-2 bg-[var(--border-accent)]/10 border border-[var(--border-accent)]/20 rounded-xl mr-3.5 text-[var(--border-accent)] group-hover:scale-110 transition-transform">
                 <Terminal className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-caption">Admin Control</span>
                <span className="text-xs font-bold uppercase tracking-tighter text-[var(--text-muted)]">Command Center</span>
              </div>
            </NavLink>
            <NavLink
              to="/admin/growth-lab"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center px-5 py-3 mt-2 transition-all duration-300 relative group
                ${isActive
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-l-[4px] border-emerald-500 font-bold'
                  : 'text-[var(--text-secondary)] border-l-[4px] border-transparent hover:translate-x-1 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}
              `}
            >
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mr-3.5 text-emerald-400 group-hover:scale-110 transition-transform">
                 <FlaskConical className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-caption">Growth Lab</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-[var(--text-muted)]">Quarterly Filtration</span>
              </div>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Sidebar Footer: Connectivity Info */}
      <div className="p-6 mt-auto border-t border-[var(--border-primary)] space-y-4 bg-[var(--bg-primary)]">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-1.5">
               <Link to="/profile" onClick={onClose} className="outline-none p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-lg hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-primary)]" title="Settings">
                  <Settings className="h-4 w-4" />
               </Link>
               <Link to="/education" onClick={onClose} className="outline-none p-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-lg hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-primary)]" title="Help">
                  <HelpCircle className="h-4 w-4" />
               </Link>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-caption text-[var(--text-muted)] uppercase tracking-wider">Link Protocol</span>
              <div className="flex items-center gap-1.5">
                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Live Node</span>
              </div>
           </div>
        </div>
        
        <div className="text-center">
           <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">{APP_VERSION_DISPLAY}</p>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
