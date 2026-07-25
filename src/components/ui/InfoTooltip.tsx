import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import type { FundaInfoEntry } from '../../data/fundaInfo';

// ── New enhanced tooltip data with thresholds ──────────────────────────

interface EnhancedEntry {
  term: string;
  definition: string;
  whyItMatters: string;
  howCalculated?: string;
  threshold?: string;
}

// ── Enhanced icon style for maximum visibility ─────────────────────────
const INFO_ICON_BASE =
  'text-cyan-400 hover:text-cyan-300 hover:scale-125 active:scale-95 ' +
  'transition-all duration-150 cursor-pointer shrink-0 ' +
  'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] ' +
  'ring-1 ring-cyan-400/40 hover:ring-cyan-400/70';

export const FUNDA_TOOLTIPS: Record<string, EnhancedEntry> = {
  'D/E': {
    term: 'Debt-to-Equity (D/E)',
    definition: 'Total liabilities divided by shareholders\' equity. Measures how much debt a company uses to finance its operations relative to equity.',
    whyItMatters: 'High debt means higher fixed costs (interest payments). If business slows, debt can become unmanageable and lead to distress. Low debt = safer during downturns.',
    howCalculated: 'Net Debt / Shareholders Equity. Net Debt = Total Borrowings − Cash & Equivalents.',
    threshold: 'General: ≤ 0.5 (hard reject). Ideal: ≤ 0.2 (full score). Capital-Intensive: ≤ 1.5. Banking/NBFC: ≤ 7.0.'
  },
  'ROCE': {
    term: 'Return on Capital Employed (ROCE)',
    definition: 'Profit Before Interest & Tax (PBIT) divided by Capital Employed. Measures how efficiently a company generates profits from its total capital.',
    whyItMatters: 'Shows how well management uses capital. Higher ROCE = better capital allocation. Compare with cost of capital — ROCE should be significantly higher.',
    howCalculated: 'ROCE = PBIT / (Total Assets − Current Liabilities) × 100',
    threshold: 'General: ≥ 15%. Banking/NBFC/Capital-Intensive: ≥ 8%.'
  },
  'ROE': {
    term: 'Return on Equity (ROE)',
    definition: 'Net Profit divided by Shareholders\' Equity. Shows how much profit a company generates with money shareholders have invested.',
    whyItMatters: 'High ROE indicates efficient use of equity capital. Consistently high ROE (15%+ for 5+ years) is a hallmark of quality businesses with competitive advantages.',
    howCalculated: 'ROE = Net Profit / Shareholders\' Equity × 100',
    threshold: 'General: ≥ 15%. Banking/NBFC/Capital-Intensive: ≥ 10%.'
  },
  'Pledge': {
    term: 'Promoter Pledge',
    definition: 'Percentage of promoter holding that is pledged as collateral against loans. Promoters = founders/promoter group.',
    whyItMatters: 'High pledge means promoters have borrowed against their shares. If share price falls, lenders may sell pledged shares (margin call), crashing the price further. Low pledge = promoter confidence.',
    howCalculated: 'Promoter Pledge % = (Pledged Shares / Total Promoter Holding) × 100',
    threshold: 'Hard reject ≥ 5%. Ideal < 2% (full score).'
  },
  'Smart Money': {
    term: 'Smart Money % (FII + DII + Promoter)',
    definition: 'Combined holding of Foreign Institutional Investors (FII), Domestic Institutional Investors (DII), and Promoters as a percentage of total shares.',
    whyItMatters: 'High institutional + promoter holding = strong conviction. These are the most informed market participants. Low public float = less speculative selling pressure.',
    howCalculated: 'Smart Money % = (Promoter % + FII % + DII %) / Total Shares × 100',
    threshold: 'Target ≥ 70%. Hard reject < 30%.'
  },
  'PE vs Median': {
    term: 'PE vs Historical Median',
    definition: 'Current Price-to-Earnings (PE) ratio compared to the median PE over 3-year and 5-year periods. PE = Stock Price / Earnings Per Share.',
    whyItMatters: 'If current PE is higher than historical median, the stock is overvalued relative to its own history. We only enter when PE is at or below median (fair/undervalued).',
    howCalculated: 'Median of daily PE values calculated over trailing 3 years (~756 trading days) and 5 years (~1,260 trading days). Current PE must be ≤ BOTH medians — no tolerance.',
    threshold: 'Current PE ≤ 3Y Median PE AND Current PE ≤ 5Y Median PE. If higher than either → HARD REJECT.'
  },
  'Sales vs ATH': {
    term: 'Sales vs All-Time High',
    definition: 'Current TTM (Trailing Twelve Months) sales compared to the highest annual sales ever recorded by the company.',
    whyItMatters: 'Sales near ATH indicates the business is operating at peak revenue levels, even if the stock price has fallen. This is a key distress check — falling sales + falling price = value trap.',
    howCalculated: 'Current TTM Sales / Historical ATH Sales × 100. Must be ≥ 95% of ATH.',
    threshold: '≥ 95% of ATH (within ±5% of best-ever sales).'
  },
  'Profit vs ATH': {
    term: 'Net Profit vs All-Time High',
    definition: 'Current TTM net profit compared to the highest annual net profit ever recorded.',
    whyItMatters: 'Profit near ATH confirms earnings power is intact. Combined with sales near ATH, it validates the business model is working even during a stock price downturn.',
    howCalculated: 'Current TTM Net Profit / Historical ATH Net Profit × 100. Must be ≥ 95% of ATH.',
    threshold: '≥ 95% of ATH (within ±5% of best-ever profit).'
  },
  'FII Trend': {
    term: 'FII Holding Trend',
    definition: 'Direction of Foreign Institutional Investor holding over recent quarters — UP, DOWN, or FLAT.',
    whyItMatters: 'Rising FII = global smart money accumulating. Falling FII = institutions exiting. We prefer stocks where FII or DII is increasing.',
    howCalculated: 'Compares latest quarter FII % vs previous quarter. Increase > 0.1% = UP, decrease > 0.1% = DOWN, else FLAT.',
    threshold: 'FII Trend UP or DII Trend UP preferred.'
  },
  'Audit Score': {
    term: 'Institutional Audit Score (0–100)',
    definition: 'Composite score across 4 pillars: Profitability (25), Balance Sheet Safety (25), Growth Quality (25), Efficiency & Governance (25).',
    whyItMatters: 'A single number that tells you if a stock passes institutional quality standards. 60+ = Pass. Below 60 or hard reject = Do not invest.',
    howCalculated: 'Pillar 1: ROE (10) + ROCE (10) + TTM Profit (5). Pillar 2: D/E graduated (15) + Pledge (10). Pillar 3: Sales vs ATH (15) + EPS vs ATH (10). Pillar 4: Smart Money ≥ 70% (10) + Inst Trend (10) + PE vs Median (15). Hard rejects: D/E > sector limit, Pledge ≥ 5%, Smart Money < 30%, PE > Median.',
    threshold: 'Pass ≥ 60/100. Hard reject if any hard reject condition triggered.'
  },
  'ABCD': {
    term: 'ABCD Averaging Framework',
    definition: 'Tranche-based position building system. A = first technical trigger. B/C/D = averaging points at ~10% drops.',
    whyItMatters: 'No one catches the exact bottom. ABCD lets you build a position across price levels, achieving a blended average. It is risk management, not a pattern.',
    howCalculated: 'A = strategy trigger price. B = A × 0.90. C = B × 0.90. D = C × 0.90. Each tranche = ~10% allocation. Targets are reverse-laddered.',
    threshold: 'One exception: SMA-BCD starts buying at B (not A). A is signal-only.'
  },
  'Market Cap': {
    term: 'Market Capitalisation',
    definition: 'Total market value of a company\'s outstanding shares. Stock Price × Total Shares.',
    whyItMatters: 'Determines cap classification (Large/Mid/Small), which affects portfolio allocation limits (50:30:20 rule) and single-stock max exposure (5%/3%/2%).',
    howCalculated: 'Market Cap = Current Price × Total Outstanding Shares. Large Cap ≥ ₹20,000 Cr (roughly top 100). Mid Cap ≥ ₹5,000 Cr (roughly 101-250). Small Cap < ₹5,000 Cr (251+).',
    threshold: 'Growth basket minimum: ₹500 Cr. 67% strategy minimum: none.'
  },
  'PE Ratio': {
    term: 'Price-to-Earnings (PE) Ratio',
    definition: 'Stock price divided by Earnings Per Share (EPS). Shows how many years of earnings you are paying for.',
    whyItMatters: 'Lower PE = cheaper relative to earnings. But context matters — a low PE could mean the company is in trouble. We compare against historical median, not just absolute value.',
    howCalculated: 'PE = Current Market Price / TTM EPS (Earnings Per Share).',
    threshold: 'Must be ≤ 3Y and 5Y median PE.'
  }
};

