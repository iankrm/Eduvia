/* One-time data copy for the existing local SQLite database. It aborts if the
   destination already contains application rows; it never truncates data. */
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running this migration');

const here = dirname(fileURLToPath(import.meta.url));
const source = new DatabaseSync(process.env.DB_PATH || join(here, '..', 'data', 'iankrm.db'), { readOnly: true });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const tables = [
  'users', 'tutor_profiles', 'subscriptions', 'promo_codes', 'classes', 'lessons', 'enrollments',
  'lesson_progress', 'settings', 'reviews', 'wishlist', 'notifications', 'certificates', 'questions',
  'auth_tokens', 'earnings', 'transcripts', 'lesson_notes', 'moderation_log',
];
const identityTables = [
  'users', 'subscriptions', 'classes', 'lessons', 'enrollments', 'lesson_progress', 'reviews',
  'notifications', 'certificates', 'questions', 'auth_tokens', 'earnings', 'promo_codes', 'moderation_log',
];

const client = await pool.connect();
try {
  for (const table of tables) {
    const { rows } = await client.query(`select count(*)::int as count from public."${table}"`);
    if (rows[0].count !== 0) {
      throw new Error(`Destination table ${table} is not empty; no data was copied. Review/merge it manually first.`);
    }
  }

  await client.query('begin');
  for (const table of tables) {
    const columns = source.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name);
    const rows = source.prepare(`SELECT * FROM ${table}`).all();
    if (!rows.length) continue;
    const names = columns.map((column) => `"${column}"`).join(', ');
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    const insert = `insert into public."${table}" (${names}) values (${placeholders})`;
    for (const row of rows) await client.query(insert, columns.map((column) => row[column]));
    console.log(`Copied ${rows.length} rows from ${table}`);
  }

  for (const table of identityTables) {
    await client.query(
      `select setval(pg_get_serial_sequence('public."${table}"', 'id'), coalesce((select max(id) from public."${table}"), 1), exists(select 1 from public."${table}"))`,
    );
  }
  await client.query('commit');
  console.log('SQLite data copy completed.');
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  client.release();
  await pool.end();
  source.close();
}
