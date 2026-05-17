import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle,
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('requests');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('mb_token');
    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/upgrade-requests`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (uRes.ok) setUsers(await uRes.json());
      if (rRes.ok) setRequests(await rRes.json());
    } catch (e) {
      console.error("Admin fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ((user as any)?.role === 'admin') fetchData();
  }, [user]);

  const handleApprove = async (requestId: number) => {
    if (!window.confirm("Approve this payment and upgrade user?")) return;
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/admin/upgrade-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (e) { alert("Approval failed"); }
  };

  const handleUpdateTier = async (userId: number, tier: string) => {
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/tier`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ tier })
      });
      if (res.ok) fetchData();
    } catch (e) { alert("Tier update failed"); }
  };

  if ((user as any)?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <ShieldCheck className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-black uppercase tracking-widest">Unauthorized Access</h2>
        <p className="text-slate-400 font-bold text-xs uppercase">Admin Privileges Required</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Command Center</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Access Management & User Audit</p>
        </div>
        <div className="flex items-center space-x-3">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search Database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-[11px] font-black uppercase tracking-widest focus:bg-white transition-all w-64 shadow-inner"
              />
           </div>
           <button onClick={fetchData} className="p-3.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
              <RefreshCw className={`h-4 w-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 w-fit">
         <button 
           onClick={() => setActiveTab('requests')}
           className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
         >
           <Clock className="h-4 w-4" />
           <span>Upgrade Requests ({requests.filter(r => r.status === 'pending').length})</span>
         </button>
         <button 
           onClick={() => setActiveTab('users')}
           className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
         >
           <Users className="h-4 w-4" />
           <span>User Directory ({users.length})</span>
         </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {activeTab === 'requests' ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested Tier</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction UTR</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest italic text-xs">No pending requests</td></tr>
              ) : requests.map((req) => (
                <tr key={req.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {req.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-[13px] font-black text-slate-900 leading-none">{req.name}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{req.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col space-y-1">
                       <div className="flex items-center space-x-2">
                          {req.requested_tier === 'alpha' ? <ShieldCheck className="h-4 w-4 text-slate-900" /> : <Zap className="h-4 w-4 text-blue-600" />}
                          <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{req.requested_tier}</span>
                       </div>
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded w-fit ${req.billing_cycle === 'yearly' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {req.billing_cycle || 'monthly'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-slate-500">
                       <CreditCard className="h-4 w-4" />
                       <span className="text-xs font-mono font-bold tracking-tight select-all">{req.transaction_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {req.status === 'pending' && (
                      <button 
                        onClick={() => handleApprove(req.id)}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                      >
                        Approve Upgrade
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Active Tier</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 text-[10px] font-bold text-slate-300">#{u.id}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-[13px] font-black text-slate-900 leading-none">{u.name}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                          {u.role}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                       <select 
                         value={u.tier}
                         onChange={(e) => handleUpdateTier(u.id, e.target.value)}
                         className="appearance-none bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                       >
                         <option value="free">Free</option>
                         <option value="pro">Pro (₹99)</option>
                         <option value="alpha">Alpha (₹199)</option>
                       </select>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                       <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32" />
        <div className="z-10 space-y-2 text-center md:text-left">
          <h2 className="text-2xl font-black tracking-tight uppercase italic">Admin Risk Notice</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] max-w-xl">
            Upgrading users grants access to high-conviction research modules. Always verify Transaction IDs manually before approval.
          </p>
        </div>
        <div className="z-10 flex items-center space-x-4">
           <ShieldCheck className="h-10 w-10 text-blue-500" />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
