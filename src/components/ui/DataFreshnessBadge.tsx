import React from 'react';

interface DataFreshnessBadgeProps {
  /** ISO timestamp of when the data was last updated */
  lastUpdated?: string | null;
  /** Data type label for context (e.g. "Fundamentals", "Price", "Quarterly") */
  dataType?: string;
  /** Whether to show the "as of" label inline */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'xs';
  /** Custom class */
  className?: string;
  /** Show a live indicator instead of a timestamp (for real-time data) */
  isLive?: boolean;
}

const FRESH_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
const STALE_WARNING_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Formats an ISO timestamp to "25 Jul 2026, 09:30 IST" format
 */
export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Returns a short relative label like "today 09:30" or "3 Jul"
 */
export function relativeTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

/**
 * Check if a timestamp represents fresh data (< 48 hours old)
 */
export function isFresh(lastUpdated: string): boolean {
  try {
    return (Date.now() - new Date(lastUpdated).getTime()) < FRESH_THRESHOLD_MS;
  } catch {
    return false;
  }
}

/**
 * Check if a timestamp represents stale data (> 7 days old)
 */
export function isStale(lastUpdated: string): boolean {
  try {
    return (Date.now() - new Date(lastUpdated).getTime()) > STALE_WARNING_DAYS;
  } catch {
    return false;
  }
}

/**
 * DataFreshnessBadge — a consistent, reusable freshness indicator
 *
 * Usage:
 *   <DataFreshnessBadge lastUpdated={data.dataAge?.lastUpdated} dataType="Fundamentals" />
 *   <DataFreshnessBadge isLive={true} dataType="Price" />
 *   <DataFreshnessBadge lastUpdated={snap.lastUpdated} size="xs" showLabel={false} />
 */
const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  lastUpdated,
  dataType,
  showLabel = true,
  size = 'xs',
  className = '',
  isLive = false,
}) => {
  // Live indicator (real-time data like price feed)
  if (isLive) {
    return (
      <span className={`inline-flex items-center gap-1 ${size === 'xs' ? 'text-[9px]' : 'text-[10px]'} font-medium text-emerald-500 ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Live</span>
        {dataType && <span className="text-[var(--text-muted)]">· {dataType}</span>}
      </span>
    );
  }

  // No timestamp available
  if (!lastUpdated) {
    return (
      <span className={`inline-flex items-center gap-1 ${size === 'xs' ? 'text-[9px]' : 'text-[10px]'} font-medium text-[var(--text-muted)] ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
        <span>Not available</span>
      </span>
    );
  }

  const fresh = isFresh(lastUpdated);
  const stale = isStale(lastUpdated);
  const dotColor = stale ? 'bg-red-500' : fresh ? 'bg-emerald-500' : 'bg-amber-500';
  const label = stale ? 'Stale' : fresh ? 'Fresh' : 'Aging';
  const textColor = stale ? 'text-red-400' : fresh ? 'text-emerald-500' : 'text-amber-400';

  return (
    <span className={`inline-flex items-center gap-1 ${size === 'xs' ? 'text-[9px]' : 'text-[10px]'} font-medium ${textColor} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${fresh ? '' : ''}`} />
      {showLabel ? (
        <>
          <span>{label}</span>
          <span className="text-[var(--text-muted)]">· {relativeTimestamp(lastUpdated)}</span>
          {dataType && <span className="text-[var(--text-muted)]">· {dataType}</span>}
        </>
      ) : (
        <span>{relativeTimestamp(lastUpdated)}</span>
      )}
    </span>
  );
};

export { DataFreshnessBadge };
export default DataFreshnessBadge;
