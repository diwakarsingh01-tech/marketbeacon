import React, { useState, useMemo } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import {
  ChevronDown,
  Search,
  Zap,
  Settings,
  LayoutDashboard,
  HelpCircle,
  X,
  Sun,
  Moon,
  GitBranch,
  BarChart3,
  Users,
  Key,
  Globe,
  Code2,
  Layers,
  FileText,
  Video,
  ExternalLink,
} from 'lucide-react';

interface DocSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DocCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  pages: DocPage[];
}

interface DocPage {
  id: string;
  title: string;
  href: string;
  description?: string;
  badge?: string;
  external?: boolean;
}

const DOC_CATEGORIES: DocCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: 'New to MarketBeacon? Start here.',
    pages: [
      { id: 'intro', title: 'Introduction', href: '/docs/intro', description: 'What is MarketBeacon Pro?' },
      { id: 'quickstart', title: 'Quick Start Guide', href: '/docs/quickstart', description: 'Set up in 5 minutes', badge: 'New' },
      { id: 'first-trade', title: 'Your First Trade', href: '/docs/first-trade', description: 'Walkthrough: Idea to execution' },
      { id: 'dashboard-tour', title: 'Dashboard Tour', href: '/docs/dashboard-tour', description: 'Navigate the main interface' },
    ],
  },
  {
    id: 'core-concepts',
    label: 'Core Concepts',
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Understand the institutional framework.',
    pages: [
      { id: 'abc-framework', title: 'ABCD Averaging Framework', href: '/docs/abc-framework', description: 'Tranche-based position building' },
      { id: 'core-rules', title: 'Core Selection Rules', href: '/docs/core-rules', description: 'Universal institutional filters' },
      { id: 'risk-management', title: 'Risk & Portfolio Allocation', href: '/docs/risk-management', description: '50:30:20 rule, sector caps' },
      { id: 'baskets', title: 'Understanding Baskets', href: '/docs/baskets', description: 'Elite, Quality, Growth universes' },
      { id: 'market-structure', title: 'Market Structure Basics', href: '/docs/market-structure', description: 'Trend, range, accumulation phases' },
    ],
  },
  {
    id: 'strategies',
    label: 'Strategies',
    icon: <Zap className="h-4 w-4" />,
    description: 'Every strategy with step-by-step rules.',
    pages: [
      { id: 'free-strategies', title: 'Free Strategies', href: '/docs/free-strategies', description: 'Bollinger, Envelope Long/Short' },
      { id: 'pro-strategies', title: 'Pro Strategies', href: '/docs/pro-strategies', description: 'SMA+BCD, 52W, Cup & Handle' },
      { id: 'alpha-strategies', title: 'Alpha Strategies', href: '/docs/alpha-strategies', description: 'S&R, 67% Reset, 20% Velocity' },
      { id: 'strategy-comparison', title: 'Strategy Comparison', href: '/docs/strategy-comparison', description: 'When to use which strategy' },
      { id: 'building-custom', title: 'Build Your Own', href: '/docs/building-custom', description: '5-block framework for custom strategies' },
    ],
  },
  {
    id: 'platform-guide',
    label: 'Platform Guide',
    icon: <Settings className="h-4 w-4" />,
    description: 'Master every tool in the console.',
    pages: [
      { id: 'screener', title: 'Matrix Screener', href: '/docs/screener', description: 'Live strategy scanning engine' },
      { id: 'alpha-hub', title: 'Alpha Hub', href: '/docs/alpha-hub', description: 'Portfolio construction & monitoring' },
      { id: 'charts', title: 'Chart Terminal', href: '/docs/charts', description: 'Technical analysis workspace' },
      { id: 'portfolio-manager', title: 'Portfolio Manager', href: '/docs/portfolio-manager', description: 'Wealth tracking & rebalancing' },
      { id: 'trade-journal', title: 'Trade Journal', href: '/docs/trade-journal', description: 'Institutional-grade trade diary' },
      { id: 'beacon-ai', title: 'BeaconAI Assistant', href: '/docs/beacon-ai', description: 'Strategy AI assistant' },
      { id: 'education', title: 'Video Course', href: '/docs/education', description: 'Structured learning modules' },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    icon: <FileText className="h-4 w-4" />,
    description: 'Technical specifications & API.',
    pages: [
      { id: 'api-reference', title: 'API Reference', href: '/docs/api-reference', description: 'REST endpoints & authentication' },
      { id: 'webhooks', title: 'Webhooks', href: '/docs/webhooks', description: 'Real-time event notifications' },
      { id: 'data-sources', title: 'Data Sources', href: '/docs/data-sources', description: 'Where our data comes from' },
      { id: 'calculation-methodology', title: 'Calculation Methodology', href: '/docs/calculation-methodology', description: 'How signals & scores are computed' },
      { id: 'glossary', title: 'Glossary', href: '/docs/glossary', description: 'Key terms & definitions' },
      { id: 'faq', title: 'FAQ', href: '/docs/faq', description: 'Frequently asked questions' },
    ],
  },
  {
    id: 'account',
    label: 'Account & Billing',
    icon: <Key className="h-4 w-4" />,
    description: 'Manage your subscription & profile.',
    pages: [
      { id: 'subscription', title: 'Subscription Plans', href: '/docs/subscription', description: 'Free, Pro, Alpha tiers' },
      { id: 'billing', title: 'Billing & Invoices', href: '/docs/billing', description: 'Payment methods & history' },
      { id: 'profile', title: 'Profile Settings', href: '/docs/profile', description: 'Notifications, preferences' },
      { id: 'team', title: 'Team Management', href: '/docs/team', description: 'Invite collaborators (Alpha)' },
    ],
  },
];