// ── InfoTooltip Component ──────────────────────────────────────────────
// Renders tooltip via React portal to document.body to avoid parent
// overflow clipping. Positions using fixed coordinates from the icon's
// bounding rect. Smart positioning: shows above by default; if not enough
// room above, shows below.

interface InfoTooltipProps {
  entry?: FundaInfoEntry;
  term?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ entry, term, size = 'sm', className = '' }) => {
  const [show, setShow] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const enhancedInfo = term ? FUNDA_TOOLTIPS[term] : null;
  const iconSize = size === 'md' ? 'h-5 w-5' : 'h-[18px] w-[18px]';

  const updatePosition = () => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const tooltipEstimateH = 300; // approximate max tooltip height in px

    const above = rect.top >= tooltipEstimateH;

    if (above) {
      // Show above the icon
      setTooltipStyle({
        position: 'fixed',
        top: `${rect.top - 8}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
      });
    } else {
      // Show below the icon
      setTooltipStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
        zIndex: 9999,
      });
    }
  };

  const handleShow = () => {
    setShow(true);
    // Position after render (use RAF to let the DOM settle)
    requestAnimationFrame(() => updatePosition());
  };

  const handleHide = () => {
    setShow(false);
  };

  // Re-position on scroll/resize while visible
  useEffect(() => {
    if (!show) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [show]);

  let content: React.ReactNode;

  if (enhancedInfo) {
    content = (
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider leading-tight">{enhancedInfo.term}</h4>
          <button onClick={handleHide} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"><span className="text-xs font-bold">✕</span></button>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{enhancedInfo.definition}</p>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Why it matters</p>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{enhancedInfo.whyItMatters}</p>
        </div>
        {enhancedInfo.howCalculated && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">How it's calculated</p>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-mono">{enhancedInfo.howCalculated}</p>
          </div>
        )}
        {enhancedInfo.threshold && (
          <div className="bg-[var(--bg-tertiary)]/50 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Threshold</p>
            <p className="text-[11px] text-blue-400 font-semibold">{enhancedInfo.threshold}</p>
          </div>
        )}
      </div>
    );
  } else if (entry) {
    content = (
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider leading-tight">{entry.label}</h4>
          <button onClick={handleHide} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"><span className="text-xs font-bold">✕</span></button>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{entry.what}</p>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Why it matters</p>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{entry.why}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">How it's calculated</p>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-mono">{entry.how}</p>
        </div>
      </div>
    );
  } else {
    return null;
  }

  return (
    <span ref={iconRef} className={`relative inline-flex items-center overflow-visible z-10 ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (show) handleHide(); else handleShow(); }}
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        className={`${iconSize} ${INFO_ICON_BASE} ml-1 flex items-center justify-center rounded-full bg-cyan-600/20 hover:bg-cyan-500/30 active:bg-cyan-400/40`}
        aria-label="Learn more"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {show && createPortal(
        <div
          style={tooltipStyle}
          className="w-72 md:w-80 bg-[var(--bg-primary)]/95 backdrop-blur-md border border-[var(--border-primary)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-4 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handleShow}
          onMouseLeave={handleHide}
        >
          {content}
        </div>,
        document.body
      )}
    </span>
  );
};

export { InfoTooltip };
export default InfoTooltip;
