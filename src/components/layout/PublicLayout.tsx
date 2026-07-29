import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import TopNav from './TopNav';
import SideNav from './SideNav';
import Footer from './Footer';
import InstallPrompt from '../InstallPrompt';
import { 
  LayoutGrid, 
  Zap, 
  Briefcase, 
  BookOpen, 
  Search
} from 'lucide-react';

const PublicLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const mobileNavItems = [
    { icon: LayoutGrid, label: 'Home', path: '/' },
    { icon: Zap, label: 'Alpha', path: '/alpha-hub' },
    { icon: Search, label: 'Screener', path: '/screener' },
    { icon: Briefcase, label: 'Portfolio', path: '/portfolio' },
    { icon: BookOpen, label: 'Journal', path: '/trades' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)]">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[105] animate-in fade-in duration-300 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Top Navigation */}
      <TopNav onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Mobile Sidebar Drawer */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} mobileOnly={true} />

      {/* Main Content */}
      <main className="flex-1 w-full pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)]/95 backdrop-blur-md border-t border-[var(--border-primary)] z-[100] px-2 py-2 flex items-center justify-between shadow-2xl">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center flex-1 px-1 py-1.5 transition-all duration-300 gap-0.5
              ${isActive ? 'text-[var(--accent-amber)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
            `}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[9px] leading-none font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <InstallPrompt />
    </div>
  );
};

export default PublicLayout;