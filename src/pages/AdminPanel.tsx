import React, { useState, useEffect, useCallback } from 'react';
import AdminBlog from '../components/AdminBlog';
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
  Trash2,
  Calendar,
  ShieldAlert,
  UserPlus,
  ArrowRight,
  Settings2,
  Gift,
  MessageSquare,
  Star,
  Send,
  X,
  FileText,
  Activity,
  ScrollText,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { toast } from 'sonner';
import type { AdminUser, Feedback, Voucher, WaitlistEntry, UpgradeRequest } from '../types';

const API_URL = getApiUrl();

const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'users' | 'vouchers' | 'feedback' | 'waitlist' | 'blog' | 'health' | 'audit'>('pending');
  const [search, setSearch] = useState('');
  
  // Modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [isAddVoucherModalOpen, setIsAddVoucherModalOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: string; confirmLabel?: string;
    variant?: 'danger' | 'warning'; onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [healthData, setHealthData] = useState<any>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const rowsPerPage = 20;

  const paginate = <T,>(items: T[]): T[] => items.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = (items: unknown[]) => Math.max(1, Math.ceil(items.length / rowsPerPage));

  const Pagination = ({ items }: { items: unknown[] }) => {
    const tp = totalPages(items);
    if (tp <= 1) return null;
    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
        <span className="text-xs text-slate-500 font-bold">{items.length} total</span>
        <div className="flex items-center space-x-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">Prev</button>
          <span className="text-xs font-bold text-slate-600 px-3">{page} / {tp}</span>
          <button onClick={() => setPage(p => Math.min(tp, p + 1))} disabled={page >= tp} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">Next</button>
        </div>
      </div>
    );
  };

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        fetch(`${API_URL}/api/admin/users`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/upgrade-requests`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/vouchers`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/feedback`, { credentials: 'include' }),
        fetch(`${API_URL}/api/admin/waitlist?status=pending`, { credentials: 'include' })
      ]);

      const [uRes, rRes, vRes, fRes, wRes] = results.map(r => r.status === 'fulfilled' ? r.value : null);

      if (results.some(r => r.status === 'rejected')) {
        console.warn('Some admin endpoints failed to fetch');
      }

      // Check for auth failures
      if ((uRes && (uRes.status === 401 || uRes.status === 403))
        || (rRes && (rRes.status === 401 || rRes.status === 403))
        || (vRes && (vRes.status === 401 || vRes.status === 403))
        || (fRes && (fRes.status === 401 || fRes.status === 403))
        || (wRes && wRes.status === 401)) {
        window.location.href = '/login';
        return;
      }

      if (uRes?.ok) setUsers(await safeJsonParse(uRes) || []);
      if (rRes?.ok) setRequests(await safeJsonParse(rRes) || []);
      if (vRes?.ok) setVouchers(await safeJsonParse(vRes) || []);
      if (fRes?.ok) setFeedbacks(await safeJsonParse(fRes) || []);
      if (wRes?.ok) {
        const wData = await safeJsonParse(wRes);
        setWaitlist(wData?.data || []);
      }
    } catch (e) {
      console.error("Admin fetch failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') fetchData();
  }, [currentUser, fetchData]);

  const handleApprove = async (requestId: number) => {
    if (!window.confirm("Approve this payment and upgrade user?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/upgrade-requests/${requestId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        await fetchData();
        setActiveTab('approved');
      } else {
        toast("Error: " + (data.error || "Failed to approve"));
      }
    } catch (e) { toast("Approval Logic Failed."); }
  };

  const handleDeleteItem = async (type: 'feedback' | 'vouchers' | 'upgrade-requests', id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.replace('-requests', '')}? This action is permanent.`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/${type}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        await fetchData();
      } else {
        toast("Failed to delete item.");
      }
    } catch (e) { toast("Delete operation failed."); }
  };

  const handleSendReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/feedback/${selectedFeedback.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reply: replyText })
      });
      if (res.ok) {
        setReplyText('');
        setIsReplyModalOpen(false);
        await fetchData();
      } else {
        toast("Failed to send reply.");
      }
    } catch (e) { toast("Reply failed."); }
    finally { setIsSubmittingReply(false); }
  };

  const handleUpdateUser = async (userId: number, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const result = await safeJsonParse(res);
      if (res.ok && !result.error) {
        toast("User Access Updated Successfully!");
        fetchData();
        setIsManageModalOpen(false);
      } else {
        toast(`Update Failed: ${result.error || 'Server Error'}`);
      }
    } catch (e: unknown) { toast(`Update failed: ${e instanceof Error ? e.message : 'Unknown error'}`); }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("DANGER: Permanently delete user and all data?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) fetchData();
    } catch (e) { toast("Network error"); }
  };

  const fetchWaitlist = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/waitlist?status=pending`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await safeJsonParse(res);
        setWaitlist(data?.data || []);
      }
    } catch (e) { console.error('Fetch waitlist error:', e); }
  }, []);

  const handleApproveWaitlist = async (entryId: number) => {
    if (!window.confirm('Approve this user and generate a unique voucher code?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/waitlist/${entryId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ duration_days: 7 })
      });
      const data = await safeJsonParse(res);
      if (res.ok && data.voucher_code) {
        toast(`✅ Voucher generated: ${data.voucher_code} (${data.tier}, ${data.duration_days} days)`);
        fetchWaitlist();
      } else {
        toast('Error: ' + (data.error || 'Failed to approve'));
      }
    } catch (e) { toast('Approval failed'); }
  };

  const handleRejectWaitlist = async (entryId: number) => {
    if (!window.confirm('Reject this waitlist entry?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/waitlist/${entryId}/reject`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        toast('Entry rejected');
        fetchWaitlist();
      }
    } catch (e) { toast('Reject failed'); }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = (ids: number[]) => {
    if (selectedIds.size === ids.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(ids));
  };
  const handleBulkDelete = async (type: 'feedback' | 'vouchers' | 'upgrade-requests') => {
    const ids = Array.from(selectedIds);
    for (const id of ids) { await fetch(`${API_URL}/api/admin/${type}/${id}`, { method: 'DELETE', credentials: 'include' }); }
    setSelectedIds(new Set()); await fetchData(); toast(`Deleted ${ids.length} items`);
  };
  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) { await fetch(`${API_URL}/api/admin/upgrade-requests/${id}/approve`, { method: 'POST', credentials: 'include' }); }
    setSelectedIds(new Set()); await fetchData(); toast(`Approved ${ids.length} requests`);
  };
  const exportToCSV = (data: any[], filename: string, columns: { key: string; label: string }[]) => {
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(item => columns.map(c => {
      const val = String(item[c.key as keyof typeof item] ?? '');
      return val.includes(',') ? `"${val}"` : val;
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const confirmThen = (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'warning') => {
    setConfirmState({ open: true, title, message, onConfirm, variant, confirmLabel: variant === 'danger' ? 'Delete' : 'Confirm' });
  };
  const fetchHealthData = useCallback(async () => {
    setIsHealthLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/health-check`, { credentials: 'include' });
      if (res.ok) setHealthData(await safeJsonParse(res));
    } catch (e) { console.error("Health fetch failed:", e); }
    finally { setIsHealthLoading(false); }
  }, []);
  const runHealthCheck = async () => {
    setIsHealthLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/health-check/run`, { method: 'POST', credentials: 'include' });
      if (res.ok) { setHealthData(await safeJsonParse(res)); toast("Health check completed"); }
    } catch (e) { toast("Health check failed"); }
    finally { setIsHealthLoading(false); }
  };
  const fetchAuditData = useCallback(async () => {
    setIsAuditLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/audit/latest`, { credentials: 'include' });
      if (res.ok) setAuditData(await safeJsonParse(res));
    } catch (e) { console.error("Audit fetch failed:", e); }
    finally { setIsAuditLoading(false); }
  }, []);
  const runAudit = async () => {
    setIsAuditLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/audit/run`, { method: 'POST', credentials: 'include' });
      if (res.ok) { setAuditData(await safeJsonParse(res)); toast("Audit completed"); }
    } catch (e) { toast("Audit failed"); }
    finally { setIsAuditLoading(false); }
  };
  const filteredRequests = (requests || []).filter(r => {
    if (!r) return false;
    const status = (r.status || 'pending').toLowerCase();
    const isTabMatch = activeTab === 'pending' ? status === 'pending' : status === 'approved';
    const searchLower = search.toLowerCase();
    return isTabMatch && ((r.email || '').toLowerCase().includes(searchLower) || (r.name || '').toLowerCase().includes(searchLower));
  });

  const filteredUsers = (users || []).filter(u => 
    u && ((u.email || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.name || '').toLowerCase().includes(search.toLowerCase()))
  );

  const getDaysRemaining = (expiry: string) => {
    if (!expiry) return null;
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  class AdminErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: Error | null}> {
    state = { hasError: false, error: null as Error | null };
    static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
    render() {
      if (this.state.hasError) {
        return (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <AlertTriangle className="h-12 w-12 text-rose-500" />
            <h3 className="text-lg font-black text-slate-900">Something went wrong</h3>
            <p className="text-xs text-slate-500 max-w-md text-center">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-caption hover:bg-blue-600 transition-all">Reload</button>
          </div>
        );
      }
      return this.props.children;
    }
  }

  const SkeletonRow = ({ cols = 5 }: { cols?: number }) => (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-8 py-6"><div className="h-4 bg-slate-100 rounded-lg w-3/4" /></td>
      ))}
    </tr>
  );
  const SkeletonCard = () => (
    <div className="p-5 space-y-3 animate-pulse">
      <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
      <div className="h-3 bg-slate-100 rounded-lg w-3/4" />
      <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
    </div>
  );

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <ShieldCheck className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-black uppercase tracking-wider">Unauthorized Access</h2>
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
    <div className="px-4 md:px-8 lg:px-10 py-6 md:py-10 max-w-7xl mx-auto space-y-10 min-h-screen bg-[#f8fafc]">
      {/* 1. Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-blue-600">
             <ShieldCheck className="h-4 w-4" />
             <span className="text-caption leading-none">Security Level: Admin</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Command Center</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Institutional Membership Control</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
           <div className="relative flex-1 md:flex-initial min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search Database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-caption focus:bg-white transition-all w-full md:w-64 shadow-inner"
              />
           </div>
<button onClick={() => { setTempPassword(crypto.randomUUID().slice(0, 12)); setIsAddUserModalOpen(true); }} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center space-x-2 text-slate-500 flex-1 md:flex-initial">
               <UserPlus className="h-4 w-4" />
               <span className="text-caption">Member</span>
           </button>
           <button onClick={() => setIsAddVoucherModalOpen(true)} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center space-x-2 flex-1 md:flex-initial">
              <Gift className="h-4 w-4" />
              <span className="text-caption">Voucher</span>
           </button>
            <button onClick={() => {
              const data = activeTab === 'users' ? filteredUsers : activeTab === 'vouchers' ? vouchers : activeTab === 'feedback' ? feedbacks : filteredRequests;
              const columns = activeTab === 'users' ? [{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'tier',label:'Tier'},{key:'subscription_expiry',label:'Expiry'}] :
                activeTab === 'vouchers' ? [{key:'code',label:'Code'},{key:'tier',label:'Tier'},{key:'duration_days',label:'Days'},{key:'current_uses',label:'Uses'},{key:'max_uses',label:'Max'}] :
                activeTab === 'feedback' ? [{key:'user_name',label:'Name'},{key:'rating',label:'Rating'},{key:'message',label:'Message'}] :
                [{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'tier',label:'Tier'},{key:'status',label:'Status'}];
              exportToCSV(data, `admin-${activeTab}`, columns);
            }} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm text-slate-500 flex items-center justify-center" title="Export CSV">
               <Download className="h-4 w-4" />
            </button>
             <button onClick={fetchData} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm text-slate-500 flex items-center justify-center">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
             </button>
         </div>
       </div>

       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 w-full max-w-full overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-8 py-3 rounded-xl text-caption transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Clock className="h-4 w-4" />
              <span>Pending ({requests.filter(r => r.status === 'pending').length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('approved')}
              className={`px-8 py-3 rounded-xl text-caption transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'approved' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>History ({requests.filter(r => r.status === 'approved').length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-8 py-3 rounded-xl text-caption transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              <Users className="h-4 w-4" />
              <span>User Directory ({users.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('vouchers')}
              className={`px-8 py-3 rounded-xl text-caption transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'vouchers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Gift className="h-4 w-4" />
              <span>Vouchers ({vouchers.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('feedback')}
              className={`px-8 py-3 rounded-xl text-caption transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'feedback' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Feedback ({feedbacks.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('blog')}
              className={`px-8 py-3 rounded-xl text-caption transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'blog' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <FileText className="h-4 w-4" />
              <span>Blog</span>
            </button>
            <button 
              onClick={() => { setActiveTab('waitlist'); fetchWaitlist(); }}
              className={`px-8 py-3 rounded-xl text-caption transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'waitlist' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Waitlist ({waitlist.length})</span>
            </button>
            <button 
              onClick={() => { setActiveTab('health'); fetchHealthData(); }}
              className={`px-8 py-3 rounded-xl text-caption transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'health' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Activity className="h-4 w-4" />
              <span>Health</span>
            </button>
            <button 
              onClick={() => { setActiveTab('audit'); fetchAuditData(); }}
              className={`px-8 py-3 rounded-xl text-caption transition-all flex items-center space-x-2 whitespace-nowrap ${activeTab === 'audit' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}
            >
              <ScrollText className="h-4 w-4" />
              <span>Audit</span>
            </button>
         </div>
         
         <div className="flex items-center space-x-6 text-caption text-slate-500">
            <div className="flex items-center space-x-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500" />
               <span>{users.filter(u => getDaysRemaining(u.subscription_expiry || '') !== null && getDaysRemaining(u.subscription_expiry || '')! > 0).length} Active</span>
            </div>
            <div className="flex items-center space-x-2">
               <div className="h-2 w-2 rounded-full bg-red-500" />
               <span>{users.filter(u => getDaysRemaining(u.subscription_expiry || '') === 0).length} Expired</span>
            </div>
         </div>
      </div>

      {/* 3. Main Table & Mobile View */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
             <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                   {(activeTab === 'vouchers' || activeTab === 'users' || activeTab === 'feedback' || activeTab === 'pending' || activeTab === 'approved') && (
                     <th className="px-4 py-5 w-10">
                       <input type="checkbox"
                         onChange={() => {
                           const ids = activeTab === 'users' ? filteredUsers.map(u => u.id) :
                             activeTab === 'feedback' ? feedbacks.map(f => f.id) :
                             activeTab === 'vouchers' ? vouchers.map(v => v.id) :
                             filteredRequests.map(r => r.id);
                           toggleSelectAll(ids);
                         }}
                         checked={(() => {
                           const ids = activeTab === 'users' ? filteredUsers.map(u => u.id) :
                             activeTab === 'feedback' ? feedbacks.map(f => f.id) :
                             activeTab === 'vouchers' ? vouchers.map(v => v.id) :
                             filteredRequests.map(r => r.id);
                           return ids.length > 0 && selectedIds.size === ids.length;
                         })()}
                         className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                       />
                   </th>
                   )}
                   <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                     {activeTab === 'users' ? 'Member Profile' : activeTab === 'vouchers' ? 'Voucher Code' : activeTab === 'feedback' ? 'Member Profile' : 'Approval Request'}
                   </th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    {activeTab === 'feedback' ? 'Rating' : 'Status'}
                  </th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    {activeTab === 'feedback' ? 'Type' : 'Plan Tier'}
                  </th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {activeTab === 'users' ? 'Membership Validity' : activeTab === 'vouchers' ? 'Usage Matrix' : activeTab === 'feedback' ? 'Commentary & Context' : 'Transaction ID'}
                  </th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
               </tr>
             </thead>
              <tbody className="divide-y divide-slate-50">
                 {isLoading ? (
                   Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                 ) : activeTab === 'vouchers' ? (
                   paginate(vouchers || []).map(v => (
                    <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-6 w-10">
                        <input type="checkbox" checked={selectedIds.has(v.id)} onChange={() => toggleSelect(v.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="px-8 py-6 font-mono font-bold text-slate-900 text-xs select-all">{v.code}</td>
                     <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <span className={`px-2 py-1 rounded text-caption uppercase ${v.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                             {v.is_active ? 'Live' : 'Disabled'}
                          </span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col items-center">
                           <span className="text-xs font-bold text-slate-900 uppercase">{v.tier}</span>
                           <span className="text-caption text-slate-500 uppercase">{v.duration_days} Days Access</span>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${((v.current_uses || 0) / (v.max_uses || 1)) * 100}%` }} />
                           </div>
                           <span className="text-caption text-slate-500 mt-1 uppercase">{v.current_uses} / {v.max_uses} Redemptions</span>
                        </div>
                     </td>
                     <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleDeleteItem('vouchers', v.id)}
                          className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                          title="Delete Voucher"
                        >
                           <Trash2 className="h-4 w-4" />
                        </button>
                     </td>
                   </tr>
                 ))
                ) : activeTab === 'users' ? (
                  paginate(filteredUsers).map(u => {
                   const days = getDaysRemaining(u.subscription_expiry || '');
                   return (
                     <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                       <td className="px-4 py-6 w-10">
                         <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase italic">
                               {u.name?.substring(0,2)}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[13px] font-bold text-slate-900 leading-none">{u.name}</span>
                               <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter mt-1">{u.email || u.mobile || 'No Contact'}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-caption uppercase tracking-[0.1em] ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                               {u.is_active ? 'Active' : 'Deactivated'}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex justify-center">
                            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border ${u.tier === 'alpha' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : u.tier === 'pro' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                               {u.tier === 'alpha' ? <ShieldCheck className="h-3 w-3" /> : u.tier === 'pro' ? <Zap className="h-3 w-3" /> : null}
                               <span className="text-caption uppercase">{u.tier}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2 text-slate-700">
                               <Calendar className="h-3.5 w-3.5 text-slate-300" />
                               <span className="text-caption font-mono">{u.subscription_expiry ? new Date(u.subscription_expiry).toLocaleDateString() : 'Unlimited'}</span>
                            </div>
                            {days !== null && (
                               <span className={`text-caption uppercase ${days <= 3 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                                  {days === 0 ? 'Expired' : `${days} Days Remaining`}
                               </span>
                            )}
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => { setSelectedUser(u); setIsManageModalOpen(true); }}
                              className="p-2 text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-100 rounded-xl shadow-sm"
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
                ) : activeTab === 'feedback' ? (
                    paginate(feedbacks || []).map(f => (
                     <tr key={f.id} className="group hover:bg-slate-50/50 transition-colors">
                       <td className="px-4 py-6 w-10">
                         <input type="checkbox" checked={selectedIds.has(f.id)} onChange={() => toggleSelect(f.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                       </td>
                       <td className="px-8 py-6">
                         <div className="flex flex-col">
                           <span className="text-[13px] font-bold text-slate-900 leading-none">{f.user_name || 'System User'}</span>
                           <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter mt-1">{f.user_email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center items-center space-x-0.5">
                           {[1, 2, 3, 4, 5].map(star => (
                             <Star 
                               key={star} 
                               className={`h-3 w-3 ${star <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                             />
                           ))}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                           <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100`}>
                             {f.disposition}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col space-y-1 max-w-md">
                           <p className="text-xs text-slate-800 font-medium leading-relaxed">{f.comment}</p>
                           {f.url && (
                             <a 
                               href={f.url} 
                               target="_blank" 
                               rel="noreferrer" 
                               className="text-caption text-blue-500 hover:underline truncate"
                             >
                               {f.url}
                             </a>
                           )}
                           <span className="text-caption text-slate-500 uppercase tracking-wider">
                             {new Date(f.timestamp || '').toLocaleString()}
                           </span>
                           {f.reply_text && (
                             <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <span className="text-[7.5px] font-bold text-emerald-600 uppercase block mb-1">Admin Resolution:</span>
                                <p className="text-caption font-medium text-slate-700 leading-tight italic">"{f.reply_text}"</p>
                                <span className="text-xs text-slate-400 mt-1 block uppercase">{new Date(f.replied_at || '').toLocaleString()}</span>
                             </div>
                           )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end space-x-2">
                            {!f.reply_text && (
                              <button 
                                onClick={() => { setSelectedFeedback(f); setIsReplyModalOpen(true); }}
                                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                                title="Reply to Feedback"
                              >
                                 <MessageSquare className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteItem('feedback', f.id)}
                              className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                              title="Delete Feedback"
                            >
                               <Trash2 className="h-4 w-4" />
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  paginate(filteredRequests).map(req => (
                   <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                     <td className="px-4 py-6 w-10">
                       <input type="checkbox" checked={selectedIds.has(req.id)} onChange={() => toggleSelect(req.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                     </td>
                     <td className="px-8 py-6">
                       <div className="flex flex-col">
                         <span className="text-[13px] font-bold text-slate-900 leading-none">{req.name}</span>
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter mt-1">{req.email || req.mobile}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                         <span className={`px-3 py-1 rounded-full text-caption ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {req.status}
                         </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center space-y-1">
                         <div className="flex items-center space-x-2 text-blue-600">
                            <Zap className="h-3 w-3" />
                            <span className="text-caption uppercase">{req.requested_tier}</span>
                         </div>
                         <span className="text-caption uppercase text-slate-500">{req.billing_cycle}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2 text-slate-500">
                         <CreditCard className="h-4 w-4" />
                         <span className="text-xs font-mono font-bold tracking-tight select-all">{req.transaction_id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {req.status === 'pending' && (
                          <button 
                            onClick={() => handleApprove(req.id)}
                            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-caption hover:bg-blue-600 transition-all shadow-md active:scale-95"
                          >
                            Approve Upgrade
                          </button>
                        )}
                        <button 
                           onClick={() => handleDeleteItem('upgrade-requests', req.id)}
                           className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
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
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between px-6 py-3 bg-blue-50 border-t border-blue-100">
                <span className="text-xs font-bold text-blue-700">{selectedIds.size} selected</span>
                <div className="flex items-center space-x-2">
                  {(activeTab === 'pending' || activeTab === 'approved') && (
                    <button onClick={() => { confirmThen('Bulk Approve', `Approve ${selectedIds.size} upgrade requests?`, handleBulkApprove); }} className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all">Approve All</button>
                  )}
                  <button onClick={() => { const type = activeTab === 'feedback' ? 'feedback' : activeTab === 'vouchers' ? 'vouchers' : 'upgrade-requests'; confirmThen('Bulk Delete', `Delete ${selectedIds.size} items?`, () => handleBulkDelete(type), 'danger'); }} className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-all">Delete Selected</button>
                </div>
              </div>
            )}
            <Pagination items={activeTab === 'vouchers' ? vouchers : activeTab === 'users' ? filteredUsers : activeTab === 'feedback' ? feedbacks : filteredRequests} />
         </div>
        <div className="md:hidden divide-y divide-slate-100">
           {isLoading ? (
             Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
           ) : activeTab === 'vouchers' ? (
             paginate(vouchers || []).map(v => (
              <div key={v.id} className="p-5 space-y-3.5 hover:bg-slate-50/40 transition-colors">
                 <div className="flex justify-between items-start">
                    <div>
                       <span className="text-[7.5px] text-slate-500 block mb-0.5 uppercase font-bold">Voucher Code</span>
                       <span className="text-sm font-bold text-slate-900 font-mono uppercase select-all">{v.code}</span>
                    </div>
                    <div className="text-right">
                       <span className={`px-2 py-0.5 rounded text-caption uppercase ${v.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {v.is_active ? 'Live' : 'Disabled'}
                       </span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-caption text-slate-500 uppercase tracking-wider font-mono">
                    <div>
                       <span className="text-[7.5px] text-slate-500 block mb-0.5">Tier Plan</span>
                       <span className="text-slate-800 font-bold">{v.tier}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[7.5px] text-slate-500 block mb-0.5">Duration</span>
                       <span className="text-slate-800 font-bold">{v.duration_days} Days Access</span>
                    </div>
                 </div>
                 <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                       <span className="text-[7.5px] text-slate-500 block mb-0.5">Redemptions</span>
                       <span className="text-[9.5px] font-bold text-slate-900 font-mono">{v.current_uses} / {v.max_uses}</span>
                    </div>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 ml-4">
                       <div className="h-full bg-blue-600" style={{ width: `${((v.current_uses || 0) / (v.max_uses || 1)) * 100}%` }} />
                    </div>
                 </div>
              </div>
            ))
          ) : activeTab === 'users' ? (
            paginate(filteredUsers).map(u => {
              const days = getDaysRemaining(u.subscription_expiry || '');
              return (
                <div key={u.id} className="p-5 space-y-3.5 hover:bg-slate-50/40 transition-colors">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                         <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase italic shrink-0">
                            {u.name?.substring(0,2)}
                         </div>
                         <div>
                            <span className="text-xs font-bold text-slate-900 leading-none block">{u.name}</span>
                            <span className="text-caption text-slate-500 uppercase tracking-tighter mt-1 block">{u.email || u.mobile || 'No Contact'}</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className={`px-2 py-0.5 rounded-full text-[7.5px] font-bold uppercase tracking-[0.1em] ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {u.is_active ? 'Active' : 'Deactivated'}
                         </span>
                      </div>
                   </div>
                   <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <div>
                         <span className="text-[7.5px] text-slate-500 block mb-0.5">Tier Plan</span>
                         <span className="text-slate-800 font-bold text-[9.5px] uppercase">{u.tier}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-[7.5px] text-slate-500 block mb-0.5">Validity</span>
                         <span className="text-[9.5px] font-bold font-mono text-slate-900 block leading-tight">{u.subscription_expiry ? new Date(u.subscription_expiry).toLocaleDateString() : 'Unlimited'}</span>
                         {days !== null && (
                            <span className={`text-caption uppercase mt-0.5 block ${days === 0 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                               {days === 0 ? 'Expired' : `${days} Days Left`}
                            </span>
                         )}
                      </div>
                   </div>
                   <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setSelectedUser(u); setIsManageModalOpen(true); }}
                        className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-caption rounded-xl hover:bg-slate-950 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                      >
                         <Settings2 className="h-3 w-3" />
                         <span>Edit Access</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors"
                      >
                         <Trash2 className="h-3.5 w-3.5" />
                      </button>
                   </div>
                </div>
              );
            })
          ) : activeTab === 'feedback' ? (
            paginate(feedbacks || []).map(f => (
              <div key={f.id} className="p-5 space-y-3 hover:bg-slate-50/40 transition-colors">
                 <div className="flex justify-between items-start">
                    <div>
                       <span className="text-xs font-bold text-slate-900 block leading-none">{f.user_name || 'System User'}</span>
                       <span className="text-caption text-slate-500 uppercase tracking-tighter mt-1 block">{f.user_email}</span>
                    </div>
                    <div className="flex items-center space-x-0.5">
                       {[1, 2, 3, 4, 5].map(star => (
                         <Star 
                           key={star} 
                           className={`h-3 w-3 ${star <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                         />
                       ))}
                    </div>
                 </div>
                 <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                       <span className="text-[7.5px] text-slate-500 uppercase font-bold">Feedback Type</span>
                       <span className="px-2 py-0.5 rounded-full text-caption bg-blue-50 text-blue-600 border border-blue-100">
                          {f.disposition}
                       </span>
                    </div>
                    <div>
                       <span className="text-[7.5px] text-slate-500 block mb-1 uppercase font-bold">Commentary</span>
                       <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl">{f.comment}</p>
                    </div>
                    {f.url && (
                       <div>
                          <span className="text-[7.5px] text-slate-500 block mb-0.5 uppercase font-bold">Source URL</span>
                          <a href={f.url} target="_blank" rel="noreferrer" className="text-caption text-blue-500 hover:underline truncate block">
                             {f.url}
                          </a>
                       </div>
                    )}
                    <div className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider pt-1">
                       {new Date(f.timestamp || '').toLocaleString()}
                    </div>
                 </div>
              </div>
            ))
          ) : (
            paginate(filteredRequests).map(req => (
              <div key={req.id} className="p-5 space-y-3.5 hover:bg-slate-50/40 transition-colors">
                 <div className="flex justify-between items-start">
                    <div>
                       <span className="text-xs font-bold text-slate-900 block leading-none">{req.name}</span>
                       <span className="text-caption text-slate-500 uppercase tracking-tighter mt-1 block">{req.email || req.mobile}</span>
                    </div>
                    <div className="text-right">
                       <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-bold uppercase tracking-wider ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {req.status}
                       </span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-caption text-slate-500 uppercase tracking-wider font-mono">
                    <div>
                       <span className="text-[7.5px] text-slate-500 block mb-0.5">Requested Tier</span>
                       <span className="text-blue-600 font-bold">{req.requested_tier} ({req.billing_cycle})</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[7.5px] text-slate-500 block mb-0.5">Transaction ID</span>
                       <span className="text-slate-800 font-bold text-[8.5px] truncate block select-all">{req.transaction_id}</span>
                    </div>
                 </div>
                 {req.status === 'pending' && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                       <button 
                         onClick={() => handleApprove(req.id)}
                         className="px-6 py-2 bg-slate-900 text-white rounded-xl text-caption hover:bg-blue-600 transition-all shadow-md active:scale-95 w-full"
                       >
                         Approve Upgrade
                       </button>
                    </div>
                 )}
              </div>
            ))
          )}
        </div>
        <Pagination items={activeTab === 'vouchers' ? vouchers : activeTab === 'users' ? filteredUsers : activeTab === 'feedback' ? feedbacks : filteredRequests} />
      </div>

      {/* 3b. Blog Tab */}
      {activeTab === 'blog' && (
        <div className="space-y-4">
          <AdminBlog />
        </div>
      )}

      {/* 3c. Waitlist Tab */}
      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Waitlist <span className="text-purple-600">({waitlist.length} pending)</span>
            </h3>
            <button
              onClick={fetchWaitlist}
              className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          {waitlist.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-caption">No pending waitlist entries</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {waitlist.map((entry: WaitlistEntry) => (
                <div key={entry.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-bold text-slate-900">{entry.name}</span>
                    <div className="flex items-center space-x-3 text-xs font-bold text-slate-500">
                      <span>{entry.email}</span>
                      {entry.phone && <span>• {entry.phone}</span>}
                      <span>• {entry.tier_requested}</span>
                      <span>• {new Date(entry.created_at || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApproveWaitlist(entry.id)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-caption shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-600 transition-all flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve & Generate Code</span>
                    </button>
                    <button
                      onClick={() => handleRejectWaitlist(entry.id)}
                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3d. Health Tab */}
      {activeTab === 'health' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span>System Health</span>
            </h3>
            <button
              onClick={runHealthCheck}
              disabled={isHealthLoading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-caption hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isHealthLoading ? 'animate-spin' : ''}`} />
              <span>{isHealthLoading ? 'Running...' : 'Run Check'}</span>
            </button>
          </div>
          {healthData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['api', 'database', 'cron'].map(service => (
                <div key={service} className={`rounded-2xl p-5 border ${healthData[service]?.status === 'ok' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">{service}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${healthData[service]?.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>
                  <p className="text-xs text-slate-500">{healthData[service]?.message || 'No data'}</p>
                  {healthData[service]?.latency_ms && <p className="text-xs text-slate-400 mt-1">{healthData[service].latency_ms}ms</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-caption">Click "Run Check" to test system health</p>
            </div>
          )}
        </div>
      )}

      {/* 3e. Audit Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <ScrollText className="h-4 w-4 text-amber-600" />
              <span>Audit Log</span>
            </h3>
            <button
              onClick={runAudit}
              disabled={isAuditLoading}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl text-caption hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAuditLoading ? 'animate-spin' : ''}`} />
              <span>{isAuditLoading ? 'Running...' : 'Run Audit'}</span>
            </button>
          </div>
          {auditData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Checks</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{auditData.total_checks || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Passed</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{auditData.passed || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Failed</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">{auditData.failed || 0}</p>
                </div>
              </div>
              {auditData.issues && auditData.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issues</h4>
                  {auditData.issues.map((issue: any, i: number) => (
                    <div key={i} className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-slate-900">{issue.type}</p>
                      <p className="text-xs text-slate-600 mt-1">{issue.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-caption">Click "Run Audit" to perform a system audit</p>
            </div>
          )}
        </div>
      )}

      {/* 4. Manage User Modal */}
      {isManageModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500 no-scrollbar">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Modify Access</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Editing profile for {selectedUser.name}</p>
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
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Plan Tier</label>
                       <select name="tier" defaultValue={selectedUser.tier} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase outline-none focus:bg-white transition-all">
                          <option value="free">Free</option>
                          <option value="pro">Pro (₹99)</option>
                          <option value="alpha">Alpha (₹199)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Account Status</label>
                       <select name="active" defaultValue={String(!!selectedUser.is_active)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase outline-none focus:bg-white transition-all">
                          <option value="true">Active (Verified)</option>
                          <option value="false">Suspended / Deactivated</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1 text-blue-600">Start Date</label>
                       <input type="date" name="start" defaultValue={selectedUser.subscription_start?.split('T')[0]} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1 text-rose-600">Expiry Date</label>
                       <input type="date" name="expiry" defaultValue={selectedUser.subscription_expiry?.split('T')[0]} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:bg-white transition-all" />
                    </div>
                 </div>

                 <div className="bg-amber-50 rounded-2xl p-4 flex items-start space-x-3 border border-amber-100">
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-caption text-amber-700 leading-relaxed uppercase">Manual overrides bypass payment verification. Ensure date consistency to avoid user access issues.</p>
                 </div>

                 <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-3xl text-caption hover:bg-blue-600 transition-all shadow-xl active:scale-95">Commit Changes</button>
              </form>
           </div>
        </div>
      )}

      {/* 5. Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500 no-scrollbar">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Onboard Member</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manual Database Injection</p>
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
                       fetchData();
                       setIsAddUserModalOpen(false);
                    } else { toast(data.error || "Failed to onboard user."); }
                 } catch (e) { toast("Registration endpoint failed"); }
              }}>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Full Name</label>
                       <input type="text" name="name" required placeholder="Institutional Identity" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Email or Mobile</label>
                       <input type="text" name="email" required placeholder="contact@marketbeacon.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Initial Role</label>
                          <select name="role" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase outline-none focus:bg-white transition-all">
                             <option value="user">Retail User</option>
                             <option value="admin">System Admin</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1 text-slate-500">Temp Password</label>
                           <input type="text" name="password" placeholder="Auto-generated" className="w-full bg-slate-100 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none cursor-not-allowed" disabled value={tempPassword} />
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-3xl text-caption hover:bg-slate-900 transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2">
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
           <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500 no-scrollbar">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Create Voucher</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trial Pass Generation</p>
                 </div>
                 <button onClick={() => setIsAddVoucherModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-300">
                    <XCircle className="h-6 w-6" />
                 </button>
              </div>

              <form className="space-y-6" onSubmit={async (e) => {
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
                       fetchData();
                       setIsAddVoucherModalOpen(false);
                    } else { toast(data.error || "Failed to create voucher"); }
                 } catch (e) { toast("Voucher creation failed"); }
              }}>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Voucher Code</label>
                       <input type="text" name="code" required placeholder="e.g. ALPHA7DAY" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase outline-none focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Reward Tier</label>
                          <select name="tier" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase outline-none focus:bg-white transition-all">
                             <option value="alpha">Alpha Access</option>
                             <option value="pro">Pro Access</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Duration</label>
                          <select name="days" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold uppercase outline-none focus:bg-white transition-all">
                             <option value="7">7 Days (Standard)</option>
                             <option value="3">3 Days (Quick)</option>
                             <option value="30">30 Days (VIP)</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Max Redemptions</label>
                       <input type="number" name="uses" defaultValue="100" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:bg-white transition-all shadow-inner" />
                    </div>
                 </div>

                 <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-3xl text-caption hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2">
                    <span>Generate Voucher</span>
                    <ArrowRight className="h-4 w-4" />
                 </button>
              </form>
           </div>
        </div>
      )}
      {/* ── FEEDBACK REPLY MODAL ── */}
      {isReplyModalOpen && selectedFeedback && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsReplyModalOpen(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                       <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-900 leading-none italic uppercase tracking-tighter">Feedback Resolution</h3>
                       <p className="text-caption text-slate-500 uppercase tracking-wider mt-1">Replying to {selectedFeedback.user_name}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsReplyModalOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all">
                    <X className="h-5 w-5 text-slate-400" />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <span className="text-caption text-blue-600 uppercase block mb-1.5 tracking-wider">Original Report:</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed italic">"{selectedFeedback.comment}"</p>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider ml-1">Admin Resolution Statement</label>
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Explain the fix or resolution steps taken..."
                      className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-medium focus:bg-white focus:border-blue-600 transition-all outline-none shadow-inner resize-none"
                    />
                 </div>

                 <button 
                   onClick={handleSendReply}
                   disabled={isSubmittingReply || !replyText.trim()}
                   className="w-full py-5 bg-slate-900 text-white rounded-3xl text-caption hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:bg-slate-200 flex items-center justify-center space-x-2"
                 >
                    {isSubmittingReply ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Dispatch Resolution</span>
                      </>
                    )}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmState.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-500">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-xl ${confirmState.variant === 'danger' ? 'bg-rose-100' : 'bg-amber-100'}`}>
                <AlertTriangle className={`h-5 w-5 ${confirmState.variant === 'danger' ? 'text-rose-600' : 'text-amber-600'}`} />
              </div>
              <button onClick={() => setConfirmState(prev => ({ ...prev, open: false }))} className="p-1 hover:bg-slate-50 rounded-full transition-all text-slate-300">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <h3 className="text-lg font-black text-slate-900">{confirmState.title}</h3>
            <p className="text-xs text-slate-600">{confirmState.message}</p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setConfirmState(prev => ({ ...prev, open: false }))}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-caption font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { confirmState.onConfirm(); setConfirmState(prev => ({ ...prev, open: false })); }}
                className={`flex-1 py-3 text-white rounded-xl text-caption font-bold transition-all ${confirmState.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {confirmState.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminErrorBoundary>
  );
};

export default AdminPanel;
