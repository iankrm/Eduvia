import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, get, post } from '../lib/api.js';
import { Alert, ClassCard, Empty, Spinner, Stars } from '../components/ui.jsx';
import { IconHeart } from '../components/Icons.jsx';

export default function Wishlist() {
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Saved classes | EduVia';
    let cancelled = false;
    get('/wishlist')
      .then((d) => !cancelled && setClasses(d.classes))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const unsave = async (id) => {
    setError('');
    try {
      await del(`/wishlist/${id}`);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="page-head">
      <div className="row row--between">
        <div>
          <h1>Saved classes</h1>
          <p className="muted">Your shortlist of classes to revisit later.</p>
        </div>
        <Link className="btn btn--sm btn--quiet" to="/browse">Find more</Link>
      </div>

      <div className="panel">
        <div className="summary-grid">
          <div className="summary-card">
            <span>Saved</span>
            <strong>{classes?.length ?? 0}</strong>
          </div>
          <div className="summary-card">
            <span>Goal</span>
            <strong>Learn</strong>
          </div>
          <div className="summary-card">
            <span>Focus</span>
            <strong>Today</strong>
          </div>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {!classes && !error && <Spinner label="Loading saved classes" />}

      {classes && classes.length === 0 && (
        <div>
          <div className="quick-links">
            <Link className="quick-link" to="/search?q=film">Film</Link>
            <Link className="quick-link" to="/search?q=design">Design</Link>
            <Link className="quick-link" to="/search?q=leadership">Leadership</Link>
          </div>
          <Empty title="Nothing saved yet">
            <p>Tap the heart on any class to keep it here for later.</p>
            <Link className="btn" to="/browse">
              Browse classes
            </Link>
          </Empty>
        </div>
      )}

      {classes && classes.length > 0 && (
        <div className="grid-cards">
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              klass={c}
              to={`/class/${c.slug}`}
              footer={
                <>
                  {c.rating?.count > 0 && (
                    <p className="xcard__meta">
                      <Stars value={c.rating.average} count={c.rating.count} showValue />
                    </p>
                  )}
                  <button className="btn btn--sm btn--quiet" onClick={() => unsave(c.id)}>
                    Remove
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* Small heart button used on class cards and the detail page. Exported so
   ClassDetail can reuse the same optimistic toggle. */
export function SaveButton({ slug, classId, saved: initial, onToggle }) {
  const [saved, setSaved] = useState(!!initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => setSaved(!!initial), [initial]);

  const click = async () => {
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      if (next) await post(`/wishlist/${classId}`);
      else await del(`/wishlist/${classId}`);
      onToggle?.(next);
    } catch {
      setSaved(!next); // roll back
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`save-btn ${saved ? 'save-btn--on' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${slug} from saved classes` : `Save ${slug}`}
      disabled={busy}
      onClick={click}
    >
      <span aria-hidden="true"><IconHeart size={15} filled={saved} /></span>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
