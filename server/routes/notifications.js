import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();

/* GET /api/notifications — newest first, with an unread count. */
router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 100').all(req.user.id);
  const unread = (await db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL').get(req.user.id)).n;
  res.json({
    unread,
    notifications: rows.map(n => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      link: n.link,
      read: !!n.read_at,
      createdAt: n.created_at
    }))
  });
});

/* POST /api/notifications/read — mark all read, or just one via ?id=. */
router.post('/read', requireAuth, async (req, res) => {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  if (req.body?.id !== undefined) {
    const changed = (await db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND id = ? AND read_at IS NULL').run(stamp, req.user.id, Number(req.body.id))).changes;
    if (!changed) return res.status(404).json({
      error: 'Notification not found'
    });
  } else {
    await db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(stamp, req.user.id);
  }
  res.json({
    ok: true
  });
});

/* DELETE /api/notifications/:id */
router.delete('/:id', requireAuth, async (req, res) => {
  const changed = (await db.prepare('DELETE FROM notifications WHERE user_id = ? AND id = ?').run(req.user.id, Number(req.params.id))).changes;
  if (!changed) return res.status(404).json({
    error: 'Notification not found'
  });
  res.json({
    ok: true
  });
});

/* DELETE /api/notifications — clear the whole feed. */
router.delete('/', requireAuth, async (req, res) => {
  await db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
  res.json({
    ok: true
  });
});
export default router;
