/**
 * Razorpay Payment Routes — MarketBeacon
 * Handles BOTH:
 *  1. Subscriptions (Pro ₹99/mo, Alpha ₹199/mo) via Razorpay Plans/Subscriptions
 *  2. One-time Swing Course (₹999) via Orders
 * Free tier = untouched (no payment).
 * No GST (handled later). Auto-unlock via webhook.
 */
import { Router, Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

// Lazy Razorpay client — keys may be absent on first deploy. Do NOT construct
// at module load: `new Razorpay({key_id:''})` throws and takes the whole
// backend down. Construct on first use; payment endpoints return a clear
// error until RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are set in .env.
let _razorpay: any = null;
function getRazorpay(): any {
  if (!_razorpay) {
    if (!KEY_ID || !KEY_SECRET) {
      throw new Error('Razorpay keys not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing in .env)');
    }
    _razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }
  return _razorpay;
}

// ---- Price config (paise) ----
const SWING_COURSE_PAISE = parseInt(process.env.COURSE_SWING_PRICE_PAISE || '99900', 10);
const PRO_MONTHLY_PAISE = 9900;   // ₹99/mo
const ALPHA_MONTHLY_PAISE = 19900; // ₹199/mo

const COURSE_NAME = process.env.COURSE_SWING_NAME || 'MarketBeacon Swing System';

// ---------------------------------------------------------------------------
// GET /api/payment/config  (frontend fetches public key)
// ---------------------------------------------------------------------------
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    keyId: KEY_ID,
    swing: { price: SWING_COURSE_PAISE, name: COURSE_NAME },
    pro: { price: PRO_MONTHLY_PAISE, name: 'Pro Monthly' },
    alpha: { price: ALPHA_MONTHLY_PAISE, name: 'Alpha Monthly' },
  });
});

// ---------------------------------------------------------------------------
// POST /api/payment/create-order  (one-time Swing Course ₹999)
// ---------------------------------------------------------------------------
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email required' });

    const order = await getRazorpay().orders.create({
      amount: SWING_COURSE_PAISE,
      currency: 'INR',
      receipt: `swing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      notes: { product: 'swing_course', email, name: name || '', courseName: COURSE_NAME },
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID });
  } catch (e: any) {
    console.error('[payment] create-order failed:', e?.message);
    res.status(500).json({ error: 'Payment init failed', detail: e?.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/payment/create-subscription  (Pro/Alpha recurring)
// Creates a Plan (idempotent by name) then a Subscription.
// ---------------------------------------------------------------------------
async function getOrCreatePlan(planKey: string, amount: number, name: string) {
  // Razorpay plans are immutable; we create once and cache id in env-less map.
  // For simplicity, create fresh plan per call is wasteful — instead we try to
  // reuse a known plan id from env, else create.
  const envPlanId = planKey === 'pro'
    ? process.env.RAZORPAY_PLAN_PRO
    : process.env.RAZORPAY_PLAN_ALPHA;

  if (envPlanId) return envPlanId;

  const plan = await getRazorpay().plans.create({
    period: 'monthly',
    interval: 1,
    item: {
      name,
      description: `${name} — MarketBeacon`,
      amount,
      currency: 'INR',
    },
    notes: { product: planKey },
  });
  return plan.id;
}

router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const { email, name, tier } = req.body || {};
    if (!email || !tier) return res.status(400).json({ error: 'Email + tier required' });

    const isPro = tier === 'pro';
    const amount = isPro ? PRO_MONTHLY_PAISE : ALPHA_MONTHLY_PAISE;
    const planName = isPro ? 'Pro Monthly' : 'Alpha Monthly';

    const planId = await getOrCreatePlan(tier, amount, planName);

    const subscription = await getRazorpay().subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 120, // ~10 years cap; cancels on unsubscribe
      notes: { product: `${tier}_sub`, email, name: name || '' },
    });

    res.json({
      subscriptionId: subscription.id,
      keyId: KEY_ID,
      amount,
      planId,
      tier,
    });
  } catch (e: any) {
    console.error('[payment] create-subscription failed:', e?.message);
    res.status(500).json({ error: 'Subscription init failed', detail: e?.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/payment/webhook  (Razorpay → verify + unlock)
// Dashboard webhook URL: https://marketbeaconpro.com/api/payment/webhook
// Events: payment.captured, subscription.activated, order.paid
// ---------------------------------------------------------------------------
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || KEY_SECRET;
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    const signature = (req.headers['x-razorpay-signature'] as string) || '';

    if (digest !== signature) {
      console.error('[payment] webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;
    const subscription = req.body?.payload?.subscription?.entity;
    const order = req.body?.payload?.order?.entity;

    if (event === 'payment.captured' || event === 'order.paid') {
      const email = payment?.notes?.email || order?.notes?.email;
      const product = payment?.notes?.product || order?.notes?.product || 'swing_course';
      const amount = payment?.amount || order?.amount || 0;
      console.log(`[payment] CAPTURED: ${email} ₹${amount / 100} (${product})`);
      await notify(email, product, amount);
    }

    if (event === 'subscription.activated' || event === 'subscription.charged') {
      const email = subscription?.notes?.email;
      const product = subscription?.notes?.product || 'sub';
      const amount = subscription?.plan_id ? (await getPlanAmount(subscription.plan_id)) : 0;
      console.log(`[payment] SUB ACTIVATED: ${email} (${product})`);
      await notify(email, product, amount);
    }

    res.json({ status: 'ok' });
  } catch (e: any) {
    console.error('[payment] webhook error:', e?.message);
    res.status(500).json({ error: 'webhook failed' });
  }
});

async function getPlanAmount(planId: string): Promise<number> {
  try {
    const p: any = await getRazorpay().plans.fetch(planId);
    return p?.item?.amount || 0;
  } catch { return 0; }
}

async function notify(email: string, product: string, amount: number) {
  try {
    const { notifyAdmins } = await import('../services/notificationService.js');
    const label = product.includes('pro') ? 'Pro Sub'
      : product.includes('alpha') ? 'Alpha Sub' : 'Swing Course';
    await notifyAdmins(`💰 Sale: ${label} | ${email} | ₹${amount / 100}`, 'Razorpay payment received');
  } catch {/* non-fatal */}
}

export default router;
