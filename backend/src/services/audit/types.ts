export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type CheckStatus = 'pass' | 'fail' | 'fixed' | 'skipped';
export type ChangeType = 'ENTRY' | 'EXIT';

export interface AuditCheck {
  id: string;
  category: 'structural' | 'data_quality' | 'strategy' | 'basket';
  name: string;
  severity: Severity;
  status: CheckStatus;
  details: string;
  autoFixable: boolean;
  autoFixed: boolean;
  fixDetails?: string;
}

export interface AuditChange {
  type: ChangeType;
  symbol: string;
  strategy: string;
  basket: string;
  oldEntry?: number;
  newEntry?: number;
  oldTarget?: number;
  newTarget?: number;
  oldGrade?: string;
  newGrade?: string;
  reason: string;
}

export interface StrategyCount {
  strategyId: string;
  strategyName: string;
  count: number;
  delta: number;
}

export interface AuditSnapshot {
  date: string;
  timestamp: string;
  alpha40: any[];
  baskets: Record<string, string[]>;
  growthBasket: string[];
  strategyCounts: Record<string, number>;
  allQualified: {
    symbol: string;
    strategy: string;
    basket: string;
    entryPrice: number;
    target: number;
    grade: string;
  }[];
}

export interface AuditSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  autoFixed: number;
  manualRequired: number;
  entries: AuditChange[];
  exits: AuditChange[];
  strategyCounts: StrategyCount[];
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
}

export interface AuditReport {
  date: string;
  startedAt: string;
  completedAt: string;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  summary: AuditSummary;
  checks: AuditCheck[];
  changes: AuditChange[];
  snapshotsCompared: { today: string; yesterday: string };
  raw: Record<string, any>;
}
