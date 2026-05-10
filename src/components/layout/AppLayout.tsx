import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import TopNav from './TopNav';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[105] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar - Responsive drawer on mobile */}
      <SideNav isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Page Content - Independent Scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
