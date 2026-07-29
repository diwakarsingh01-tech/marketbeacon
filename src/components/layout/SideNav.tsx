import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo';
import { 
  Store,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  User,
  Terminal,
  FlaskConical,
  Settings,
  Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_VERSION_DISPLAY } from '../../lib/version';

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOnly?: boolean;
}

const SideNav: React.FC<SideNavProps> = ({ isOpen, onClose, isCollapsed = false, onToggleCollapse, mobileOnly = false }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const sections: {
    title: string;
    items: {
      icon: React.ComponentType<any>;
      label: string;
      path: string;
      desc: string;
      tag?: string;
    }[];
  }[] = [
    {
      title: 'Support & Help',
      items: [
        { icon: HelpCircle, label: 'Help Guide', path: '/guide', desc: 'Documentation' },
        { icon: ShieldCheck, label: 'Video Course', path: '/education', desc: 'Institutional Course' }
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: User, label: 'Profile Desk', path: '/profile', desc: 'Account Settings' },
        { icon: Store, label: 'License Desk', path: '/license-desk', desc: 'Subscription' },
      ]
    },
    {
      title: 'Experimental',
      items: [
        { icon: Bot, label: 'Beacon AI', path: '/ai-assistant', desc: 'Under Development', tag: 'Beta' },
      ]
    }
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-[110] w-[85vw] max-w-sm bg-[var(--bg-secondary)] flex flex-col shrink-0 border-r border-[var(--border-primary)] shadow-2xl 
      transform transition-all duration-500 ease-in-out h-screen overscroll-contain
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      ${mobileOnly 
        ? 'md:hidden' 
        : `md:relative md:inset-auto md:z-0 md:translate-x-0 md:transform-none md:shadow-xl md:h-full md:rounded-r-xl md:transition-all md:duration-300 md:ease-in-out ${isCollapsed ? 'md:w-16' : 'md:w-64'}`
      }
    `} tabIndex={-1} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      
      {/* Brand Identity */}
      <div className="p-4 md:p-6 md:pb-8 border-b border-[var(--border-primary)] flex items-center justify-between">
        <BrandLogo variant="light" size={26} hideText={isCollapsed} />
        <div className="flex items-center gap-1">
          {onToggleCollapse && (
            <button 
              onClick={onToggleCollapse} 
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden md:inline-flex outline-none p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all rounded-xl border border-[var(--border-primary)] active:scale-95"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
          <button onClick={onClose} aria-label="Close sidebar" className="outline-none p-3 md:p-2.5 text-[var(--text-primary)] hover:text-white transition-all rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] active:scale-95 touch-manipulation hover:bg-red-500/20 hover:border-red-500/30 md:hidden">
            <ChevronRight className="h-5 w-5 md:h-4 md:w-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Navigation Matrix */}
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto overflow-x-hidden">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <div className="px-5 flex items-center justify-between mb-1.5">
               <h3 className={`text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.25em] ${isCollapsed ? 'md:hidden' : ''}`}>{section.title}</h3>
            </div>
            
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center group px-5 py-3.5 md:py-3 transition-all duration-300 relative outline-none
                    ${isCollapsed ? 'md:justify-center' : ''}
                    ${isActive 
                      ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-l-[4px] border-[var(--border-accent)] font-bold' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border-l-[4px] border-transparent hover:translate-x-1'}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-2 rounded-xl transition-all duration-300 border flex-shrink-0 ${isCollapsed ? 'md:mr-0' : 'md:mr-3.5'} ${
                        isActive 
                          ? 'bg-[var(--border-accent)]/10 text-[var(--border-accent)] border-[var(--border-accent)]/20 shadow-md shadow-[var(--border-accent)]/5' 
                          : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-primary)] group-hover:text-[var(--border-accent)] group-hover:bg-[var(--bg-tertiary)] group-hover:border-[var(--border-primary)]'
                      }`}>
                         <item.icon className={`h-5 w-5 md:h-4 md:w-4 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:rotate-6'}`} />
                      </div>
                      <div className={`flex flex-col flex-1 min-w-0 ${isCollapsed ? 'md:hidden' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm md:text-caption font-medium leading-tight text-[var(--text-primary)]">{item.label}</span>
                            {item.tag && (
                              <span className="bg-[var(--border-accent)] text-[10px] md:text-caption text-white px-1.5 py-0.5 rounded uppercase leading-none tracking-wider shadow-lg shadow-[var(--border-accent)]/20 shrink-0">
                                {item.tag}
                              </span>
                            )}
                        </div>
                        <span className={`text-[10px] md:text-[8.5px] font-bold uppercase tracking-tighter mt-0.5 ${isActive ? 'text-[var(--border-accent)]' : 'text-[var(--text-muted)]'}`}>{item.desc}</span>
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
                ${isCollapsed ? 'md:justify-center' : ''}
                ${isActive 
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-l-[4px] border-[var(--border-accent)] font-bold' 
                  : 'text-[var(--text-secondary)] border-l-[4px] border-transparent hover:translate-x-1 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}
              `}
            >
              <div className={`p-2 bg-[var(--border-accent)]/10 border border-[var(--border-accent)]/20 rounded-xl transition-transform flex-shrink-0 ${isCollapsed ? 'md:mr-0' : 'md:mr-3.5'} group-hover:scale-110`}>
                 <Terminal className="h-5 w-5 md:h-4 md:w-4" />
              </div>
              <div className={`flex flex-col ${isCollapsed ? 'md:hidden' : ''}`}>
                <span className="text-caption">Admin Control</span>
                <span className="text-xs font-bold uppercase tracking-tighter text-[var(--text-muted)]">Command Center</span>
              </div>
            </NavLink>
            <NavLink
              to="/admin/growth-lab"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center px-5 py-3 mt-2 transition-all duration-300 relative group
                ${isCollapsed ? 'md:justify-center' : ''}
                ${isActive
                  ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-l-[4px] border-emerald-500 font-bold'
                  : 'text-[var(--text-secondary)] border-l-[4px] border-transparent hover:translate-x-1 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}
              `}
            >
              <div className={`p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl transition-transform flex-shrink-0 ${isCollapsed ? 'md:mr-0' : 'md:mr-3.5'} group-hover:scale-110`}>
                 <FlaskConical className="h-3.5 w-3.5" />
              </div>
              <div className={`flex flex-col ${isCollapsed ? 'md:hidden' : ''}`}>
                <span className="text-caption">Growth Lab</span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-[var(--text-muted)]">Quarterly Filtration</span>
              </div>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Sidebar Footer: Connectivity Info */}
      <div className="p-4 md:p-6 mt-auto border-t border-[var(--border-primary)] space-y-3 md:space-y-4 bg-[var(--bg-primary)]">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-1">
               <Link to="/profile" onClick={onClose} className="outline-none p-2.5 md:p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-lg hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-primary)]" title="Settings">
                  <Settings className="h-5 w-5 md:h-4 md:w-4" />
               </Link>
               <Link to="/education" onClick={onClose} className="outline-none p-2.5 md:p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-lg hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-primary)]" title="Help">
                  <HelpCircle className="h-5 w-5 md:h-4 md:w-4" />
               </Link>
           </div>
           <div className={`flex flex-col items-end ${isCollapsed ? 'md:hidden' : ''}`}>
              <span className="text-[10px] md:text-caption text-[var(--text-muted)] uppercase tracking-wider">Status</span>
              <div className="flex items-center gap-1.5">
                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-bold text-emerald-500 md:text-emerald-600 uppercase tracking-wider">Live</span>
              </div>
           </div>
        </div>
        
        <div className={`text-center ${isCollapsed ? 'md:hidden' : ''}`}>
           <p className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">{APP_VERSION_DISPLAY}</p>
        </div>
      </div>
    </aside>
  );
};

export default SideNav;
