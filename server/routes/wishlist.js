import { Router } from 'express';
import { db, ratingFor } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();

/* GET /api/wishlist — saved classes, newest first. */
router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare(`SELECT c.*, u.name AS tutor_name, u.headline AS tutor_headline, w.created_at AS saved_at
         FROM wishlist w
         JOIN classes c ON c.id = w.class_id
         JOIN users  u ON u.id = c.tutor_id
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC`).all(req.user.id);
  const lessonCounts = db.prepare('SELECT COUNT(*) AS n FROM lessons WHERE class_id = ?');
  res.json({
    classes: await Promise.all(rows.map(async c => ({
      ...c,
      lessonCount: (await lessonCounts.get(c.id)).n,
      rating: await ratingFor(c.id),
      saved: true
    })))
  });
});

/* GET /api/wishlist/saved?slug= — is this class saved? Backs the heart button. */
router.get('/saved', requireAuth, async (req, res) => {
  const slug = String(req.query.slug || '');
  const row = await db.prepare(`SELECT w.class_id FROM wishlist w JOIN classes c ON c.id = w.class_id
        WHERE w.user_id = ? AND c.slug = ?`).get(req.user.id, slug);
  res.json({
    saved: !!row
  });
});

/* POST /api/wishlist/:classId — save (idempotent). */
router.post('/:classId', requireAuth, async (req, res) => {
  const classId = Number(req.params.classId);
  if (!(await db.prepare('SELECT id FROM classes WHERE id = ?').get(classId))) {
    return res.status(404).json({
      error: 'Class not found'
    });
  }
  await db.prepare('INSERT OR IGNORE INTO wishlist (user_id, class_id) VALUES (?, ?)').run(req.user.id, classId);
  res.status(201).json({
    saved: true
  });
});

/* DELETE /api/wishlist/:classId — unsave. */
router.delete('/:classId', requireAuth, async (req, res) => {
  const classId = Number(req.params.classId);
  await db.prepare('DELETE FROM wishlist WHERE user_id = ? AND class_id = ?').run(req.user.id, classId);
  res.json({
    saved: false
  });
});
export default router;
