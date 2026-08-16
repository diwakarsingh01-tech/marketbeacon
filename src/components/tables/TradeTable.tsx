import { 
  ChevronUp as ChevronUpIcon, 
  ChevronDown as ChevronDownIcon,
  Search as SearchIcon, 
  Filter as FilterIcon, 
  Zap as ZapIcon, 
  Settings2 as SettingsIcon, 
  Star as StarIcon,
  Download as DownloadIcon,
  ShieldCheck,
  Info as InfoIcon,
  Share2,
  ExternalLink,
  ChevronRight,
  Trash2,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useState, useMemo, useEffect } from 'react';
// import type { TradeRecord } from '../../types';
import { Card, TableHeader } from '../ui/UnifiedComponents';

const WHATSAPP_BASE = 'https://wa.me/918888888888';

interface EnrichedTrade {
  symbol: string;
  livePrice?: number;
  currentPrice?: number;
  marketCap?: number;
  sector?: string;
  ath?: number;
  entryTime?: string;
  target?: number;
  entryPrice?: number;
  isPass?: boolean;
  score?: number;
  smartMoney?: number;
  tranche?: string;
  roi?: number;
  reason?: string;
  abcd?: Record<string, { price: number; label?: string; date?: string } | number>;
  peRatio?: number;
  peMedians?: { pe3Y?: number; pe5Y?: number; pe10Y?: number };
  buy_price?: number;
  change?: number;
  isBuyZone?: boolean;
  actualEntryPrice?: number;
  targetPrice?: number;
  targetGap?: number;
  dfh?: number;
  calculatedRoi?: number;
  id?: number;
  entry_price?: number;
  exit_price?: number;
  quantity?: number;
  entry_date?: string;
  exit_date?: string;
  target_price?: number;
  stop_loss?: number;
  level?: string;
  strategy?: string;
  status?: string;
  notes?: string;
}

interface TradeTableProps {
  trades: EnrichedTrade[];
  livePrices?: Record<string, number>;
  athData?: Record<string, number>;
  capData?: Record<string, number>;
  sectorData?: Record<string, string>;
  isWatchlist?: boolean;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  userWatchlist?: string[];
  strategyId?: string;
  onToggleWatchlist?: (symbol: string) => void;
  onUpdateHolding?: (symbol: string, quantity: number, buyPrice: number) => void;
  onUpdateReview?: () => void;
  portfolioCount?: number;
  openCount?: number;
  neutralCount?: number;
  rejectedCount?: number;
  watchlistCount?: number;
  onAddPositionClick?: () => void;
  onConnectNodeClick?: () => void;
}

const EmptyState = ({ activeTab, searchTerm, onClearSearch, onAddPosition, onConnectNode, onGoToScreener }: {
  activeTab?: string;
  searchTerm?: string;
  onClearSearch?: () => void;
  onAddPosition?: () => void;
  onConnectNode?: () => void;
  onGoToScreener?: () => void;
}) => {
  return (
    <Card variant="elevated" padding="lg" className="flex flex-col items-center justify-center text-center py-16 px-6 max-w-md mx-auto animate-in fade-in duration-500">
      <div className="w-12 h-12 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl flex items-center justify-center mb-5 shadow-sm">
        <ZapIcon className="h-5 w-5 text-[var(--text-tertiary)]" />
      </div>
      
      {searchTerm ? (
        <>
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">No Matching Nodes</h3>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide leading-relaxed mb-5">
            We couldn't find any assets matching "{searchTerm}". Try refining your search query.
          </p>
          <button 
            onClick={onClearSearch}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-caption hover:bg-black transition-all shadow-md active:scale-95 border border-white/5"
          >
            Clear Search Filter
          </button>
        </>
      ) : activeTab === 'portfolio' ? (
        <>
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Wealth Desk is Empty</h3>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide leading-relaxed mb-5">
            No institutional assets are currently active in your portfolio ledger. Upload new details or enter assets manually to begin monitoring.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={onAddPosition}
              className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--text-secondary)] rounded-xl text-caption hover:bg-[var(--bg-secondary)] transition-all shadow-sm active:scale-95"
            >
              + Add Position
            </button>
            <button 
              onClick={onConnectNode}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-caption hover:bg-black transition-all shadow-md active:scale-95 border border-white/5"
            >
              Upload New Details
            </button>
            <a 
              href={WHATSAPP_BASE} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-caption hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-500/20 flex items-center space-x-1.5 group"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 group-hover:scale-110 transition-transform">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Chat Now</span>
            </a>
            <a 
              href="https://t.me/+bANpkxNzTvdmYmI9" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-caption hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-500/20 flex items-center space-x-1.5 group"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 group-hover:scale-110 transition-transform">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span>Get Symbols</span>
            </a>
          </div>
        </>
      ) : activeTab === 'hold' ? (
        <>
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Watchlist is Empty</h3>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide leading-relaxed mb-5">
            Your real-time watch matrix contains zero tracked nodes. Add symbols from the screener to start tracking.
          </p>
          {onGoToScreener && (
            <button 
              onClick={onGoToScreener}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-caption hover:bg-black transition-all shadow-md active:scale-95 border border-white/5"
            >
              Go to Screener
            </button>
          )}
        </>
      ) : (
        <>
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">No Screener Matches Detected</h3>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide leading-relaxed mb-2">
            No institutional assets in the current basket match the selected criteria.
          </p>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider italic">
            Strict strategy filters — 0 open signals today is normal. Check Neutral tab or switch Universe/Strategy for live setups.
          </p>
        </>
      )}
    </Card>
  );
};

/*
const CircularGauge = ({ value, size = 32, strokeWidth = 3 }: { value: number, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#3b82f6' : '#f59e0b';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-[var(--border-primary)]" />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} fill="transparent" strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-bold text-[var(--text-primary)]">{value}</span>
    </div>
  );
};
*/

