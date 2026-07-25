import { describe, it, expect } from 'vitest';

interface AuditIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

interface AuditReport {
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  issues: AuditIssue[];
  score: number;
}

function generateAuditScore(report: Omit<AuditReport, 'score'>): number {
  if (report.totalChecks === 0) return 100;
  return Math.round((report.passed / report.totalChecks) * 100);
}

function categorizeAuditScore(score: number): string {
  if (score >= 95) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

function countBySeverity(issues: AuditIssue[], severity: string): number {
  return issues.filter(i => i.severity === severity).length;
}

describe('Audit System', () => {
  it('should calculate perfect score', () => {
    const score = generateAuditScore({
      timestamp: new Date().toISOString(),
      totalChecks: 50,
      passed: 50,
      failed: 0,
      issues: [],
    });
    expect(score).toBe(100);
  });

  it('should calculate partial score', () => {
    const score = generateAuditScore({
      timestamp: new Date().toISOString(),
      totalChecks: 100,
      passed: 85,
      failed: 15,
      issues: [{ type: 'test', severity: 'high', message: 'test failure' }],
    });
    expect(score).toBe(85);
  });

  it('should handle zero checks', () => {
    const score = generateAuditScore({
      timestamp: new Date().toISOString(),
      totalChecks: 0,
      passed: 0,
      failed: 0,
      issues: [],
    });
    expect(score).toBe(100);
  });

  it('should categorize scores correctly', () => {
    expect(categorizeAuditScore(100)).toBe('excellent');
    expect(categorizeAuditScore(95)).toBe('excellent');
    expect(categorizeAuditScore(85)).toBe('good');
    expect(categorizeAuditScore(65)).toBe('fair');
    expect(categorizeAuditScore(40)).toBe('poor');
  });

  it('should count issues by severity', () => {
    const issues: AuditIssue[] = [
      { type: 'a', severity: 'critical', message: 'critical 1' },
      { type: 'b', severity: 'high', message: 'high 1' },
      { type: 'c', severity: 'high', message: 'high 2' },
      { type: 'd', severity: 'medium', message: 'medium 1' },
    ];
    expect(countBySeverity(issues, 'critical')).toBe(1);
    expect(countBySeverity(issues, 'high')).toBe(2);
    expect(countBySeverity(issues, 'medium')).toBe(1);
    expect(countBySeverity(issues, 'low')).toBe(0);
  });
});
