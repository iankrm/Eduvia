import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
const router = Router();
const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
async function lessonOr404(req, res) {
  const lesson = await db.prepare(`SELECT l.*, c.slug AS class_slug, c.title AS class_title, c.tutor_id, c.status
         FROM lessons l JOIN classes c ON c.id = l.class_id
        WHERE l.id = ?`).get(Number(req.params.lessonId));
  if (!lesson) {
    res.status(404).json({
      error: 'Lesson not found'
    });
    return null;
  }
  return lesson;
}

/* Access gate: preview lessons are public, everything else needs enrolment. */
async function canView(user, lesson) {
  if (lesson.is_preview) return true;
  if (!user) return false;
  if (user.id === lesson.tutor_id) return true;
  return !!(await db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND class_id = ?').get(user.id, lesson.class_id));
}

/* GET /api/notes/:lessonId/transcript */
router.get('/:lessonId/transcript', requireAuth, async (req, res) => {
  const lesson = await lessonOr404(req, res);
  if (!lesson) return;
  if (!(await canView(req.user, lesson))) return res.status(403).json({
    error: 'Enrol to see this transcript'
  });
  const row = await db.prepare('SELECT body, updated_at FROM transcripts WHERE lesson_id = ?').get(lesson.id);
  res.json({
    transcript: row?.body || '',
    updatedAt: row?.updated_at || null
  });
});

/* PUT /api/notes/:lessonId/transcript — class tutor only. */
router.put('/:lessonId/transcript', requireAuth, requireRole('tutor'), async (req, res) => {
  const lesson = await lessonOr404(req, res);
  if (!lesson) return;
  if (lesson.tutor_id !== req.user.id) {
    return res.status(403).json({
      error: 'Only the class tutor can edit this transcript'
    });
  }
  const body = String(req.body?.body || '').slice(0, 20000);
  await db.prepare(`INSERT INTO transcripts (lesson_id, body, updated_at) VALUES (?, ?, ?)
       ON CONFLICT (lesson_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`).run(lesson.id, body, stamp());
  res.json({
    ok: true,
    length: body.length
  });
});

/* GET /api/notes/:lessonId — the student's private note for this lesson. */
router.get('/:lessonId', requireAuth, async (req, res) => {
  const lesson = await lessonOr404(req, res);
  if (!lesson) return;
  if (!(await canView(req.user, lesson))) return res.status(403).json({
    error: 'Enrol to see this lesson'
  });
  const row = await db.prepare('SELECT body, seconds, updated_at FROM lesson_notes WHERE user_id = ? AND lesson_id = ?').get(req.user.id, lesson.id);
  res.json({
    note: {
      body: row?.body || '',
      seconds: row?.seconds || 0,
      updatedAt: row?.updated_at || null
    }
  });
});

/* PUT /api/notes/:lessonId — save note text and the timestamp it refers to. */
router.put('/:lessonId', requireAuth, async (req, res) => {
  const lesson = await lessonOr404(req, res);
  if (!lesson) return;
  if (!(await canView(req.user, lesson))) return res.status(403).json({
    error: 'Enrol to annotate this lesson'
  });
  const body = String(req.body?.body || '').slice(0, 5000);
  const seconds = Math.max(0, Number(req.body?.seconds) || 0);
  await db.prepare(`INSERT INTO lesson_notes (user_id, lesson_id, body, seconds, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id, lesson_id) DO UPDATE
       SET body = excluded.body, seconds = excluded.seconds, updated_at = excluded.updated_at`).run(req.user.id, lesson.id, body, seconds, stamp());
  res.json({
    ok: true
  });
});

/* GET /api/notes — all of this student's notes, newest first. */
router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare(`SELECT n.*, l.title AS lesson_title, l.class_id, c.slug AS class_slug, c.title AS class_title
         FROM lesson_notes n
         JOIN lessons l ON l.id = n.lesson_id
         JOIN classes  c ON c.id = l.class_id
        WHERE n.user_id = ? AND n.body <> ''
        ORDER BY n.updated_at DESC LIMIT 100`).all(req.user.id);
  res.json({
    notes: rows.map(n => ({
      lessonId: n.lesson_id,
      lessonTitle: n.lesson_title,
      classId: n.class_id,
      classSlug: n.class_slug,
      classTitle: n.class_title,
      body: n.body,
      seconds: n.seconds,
      updatedAt: n.updated_at
    }))
  });
});

/* DELETE /api/notes/:lessonId */
router.delete('/:lessonId', requireAuth, async (req, res) => {
  const lesson = await lessonOr404(req, res);
  if (!lesson) return;
  await db.prepare('DELETE FROM lesson_notes WHERE user_id = ? AND lesson_id = ?').run(req.user.id, lesson.id);
  res.json({
    ok: true
  });
});
export default router;
