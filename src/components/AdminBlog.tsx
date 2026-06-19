import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api-utils';
import { toast } from 'sonner';
import { FileText, Plus, Trash2, Eye, EyeOff, Edit3, X } from 'lucide-react';

const API_URL = getApiUrl();

interface Section { heading?: string; body: string; }

export default function AdminBlog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('mb_token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/blog`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setPosts(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const emptyPost = () => ({
    title: '', slug: '', meta_description: '', tag: 'General',
    tag_color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    read_time: '5 min read', date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    sections: [{ heading: '', body: '' }] as Section[],
    key_takeaways: [] as string[],
    related_slug: '', related_title: '', published: 1,
  });

  const save = async () => {
    if (!editor.title || !editor.slug) { toast('Title and slug are required'); return; }
    setSaving(true);
    try {
      const body = { ...editor, key_takeaways: editor.key_takeaways.filter((t: string) => t.trim()) };
      const res = editor.id
        ? await fetch(`${API_URL}/api/admin/blog/${editor.id}`, { method: 'PUT', headers, body: JSON.stringify(body) })
        : await fetch(`${API_URL}/api/admin/blog`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (res.ok) { toast(editor.id ? 'Updated' : 'Created'); setEditor(null); fetchPosts(); }
      else toast('Failed to save');
    } catch (e: any) { toast(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await fetch(`${API_URL}/api/admin/blog/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchPosts();
    } catch (e: any) { toast(e.message); }
  };

  const togglePublish = async (post: any) => {
    try {
      await fetch(`${API_URL}/api/admin/blog/${post.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ ...post, published: post.published ? 0 : 1 })
      });
      fetchPosts();
    } catch (e: any) { toast(e.message); }
  };

  const addSection = () => setEditor({ ...editor, sections: [...editor.sections, { heading: '', body: '' }] });
  const removeSection = (i: number) => setEditor({ ...editor, sections: editor.sections.filter((_: any, idx: number) => idx !== i) });
  const updateSection = (i: number, field: string, value: string) => {
    const sections = [...editor.sections];
    sections[i] = { ...sections[i], [field]: value };
    setEditor({ ...editor, sections });
  };

  if (loading) return <div className="p-8 text-center text-sm font-bold text-slate-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black uppercase tracking-widest">Blog Posts ({posts.length})</h2>
        <button onClick={() => setEditor(emptyPost())} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-slate-400">No blog posts yet.</p>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-6 py-4">
              <div className="flex items-center gap-4 min-w-0">
                <FileText className="w-5 h-5 text-slate-300 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{post.title}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/{post.slug} · {post.tag} · {post.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePublish(post)} className={`p-2 rounded-xl transition-all ${post.published ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-50'}`} title={post.published ? 'Published' : 'Draft'}>
                  {post.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditor(post)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-all">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => remove(post.id)} className="p-2 rounded-xl text-red-400 hover:bg-red-50 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {editor && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-start justify-center pt-10 pb-10 overflow-y-auto" onClick={() => setEditor(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-3xl mx-4 p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest">{editor.id ? 'Edit Post' : 'New Post'}</h3>
              <button onClick={() => setEditor(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Title</label>
                  <input value={editor.title} onChange={e => setEditor({ ...editor, title: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Slug (URL)</label>
                  <input value={editor.slug} onChange={e => setEditor({ ...editor, slug: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white transition-all" />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Meta Description</label>
                <textarea value={editor.meta_description} onChange={e => setEditor({ ...editor, meta_description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white transition-all" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Tag</label>
                  <input value={editor.tag} onChange={e => setEditor({ ...editor, tag: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Read Time</label>
                  <input value={editor.read_time} onChange={e => setEditor({ ...editor, read_time: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Date</label>
                  <input value={editor.date} onChange={e => setEditor({ ...editor, date: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white transition-all" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Content Sections</label>
                  <button onClick={addSection} className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400">+ Add Section</button>
                </div>
                {editor.sections.map((section: Section, i: number) => (
                  <div key={i} className="mb-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Section {i + 1}</span>
                      <button onClick={() => removeSection(i)} className="text-red-400 hover:text-red-300 text-[9px] font-black uppercase tracking-widest">Remove</button>
                    </div>
                    <input value={section.heading || ''} onChange={e => updateSection(i, 'heading', e.target.value)} placeholder="Heading (optional)" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold mb-2 focus:bg-white transition-all" />
                    <textarea value={section.body} onChange={e => updateSection(i, 'body', e.target.value)} placeholder="Body text (use \n\n for paragraphs)" rows={5} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:bg-white transition-all" />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Key Takeaways (one per line)</label>
                <textarea value={editor.key_takeaways.join('\n')} onChange={e => setEditor({ ...editor, key_takeaways: e.target.value.split('\n').filter((t: string) => t.trim()) })} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Related Article Slug</label>
                  <input value={editor.related_slug || ''} onChange={e => setEditor({ ...editor, related_slug: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Related Article Title</label>
                  <input value={editor.related_title || ''} onChange={e => setEditor({ ...editor, related_title: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white transition-all" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!editor.published} onChange={e => setEditor({ ...editor, published: e.target.checked ? 1 : 0 })} className="rounded" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Published</span>
              </label>
              <button onClick={save} disabled={saving} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
