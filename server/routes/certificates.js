import { Router } from 'express';
import { db, classProgress, issueCertificate } from '../db.js';
import { requireAuth } from '../auth.js';
const router = Router();
function shape(cert) {
  return {
    id: cert.id,
    code: cert.code,
    recipient: cert.recipient,
    issuedAt: cert.issued_at,
    classId: cert.class_id,
    classSlug: cert.class_slug,
    classTitle: cert.class_title,
    tutorName: cert.tutor_name
  };
}
const SELECT_CERT = `
  SELECT c.*, k.slug AS class_slug, k.title AS class_title, u.name AS tutor_name
    FROM certificates c
    JOIN classes k ON k.id = c.class_id
    JOIN users  u ON u.id = k.tutor_id
`;

/* GET /api/certificates — the signed-in student's certificates. */
router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare(`${SELECT_CERT} WHERE c.user_id = ? ORDER BY c.issued_at DESC`).all(req.user.id);
  res.json({
    certificates: rows.map(shape)
  });
});

/* GET /api/certificates/complete — enrolments that are one step from a
   certificate, so the student can see what's still outstanding. */
router.get('/complete', requireAuth, async (req, res) => {
  const rows = await db.prepare(`SELECT e.class_id, k.slug AS class_slug, k.title AS class_title
         FROM enrollments e JOIN classes k ON k.id = e.class_id
        WHERE e.user_id = ?
        ORDER BY e.created_at DESC`).all(req.user.id);
  res.json({
    pending: (await Promise.all(rows.map(async r => ({
      ...r,
      progress: await classProgress(req.user.id, r.class_id)
    })))).filter(r => r.progress.total > 0 && r.progress.completed < r.progress.total)
  });
});

/* POST /api/certificates/:classId — issue now if the course is finished. */
router.post('/:classId', requireAuth, async (req, res) => {
  const classId = Number(req.params.classId);
  const enrolled = await db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND class_id = ?').get(req.user.id, classId);
  if (!enrolled) return res.status(403).json({
    error: 'Enrol in the class first'
  });
  const cert = await issueCertificate(req.user.id, classId);
  if (!cert) {
    const {
      completed,
      total
    } = await classProgress(req.user.id, classId);
    return res.status(409).json({
      error: 'Finish every lesson to unlock your certificate',
      completed,
      total
    });
  }
  const row = await db.prepare(`${SELECT_CERT} WHERE c.id = ?`).get(cert.id);
  res.status(201).json({
    certificate: shape(row)
  });
});

/* GET /api/certificates/verify/:code — public check, no auth. */
router.get('/verify/:code', async (req, res) => {
  const row = await db.prepare(`${SELECT_CERT} WHERE c.code = ?`).get(String(req.params.code));
  if (!row) return res.status(404).json({
    valid: false,
    error: 'No certificate matches that code'
  });
  res.json({
    valid: true,
    certificate: shape(row)
  });
});
export default router;
