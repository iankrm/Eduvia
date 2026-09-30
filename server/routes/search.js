import { Router } from 'express';
import { db, ratingFor } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();
const CLASS_COLUMNS = `c.id, c.slug, c.title, c.subtitle, c.category, c.level, c.hue, c.status,
                       u.name AS tutor_name, u.headline AS tutor_headline`;

/* Search published classes and tutors. `type` narrows to one of them. */
router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const type = String(req.query.type || 'all');
  const category = String(req.query.category || 'all');
  if (!q) return res.json({
    query: '',
    classes: [],
    tutors: [],
    categories: []
  });

  /* Escape LIKE wildcards so a literal % doesn't match everything. */
  const needle = `%${q.toLowerCase().replace(/[%_\\]/g, c => `\\${c}`)}%`;
  const classRows = await db.prepare(`SELECT ${CLASS_COLUMNS},
              (SELECT COUNT(*) FROM lessons l WHERE l.class_id = c.id) AS lessonCount,
              (SELECT COALESCE(SUM(duration_seconds), 0) FROM lessons l WHERE l.class_id = c.id) AS runtimeSeconds,
              (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS studentCount
         FROM classes c JOIN users u ON u.id = c.tutor_id
        WHERE c.status = 'published'
          AND (LOWER(c.title) LIKE ? ESCAPE '\\'
               OR LOWER(c.subtitle) LIKE ? ESCAPE '\\'
               OR LOWER(c.description) LIKE ? ESCAPE '\\'
               OR LOWER(u.name) LIKE ? ESCAPE '\\')
        ORDER BY
          CASE WHEN LOWER(c.title) LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END,
          c.title
        LIMIT 40`).all(needle, needle, needle, needle, `${q.toLowerCase()}%`);
  const tutorRows = await db.prepare(`SELECT u.id, u.name, u.headline, u.bio, u.hue, tp.expertise,
              (SELECT COUNT(*) FROM classes c WHERE c.tutor_id = u.id AND c.status = 'published') AS classCount
         FROM users u LEFT JOIN tutor_profiles tp ON tp.user_id = u.id
        WHERE u.role = 'tutor'
          AND (LOWER(u.name) LIKE ? ESCAPE '\\' OR LOWER(u.headline) LIKE ? ESCAPE '\\'
               OR LOWER(tp.expertise) LIKE ? ESCAPE '\\')
        LIMIT 20`).all(needle, needle, needle);
  const categories = await db.prepare(`SELECT c.category AS name, COUNT(*) AS n FROM classes c
        WHERE c.status = 'published' GROUP BY c.category ORDER BY n DESC, name`).all();
  const classes = (await Promise.all(classRows.map(async c => ({
    ...c,
    rating: await ratingFor(c.id)
  })))).filter(c => category === 'all' || c.category === category);
  res.json({
    query: q,
    total: classes.length,
    categories,
    classes: type === 'tutors' ? [] : classes,
    tutors: type === 'classes' ? [] : tutorRows
  });
});

/* GET /api/search/suggest?q= — lightweight typeahead for the nav box. */
router.get('/suggest', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({
    suggestions: []
  });
  const needle = `%${q.toLowerCase().replace(/[%_\\]/g, c => `\\${c}`)}%`;
  const rows = await db.prepare(`SELECT slug, title FROM classes
        WHERE status = 'published' AND LOWER(title) LIKE ? ESCAPE '\\'
        ORDER BY CASE WHEN LOWER(title) LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END, title LIMIT 6`).all(needle, `${q.toLowerCase()}%`);
  res.json({
    suggestions: rows.map(r => ({
      label: r.title,
      href: `/class/${r.slug}`
    }))
  });
});

/* GET /api/search/tutors/:slug — public instructor profile. */
router.get('/tutors/:slug', async (req, res) => {
  const email = String(req.params.slug);
  const tutor = await db.prepare(`SELECT u.id, u.name, u.headline, u.bio, u.hue, tp.expertise, tp.credentials
         FROM users u LEFT JOIN tutor_profiles tp ON tp.user_id = u.id
        WHERE u.role = 'tutor' AND u.email = ?`).get(email);
  if (!tutor) return res.status(404).json({
    error: 'Instructor not found'
  });
  const classes = await db.prepare(`SELECT ${CLASS_COLUMNS} FROM classes c JOIN users u ON u.id = c.tutor_id
               WHERE c.tutor_id = ? AND c.status = 'published' ORDER BY c.title`).all(tutor.id);
  res.json({
    tutor,
    classes: await Promise.all(classes.map(async c => ({
      ...c,
      rating: await ratingFor(c.id),
      lessonCount: (await db.prepare('SELECT COUNT(*) AS n FROM lessons WHERE class_id = ?').get(c.id)).n
    })))
  });
});

/* GET /api/search/mine — the signed-in user's saved + enrolled quick links. */
router.get('/mine', requireAuth, async (req, res) => {
  const rows = await db.prepare(`SELECT c.slug, c.title, 'enrolled' AS via
         FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.user_id = ? AND c.status = 'published'
       UNION
       SELECT c.slug, c.title, 'wishlist' AS via
         FROM wishlist w JOIN classes c ON c.id = w.class_id
        WHERE w.user_id = ? AND c.status = 'published'
        ORDER BY via, title LIMIT 20`).all(req.user.id, req.user.id);
  res.json({
    items: rows.map(r => ({
      ...r,
      href: `/class/${r.slug}`
    }))
  });
});
export default router;
