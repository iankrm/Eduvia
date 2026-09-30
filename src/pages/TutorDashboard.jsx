import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, post, patch } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar } from '../components/AppShell.jsx';
import { Alert, Bar, Empty, Spinner, runtime } from '../components/ui.jsx';


export default function TutorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    get('/classes/mine')
      .then((r) => setClasses(r.classes))
      .catch((e) => setError(e.message));
  }, []);

  /* load() returns a promise, which React would treat as a cleanup
     function, so the effect body deliberately returns nothing. */
  useEffect(() => {
    load();
  }, [load]);

  if (error) return <Alert>{error}</Alert>;
  if (!classes) return <Spinner label="Loading your classes" />;

  async function togglePublish(klass) {
    setBusyId(klass.id);
    try {
      const next = klass.status === 'published' ? 'draft' : 'published';
      await patch(`/classes/${klass.id}`, { status: next });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function quickCreate() {
    try {
      const r = await post('/classes', { title: 'Untitled class' });
      navigate(`/teach/${r.class.slug}`);
    } catch (e) {
      setError(e.message);
    }
  }

  const published = classes.filter((c) => c.status === 'published');
  const drafts = classes.filter((c) => c.status === 'draft');
  const totalStudents = published.reduce((n, c) => n + c.studentCount, 0);
  const totalLessons = classes.reduce((n, c) => n + c.lessonCount, 0);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Your teaching</h1>
        <p>{user.tutorProfile?.expertise || 'Publish classes and see who is taking them.'}</p>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__value">{published.length}</div>
          <div className="stat__label">Published</div>
        </div>
        <div className="stat">
          <div className="stat__value">{drafts.length}</div>
          <div className="stat__label">Drafts</div>
        </div>
        <div className="stat">
          <div className="stat__value">{totalStudents}</div>
          <div className="stat__label">Enrolled students</div>
        </div>
        <div className="stat">
          <div className="stat__value">{totalLessons}</div>
          <div className="stat__label">Lessons written</div>
        </div>
      </div>

      <div className="row">
        <button className="btn" onClick={quickCreate}>
          New class
        </button>
        <Link className="btn btn--quiet" to="/teach/new">
          Blank class
        </Link>
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <Link className="btn btn--quiet btn--sm" to="/teach/new">Create class</Link>
        <Link className="btn btn--quiet btn--sm" to="/earnings">Earnings</Link>
        <Link className="btn btn--quiet btn--sm" to="/billing">Billing</Link>
        <Link className="btn btn--quiet btn--sm" to="/support">Support</Link>
      </div>

      {classes.length === 0 ? (
        <Empty title="No classes yet">
          <p>Create your first class to get started.</p>
          <button className="btn" onClick={quickCreate}>
            Create a class
          </button>
        </Empty>
      ) : (
        <div className="stack stack--tight">
          {classes.map((k) => (
            <div className="panel" key={k.id}>
              <div className="row row--between">
                <div>
                  <div className="row">
                    <span className={`badge ${k.status === 'published' ? 'badge--live' : 'badge--draft'}`}>
                      {k.status}
                    </span>
                    <span className="badge">{k.category}</span>
                  </div>
                  <h2 style={{ marginTop: '1.2rem' }}>{k.title}</h2>
                  <p className="xcard__meta">
                    {k.lessonCount} lessons · {runtime(k.runtimeSeconds)} · {k.studentCount} students
                  </p>
                </div>
                <div className="row">
                  <button
                    className="btn btn--quiet btn--sm"
                    onClick={() => togglePublish(k)}
                    disabled={busyId === k.id}
                  >
                    {k.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link className="btn btn--sm" to={`/teach/${k.slug}`}>
                    Edit
                  </Link>
                  {k.status === 'published' && (
                    <Link className="btn btn--quiet btn--sm" to={`/learn/${k.slug}`}>
                      View
                    </Link>
                  )}
                </div>
              </div>

              {k.students.length > 0 && (
                <div style={{ marginTop: '2.4rem', borderTop: '1px solid var(--mc-color-neutral-800)', paddingTop: '1.6rem' }}>
                  <p className="setting-row__hint" style={{ marginBottom: '1.2rem' }}>Students</p>
                  {k.students.map((s) => (
                    <div className="row" key={s.id} style={{ paddingBlock: '0.8rem' }}>
                      <Avatar name={s.name} hue={s.hue} />
                      <span>
                        {s.name}
                        <span className="setting-row__hint" style={{ display: 'block' }}>
                          {s.headline || 'Student'}
                        </span>
                      </span>
                      <span className="push setting-row__hint">
                        {s.completed}/{k.lessonCount} lessons
                      </span>
                      <span style={{ width: '12rem' }}>
                        <Bar percent={k.lessonCount ? Math.round((s.completed / k.lessonCount) * 100) : 0} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
