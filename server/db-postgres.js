import pg from 'pg';
import { randomBytes } from 'node:crypto';

const { Pool } = pg;
pg.types.setTypeParser(20, Number);
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for Supabase Postgres');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false },
  max: Number(process.env.PG_POOL_SIZE) || 10,
});

function postgresSql(sql) {
  let query = sql.trim().replace(/;\s*$/, '');
  const ignoreDuplicate = /^INSERT\s+OR\s+IGNORE\s+INTO/i.test(query);
  query = query.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
  if (ignoreDuplicate) query += ' ON CONFLICT DO NOTHING';
  query = query.replace(/datetime\('now'\)/gi, "to_char(now() at time zone 'utc', 'YYYY-MM-DD HH24:MI:SS')");
  query = query.replace(/date\('now',\s*'start of month'\)/gi, "to_char(date_trunc('month', now()), 'YYYY-MM-DD')");
  query = query.replace(/MAX\(lesson_progress\.completed,\s*excluded\.completed\)/gi, 'GREATEST(lesson_progress.completed, excluded.completed)');
  let parameterIndex = 0;
  query = query.replace(/\?/g, () => `$${++parameterIndex}`);
  query = query.replace(/ESCAPE '\\'/g, "ESCAPE E'\\\\'");
  return query;
}

export const db = {
  prepare(sql) {
    return {
      async get(...values) {
        postgresSql.parameterIndex = 0;
        const result = await pool.query(postgresSql(sql), values);
        return result.rows[0];
      },
      async all(...values) {
        postgresSql.parameterIndex = 0;
        const result = await pool.query(postgresSql(sql), values);
        return result.rows;
      },
      async run(...values) {
        postgresSql.parameterIndex = 0;
        let query = postgresSql(sql);
        if (/^INSERT\s+INTO/i.test(query) && !/\bRETURNING\b/i.test(query)) query += ' RETURNING *';
        const result = await pool.query(query, values);
        const inserted = result.rows[0];
        return {
          changes: result.rowCount,
          lastInsertRowid: inserted?.id,
          row: inserted,
        };
      },
    };
  },
};

export function notify(userId, kind, title, body = '', link = '') {
  return db.prepare(
    'INSERT INTO notifications (user_id, kind, title, body, link) VALUES (?, ?, ?, ?, ?)',
  ).run(userId, kind, title, body, link);
}

export async function classProgress(userId, classId) {
  const total = (await db.prepare('SELECT COUNT(*) AS n FROM lessons WHERE class_id = ?').get(classId)).n;
  const completed = (await db.prepare(
    `SELECT COUNT(*) AS n FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id
      WHERE p.user_id = ? AND l.class_id = ? AND p.completed = 1`,
  ).get(userId, classId)).n;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed: Number(completed), total: Number(total), percent };
}

export async function issueCertificate(userId, classId) {
  const existing = await db.prepare('SELECT * FROM certificates WHERE user_id = ? AND class_id = ?').get(userId, classId);
  if (existing) return existing;
  const { completed, total } = await classProgress(userId, classId);
  if (total === 0 || completed < total) return null;
  const klass = await db.prepare('SELECT title FROM classes WHERE id = ?').get(classId);
  if (!klass) return null;
  const user = await db.prepare('SELECT name FROM users WHERE id = ?').get(userId);
  const code = `EDV-${randomBytes(8).toString('hex').toUpperCase()}`;
  await db.prepare('INSERT INTO certificates (user_id, class_id, code, recipient) VALUES (?, ?, ?, ?)').run(
    userId, classId, code, user?.name || 'Student',
  );
  await notify(userId, 'certificate', `Certificate earned: ${klass.title}`, 'Your verified certificate is ready to share.', '/certificates');
  return db.prepare('SELECT * FROM certificates WHERE user_id = ? AND class_id = ?').get(userId, classId);
}

export const EARNINGS_SHARE = 0.7;
export const CLASS_PRICE_CENTS = 4900;

export function recordEarning(tutorId, classId, studentId, amountCents, reason) {
  return db.prepare(
    'INSERT INTO earnings (tutor_id, class_id, student_id, amount_cents, reason) VALUES (?, ?, ?, ?, ?)',
  ).run(tutorId, classId, studentId, amountCents, reason);
}

export async function ratingFor(classId) {
  const row = await db.prepare(
    `SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS average FROM reviews
      WHERE class_id = ? AND status = 'published'`,
  ).get(classId);
  return { count: Number(row.count), average: Math.round(Number(row.average) * 10) / 10 };
}
