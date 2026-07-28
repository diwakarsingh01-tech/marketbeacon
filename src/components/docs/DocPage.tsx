import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, 
  Copy, Check, ExternalLink, Github, BookOpen
} from 'lucide-react';

interface DocPageProps {
  title: string;
  description: string;
  slug: string;
  content: React.ReactNode;
  toc?: { id: string; title: string; level: number }[];
  prevPage?: { title: string; href: string };
  nextPage?: { title: string; href: string };
  lastUpdated?: string;
  editUrl?: string;
}

export const DocPage: React.FC<DocPageProps> = ({
  title,
  description,
  slug,
  content,
  toc = [],
  prevPage,
  nextPage,
  lastUpdated,
  editUrl,
}) => {
  return (
    <article className="prose prose-invert max-w-none lg:prose-lg xl:prose-xl">
      {/* Page Header */}
      <header className="mb-10 pb-8 border-b border-[var(--border-primary)]">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--bg-tertiary)] rounded-full text-[var(--text-tertiary)]">
            Documentation
          </span>
          {slug !== 'intro' && (
            <span className="text-[var(--text-tertiary)] text-sm">/</span>
          )}
          <span className="text-[var(--text-tertiary)] text-sm font-mono">
            {slug.replace(/-/g, ' / ')}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-4">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed max-w-3xl mb-6">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-tertiary)]">
          {lastUpdated && (
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Updated {lastUpdated}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {Math.ceil(description.split(' ').length / 200)} min read
          </span>
        </div>
      </header>

      {/* Table of Contents - Sidebar on desktop */}
      <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-8 mb-12">
        <nav className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl p-5" aria-label="Table of contents">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            On this page
          </h3>
          {toc.length > 0 ? (
            <ul className="space-y-2">
              {toc.map((item) => (
                <li key={item.id} className={item.level === 2 ? '' : 'pl-4'}>
                  <a
                    href={`#${item.id}`}
                    className={`block py-1 text-sm transition-colors ${
                      item.level === 2 
                        ? 'font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-amber)]'
                        : 'font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">No sections in this page.</p>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="lg:pr-8">
        <div className="prose-content">
          {content}
        </div>
      </div>

      {/* Page Navigation - Prev/Next */}
      {(prevPage || nextPage) && (
        <nav className="mt-16 pt-8 border-t border-[var(--border-primary)]" aria-label="Page navigation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prevPage ? (
              <Link
                to={prevPage.href}
                className="group flex items-center gap-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-amber)]/50 hover:bg-[var(--accent-amber)]/5 transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center group-hover:bg-[var(--accent-amber)]/20 transition-colors">
                  <ChevronLeft className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-amber)]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Previous</p>
                  <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-amber)] transition-colors">
                    {prevPage.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {nextPage ? (
              <Link
                to={nextPage.href}
                className="group flex items-center gap-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-amber)]/50 hover:bg-[var(--accent-amber)]/5 transition-all justify-end"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] text-right">Next</p>
                  <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-amber)] transition-colors text-right">
                    {nextPage.title}
                  </p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center group-hover:bg-[var(--accent-amber)]/20 transition-colors">
                  <ChevronRight className="h-5 w-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-amber)]" />
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </nav>
      )}

      {/* Feedback Section */}
      <section className="mt-16 pt-8 border-t border-[var(--border-primary)]">
        <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">Was this page helpful?</h3>
              <p className="text-[var(--text-secondary)]">
                Your feedback helps us improve the documentation for everyone.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="group flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all font-semibold"
              >
                <Check className="h-4 w-4" />
                Yes, helpful
              </button>
              <button
                className="group flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-xl hover:border-[var(--accent-amber)]/50 hover:text-[var(--accent-amber)] transition-all font-semibold"
              >
                <ExternalLink className="h-4 w-4" />
                Report issue
              </button>
              {editUrl && (
                <a
                  href={editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-xl hover:border-[var(--accent-amber)]/50 hover:text-[var(--accent-amber)] transition-all font-semibold"
                >
                  <Github className="h-4 w-4" />
                  Edit on GitHub
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </article>
  );
};

// Helper components for doc content
export const DocCallout: React.FC<{
  type: 'info' | 'warning' | 'tip' | 'danger' | 'note';
  title?: string;
  children: React.ReactNode;
}> = ({ type, title, children }) => {
  const styles = {
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '💡', text: 'text-blue-400' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: '⚠️', text: 'text-amber-400' },
    tip: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '🎯', text: 'text-emerald-400' },
    danger: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: '🚫', text: 'text-rose-400' },
    note: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '📝', text: 'text-purple-400' },
  };

  const s = styles[type];

  return (
    <div className={`${s.bg} ${s.border} border rounded-xl p-4 md:p-6 my-6`}>
      <div className="flex gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">{s.icon}</span>
        <div className="flex-1">
          {title && (
            <h4 className={`font-bold ${s.text} mb-2`}>{title}</h4>
          )}
          <div className={`text-[var(--text-secondary)] ${s.text}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DocCodeBlock: React.FC<{
  code: string;
  language?: string;
  filename?: string;
  highlightLines?: number[];
}> = ({ code, language = 'typescript', filename, highlightLines = [] }) => {
  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-primary)]">
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
          {filename && (
            <span className="font-mono text-sm text-[var(--text-secondary)]">{filename}</span>
          )}
          <div className="flex items-center gap-3">
            {language && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-2 py-0.5 bg-[var(--bg-primary)] rounded">
                {language}
              </span>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
              aria-label="Copy code"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <pre className="p-4 md:p-6 overflow-x-auto" style={{ maxHeight: '600px' }}>
        <code className={`language-${language} text-sm leading-relaxed`}>
          {code.split('\n').map((line, i) => (
            <div
              key={i}
              className={`relative ${highlightLines.includes(i + 1) ? 'bg-[var(--accent-amber)]/10 border-l-2 border-[var(--accent-amber)] pl-4' : ''}`}
            >
              <span className="inline-block w-8 text-right text-[var(--text-tertiary)] pr-4 select-none">
                {i + 1}
              </span>
              {line || <br />}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};

export const DocTable: React.FC<{
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
}> = ({ headers, rows, caption }) => {
  return (
    <div className="overflow-x-auto my-6 rounded-xl border border-[var(--border-primary)]">
      <table className="w-full">
        {caption && (
          <caption className="p-4 font-semibold text-[var(--text-primary)] bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
            {caption}
          </caption>
        )}
        <thead className="bg-[var(--bg-secondary)]">
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${rowIndex % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]/50'} hover:bg-[var(--accent-amber)]/5 transition-colors`}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-[var(--text-secondary)] border-b border-[var(--border-primary)]/50"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const DocTabs: React.FC<{
  tabs: { label: string; content: React.ReactNode }[];
  defaultIndex?: number;
}> = ({ tabs, defaultIndex = 0 }) => {
  const [activeIndex, setActiveIndex] = React.useState(defaultIndex);

  return (
    <div className="my-6 rounded-xl border border-[var(--border-primary)] overflow-hidden">
      <div className="flex border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`flex-1 px-6 py-3 text-sm font-semibold transition-all relative ${
              activeIndex === index
                ? 'text-[var(--accent-amber)] bg-[var(--bg-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.label}
            {activeIndex === index && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-amber)]" />
            )}
          </button>
        ))}
      </div>
      <div className="p-4 md:p-6">
        {tabs[activeIndex].content}
      </div>
    </div>
  );
};

export const DocStep: React.FC<{
  number: number;
  title: string;
  description: string;
  details?: React.ReactNode;
  code?: string;
  language?: string;
}> = ({ number, title, description, details, code, language }) => {
  return (
    <div className="relative pl-14 pb-8 border-l border-[var(--border-primary)]/50 last:border-0 last:pb-0">
      <div className="absolute left-0 top-0">
        <div className="w-8 h-8 rounded-full bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 flex items-center justify-center text-[var(--accent-amber)] font-black text-sm">
          {number}
        </div>
        <div className="w-0.5 h-full bg-[var(--border-primary)]/50 mt-2" />
      </div>
      <div className="mb-2">
        <h4 className="font-bold text-lg text-[var(--text-primary)]">{title}</h4>
        <p className="text-[var(--text-secondary)] mt-1">{description}</p>
      </div>
      {details && <div className="ml-2 text-[var(--text-secondary)]">{details}</div>}
      {code && (
        <DocCodeBlock code={code} language={language || 'typescript'} />
      )}
    </div>
  );
};