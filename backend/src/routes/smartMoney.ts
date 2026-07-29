import { Router } from 'express';
import {
  getShareholdingHistory,
  getTopMovers,
  getSectorSummary,
  captureShareholdingSnapshot,
} from '../services/smartMoneyService.js';

const router = Router();

// ── History: FII/DII/Promoter trend for a single symbol ──
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await getShareholdingHistory(symbol);
    res.json({ symbol: symbol.toUpperCase(), history: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Top Movers: stocks with biggest FII/DII changes ──
router.get('/top-movers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const data = await getTopMovers(limit);
    res.json({ movers: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Sector Summary: average FII/DII/Promoter per sector ──
router.get('/sector-summary', async (req, res) => {
  try {
    const data = await getSectorSummary();
    res.json({ sectors: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Trigger manual snapshot capture (no auth — idempotent INSERT OR IGNORE) ──
// The daily cron is the primary capture mechanism; this endpoint exists for
// on-demand refresh and is safe to call from any authenticated context.
router.post('/snapshot', async (req, res) => {
  try {
    const count = await captureShareholdingSnapshot();
    res.json({ ok: true, recordsInserted: count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
