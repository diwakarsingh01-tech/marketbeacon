import React, { useState, useEffect, useCallback } from 'react';
import AdminBlog from '../components/AdminBlog';
import {
  Users, 
  ShieldCheck, 
  Zap, 
  Clock, 
  XCircle,
  CreditCard,
  RefreshCw,
  Search,
  Trash2,
  Calendar,
  UserPlus,
  Settings2,
  Gift,
  MessageSquare,
  Star,
  X,
  FileText,
  Activity,
  ScrollText,
  Download,
  Copy,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { toast } from 'sonner';
import type { AdminUser, Feedback, Voucher, WaitlistEntry, UpgradeRequest } from '../types';

const API_URL = getApiUrl();

type MainTab = 'approvals' | 'users' | 'vouchers' | 'feedback' | 'waitlist' | 'blog' | 'health' | 'audit';
type UserFilter = 'all' | 'active' | 'expired' | 'free';

const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<MainTab>('approvals');
  const [approvalSubTab, setApprovalSubTab] = useState<'pending' | 'approved'>('pending');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [search, setSearch] = useState('');
  
  // Modals & Drawers
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [isAddVoucherModalOpen, setIsAddVoucherModalOpen] = useState(false);
  const [newVoucherCode, setNewVoucherCode] = useState('');
  
  const [healthData, setHealthData] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  // Clear page on tab change
  useEffect(() => {
    setPage(1);
  }, [activeTab, approvalSubTab, userFilter]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        fetch(`${API_URL}/api/admin/users`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/upgrade-requests`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/vouchers`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/feedback`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/waitlist`, { credentials: 'include' })
      ]);

      const [uRes, rRes, vRes, fRes, wRes] = results.map(r => r.status === 'fulfilled' ? r.value : null);

      if ((uRes && (uRes.status === 401 || uRes.status === 403))
        || (rRes && (rRes.status === 401 || rRes.status === 403))
        || (vRes && (vRes.status === 401 || vRes.status === 403))
        || (fRes && (fRes.status === 401 || fRes.status === 403))) {
        window.location.href = '/login';
        return;
      }

      if (uRes?.ok) {
        const data = await safeJsonParse(uRes);
        setUsers(Array.isArray(data) ? data : []);
      }
      if (rRes?.ok) {
        const data = await safeJsonParse(rRes);
        setRequests(Array.isArray(data) ? data : []);
      }
      if (vRes?.ok) {
        const data = await safeJsonParse(vRes);
        setVouchers(Array.isArray(data) ? data : []);
      }
      if (fRes?.ok) {
        const data = await safeJsonParse(fRes);
        setFeedbacks(Array.isArray(data) ? data : []);
      }
      if (wRes?.ok) {
        const data = await safeJsonParse(wRes);
        setWaitlist(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Admin fetch failed:", e);
      toast.error("Failed to sync database records");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') fetchData();
  }, [currentUser, fetchData]);

  const fetchWaitlist = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/waitlist`, { credentials: 'include' });
      const data = await safeJsonParse(res);
      if (res.ok) setWaitlist(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  const fetchHealthData = async () => {
    setIsHealthLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/health-check`, { credentials: 'include' });
      if (res.ok) setHealthData(await safeJsonParse(res));
    } catch (e) { toast.error("Health check failed"); }
    finally { setIsHealthLoading(false); }
  };

  const fetchAuditData = async () => {
    setIsAuditLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/audit/latest`, { credentials: 'include' });
      if (res.ok) setAuditData(await safeJsonParse(res));
    } catch (e) { toast.error("Audit fetch failed"); }
    finally { setIsAuditLoading(false); }
  };

  const runAudit = async () => {
    setIsAuditLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/audit/run`, { method: 'POST', credentials: 'include' });
      if (res.ok) { setAuditData(await safeJsonParse(res)); toast.success("Audit run complete"); }
    } catch (e) { toast.error("Audit run failed"); }
    finally { setIsAuditLoading(false); }
  };

  // Helper date calculations
  const getDaysRemaining = (expiry?: string) => {
    if (!expiry) return null;
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const isUserActivePaid = (u: AdminUser) => {
    if (u.tier === 'free') return false;
    if (!u.subscription_expiry) return true; // Lifetime/Unlimited
    return new Date(u.subscription_expiry) > new Date();
  };

  const isUserExpired = (u: AdminUser) => {
    if (!u.subscription_expiry) return false;
    return new Date(u.subscription_expiry) <= new Date();
  };

  // Derived Top Metrics
  const activePaidUsersCount = users.filter(isUserActivePaid).length;
  const expiredUsersCount = users.filter(isUserExpired).length;
  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;
  const pendingWaitlistCount = waitlist.filter(w => w.status === 'pending').length;
  const totalPendingApprovals = pendingRequestsCount + pendingWaitlistCount;

  // Filtered Datasets
  const filteredUsers = users.filter(u => {
    if (!u) return false;
    const matchesSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (u.mobile || '').toLowerCase().includes(search.toLowerCase()) ||
                          String(u.id).includes(search);
    if (!matchesSearch) return false;

    if (userFilter === 'active') return isUserActivePaid(u);
    if (userFilter === 'expired') return isUserExpired(u);
    if (userFilter === 'free') return u.tier === 'free';
    return true;
  });

  const filteredRequests = requests.filter(r => {
    if (!r) return false;
    const statusMatch = r.status === approvalSubTab;
    const searchLower = search.toLowerCase();
    const searchMatch = (r.email || '').toLowerCase().includes(searchLower) ||
                        (r.name || '').toLowerCase().includes(searchLower) ||
                        (r.transaction_id || '').toLowerCase().includes(searchLower);
    return statusMatch && searchMatch;
  });

  const filteredVouchers = vouchers.filter(v => 
    (v.code || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.tier || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredFeedbacks = feedbacks.filter(f =>
    (f.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.comment || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredWaitlist = waitlist.filter(w =>
    (w.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (w.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const getActiveItems = (): any[] => {
    if (activeTab === 'approvals') return filteredRequests;
    if (activeTab === 'users') return filteredUsers;
    if (activeTab === 'vouchers') return filteredVouchers;
    if (activeTab === 'feedback') return filteredFeedbacks;
    if (activeTab === 'waitlist') return filteredWaitlist;
    return [];
  };

  const activeItems = getActiveItems();
  const totalPages = Math.max(1, Math.ceil(activeItems.length / rowsPerPage));
  const paginatedItems = activeItems.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Action handlers
  const handleApproveRequest = async (requestId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/upgrade-requests/${requestId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        toast.success("Upgrade approved successfully!");
        fetchData();
      } else {
        toast.error("Approval error: " + (data.error || "Failed to approve"));
      }
    } catch (e) { toast.error("Approval action failed."); }
  };

  const handleApproveWaitlist = async (entryId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/waitlist/${entryId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        toast.success(`Waitlist approved! Voucher Code: ${data.voucherCode || 'Generated'}`);
        fetchData();
      } else {
        toast.error("Waitlist approval failed: " + (data.error || "Unknown error"));
      }
    } catch (e) { toast.error("Waitlist approval failed"); }
  };

  const handleDeleteItem = async (type: 'feedback' | 'vouchers' | 'upgrade-requests' | 'users', id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/${type}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Item removed");
        fetchData();
      } else {
        toast.error("Delete failed");
      }
    } catch (e) { toast.error("Delete request failed"); }
  };

  const handleUpdateUser = async (userId: number, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const result = await safeJsonParse(res);
      if (res.ok && !result.error) {
        toast.success("User access updated successfully!");
        setIsManageModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to update user: " + (result.error || "Unknown error"));
      }
    } catch (e) { toast.error("User update failed."); }
  };

  const handleSendReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/feedback/${selectedFeedback.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reply: replyText })
      });
      if (res.ok) {
        toast.success("Reply dispatched to member");
        setReplyText('');
        setIsReplyModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to send reply");
      }
    } catch (e) { toast.error("Reply failed"); }
    finally { setIsSubmittingReply(false); }
  };

  const exportToCSV = (data: any[], filename: string, columns: { key: string; label: string }[]) => {
    if (!data.length) { toast.error("No data to export"); return; }
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
      columns.map(c => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`Exported ${data.length} records to CSV`);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'ALPHA';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewVoucherCode(code);
  };

  const setPresetExpiry = (days: number | 'lifetime') => {
    if (!selectedUser) return;
    const now = new Date();
    let expiryStr = '';
    if (days === 'lifetime') {
      expiryStr = ''; // null/unlimited
    } else {
      now.setDate(now.getDate() + days);
      expiryStr = now.toISOString().split('T')[0];
    }
    const form = document.getElementById('manage-user-form') as HTMLFormElement;
    if (form && form.elements.namedItem('expiry')) {
      (form.elements.namedItem('expiry') as HTMLInputElement).value = expiryStr;
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-slate-900 text-white">
        <ShieldCheck className="h-14 w-14 text-rose-500 animate-pulse" />
        <h2 className="text-2xl font-black uppercase tracking-widest">Unauthorized Access</h2>
        <p className="text-xs text-slate-400">Admin security clearance required for Command Center.</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-10 py-6 md:py-10 max-w-7xl mx-auto space-y-8 min-h-screen bg-[#f8fafc] text-slate-800">
      
      {/* ── TOP HEADER BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Command Center · Security Clearance Granted</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-none mt-1">
            Admin Operations
          </h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.25em] mt-1">
            System Membership & Ledger Control
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search database records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all w-full shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button 
            onClick={() => { setTempPassword(crypto.randomUUID().slice(0, 10)); setIsAddUserModalOpen(true); }} 
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center space-x-2 text-xs font-bold uppercase tracking-wider"
          >
            <UserPlus className="h-4 w-4 text-blue-600" />
            <span>+ Member</span>
          </button>

          <button 
            onClick={() => { generateRandomCode(); setIsAddVoucherModalOpen(true); }} 
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md flex items-center space-x-2 text-xs font-bold uppercase tracking-wider"
          >
            <Gift className="h-4 w-4 text-purple-400" />
            <span>+ Voucher</span>
          </button>

          <button 
            onClick={() => {
              if (activeTab === 'users') exportToCSV(filteredUsers, 'users', [{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'mobile',label:'Mobile'},{key:'tier',label:'Tier'},{key:'subscription_expiry',label:'Expiry'}]);
              else if (activeTab === 'vouchers') exportToCSV(filteredVouchers, 'vouchers', [{key:'code',label:'Code'},{key:'tier',label:'Tier'},{key:'duration_days',label:'Days'},{key:'current_uses',label:'Uses'},{key:'max_uses',label:'Max'}]);
              else if (activeTab === 'feedback') exportToCSV(filteredFeedbacks, 'feedback', [{key:'user_name',label:'User'},{key:'rating',label:'Rating'},{key:'disposition',label:'Category'},{key:'comment',label:'Comment'}]);
              else exportToCSV(filteredRequests, 'approvals', [{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'requested_tier',label:'Tier'},{key:'transaction_id',label:'TxID'},{key:'status',label:'Status'}]);
            }} 
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm" 
            title="Export CSV"
          >
            <Download className="h-4 w-4" />
          </button>

          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── TOP METRICS CARDS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Members */}
        <div 
          onClick={() => { setActiveTab('users'); setUserFilter('all'); }}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Members</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{users.length}</div>
          <span className="text-[10px] text-slate-400 font-medium">Registered Database</span>
        </div>

        {/* Card 2: Active Subscriptions */}
        <div 
          onClick={() => { setActiveTab('users'); setUserFilter('active'); }}
          className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Paid</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">{activePaidUsersCount}</div>
          <span className="text-[10px] text-emerald-600/70 font-medium">Alpha / Pro Members</span>
        </div>

        {/* Card 3: Expired Subscriptions */}
        <div 
          onClick={() => { setActiveTab('users'); setUserFilter('expired'); }}
          className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Expired Subs</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2 font-mono">{expiredUsersCount}</div>
          <span className="text-[10px] text-rose-500/70 font-medium font-mono">Requires Renewal</span>
        </div>

        {/* Card 4: Pending Approvals */}
        <div 
          onClick={() => { setActiveTab('approvals'); setApprovalSubTab('pending'); }}
          className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2 font-mono">{totalPendingApprovals}</div>
          <span className="text-[10px] text-amber-600/70 font-medium">
            {pendingRequestsCount} Payment · {pendingWaitlistCount} Waitlist
          </span>
        </div>

        {/* Card 5: Total Vouchers */}
        <div 
          onClick={() => setActiveTab('vouchers')}
          className="bg-white border border-purple-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Total Vouchers</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <Gift className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2 font-mono">{vouchers.length}</div>
          <span className="text-[10px] text-purple-600/70 font-medium">Trial Passes Issued</span>
        </div>
      </div>

      {/* ── CLEAN TAB SYSTEM ── */}
      <div className="flex items-center space-x-1.5 bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'approvals', label: 'Approvals', count: totalPendingApprovals, icon: Clock, color: 'text-amber-600' },
          { id: 'users', label: 'User Directory', count: users.length, icon: Users, color: 'text-slate-900' },
          { id: 'vouchers', label: 'Vouchers', count: vouchers.length, icon: Gift, color: 'text-purple-600' },
          { id: 'feedback', label: 'Feedback', count: feedbacks.length, icon: MessageSquare, color: 'text-blue-600' },
          { id: 'waitlist', label: 'Waitlist', count: waitlist.length, icon: UserPlus, color: 'text-emerald-600' },
          { id: 'blog', label: 'Blog', icon: FileText, color: 'text-indigo-600' },
          { id: 'health', label: 'Health Check', icon: Activity, color: 'text-emerald-600' },
          { id: 'audit', label: 'Audit Logs', icon: ScrollText, color: 'text-amber-600' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as MainTab);
                if (tab.id === 'waitlist' && !waitlist.length) fetchWaitlist();
                if (tab.id === 'health' && !healthData) fetchHealthData();
                if (tab.id === 'audit' && !auditData) fetchAuditData();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? tab.color : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── MAIN TAB CONTENT PANELS ── */}

      {/* --- TAB 1: APPROVALS (UPGRADE REQUESTS) --- */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setApprovalSubTab('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  approvalSubTab === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pending Requests ({pendingRequestsCount})
              </button>
              <button
                onClick={() => setApprovalSubTab('approved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  approvalSubTab === 'approved'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Approved History ({requests.filter(r => r.status === 'approved').length})
              </button>
            </div>
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">
              Showing {filteredRequests.length} records
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Applicant Profile</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Requested Plan</th>
                    <th className="px-6 py-4">Transaction Reference</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-400">Syncing upgrade requests...</td></tr>
                  ) : paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No {approvalSubTab} upgrade requests found.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((req: UpgradeRequest) => (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{req.name}</span>
                            <span className="text-slate-500 text-xs font-mono">{req.email || req.mobile || 'No contact details'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200 animate-pulse'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                              req.requested_tier === 'alpha' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}>
                              {req.requested_tier || 'ALPHA'}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase mt-0.5">{req.billing_cycle || 'monthly'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-fit">
                            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                            <span className="select-all font-bold">{req.transaction_id || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {req.status === 'pending' && (
                              <button 
                                onClick={() => handleApproveRequest(req.id)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm text-xs uppercase tracking-wider"
                              >
                                Approve Access
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteItem('upgrade-requests', req.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete Request"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: USER DIRECTORY --- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: `All Members (${users.length})` },
                { id: 'active', label: `Active Paid (${activePaidUsersCount})` },
                { id: 'expired', label: `Expired (${expiredUsersCount})` },
                { id: 'free', label: `Free Tier (${users.filter(u => u.tier === 'free').length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setUserFilter(f.id as UserFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    userFilter === f.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400">
              Showing {filteredUsers.length} members
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">User Identity</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Role & Tier</th>
                    <th className="px-6 py-4">Membership Validity</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-400">Syncing member directory...</td></tr>
                  ) : paginatedItems.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-400">No members match search / filter criteria.</td></tr>
                  ) : (
                    paginatedItems.map((u: AdminUser) => {
                      const days = getDaysRemaining(u.subscription_expiry);
                      const expired = isUserExpired(u);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 uppercase text-xs">
                                {u.name?.substring(0, 2) || 'MB'}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-sm leading-tight">{u.name}</span>
                                <span className="text-slate-500 text-xs font-mono mt-0.5">{u.email || u.mobile || 'No contact info'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.is_active !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}>
                              {u.is_active !== false ? 'Active' : 'Deactivated'}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                u.tier === 'alpha' ? 'bg-slate-900 text-white' : u.tier === 'pro' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {u.tier || 'FREE'}
                              </span>
                              {u.role === 'admin' && (
                                <span className="px-2 py-0.2 bg-purple-100 text-purple-700 rounded text-[9px] font-extrabold uppercase">Admin</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-1.5 text-slate-700 font-mono">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                <span>{u.subscription_expiry ? new Date(u.subscription_expiry).toLocaleDateString() : 'Lifetime / Unlimited'}</span>
                              </div>
                              {days !== null && (
                                <span className={`text-[10px] font-bold uppercase mt-0.5 ${expired ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                                  {expired ? 'Expired' : `${days} Days Remaining`}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => { setSelectedUser(u); setIsManageModalOpen(true); }}
                                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-xs font-bold flex items-center space-x-1"
                              >
                                <Settings2 className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteItem('users', u.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: VOUCHERS --- */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Voucher Code</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Reward Tier</th>
                    <th className="px-6 py-4 text-center">Duration</th>
                    <th className="px-6 py-4">Usage Progress</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400">Loading vouchers...</td></tr>
                  ) : paginatedItems.length === 0 ? (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400">No voucher codes created yet.</td></tr>
                  ) : (
                    paginatedItems.map((v: Voucher) => {
                      const pct = Math.min(100, Math.round(((v.current_uses || 0) / (v.max_uses || 1)) * 100));
                      return (
                        <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 text-sm select-all">
                            <div className="flex items-center space-x-2">
                              <span>{v.code}</span>
                              <button 
                                onClick={() => { navigator.clipboard.writeText(v.code); toast.success("Code copied!"); }}
                                className="text-slate-400 hover:text-slate-700"
                                title="Copy code"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              v.is_active !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {v.is_active !== false ? 'Live' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                              v.tier === 'alpha' ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600 border border-blue-200'
                            }`}>
                              {v.tier || 'ALPHA'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">
                            {v.duration_days || 7} Days Access
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 max-w-xs">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>{v.current_uses || 0} / {v.max_uses || 100} Redemptions</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-600 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteItem('vouchers', v.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete Voucher"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: FEEDBACK --- */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Member Info</th>
                  <th className="px-6 py-4 text-center">Rating</th>
                  <th className="px-6 py-4 text-center">Category</th>
                  <th className="px-6 py-4">Commentary & Context</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400">Loading feedback...</td></tr>
                ) : paginatedItems.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400">No feedback submitted yet.</td></tr>
                ) : (
                  paginatedItems.map((f: Feedback) => (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{f.user_name || 'System User'}</span>
                          <span className="text-slate-500 text-xs font-mono">{f.user_email || 'No email'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-200">
                          {f.disposition || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 max-w-lg">
                          <p className="text-slate-800 leading-relaxed font-medium">{f.comment || f.message}</p>
                          {f.reply_text && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mt-2">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase block">Admin Resolution</span>
                              <p className="text-slate-700 italic mt-0.5">"{f.reply_text}"</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {!f.reply_text && (
                            <button 
                              onClick={() => { setSelectedFeedback(f); setIsReplyModalOpen(true); }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-bold text-xs"
                            >
                              Reply
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteItem('feedback', f.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: WAITLIST --- */}
      {activeTab === 'waitlist' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Requested Tier</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400">No waitlist applicants found.</td></tr>
                ) : (
                  paginatedItems.map((w: WaitlistEntry) => (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{w.name}</span>
                          <span className="text-slate-500 text-xs font-mono">{w.email} {w.phone ? `· ${w.phone}` : ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          w.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-purple-50 text-purple-600 border border-purple-200">
                          {w.tier_requested || 'ALPHA'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {w.created_at ? new Date(w.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {w.status === 'pending' && (
                          <button 
                            onClick={() => handleApproveWaitlist(w.id)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all text-xs uppercase"
                          >
                            Approve Access
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 6: BLOG MANAGEMENT --- */}
      {activeTab === 'blog' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <AdminBlog />
        </div>
      )}

      {/* --- TAB 7: SYSTEM HEALTH --- */}
      {activeTab === 'health' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <span>Backend & Database Health Diagnostic</span>
            </h3>
            <button
              onClick={fetchHealthData}
              disabled={isHealthLoading}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-600 transition-all flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isHealthLoading ? 'animate-spin' : ''}`} />
              <span>Re-check Health</span>
            </button>
          </div>

          {healthData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-slate-400 font-sans font-bold uppercase block text-[10px]">Database Status</span>
                <span className="text-emerald-600 font-bold text-sm block">CONNECTED · OK</span>
                <span className="text-slate-500 block">DB engine active</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-slate-400 font-sans font-bold uppercase block text-[10px]">API Response Time</span>
                <span className="text-blue-600 font-bold text-sm block">NORMAL (&lt;50ms)</span>
                <span className="text-slate-500 block">Server load optimal</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-slate-400 font-sans font-bold uppercase block text-[10px]">Active Session</span>
                <span className="text-purple-600 font-bold text-sm block">{currentUser?.email}</span>
                <span className="text-slate-500 block">Role: {currentUser?.role}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-xs">Click "Re-check Health" to load diagnostics.</p>
          )}
        </div>
      )}

      {/* --- TAB 8: AUDIT LOGS --- */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <ScrollText className="h-5 w-5 text-amber-600" />
              <span>System Audit Logs</span>
            </h3>
            <button
              onClick={runAudit}
              disabled={isAuditLoading}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-amber-700 transition-all flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isAuditLoading ? 'animate-spin' : ''}`} />
              <span>Run System Audit</span>
            </button>
          </div>

          {auditData ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-sans font-bold uppercase text-[10px]">Total Checks</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">{auditData.total_checks || 0}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 font-sans font-bold uppercase text-[10px]">Passed</span>
                  <p className="text-xl font-bold text-emerald-700 mt-1">{auditData.passed || 0}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                  <span className="text-rose-700 font-sans font-bold uppercase text-[10px]">Issues Found</span>
                  <p className="text-xl font-bold text-rose-700 mt-1">{auditData.failed || 0}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-xs">Click "Run System Audit" to initiate comprehensive system check.</p>
          )}
        </div>
      )}

      {/* ── PAGINATION BAR ── */}
      {activeItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm gap-4">
          <span className="text-xs font-bold text-slate-500">
            Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, activeItems.length)} of {activeItems.length} records
          </span>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl border border-slate-200 hover:bg-slate-200 disabled:opacity-40 transition-all flex items-center space-x-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <span className="text-xs font-mono font-bold text-slate-600 px-3">
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl border border-slate-200 hover:bg-slate-200 disabled:opacity-40 transition-all flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: MANAGE USER ACCESS ── */}
      {isManageModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 italic uppercase">Modify Member Access</h2>
                <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Editing {selectedUser.name}</p>
              </div>
              <button onClick={() => setIsManageModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form id="manage-user-form" className="space-y-5" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleUpdateUser(selectedUser.id, {
                name: fd.get('name'),
                email: fd.get('email'),
                mobile: fd.get('mobile'),
                role: fd.get('role'),
                tier: fd.get('tier'),
                subscription_start: fd.get('start'),
                subscription_expiry: fd.get('expiry'),
                is_active: fd.get('active') === 'true' ? 1 : 0
              });
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Full Name</label>
                  <input type="text" name="name" defaultValue={selectedUser.name} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Email</label>
                  <input type="email" name="email" defaultValue={selectedUser.email} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:bg-white outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Role</label>
                  <select name="role" defaultValue={selectedUser.role || 'user'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase outline-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Plan Tier</label>
                  <select name="tier" defaultValue={selectedUser.tier || 'free'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase outline-none">
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="alpha">Alpha</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Account Status</label>
                  <select name="active" defaultValue={String(selectedUser.is_active !== false)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase outline-none">
                    <option value="true">Active</option>
                    <option value="false">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase block">Quick Expiry Presets</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setPresetExpiry(7)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">+7 Days</button>
                  <button type="button" onClick={() => setPresetExpiry(30)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">+30 Days</button>
                  <button type="button" onClick={() => setPresetExpiry(365)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">+1 Year</button>
                  <button type="button" onClick={() => setPresetExpiry('lifetime')} className="px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold">Unlimited / Lifetime</button>
                  <button type="button" onClick={() => setPresetExpiry(0)} className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold">Expire Today</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-blue-600 uppercase">Start Date</label>
                  <input type="date" name="start" defaultValue={selectedUser.subscription_start?.split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-rose-600 uppercase">Expiry Date</label>
                  <input type="date" name="expiry" defaultValue={selectedUser.subscription_expiry?.split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none" />
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-blue-600 transition-all shadow-md">
                Commit Account Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD MEMBER ── */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 italic uppercase">Onboard Member</h2>
                <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Manual Member Registration</p>
              </div>
              <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              try {
                const res = await fetch(`${API_URL}/api/auth/register`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    name: fd.get('name'),
                    email: fd.get('email'),
                    password: fd.get('password') || tempPassword,
                    role: fd.get('role')
                  })
                });
                const data = await safeJsonParse(res);
                if (res.ok && !data.error) {
                  toast.success("Member onboarded successfully!");
                  fetchData();
                  setIsAddUserModalOpen(false);
                } else { toast.error(data.error || "Onboarding failed."); }
              } catch (e) { toast.error("Registration request failed"); }
            }}>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Full Name</label>
                <input type="text" name="name" required placeholder="John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Email Address</label>
                <input type="email" name="email" required placeholder="john@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Role</label>
                  <select name="role" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase outline-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Temp Password</label>
                  <input type="text" name="password" readOnly value={tempPassword} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold" />
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-blue-600 transition-all shadow-md">
                Onboard Member Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: CREATE VOUCHER ── */}
      {isAddVoucherModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 italic uppercase">Create Voucher Code</h2>
                <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Trial & Pass Generation</p>
              </div>
              <button onClick={() => setIsAddVoucherModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              try {
                const res = await fetch(`${API_URL}/api/admin/vouchers`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    code: fd.get('code'),
                    tier: fd.get('tier'),
                    duration_days: parseInt(fd.get('days') as string),
                    max_uses: parseInt(fd.get('uses') as string)
                  })
                });
                const data = await safeJsonParse(res);
                if (res.ok && !data.error) {
                  toast.success("Voucher code generated!");
                  fetchData();
                  setIsAddVoucherModalOpen(false);
                } else { toast.error(data.error || "Voucher creation failed"); }
              } catch (e) { toast.error("Voucher creation request failed"); }
            }}>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase">Voucher Code</label>
                  <button type="button" onClick={generateRandomCode} className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Auto-Generate</button>
                </div>
                <input 
                  type="text" 
                  name="code" 
                  value={newVoucherCode}
                  onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                  required 
                  placeholder="e.g. ALPHA7DAY" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Reward Tier</label>
                  <select name="tier" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase outline-none">
                    <option value="alpha">Alpha Access</option>
                    <option value="pro">Pro Access</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Duration</label>
                  <select name="days" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold uppercase outline-none">
                    <option value="7">7 Days (Standard)</option>
                    <option value="3">3 Days (Quick)</option>
                    <option value="14">14 Days (Extended)</option>
                    <option value="30">30 Days (1 Month)</option>
                    <option value="365">365 Days (1 Year)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Max Redemptions</label>
                <input type="number" name="uses" defaultValue="100" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none" />
              </div>

              <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-blue-600 transition-all shadow-md">
                Generate Voucher Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: REPLY FEEDBACK ── */}
      {isReplyModalOpen && selectedFeedback && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-slate-900 italic uppercase">Feedback Resolution</h2>
                <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Replying to {selectedFeedback.user_name}</p>
              </div>
              <button onClick={() => setIsReplyModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Comment</span>
              <p className="italic">"{selectedFeedback.comment || selectedFeedback.message}"</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase block">Admin Resolution Message</label>
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Explain steps taken or resolution details..."
                className="w-full h-28 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium outline-none focus:bg-white resize-none"
              />
            </div>

            <button 
              onClick={handleSendReply}
              disabled={isSubmittingReply || !replyText.trim()}
              className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-wider text-xs hover:bg-blue-600 transition-all shadow-md disabled:opacity-50"
            >
              {isSubmittingReply ? 'Dispatching...' : 'Dispatch Resolution'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
