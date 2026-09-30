import { Router } from 'express';
import { db, EARNINGS_SHARE, CLASS_PRICE_CENTS, recordEarning, ratingFor } from '../db.js';
import { requireAuth, requireRole, requireAdmin } from '../auth.js';
const router = Router();
const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
async function logAction(req, action, entityType, entityId, note = '') {
  await db.prepare('INSERT INTO moderation_log (admin_id, action, entity_type, entity_id, note) VALUES (?, ?, ?, ?, ?)').run(req.user.id, action, entityType, entityId, note);
}

/* ---------------------------------------------------------------- earnings */

/* GET /api/admin/earnings — the signed-in tutor's own revenue summary. */
router.get('/earnings', requireAuth, requireRole('tutor'), async (req, res) => {
  const totals = await db.prepare(`SELECT COALESCE(SUM(amount_cents), 0) AS lifetime,
              COUNT(*)                    AS sales
         FROM earnings WHERE tutor_id = ?`).get(req.user.id);
  const thisMonth = (await db.prepare(`SELECT COALESCE(SUM(amount_cents), 0) AS cents
         FROM earnings WHERE tutor_id = ? AND created_at >= date('now', 'start of month')`).get(req.user.id)).cents;
  const recent = await db.prepare(`SELECT e.*, c.title AS class_title, c.slug AS class_slug, u.name AS student_name
         FROM earnings e
         LEFT JOIN classes c ON c.id = e.class_id
         LEFT JOIN users  u ON u.id = e.student_id
        WHERE e.tutor_id = ?
        ORDER BY e.created_at DESC LIMIT 50`).all(req.user.id);
  res.json({
    lifetimeCents: totals.lifetime,
    monthCents: thisMonth,
    sales: totals.sales,
    share: EARNINGS_SHARE,
    recent: recent.map(r => ({
      id: r.id,
      amountCents: r.amount_cents,
      reason: r.reason,
      createdAt: r.created_at,
      classTitle: r.class_title,
      classSlug: r.class_slug,
      studentName: r.student_name
    }))
  });
});

/* -------------------------------------------------------------- promo codes */

/* GET /api/admin/promo-codes */
router.get('/promo-codes', requireAuth, requireRole('tutor'), async (req, res) => {
  const rows = await db.prepare('SELECT * FROM promo_codes WHERE tutor_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({
    promoCodes: rows.map(p => ({
      id: p.id,
      code: p.code,
      percentOff: p.percent_off,
      maxUses: p.max_uses,
      usedCount: p.used_count,
      expiresAt: p.expires_at,
      createdAt: p.created_at
    }))
  });
});

/* POST /api/admin/promo-codes */
router.post('/promo-codes', requireAuth, requireRole('tutor'), async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const percent = Number(req.body?.percentOff);
  if (code.length < 3) return res.status(400).json({
    error: 'Code must be at least 3 characters'
  });
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
    return res.status(400).json({
      error: 'Discount must be between 1 and 100'
    });
  }
  if (await db.prepare('SELECT id FROM promo_codes WHERE code = ?').get(code)) {
    return res.status(409).json({
      error: 'That code already exists'
    });
  }
  const maxUses = Math.max(0, Number(req.body?.maxUses) || 0);
  const expiresAt = req.body?.expiresAt ? String(req.body.expiresAt) : null;
  const r = await db.prepare('INSERT INTO promo_codes (tutor_id, code, percent_off, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)').run(req.user.id, code, percent, maxUses, expiresAt);
  res.status(201).json({
    promoCode: {
      id: Number(r.lastInsertRowid),
      code,
      percentOff: percent
    }
  });
});

/* DELETE /api/admin/promo-codes/:id */
router.delete('/promo-codes/:id', requireAuth, requireRole('tutor'), async (req, res) => {
  const changed = (await db.prepare('DELETE FROM promo_codes WHERE id = ? AND tutor_id = ?').run(Number(req.params.id), req.user.id)).changes;
  if (!changed) return res.status(404).json({
    error: 'Promo code not found'
  });
  res.json({
    ok: true
  });
});

/* --------------------------------------------------------------- moderation */

