import React, { useState, useEffect, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen, TrendingUp, ShieldCheck, BarChart2, ChevronRight } from 'lucide-react';
import BrandLogo from '../components/brand/BrandLogo';
import SiteFooter from '../components/layout/SiteFooter';
import SEO from '../components/SEO';
import { OrganizationSchema, BreadcrumbSchema } from '../components/StructuredData';
import { getApiUrl } from '../lib/api-utils';
import { NewsletterCapture } from '../components/ui/NewsletterCapture';

interface BlogArticle {
  slug: string;
  tag: string;
  tagColor: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  highlight: string | null;
  id?: number;
  meta_description?: string;
}

const FALLBACK_ARTICLES = [
  {
    slug: 'abcd-tranche-laddering-guide',
    tag: 'Strategy',
    tagColor: 'text-[#00d09c] bg-[#00d09c]/10 border-[#00d09c]/20',
    icon: TrendingUp,
    iconColor: 'text-[#00d09c]',
    title: "What is ABCD Tranche Laddering? A Beginner's Guide for Indian Traders",
    excerpt: 'Instead of putting all your capital at one price, ABCD Tranche Laddering splits your entry into 4 systematic tranches — the same method used by FII/DII desks to manage risk and maximize returns.',
    readTime: '6 min read',
    date: 'Jun 06, 2026',
    highlight: 'Most Read',
  },
  {
    slug: 'what-is-sebi-compliant-stock-screener',
    tag: 'Education',
    tagColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    icon: ShieldCheck,
    iconColor: 'text-emerald-500',
    title: 'What to Know Before Using a Stock Research Tool: A SEBI Framework Guide',
    excerpt: 'Many platforms claim to give buy/sell calls without SEBI registration. Learn the difference between advisory and research tools, and what to look for before using any stock research platform.',
    readTime: '5 min read',
    date: 'Jun 06, 2026',
    highlight: null,
  },
  {
    slug: 'how-to-trade-like-fii-dii-india',
    tag: 'Institutional',
    tagColor: 'text-amber-600 bg-amber-50 border-amber-200',
    icon: BarChart2,
    iconColor: 'text-amber-500',
    title: 'How to Trade Like FII/DII in India: The Institutional Strategy Explained',
    excerpt: "FIIs and DIIs don't chase breakouts or news — they build positions systematically at value floors. This guide reveals the 3 core principles of institutional capital deployment and how retail traders can replicate it.",
    readTime: '8 min read',
    date: 'Jun 06, 2026',
    highlight: null,
  },
  {
    slug: 'institutional-audit-score-explained',
    tag: 'Deep Dive',
    tagColor: 'text-purple-600 bg-purple-50 border-purple-200',
    icon: BookOpen,
    iconColor: 'text-purple-500',
    title: 'The 100-Point Institutional Audit Score: How Stocks Are Graded',
    excerpt: "Behind every Qualified, Neutral, or Rejected rating is a 100-point audit matrix. We break down each of the 12 fundamental and technical parameters that determine a stock's audit score.",
    readTime: '7 min read',
    date: 'Jun 06, 2026',
    highlight: null,
  },
];

const ICON_MAP: Record<string, ComponentType> = { TrendingUp, ShieldCheck, BarChart2, BookOpen };

