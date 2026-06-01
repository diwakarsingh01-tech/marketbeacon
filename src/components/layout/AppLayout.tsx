import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import TopNav from './TopNav';
import GlobalFooter from './Footer';

import FeedbackModal from '../ui/FeedbackModal';
import { MessageSquarePlus } from 'lucide-react';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col no-scrollbar">
          <div className="flex-1">
            <Outlet />
          </div>
          <GlobalFooter />
        </main>
      </div>

      {/* Global Feedback Trigger (Safe-Guard Style) */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[150] w-12 h-12 md:w-16 md:h-16 bg-slate-ink text-white rounded-[2rem] shadow-2xl hover:bg-blue-600 hover:scale-110 transition-all flex items-center justify-center group border border-white/5"
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
