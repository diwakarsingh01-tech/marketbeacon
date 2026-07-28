import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, Wallet, BarChart3, Activity,
  Zap, BookOpen, Store, ArrowRight, ChevronRight,
  ShieldCheck, RefreshCw, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { safeJsonParse, getApiUrl, getAuthHeaders } from '../lib/api-utils';
import UpgradeModal from '../components/modals/UpgradeModal';
import SEO from '../components/SEO';
import type { TradeRecord } from '../types';

const API_URL = getApiUrl();

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const fetchStockPrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    try {
      const res = await fetch(`${API_URL}/api/stock-prices?symbols=${symbols.join(',')}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const pMap: Record<string, number> = {};
        data.forEach(s => { pMap[s.symbol] = s.price; });
        setStockPrices(pMap);
      }
    } catch (e) {
      console.error('Fetch prices error:', e);
    }
  }, []);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/trades`, {
        headers: { ...getAuthHeaders() }
      });
      const d = await safeJsonParse(res);
      if (res.ok && !d?.error) {
        const tradesList: TradeRecord[] = d || [];
        setTrades(tradesList);
        const symbols = Array.from(new Set(tradesList.map(t => t.symbol)));
        fetchStockPrices(symbols);
      }
    } catch (e) {
      console.error('Fetch trades error:', e);
    } finally {
      setLoading(false);
    }
  }, [fetchStockPrices]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const openTrades = trades.filter(t => t.status === 'OPEN');
  
  const totalInvested = trades.reduce((sum, t) => {
    const qty = Number(t.quantity) || 0;
    const price = Number(t.entry_price) || 0;
    return sum + (price * qty);
  }, 0);

  const currentValue = trades.reduce((sum, t) => {
    const qty = Number(t.quantity) || 0;
    const entryPrice = Number(t.entry_price) || 0;
    const exitPrice = Number(t.exit_price) || 0;
    
    if (t.status === 'CLOSED') {
      return sum + (exitPrice * qty);
    } else {
      const livePrice = stockPrices[t.symbol] || entryPrice;
      return sum + (livePrice * qty);
    }
  }, 0);

  const pnl = currentValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? ((pnl / totalInvested) * 100).toFixed(1) : '0.0';
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-sans">
      <SEO title="Dashboard — MarketBeacon Pro" description="Your trading dashboard with portfolio summary, recent activity, and quick access to all tools." />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-6 md:px-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.03] via-transparent to-emerald-600/[0.03] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-950/50 backdrop-blur-sm rounded-full border border-blue-900 mb-4 w-fit">
                <ShieldCheck className="h-3 w-3 text-blue-400" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  {user?.tier === 'alpha' ? 'Alpha Execution Plan' : user?.tier === 'pro' ? 'Pro Execution Plan' : 'Free Plan'}
                  {user?.daysRemaining !== null && user?.daysRemaining !== undefined && ` · ${user.daysRemaining} days remaining`}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] drop-shadow-2xl">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="text-sm md:text-base font-medium text-[var(--text-muted)] mt-2 max-w-xl">
                Your institutional command center — track trades, scan markets, and manage your portfolio.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {user?.tier === 'free' && (
                <button 
                  onClick={() => setShowUpgrade(true)} 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-[var(--text-primary)] rounded-xl text-caption hover:scale-105 transition-all shadow-xl shadow-blue-900/30 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Upgrade Plan
                </button>
              )}
              <button 
                onClick={fetchTrades} 
                className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-blue-500/40 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { title: 'Total Trades', value: trades.length.toString(), icon: BarChart3, color: 'blue', link: '/trades' },
              { title: 'Open Positions', value: openTrades.length.toString(), icon: Activity, color: 'emerald', link: '/portfolio' },
              { 
                title: 'Portfolio Value', 
                value: `₹${(currentValue / 100000).toFixed(1)}L`, 
                subtitle: totalInvested > 0 ? `${openTrades.length} active` : 'No capital deployed',
                icon: Wallet, 
                color: 'amber', 
                link: '/portfolio' 
              },
              { 
                title: 'P&L', 
                value: `${pnl >= 0 ? '+' : ''}${pnlPercent}%`, 
                subtitle: `₹${Math.round(Math.abs(pnl)).toLocaleString('en-IN')}`,
                icon: TrendingUp, 
                color: pnl >= 0 ? 'emerald' : 'rose', 
                link: '/trades' 
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              const colorMap: Record<string, string> = {
                blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20 text-blue-400',
                emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
                amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400',
                rose: 'from-rose-600/20 to-rose-600/5 border-rose-500/20 text-rose-400',
              };
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Link to={item.link || '#'} className="block group relative bg-[var(--bg-secondary)]/80 backdrop-blur-sm border border-[var(--border-primary)] rounded-2xl p-6 hover:border-blue-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[item.color]} border`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">{item.value}</p>
                    <p className="text-caption text-[var(--text-muted)] uppercase tracking-wider mt-1.5">{item.title}</p>
                    {'subtitle' in item && item.subtitle && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">{item.subtitle}</p>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Access + Recent Activity */}
      <section className="py-12 md:py-16 px-6 md:px-10 border-t border-[var(--border-primary)]/60 bg-[var(--bg-secondary)]/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-emerald-600/5 pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Access */}
            <div className="md:col-span-1">
              <div className="mb-4">
                <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em]">Quick Access</h2>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">Tools & Resources</p>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Zap, label: 'Alpha Hub', desc: 'Strategy portfolios', path: '/alpha-hub', color: 'text-blue-400', border: 'border-blue-500/20' },
                  { icon: LayoutDashboard, label: 'Screener', desc: 'Scan & filter stocks', path: '/screener', color: 'text-indigo-400', border: 'border-indigo-500/20' },
                  { icon: Wallet, label: 'Portfolio', desc: 'Manage holdings', path: '/portfolio', color: 'text-emerald-400', border: 'border-emerald-500/20' },
                  { icon: BookOpen, label: 'Trade Journal', desc: 'Review history', path: '/trades', color: 'text-amber-400', border: 'border-amber-500/20' },
                  { icon: Store, label: 'License Desk', desc: 'Manage plans', path: '/license-desk', color: 'text-purple-400', border: 'border-purple-500/20' },
                ].map((item, i) => (
                  <Link 
                    key={i} 
                    to={item.path} 
                    className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)]/80 border border-[var(--border-primary)] hover:border-blue-500/50 transition-all group backdrop-blur-sm"
                  >
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 border ${item.border}`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{item.label}</p>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em]">Recent Activity</h2>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-1">Your latest trades</p>
                </div>
                {trades.length > 0 && (
                  <Link to="/trades" className="text-caption text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors flex items-center gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-[var(--bg-secondary)]/80 border border-[var(--border-primary)] animate-pulse" />
                  ))}
                </div>
              ) : trades.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/80 backdrop-blur-sm p-10 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 blur-[60px] pointer-events-none" />
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
                    <Activity className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 tracking-tight">No Trades Yet</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-8 max-w-md mx-auto">Start your analysis journey — scan stocks, build your portfolio, and track your performance.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link to="/alpha-hub" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-[var(--text-primary)] rounded-xl text-caption hover:from-blue-500 hover:to-indigo-500 hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
                      Go to Alpha Hub
                    </Link>
                    <Link to="/screener" className="px-6 py-3 bg-[var(--bg-tertiary)]/50 text-[var(--text-primary)] rounded-xl text-caption border border-[var(--border-primary)] hover:border-blue-500/50 hover:bg-[var(--bg-tertiary)] transition-all">
                      Open Screener
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTrades.map((trade, i) => {
                    const isClosed = trade.status === 'CLOSED';
                    const entryPrice = Number(trade.entry_price) || 0;
                    const exitPrice = Number(trade.exit_price) || 0;
                    const livePrice = stockPrices[trade.symbol] || entryPrice;
                    const currentPrice = isClosed ? exitPrice : livePrice;
                    const tradePnL = (currentPrice - entryPrice) * (trade.quantity || 0);

                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={trade.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)]/80 backdrop-blur-sm border border-[var(--border-primary)] hover:border-blue-500/40 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2.5 rounded-xl ${trade.status === 'OPEN' ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 border border-emerald-500/20' : 'bg-gradient-to-br from-rose-600/20 to-rose-600/5 border border-rose-500/20'}`}>
                            <TrendingUp className={`w-3.5 h-3.5 ${trade.status === 'OPEN' ? 'text-emerald-400' : 'text-rose-400'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{trade.symbol}</p>
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                              {trade.status === 'OPEN' ? 'BUY' : 'BOOKED'} · {trade.quantity} shares · ₹{entryPrice?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`text-sm font-bold tracking-tight ${tradePnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tradePnL >= 0 ? '+' : ''}{Math.round(tradePnL).toLocaleString()}
                          </p>
                          <p className={`text-caption mt-0.5 ${trade.status === 'OPEN' ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                            {trade.status.toLowerCase()}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tier Status Bar */}
          {user?.tier === 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-amber-500/[0.02] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 blur-[60px] pointer-events-none" />
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-600/5 border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)] tracking-tight">You're on the Free Plan</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Upgrade to Pro for unlimited scans, alerts, and detailed analysis.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUpgrade(true)} 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-[var(--text-primary)] rounded-xl text-caption hover:scale-105 transition-all shadow-lg shadow-blue-900/30 whitespace-nowrap relative z-10"
              >
                View Plans
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {showUpgrade && <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} requiredTier="pro" userEmail={user?.email} />}
    </div>
  );
};

export default UserDashboard;
