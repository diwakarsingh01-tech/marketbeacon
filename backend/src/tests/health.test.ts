import { describe, it, expect } from 'vitest';

function checkServiceHealth(name: string, status: string, latencyMs?: number): { ok: boolean; message: string } {
  if (status !== 'ok') return { ok: false, message: `${name} is ${status}` };
  if (latencyMs && latencyMs > 5000) return { ok: false, message: `${name} latency too high: ${latencyMs}ms` };
  return { ok: true, message: `${name} is healthy` };
}

function calculateUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.join(' ') || '<1m';
}

describe('Health Check', () => {
  it('should report healthy service', () => {
    const result = checkServiceHealth('api', 'ok', 150);
    expect(result.ok).toBe(true);
    expect(result.message).toContain('healthy');
  });

  it('should report unhealthy service', () => {
    const result = checkServiceHealth('database', 'down');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('down');
  });

  it('should flag high latency', () => {
    const result = checkServiceHealth('cron', 'ok', 6000);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('latency too high');
  });

  it('should format uptime correctly', () => {
    expect(calculateUptime(90000)).toBe('1d 1h');
    expect(calculateUptime(3600)).toBe('1h');
    expect(calculateUptime(120)).toBe('2m');
    expect(calculateUptime(30)).toBe('<1m');
    expect(calculateUptime(0)).toBe('<1m');
  });
});
