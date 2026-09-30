import { Router } from 'express';
import { db, notify, issueCertificate, EARNINGS_SHARE, CLASS_PRICE_CENTS } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();

/* Progress rollup for one class: completed lessons and percent watched. */
async function progressFor(userId, classId) {
  const rows = await db.prepare(`SELECT l.id, l.duration_seconds,
              COALESCE(p.completed, 0)        AS completed,
              COALESCE(p.position_seconds, 0) AS position_seconds
       FROM lessons l
       LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ?
       WHERE l.class_id = ?
       ORDER BY l.position`).all(userId, classId);
  const total = rows.length;
  const done = rows.filter(r => r.completed).length;

  // Partial credit: a lesson counts as half done once past 90s of runtime.
  const weighted = rows.reduce((sum, r) => {
    if (r.completed) return sum + 1;
    const frac = r.duration_seconds ? Math.min(1, r.position_seconds / r.duration_seconds) : 0;
    return sum + (frac >= 0.05 ? 0.5 : 0);
  }, 0);
  return {
    lessonCount: total,
    completedCount: done,
    percent: total ? Math.round(weighted / total * 100) : 0
  };
}

/* Per-lesson state for the player sidebar. */
async function lessonStates(userId, classId) {
  return (await db.prepare(`SELECT l.id, l.position, l.title, l.duration_seconds,
              COALESCE(p.completed, 0)        AS completed,
              COALESCE(p.position_seconds, 0) AS position_seconds
       FROM lessons l
       LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ?
       WHERE l.class_id = ?
       ORDER BY l.position`).all(userId, classId)).map(r => ({
    id: r.id,
    position: r.position,
    title: r.title,
    duration_seconds: r.duration_seconds,
    completed: !!r.completed,
    position_seconds: r.position_seconds
  }));
}

/* GET /api/enrollments — everything the signed-in student is taking. */
router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare(`SELECT c.*, u.name AS tutor_name, e.created_at AS enrolled_at
       FROM enrollments e
       JOIN classes c ON c.id = e.class_id
       JOIN users  u ON u.id = c.tutor_id
       WHERE e.user_id = ?
       ORDER BY e.created_at DESC`).all(req.user.id);
  res.json({
    enrollments: await Promise.all(rows.map(async c => ({
      ...c,
      progress: await progressFor(req.user.id, c.id)
    })))
  });
});

/* POST /api/enrollments/:classId */
router.post('/:classId', requireAuth, async (req, res) => {
  const row = await db.prepare('SELECT id, tutor_id, title, slug FROM classes WHERE id = ? AND status = ?').get(Number(req.params.classId), 'published');
  if (!row) return res.status(404).json({
    error: 'Class not found'
  });
  const exists = await db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND class_id = ?').get(req.user.id, row.id);
  if (exists) return res.status(409).json({
    error: 'You are already enrolled in this class'
  });
  await db.prepare('INSERT INTO enrollments (user_id, class_id) VALUES (?, ?)').run(req.user.id, row.id);

  /* A new enrolment is a sale: credit the tutor and let them know. */
  if (row.tutor_id !== req.user.id) {
    await db.prepare('INSERT INTO earnings (tutor_id, class_id, student_id, amount_cents, reason) VALUES (?, ?, ?, ?, ?)').run(row.tutor_id, row.id, req.user.id, Math.round(CLASS_PRICE_CENTS * EARNINGS_SHARE), 'enrollment');
    await notify(row.tutor_id, 'enrollment', `${req.user.name} enrolled in ${row.title}`, 'That is a new student in your class.', `/teach/${row.slug}`);
  }
  res.status(201).json({
    enrolled: true,
    progress: await progressFor(req.user.id, row.id)
  });
});

/* DELETE /api/enrollments/:classId — leave a class. */
router.delete('/:classId', requireAuth, async (req, res) => {
  const classId = Number(req.params.classId);
  await db.prepare('DELETE FROM enrollments WHERE user_id = ? AND class_id = ?').run(req.user.id, classId);
  res.json({
    enrolled: false
  });
});

/* GET /api/enrollments/:classId/progress — includes per-lesson state. */
router.get('/:classId/progress', requireAuth, async (req, res) => {
  const classId = Number(req.params.classId);
  const enrolled = await db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND class_id = ?').get(req.user.id, classId);
  if (!enrolled) return res.status(403).json({
    error: 'Enroll in this class to track progress'
  });
  res.json({
    progress: await progressFor(req.user.id, classId),
    lessons: await lessonStates(req.user.id, classId)
  });
});

/* PATCH /api/enrollments/:classId/lessons/:lessonId — the video player calls this. */
router.patch('/:classId/lessons/:lessonId', requireAuth, async (req, res) => {
  const classId = Number(req.params.classId);
  const lessonId = Number(req.params.lessonId);
  const enrolled = await db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND class_id = ?').get(req.user.id, classId);
  if (!enrolled) return res.status(403).json({
    error: 'Enroll in this class to track progress'
  });
  const lesson = await db.prepare('SELECT id, duration_seconds FROM lessons WHERE id = ? AND class_id = ?').get(lessonId, classId);
  if (!lesson) return res.status(404).json({
    error: 'Lesson not found in this class'
  });
  const position = Math.max(0, Math.min(Number(req.body?.position_seconds) || 0, lesson.duration_seconds));
  const completed = req.body?.completed ? 1 : 0;
  await db.prepare(`INSERT INTO lesson_progress (user_id, lesson_id, completed, position_seconds, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET
       completed        = MAX(lesson_progress.completed, excluded.completed),
       position_seconds = excluded.position_seconds,
       updated_at       = datetime('now')`).run(req.user.id, lessonId, completed, position);

  /* Finishing the last lesson earns a certificate and tells the tutor.
     issueCertificate is idempotent, so compare against the existing row to
     only notify on the transition into "complete". */
  let certificate = null;
  if (completed) {
    const alreadyIssued = await db.prepare('SELECT code FROM certificates WHERE user_id = ? AND class_id = ?').get(req.user.id, classId);
    const cert = await issueCertificate(req.user.id, classId);
    if (cert && !alreadyIssued) {
      const klass = await db.prepare('SELECT id, tutor_id, title, slug FROM classes WHERE id = ?').get(classId);
      if (klass && klass.tutor_id !== req.user.id) {
        await notify(klass.tutor_id, 'completion', `${req.user.name} finished ${klass.title}`, 'Your student completed every lesson.', `/teach/${klass.slug}`);
      }
      certificate = {
        code: cert.code,
        classTitle: klass?.title || ''
      };
    }
  }
  res.json({
    ok: true,
    progress: await progressFor(req.user.id, classId),
    certificate
  });
});
export default router;
export { progressFor };