const SIDEBAR_FOOTER_LINKS = [
  { label: 'Community', href: 'https://t.me/marketbeacon', icon: <Users className="h-4 w-4" />, external: true },
  { label: 'Status Page', href: 'https://status.marketbeaconpro.com', icon: <BarChart3 className="h-4 w-4" />, external: true },
  { label: 'Changelog', href: '/docs/changelog', icon: <GitBranch className="h-4 w-4" /> },
  { label: 'Request Feature', href: 'https://github.com/marketbeacon/feedback/issues/new', icon: <HelpCircle className="h-4 w-4" />, external: true },
];

export const DocSidebar: React.FC<DocSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    DOC_CATEGORIES.map(c => c.id)
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return DOC_CATEGORIES;
    
    const query = searchQuery.toLowerCase();
    return DOC_CATEGORIES.map(cat => ({
      ...cat,
      pages: cat.pages.filter(page => 
        page.title.toLowerCase().includes(query) ||
        page.description?.toLowerCase().includes(query) ||
        page.id.toLowerCase().includes(query)
      )
    })).filter(cat => cat.pages.length > 0);
  }, [searchQuery]);

  const currentCategory = useMemo(() => {
    const pathParts = location.pathname.split('/');
    return pathParts[2] || 'getting-started';
  }, [location.pathname]);

  const currentPage = useMemo(() => {
    const pathParts = location.pathname.split('/');
    return pathParts[3] || 'intro';
  }, [location.pathname]);

  return (
    <div className="contents">
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-[105] lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[110] w-72 lg:w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)]
          flex flex-col transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Documentation navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border-primary)] shrink-0">
          <Link to="/docs/intro" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-amber)] to-emerald-500 rounded-xl flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-lg text-[var(--text-primary)] hidden sm:block">
              MarketBeacon Docs
            </span>
          </Link>
          
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 md:p-6 pb-0 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="search"
              placeholder="Search docs... (⌘K)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] py-2.5 pl-10 pr-4 rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--accent-amber)]/20 focus:border-[var(--accent-amber)] transition-all"
              aria-label="Search documentation"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] rounded">
              <span className="kbd-key">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6" aria-label="Documentation sections">
          {filteredCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const hasActivePage = category.pages.some(p => p.id === currentPage);
            const isCurrentCategory = category.id === currentCategory;

            return (
              <div key={category.id} className="space-y-2">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group"
                  aria-expanded={isExpanded}
                  aria-controls={`${category.id}-pages`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                    isCurrentCategory || hasActivePage
                      ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border border-[var(--accent-amber)]/20'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:bg-[var(--bg-primary)]'
                  }`}>
                    {category.icon}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <span className={`font-semibold text-sm ${isCurrentCategory || hasActivePage ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {category.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider block truncate">
                      {category.description}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {/* Pages */}
                <div
                  id={`${category.id}-pages`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <ul className="mt-1 space-y-1 pl-11" role="list">
                    {category.pages.map((page) => {
                      const isActive = page.id === currentPage && category.id === currentCategory;
                      const isExternal = page.external === true;
                      
                      return (
                        <li key={page.id}>
                          {isExternal ? (
                            <a
                              href={page.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                isActive
                                  ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border-l-2 border-[var(--accent-amber)]'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                              }`}
                              onClick={onClose}
                            >
                              <span className="flex-1 truncate">{page.title}</span>
                              {page.badge && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] rounded">
                                  {page.badge}
                                </span>
                              )}
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
                            </a>
                          ) : (
                            <NavLink
                              to={page.href}
                              className={({ isActive: navActive }) => `
                                flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                                ${navActive
                                  ? 'bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] border-l-2 border-[var(--accent-amber)]'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                                }
                              `}
                              onClick={onClose}
                            >
                              <span className="flex-1 truncate">{page.title}</span>
                              {page.badge && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] rounded">
                                  {page.badge}
                                </span>
                              )}
                            </NavLink>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}

          {/* Footer Links */}
          <div className="pt-6 border-t border-[var(--border-primary)] space-y-2">
            {SIDEBAR_FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
                onClick={onClose}
              >
                <span className="w-6 h-6 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-muted)]">
                  {link.icon}
                </span>
                <span className="flex-1 truncate">{link.label}</span>
                {link.external && <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" />}
              </a>
            ))}
          </div>
        </nav>

        {/* Version Info */}
        <div className="p-4 md:p-6 border-t border-[var(--border-primary)] shrink-0">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
            <span>v18.5.0-PRO</span>
            <a
              href="https://github.com/marketbeacon/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[var(--accent-amber)] transition-colors"
            >
              <Code2 className="h-3.5 w-3.5" />
              Edit on GitHub
            </a>
          </div>
        </div>
      </aside>
      </div>
  );
};