import { Router } from 'express';
import { db, notify, ratingFor } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();
const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
function shape(r) {
  return {
    id: r.id,
    userId: r.user_id,
    classId: r.class_id,
    classSlug: r.class_slug,
    classTitle: r.class_title,
    rating: r.rating,
    body: r.body,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    author: r.author_name,
    authorHue: r.author_hue
  };
}
const SELECT_REVIEW = `
  SELECT r.*, c.slug AS class_slug, c.title AS class_title, u.name AS author_name, u.hue AS author_hue
    FROM reviews r
    JOIN classes c ON c.id = r.class_id
    JOIN users  u ON u.id = r.user_id
`;

/* GET /api/reviews/mine — the signed-in student's own reviews, newest first. */
router.get('/mine', requireAuth, async (req, res) => {
  const rows = await db.prepare(`${SELECT_REVIEW} WHERE r.user_id = ? ORDER BY r.updated_at DESC`).all(req.user.id);
  res.json({
    reviews: rows.map(shape)
  });
});

/* GET /api/reviews?class=slug — published reviews, newest first. */
router.get('/', async (req, res) => {
  const {
    class: slug
  } = req.query;
  const klass = await db.prepare('SELECT id FROM classes WHERE slug = ?').get(String(slug || ''));
  if (!klass) return res.status(404).json({
    error: 'Class not found'
  });
  const rows = await db.prepare(`${SELECT_REVIEW} WHERE r.class_id = ? AND r.status = 'published' ORDER BY r.created_at DESC`).all(klass.id);
  res.json({
    reviews: rows.map(shape),
    rating: await ratingFor(klass.id)
  });
});

/* POST /api/reviews — one review per student per class, upsert on re-post. */
router.post('/', requireAuth, async (req, res) => {
  const {
    classId,
    rating,
    body = ''
  } = req.body || {};
  const klass = Number(classId);
  if (!(await db.prepare('SELECT id FROM classes WHERE id = ?').get(klass))) {
    return res.status(404).json({
      error: 'Class not found'
    });
  }
  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({
      error: 'Rating must be a whole number from 1 to 5'
    });
  }
  if (!String(body).trim()) return res.status(400).json({
    error: 'Add a few words about the class'
  });
  const enrolled = await db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND class_id = ?').get(req.user.id, klass);
  if (!enrolled) return res.status(403).json({
    error: 'Enrol in the class before reviewing it'
  });
  const text = String(body).trim().slice(0, 2000);
  await db.prepare(`INSERT INTO reviews (class_id, user_id, rating, body)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (class_id, user_id) DO UPDATE
       SET rating = excluded.rating, body = excluded.body,
           status = 'published', updated_at = ?`).run(klass, req.user.id, stars, text, stamp());
  const row = await db.prepare(`${SELECT_REVIEW} WHERE r.class_id = ? AND r.user_id = ?`).get(klass, req.user.id);
  const owner = await db.prepare('SELECT tutor_id, title FROM classes WHERE id = ?').get(klass);
  if (owner && owner.tutor_id !== req.user.id) {
    await notify(owner.tutor_id, 'review', `${req.user.name} reviewed ${owner.title}`, text.slice(0, 140), `/teach/${klass}`);
  }
  res.status(201).json({
    review: shape(row),
    rating: await ratingFor(klass)
  });
});

/* PATCH /api/reviews/:id — author edits their own; admin may hide any. */
router.patch('/:id', requireAuth, async (req, res) => {
  const row = await db.prepare('SELECT * FROM reviews WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({
    error: 'Review not found'
  });
  const owns = row.user_id === req.user.id;
  if (!owns && !req.user.is_admin) return res.status(403).json({
    error: 'Not your review'
  });
  if (req.body?.status !== undefined) {
    if (!req.user.is_admin) return res.status(403).json({
      error: 'Only admins change review status'
    });
    const status = String(req.body.status);
    if (!['published', 'hidden'].includes(status)) {
      return res.status(400).json({
        error: 'Status must be published or hidden'
      });
    }
    await db.prepare('UPDATE reviews SET status = ?, updated_at = ? WHERE id = ?').run(status, stamp(), row.id);
  }
  if (req.body?.rating !== undefined || req.body?.body !== undefined) {
    if (!owns) return res.status(403).json({
      error: 'Only the author can edit the text'
    });
    const stars = req.body.rating === undefined ? row.rating : Number(req.body.rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({
        error: 'Rating must be a whole number from 1 to 5'
      });
    }
    const text = req.body.body === undefined ? row.body : String(req.body.body).trim().slice(0, 2000);
    if (!text) return res.status(400).json({
      error: 'Add a few words about the class'
    });
    await db.prepare("UPDATE reviews SET rating = ?, body = ?, status = 'published', updated_at = ? WHERE id = ?").run(stars, text, stamp(), row.id);
  }
  const updated = await db.prepare(`${SELECT_REVIEW} WHERE r.id = ?`).get(row.id);
  res.json({
    review: shape(updated),
    rating: await ratingFor(row.class_id)
  });
});

/* DELETE /api/reviews/:id */
router.delete('/:id', requireAuth, async (req, res) => {
  const row = await db.prepare('SELECT * FROM reviews WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({
    error: 'Review not found'
  });
  if (row.user_id !== req.user.id && !req.user.is_admin) {
    return res.status(403).json({
      error: 'Not your review'
    });
  }
  await db.prepare('DELETE FROM reviews WHERE id = ?').run(row.id);
  res.json({
    ok: true,
    rating: await ratingFor(row.class_id)
  });
});
export default router;
