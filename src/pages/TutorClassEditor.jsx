import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { get, post, patch } from '../lib/api.js';
import { Alert, Spinner, runtime } from '../components/ui.jsx';

const CATEGORIES = ['film', 'writing', 'music', 'design', 'business', 'other'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

/* /teach/new — creates an empty draft, then redirects into the editor. */
export function NewClass() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    post('/classes', { title: 'Untitled class' })
      .then((r) => navigate(`/teach/${r.class.slug}`, { replace: true }))
      .catch((e) => setError(e.message));
  }, [navigate]);

  if (error) return <Alert>{error}</Alert>;
  return <Spinner label="Creating class" />;
}

/* /teach/:slug — edit metadata and manage lessons. */
export default function TutorClassEditor() {
  const { slug } = useParams();

  const [data, setData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [newLesson, setNewLesson] = useState({ title: '', duration_seconds: 600, video_url: '' });

  const load = useCallback(() => {
    get(`/classes/${slug}`)
      .then((r) => {
        setData(r.class);
        setLessons(r.lessons);
        setForm({
          title: r.class.title,
          subtitle: r.class.subtitle,
          description: r.class.description,
          category: r.class.category,
          level: r.class.level,
          status: r.class.status,
        });
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  /* load() returns a promise, which React would treat as a cleanup
     function, so the effect body deliberately returns nothing. */
  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) return <Alert>{error}</Alert>;
  if (!data || !form) return <Spinner label="Loading class" />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setError('');
    setSaved('');
    try {
      const r = await patch(`/classes/${data.id}`, form);
      setData(r.class);
      setSaved('Saved');
      setTimeout(() => setSaved(''), 2000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addLesson(e) {
    e.preventDefault();
    setError('');
    try {
      await post(`/classes/${data.id}/lessons`, newLesson);
      setNewLesson({ title: '', duration_seconds: 600, video_url: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      <div className="row row--between">
        <div className="page-head" style={{ marginBottom: 0 }}>
          <Link to="/teach" style={{ fontSize: '1.3rem', color: 'var(--mc-color-text-medium)' }}>
            ← All classes
          </Link>
          <h1 style={{ marginTop: '1.2rem' }}>{data.title}</h1>
          <p>/{data.slug}</p>
        </div>
        <div className="row">
          <span className={`badge ${data.status === 'published' ? 'badge--live' : 'badge--draft'}`}>
            {data.status}
          </span>
          {data.status === 'published' && (
            <Link className="btn btn--quiet btn--sm" to={`/learn/${data.slug}`}>
              View live
            </Link>
          )}
        </div>
      </div>

      <Alert>{error}</Alert>

      <form className="panel stack" onSubmit={save}>
        <h2>Details</h2>

        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" required value={form.title} onChange={set('title')} />
        </div>

        <div className="field">
          <label htmlFor="subtitle">Subtitle</label>
          <input id="subtitle" value={form.subtitle} onChange={set('subtitle')} />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" value={form.description} onChange={set('description')} />
        </div>

        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="level">Level</label>
            <select id="level" value={form.level} onChange={set('level')}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={set('status')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="row">
          <button className="btn" type="submit">
            Save changes
          </button>
          {saved && <span style={{ color: 'var(--mc-color-green-300)' }}>{saved}</span>}
        </div>
      </form>

      <section className="panel stack stack--tight">
        <h2>Lessons ({lessons.length})</h2>

        {lessons.length === 0 ? (
          <p className="setting-row__hint">No lessons yet. Add the first one below.</p>
        ) : (
          <div style={{ margin: '0 -3.2rem' }}>
            {lessons.map((l) => (
              <div className="setting-row" key={l.id} style={{ paddingInline: '3.2rem' }}>
                <span className="setting-row__text">
                  <span className="setting-row__label">
                    {l.position + 1}. {l.title}
                  </span>
                  <span className="setting-row__hint">
                    {runtime(l.duration_seconds)}
                    {l.is_preview ? ' · free preview' : ''}
                    {l.video_url ? ' · video attached' : ' · no video'}
                  </span>
                </span>
                {l.video_url && (
                  <a className="btn btn--quiet btn--sm" href={l.video_url} target="_blank" rel="noreferrer">
                    Video
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <form className="stack stack--tight" onSubmit={addLesson} style={{ marginTop: '1.6rem' }}>
          <h3 style={{ fontSize: '1.8rem', margin: 0 }}>Add a lesson</h3>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="l-title">Title</label>
            <input
              id="l-title"
              required
              value={newLesson.title}
              onChange={(e) => setNewLesson((n) => ({ ...n, title: e.target.value }))}
            />
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="l-dur">Duration (seconds)</label>
              <input
                id="l-dur"
                type="number"
                min="30"
                value={newLesson.duration_seconds}
                onChange={(e) => setNewLesson((n) => ({ ...n, duration_seconds: e.target.value }))}
              />
            </div>
            <div className="field" style={{ flex: 2, marginBottom: 0 }}>
              <label htmlFor="l-url">Video URL</label>
              <input
                id="l-url"
                type="url"
                placeholder="https://…/lesson.mp4"
                value={newLesson.video_url}
                onChange={(e) => setNewLesson((n) => ({ ...n, video_url: e.target.value }))}
              />
            </div>
          </div>
          <button className="btn" type="submit" style={{ alignSelf: 'flex-start' }}>
            Add lesson
          </button>
        </form>
      </section>
    </div>
  );
}
