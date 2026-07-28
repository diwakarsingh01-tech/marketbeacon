import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { DocSidebar } from './DocSidebar';
import Breadcrumbs from '../ui/Breadcrumbs';
import { Menu } from 'lucide-react';

interface DocLayoutProps {
  children?: React.ReactNode;
}

export const DocLayout: React.FC<DocLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Hide/show header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts[0] !== 'docs') return [];

    const crumbs = [
      { label: 'Docs', href: '/docs/intro' },
    ];

    let currentPath = '/docs';
    pathParts.slice(1).forEach((part, index) => {
      currentPath += `/${part}`;
      const isLast = index === pathParts.length - 2;
      crumbs.push({
        label: part
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        href: isLast ? currentPath : currentPath,
      });
    });

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* DocSidebar */}
      <DocSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top Header - Mobile only */}
        <header
          className={`
            fixed top-0 left-0 right-0 z-[100] lg:hidden
            bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-primary)]
            transition-transform duration-300 ease-in-out
            ${headerVisible ? 'translate-y-0' : '-translate-y-full'}
          `}
          role="banner"
        >
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link to="/docs/intro" className="font-black text-lg text-[var(--text-primary)]">
                MarketBeacon Docs
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/app"
                className="px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 rounded-xl hover:bg-[var(--accent-amber)]/20 transition-all"
              >
                Launch App
              </Link>
            </div>
          </div>
        </header>

        {/* Desktop Header - Sticky breadcrumb bar */}
        <header
          className={`
            hidden lg:sticky lg:top-0 z-[90]
            bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-primary)]
            transition-transform duration-300 ease-in-out
            ${headerVisible ? 'translate-y-0' : '-translate-y-full'}
          `}
          role="banner"
        >
          <div className="max-w-7xl mx-auto px-6 py-3">
            {breadcrumbs.length > 0 && (
              <Breadcrumbs items={breadcrumbs} />
            )}
          </div>
        </header>

        {/* Main Content */}
        <main
          className="flex-1 lg:pt-16 pb-20"
          id="main-content"
          role="main"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
            {children || <Outlet />}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 shrink-0">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-4">Documentation</h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li><Link to="/docs/intro" className="hover:text-[var(--accent-amber)] transition-colors">Introduction</Link></li>
                  <li><Link to="/docs/quickstart" className="hover:text-[var(--accent-amber)] transition-colors">Quick Start</Link></li>
                  <li><Link to="/docs/abc-framework" className="hover:text-[var(--accent-amber)] transition-colors">ABCD Framework</Link></li>
                  <li><Link to="/docs/strategies" className="hover:text-[var(--accent-amber)] transition-colors">All Strategies</Link></li>
                  <li><Link to="/docs/api-reference" className="hover:text-[var(--accent-amber)] transition-colors">API Reference</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li><Link to="/docs/screener" className="hover:text-[var(--accent-amber)] transition-colors">Matrix Screener</Link></li>
                  <li><Link to="/docs/alpha-hub" className="hover:text-[var(--accent-amber)] transition-colors">Alpha Hub</Link></li>
                  <li><Link to="/docs/charts" className="hover:text-[var(--accent-amber)] transition-colors">Chart Terminal</Link></li>
                  <li><Link to="/docs/beacon-ai" className="hover:text-[var(--accent-amber)] transition-colors">BeaconAI</Link></li>
                  <li><Link to="/docs/education" className="hover:text-[var(--accent-amber)] transition-colors">Video Course</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-4">Reference</h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li><Link to="/docs/glossary" className="hover:text-[var(--accent-amber)] transition-colors">Glossary</Link></li>
                  <li><Link to="/docs/calculation-methodology" className="hover:text-[var(--accent-amber)] transition-colors">Methodology</Link></li>
                  <li><Link to="/docs/data-sources" className="hover:text-[var(--accent-amber)] transition-colors">Data Sources</Link></li>
                  <li><Link to="/docs/faq" className="hover:text-[var(--accent-amber)] transition-colors">FAQ</Link></li>
                  <li><Link to="/docs/changelog" className="hover:text-[var(--accent-amber)] transition-colors">Changelog</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-4">Community</h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li><a href="https://t.me/marketbeacon" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-amber)] transition-colors">Telegram</a></li>
                  <li><a href="https://status.marketbeaconpro.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-amber)] transition-colors">Status Page</a></li>
                  <li><a href="https://github.com/marketbeacon/feedback/issues/new" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent-amber)] transition-colors">Request Feature</a></li>
                  <li><a href="mailto:hello@marketbeaconpro.com" className="hover:text-[var(--accent-amber)] transition-colors">Contact Support</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-[var(--border-primary)] flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-[var(--text-tertiary)]">
                © 2026 MarketBeacon Pro. Built for institutional-grade investing.
              </p>
              <div className="flex items-center gap-6 text-sm text-[var(--text-tertiary)]">
                <a href="/privacy" className="hover:text-[var(--accent-amber)] transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-[var(--accent-amber)] transition-colors">Terms</a>
                <a href="/disclaimer" className="hover:text-[var(--accent-amber)] transition-colors">Disclaimer</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};