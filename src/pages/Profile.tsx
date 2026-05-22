import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Trophy, 
  Activity, 
  Settings, 
  Key, 
  ExternalLink,
  Wallet,
  Clock,
  Briefcase,
  ChevronRight,
  Target,
  LogOut,
  RefreshCw,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      } else {
        console.error('Profile fetch failed with status:', res.status);
      }
    } catch (e) {
      console.error('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!profileData) return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen space-y-4">
       <ShieldCheck className="h-12 w-12 text-slate-200" />
       <h2 className="text-xl font-black text-slate-900 uppercase italic">Profile Unavailable</h2>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Please try logging in again</p>
       <button onClick={logout} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Logout</button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 py-6 md:py-8 px-4 md:px-10 space-y-6 md:space-y-8 overflow-y-auto font-sans bg-[#f8fafc]">
      
      {/* 1. Profile Hero Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-slate-200 pb-10">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:space-x-8 text-center sm:text-left">
           <div className="relative group">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-500">
                 <User className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-emerald-500 text-white p-1 rounded-lg md:rounded-xl border-2 md:border-4 border-white">
                 <ShieldCheck className="h-3 w-3 md:h-4 md:w-4" />
              </div>
           </div>
           
           <div className="space-y-1">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-3">
                 <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{profileData.name}</h1>
                 <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-amber-500/20">PRO Member</span>
              </div>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                 <Clock className="h-3 w-3" />
                 <span>Member Since: {new Date(profileData.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </p>
           </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4 w-full md:w-auto justify-center">
           <button 
             onClick={() => window.location.reload()}
             className="p-3 md:p-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
           >
              <RefreshCw className="h-5 w-5" />
           </button>
           <button 
             onClick={logout}
             className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-3 shadow-xl hover:bg-slate-800 transition-all"
           >
              <LogOut className="h-4 w-4" />
              <span>Terminate Session</span>
           </button>
        </div>
      </div>

      {/* 2. Trading DNA (Lifetime Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
            <Activity className="absolute right-6 top-6 h-5 w-5 md:h-6 md:w-6 text-blue-100 group-hover:text-blue-500 transition-colors" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Trades</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">{profileData.stats.totalTrades}</h3>
            <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
               <div className="h-full bg-blue-600 rounded-full" style={{ width: '70%' }} />
            </div>
         </div>
         
         <div className="bg-slate-900 rounded-[2rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <Wallet className="absolute right-[-10px] bottom-[-10px] h-20 w-20 opacity-10" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Realized P&L</p>
            <h3 className={`text-2xl md:text-3xl font-black ${profileData.stats.totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
               ₹{Math.abs(profileData.stats.totalRealizedPnL).toLocaleString()}
            </h3>
            <span className="text-[9px] font-bold text-slate-500 uppercase mt-2 block tracking-widest">Net Career Gain</span>
         </div>

         <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Exposure</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">{profileData.stats.openTrades}</h3>
            <p className="text-[9px] font-bold text-blue-500 uppercase mt-2 tracking-widest flex items-center">
               <Briefcase className="h-2.5 w-2.5 mr-1" />
               <span>Open Positions</span>
            </p>
         </div>

         <div className="bg-slate-900 rounded-[2rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <Trophy className="absolute right-6 top-6 h-6 w-6 opacity-20" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Research Accuracy</p>
            <h3 className="text-2xl md:text-3xl font-black text-indigo-400">68.4%</h3>
            <p className="text-[9px] font-bold uppercase mt-2 italic opacity-50">Institutional Model Metric</p>
         </div>
      </div>

      {/* 3. Account Settings & Identity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-7 space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
               <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center space-x-3">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <span>Terminal Preferences</span>
               </h2>
               
               <div className="space-y-8">
                  <div className="flex items-center justify-between py-4 border-b border-slate-50">
                     <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Data Density</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Optimize workspace for professional screen size</p>
                     </div>
                     <div className="w-12 h-6 bg-blue-600 rounded-full p-1 flex items-center justify-end cursor-pointer">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                     </div>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-slate-50">
                     <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Default Target %</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Automatic profit objective for new signals</p>
                     </div>
                     <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black focus:ring-1 focus:ring-blue-500/20 appearance-none">
                        <option>25.0%</option>
                        <option>30.0%</option>
                        <option>50.0%</option>
                     </select>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-slate-50">
                     <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Global Currency</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Set base denomination for all ledgers</p>
                     </div>
                     <span className="text-xs font-black text-slate-900 px-4 py-2 bg-slate-50 rounded-xl">INR (₹)</span>
                  </div>
               </div>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
               <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center space-x-3">
                  <Key className="h-4 w-4 text-blue-600" />
                  <span>Security Protocol</span>
               </h2>
               <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Update Master Password</span>
                     <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                  </button>
                  <button className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Enable Two-Factor Auth (2FA)</span>
                     <div className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[8px] font-black rounded uppercase">Coming Soon</div>
                  </button>
               </div>
            </section>
         </div>

         <div className="lg:col-span-5 space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl border border-slate-800 relative overflow-hidden">
               <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-widest italic">Identity Metadata</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Encrypted Account Details</p>
               </div>
               
               <div className="space-y-6">
                  {profileData.email && (
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Verified Email</p>
                       <p className="text-sm font-bold text-blue-100 flex items-center space-x-2">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{profileData.email}</span>
                       </p>
                    </div>
                  )}
                  {profileData.mobile && (
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Verified Mobile</p>
                       <p className="text-sm font-bold text-blue-100 flex items-center space-x-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>+91 {profileData.mobile}</span>
                       </p>
                    </div>
                  )}
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Account UID</p>
                     <p className="text-sm font-mono font-bold text-slate-300">MB-TERM-{profileData.id.toString().padStart(4, '0')}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Tier</p>
                     <p className="text-sm font-black text-emerald-400 uppercase italic">Institutional Pro v4.5</p>
                  </div>
               </div>

               <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-500 uppercase">System Status</span>
                     <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                        Operational
                     </span>
                  </div>
                  <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10">
                     <ExternalLink className="h-4 w-4 text-blue-400" />
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Subscription Node</h3>
               <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-xs font-black text-blue-900 uppercase tracking-tight">Enterprise Access</p>
                     <p className="text-[8px] font-bold text-blue-600 uppercase">No Expiry • Managed Node</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-200" />
               </div>
            </div>
         </div>
      </div>

      <footer className="py-8 border-t border-slate-200 opacity-40 flex items-center justify-between shrink-0">
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MarketBeacon Terminal v4.5-PRO • Privacy Guard Active</p>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Security Hash: 0X4F-TERM-SEC</p>
      </footer>
    </div>
  );
};

export default ProfilePage;
