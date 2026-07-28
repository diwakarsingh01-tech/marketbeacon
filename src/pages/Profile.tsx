import React, { useState, useEffect, useCallback } from 'react';
import SEO from '../components/SEO';
import { 
  User, Mail, ShieldCheck, Trophy, Activity, Settings, Key, ExternalLink,
  Wallet, Clock, Briefcase, ChevronRight, Target, LogOut, RefreshCw, Phone,
  X, CheckCircle2, Smartphone, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { safeJsonParse, getApiUrl, getAuthHeaders } from '../lib/api-utils';

const API_URL = getApiUrl();

const TIER_LABELS: Record<string, string> = {
  free: 'Free Explorer',
  pro: 'Institutional Pro',
  alpha: 'Alpha Architect',
};

const TIER_COLORS: Record<string, { badge: string; sub: string }> = {
  free: { badge: 'text-slate-400 bg-slate-500/10 border-slate-500/20', sub: 'Basic Access • No Expiry' },
  pro: { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', sub: 'No Expiry • Managed Node' },
  alpha: { badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20', sub: 'Alpha Tier • Full Access' },
};

const ProfilePage: React.FC = () => {
  const { logout } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [dataDensity, setDataDensity] = useState(() => localStorage.getItem('mb_data_density') !== 'off');
  const [defaultObjective, setDefaultObjective] = useState(() => localStorage.getItem('mb_default_obj') || '25.0%');
  const [globalCurrency, setGlobalCurrency] = useState(() => localStorage.getItem('mb_currency') || 'INR (₹)');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [show2faModal, setShow2faModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [twoFaSecret, setTwoFaSecret] = useState('');
  const [twoFaToken, setTwoFaToken] = useState('');
  const [twoFaStep, setTwoFaStep] = useState<'start' | 'verify' | 'disable'>('start');
  const [twoFaError, setTwoFaError] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        headers: { ...getAuthHeaders() }
      });
      const data = await safeJsonParse(res);
      if (res.status === 401 || res.status === 403 || data?.error === 'Invalid token.' || data?.error === 'Access denied.') {
        window.location.href = '/login';
        return;
      }
      if (res.ok && !data.error) setProfileData(data);
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleToggleDensity = () => {
    const next = !dataDensity;
    setDataDensity(next);
    localStorage.setItem('mb_data_density', next ? 'on' : 'off');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwNew !== pwConfirm) { setPwError('New passwords do not match'); return; }
    if (pwNew.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew })
      });
      const data = await safeJsonParse(res);
      if (!res.ok || data.error) { setPwError(data.error || 'Failed to update password'); return; }
      setPwSuccess('Password updated successfully');
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch { setPwError('Network error'); }
    finally { setPwLoading(false); }
  };

  const handle2faSetup = async () => {
    setTwoFaError('');
    setTwoFaLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/2fa/setup`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
      const data = await safeJsonParse(res);
      if (!res.ok || data.error) { setTwoFaError(data.error || 'Setup failed'); return; }
      setQrDataUrl(data.qrDataUrl);
      setTwoFaSecret(data.secret);
      setTwoFaStep('verify');
    } catch { setTwoFaError('Network error'); }
    finally { setTwoFaLoading(false); }
  };

  const handle2faVerify = async () => {
    setTwoFaError('');
    if (!twoFaToken) { setTwoFaError('Enter the 6-digit code from your authenticator app'); return; }
    setTwoFaLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ token: twoFaToken })
      });
      const data = await safeJsonParse(res);
      if (!res.ok || data.error) { setTwoFaError(data.error || 'Verification failed'); return; }
      setProfileData((prev: any) => ({ ...prev, 'twofa_enabled': 1 }));
      setShow2faModal(false);
      setTwoFaStep('start');
      setTwoFaToken('');
    } catch { setTwoFaError('Network error'); }
    finally { setTwoFaLoading(false); }
  };

  const handle2faDisable = async () => {
    setTwoFaLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/2fa/disable`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
      const data = await safeJsonParse(res);
      if (!res.ok || data.error) { setTwoFaError(data.error || 'Disable failed'); return; }
      setProfileData((prev: any) => ({ ...prev, 'twofa_enabled': 0 }));
      setShow2faModal(false);
      setTwoFaStep('start');
    } catch { setTwoFaError('Network error'); }
    finally { setTwoFaLoading(false); }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
       <div className="w-12 h-12 border-4 border-[var(--border-primary)] border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (!profileData) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen space-y-4 bg-[var(--bg-primary)]">
       <ShieldCheck className="h-12 w-12 text-[var(--text-tertiary)]" />
       <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase italic">Profile Unavailable</h2>
       <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Please try logging in again</p>
       <button onClick={logout} className="px-8 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl text-caption border border-[var(--border-primary)]">Logout</button>
    </div>
  );

  const tier = (profileData.tier || 'free').toLowerCase();
  const winRate = profileData.stats?.winRate ?? 0;
  const tierInfo = TIER_COLORS[tier] || TIER_COLORS.free;
  const tierLabel = TIER_LABELS[tier] || 'Free Explorer';
  const twoFaEnabled = !!(profileData as any)['twofa_enabled'];

  return (
    <>
      <SEO title="Profile" description="Manage your MarketBeacon Pro account, API keys, and preferences." url="/profile" noindex />
      <div className="flex-1 flex flex-col min-h-0 py-6 md:py-8 px-4 md:px-8 lg:px-10 space-y-6 md:space-y-8 overflow-y-auto font-sans bg-[var(--bg-primary)]">
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-[var(--border-primary)] pb-10">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:space-x-8 text-center sm:text-left">
           <div className="relative group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-500">
                 <User className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-emerald-500 text-white p-1 rounded-lg md:rounded-xl border-2 md:border-4 border-[var(--bg-primary)]">
                 <ShieldCheck className="h-3 w-3 md:h-4 md:w-4" />
              </div>
           </div>
           <div className="space-y-1">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-3">
                 <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tighter uppercase italic">{profileData.name}</h1>
                 <span className={`px-3 py-1 text-caption rounded-lg shadow-lg ${tierInfo.badge}`}>{tierLabel}</span>
              </div>
              <p className="text-xs md:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center space-x-2">
                 <Clock className="h-3 w-3" />
                 <span>Member Since: {new Date(profileData.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </p>
           </div>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4 w-full md:w-auto justify-center">
           <button onClick={fetchProfile} className="p-3 md:p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl md:rounded-2xl text-[var(--text-secondary)] hover:text-blue-400 hover:border-blue-500/20 transition-all">
              <RefreshCw className="h-5 w-5" />
           </button>
           <button onClick={logout} className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl md:rounded-2xl text-caption flex items-center justify-center space-x-3 shadow-xl border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-all">
              <LogOut className="h-4 w-4" />
              <span>Terminate Session</span>
           </button>
        </div>
      </div>

      {/* 2. Trading DNA (Lifetime Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         <div className="bg-[var(--bg-secondary)] rounded-[2rem] p-6 md:p-8 border border-[var(--border-primary)] shadow-sm relative overflow-hidden group">
            <Activity className="absolute right-6 top-6 h-5 w-5 md:h-6 md:w-6 text-[var(--text-tertiary)] group-hover:text-blue-500 transition-colors" />
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Lifetime Trades</p>
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{profileData.stats.totalTrades}</h3>
            <div className="mt-4 h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${Math.min(winRate, 100)}%` }} />
            </div>
            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-2">{profileData.stats.closedTrades} closed · {winRate}% win rate</p>
         </div>
         <div className="bg-[var(--bg-secondary)] rounded-[2rem] p-6 md:p-8 border border-[var(--border-primary)] shadow-sm relative overflow-hidden">
            <Wallet className="absolute right-[-10px] bottom-[-10px] h-20 w-20 opacity-10 text-[var(--text-tertiary)]" />
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Total Realized P&L</p>
            <h3 className={`text-2xl md:text-3xl font-bold ${profileData.stats.totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
               {profileData.stats.totalRealizedPnL >= 0 ? '+' : '-'}₹{Math.abs(profileData.stats.totalRealizedPnL).toLocaleString()}
            </h3>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase mt-2 block tracking-wider">Net Career Gain</span>
         </div>
         <div className="bg-[var(--bg-secondary)] rounded-[2rem] p-6 md:p-8 border border-[var(--border-primary)] shadow-sm">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Active Exposure</p>
            <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{profileData.stats.openTrades}</h3>
            <p className="text-xs font-bold text-blue-400 uppercase mt-2 tracking-wider flex items-center">
               <Briefcase className="h-2.5 w-2.5 mr-1" />
               <span>Open Positions</span>
            </p>
         </div>
         <div className="bg-[var(--bg-secondary)] rounded-[2rem] p-6 md:p-8 border border-[var(--border-primary)] shadow-sm relative overflow-hidden">
            <Trophy className="absolute right-6 top-6 h-6 w-6 opacity-20 text-[var(--text-tertiary)]" />
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Research Accuracy</p>
            <h3 className={`text-2xl md:text-3xl font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>{winRate}%</h3>
            <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mt-2 italic">{profileData.stats.winningTrades} of {profileData.stats.closedTrades} closed trades profitable</p>
         </div>
      </div>

      {/* 3. Account Settings & Identity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-7 space-y-8">
            <section className="bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border-primary)] shadow-sm p-10">
<h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] mb-8 flex items-center space-x-3">
                  <Settings className="h-4 w-4 text-blue-400" />
                  <span>Terminal Preferences</span>
                </h2>
               <div className="space-y-8">
                  <div className="flex items-center justify-between py-4 border-b border-[var(--border-primary)]">
                     <div className="space-y-1">
                        <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Data Density</p>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Optimize workspace for professional screen size</p>
                     </div>
                     <div onClick={handleToggleDensity} className={`w-12 h-6 rounded-full p-1 flex items-center cursor-pointer transition-all ${dataDensity ? 'bg-blue-600 justify-end' : 'bg-[var(--bg-tertiary)] justify-start border border-[var(--border-primary)]'}`}>
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm transition-all" />
                     </div>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-[var(--border-primary)]">
                     <div className="space-y-1">
                        <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Default Objective %</p>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Automatic profit objective for new research</p>
                     </div>
                     <select value={defaultObjective} onChange={(e) => { setDefaultObjective(e.target.value); localStorage.setItem('mb_default_obj', e.target.value); }} className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-2 text-xs font-bold text-[var(--text-primary)] focus:ring-1 focus:ring-blue-500/20 appearance-none cursor-pointer">
                        <option>25.0%</option>
                        <option>30.0%</option>
                        <option>50.0%</option>
                     </select>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-[var(--border-primary)]">
                     <div className="space-y-1">
                        <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Global Currency</p>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Set base denomination for all ledgers</p>
                     </div>
                     <select value={globalCurrency} onChange={(e) => { setGlobalCurrency(e.target.value); localStorage.setItem('mb_currency', e.target.value); }} className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 py-2 text-xs font-bold text-[var(--text-primary)] focus:ring-1 focus:ring-blue-500/20 appearance-none cursor-pointer">
                        <option>INR (₹)</option>
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                     </select>
                  </div>
               </div>
            </section>

            <section className="bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border-primary)] shadow-sm p-10">
<h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] mb-8 flex items-center space-x-3">
                  <Key className="h-4 w-4 text-blue-400" />
                  <span>Security Protocol</span>
                </h2>
               <div className="space-y-4">
                  <button onClick={() => { setPwError(''); setPwSuccess(''); setPwCurrent(''); setPwNew(''); setPwConfirm(''); setShowPasswordModal(true); }} className="w-full flex items-center justify-between p-5 bg-[var(--bg-tertiary)] rounded-2xl hover:bg-[var(--bg-secondary)] transition-all group border border-[var(--border-primary)]">
                     <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Update Master Password</span>
                     <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </button>
                  <button onClick={() => { setTwoFaError(''); setTwoFaStep(twoFaEnabled ? 'disable' : 'start'); setShow2faModal(true); }} className="w-full flex items-center justify-between p-5 bg-[var(--bg-tertiary)] rounded-2xl hover:bg-[var(--bg-secondary)] transition-all group border border-[var(--border-primary)]">
                     <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Two-Factor Auth (2FA)</span>
                        {twoFaEnabled ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded uppercase border border-emerald-500/20">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-xs font-bold rounded uppercase border border-[var(--border-primary)]">Setup</span>
                        )}
                     </div>
                     <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </button>
               </div>
            </section>
         </div>

         <div className="lg:col-span-5 space-y-8">
            <div className="bg-[var(--bg-secondary)] rounded-[2.5rem] p-10 text-[var(--text-primary)] space-y-8 shadow-2xl border border-[var(--border-primary)] relative overflow-hidden">
               <div className="space-y-1">
                  <h3 className="text-xl font-bold uppercase tracking-wider italic">Identity Metadata</h3>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Encrypted Account Details</p>
               </div>
               <div className="space-y-6">
                  {profileData.email && (
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Verified Email</p>
                       <p className="text-sm font-bold text-blue-300 flex items-center space-x-2">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{profileData.email}</span>
                       </p>
                    </div>
                  )}
                  {profileData.mobile && (
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Verified Mobile</p>
                       <p className="text-sm font-bold text-blue-300 flex items-center space-x-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>+91 {profileData.mobile}</span>
                       </p>
                    </div>
                  )}
                  <div className="space-y-1">
                     <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Account UID</p>
                     <p className="text-sm font-mono font-bold text-[var(--text-tertiary)]">MB-TERM-{profileData.id.toString().padStart(4, '0')}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Deployment Tier</p>
                     <p className={`text-sm font-bold uppercase italic ${tier === 'pro' ? 'text-amber-400' : tier === 'alpha' ? 'text-purple-400' : 'text-[var(--text-secondary)]'}`}>{tierLabel}</p>
                  </div>
               </div>
               <div className="pt-8 border-t border-[var(--border-primary)] flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">System Status</span>
                     <span className="text-xs font-bold text-emerald-400 uppercase flex items-center">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                        Operational
                     </span>
                  </div>
                  <button className="p-3 bg-[var(--bg-tertiary)] rounded-xl hover:bg-[var(--bg-secondary)] transition-all border border-[var(--border-primary)]">
                     <ExternalLink className="h-4 w-4 text-blue-400" />
                  </button>
               </div>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border-primary)] shadow-sm p-10">
               <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6">Subscription Node</h3>
               <div className={`p-6 rounded-3xl border flex items-center justify-between ${tier === 'pro' ? 'bg-amber-500/10 border-amber-500/20' : tier === 'alpha' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)]'}`}>
                  <div className="space-y-1">
                     <p className={`text-xs font-bold uppercase tracking-tight ${tier === 'pro' ? 'text-amber-300' : tier === 'alpha' ? 'text-purple-300' : 'text-[var(--text-secondary)]'}`}>{tierLabel}</p>
                     <p className={`text-xs font-bold uppercase ${tier === 'pro' || tier === 'alpha' ? 'text-blue-400' : 'text-[var(--text-tertiary)]'}`}>{tierInfo.sub}</p>
                  </div>
                  <Target className={`h-8 w-8 ${tier === 'pro' ? 'text-amber-500/30' : tier === 'alpha' ? 'text-purple-500/30' : 'text-[var(--text-tertiary)]/30'}`} />
               </div>
            </div>
         </div>
      </div>

      <footer className="py-8 border-t border-[var(--border-primary)] opacity-40 flex items-center justify-between shrink-0">
         <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">MarketBeacon Terminal v4.5-PRO • Privacy Guard Active</p>
         <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Global Security Hash: 0X4F-TERM-SEC</p>
      </footer>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[var(--bg-primary)]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[var(--bg-secondary)] w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 border border-[var(--border-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4 mb-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase italic leading-none">Update Password</h3>
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-1">Master Credential</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-all"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-5">
              {pwError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-caption flex items-center space-x-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span>{pwError}</span></div>}
              {pwSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-caption flex items-center space-x-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /><span>{pwSuccess}</span></div>}
              <div>
                <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-2 block">Current Password</label>
                <input type="password" required value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-6 py-4 text-sm font-bold focus:border-blue-500 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-2 block">New Password</label>
                <input type="password" required value={pwNew} onChange={e => setPwNew(e.target.value)} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-6 py-4 text-sm font-bold focus:border-blue-500 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-2 block">Confirm New Password</label>
                <input type="password" required value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-6 py-4 text-sm font-bold focus:border-blue-500 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
              </div>
              <button type="submit" disabled={pwLoading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20">
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2faModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[var(--bg-primary)]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[var(--bg-secondary)] w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 border border-[var(--border-primary)]">
            <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4 mb-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase italic leading-none">Two-Factor Auth</h3>
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-1">{twoFaEnabled ? 'Manage 2FA' : 'Setup 2FA'}</p>
              </div>
              <button onClick={() => { setShow2faModal(false); setTwoFaStep('start'); setTwoFaToken(''); }} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-all"><X className="h-5 w-5" /></button>
            </div>

            {twoFaError && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-caption flex items-center space-x-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /><span>{twoFaError}</span></div>}

            {twoFaStep === 'start' && !twoFaEnabled && (
              <div className="space-y-5">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs font-bold leading-relaxed flex items-start space-x-3">
                  <Smartphone className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Scan the QR code with Google Authenticator or Authy to generate time-based codes for secure login.</span>
                </div>
                <button onClick={handle2faSetup} disabled={twoFaLoading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20">
                  {twoFaLoading ? 'Generating...' : 'Generate QR Code'}
                </button>
              </div>
            )}

            {twoFaStep === 'verify' && (
              <div className="space-y-5">
                {qrDataUrl && <img src={qrDataUrl} alt="2FA QR Code" className="mx-auto w-48 h-48 rounded-xl border border-[var(--border-primary)]" />}
                {twoFaSecret && <p className="text-center text-xs font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Or enter manually: <span className="text-[var(--text-primary)] text-xs tracking-normal">{twoFaSecret}</span></p>}
                <div>
                  <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider ml-1 mb-2 block">Authentication Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={twoFaToken} onChange={e => setTwoFaToken(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-6 py-4 text-center text-xl font-bold tracking-[0.3em] focus:border-blue-500 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
                </div>
                <button onClick={handle2faVerify} disabled={twoFaLoading || twoFaToken.length !== 6} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                  {twoFaLoading ? 'Verifying...' : 'Enable 2FA'}
                </button>
              </div>
            )}

            {twoFaStep === 'disable' && twoFaEnabled && (
              <div className="space-y-5">
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold leading-relaxed flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Disabling 2FA will remove this extra security layer. Your account will only be protected by your password.</span>
                </div>
                <button onClick={handle2faDisable} disabled={twoFaLoading} className="w-full py-5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-rose-500/20">
                  {twoFaLoading ? 'Disabling...' : 'Disable 2FA'}
                </button>
                <button onClick={() => setShow2faModal(false)} className="w-full py-3 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-2xl text-caption border border-[var(--border-primary)] hover:text-[var(--text-primary)] transition-all">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ProfilePage;
