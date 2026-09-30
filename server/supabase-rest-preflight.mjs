import { execFileSync } from 'node:child_process';

const api = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!api || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');

const tables = [
  'users', 'tutor_profiles', 'subscriptions', 'classes', 'lessons', 'enrollments', 'lesson_progress',
  'settings', 'reviews', 'wishlist', 'notifications', 'certificates', 'questions', 'auth_tokens',
  'earnings', 'promo_codes', 'transcripts', 'lesson_notes', 'moderation_log',
];
const selectedTables = process.argv[2] ? tables.filter((table) => table === process.argv[2]) : tables;
if (process.argv[2] && !selectedTables.length) throw new Error(`Unknown table: ${process.argv[2]}`);

for (const table of selectedTables) {
  const url = `${api}/rest/v1/${table}?select=*&limit=1`;
  const config = [
    `url = ${JSON.stringify(url)}`,
    `header = ${JSON.stringify(`apikey: ${key}`)}`,
    `header = ${JSON.stringify(`authorization: Bearer ${key}`)}`,
    'header = "prefer: count=exact"',
    'header = "range: 0-0"',
    'write-out = "\\n__HTTP__%{http_code}"',
  ].join('\n');
  const output = execFileSync('curl', ['-sS', '-D', '-', '-o', '/dev/null', '--config', '-'], { input: config }).toString();
  const status = output.match(/__HTTP__(\d+)/)?.[1];
  if (status !== '200' && status !== '206') throw new Error(`${table}: Supabase returned HTTP ${status || 'unknown'}`);
  const total = output.match(/^content-range:\s*[^/]*\/(\d+)/im)?.[1];
  if (!total) throw new Error(`${table}: Supabase did not return an exact count`);
  console.log(`${table}: ${total}`);
}
