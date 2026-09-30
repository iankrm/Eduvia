import { Router } from 'express';
import { db, ratingFor } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
const router = Router();

/* Shapes a class row plus its derived lesson count / duration / rating. */
async function decorate(c) {
  const agg = await db.prepare(`SELECT COUNT(*) AS lessons, COALESCE(SUM(duration_seconds), 0) AS runtime
       FROM lessons WHERE class_id = ?`).get(c.id);
  const enrolled = (await db.prepare('SELECT COUNT(*) AS n FROM enrollments WHERE class_id = ?').get(c.id)).n;
  return {
    ...c,
    lessonCount: agg.lessons,
    runtimeSeconds: agg.runtime,
    studentCount: enrolled,
    rating: await ratingFor(c.id)
  };
}
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}
async function uniqueSlug(title) {
  const base = slugify(title) || 'class';
  let slug = base;
  let n = 2;
  while (await db.prepare('SELECT id FROM classes WHERE slug = ?').get(slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/* GET /api/classes?category=&q= — published catalogue. */
router.get('/', async (req, res) => {
  const {
    category,
    q
  } = req.query;
  const rows = await db.prepare(`SELECT c.*, u.name AS tutor_name, u.headline AS tutor_headline
       FROM classes c JOIN users u ON u.id = c.tutor_id
       WHERE c.status = 'published'`).all();
  let out = await Promise.all(rows.map(decorate));
  if (category && category !== 'all') out = out.filter(c => c.category === category);
  if (q) {
    const needle = String(q).toLowerCase();
    out = out.filter(c => c.title.toLowerCase().includes(needle) || (c.subtitle || '').toLowerCase().includes(needle) || c.tutor_name.toLowerCase().includes(needle));
  }
  res.json({
    classes: out
  });
});

/* GET /api/classes/mine — the signed-in tutor's classes, drafts included.
   Declared before /:slug so "mine" is not read as a slug. */
router.get('/mine', requireAuth, requireRole('tutor'), async (req, res) => {
  const rows = await db.prepare('SELECT * FROM classes WHERE tutor_id = ? ORDER BY updated_at DESC, id DESC').all(req.user.id);
  const classes = await Promise.all(rows.map(async c => {
    const students = await db.prepare(`SELECT u.id, u.name, u.headline, u.hue, COUNT(l.id) AS completed
         FROM enrollments e
         JOIN users u ON u.id = e.user_id
         LEFT JOIN lesson_progress p ON p.user_id = u.id
         LEFT JOIN lessons l ON l.id = p.lesson_id AND l.class_id = e.class_id AND p.completed = 1
         WHERE e.class_id = ?
         GROUP BY u.id
         ORDER BY u.name`).all(c.id);
    return {
      ...(await decorate(c)),
      students
    };
  }));
  res.json({
    classes
  });
});

/* GET /api/classes/:slug */
router.get('/:slug', async (req, res) => {
  const c = await db.prepare(`SELECT c.*, u.name AS tutor_name, u.headline AS tutor_headline, u.bio AS tutor_bio, u.hue AS tutor_hue
       FROM classes c JOIN users u ON u.id = c.tutor_id
       WHERE c.slug = ?`).get(req.params.slug);
  if (!c) return res.status(404).json({
    error: 'Class not found'
  });
  const lessons = await db.prepare('SELECT id, position, title, duration_seconds, video_url, is_preview FROM lessons WHERE class_id = ? ORDER BY position').all(c.id);
  res.json({
    class: await decorate(c),
    lessons
  });
});

/* POST /api/classes — tutors only. */
router.post('/', requireAuth, requireRole('tutor'), async (req, res) => {
  const {
    title,
    subtitle,
    description,
    category,
    level
  } = req.body || {};
  if (!String(title || '').trim()) return res.status(400).json({
    error: 'Give the class a title'
  });
  const slug = await uniqueSlug(title);
  const hue = 348;
  const r = await db.prepare(`INSERT INTO classes (tutor_id, slug, title, subtitle, description, category, level, hue, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`).run(req.user.id, slug, String(title).trim(), String(subtitle || '').trim(), String(description || '').trim(), String(category || 'other'), String(level || 'beginner'), hue);
  const c = await db.prepare('SELECT * FROM classes WHERE id = ?').get(Number(r.lastInsertRowid));
  res.status(201).json({
    class: await decorate(c)
  });
});

/* PATCH /api/classes/:id — owner only. */
router.patch('/:id', requireAuth, requireRole('tutor'), async (req, res) => {
  const c = await db.prepare('SELECT * FROM classes WHERE id = ?').get(Number(req.params.id));
  if (!c) return res.status(404).json({
    error: 'Class not found'
  });
  if (c.tutor_id !== req.user.id) return res.status(403).json({
    error: 'That class belongs to another tutor'
  });
  const map = {
    title: 'title',
    subtitle: 'subtitle',
    description: 'description',
    category: 'category',
    level: 'level',
    status: 'status'
  };
  const fields = [];
  const values = [];
  for (const [key, col] of Object.entries(map)) {
    if (typeof req.body?.[key] === 'string') {
      fields.push(`${col} = ?`);
      values.push(req.body[key].trim());
    }
  }
  if (fields.length) {
    fields.push(`updated_at = datetime('now')`);
    await db.prepare(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`).run(...values, c.id);
  }
  const next = await db.prepare('SELECT * FROM classes WHERE id = ?').get(c.id);
  res.json({
    class: await decorate(next)
  });
});

/* POST /api/classes/:id/lessons — owner only. */
router.post('/:id/lessons', requireAuth, requireRole('tutor'), async (req, res) => {
  const c = await db.prepare('SELECT * FROM classes WHERE id = ?').get(Number(req.params.id));
  if (!c) return res.status(404).json({
    error: 'Class not found'
  });
  if (c.tutor_id !== req.user.id) return res.status(403).json({
    error: 'That class belongs to another tutor'
  });
  const {
    title,
    duration_seconds,
    video_url
  } = req.body || {};
  if (!String(title || '').trim()) return res.status(400).json({
    error: 'Give the lesson a title'
  });
  const nextPos = ((await db.prepare('SELECT MAX(position) AS m FROM lessons WHERE class_id = ?').get(c.id)).m ?? -1) + 1;
  const r = await db.prepare('INSERT INTO lessons (class_id, position, title, duration_seconds, video_url) VALUES (?, ?, ?, ?, ?)').run(c.id, nextPos, String(title).trim(), Math.max(30, Number(duration_seconds) || 600), String(video_url || '').trim());
  res.status(201).json({
    lesson: await db.prepare('SELECT * FROM lessons WHERE id = ?').get(Number(r.lastInsertRowid))
  });
});
export default router;
