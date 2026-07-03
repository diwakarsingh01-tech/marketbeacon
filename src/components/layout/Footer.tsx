import React, { useState } from 'react';
import { ShieldCheck, ArrowUpRight, Lock, BookOpen, Layers, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import LegalModal from '../modals/LegalModal';
import { Link } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo';
import { WHATSAPP_BASE } from '../../lib/constants';

const GlobalFooter: React.FC = () => {
  const [legalModal, setLegalModal] = useState<{ open: boolean, type: 'policy' | 'risk' }>({ open: false, type: 'policy' });
  const [isDisclaimerExpanded, setIsDisclaimerExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <footer className="mt-auto py-16 px-6 md:px-12 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-md relative z-40">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Main Footer Sitemap Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Column 1: Info */}
            <div className="space-y-4">
              <BrandLogo variant="light" size={28} />
              <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed uppercase tracking-wide">
                 India's high-performance quantitative research terminal. Backed by mathematical models and capitulation algorithms.
              </p>
            </div>

            {/* Column 2: Core Terminal */}
            <div className="space-y-3">
              <button onClick={() => toggleSection('core')} className="w-full flex items-center justify-between md:cursor-default">
                <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Core Terminal</h4>
                <span className="md:hidden text-[var(--text-muted)]">{expandedSections.core ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
              </button>
              <ul className={`space-y-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider overflow-hidden transition-all duration-300 md:max-h-none ${expandedSections.core ? 'max-h-96' : 'max-h-0 md:max-h-none'}`}>
                <li><Link to="/alpha-hub" className="hover:text-blue-400 transition-colors flex items-center gap-1.5"><Layers className="h-3 w-3" /> Alpha Hub</Link></li>
                <li><Link to="/screener" className="hover:text-blue-400 transition-colors flex items-center gap-1.5"><Zap className="h-3 w-3 text-amber-400" /> Screener Matrix</Link></li>
              </ul>
            </div>

            {/* Column 3: Portfolio Desk */}
            <div className="space-y-3">
              <button onClick={() => toggleSection('portfolio')} className="w-full flex items-center justify-between md:cursor-default">
                <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Portfolio Desk</h4>
                <span className="md:hidden text-[var(--text-muted)]">{expandedSections.portfolio ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
              </button>
              <ul className={`space-y-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider overflow-hidden transition-all duration-300 md:max-h-none ${expandedSections.portfolio ? 'max-h-96' : 'max-h-0 md:max-h-none'}`}>
                <li><Link to="/portfolio" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">Wealth Manager</Link></li>
                <li><Link to="/trades" className="hover:text-blue-400 transition-colors flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Verified ledger</Link></li>
                <li><Link to="/license-desk" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">License Desk</Link></li>
              </ul>
            </div>

            {/* Column 4: Links & Channels */}
            <div className="space-y-3">
              <button onClick={() => toggleSection('external')} className="w-full flex items-center justify-between md:cursor-default">
                <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">External Link</h4>
                <span className="md:hidden text-[var(--text-muted)]">{expandedSections.external ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
              </button>
              <ul className={`space-y-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider overflow-hidden transition-all duration-300 md:max-h-none ${expandedSections.external ? 'max-h-96' : 'max-h-0 md:max-h-none'}`}>
                <li><a href="https://t.me/asktoceo" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors inline-flex items-center gap-1">Telegram Alerts <ArrowUpRight className="h-3 w-3 text-[var(--text-muted)]" /></a></li>
                <li><a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1">WhatsApp <ArrowUpRight className="h-3 w-3 text-[var(--text-muted)]" /></a></li>
                <li><button onClick={() => setLegalModal({ open: true, type: 'policy' })} className="hover:text-blue-400 transition-colors text-left">Legal Protocol</button></li>
                <li><button onClick={() => setLegalModal({ open: true, type: 'risk' })} className="hover:text-blue-400 transition-colors text-left">Risk Disclaimers</button></li>
              </ul>
            </div>
          </div>

          {/* Collapsible Regulatory Disclaimer box */}
          <div className="card overflow-hidden transition-all duration-300">
            <button
              onClick={() => setIsDisclaimerExpanded(!isDisclaimerExpanded)}
              className="w-full flex items-center justify-between p-4 md:p-6 text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-[var(--bg-tertiary)] p-2 rounded-xl text-blue-400 border border-[var(--border-primary)] shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider italic text-left">Regulatory Matrix & SEBI Disclaimer</span>
              </div>
              {isDisclaimerExpanded ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)] shrink-0" />}
            </button>

            {isDisclaimerExpanded && (
              <div className="px-4 pb-6 md:px-6 md:pb-8 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-3 text-[10px] md:text-xs uppercase font-bold text-[var(--text-muted)] tracking-wide leading-relaxed border-t border-[var(--border-primary)]/50 pt-4">
                  <p>
                     Institutional protocol warning: MarketBeacon (Batch 9 Engine) is an institutional-grade research and asset discovery terminal. All technical signals, portfolio weights, and fundamental scores are provided for educational and research purposes only. MarketBeacon is not a SEBI registered investment advisor. Stock market trading involves significant financial risk. Historical results do not guarantee future performance. No Stop-Loss approach is considered a high-risk methodology.
                  </p>
                  <p className="text-[10px] md:text-[11px] text-[var(--text-muted)] leading-normal lowercase first-letter:uppercase">
                     Consult a certified financial professional before making any real money investments.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[var(--border-primary)] text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
             <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span>Distributed Ledger Verified © 2026</span>
             </div>
             <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Secure Terminal Environment Connected</span>
             </div>
          </div>

        </div>
      </footer>

      <LegalModal
        isOpen={legalModal.open}
        onClose={() => setLegalModal({ ...legalModal, open: false })}
        type={legalModal.type}
      />
    </>
  );
};

export default GlobalFooter;
export { GlobalFooter };