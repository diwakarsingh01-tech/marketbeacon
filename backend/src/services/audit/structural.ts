import { AuditCheck } from './types.js';
import fs from 'fs';
import path from 'path';

const CACHE_FILE_PATH = path.resolve(process.cwd(), 'alpha_40_results.json');

export async function runStructuralChecks(): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const now = new Date().toISOString();

  // ST-1: Alpha-40 cache exists
  const cacheExists = fs.existsSync(CACHE_FILE_PATH);
  checks.push({
    id: 'ST-1', category: 'structural', name: 'Alpha-40 cache file exists', severity: 'critical',
    status: cacheExists ? 'pass' : 'fail',
    details: cacheExists ? `Found at ${CACHE_FILE_PATH}` : `Missing at ${CACHE_FILE_PATH}`,
    autoFixable: true, autoFixed: false
  });

  // ST-2: Alpha-40 cache is valid JSON with active array
  if (cacheExists) {
    try {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      const hasActive = Array.isArray(data?.active);
      checks.push({
        id: 'ST-2', category: 'structural', name: 'Alpha-40 cache has valid active array', severity: 'critical',
        status: hasActive ? 'pass' : 'fail',
        details: hasActive ? `${data.active.length} active signals` : 'active array missing or not array',
        autoFixable: true, autoFixed: false
      });
    } catch (e: any) {
      checks.push({
        id: 'ST-2', category: 'structural', name: 'Alpha-40 cache is valid JSON', severity: 'critical',
        status: 'fail', details: `Parse error: ${e.message}`, autoFixable: true, autoFixed: false
      });
    }
  }

  // ST-3: Market snapshot exists
  const snapPaths = [
    path.resolve(process.cwd(), 'market_snapshot.json'),
    path.resolve(process.cwd(), '..', 'market_snapshot.json')
  ];
  const snapExists = snapPaths.some(p => fs.existsSync(p));
  checks.push({
    id: 'ST-3', category: 'structural', name: 'Market snapshot file exists', severity: 'critical',
    status: snapExists ? 'pass' : 'fail',
    details: snapExists ? 'Found market_snapshot.json' : 'Missing in all expected paths',
    autoFixable: true, autoFixed: false
  });

  // ST-4: Snapshot freshness (≤ 26 hours old)
  if (cacheExists) {
    try {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      const updatedAt = data?.updatedAt;
      if (updatedAt) {
        const ageHours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 3600);
        checks.push({
          id: 'ST-4', category: 'structural', name: 'Alpha-40 cache freshness', severity: 'high',
          status: ageHours <= 26 ? 'pass' : 'fail',
          details: `Cache age: ${ageHours.toFixed(1)} hours (threshold: 26h)`,
          autoFixable: true, autoFixed: false
        });
      }
    } catch (_) {}
  }

  // ST-5: Audit reports directory writable
  const reportsDir = path.resolve(process.cwd(), 'audit_reports');
  try {
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    fs.accessSync(reportsDir, fs.constants.W_OK);
    checks.push({
      id: 'ST-5', category: 'structural', name: 'Audit reports directory writable', severity: 'high',
      status: 'pass', details: reportsDir, autoFixable: false, autoFixed: false
    });
  } catch (e: any) {
    checks.push({
      id: 'ST-5', category: 'structural', name: 'Audit reports directory', severity: 'high',
      status: 'fail', details: `Not writable: ${e.message}`, autoFixable: false, autoFixed: false
    });
  }

  // ST-6: Snapshots directory writable
  const snapDir = path.resolve(process.cwd(), 'audit_reports', 'snapshots');
  try {
    if (!fs.existsSync(snapDir)) fs.mkdirSync(snapDir, { recursive: true });
    fs.accessSync(snapDir, fs.constants.W_OK);
    checks.push({
      id: 'ST-6', category: 'structural', name: 'Snapshots directory writable', severity: 'high',
      status: 'pass', details: snapDir, autoFixable: false, autoFixed: false
    });
  } catch (e: any) {
    checks.push({
      id: 'ST-6', category: 'structural', name: 'Snapshots directory', severity: 'high',
      status: 'fail', details: `Not writable: ${e.message}`, autoFixable: false, autoFixed: false
    });
  }

  return checks;
}
