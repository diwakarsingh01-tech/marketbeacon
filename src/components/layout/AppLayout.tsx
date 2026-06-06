import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import SideNav from './SideNav';
import TopNav from './TopNav';
import GlobalFooter from './Footer';

import FeedbackModal from '../ui/FeedbackModal';
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

  const mobileNavItems = [
    { icon: LayoutGrid, label: 'Alpha', path: '/alpha-hub' },
    { icon: Zap, label: 'Screener', path: '/screener' },
    { icon: Briefcase, label: 'Manager', path: '/portfolio' },
    { icon: BookOpen, label: 'Journal', path: '/trades' },
    { icon: Store, label: 'Market', path: '/marketplace' },
  ];

  return (
    <div className="flex h-screen bg-institutional-white overflow-hidden relative" style={{ backgroundColor: 'var(--institutional-white)' }}>
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[105] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar - Responsive drawer on mobile */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Page Content - Independent Scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col no-scrollbar pb-16 md:pb-0">
          <div className="flex-1">
            <Outlet />
          </div>
          <GlobalFooter />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-white/5 z-[100] px-4 py-2.5 flex items-center justify-around shadow-2xl">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300
              ${isActive ? 'text-blue-500' : 'text-slate-400 hover:text-white'}
            `}
          >
            <item.icon className="h-4.5 w-4.5 mb-1" />
            <span className="text-[7.5px] font-black uppercase tracking-widest leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Global Feedback Trigger (Safe-Guard Style) */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-10 md:right-10 z-[150] w-12 h-12 md:w-16 md:h-16 bg-slate-ink text-white rounded-[2rem] shadow-2xl hover:bg-blue-600 hover:scale-110 transition-all flex items-center justify-center group border border-white/5"
        style={{ backgroundColor: 'var(--slate-ink)' }}
      >
        <MessageSquarePlus className="h-6 w-6 md:h-7 md:w-7 transition-transform group-hover:rotate-12" />
        <div className="absolute right-full mr-4 px-4 py-2 bg-slate-ink text-white text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4 whitespace-nowrap pointer-events-none shadow-2xl border border-white/5 hidden md:block">
           Institutional Signal Feedback
        </div>
      </button>
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </div>
  );
};

export default AppLayout;
