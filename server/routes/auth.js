import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAuth } from '../auth.js';
const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['student', 'tutor'];
const HUES = [348, 268, 24, 200, 32, 288, 158, 210];
async function publicUser(id) {
  const u = await db.prepare('SELECT id, email, name, role, headline, bio, hue, created_at, is_admin, email_verified_at FROM users WHERE id = ?').get(id);
  if (!u) return null;
  const settings = (await db.prepare('SELECT * FROM settings WHERE user_id = ?').get(id)) || {};
  const subscription = (await db.prepare('SELECT plan, status, current_period_end FROM subscriptions WHERE user_id = ?').get(id)) || null;
  let tutorProfile = null;
  if (u.role === 'tutor') {
    tutorProfile = (await db.prepare('SELECT expertise, credentials FROM tutor_profiles WHERE user_id = ?').get(id)) || {
      expertise: '',
      credentials: ''
    };
  }
  return {
    ...u,
    tutorProfile,
    settings,
    subscription
  };
}

/* POST /api/auth/signup — role decides which profile fields are collected. */
router.post('/signup', async (req, res) => {
  const {
    email,
    password,
    name,
    role,
    headline,
    expertise,
    credentials
  } = req.body || {};
  if (!EMAIL_RE.test(String(email || ''))) {
    return res.status(400).json({
      error: 'Enter a valid email address'
    });
  }
  if (String(password || '').length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters'
    });
  }
  if (!String(name || '').trim()) {
    return res.status(400).json({
      error: 'Tell us your name'
    });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({
      error: 'Choose whether you are joining as a student or a tutor'
    });
  }
  const normalized = String(email).trim().toLowerCase();
  const taken = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalized);
  if (taken) return res.status(409).json({
    error: 'That email is already registered'
  });
  const hash = await bcrypt.hash(String(password), 10);
  const hue = HUES[Math.floor(Math.random() * HUES.length)];
  const insert = db.prepare(`INSERT INTO users (email, password_hash, name, role, headline, hue)
     VALUES (?, ?, ?, ?, ?, ?)`);
  let userId;
  try {
    const r = await insert.run(normalized, hash, String(name).trim(), role, String(headline || '').trim(), hue);
    userId = Number(r.lastInsertRowid);
  } catch (err) {
    // Unique constraint is the real guard against a concurrent duplicate.
    if (err.code === '23505' || /unique/i.test(String(err.message))) {
      return res.status(409).json({
        error: 'That email is already registered'
      });
    }
    throw err;
  }
  await db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(userId);
  if (role === 'tutor') {
    await db.prepare('INSERT INTO tutor_profiles (user_id, expertise, credentials) VALUES (?, ?, ?)').run(userId, String(expertise || '').trim(), String(credentials || '').trim());
  }
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.status(201).json({
    token: signToken(user),
    user: await publicUser(userId)
  });
});

/* POST /api/auth/login */
router.post('/login', async (req, res) => {
  const {
    email,
    password
  } = req.body || {};
  const row = await db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').trim().toLowerCase());
  // Same message either way so the endpoint does not confirm which emails exist.
  const fail = () => res.status(401).json({
    error: 'Email or password is incorrect'
  });
  if (!row) return fail();
  const ok = await bcrypt.compare(String(password || ''), row.password_hash);
  if (!ok) return fail();
  res.json({
    token: signToken(row),
    user: await publicUser(row.id)
  });
});

/* GET /api/auth/me */
router.get('/me', requireAuth, async (req, res) => {
  res.json({
    user: await publicUser(req.user.id)
  });
});

/* PATCH /api/auth/me — profile edits. */
router.patch('/me', requireAuth, async (req, res) => {
  const {
    name,
    headline,
    bio
  } = req.body || {};
  const fields = [];
  const values = [];
  if (typeof name === 'string' && name.trim()) {
    fields.push('name = ?');
    values.push(name.trim());
  }
  if (typeof headline === 'string') {
    fields.push('headline = ?');
    values.push(headline.trim());
  }
  if (typeof bio === 'string') {
    fields.push('bio = ?');
    values.push(bio.trim());
  }
  if (req.user.role === 'tutor' && (req.body.expertise || req.body.credentials)) {
    await db.prepare(`INSERT INTO tutor_profiles (user_id, expertise, credentials) VALUES (?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET
         expertise   = COALESCE(NULLIF(?, ''), expertise),
         credentials = COALESCE(NULLIF(?, ''), credentials)`).run(req.user.id, String(req.body.expertise || '').trim(), String(req.body.credentials || '').trim(), String(req.body.expertise || '').trim(), String(req.body.credentials || '').trim());
  }
  if (fields.length) {
    await db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values, req.user.id);
  }
  res.json({
    user: await publicUser(req.user.id)
  });
});

/* POST /api/auth/logout — tokens are stateless, so this is advisory.
   The client drops the token; revisit if you add a server-side denylist. */
router.post('/logout', (_req, res) => res.json({
  ok: true
}));
export default router;
export { publicUser };
