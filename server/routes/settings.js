import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();
const BOOL_KEYS = ['autoplay', 'captions', 'email_classes', 'email_essays', 'marketing'];
const nowStamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

/* GET /api/settings */
router.get('/', requireAuth, async (req, res) => {
  const row = await db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id);
  if (!row) {
    await db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(req.user.id);
    return res.json({
      settings: await db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id)
    });
  }
  res.json({
    settings: row
  });
});

/* PATCH /api/settings — partial update, only known keys. */
router.patch('/', requireAuth, async (req, res) => {
  const cols = [];
  const values = [];
  for (const key of BOOL_KEYS) {
    if (typeof req.body?.[key] === 'boolean') {
      cols.push(key);
      values.push(req.body[key] ? 1 : 0);
    }
  }
  if (typeof req.body?.playback_speed === 'number') {
    cols.push('playback_speed');
    values.push(Math.min(2, Math.max(0.5, req.body.playback_speed)));
  }
  if (typeof req.body?.theme === 'string' && ['dark', 'light'].includes(req.body.theme)) {
    cols.push('theme');
    values.push(req.body.theme);
  }
  if (cols.length) {
    cols.push('updated_at');
    values.push(nowStamp());
    const {
      changes
    } = await db.prepare(`UPDATE settings SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE user_id = ?`).run(...values, req.user.id);

    // Signup always creates this row, so a miss means a legacy/partial user.
    if (changes === 0) {
      await db.prepare(`INSERT INTO settings (user_id, autoplay, captions, email_classes, email_essays, marketing, theme, playback_speed)
         VALUES (?, ?, ?, ?, ?, ?, 'dark', 1)
         ON CONFLICT (user_id) DO NOTHING`).run(req.user.id);
    }
  }
  res.json({
    settings: await db.prepare('SELECT * FROM settings WHERE user_id = ?').get(req.user.id)
  });
});

/* POST /api/settings/password */
router.post('/password', requireAuth, async (req, res) => {
  const {
    current_password,
    new_password
  } = req.body || {};
  if (String(new_password || '').length < 8) {
    return res.status(400).json({
      error: 'New password must be at least 8 characters'
    });
  }
  const row = await db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  const ok = await bcrypt.compare(String(current_password || ''), row.password_hash);
  if (!ok) return res.status(401).json({
    error: 'Current password is incorrect'
  });
  const hash = await bcrypt.hash(String(new_password), 10);
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
  res.json({
    ok: true
  });
});

/* DELETE /api/settings/account — cascades to enrollments, progress, classes. */
router.delete('/account', requireAuth, async (req, res) => {
  await db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.json({
    ok: true
  });
});
export default router;
