import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { get, post } from '../lib/api.js';
import { Alert, Bar, Empty, Spinner } from '../components/ui.jsx';
import { BRAND } from '../data/content.js';

function Certificate({ cert }) {
  return (
    <article className="cert" aria-label={`Certificate for ${cert.classTitle}`}>
      <div className="cert__frame">
        <p className="cert__brand">{BRAND}</p>
        <p className="cert__kicker">Certificate of completion</p>
        <p className="cert__name">{cert.recipient}</p>
        <p className="cert__body">
          has completed
          <br />
          <strong>{cert.classTitle}</strong>
        </p>
        <p className="cert__meta">
          {cert.tutorName} · issued {String(cert.issuedAt).slice(0, 10)}
        </p>
        <p className="cert__code">{cert.code}</p>
      </div>
      <div className="row">
        <button
          className="btn btn--sm"
          onClick={() => window.print()}
        >
          Print
        </button>
        <Link className="btn btn--sm btn--quiet" to={`/verify/${cert.code}`}>
          Verify
        </Link>
      </div>
    </article>
  );
}

export default function Certificates() {
  const [certs, setCerts] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = `Certificates | ${BRAND}`;
    let cancelled = false;

    Promise.all([get('/certificates'), get('/certificates/complete')])
      .then(([c, p]) => {
        if (cancelled) return;
        setCerts(c.certificates);
        setPending(p.pending);
      })
      .catch((e) => !cancelled && setError(e.message));

    return () => {
      cancelled = true;
    };
  }, []);

  const claim = async (classId) => {
    setError('');
    try {
      await post(`/certificates/${classId}`);
      const [c, p] = await Promise.all([get('/certificates'), get('/certificates/complete')]);
      setCerts(c.certificates);
      setPending(p.pending);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="page-head">
      <div className="row row--between">
        <div>
          <h1>Certificates</h1>
          <p className="muted">Proof of progress, completion, and skills gained.</p>
        </div>
        <Link className="btn btn--sm btn--quiet" to="/browse">Keep learning</Link>
      </div>

      <div className="panel">
        <div className="summary-grid">
          <div className="summary-card">
            <span>Earned</span>
            <strong>{certs?.length ?? 0}</strong>
          </div>
          <div className="summary-card">
            <span>In progress</span>
            <strong>{pending.length}</strong>
          </div>
          <div className="summary-card">
            <span>Milestone</span>
            <strong>Next</strong>
          </div>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {!certs && !error && <Spinner label="Loading certificates" />}

      {certs && certs.length === 0 && pending.length === 0 && (
        <div>
          <div className="quick-links">
            <Link className="quick-link" to="/search?q=film">Film</Link>
            <Link className="quick-link" to="/search?q=design">Design</Link>
            <Link className="quick-link" to="/search?q=business">Business</Link>
          </div>
          <Empty title="No certificates yet">
            <p>Finish every lesson in a class and yours appears here.</p>
            <Link className="btn" to="/browse">
              Find a class
            </Link>
          </Empty>
        </div>
      )}

      {certs && certs.length > 0 && (
        <div className="cert-grid">
          {certs.map((cert) => (
            <Certificate key={cert.id} cert={cert} />
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <section aria-label="Almost complete">
          <h2 className="section-minor">Almost there</h2>
          {pending.map((p) => (
            <article className="panel" key={p.classId}>
              <div className="row row--between">
                <div>
                  <h3>{p.classTitle}</h3>
                  <p className="muted">
                    {p.progress.completed} of {p.progress.total} lessons done
                  </p>
                </div>
                <Link className="btn btn--sm" to={`/class/${p.classSlug}`}>
                  Keep going
                </Link>
              </div>
              <Bar percent={p.progress.percent} />
              {p.progress.percent === 100 && (
                <button className="btn btn--sm" onClick={() => claim(p.classId)}>
                  Claim certificate
                </button>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

/* Public verification page — no auth, reachable by certificate code. */
export function VerifyCertificate() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setResult(null);
    setError('');
    get(`/certificates/verify/${encodeURIComponent(code || '')}`)
      .then(setResult)
      .catch((e) => setError(e.message));
  }, [code]);

  return (
    <div className="page-head">
      <h1>Verify a certificate</h1>
      {error && <Alert>{error}</Alert>}
      {!result && !error && <Spinner label="Checking code" />}
      {result && (
        <div className="panel">
          <p className="badge badge--live">Valid certificate</p>
          <p>
            <strong>{result.certificate.recipient}</strong> completed{' '}
            <strong>{result.certificate.classTitle}</strong> with {result.certificate.tutorName}.
          </p>
          <p className="muted">Code {result.certificate.code}</p>
          <Certificate cert={result.certificate} />
        </div>
      )}
    </div>
  );
}
