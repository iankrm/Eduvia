import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './app.js';

const PORT = Number(process.env.PORT) || 3001;
const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

// Vercel serves the Vite output as static files. Keep this static middleware
// only for local/standalone production runs of the Express server.
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => res.sendFile(join(DIST, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`  EduVia API   http://localhost:${PORT}/api/health`);
  if (existsSync(DIST)) console.log(`  EduVia app   http://localhost:${PORT}`);
});
