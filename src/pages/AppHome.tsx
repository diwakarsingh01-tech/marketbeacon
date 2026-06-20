import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, Zap, Briefcase, BookOpen, TrendingUp, LineChart, 
  Search, ArrowRight, Activity, BarChart3, Shield, Star, 
  Clock, Target, Wallet, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, safeJsonParse } from '../lib/api-utils';
import SEO from '../components/SEO';

const API_URL = getApiUrl();

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subtitle }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-5 flex flex-col justify-between min-h-[100px] transition-all hover:border-[var(--border-secondary)] hover:shadow-lg"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{title}</span>
        <div className={`p-1.5 rounded-lg border ${colors[color]} backdrop-blur-sm`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{value}</div>
        {subtitle && <div className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">{subtitle}</div>}
      </div>
    </motion.div>
  );
};

interface QuickLink {
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  path: string;
  desc: string;
  bg: string;
  border: string;
  iconCls: string;
}

const quickLinks: QuickLink[] = [
  { icon: Search, label: 'Audit a Stock', path: '/screener', desc: 'Search & score any NSE/BSE stock', bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconCls: 'text-blue-400' },
  { icon: TrendingUp, label: 'Alpha Signals', path: '/alpha-hub', desc: 'Active institutional setups', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', iconCls: 'text-emerald-400' },
  { icon: Briefcase, label: 'Portfolio', path: '/portfolio', desc: 'Track holdings & P&L', bg: 'bg-amber-500/10', border: 'border-amber-500/20', iconCls: 'text-amber-400' },
  { icon: BookOpen, label: 'Trade Journal', path: '/trades', desc: 'Verify & log trades', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconCls: 'text-purple-400' },
  { icon: LayoutGrid, label: 'Screener Matrix', path: '/screener', desc: 'Real-time stock matrix', bg: 'bg-rose-500/10', border: 'border-rose-500/20', iconCls: 'text-rose-400' },
  { icon: BarChart3, label: 'Charts Terminal', path: '/charts', desc: 'Advanced charting suite', bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconCls: 'text-blue-400' },
];

const recentItems = [
  { symbol: 'TCS', score: 87, action: 'Buy Zone', change: '+2.3%', strategy: 'Envelope Long' },
  { symbol: 'RELIANCE', score: 72, action: 'Watch', change: '-0.8%', strategy: 'S&R Zones' },
  { symbol: 'HDFCBANK', score: 64, action: 'Avoid', change: '-1.2%', strategy: 'Bearish Stacking' },
];

const AppHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    portfolioValue: '₹0',
    activeSignals: 0,
    watchlistCount: 0,
    auditScore: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('mb_token');
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/user/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(prev => ({ ...prev, ...data }));
        }
      } catch {
        // silencio
      }
    };
    fetchStats();
  }, []);

  const tierColor = user?.tier === 'alpha' ? 'amber' : user?.tier === 'pro' ? 'blue' : 'emerald';
  const tierLabel = user?.tier === 'alpha' ? 'Alpha' : user?.tier === 'pro' ? 'Pro' : 'Free';

  return (
    <>
      <SEO title="Dashboard | MarketBeacon Pro" description="Your institutional audit command center" />

      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">
              Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-1 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                tierColor === 'amber' ? 'bg-amber-400' : tierColor === 'blue' ? 'bg-blue-400' : 'bg-emerald-400'
              }`} />
              {tierLabel} Tier · Institutional Audit Platform
            </p>
          </div>
          <Link
            to="/screener"
            className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all"
          >
            <Search className="w-3 h-3" /> New Audit
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard title="Portfolio Value" value={stats.portfolioValue} icon={Wallet} color="emerald" subtitle="Across all holdings" />
          <StatCard title="Active Signals" value={stats.activeSignals} icon={Activity} color="blue" subtitle="Live institutional setups" />
          <StatCard title="Watchlist" value={stats.watchlistCount} icon={Star} color="amber" subtitle="Tracked stocks" />
          <StatCard title="Avg. Audit Score" value={stats.auditScore ? `${stats.auditScore}/100` : '--'} icon={Shield} color="purple" subtitle="Portfolio health" />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {quickLinks.map((link, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -1 }}
                  onClick={() => navigate(link.path)}
                  className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl p-4 text-left hover:border-blue-500/30 transition-all group"
                >
                  <div className={`w-8 h-8 rounded-lg ${link.bg} ${link.border} flex items-center justify-center mb-2`}>
                    <link.icon className={`w-4 h-4 ${link.iconCls}`} />
                  </div>
                  <div className="text-[11px] font-black text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{link.label}</div>
                  <div className="text-[8px] text-[var(--text-muted)] font-medium mt-0.5">{link.desc}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-3">Recent Audits</h2>
            <div className="space-y-2">
              {recentItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/analysis/${item.symbol}`)}
                  className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl p-4 cursor-pointer hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{item.symbol}</span>
                    <span className={`text-[9px] font-black ${
                      item.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                    }`}>{item.change}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-[var(--text-muted)] font-medium uppercase tracking-wider">
                    <span className="text-blue-400">{item.score}/100</span>
                    <span>·</span>
                    <span>{item.action}</span>
                    <span>·</span>
                    <span>{item.strategy}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade CTA for Free users */}
        {user?.tier === 'free' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 border border-blue-500/20 flex items-center justify-between flex-wrap gap-3"
          >
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Unlock Alpha Tier
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">Get ABCD tranche entries, advanced strategies, and real-time alerts.</p>
            </div>
            <Link
              to="/license-desk"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all shrink-0"
            >
              Upgrade <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* Mobile CTA */}
        <div className="mt-6 md:hidden">
          <Link
            to="/screener"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-5 py-4 rounded-xl w-full"
          >
            <Search className="w-3.5 h-3.5" /> New Audit
          </Link>
        </div>
      </div>
    </>
  );
};

export default AppHome;
