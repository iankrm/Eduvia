import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, del } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Bar, ClassCard, Empty, Spinner, runtime } from '../components/ui.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    get('/enrollments')
      .then((r) => setEnrollments(r.enrollments))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="alert alert--error">{error}</p>;
  if (!enrollments) return <Spinner label="Loading your classes" />;

  const lessonsDone = enrollments.reduce((n, e) => n + e.progress.completedCount, 0);
  const lessonsTotal = enrollments.reduce((n, e) => n + e.progress.lessonCount, 0);
  const finished = enrollments.filter((e) => e.progress.lessonCount > 0 && e.progress.completedCount === e.progress.lessonCount);
  const inProgress = enrollments.filter((e) => e.progress.completedCount > 0 && e.progress.completedCount < e.progress.lessonCount);

  async function leave(klass) {
    await del(`/enrollments/${klass.id}`);
    setEnrollments((list) => list.filter((e) => e.id !== klass.id));
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Hey {user.name.split(' ')[0]}.</h1>
        <p>Your classes, and how far you have got in each one.</p>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__value">{enrollments.length}</div>
          <div className="stat__label">Classes enrolled</div>
        </div>
        <div className="stat">
          <div className="stat__value">
            {lessonsDone}
            <span style={{ fontSize: '2.4rem', color: 'var(--mc-color-text-tint)' }}>/{lessonsTotal}</span>
          </div>
          <div className="stat__label">Lessons finished</div>
        </div>
        <div className="stat">
          <div className="stat__value">{finished.length}</div>
          <div className="stat__label">Completed</div>
        </div>
        <div className="stat">
          <div className="stat__value">{user.subscription ? user.subscription.plan : '—'}</div>
          <div className="stat__label">
            Plan {user.subscription ? `· ${user.subscription.status}` : '· none'}
          </div>
        </div>
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <Link className="btn btn--quiet btn--sm" to="/browse">Browse classes</Link>
        <Link className="btn btn--quiet btn--sm" to="/billing">Billing</Link>
        <Link className="btn btn--quiet btn--sm" to="/support">Help centre</Link>
        <Link className="btn btn--quiet btn--sm" to="/settings">Settings</Link>
      </div>

      {enrollments.length === 0 ? (
        <Empty title="You have not enrolled in anything yet">
          <p>Browse the catalogue and join a class to start tracking progress.</p>
          <Link className="btn" to="/browse">
            Browse classes
          </Link>
        </Empty>
      ) : (
        <>
          {inProgress.length > 0 && (
            <section className="stack stack--tight">
              <h2 style={{ fontSize: '2.4rem', margin: 0 }}>Continue</h2>
              <div className="grid-cards">
                {inProgress.map((k) => (
                  <ClassCard
                    key={k.id}
                    klass={k}
                    to={`/learn/${k.slug}`}
                    footer={
                      <div style={{ marginTop: 'auto', paddingTop: '1.2rem' }}>
                        <Bar percent={k.progress.percent} />
                        <p className="xcard__meta" style={{ marginTop: '0.8rem' }}>
                          {k.progress.completedCount}/{k.progress.lessonCount} lessons · {k.progress.percent}%
                        </p>
                      </div>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          <section className="stack stack--tight">
            <h2 style={{ fontSize: '2.4rem', margin: 0 }}>All classes</h2>
            <div className="panel">
              {enrollments.map((k) => (
                <div className="setting-row" key={k.id}>
                  <span className="setting-row__text">
                    <Link to={`/learn/${k.slug}`} style={{ color: 'inherit' }}>
                      {k.title}
                    </Link>
                    <span className="setting-row__hint">
                      {k.tutor_name} · {k.lessonCount} lessons · {runtime(k.runtimeSeconds)} ·{' '}
                      {k.progress.percent}% done
                    </span>
                  </span>
                  <button className="btn btn--quiet btn--sm" onClick={() => leave(k)}>
                    Leave
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
