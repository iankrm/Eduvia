/* Copy the local SQLite records through Supabase's HTTPS Data API. This allows
   migration from IPv4-only environments that cannot reach the direct PG host.
   The service-role key is read only from the server environment and never
   printed. Existing destination data causes a no-write abort. */
import { DatabaseSync } from 'node:sqlite';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const api = process.env.SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!api || !serviceKey) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the server environment');

const source = new DatabaseSync(process.env.DB_PATH || join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'iankrm.db'), { readOnly: true });
const tables = [
  'users', 'tutor_profiles', 'subscriptions', 'promo_codes', 'classes', 'lessons', 'enrollments',
  'lesson_progress', 'settings', 'reviews', 'wishlist', 'notifications', 'certificates', 'questions',
  'auth_tokens', 'earnings', 'transcripts', 'lesson_notes', 'moderation_log',
];
const maps = {
  users: new Map(), promo_codes: new Map(), classes: new Map(), lessons: new Map(), questions: new Map(),
};
const created = [];

async function request(table, method, query = '', body) {
  const response = await fetch(`${api}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      'content-type': 'application/json',
      'accept-profile': 'public',
      'content-profile': 'public',
      ...(method === 'POST' ? { prefer: 'return=representation' } : {}),
      ...(method === 'GET' ? { prefer: 'count=exact', range: '0-0' } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Supabase ${method} ${table} returned HTTP ${response.status}: ${detail}`);
  }
  const text = await response.text();
  return { response, rows: text ? JSON.parse(text) : [] };
}

function allRows(table) {
  const hasId = source.prepare(`PRAGMA table_info(${table})`).all().some((column) => column.name === 'id');
  return source.prepare(`SELECT * FROM ${table}${hasId ? ' ORDER BY id' : ''}`).all();
}

async function insert(table, original, oldId, mapName, transform = (row) => row) {
  const row = transform({ ...original });
  if ('id' in row) delete row.id; // let Postgres identities stay in sync naturally
  const { rows } = await request(table, 'POST', '?select=*', row);
  const saved = rows[0];
  if (!saved) throw new Error(`Supabase inserted no row into ${table}`);
  const pk = primaryKey(table, saved);
  created.push({ table, pk });
  if (mapName) maps[mapName].set(oldId, saved.id);
  return saved;
}

function primaryKey(table, row) {
  const fields = {
    tutor_profiles: ['user_id'], settings: ['user_id'], wishlist: ['user_id', 'class_id'],
    transcripts: ['lesson_id'], lesson_notes: ['user_id', 'lesson_id'],
  }[table] || ['id'];
  return Object.fromEntries(fields.map((field) => [field, row[field]]));
}

async function rollback() {
  for (const item of created.reverse()) {
    const filter = Object.entries(item.pk).map(([key, value]) => `${key}=eq.${encodeURIComponent(value)}`).join('&');
    try { await request(item.table, 'DELETE', `?${filter}`); } catch { /* report original migration error */ }
  }
}

try {
  const populated = [];
  for (const table of tables) {
    const { response } = await request(table, 'GET', '?select=*&limit=0');
    const range = response.headers.get('content-range');
    const count = Number(range?.split('/').at(-1));
    if (!Number.isFinite(count)) throw new Error(`Supabase did not return a row count for ${table}`);
    if (count > 0) populated.push(`${table} (${count})`);
  }
  if (populated.length) throw new Error(`Destination is not empty; no rows copied. Existing tables: ${populated.join(', ')}`);

  for (const row of allRows('users')) await insert('users', row, row.id, 'users');
  for (const row of allRows('tutor_profiles')) await insert('tutor_profiles', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id) }));
  for (const row of allRows('subscriptions')) await insert('subscriptions', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id) }));
  for (const row of allRows('promo_codes')) await insert('promo_codes', row, row.id, 'promo_codes', (r) => ({ ...r, tutor_id: maps.users.get(r.tutor_id) }));
  for (const row of allRows('classes')) await insert('classes', row, row.id, 'classes', (r) => ({
    ...r, tutor_id: maps.users.get(r.tutor_id), promo_code_id: r.promo_code_id == null ? null : maps.promo_codes.get(r.promo_code_id),
  }));
  for (const row of allRows('lessons')) await insert('lessons', row, row.id, 'lessons', (r) => ({ ...r, class_id: maps.classes.get(r.class_id) }));
  for (const row of allRows('enrollments')) await insert('enrollments', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id), class_id: maps.classes.get(r.class_id) }));
  for (const row of allRows('lesson_progress')) await insert('lesson_progress', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id), lesson_id: maps.lessons.get(r.lesson_id) }));
  for (const row of allRows('settings')) await insert('settings', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id) }));
  for (const row of allRows('reviews')) await insert('reviews', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id), class_id: maps.classes.get(r.class_id) }));
  for (const row of allRows('wishlist')) await insert('wishlist', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id), class_id: maps.classes.get(r.class_id) }));
  for (const row of allRows('notifications')) await insert('notifications', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id) }));
  for (const row of allRows('certificates')) await insert('certificates', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id), class_id: maps.classes.get(r.class_id) }));

  let pending = allRows('questions');
  while (pending.length) {
    const ready = pending.filter((r) => r.parent_id == null || maps.questions.has(r.parent_id));
    if (!ready.length) throw new Error('Question replies contain a missing or cyclic parent reference');
    for (const row of ready) await insert('questions', row, row.id, 'questions', (r) => ({
      ...r, user_id: maps.users.get(r.user_id), class_id: maps.classes.get(r.class_id),
      parent_id: r.parent_id == null ? null : maps.questions.get(r.parent_id),
    }));
    const done = new Set(ready.map((r) => r.id));
    pending = pending.filter((r) => !done.has(r.id));
  }

  for (const row of allRows('auth_tokens')) await insert('auth_tokens', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id) }));
  for (const row of allRows('earnings')) await insert('earnings', row, null, null, (r) => ({
    ...r, tutor_id: maps.users.get(r.tutor_id), class_id: r.class_id == null ? null : maps.classes.get(r.class_id),
    student_id: r.student_id == null ? null : maps.users.get(r.student_id),
  }));
  for (const row of allRows('transcripts')) await insert('transcripts', row, null, null, (r) => ({ ...r, lesson_id: maps.lessons.get(r.lesson_id) }));
  for (const row of allRows('lesson_notes')) await insert('lesson_notes', row, null, null, (r) => ({ ...r, user_id: maps.users.get(r.user_id), lesson_id: maps.lessons.get(r.lesson_id) }));
  for (const row of allRows('moderation_log')) await insert('moderation_log', row, null, null, (r) => ({ ...r, admin_id: maps.users.get(r.admin_id) }));

  console.log(`Copied ${created.length} SQLite rows to Supabase through HTTPS.`);
  for (const table of tables) console.log(`${table}: ${allRows(table).length}`);
} catch (error) {
  await rollback();
  throw error;
} finally {
  source.close();
}
