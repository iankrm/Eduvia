import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();
const PLANS = {
  monthly: {
    label: 'Monthly',
    days: 30
  },
  annual: {
    label: 'Annual',
    days: 365
  },
  family: {
    label: 'Family',
    days: 365
  }
};
async function currentSub(userId) {
  return (await db.prepare('SELECT plan, status, payment_reference, current_period_end FROM subscriptions WHERE user_id = ?').get(userId)) || null;
}

/* GET /api/billing */
router.get('/', requireAuth, async (req, res) => {
  res.json({
    subscription: await currentSub(req.user.id),
    plans: Object.entries(PLANS).map(([k, v]) => ({
      id: k,
      ...v
    }))
  });
});

/* POST /api/billing/checkout
   Stands in for Stripe: no card data is sent to us, only the last 4 digits
   the client collected. Replace this handler with a real PaymentIntent +
   webhook before charging anyone. */
router.post('/checkout', requireAuth, async (req, res) => {
  const {
    plan,
    card_last4,
    promo_code
  } = req.body || {};
  if (!PLANS[plan]) return res.status(400).json({
    error: 'Choose a valid plan'
  });
  const last4 = String(card_last4 || '').replace(/\D/g, '').slice(-4);
  if (last4.length !== 4) return res.status(400).json({
    error: 'Enter the last 4 digits of your card'
  });

  /* Optional tutor discount. Validated against the code table, not trusted. */
  let applied = null;
  if (promo_code) {
    const code = String(promo_code).trim().toUpperCase();
    const promo = await db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code);
    if (promo) {
      const expired = promo.expires_at && new Date(`${promo.expires_at.replace(' ', 'T')}Z`) < new Date();
      const usedUp = promo.max_uses > 0 && promo.used_count >= promo.max_uses;
      if (expired || usedUp) {
        return res.status(409).json({
          error: 'That promo code is no longer valid'
        });
      }
      await db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?').run(promo.id);
      applied = {
        code: promo.code,
        percentOff: promo.percent_off
      };
    } else {
      return res.status(404).json({
        error: 'That promo code is not valid'
      });
    }
  }
  const days = PLANS[plan].days;
  const periodEnd = new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
  const ref = `demo_${randomUUID().slice(0, 12)}`;
  await db.prepare(`INSERT INTO subscriptions (user_id, plan, status, payment_reference, current_period_end)
     VALUES (?, ?, 'active', ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       plan               = excluded.plan,
       status             = 'active',
       payment_reference  = excluded.payment_reference,
       current_period_end = excluded.current_period_end`).run(req.user.id, plan, ref, periodEnd);
  res.status(201).json({
    subscription: await currentSub(req.user.id),
    promo: applied
  });
});

/* POST /api/billing/cancel */
router.post('/cancel', requireAuth, async (req, res) => {
  await db.prepare(`UPDATE subscriptions SET status = 'canceled' WHERE user_id = ?`).run(req.user.id);
  res.json({
    subscription: await currentSub(req.user.id)
  });
});
export default router;
