if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. EduVia only supports Supabase Postgres now.');
}

export {
  db,
  notify,
  classProgress,
  issueCertificate,
  EARNINGS_SHARE,
  CLASS_PRICE_CENTS,
  recordEarning,
  ratingFor,
} from './db-postgres.js';
