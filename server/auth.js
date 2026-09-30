import jwt from 'jsonwebtoken';
import { db } from './db.js';
const SECRET = process.env.JWT_SECRET || 'iankrm-dev-secret-change-me';
const TTL = '7d';
export function signToken(user) {
  return jwt.sign({
    sub: user.id,
    role: user.role
  }, SECRET, {
    expiresIn: TTL
  });
}

/* Bearer token -> req.user. Never throws; leaves req.user null when absent. */
export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({
    error: 'Authentication required'
  });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = await db.prepare('SELECT id, email, name, role, is_admin, headline, bio, hue, email_verified_at FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({
      error: 'Account no longer exists'
    });
    req.user = user;
    next();
  } catch {
    res.status(401).json({
      error: 'Session expired, please sign in again'
    });
  }
}

/* Route guard: staff only. Admins keep a user role as well, so this is a
   separate check rather than another entry in the role allow-list. */
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({
    error: 'Authentication required'
  });
  if (!req.user.is_admin) return res.status(403).json({
    error: 'This action is for administrators'
  });
  next();
}

/* Route guard: requireAuth + a role allow-list. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({
      error: 'Authentication required'
    });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `This action is for ${roles.join(' or ')} accounts`
      });
    }
    next();
  };
}