const getMarketCapTag = (cap: number, symbol: string) => {
  if (['NIFTYBEES', 'BANKBEES'].includes(symbol)) {
    return { label: 'ETF', class: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
  }
  const capInCr = cap / 10000000;
  if (capInCr >= 20000) return { label: 'LARGE CAP', class: 'text-[var(--text-primary)] bg-[var(--bg-tertiary)] border-[var(--border-secondary)]' };
  if (capInCr >= 5000) return { label: 'MID CAP', class: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  return { label: 'SMALL CAP', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
};

const TradeTable: React.FC<TradeTableProps> = ({ 
  trades, 
  livePrices, 
  athData, 
  capData, 
  sectorData, 
  activeTab, 
  setActiveTab,
  userWatchlist, 
  strategyId, 
  onToggleWatchlist, 
  onUpdateHolding,
  portfolioCount: _portfolioCount,
  openCount,
  neutralCount,
  rejectedCount,
  watchlistCount: _watchlistCount,
  onAddPositionClick,
  onConnectNodeClick
}) => {
  const [searchTerm, setSearchTerm] = useState(() => {
    return new URLSearchParams(window.location.search).get('search') || '';
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const visibleTabs = useMemo(() => {
    if (activeTab === 'portfolio' || activeTab === 'hold') {
      return [];
    }
    return [
      { id: 'open', label: 'Active Setups', count: openCount || 0 },
      { id: 'neutral', label: 'On Radar', count: neutralCount || 0 },
      { id: 'rejected', label: 'Under Review', count: rejectedCount || 0 },
    ];
  }, [activeTab, openCount, neutralCount, rejectedCount]);
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    observation: true,
    symbol: true,
    marketCap: true,
    abcd: true,
    basePrice: true,
    cmp: true,
    dfh: true,
    objective: true,
    roi: true,
    pending: true,
    fundamentals: true
  });

  useEffect(() => {
    const isWatchlistTab = activeTab === 'hold';
    const isPortfolioTab = activeTab === 'portfolio';
    const isSpecialStrat = strategyId === 'SIXTY_SEVEN_FUNDA';
    
    setVisibleColumns({
      observation: !isWatchlistTab && !isPortfolioTab,
      symbol: true,
      marketCap: true,
      abcd: !isWatchlistTab && !isPortfolioTab && !isSpecialStrat,
      basePrice: !isWatchlistTab && !isPortfolioTab,
      cmp: true,
      dfh: true,
      objective: !isWatchlistTab && !isPortfolioTab,
      roi: !isWatchlistTab && !isPortfolioTab,
      pending: !isWatchlistTab && !isPortfolioTab,
      fundamentals: true
    });
  }, [activeTab, strategyId]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'entryTime', 
    direction: 'desc' 
  });

  useEffect(() => {
    if (activeTab === 'hold') setSortConfig({ key: 'dfh', direction: 'asc' });
    else setSortConfig({ key: 'entryTime', direction: 'desc' });
  }, [activeTab]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExportCSV = () => {
    if (!filteredAndSortedTrades.length) return;
    const headers = [
      'Symbol',
      'Observation Date',
      'Strategy',
      'Sector',
      'Market Cap (Cr)',
      'Level A Base Entry Price (INR)',
      'Current Price CMP (INR)',
      'All Time High ATH (INR)',
      'Model Target Objective (INR)',
      'Target ROI (%)',
      'Current Move (%)',
      'Audit Score',
      'Smart Money %',
      'Grade Tranche',
      'Audit Pass Status',
      'Audit Remark'
    ];
    const rows = filteredAndSortedTrades.map(t => {
      const cmp = t.livePrice || t.currentPrice || 0;
      const entry = t.entryPrice || 0;
      const currentReturnPct = entry > 0 ? (((cmp - entry) / entry) * 100).toFixed(2) : '0.00';
      const targetRoiPct = entry > 0 && t.target ? (((t.target - entry) / entry) * 100).toFixed(2) : (t.roi ? Number(t.roi).toFixed(2) : '0.00');

      return [
        `"${t.symbol}"`,
        `"${t.entryTime || '-'}"`,
        `"${t.strategy || 'Institutional Strategy'}"`,
        `"${t.sector || 'General'}"`,
        `"${t.marketCap || '—'}"`,
        entry ? entry.toFixed(2) : '0.00',
        cmp ? cmp.toFixed(2) : '0.00',
        (athData?.[t.symbol] || t.ath || 0).toFixed(2),
        t.target ? t.target.toFixed(2) : '0.00',
        `"${targetRoiPct}%"`,
        `"${currentReturnPct}%"`,
        t.score || 0,
        `"${t.smartMoney || 0}%"`,
        `"${t.tranche || 'A'}"`,
        `"${t.isPass ? 'QUALIFIED' : 'REJECTED'}"`,
        `"${t.reason || 'Institutional Audit Active'}"`
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `MarketBeacon_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareSignal = (trade: EnrichedTrade, method: 'copy' | 'telegram' = 'copy') => {
    const livePrice = livePrices?.[trade.symbol] || trade.livePrice || trade.currentPrice || 0;
    const text = `🚨 *MarketBeacon Research: ${trade.symbol}*

⚡️ *Strategy:* ${trade.strategy || 'Institutional Matrix'}
💰 *Price:* ₹${livePrice.toLocaleString()}
🎯 *Objective:* ₹${(trade.target || trade.targetPrice || 0).toLocaleString()}
📊 *Audit Status:* ${trade.isPass !== false ? '✅ Passed Audit' : '🔍 Observation'}

⚠️ Disclaimer: Educational research model. We are NOT SEBI registered. No advisory calls.
🔗 *Full Terminal:* https://marketbeacon.pro/stock/${trade.symbol}

#MarketBeacon #InstitutionalResearch #Batch9`;
    
    if (method === 'copy') {
      navigator.clipboard.writeText(text);
      toast(`Research for ${trade.symbol} copied to clipboard! Ready to paste.`);
    } else {
      const url = `https://t.me/share/url?url=https://marketbeacon.pro&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  const handleToggleWatchlist = (e: React.MouseEvent, symbol: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWatchlist) onToggleWatchlist(symbol);
  };

  const filteredAndSortedTrades = useMemo(() => {
    let result = (trades || []).map(t => {
      const livePrice = livePrices?.[t.symbol] || t.livePrice || t.currentPrice;
      const basePrice = t.entryPrice || t.actualEntryPrice;
      const marketCap = capData?.[t.symbol] || t.marketCap || 0;
      const sector = sectorData?.[t.symbol] || t.sector || 'General';
      const ath = athData?.[t.symbol] || t.ath || 0;
      
      let calculatedRoi = 0;
      if (livePrice && basePrice && basePrice > 0) {
        calculatedRoi = ((livePrice - basePrice) / basePrice) * 100;
      }

      const targetGap = (livePrice && t.target) ? ((t.target - livePrice) / livePrice) * 100 : 0;
      const dfh = (livePrice && ath && ath > 0) ? ((livePrice / ath) - 1) * 100 : 0;

      return {
        ...t,
        livePrice,
        calculatedRoi,
        targetGap,
        dfh,
        marketCap,
        sector,
        entryTime: t.entryTime || t.entry_date || '-'
      };
    });

    if (searchTerm) {
      result = result.filter(t => t.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let valA: number | string, valB: number | string;
        if (sortConfig.key === 'roi') { valA = a.calculatedRoi; valB = b.calculatedRoi; }
        else if (sortConfig.key === 'pending') { valA = a.targetGap; valB = b.targetGap; }
        else if (sortConfig.key === 'symbol') { valA = a.symbol; valB = b.symbol; }
        else if (sortConfig.key === 'price') { valA = a.livePrice || 0; valB = b.livePrice || 0; }
        else if (sortConfig.key === 'entryTime') {
          valA = a.entryTime && a.entryTime !== '-' ? new Date(a.entryTime).getTime() : 0;
          valB = b.entryTime && b.entryTime !== '-' ? new Date(b.entryTime).getTime() : 0;
        } else {
          valA = a[sortConfig.key as keyof typeof a] as string | number;
          valB = b[sortConfig.key as keyof typeof b] as string | number;
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [trades, searchTerm, sortConfig, livePrices, athData, capData, sectorData]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, activeTab, strategyId]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTrades.length / rowsPerPage));
  const paginatedTrades = filteredAndSortedTrades.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const goToPage = (p: number) => setPage(Math.max(0, Math.min(totalPages - 1, p)));

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <FilterIcon className="h-2.5 w-2.5 ml-1 opacity-20" />;
    return sortConfig.direction === 'asc' ? <ChevronUpIcon className="h-2.5 w-2.5 ml-1 text-blue-400" /> : <ChevronDownIcon className="h-2.5 w-2.5 ml-1 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Search and Settings Bar */}
      <div className="sticky top-0 z-20 flex flex-col lg:flex-row lg:items-center justify-between bg-[var(--bg-secondary)]/95 backdrop-blur-md px-6 py-4 rounded-[2rem] border border-[var(--border-primary)] gap-4 shadow-sm -mx-0.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3.5 flex-1 w-full">
          {/* Search Input */}
          <div className="relative w-full md:max-w-xs">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search Symbols..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-2xl pl-11 pr-4 py-2.5 text-caption focus:bg-[var(--bg-secondary)] focus:border-blue-500/20 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Compact Pill Tabs with brand green */}
          {setActiveTab && visibleTabs.length > 0 && (
            <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-primary)] w-full overflow-x-auto no-scrollbar">
               {visibleTabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as string)}
                   className={`px-2.5 py-1.5 rounded-lg text-[9px] md:text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap flex items-center leading-tight shrink-0 ${
                     activeTab === tab.id 
                        ? 'bg-white text-[#00d09c] shadow-md border border-[#00d09c]/30 font-black' 
                       : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/50'
                   }`}
                 >
                   <span>{tab.label}</span>
                   <span className={`ml-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold hidden sm:inline-flex ${
                     activeTab === tab.id 
                       ? 'bg-[#00d09c]/10 text-[#00d09c]' 
                       : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                   }`}>
                     {tab.count}
                   </span>
                 </button>
               ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end w-full lg:w-auto">
          <button 
            onClick={handleExportCSV} 
            className="flex-1 md:flex-initial flex items-center justify-center gap-3 px-5 py-2.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-2xl text-caption hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)] transition-all shadow-md group"
          >
            <DownloadIcon className="h-3.5 w-3.5 text-[#00d09c] group-hover:scale-110 transition-transform" />
            <span>
              <span className="hidden sm:inline">Export Matrix</span>
              <span className="sm:hidden">Export</span>
            </span>
          </button>
          <button 
            onClick={() => setShowColumnSettings(!showColumnSettings)} 
            className={`p-2.5 rounded-2xl border transition-all ${showColumnSettings ? 'bg-[var(--border-accent)] text-white border-transparent shadow-lg shadow-[var(--border-accent)]/20' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]'}`}
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)] px-4 py-2.5 rounded-2xl border border-[var(--border-primary)] shadow-sm italic whitespace-nowrap">
            {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredAndSortedTrades.length)} of {filteredAndSortedTrades.length} Nodes
          </div>
        </div>
      </div>

      {/* Column Settings Dropdown */}
      {showColumnSettings && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-primary)] shadow-xl"
        >
           {Object.entries(visibleColumns).map(([key, isVisible]) => (
             <button 
                key={key} 
                onClick={() => setVisibleColumns(p => ({...p, [key]: !isVisible}))} 
                className={`px-5 py-2.5 rounded-xl text-caption transition-all ${isVisible ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)]'}`}
             >
                {key}
             </button>
           ))}
        </motion.div>
      )}

      <div className="hidden md:block border border-[var(--border-primary)] rounded-[1.5rem] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10">
              {activeTab === 'portfolio' ? (
                <tr className="bg-[var(--bg-secondary)] text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-primary)] italic">
                  <TableHeader>Asset Node</TableHeader>
                  <TableHeader align="center">Qty</TableHeader>
                  <TableHeader align="right">Level Base</TableHeader>
                  <TableHeader align="right">CMP</TableHeader>
                  <TableHeader align="right">Invested Value</TableHeader>
                  <TableHeader align="right">Current Node</TableHeader>
                  <TableHeader align="right">Yield %</TableHeader>
                  <TableHeader align="right">Audit</TableHeader>
                </tr>
              ) : (
                <tr className="bg-[var(--bg-secondary)] text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-primary)] italic">
                  {visibleColumns.observation && (
                    <TableHeader 
                      sortable 
                      sortKey="entryTime" 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                    >
                      <div className="flex items-center gap-1">Obs <SortIcon column="entryTime" /></div>
                    </TableHeader>
                  )}
                  {visibleColumns.symbol && (
                    <TableHeader 
                      sortable 
                      sortKey="symbol" 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                    >
                      <div className="flex items-center gap-1">Asset Node <SortIcon column="symbol" /></div>
                    </TableHeader>
                  )}
                  {visibleColumns.marketCap && (
                    <TableHeader 
                      sortable 
                      sortKey="marketCap" 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                      align="center"
                    >
                      <div className="flex items-center justify-center gap-1">Tier <SortIcon column="marketCap" /></div>
                    </TableHeader>
                  )}
                  {visibleColumns.abcd && <TableHeader align="center">ABCD Ladder</TableHeader>}
                  {visibleColumns.basePrice && <TableHeader align="right">Base</TableHeader>}
                  {visibleColumns.cmp && (
                    <TableHeader 
                      sortable 
                      sortKey="price" 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                      align="right"
                    >
                      <div className="flex items-center justify-end text-blue-400 gap-1">CMP <SortIcon column="price" /></div>
                    </TableHeader>
                  )}
                  {visibleColumns.dfh && (
                    <TableHeader 
                      sortable 
                      sortKey="dfh" 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                      align="right"
                    >
                      <div className="flex items-center justify-end gap-1">DFH% <SortIcon column="dfh" /></div>
                    </TableHeader>
                  )}
                  {visibleColumns.objective && (
                    <TableHeader 
                      sortable 
                      sortKey="target" 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                      align="right"
                    >
                      <div className="flex items-center justify-end gap-1">Objective <SortIcon column="target" /></div>
                    </TableHeader>
                  )}
                  {visibleColumns.roi && (
                    <TableHeader 
                      sortable 
                      sortKey="roi" 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                      align="right"
                    >
                      <div className="flex items-center justify-end gap-1 text-emerald-400">ROI% (Alpha) <SortIcon column="roi" /></div>
                    </TableHeader>
                  )}
                  {visibleColumns.pending && (
                    <TableHeader 
                      sortable 
                      sortKey="pending" 
                      currentSort={sortConfig} 
                      onSort={handleSort}
                      align="right"
                    >
                      <div className="flex items-center justify-end gap-1">Gap% (Window) <SortIcon column="pending" /></div>
                    </TableHeader>
                  )}
                  {visibleColumns.fundamentals && <TableHeader align="right">Audit</TableHeader>}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)] font-mono">
              {filteredAndSortedTrades.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-6 py-12">
                    <EmptyState 
                      activeTab={activeTab} 
                      searchTerm={searchTerm} 
                      onClearSearch={() => setSearchTerm('')} 
                      onAddPosition={onAddPositionClick}
                      onConnectNode={onConnectNodeClick}
                      onGoToScreener={() => setActiveTab?.('open')}
                    />
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {paginatedTrades.map((trade, idx) => {
                    const capTag = getMarketCapTag(trade.marketCap, trade.symbol);
                    const isStarred = userWatchlist?.includes(trade.symbol);

                    if (activeTab === 'portfolio') {
                      const invested = (trade.quantity || 0) * (trade.buy_price || 0);
                      const currentVal = (trade.quantity || 0) * (trade.livePrice || 0);
                      const pnl = currentVal - invested;
                      return (
                        <motion.tr 
                           key={trade.symbol} 
                           initial={{ opacity: 0, y: 5 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: idx * 0.02 }}
                           className="hover:bg-[var(--bg-secondary)]/50 transition-all font-bold text-xs group divide-x divide-[var(--border-primary)]"
                        >
                          <td className="px-6 py-2.5 text-left">
                            <div className="flex items-center space-x-3">
                              <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-[var(--text-tertiary)] transition-all active:scale-90 shrink-0">
                                 <StarIcon className={`h-4 w-4 ${isStarred ? 'fill-current text-amber-400' : ''}`} />
                              </button>
                              <div className="flex flex-col font-sans">
                                 <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors tracking-tighter leading-none">{trade.symbol}</span>
                                 <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{trade.sector}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <input 
                              type="number" 
                              defaultValue={trade.quantity || 0} 
                              onBlur={(e) => onUpdateHolding?.(trade.symbol, parseInt(e.target.value) || 0, trade.buy_price || 0)} 
                              className="w-16 bg-[var(--bg-secondary)]/50 border border-[var(--border-secondary)] rounded-lg text-center font-mono font-bold py-1 px-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus:bg-[var(--bg-secondary)] focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 hover:border-[var(--border-primary)] transition-all shadow-sm" 
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <input 
                              type="number" 
                              defaultValue={trade.buy_price || 0} 
                              onBlur={(e) => onUpdateHolding?.(trade.symbol, trade.quantity || 0, parseFloat(e.target.value) || 0)} 
                              className="w-24 bg-[var(--bg-secondary)]/50 border border-[var(--border-secondary)] rounded-lg text-right font-mono font-bold py-1 px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus:bg-[var(--bg-secondary)] focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 hover:border-[var(--border-primary)] transition-all shadow-sm" 
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right text-blue-400 font-bold italic">₹{trade.livePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-right text-[var(--text-muted)] font-medium opacity-80">₹{invested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-right text-[var(--text-primary)] font-bold">₹{currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`px-2.5 py-1 rounded-lg font-bold text-xs italic tracking-tighter ${pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'}`}>
                                {pnl >= 0 ? '+' : ''}{invested > 0 ? ((pnl/invested)*100).toFixed(1) : '0.0'}% Yield
                            </span>
                          </td>
                          <td className="px-6 py-2.5 text-right">
                            <div className="flex items-center justify-end space-x-3">
                               <div className="flex items-center justify-end gap-2 font-sans">
                                 {trade.isPass !== false ? (
                                   <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold tracking-wide shrink-0">
                                     <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                     PASS
                                   </div>
                                  ) : (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-bold tracking-wide shrink-0">
                                      <span className="w-1 h-1 rounded-full bg-rose-500/100" />
                                      REJECT
                                    </div>
                                  )}
                                  <div className="flex flex-col items-end min-w-[32px]">
                                    <span className="text-xs font-bold text-[var(--text-primary)] leading-none">{trade.score || 0}</span>
                                    <span className="text-xs text-[var(--text-tertiary)] font-extrabold uppercase tracking-wider mt-0.5">Audit</span>
                                 </div>
                               </div>
                               <div className="flex items-center gap-1 shrink-0">
                                   <Link to={`/stock/${trade.symbol}`} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all shrink-0">
                                      <ExternalLink className="h-4 w-4" />
                                   </Link>
                                   <Link to={`/charts?symbol=${trade.symbol}&return=/dashboard`} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all shrink-0" title="Open in Charts Terminal">
                                      <BarChart3 className="h-3.5 w-3.5" />
                                   </Link>
                                   <button onClick={(e) => { e.preventDefault(); if (window.confirm(`Remove ${trade.symbol} from portfolio?`)) onToggleWatchlist?.(trade.symbol); }} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-rose-600 hover:text-white transition-all">
                                    <Trash2 className="h-3.5 w-3.5" />
                                 </button>
                               </div>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    }

                    return (
                      <motion.tr 
                        key={trade.symbol} 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-[var(--bg-secondary)] group transition-all font-bold text-xs divide-x divide-[var(--border-primary)]"
                      >
                        {visibleColumns.observation && (
                          <td className="px-6 py-2.5 text-xs text-[var(--text-muted)] font-bold uppercase whitespace-nowrap italic">
                            {(() => {
                              if (!trade.entryTime || trade.entryTime === '-') return '-';
                              const d = new Date(trade.entryTime);
                              if (isNaN(d.getTime())) return '-';
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[var(--text-secondary)]">{d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                  <span className="opacity-40 text-xs">{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })} NODE</span>
                                </div>
                              );
                            })()}
                          </td>
                        )}
                        {visibleColumns.symbol && (
                          <td className="px-4 py-2.5">
                            <div className="flex items-center space-x-3">
                               <button onClick={(e) => handleToggleWatchlist(e, trade.symbol)} className="text-[var(--text-tertiary)] transition-all active:scale-90 shrink-0">
                                  <StarIcon className={`h-4 w-4 ${isStarred ? 'fill-current text-amber-400' : ''}`} />
                               </button>
                                <div className="flex flex-col font-sans">
                                   <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors tracking-tighter leading-none">{trade.symbol}</span>
                                   <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{trade.sector}</span>
                                 </div>
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-auto pr-2 shrink-0">
                                   <button onClick={() => handleShareSignal(trade, 'telegram')} className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Share2 className="h-3 w-3" /></button>
                                    <Link to={`/charts?symbol=${trade.symbol}&return=/dashboard`} className="p-2.5 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all" title="Open in Charts Terminal"><BarChart3 className="h-3 w-3" /></Link>
                                    <Link to={`/stock/${trade.symbol}`} className="p-2.5 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all"><ExternalLink className="h-3 w-3" /></Link>
                               </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.marketCap && (
                          <td className="px-4 py-2.5 text-center">
                            {capTag && <span className={`px-2 py-0.5 rounded text-xs font-bold border tracking-wider ${capTag.class}`}>{capTag.label}</span>}
                          </td>
                        )}
                        {visibleColumns.abcd && (
                          <td className="px-4 py-2.5 text-center group/ladder relative">
                            <div className="flex items-center justify-center space-x-1.5 cursor-help">
                              {['a', 'b', 'c', 'd'].map((l) => {
                                const levelObj = trade.abcd?.[l];
                                const levelVal = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                                const isActive = (trade.livePrice || 0) <= levelVal && levelVal > 0;
                                const levelColor = l === 'a' ? (isActive ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/40' : 'bg-blue-500/10 text-blue-400 border-blue-500/20') :
                                                 (l === 'b' || l === 'c') ? (isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/40' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20') :
                                                 (isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20');

                                return (
                                  <div key={l} className={`w-5.5 h-5.5 rounded flex items-center justify-center text-xs font-bold border-2 transition-all ${levelColor} ${isActive ? 'shadow-md scale-110 z-10' : 'opacity-30'}`}>
                                    {l.toUpperCase()}
                                  </div>
                                );
                              })}
                            </div>
                            <div className={`absolute left-1/2 -translate-x-1/2 z-[200] hidden group-hover/ladder:block bg-slate-900 text-white shadow-2xl rounded-xl p-4 animate-in fade-in duration-300 min-w-[200px] ${
                              idx < 2 
                                ? 'top-full mt-3 slide-in-from-top-2' 
                                : 'bottom-full mb-3 slide-in-from-bottom-2'
                            }`}>
                               <div className="space-y-2">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider italic">Institutional Ladder</span>
                                     <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                  </div>
                                  {['a', 'b', 'c', 'd'].map((l) => {
                                    const levelObj = trade.abcd?.[l];
                                    const price = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                                    const date = typeof levelObj === 'object' ? levelObj.date : null;
                                    
                                    return (
                                      <div key={l} className="flex justify-between items-center text-xs">
                                        <div className="flex flex-col text-left">
                                          <span className={`font-bold ${l === 'a' ? 'text-blue-400' : l === 'd' ? 'text-emerald-400' : 'text-slate-300'}`}>Level {l.toUpperCase()}</span>
                                          {date && <span className="text-xs text-slate-400 font-bold uppercase">{date}</span>}
                                        </div>
                                        <span className="font-bold text-white italic">₹{price?.toLocaleString()}</span>
                                      </div>
                                    );
                                  })}
                               </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.basePrice && <td className="px-4 py-2.5 text-right text-[var(--text-muted)] font-semibold italic">₹{trade.entryPrice?.toLocaleString()}</td>}
                        {visibleColumns.cmp && <td className="px-4 py-2.5 text-right text-blue-400 font-bold italic bg-[var(--bg-secondary)]/50 shadow-inner">₹{trade.livePrice?.toLocaleString()}</td>}
                        {visibleColumns.dfh && <td className="px-4 py-2.5 text-right text-[var(--text-muted)] font-medium opacity-80 italic">{trade.dfh?.toFixed(1)}%</td>}
                        {visibleColumns.objective && <td className="px-4 py-2.5 text-right text-fuchsia-400 font-bold font-mono">₹{trade.target?.toLocaleString()}</td>}
                        {visibleColumns.roi && (
                          <td className="px-4 py-2.5 text-right">
                             <div className="flex flex-col items-end">
                                <span className={`text-sm font-bold tracking-tighter italic ${trade.targetGap >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                   {trade.targetGap >= 0 ? '+' : ''}{trade.targetGap?.toFixed(1)}%
                                </span>
                                <span className="text-xs text-[var(--text-tertiary)] uppercase font-bold tracking-wider mt-0.5">Objective Alpha</span>
                             </div>
                          </td>
                        )}
                        {visibleColumns.pending && (
                          <td className="px-4 py-2.5 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-orange-400 italic">
                                   {((trade.entryPrice || 0) > 0 ? ((((trade.livePrice || trade.currentPrice || 0) - (trade.entryPrice || 0)) / (trade.entryPrice || 1)) * 100).toFixed(1) : '0.0')}%
                                </span>
                                <span className="text-xs text-[var(--text-tertiary)] uppercase font-bold tracking-wider mt-0.5">Level Window</span>
                             </div>
                          </td>
                        )}
                        {visibleColumns.fundamentals && (
                          <td className="px-6 py-2.5 text-right">
                            <div className="flex items-center justify-end space-x-3">
                               {(trade.peRatio || 0) > 0 && (
                                 <div className="flex flex-col items-end mr-2">
                                    {(() => {
                                      const pe3y = Number(trade.peMedians?.pe3Y || 0);
                                      const pe5y = Number(trade.peMedians?.pe5Y || 0);
                                      const pe10y = Number(trade.peMedians?.pe10Y || 0);
                                      const medianCount = [pe3y, pe5y, pe10y].filter(v => v > 0).length || 1;
                                      const avgMedian = (pe3y + pe5y + pe10y) / medianCount;
                                      const isHigh = avgMedian > 0 && (trade.peRatio || 0) > avgMedian;
                                      return (
                                        <>
                                          <span className={`text-xs font-bold italic ${isHigh ? 'text-rose-400 animate-pulse' : 'text-[var(--text-secondary)]'}`}>{trade.peRatio?.toFixed(1)}</span>
                                          <span className="text-[6px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Current PE</span>
                                        </>
                                      );
                                    })()}
                                 </div>
                               )}
                                <div className="flex items-center justify-end gap-2 font-sans">
                                  {trade.strategy ? (
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold uppercase tracking-wide max-w-[120px] truncate">{trade.strategy}</span>
                                  ) : trade.isPass !== false ? (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold tracking-wide shrink-0">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                      PASS
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-bold tracking-wide shrink-0">REJECT</span>
                                      <span className="text-xs font-bold text-amber-400 leading-tight max-w-[180px]">
                                        {trade.reason === 'Pattern Not Found' 
                                          ? 'Score: ' + (trade.score || 0) + '/60' 
                                          : trade.reason || 'Score: ' + (trade.score || 0) + '/60'}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex flex-col items-end min-w-[44px]">
                                    <span className={`text-xs font-bold leading-none ${
                                      (trade.score || 0) >= 70 ? 'text-emerald-400' :
                                      (trade.score || 0) >= 60 ? 'text-blue-400' :
                                      (trade.score || 0) >= 50 ? 'text-amber-400' :
                                      'text-rose-400'
                                    }`}>{trade.score || 0}/100</span>
                                    <span className="text-[9px] text-[var(--text-tertiary)] font-extrabold uppercase tracking-wider mt-0.5">
                                      {trade.smartMoney ? `${trade.smartMoney}% Smart` : 'Audit'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Link to={`/stock/${trade.symbol}`} className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all shrink-0" title="Detailed Fundamentals">
                                     <InfoIcon className="h-3.5 w-3.5" />
                                  </Link>
                                  <Link to={`/analysis/${trade.symbol}`} className="px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold hover:bg-emerald-500 hover:text-white transition-all shrink-0 whitespace-nowrap">
                                    Fund Check
                                  </Link>
                                </div>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Safe-Guard Rule #10: Smart Insight Cards) */}
      <div className="md:hidden space-y-3 px-2">
         <AnimatePresence>
             {paginatedTrades.map((trade, idx) => {
              const isStarred = userWatchlist?.includes(trade.symbol);
              const capTag = getMarketCapTag(trade.marketCap, trade.symbol);
              const isExpanded = expandedSymbol === trade.symbol;

              if (activeTab === 'portfolio') {
                const invested = (trade.quantity || 0) * (trade.buy_price || 0);
                const currentVal = (trade.quantity || 0) * (trade.livePrice || 0);
                const pnl = currentVal - invested;
                const yieldPercent = invested > 0 ? (pnl / invested) * 100 : 0;
                const isPnlPositive = pnl >= 0;

                return (
                  <motion.div 
                     key={trade.symbol} 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                     className="bg-[var(--bg-secondary)] rounded-[1.25rem] border border-[var(--border-primary)] shadow-md shadow-[var(--border-primary)] overflow-hidden"
                  >
                     {/* Clickable Header Area */}
                     <div 
                        onClick={() => setExpandedSymbol(isExpanded ? null : trade.symbol)}
                        className="p-4 flex items-center justify-between cursor-pointer active:bg-[var(--bg-secondary)] transition-colors"
                     >
                        {/* Left: Symbol & Details */}
                        <div className="flex items-center space-x-3">
                           <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                 <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight font-mono uppercase">{trade.symbol}</span>
                                 <span className={`px-1.5 py-0.5 rounded-[0.25rem] text-[6.5px] font-bold border tracking-wider leading-none ${capTag.class}`}>{capTag.label}</span>
                              </div>
                              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{trade.sector}</span>
                           </div>
                        </div>
                        
                        {/* Right: CMP & Yield */}
                        <div className="flex items-center space-x-3">
                           <div className="text-right flex flex-col items-end">
                              <span className="text-sm font-extrabold text-[var(--text-primary)] font-mono">₹{trade.livePrice?.toLocaleString()}</span>
                              <span className={`text-[8.5px] font-bold font-mono leading-none mt-1.5 px-1.5 py-0.5 rounded ${isPnlPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                 {isPnlPositive ? '+' : ''}{yieldPercent.toFixed(1)}% Yield
                              </span>
                           </div>
                           <ChevronRight className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                     </div>

                     {/* Quick Info (Always Visible: Edit controls for portfolio) */}
                     <div className="px-4 pb-3 flex items-center justify-between border-[var(--border-primary)] gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[8.5px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Qty:</span>
                          <input 
                            type="number" 
                            defaultValue={trade.quantity || 0} 
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => onUpdateHolding?.(trade.symbol, parseInt(e.target.value) || 0, trade.buy_price || 0)} 
                            className="w-12 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-center font-mono font-bold py-0.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus:bg-[var(--bg-secondary)] focus:border-blue-600 transition-all shadow-sm" 
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[8.5px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Avg:</span>
                          <input 
                            type="number" 
                            defaultValue={trade.buy_price || 0} 
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => onUpdateHolding?.(trade.symbol, trade.quantity || 0, parseFloat(e.target.value) || 0)} 
                            className="w-16 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-right pr-1 font-mono font-bold py-0.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none focus:bg-[var(--bg-secondary)] focus:border-blue-600 transition-all shadow-sm" 
                          />
                        </div>
                        <div className="text-[9.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
                          Net: ₹{currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                     </div>

                     {/* Expanded Details Section */}
                     {isExpanded && (
                        <div className="p-4 bg-[var(--bg-secondary)]/40 border-t border-[var(--border-primary)] space-y-4 animate-in slide-in-from-top-1 duration-200">
                           {/* Core Metrics Grid */}
                           <div className="grid grid-cols-3 gap-2">
                              <div className="bg-[var(--bg-secondary)] p-2.5 rounded-[0.75rem] border border-[var(--border-primary)] text-center flex flex-col justify-center shadow-sm">
                                 <span className="text-[7.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none mb-1">Invested</span>
                                 <span className="text-xs font-bold font-mono text-[var(--text-primary)]">₹{invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                              <div className="bg-[var(--bg-secondary)] p-2.5 rounded-[0.75rem] border border-[var(--border-primary)] text-center flex flex-col justify-center shadow-sm">
                                 <span className="text-[7.5px] font-bold text-[var(--text-secondary)] uppercase tracking-wider leading-none mb-1">Current Val</span>
                                 <span className="text-xs font-bold font-mono text-[var(--text-primary)]">₹{currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                              <div className="bg-[var(--bg-secondary)] p-2.5 rounded-[0.75rem] border border-[var(--border-primary)] text-center flex flex-col justify-center shadow-sm">
                                 <span className="text-[7.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none mb-1">Total PnL</span>
                                 <span className={`text-xs font-bold font-mono ${isPnlPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isPnlPositive ? '+' : ''}₹{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                 </span>
                              </div>
                           </div>

                           {/* Audit / Score row - traffic light colors */}
                           <div className="flex items-center justify-between bg-[var(--bg-secondary)] px-3 py-2.5 rounded-[0.75rem] border border-[var(--border-primary)] shadow-sm text-xs">
                              <div className="flex items-center space-x-1.5">
                                 {/* Strategy name pill */}
                                 {trade.strategy ? (
                                   <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[7.5px] font-bold max-w-[100px] truncate">{trade.strategy}</span>
                                 ) : trade.isPass !== false ? (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[7.5px] font-bold">PASS</span>
                                  ) : (
                                     <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[7.5px] font-bold">REJECT</span>
                                  )}
                                  <span className="font-extrabold text-[var(--text-secondary)]">Audit:</span>
                                 <span className={`font-bold ${
                                   (trade.score || 0) >= 70 ? 'text-emerald-400' :
                                   (trade.score || 0) >= 50 ? 'text-amber-400' :
                                   'text-rose-400'
                                 }`}>{trade.score || 0}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <Link to={`/stock/${trade.symbol}`} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all shrink-0">
                                    <InfoIcon className="h-3.5 w-3.5" />
                                 </Link>
                                 <Link to={`/charts?symbol=${trade.symbol}&return=/dashboard`} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all shrink-0" title="Open in Charts Terminal">
                                    <BarChart3 className="h-3 w-3" />
                                 </Link>
                                 <button onClick={(e) => { e.preventDefault(); if (window.confirm(`Remove ${trade.symbol} from portfolio?`)) onToggleWatchlist?.(trade.symbol); }} className="p-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-rose-600 hover:text-white transition-all">
                                   <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                           </div>
                        </div>
                     )}
                  </motion.div>
                );
              }

              // Normal Strategy Tab View
              const changePercent = trade.change || 0;
              const isPositive = changePercent >= 0;

              return (
                <motion.div 
                   key={trade.symbol} 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                   className="bg-[var(--bg-secondary)] rounded-[1.25rem] border border-[var(--border-primary)] shadow-md shadow-[var(--border-primary)] overflow-hidden"
                >
                   {/* Clickable Header Area */}
                   <div 
                      onClick={() => setExpandedSymbol(isExpanded ? null : trade.symbol)}
                      className="p-4 flex items-center justify-between cursor-pointer active:bg-[var(--bg-secondary)] transition-colors"
                   >
                      {/* Left: Symbol & Details */}
                      <div className="flex items-center space-x-3">
                         <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                               <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight font-mono uppercase">{trade.symbol}</span>
                               <span className={`px-1.5 py-0.5 rounded-[0.25rem] text-[6.5px] font-bold border tracking-wider leading-none ${capTag.class}`}>{capTag.label}</span>
                            </div>
                            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{trade.sector}</span>
                         </div>
                      </div>
                      
                      {/* Right: Price & Toggle */}
                      <div className="flex items-center space-x-3">
                         <div className="text-right flex flex-col items-end">
                            <span className="text-sm font-extrabold text-[var(--text-primary)] font-mono">₹{trade.livePrice?.toLocaleString()}</span>
                            <span className={`text-[8.5px] font-bold font-mono leading-none mt-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                            </span>
                         </div>
                         <ChevronRight className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                   </div>

                   {/* Quick Info (Always Visible: ABCD ladder & status) */}
                   <div className="px-4 pb-3 flex items-center justify-between border-[var(--border-primary)]">
                      {visibleColumns.abcd ? (
                         <div className="flex items-center space-x-1">
                            {['a', 'b', 'c', 'd'].map((l) => {
                              const levelObj = trade.abcd?.[l];
                              const levelVal = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                              const isActive = (trade.livePrice || 0) <= levelVal && levelVal > 0;
                              const levelColor = l === 'a' ? (isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-500/10 text-blue-300 border-blue-500/20') :
                                               (l === 'b' || l === 'c') ? (isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20') :
                                               (isActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20');

                              return (
                                <div key={l} className={`w-5 h-5 rounded-[0.35rem] flex items-center justify-center text-xs font-bold border transition-all ${levelColor} ${isActive ? 'scale-105 font-bold opacity-100' : 'opacity-40'}`}>
                                  {l.toUpperCase()}
                                </div>
                              );
                            })}
                         </div>
                      ) : (
                         <div className="text-xs font-bold text-[var(--text-muted)]">Institutional Strategy</div>
                      )}

                      <div className="flex items-center gap-1.5">
                         {trade.isBuyZone ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">STRATEGY FLOOR</span>
                         ) : (
                            <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-secondary)] rounded-full text-xs font-bold">OUT OF RANGE</span>
                         )}
                      </div>
                   </div>

                   {/* Expanded Details Section */}
                   {isExpanded && (
                      <div className="p-4 bg-[var(--bg-secondary)]/40 border-t border-[var(--border-primary)] space-y-4 animate-in slide-in-from-top-1 duration-200">
                         {/* ABCD Prices */}
                         {visibleColumns.abcd && trade.abcd && (
                            <div className="bg-[var(--bg-secondary)] p-3 rounded-[0.75rem] border border-[var(--border-primary)] space-y-1.5 shadow-sm">
                               <div className="text-[7.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-[var(--border-primary)] pb-1 mb-1">Research Levels</div>
                               <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  {['a', 'b', 'c', 'd'].map((l) => {
                                     const levelObj = trade.abcd?.[l];
                                     const price = typeof levelObj === 'object' ? levelObj.price : (typeof trade.abcd?.[l] === 'number' ? trade.abcd[l] : 0);
                                     return (
                                        <div key={l} className="flex justify-between items-center text-xs">
                                           <span className={`font-bold uppercase text-xs ${l === 'a' ? 'text-blue-500' : l === 'd' ? 'text-emerald-500' : 'text-indigo-500'}`}>T-{l.toUpperCase()}</span>
                                           <span className="font-bold font-mono text-[var(--text-primary)]">₹{price?.toLocaleString()}</span>
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>
                         )}

                         {/* Core Metrics Grid */}
                         <div className="grid grid-cols-3 gap-2">
                            <div className="bg-[var(--bg-secondary)] p-2.5 rounded-[0.75rem] border border-[var(--border-primary)] text-center flex flex-col justify-center shadow-sm">
                               <span className="text-[7.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none mb-1">Obs Base</span>
                               <span className="text-xs font-bold font-mono text-[var(--text-primary)]">₹{trade.entryPrice?.toLocaleString()}</span>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-2.5 rounded-[0.75rem] border border-[var(--border-primary)] text-center flex flex-col justify-center shadow-sm">
                               <span className="text-[7.5px] font-bold text-fuchsia-500 uppercase tracking-wider leading-none mb-1">Projection</span>
                               <span className="text-xs font-bold font-mono text-fuchsia-400">₹{trade.target?.toLocaleString()}</span>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-2.5 rounded-[0.75rem] border border-[var(--border-primary)] text-center flex flex-col justify-center shadow-sm">
                               <span className="text-[7.5px] font-bold text-emerald-500 uppercase tracking-wider leading-none mb-1">ROI (Est.)</span>
                               <span className="text-xs font-bold font-mono text-emerald-400">+{trade.targetGap?.toFixed(1)}%</span>
                            </div>
                         </div>

                         {/* Audit / Score row */}
                          <div className="flex items-center justify-between bg-[var(--bg-secondary)] px-3 py-2.5 rounded-[0.75rem] border border-[var(--border-primary)] shadow-sm text-xs">
                             <div className="flex items-center space-x-1.5">
                                {trade.strategy ? (
                                   <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[7.5px] font-bold max-w-[100px] truncate">{trade.strategy}</span>
                                 ) : trade.isPass !== false ? (
                                   <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[7.5px] font-bold">PASS</span>
                                 ) : (
                                    <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[7.5px] font-bold">REJECT</span>
                                 )}
                                 <span className="font-extrabold text-[var(--text-secondary)]">Audit:</span>
                                <span className={`font-bold ${
                                  (trade.score || 0) >= 70 ? 'text-emerald-400' :
                                  (trade.score || 0) >= 50 ? 'text-amber-400' :
                                  'text-rose-400'
                                }`}>{trade.score || 0}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                {(trade.peRatio || 0) > 0 && (
                                  <div className="flex items-center space-x-1 font-mono">
                                     <span className="font-extrabold text-[var(--text-muted)] uppercase text-xs tracking-wider">PE:</span>
                                     <span className="font-bold text-[var(--text-primary)]">{trade.peRatio?.toFixed(1)}</span>
                                  </div>
                               )}
                             </div>
                          </div>
                          {trade.isPass === false && (
                            <div className="bg-amber-50/50 border border-amber-200/50 rounded-[0.75rem] px-3 py-2 text-xs">
                              <span className="font-bold text-amber-700 uppercase tracking-wider text-xs">Reason: </span>
                              <span className="font-medium text-amber-800">
                                {trade.reason === 'Pattern Not Found'
                                  ? 'Score ' + (trade.score || 0) + '/60 - Audit threshold not met'
                                  : trade.reason || 'Score ' + (trade.score || 0) + '/60 - Audit threshold not met'}
                              </span>
                            </div>
                          )}

                         {/* Action Buttons */}
                         <div className="flex items-center gap-2 pt-1">
                            <button 
                               onClick={(e) => { e.stopPropagation(); onToggleWatchlist?.(trade.symbol); }}
                               className={`flex-1 py-2.5 rounded-xl text-caption flex items-center justify-center gap-1.5 border transition-all ${
                                  isStarred 
                                     ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10' 
                                     : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]'
                               }`}
                            >
                               <StarIcon className={`h-3.5 w-3.5 ${isStarred ? 'fill-current text-white' : ''}`} />
                               {isStarred ? 'Watchlisted' : 'Watchlist'}
                            </button>

                            <button 
                               onClick={(e) => { e.stopPropagation(); handleShareSignal(trade, 'telegram'); }}
                               className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                            >
                               <Share2 className="h-3.5 w-3.5" />
                            </button>

                             <Link 
                                to={`/stock/${trade.symbol}`}
                                className="flex-1 py-2.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-caption rounded-xl shadow-sm border border-[var(--border-primary)] flex items-center justify-center gap-1 hover:bg-[var(--bg-secondary)] transition-all"
                             >
                                <InfoIcon className="h-3.5 w-3.5" />
                                Audit details
                             </Link>

                             <Link
                                to={`/analysis/${trade.symbol}`}
                                className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-500 text-caption rounded-xl shadow-sm border border-emerald-500/20 flex items-center justify-center gap-1 hover:bg-emerald-500 hover:text-white transition-all"
                                title="Detailed Fundamental Analysis"
                             >
                                Fund Check
                             </Link>

                             <Link
                                to={`/charts?symbol=${trade.symbol}&return=/dashboard`}
                                className="p-2.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl shadow-sm border border-[var(--border-primary)] flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-all"
                                title="Open in Charts Terminal"
                             >
                                <BarChart3 className="h-3.5 w-3.5" />
                             </Link>
                         </div>
                      </div>
                   )}
                </motion.div>
              );
            })}
          </AnimatePresence>
       </div>

      {/* Pagination Controls */}
      {filteredAndSortedTrades.length > rowsPerPage && (
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)]/50 backdrop-blur-md rounded-[2rem] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Rows</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg text-caption px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="px-4 py-2 text-caption rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)] transition-all"
            >
              Prev
            </button>
            {(() => {
              const pages = [];
              const startPage = Math.max(0, page - 2);
              const endPage = Math.min(totalPages - 1, page + 2);
              if (startPage > 0) pages.push(<button key={0} onClick={() => goToPage(0)} className="px-3 py-2 text-xs font-bold rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all">1</button>);
              if (startPage > 1) pages.push(<span key="start-dots" className="px-1 text-[var(--text-tertiary)] text-xs font-bold">...</span>);
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => goToPage(i)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${page === i ? 'bg-slate-900 text-white border-slate-900' : 'border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                  >
                    {i + 1}
                  </button>
                );
              }
              if (endPage < totalPages - 2) pages.push(<span key="end-dots" className="px-1 text-[var(--text-tertiary)] text-xs font-bold">...</span>);
              if (endPage < totalPages - 1) pages.push(<button key={totalPages - 1} onClick={() => goToPage(totalPages - 1)} className="px-3 py-2 text-xs font-bold rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all">{totalPages}</button>);
              return pages;
            })()}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 text-caption rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)] transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
     </div>
   );
 };

export default TradeTable;
