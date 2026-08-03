import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
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
  Search,
  LineChart,
  X,
  HelpCircle,
  Store,
  User,
  Bot,
  Menu,
  TrendingUp
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('mb_sidebar_collapsed') !== 'false';
  });
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    return localStorage.getItem('mb_sebi_banner_dismissed') === 'true';
  });

  // Keep sidebar open on desktop, close on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [location.pathname]);

  // Re-open sidebar when resizing to desktop, close when resizing to mobile
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    localStorage.setItem('mb_sebi_banner_dismissed', 'true');
  };



  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden relative">
      {/* Mobile Sidebar Backdrop — light overlay so sidebar content stays readable */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/20 z-[105] animate-in fade-in duration-200 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar - Responsive drawer on mobile */}
      <SideNav 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => {
          const newVal = !isSidebarCollapsed;
          setIsSidebarCollapsed(newVal);
          localStorage.setItem('mb_sidebar_collapsed', String(newVal));
        }}
      />

      {/* Main Content Area - auto-adjusts via flex when sidebar is relative on desktop */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopNav 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onToggleSidebarCollapse={() => {
            const newVal = !isSidebarCollapsed;
            setIsSidebarCollapsed(newVal);
            localStorage.setItem('mb_sidebar_collapsed', String(newVal));
          }}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        {/* Sticky SEBI Compliance Banner */}
        {!isBannerDismissed && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 md:py-2 text-center text-caption text-amber-400 flex items-center justify-between gap-2 relative z-30 shrink-0 select-none">
            <span className="flex-1 text-center pr-2 md:pr-4 leading-tight">⚠️ DISCLAIMER: We are NOT a SEBI-registered Investment Adviser or Research Analyst. MarketBeacon provides purely educational & mathematical tools. No content constitutes investment advice or recommendations.</span>
<button
          onClick={handleDismissBanner}
          aria-label="Dismiss banner"
          className="p-1 rounded-md hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0 font-bold text-xs"
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-primary)]/80 backdrop-blur-md border-t border-[var(--border-primary)] z-[100] px-4 flex items-center justify-around shadow-2xl">
        <NavLink
          to="/app"
          className={({ isActive }) => `
            flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300
            ${isActive ? 'text-[var(--border-accent)]' : 'text-[var(--text-muted)]'}
          `}
        >
          <LayoutGrid className="h-5 w-5 mb-0.5" />
          <span className="text-[12px] font-bold leading-none">Home</span>
        </NavLink>

        <NavLink
          to="/screener"
          className={({ isActive }) => `
            flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300
            ${isActive ? 'text-[var(--border-accent)]' : 'text-[var(--text-muted)]'}
          `}
        >
          <Search className="h-5 w-5 mb-0.5" />
          <span className="text-[12px] font-bold leading-none">Screener</span>
        </NavLink>

        <NavLink
          to="/alpha-hub"
          className={({ isActive }) => `
            flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300
            ${isActive ? 'text-[var(--border-accent)]' : 'text-[var(--text-muted)]'}
          `}
        >
          <Zap className="h-5 w-5 mb-0.5" />
          <span className="text-[12px] font-bold leading-none">Alpha Hub</span>
        </NavLink>

        <NavLink
          to="/portfolio"
          className={({ isActive }) => `
            flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300
            ${isActive ? 'text-[var(--border-accent)]' : 'text-[var(--text-muted)]'}
          `}
        >
          <Briefcase className="h-5 w-5 mb-0.5" />
          <span className="text-[12px] font-bold leading-none">Portfolio</span>
        </NavLink>

        <button
          onClick={() => setIsMobileMoreOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <Menu className="h-5 w-5 mb-0.5" />
          <span className="text-[12px] font-bold leading-none">More</span>
        </button>
      </div>

      {/* Mobile "More" Slide-up Drawer */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMoreOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[150] md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0b0f19] border-t border-slate-800 rounded-t-[2rem] z-[160] p-6 pb-8 md:hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-black text-white uppercase tracking-wider">Quick Navigation</span>
                <button
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Link
                  to="/charts"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all text-center"
                >
                  <LineChart className="h-6 w-6 text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">Charts</span>
                </Link>

                <Link
                  to="/short-term"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-cyan-500/30 transition-all text-center"
                >
                  <TrendingUp className="h-6 w-6 text-cyan-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">Short Term</span>
                </Link>

                <Link
                  to="/trades"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-amber-500/30 transition-all text-center"
                >
                  <BookOpen className="h-6 w-6 text-amber-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">Journal</span>
                </Link>

                <Link
                  to="/guide"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-purple-500/30 transition-all text-center"
                >
                  <HelpCircle className="h-6 w-6 text-purple-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">Help Guide</span>
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-cyan-500/30 transition-all text-center"
                >
                  <User className="h-6 w-6 text-cyan-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">Profile</span>
                </Link>

                <Link
                  to="/license-desk"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all text-center"
                >
                  <Store className="h-6 w-6 text-indigo-400 mb-2" />
                  <span className="text-xs font-bold text-slate-200">License</span>
                </Link>

                <Link
                  to="/ai-assistant"
                  onClick={() => setIsMobileMoreOpen(false)}
                  className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-slate-600 transition-all text-center relative"
                >
                  <Bot className="h-6 w-6 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-400">Beacon AI</span>
                  <span className="absolute top-2 right-2 text-[7px] bg-slate-700 text-slate-400 px-1 rounded font-bold uppercase tracking-wide">Beta</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Feedback Trigger (Safe-Guard Style) */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-20 right-4 md:bottom-10 md:right-10 z-[150] w-12 h-12 md:w-16 md:h-16 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-[2rem] shadow-2xl hover:bg-[var(--border-accent)] hover:scale-110 transition-all flex items-center justify-center group border border-[var(--border-primary)]"
      >
        <MessageSquarePlus className="h-6 w-6 md:h-7 md:w-7 transition-transform group-hover:rotate-12" />
        <div className="absolute right-full mr-4 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-caption rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4 whitespace-nowrap pointer-events-none shadow-2xl border border-[var(--border-primary)] hidden md:block">
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
