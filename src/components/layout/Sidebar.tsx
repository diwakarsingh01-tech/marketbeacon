import React from 'react';
import { LayoutDashboard, TrendingUp, BarChart2, Settings, List } from 'lucide-react';

const Sidebar: React.FC = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: TrendingUp, label: 'Strategies', active: false },
    { icon: List, label: 'Trades', active: false },
    { icon: BarChart2, label: 'Analytics', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  const strategies = ['ENVELOPE', 'MA_CROSSOVER', 'BREAKOUT', 'RSI_REVERSAL'];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight">SuperTracker</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              item.active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </a>
        ))}
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Active Strategies
          </h3>
          <div className="mt-2 space-y-1">
            {strategies.map((strategy) => (
              <a
                key={strategy}
                href={`?strategy=${strategy}`}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${
                  window.location.search.includes(strategy) ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-3 ${strategy === 'ENVELOPE' ? 'bg-green-500' : 'bg-gray-300'}`} />
                {strategy}
              </a>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
