import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import classRoutes from './routes/classes.js';
import enrollmentRoutes from './routes/enrollments.js';
import settingsRoutes from './routes/settings.js';
import billingRoutes from './routes/billing.js';
import reviewRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';
import notificationRoutes from './routes/notifications.js';
import certificateRoutes from './routes/certificates.js';
import questionRoutes from './routes/questions.js';
import searchRoutes from './routes/search.js';
import noteRoutes from './routes/notes.js';
import adminRoutes from './routes/admin.js';
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
app.use(express.json({
  limit: '1mb'
}));
app.get('/api/health', async (_req, res) => {
  const users = (await db.prepare('SELECT COUNT(*) AS n FROM users').get()).n;
  const classes = (await db.prepare('SELECT COUNT(*) AS n FROM classes').get()).n;
  res.json({
    ok: true,
    database: 'supabase-postgres',
    users,
    classes
  });
});
app.use('/api/auth', authRoutes);
app.use('/api/auth', accountRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (_req, res) => res.status(404).json({
  error: 'Unknown endpoint'
}));

/* In production Express also serves the built SPA. In development Vite does
   this and proxies /api here instead. */
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  // SPA fallback: client-side routes must not 404 on a hard refresh.
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(DIST, 'index.html')));
}

// Central error handler so thrown errors become JSON, not an HTML stack page.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: 'Something went wrong on our end'
  });
});
app.listen(PORT, () => {
  console.log(`  EduVia API   http://localhost:${PORT}/api/health`);
  if (existsSync(DIST)) console.log(`  EduVia app   http://localhost:${PORT}`);
});
