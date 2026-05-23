import React, { useState, useEffect, useCallback } from 'react';
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
  MoreVertical,
  Trash2,
  Calendar,
  ShieldAlert,
  UserPlus,
  ArrowRight,
  Settings2,
  Power,
  Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'users' | 'vouchers'>('pending');
  const [search, setSearch] = useState('');
  
  // Modals
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddVoucherModalOpen, setIsAddVoucherModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('mb_token');
    try {
      const [uRes, rRes, vRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/upgrade-requests`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/vouchers`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (uRes.ok) setUsers(await safeJsonParse(uRes));
      if (rRes.ok) setRequests(await safeJsonParse(rRes));
      if (vRes.ok) setVouchers(await safeJsonParse(vRes));
    } catch (e) {
      console.error("Admin fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if ((currentUser as any)?.role === 'admin') fetchData();
  }, [currentUser, fetchData]);

  const handleApprove = async (requestId: number) => {
    if (!window.confirm("Approve this payment and upgrade user?")) return;
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/admin/upgrade-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        await fetchData();
        setActiveTab('approved');
      } else {
        alert("Error: " + (data.error || "Failed to approve"));
      }
    } catch (e) { alert("Approval Logic Failed."); }
  };

  const handleUpdateUser = async (userId: number, data: any) => {
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      const result = await safeJsonParse(res);
      if (res.ok && !result.error) {
        alert("User Access Updated Successfully!");
        fetchData();
        setIsManageModalOpen(false);
      } else {
        alert(`Update Failed: ${result.error || 'Server Error'}`);
      }
    } catch (e: any) { alert(`Update failed: ${e.message}`); }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("DANGER: Permanently delete user and all data?")) return;
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) fetchData();
    } catch (e) { alert("Network error"); }
  };

  const filteredRequests = requests.filter(r => {
    const status = (r.status || 'pending').toLowerCase();
    const isTabMatch = activeTab === 'pending' ? status === 'pending' : status === 'approved';
    const searchLower = search.toLowerCase();
    return isTabMatch && ((r.email || '').toLowerCase().includes(searchLower) || (r.name || '').toLowerCase().includes(searchLower));
  });

  const filteredUsers = users.filter(u => 
    (u.email || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getDaysRemaining = (expiry: string) => {
    if (!expiry) return null;
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if ((currentUser as any)?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <ShieldCheck className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-black uppercase tracking-widest">Unauthorized Access</h2>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 min-h-screen">
      {/* 1. Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-600">
             <ShieldCheck className="h-4 w-4" />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none">Security Level: Admin</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Command Center</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Institutional Membership Control</p>
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
           <button onClick={() => setIsAddUserModalOpen(true)} className="p-3.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center space-x-2 text-slate-400">
              <UserPlus className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Member</span>
           </button>
           <button onClick={() => setIsAddVoucherModalOpen(true)} className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg flex items-center space-x-2">
              <Gift className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Voucher</span>
           </button>
           <button onClick={fetchData} className="p-3.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm text-slate-400">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* 2. Controls & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 w-fit overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              <Clock className="h-4 w-4" />
              <span>Pending ({requests.filter(r => r.status === 'pending').length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('approved')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'approved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>History ({requests.filter(r => r.status === 'approved').length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              <Users className="h-4 w-4" />
              <span>User Directory ({users.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('vouchers')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'vouchers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              <Gift className="h-4 w-4" />
              <span>Vouchers ({vouchers.length})</span>
            </button>
         </div>
         
         <div className="flex items-center space-x-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="flex items-center space-x-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500" />
               <span>{users.filter(u => getDaysRemaining(u.subscription_expiry) !== null && getDaysRemaining(u.subscription_expiry)! > 0).length} Active</span>
            </div>
            <div className="flex items-center space-x-2">
               <div className="h-2 w-2 rounded-full bg-red-500" />
               <span>{users.filter(u => getDaysRemaining(u.subscription_expiry) === 0).length} Expired</span>
            </div>
         </div>
      </div>

      {/* 3. Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <table className="w-full text-left">
           <thead>
             <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {activeTab === 'users' ? 'Member Profile' : activeTab === 'vouchers' ? 'Voucher Code' : 'Approval Request'}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Plan Tier</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {activeTab === 'users' ? 'Membership Validity' : activeTab === 'vouchers' ? 'Usage Matrix' : 'Transaction ID'}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {activeTab === 'vouchers' ? (
               vouchers.map(v => (
                 <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                   <td className="px-8 py-6 font-mono font-black text-slate-900 text-xs select-all">{v.code}</td>
                   <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${v.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                           {v.is_active ? 'Live' : 'Disabled'}
                        </span>
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex flex-col items-center">
                         <span className="text-[10px] font-black text-slate-900 uppercase">{v.tier}</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase">{v.duration_days} Days Access</span>
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex flex-col">
                         <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${(v.current_uses / v.max_uses) * 100}%` }} />
                         </div>
                         <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{v.current_uses} / {v.max_uses} Redemptions</span>
                      </div>
                   </td>
                   <td className="px-8 py-6 text-right">
                      {/* Controls can be added here */}
                   </td>
                 </tr>
               ))
             ) : activeTab === 'users' ? (
               filteredUsers.map(u => {
                 const days = getDaysRemaining(u.subscription_expiry);
                 return (
                  <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                       <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase italic">
                             {u.name?.substring(0,2)}
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[13px] font-black text-slate-900 leading-none">{u.name}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{u.email || u.mobile || 'No Contact'}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.1em] ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                             {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border ${u.tier === 'alpha' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : u.tier === 'pro' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                             {u.tier === 'alpha' ? <ShieldCheck className="h-3 w-3" /> : u.tier === 'pro' ? <Zap className="h-3 w-3" /> : null}
                             <span className="text-[9px] font-black uppercase">{u.tier}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2 text-slate-700">
                             <Calendar className="h-3.5 w-3.5 text-slate-300" />
                             <span className="text-[11px] font-bold font-mono">{u.subscription_expiry ? new Date(u.subscription_expiry).toLocaleDateString() : 'Unlimited'}</span>
                          </div>
                          {days !== null && (
                             <span className={`text-[8px] font-black uppercase ${days <= 3 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                                {days === 0 ? 'Expired' : `${days} Days Remaining`}
                             </span>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => { setSelectedUser(u); setIsManageModalOpen(true); }}
                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white border border-slate-100 rounded-xl shadow-sm"
                            title="Manage Access"
                          >
                             <Settings2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                          >
                             <Trash2 className="h-4 w-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                 );
               })
             ) : (
               filteredRequests.map(req => (
                <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-[13px] font-black text-slate-900 leading-none">{req.name}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{req.email || req.mobile}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {req.status}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center space-y-1">
                       <div className="flex items-center space-x-2 text-blue-600">
                          <Zap className="h-3 w-3" />
                          <span className="text-[11px] font-black uppercase">{req.requested_tier}</span>
                       </div>
                       <span className="text-[8px] font-black uppercase text-slate-400">{req.billing_cycle}</span>
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
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md active:scale-95"
                      >
                        Approve Upgrade
                      </button>
                    )}
                  </td>
                </tr>
               ))
             )}
           </tbody>
        </table>
      </div>

      {/* 4. Manage User Modal */}
      {isManageModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Modify Access</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Editing profile for {selectedUser.name}</p>
                 </div>
                 <button onClick={() => setIsManageModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-300">
                    <XCircle className="h-6 w-6" />
                 </button>
              </div>

              <form className="space-y-6" onSubmit={(e) => {
                 e.preventDefault();
                 const fd = new FormData(e.currentTarget);
                 handleUpdateUser(selectedUser.id, {
                    tier: fd.get('tier'),
                    subscription_start: fd.get('start'),
                    subscription_expiry: fd.get('expiry'),
                    is_active: fd.get('active') === 'true' ? 1 : 0
                 });
              }}>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Plan Tier</label>
                       <select name="tier" defaultValue={selectedUser.tier} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black uppercase outline-none focus:bg-white transition-all">
                          <option value="free">Free</option>
                          <option value="pro">Pro (₹99)</option>
                          <option value="alpha">Alpha (₹199)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Account Status</label>
                       <select name="active" defaultValue={String(!!selectedUser.is_active)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black uppercase outline-none focus:bg-white transition-all">
                          <option value="true">Active (Verified)</option>
                          <option value="false">Suspended / Deactivated</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 text-blue-600">Start Date</label>
                       <input type="date" name="start" defaultValue={selectedUser.subscription_start?.split('T')[0]} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black outline-none focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 text-rose-600">Expiry Date</label>
                       <input type="date" name="expiry" defaultValue={selectedUser.subscription_expiry?.split('T')[0]} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black outline-none focus:bg-white transition-all" />
                    </div>
                 </div>

                 <div className="bg-amber-50 rounded-2xl p-4 flex items-start space-x-3 border border-amber-100">
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-bold text-amber-700 leading-relaxed uppercase">Manual overrides bypass payment verification. Ensure date consistency to avoid user access issues.</p>
                 </div>

                 <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">Commit Changes</button>
              </form>
           </div>
        </div>
      )}

      {/* 5. Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Onboard Member</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Database Injection</p>
                 </div>
                 <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-300">
                    <XCircle className="h-6 w-6" />
                 </button>
              </div>

              <form className="space-y-6" onSubmit={async (e) => {
                 e.preventDefault();
                 const fd = new FormData(e.currentTarget);
                 try {
                    const res = await fetch(`${API_URL}/api/auth/register`, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                          name: fd.get('name'),
                          email: fd.get('email'),
                          password: fd.get('password') || 'MarketBeacon2026',
                          role: fd.get('role')
                       })
                    });
                    const data = await safeJsonParse(res);
                    if (res.ok && !data.error) {
                       fetchData();
                       setIsAddUserModalOpen(false);
                    } else { alert(data.error || "Failed to onboard user."); }
                 } catch (e) { alert("Registration endpoint failed"); }
              }}>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Full Name</label>
                       <input type="text" name="name" required placeholder="Institutional Identity" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black outline-none focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Email or Mobile</label>
                       <input type="text" name="email" required placeholder="contact@marketbeacon.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black outline-none focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Initial Role</label>
                          <select name="role" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black uppercase outline-none focus:bg-white transition-all">
                             <option value="user">Retail User</option>
                             <option value="admin">System Admin</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 text-slate-400">Temp Password</label>
                          <input type="text" name="password" placeholder="Auto-generated" className="w-full bg-slate-100 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black outline-none cursor-not-allowed" disabled value="MarketBeacon2026" />
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2">
                    <span>Onboard Now</span>
                    <ArrowRight className="h-4 w-4" />
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* 6. Add Voucher Modal */}
      {isAddVoucherModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Create Voucher</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trial Pass Generation</p>
                 </div>
                 <button onClick={() => setIsAddVoucherModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-300">
                    <XCircle className="h-6 w-6" />
                 </button>
              </div>

              <form className="space-y-6" onSubmit={async (e) => {
                 e.preventDefault();
                 const fd = new FormData(e.currentTarget);
                 const token = localStorage.getItem('mb_token');
                 try {
                    const res = await fetch(`${API_URL}/api/admin/vouchers`, {
                       method: 'POST',
                       headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                          code: fd.get('code'),
                          tier: fd.get('tier'),
                          duration_days: parseInt(fd.get('days') as string),
                          max_uses: parseInt(fd.get('uses') as string)
                       })
                    });
                    const data = await safeJsonParse(res);
                    if (res.ok && !data.error) {
                       fetchData();
                       setIsAddVoucherModalOpen(false);
                    } else { alert(data.error || "Failed to create voucher"); }
                 } catch (e) { alert("Voucher creation failed"); }
              }}>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Voucher Code</label>
                       <input type="text" name="code" required placeholder="e.g. ALPHA7DAY" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black uppercase outline-none focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Reward Tier</label>
                          <select name="tier" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black uppercase outline-none focus:bg-white transition-all">
                             <option value="alpha">Alpha Access</option>
                             <option value="pro">Pro Access</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Duration</label>
                          <select name="days" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black uppercase outline-none focus:bg-white transition-all">
                             <option value="7">7 Days (Standard)</option>
                             <option value="3">3 Days (Quick)</option>
                             <option value="30">30 Days (VIP)</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Max Redemptions</label>
                       <input type="number" name="uses" defaultValue="100" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-black outline-none focus:bg-white transition-all shadow-inner" />
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2">
                    <span>Generate Voucher</span>
                    <ArrowRight className="h-4 w-4" />
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
