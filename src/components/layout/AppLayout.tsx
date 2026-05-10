import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import TopNav from './TopNav';

const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Fixed Sidebar */}
      <SideNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopNav />
        
        {/* Page Content - Independent Scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
