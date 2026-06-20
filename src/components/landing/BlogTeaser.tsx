import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, BookOpen } from 'lucide-react';
import { getApiUrl } from '../../lib/api-utils';

interface BlogTeaserArticle {
  slug: string;
  tag: string;
  title: string;
  read_time?: string;
}

const TAG_COLORS: Record<string, string> = {
  Strategy: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
  Education: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
  Institutional: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
  'Deep Dive': 'text-purple-400 border-purple-400/20 bg-purple-400/5',
  Analysis: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5',
};

const FALLBACK_ARTICLES: BlogTeaserArticle[] = [
  { slug: 'abcd-tranche-laddering-guide', tag: 'Strategy', title: 'ABCD Tranche Laddering: The Complete Guide for Indian Traders', read_time: '6 min read' },
  { slug: 'institutional-audit-score-explained', tag: 'Deep Dive', title: 'The 100-Point Institutional Audit Score: How Stocks Are Graded', read_time: '7 min read' },
  { slug: 'what-is-sebi-compliant-stock-screener', tag: 'Education', title: 'What Should a Responsible Stock Research Tool Look Like?', read_time: '5 min read' },
];

const BlogTeaser: React.FC = () => {
  const [articles, setArticles] = useState<BlogTeaserArticle[] | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/blog/recent?limit=3`)
      .then(r => { if (!r.ok) throw new Error('API unavailable'); return r.json(); })
      .then(data => {
        const hasArticles = Array.isArray(data) && data.length > 0;
        setArticles(hasArticles ? data : FALLBACK_ARTICLES);
        setUsingFallback(!hasArticles);
      })
      .catch(() => {
        setArticles(FALLBACK_ARTICLES);
        setUsingFallback(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const displayArticles = articles || FALLBACK_ARTICLES;

  if (loading) return null;

  return (
    <section className="py-20 px-6 md:px-10 border-t border-[var(--border-primary)]/50">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">Knowledge Base</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)]">Latest <span className="text-blue-400">Insights</span></h2>
            {usingFallback && (
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2">
                Curated starter reads while the live feed refreshes.
              </p>
            )}
          </div>
          <Link to="/blog" className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors shrink-0">
            All Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayArticles.map((a) => (
            <Link
              key={a.slug}
              to={`/blog/${a.slug}`}
              className="group bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-[1.5rem] p-6 flex flex-col gap-4 hover:border-slate-600 hover:-translate-y-1 transition-all"
            >
              <span className={`self-start px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${TAG_COLORS[a.tag] || 'text-slate-400 border-slate-400/20 bg-slate-400/5'}`}>
                {a.tag}
              </span>
              <h3 className="text-sm font-black text-[var(--text-primary)] group-hover:text-blue-300 transition-colors leading-snug">
                {a.title}
              </h3>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" />{a.read_time || '3 min read'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
        </div>
      </section>
  );
};

export default BlogTeaser;
