import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const tables = [
  'users', 'tutor_profiles', 'subscriptions', 'classes', 'lessons', 'enrollments', 'lesson_progress',
  'settings', 'reviews', 'wishlist', 'notifications', 'certificates', 'questions', 'auth_tokens',
  'earnings', 'promo_codes', 'transcripts', 'lesson_notes', 'moderation_log',
];

try {
  const connection = await pool.query('select current_database() as database, current_user as role');
  const present = [];
  for (const table of tables) {
    const exists = await pool.query('select to_regclass($1) as table_name', [`public.${table}`]);
    if (!exists.rows[0].table_name) continue;
    const count = await pool.query(`select count(*)::int as count from public."${table}"`);
    present.push({ table, count: count.rows[0].count });
  }
  console.log(`Connected to database "${connection.rows[0].database}" as ${connection.rows[0].role}.`);
  if (!present.length) console.log('No EduVia application tables exist yet.');
  else console.log(`Found ${present.length} application tables; ${present.reduce((n, t) => n + t.count, 0)} total rows.`);
  for (const { table, count } of present) console.log(`${table}: ${count}`);
} finally {
  await pool.end();
}
