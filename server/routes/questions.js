import { Router } from 'express';
import { db, notify } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();
const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
function shape(q) {
  return {
    id: q.id,
    classId: q.class_id,
    classSlug: q.class_slug,
    classTitle: q.class_title,
    parentId: q.parent_id,
    body: q.body,
    answer: q.answer,
    answeredAt: q.answered_at,
    createdAt: q.created_at,
    author: q.author_name,
    authorHue: q.author_hue
  };
}
const SELECT_Q = `
  SELECT q.*, c.slug AS class_slug, c.title AS class_title,
         u.name AS author_name, u.hue AS author_hue
    FROM questions q
    JOIN classes c ON c.id = q.class_id
    JOIN users  u ON u.id = q.user_id
`;
async function classFor(slug) {
  return await db.prepare('SELECT * FROM classes WHERE slug = ?').get(String(slug || ''));
}

/* GET /api/questions?class=slug — top-level questions with their answers. */
router.get('/', async (req, res) => {
  const klass = await classFor(req.query.class);
  if (!klass) return res.status(404).json({
    error: 'Class not found'
  });
  const top = await db.prepare(`${SELECT_Q} WHERE q.class_id = ? AND q.parent_id IS NULL ORDER BY q.created_at DESC`).all(klass.id);
  const replies = await db.prepare(`${SELECT_Q} WHERE q.class_id = ? AND q.parent_id IS NOT NULL ORDER BY q.created_at ASC`).all(klass.id);
  res.json({
    questions: top.map(q => ({
      ...shape(q),
      replies: replies.filter(r => r.parent_id === q.id).map(shape)
    }))
  });
});

/* POST /api/questions — ask on a class, or reply to an existing question. */
router.post('/', requireAuth, async (req, res) => {
  const {
    classId,
    body,
    parentId
  } = req.body || {};
  const text = String(body || '').trim().slice(0, 1000);
  if (!text) return res.status(400).json({
    error: 'Write your question first'
  });
  const klass = await db.prepare('SELECT * FROM classes WHERE id = ?').get(Number(classId));
  if (!klass) return res.status(404).json({
    error: 'Class not found'
  });
  if (parentId !== undefined && parentId !== null) {
    const parent = await db.prepare('SELECT * FROM questions WHERE id = ? AND class_id = ?').get(Number(parentId), klass.id);
    if (!parent) return res.status(404).json({
      error: 'Question not found'
    });
    const inserted = await db.prepare('INSERT INTO questions (class_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)').run(klass.id, req.user.id, parent.id, text);
    const created = await db.prepare(`${SELECT_Q} WHERE q.id = ?`).get(inserted.lastInsertRowid);
    if (parent.user_id !== req.user.id) {
      await notify(parent.user_id, 'reply', `${req.user.name} replied to your question`, text.slice(0, 140), `/class/${klass.slug}#questions`);
    }
    return res.status(201).json({
      question: shape(created)
    });
  }
  const enrolled = await db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND class_id = ?').get(req.user.id, klass.id);
  if (!enrolled) return res.status(403).json({
    error: 'Enrol in the class before asking a question'
  });
  const inserted = await db.prepare('INSERT INTO questions (class_id, user_id, body) VALUES (?, ?, ?)').run(klass.id, req.user.id, text);
  const created = await db.prepare(`${SELECT_Q} WHERE q.id = ?`).get(inserted.lastInsertRowid);
  if (klass.tutor_id !== req.user.id) {
    await notify(klass.tutor_id, 'question', `New question on ${klass.title}`, text.slice(0, 140), `/teach/${klass.slug}`);
  }
  res.status(201).json({
    question: shape(created)
  });
});

/* PATCH /api/questions/:id — the class tutor answers. */
router.patch('/:id', requireAuth, async (req, res) => {
  const q = await db.prepare('SELECT * FROM questions WHERE id = ?').get(Number(req.params.id));
  if (!q) return res.status(404).json({
    error: 'Question not found'
  });
  const klass = await db.prepare('SELECT tutor_id FROM classes WHERE id = ?').get(q.class_id);
  if (!klass || klass.tutor_id !== req.user.id) {
    return res.status(403).json({
      error: 'Only the class tutor can answer'
    });
  }
  const answer = String(req.body?.answer || '').trim().slice(0, 2000);
  if (!answer) return res.status(400).json({
    error: 'Write an answer first'
  });
  await db.prepare('UPDATE questions SET answer = ?, answered_at = ? WHERE id = ?').run(answer, stamp(), q.id);
  const updated = await db.prepare(`${SELECT_Q} WHERE q.id = ?`).get(q.id);
  await notify(q.user_id, 'answer', `${req.user.name} answered your question`, answer.slice(0, 140), '/dashboard');
  res.json({
    question: shape(updated)
  });
});

/* DELETE /api/questions/:id — author, tutor, or admin. */
router.delete('/:id', requireAuth, async (req, res) => {
  const q = await db.prepare('SELECT * FROM questions WHERE id = ?').get(Number(req.params.id));
  if (!q) return res.status(404).json({
    error: 'Question not found'
  });
  const klass = await db.prepare('SELECT tutor_id FROM classes WHERE id = ?').get(q.class_id);
  const allowed = q.user_id === req.user.id || klass?.tutor_id === req.user.id || req.user.is_admin;
  if (!allowed) return res.status(403).json({
    error: 'Not allowed to delete this question'
  });
  await db.prepare('DELETE FROM questions WHERE id = ?').run(q.id);
  res.json({
    ok: true
  });
});
export default router;