const BlogPage: React.FC = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/blog`)
      .then(r => {
        if (!r.ok) throw new Error('API unavailable');
        return r.json();
      })
      .then((data: any[]) => {
        setArticles(data.map((a: any) => ({
          ...a,
          icon: ICON_MAP[a.tag] || BookOpen,
          iconColor: a.tag_color?.match(/text-\w+-\d+/)?.[0] || 'text-[#00d09c]',
          highlight: a.id === 1 ? 'Most Read' : null,
          excerpt: a.meta_description,
        })));
      })
      .catch(() => setArticles(FALLBACK_ARTICLES))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans pb-24 md:pb-0">
      <SEO title="Stock Market Research Blog" description="Learn institutional research methods, ABCD Tranche strategy, and market analysis. Educational content for Indian stock market investors." url="/blog" />
      <OrganizationSchema />
      <BreadcrumbSchema items={[{ label: 'Home', href: '/' }, { label: 'Blog', href: '/blog' }]} />

      {/* Navigation */}
      <nav className="border-b border-slate-100 px-6 md:px-10 py-4 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <BrandLogo variant="light" size={28} />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-wider transition-colors hidden md:block">
            ← Back to Home
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-[#00d09c]/20"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <header className="py-16 md:py-20 px-6 md:px-10 max-w-[1100px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d09c]/10 border border-[#00d09c]/20 rounded-full mb-6">
            <BookOpen className="h-3.5 w-3.5 text-[#00d09c]" />
            <span className="text-xs font-bold text-[#00d09c] uppercase tracking-[0.3em]">Knowledge Base</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mb-4 leading-none">
            Institutional <span className="text-[#00d09c]">Insights.</span>
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Learn the strategies, systems, and logic behind institutional trading — explained simply for retail traders and advisors.
          </p>
        </header>

        {/* Featured Article */}
        <section className="px-6 md:px-10 max-w-[1100px] mx-auto mb-12">
          {articles.length > 0 && <Link
            to={`/blog/${articles[0].slug}`}
            className="group block bg-gradient-to-br from-[#00d09c]/5 to-emerald-50 border border-[#00d09c]/20 rounded-3xl p-8 md:p-12 hover:border-[#00d09c]/40 transition-all hover:-translate-y-1 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full border text-caption ${articles[0].tagColor}`}>
                    {articles[0].tag}
                  </span>
                  {articles[0].highlight && <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-600 uppercase tracking-wider">
                    ⭐ {articles[0].highlight}
                  </span>}
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight group-hover:text-[#00d09c] transition-colors">
                  {articles[0].title}
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">{articles[0].excerpt}</p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{articles[0].readTime}</span>
                  <span>{articles[0].date}</span>
                </div>
                <div className="flex items-center gap-2 text-[#00d09c] text-caption group-hover:gap-3 transition-all font-bold">
                  Read Article <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              {/* ABCD Tranche Preview */}
              <div className="bg-white border border-slate-100 rounded-2xl p-8 space-y-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">ABCD Tranche Preview</p>
                {[
                  { stage: 'A', pct: '25%', label: 'Base Price Floor', color: 'bg-[#00d09c]' },
                  { stage: 'B', pct: '50%', label: 'Pullback Accumulation', color: 'bg-[#00bda0]' },
                  { stage: 'C', pct: '85%', label: 'Value Floor Lock', color: 'bg-emerald-400' },
                  { stage: 'D', pct: '100%', label: 'Breakout / Target', color: 'bg-amber-400' },
                ].map(({ stage, pct, label, color }) => (
                  <div key={stage} className="space-y-1">
                    <div className="flex justify-between text-caption">
                      <span className="text-slate-600 font-semibold">Stage {stage} — {label}</span>
                      <span className="text-slate-400 font-bold">{pct}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Link>}
        </section>

        {/* Article Grid */}
        <section className="px-6 md:px-10 max-w-[1100px] mx-auto pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.slice(1).map((article) => {
              const Icon = article.icon;
              return (
                <Link
                  key={article.slug}
                  to={`/blog/${article.slug}`}
                  className="group bg-white border border-slate-100 rounded-2xl p-7 flex flex-col hover:border-[#00d09c]/30 hover:shadow-md transition-all hover:-translate-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className={`px-3 py-1 rounded-full border text-caption ${article.tagColor}`}>
                      {article.tag}
                    </span>
                    <Icon className={`w-4 h-4 ${article.iconColor}`} />
                  </div>
                  <h2 className="text-base font-bold text-slate-800 tracking-tight mb-3 leading-snug flex-1 group-hover:text-[#00d09c] transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed mb-5 line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />{article.readTime}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#00d09c] uppercase tracking-wider group-hover:gap-2 transition-all">
                      Read <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Newsletter Capture */}
        <section className="px-6 md:px-10 max-w-[1100px] mx-auto my-12">
          <NewsletterCapture segment="blog" />
        </section>

        {/* CTA Strip */}
        <section className="border-t border-slate-100 py-16 px-6 text-center bg-slate-50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em] mb-4">Ready to Apply This?</p>
          <h3 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tighter mb-6">Start Using the System. Free.</h3>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-2xl font-bold uppercase tracking-wider text-sm hover:scale-105 transition-all shadow-lg shadow-[#00d09c]/20"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default BlogPage;
