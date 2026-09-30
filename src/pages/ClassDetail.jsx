import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { get, post, del } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar } from '../components/AppShell.jsx';
import { Alert, Spinner, Stars, runtime } from '../components/ui.jsx';
import { Questions, Reviews } from './Reviews.jsx';
import { SaveButton } from './Wishlist.jsx';

export default function ClassDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isStudent } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    get(`/classes/${slug}`)
      .then((r) => setData(r))
      .catch((e) => setError(e.message));
  }, [slug]);

  /* load() returns a promise, which React would treat as a cleanup
     function, so the effect body deliberately returns nothing. */
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user || !data) return;
    get('/enrollments')
      .then((r) => setEnrolled(r.enrollments.some((e) => e.slug === slug)))
      .catch(() => {});
    get(`/wishlist/saved?slug=${encodeURIComponent(slug)}`)
      .then((r) => setSaved(!!r.saved))
      .catch(() => {});
  }, [user, data, slug]);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <Spinner label="Loading class" />;

  const { class: klass, lessons } = data;

  async function toggleEnrol() {
    setBusy(true);
    setError('');
    try {
      if (enrolled) {
        await del(`/enrollments/${klass.id}`);
        setEnrolled(false);
      } else {
        await post(`/enrollments/${klass.id}`);
        setEnrolled(true);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function startClass() {
    try {
      if (!enrolled) await post(`/enrollments/${klass.id}`);
    } catch (e) {
      if (e.status !== 409) {
        setError(e.message);
        return;
      }
    }
    navigate(`/learn/${klass.slug}`);
  }

  const preview = lessons.find((l) => l.is_preview);
  const rest = lessons.filter((l) => !l.is_preview);

  return (
    <div className="stack">
      <Link to="/browse" style={{ fontSize: '1.3rem', color: 'var(--mc-color-text-medium)' }}>
        ← All classes
      </Link>

      <Alert>{error}</Alert>

      <div
        style={{
          aspectRatio: '21 / 9',
          borderRadius: '1.6rem',
          display: 'grid',
          placeItems: 'center',
          fontFamily: '"Sohne Schmal", "Sohne", Helvetica, Arial, sans-serif',
          fontSize: '9.6rem',
          color: '#fff',
          background: `linear-gradient(150deg, hsl(${klass.hue} 64% 44%), hsl(${klass.hue + 40} 58% 24%))`,
        }}
      >
        {klass.title.charAt(0)}
      </div>

      <div className="row row--between">
        <div className="page-head" style={{ marginBottom: 0 }}>
          <div className="row">
            <span className="badge">{klass.category}</span>
            <span className="badge">{klass.level}</span>
            {klass.status === 'draft' && <span className="badge badge--draft">draft</span>}
            {klass.rating?.count > 0 && <Stars value={klass.rating.average} count={klass.rating.count} showValue />}
          </div>
          <h1 style={{ marginTop: '1.6rem' }}>{klass.title}</h1>
          {klass.subtitle && <p>{klass.subtitle}</p>}
        </div>

        {isStudent && (
          <div className="row">
            {enrolled ? (
              <button className="btn" onClick={startClass}>
                Continue class
              </button>
            ) : (
              <button className="btn" onClick={toggleEnrol} disabled={busy}>
                {busy ? 'Enrolling…' : 'Enrol for free'}
              </button>
            )}
            {enrolled && (
              <button className="btn btn--quiet" onClick={toggleEnrol} disabled={busy}>
                Leave
              </button>
            )}
            <SaveButton slug={klass.slug} classId={klass.id} saved={saved} />
          </div>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__value">{lessons.length}</div>
          <div className="stat__label">Lessons</div>
        </div>
        <div className="stat">
          <div className="stat__value">{runtime(klass.runtimeSeconds)}</div>
          <div className="stat__label">Runtime</div>
        </div>
        <div className="stat">
          <div className="stat__value">{klass.studentCount}</div>
          <div className="stat__label">Students</div>
        </div>
        <div className="stat">
          <div className="stat__value">{klass.rating?.count ? klass.rating.average.toFixed(1) : '—'}</div>
          <div className="stat__label">Rating</div>
        </div>
      </div>

      <div className="panel">
        <div className="row">
          <Avatar name={klass.tutor_name} hue={klass.tutor_hue} size="lg" />
          <div>
            <p className="setting-row__label">{klass.tutor_name}</p>
            <p className="setting-row__hint">{klass.tutor_headline}</p>
          </div>
        </div>
        {klass.tutor_bio && <p style={{ marginBottom: 0 }}>{klass.tutor_bio}</p>}
      </div>

      {klass.description && (
        <section className="panel stack stack--tight">
          <h2>About this class</h2>
          <p style={{ margin: 0 }}>{klass.description}</p>
        </section>
      )}

      <section className="panel stack stack--tight">
        <h2>Curriculum</h2>
        {preview && (
          <>
            <p className="setting-row__hint" style={{ margin: 0 }}>Free preview</p>
            <div style={{ margin: '0 -3.2rem' }}>
              <div className="setting-row" style={{ paddingInline: '3.2rem', borderBottom: 0 }}>
                <span className="setting-row__text">
                  <span className="setting-row__label">{preview.title}</span>
                  <span className="setting-row__hint">{runtime(preview.duration_seconds)}</span>
                </span>
                {isStudent && !enrolled && (
                  <button className="btn btn--quiet btn--sm" onClick={startClass}>
                    Watch free
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        <div style={{ margin: '0 -3.2rem' }}>
          {rest.map((l) => (
            <div className="setting-row" key={l.id} style={{ paddingInline: '3.2rem' }}>
              <span className="setting-row__text">
                <span className="setting-row__label">{l.title}</span>
                <span className="setting-row__hint">{runtime(l.duration_seconds)}</span>
              </span>
              <span className="badge">
                {enrolled ? (
                  <Link to={`/learn/${klass.slug}?lesson=${l.id}`} style={{ color: 'inherit' }}>
                    Open
                  </Link>
                ) : (
                  'Locked'
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Reviews slug={klass.slug} classId={klass.id} enrolled={enrolled} />
      <Questions slug={klass.slug} classId={klass.id} enrolled={enrolled} />
    </div>
  );
}