/* GET /api/admin/moderation — queues a moderator works through. */
router.get('/moderation', requireAuth, requireAdmin, async (_req, res) => {
  const reviews = await db.prepare(`SELECT r.*, u.name AS author_name, c.title AS class_title, c.slug AS class_slug
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         JOIN classes c ON c.id = r.class_id
        ORDER BY r.created_at DESC LIMIT 100`).all();
  const classes = await db.prepare(`SELECT c.*, u.name AS tutor_name,
              (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS student_count
         FROM classes c JOIN users u ON u.id = c.tutor_id
        ORDER BY c.created_at DESC LIMIT 100`).all();
  const users = await db.prepare('SELECT id, email, name, role, is_admin, email_verified_at, created_at FROM users ORDER BY created_at DESC LIMIT 100').all();
  const log = await db.prepare(`SELECT m.*, u.name AS admin_name FROM moderation_log m
         JOIN users u ON u.id = m.admin_id ORDER BY m.created_at DESC LIMIT 50`).all();
  res.json({
    reviews: reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      status: r.status,
      author: r.author_name,
      classTitle: r.class_title,
      classSlug: r.class_slug,
      createdAt: r.created_at
    })),
    classes: await Promise.all(classes.map(async c => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      status: c.status,
      tutor: c.tutor_name,
      studentCount: c.student_count,
      rating: await ratingFor(c.id),
      createdAt: c.created_at
    }))),
    users,
    log,
    stats: {
      users: (await db.prepare('SELECT COUNT(*) AS n FROM users').get()).n,
      classes: (await db.prepare('SELECT COUNT(*) AS n FROM classes').get()).n,
      published: (await db.prepare("SELECT COUNT(*) AS n FROM classes WHERE status = 'published'").get()).n,
      reviews: (await db.prepare('SELECT COUNT(*) AS n FROM reviews').get()).n,
      hidden: (await db.prepare("SELECT COUNT(*) AS n FROM reviews WHERE status = 'hidden'").get()).n,
      enrollments: (await db.prepare('SELECT COUNT(*) AS n FROM enrollments').get()).n,
      earningsCents: (await db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS n FROM earnings').get()).n
    }
  });
});

/* PATCH /api/admin/moderation/reviews/:id — hide or restore a review. */
router.patch('/moderation/reviews/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const row = await db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  if (!row) return res.status(404).json({
    error: 'Review not found'
  });
  const status = String(req.body?.status || '');
  if (!['published', 'hidden'].includes(status)) {
    return res.status(400).json({
      error: 'Status must be published or hidden'
    });
  }
  await db.prepare("UPDATE reviews SET status = ?, updated_at = ? WHERE id = ?").run(status, stamp(), id);
  await logAction(req, status === 'hidden' ? 'hide_review' : 'restore_review', 'review', id, String(req.body?.note || ''));
  res.json({
    ok: true,
    status
  });
});

/* PATCH /api/admin/moderation/classes/:id — publish or unpublish. */
router.patch('/moderation/classes/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const row = await db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
  if (!row) return res.status(404).json({
    error: 'Class not found'
  });
  const status = String(req.body?.status || '');
  if (!['draft', 'published'].includes(status)) {
    return res.status(400).json({
      error: 'Status must be draft or published'
    });
  }
  await db.prepare("UPDATE classes SET status = ?, updated_at = ? WHERE id = ?").run(status, stamp(), id);
  await logAction(req, status === 'published' ? 'publish_class' : 'unpublish_class', 'class', id, String(req.body?.note || ''));
  res.json({
    ok: true,
    status
  });
});

/* POST /api/admin/promo-codes/:code/redeem — applies a discount at checkout. */
router.post('/promo-codes/:code/redeem', requireAuth, async (req, res) => {
  const code = String(req.params.code).trim().toUpperCase();
  const row = await db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(code);
  if (!row) return res.status(404).json({
    error: 'That code is not valid'
  });
  if (row.max_uses > 0 && row.used_count >= row.max_uses) {
    return res.status(409).json({
      error: 'That code has been fully redeemed'
    });
  }
  if (row.expires_at && new Date(`${row.expires_at.replace(' ', 'T')}Z`) < new Date()) {
    return res.status(409).json({
      error: 'That code has expired'
    });
  }
  const discounted = Math.round(CLASS_PRICE_CENTS * (100 - row.percent_off) / 100);
  res.json({
    code: row.code,
    percentOff: row.percent_off,
    originalCents: CLASS_PRICE_CENTS,
    amountCents: discounted
  });
});

/* Record a tutor's cut when a checkout completes. Called by billing. */
export async function creditTutor(tutorId, classId, studentId) {
  const amount = Math.round(CLASS_PRICE_CENTS * EARNINGS_SHARE);
  await recordEarning(tutorId, classId, studentId, amount, 'enrollment');
  return amount;
}
export default router;
