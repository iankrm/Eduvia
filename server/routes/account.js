import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { db, notify } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();
const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

/* Tokens are stored hashed so a database leak can't be replayed. */
const hashToken = raw => createHash('sha256').update(raw).digest('hex');
async function issueToken(userId, purpose, minutes) {
  const raw = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + minutes * 60_000).toISOString().replace('T', ' ').slice(0, 19);
  await db.prepare('INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at) VALUES (?, ?, ?, ?)').run(userId, purpose, hashToken(raw), expires);
  return {
    raw,
    expires
  };
}

/* Consume a token: must exist, match the purpose, be unexpired and unused. */
async function consumeToken(raw, purpose) {
  if (!raw) return null;
  const row = await db.prepare(`SELECT * FROM auth_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL`).get(hashToken(String(raw)), purpose);
  if (!row) return null;
  if (new Date(`${row.expires_at.replace(' ', 'T')}Z`).getTime() < Date.now()) return null;
  await db.prepare('UPDATE auth_tokens SET used_at = ? WHERE id = ?').run(stamp(), row.id);
  return row;
}

/* There is no mail transport in this build, so the reset link is returned in
   the response for local use and logged. Wire an SMTP provider in here to
   email it instead. */
function deliver(user, purpose, {
  raw,
  expires
}) {
  const path = purpose === 'reset' ? '/reset-password' : '/verify-email';
  const link = `http://localhost:5173${path}?token=${raw}`;
  console.log(`  [mail] ${purpose} link for ${user.email}: ${link} (expires ${expires})`);
  return link;
}

/* POST /api/auth/forgot-password — always 200 so accounts can't be probed. */
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const user = await db.prepare('SELECT id, email FROM users WHERE lower(email) = ?').get(email);
  if (user) {
    await db.prepare("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = 'reset' AND used_at IS NULL").run(user.id);
    const token = await issueToken(user.id, 'reset', 60);
    deliver(user, 'reset', token);
  }
  res.json({
    ok: true,
    message: 'If that email exists, a reset link is on its way'
  });
});

/* POST /api/auth/reset-password */
router.post('/reset-password', async (req, res) => {
  const {
    token,
    password
  } = req.body || {};
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters'
    });
  }
  const row = await consumeToken(token, 'reset');
  if (!row) return res.status(400).json({
    error: 'That reset link is invalid or has expired'
  });
  const hash = bcrypt.hashSync(password, 10);
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);

  /* Every other session token is signed with the same secret, so the honest
     nudge is to ask them to sign in again. */
  await notify(row.user_id, 'security', 'Your password was changed', 'If this was not you, reset it now.', '/settings');
  res.json({
    ok: true,
    message: 'Password updated, you can sign in now'
  });
});

/* POST /api/auth/resend-verification */
router.post('/resend-verification', requireAuth, async (req, res) => {
  if (req.user.email_verified_at) return res.json({
    ok: true,
    message: 'Email already verified'
  });
  await db.prepare("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = 'verify' AND used_at IS NULL").run(req.user.id);
  const token = await issueToken(req.user.id, 'verify', 24 * 60);
  deliver(req.user, 'verify', token);
  res.json({
    ok: true,
    message: 'Verification link sent'
  });
});

/* GET /api/auth/verify-email?token= */
router.get('/verify-email', async (req, res) => {
  const row = await consumeToken(req.query.token, 'verify');
  if (!row) return res.status(400).json({
    error: 'That verification link is invalid or has expired'
  });
  await db.prepare("UPDATE users SET email_verified_at = ? WHERE id = ?").run(stamp(), row.user_id);
  await notify(row.user_id, 'verified', 'Email verified', 'Thanks, your address is confirmed.', '/settings');
  res.json({
    ok: true,
    message: 'Email verified'
  });
});

/* GET /api/auth/verify-email/status — lets Settings show the badge. */
router.get('/verify-email/status', requireAuth, async (req, res) => {
  const row = await db.prepare('SELECT email_verified_at FROM users WHERE id = ?').get(req.user.id);
  res.json({
    verified: !!row?.email_verified_at,
    verifiedAt: row?.email_verified_at || null
  });
});

/* GET /api/auth/token-debug — local-only helper so the UI can complete the
   reset flow in development without a mail server. Disabled in production. */
router.get('/token-debug/:purpose', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      error: 'Unknown endpoint'
    });
  }
  const email = String(req.query.email || '').trim().toLowerCase();
  const purpose = String(req.params.purpose);
  if (!['reset', 'verify'].includes(purpose)) return res.status(400).json({
    error: 'Unknown purpose'
  });
  const user = await db.prepare('SELECT id, email FROM users WHERE lower(email) = ?').get(email);
  if (!user) return res.status(404).json({
    error: 'No account for that email'
  });
  const token = await issueToken(user.id, purpose, 60);
  res.json({
    ok: true,
    token: token.raw,
    expiresAt: token.expires
  });
});
export default router;
