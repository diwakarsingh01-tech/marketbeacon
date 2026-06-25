import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import SideNav from './SideNav';
import TopNav from './TopNav';
import FeedbackModal from '../ui/FeedbackModal';
import InstallPrompt from '../InstallPrompt';
import { 
  MessageSquarePlus, 
  LayoutGrid, 
  Zap, 
  Briefcase, 
  BookOpen, 
  Store 
} from 'lucide-react';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return localStorage.getItem('mb_sebi_banner_dismissed') === 'true';
  });

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    localStorage.setItem('mb_sebi_banner_dismissed', 'true');
  };

  const mobileNavItems = [
    { icon: LayoutGrid, label: 'Home', path: '/app' },
    { icon: Zap, label: 'Alpha', path: '/alpha-hub' },
    { icon: Zap, label: 'Screener', path: '/screener' },
    { icon: Briefcase, label: 'Manager', path: '/portfolio' },
    { icon: BookOpen, label: 'Journal', path: '/trades' },
    { icon: Store, label: 'Licenses', path: '/license-desk' },
  ];

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden relative">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[105] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar - Responsive drawer on mobile */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Sticky SEBI Compliance Banner */}
        {!isBannerDismissed && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 md:py-2 text-center text-[7px] md:text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between gap-2 relative z-30 shrink-0 select-none">
            <span className="flex-1 text-center pr-2 md:pr-4 leading-tight">⚠️ DISCLAIMER: We are NOT a SEBI-registered Investment Adviser or Research Analyst. MarketBeacon provides purely educational & mathematical tools. No content constitutes investment advice or recommendations.</span>
            <button
              onClick={handleDismissBanner}
              className="p-1 rounded-md hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0 font-black text-[10px]"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Page Content - Independent Scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col no-scrollbar pb-16 md:pb-0">
          <div className="flex-1">
            <Outlet />
          </div>
          
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)]/95 backdrop-blur-md border-t border-[var(--border-primary)] z-[100] px-4 py-2.5 flex items-center justify-around shadow-2xl">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300
              ${isActive ? 'text-blue-500' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
            `}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-[7.5px] font-black uppercase tracking-widest leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Global Feedback Trigger (Safe-Guard Style) */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-10 md:right-10 z-[150] w-12 h-12 md:w-16 md:h-16 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-[2rem] shadow-2xl hover:bg-blue-600 hover:scale-110 transition-all flex items-center justify-center group border border-[var(--border-primary)]"
      >
        <MessageSquarePlus className="h-6 w-6 md:h-7 md:w-7 transition-transform group-hover:rotate-12" />
        <div className="absolute right-full mr-4 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4 whitespace-nowrap pointer-events-none shadow-2xl border border-[var(--border-primary)] hidden md:block">
          Institutional Signal Feedback
        </div>
      </button>
      <InstallPrompt />
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </div>
  );
};

export default AppLayout;
