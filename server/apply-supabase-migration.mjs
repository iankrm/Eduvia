import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const migration = await readFile(join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations', '20260930000000_initial_schema.sql'), 'utf8');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
try {
  await pool.query(migration);
  console.log('Supabase schema migration applied.');
} finally {
  await pool.end();
}
