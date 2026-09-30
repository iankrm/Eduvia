import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { get } from '../lib/api.js';
import { Alert, ClassCard, Empty, Spinner, Stars } from '../components/ui.jsx';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'classes', label: 'Classes' },
  { id: 'tutors', label: 'Instructors' },
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const type = params.get('type') || 'all';
  const category = params.get('category') || 'all';

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(query);
  const first = useRef(true);

  // Keep the input in step when the URL changes from elsewhere (nav box, links).
  useEffect(() => setDraft(query), [query]);

  useEffect(() => {
    if (!query) {
      setData(null);
      return undefined;
    }
    let cancelled = false;
    setError('');
    get(`/search?q=${encodeURIComponent(query)}&type=${type}&category=${category}`)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [query, type, category]);

  // Land straight in the results view when arriving with ?q=
  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (query) document.title = `${query} — search | EduVia`;
    }
  }, [query]);

  const submit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (draft.trim()) next.set('q', draft.trim());
    else next.delete('q');
    setParams(next);
  };

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  return (
    <div className="page-head">
      <div className="row row--between">
        <div>
          <h1>Search</h1>
          <p className="muted">Find the next class, mentor, or topic that matches your goals.</p>
        </div>
        <Link className="btn btn--sm btn--quiet" to="/browse">Browse all</Link>
      </div>

      <div className="panel">
        <form className="search__form" onSubmit={submit} role="search">
          <label className="sr-only" htmlFor="q">
            Search classes and instructors
          </label>
          <input
            id="q"
            className="field"
            type="search"
            value={draft}
            placeholder="What do you want to learn?"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn" type="submit">
            Search
          </button>
        </form>

        {!query && (
          <div className="summary-grid">
            <div className="summary-card">
              <span>Popular</span>
              <strong>Film</strong>
            </div>
            <div className="summary-card">
              <span>Popular</span>
              <strong>Design</strong>
            </div>
            <div className="summary-card">
              <span>Popular</span>
              <strong>Business</strong>
            </div>
            <div className="summary-card">
              <span>Popular</span>
              <strong>Wellness</strong>
            </div>
          </div>
        )}
      </div>

      {!query && (
        <div>
          <h2 className="section-minor">Suggested learning paths</h2>
          <div className="quick-links">
            <Link className="quick-link" to="/search?q=film">Film & storytelling</Link>
            <Link className="quick-link" to="/search?q=design">Design thinking</Link>
            <Link className="quick-link" to="/search?q=leadership">Leadership</Link>
            <Link className="quick-link" to="/search?q=cooking">Cooking</Link>
          </div>
          <Empty title="Start typing to search">
            <p>Look for a class by title, topic, or instructor name.</p>
          </Empty>
        </div>
      )}

      {error && <Alert>{error}</Alert>}

      {query && !data && <Spinner label="Searching" />}

      {query && data && (
        <>
          <div className="row" role="group" aria-label="Filter results">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip ${type === t.id ? 'chip--on' : ''}`}
                aria-pressed={type === t.id}
                onClick={() => setParam('type', t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {data.categories?.length > 0 && (
            <div className="row" role="group" aria-label="Filter by category">
              <button
                type="button"
                className={`chip ${category === 'all' ? 'chip--on' : ''}`}
                aria-pressed={category === 'all'}
                onClick={() => setParam('category', 'all')}
              >
                Any topic
              </button>
              {data.categories.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`chip ${category === c.name ? 'chip--on' : ''}`}
                  aria-pressed={category === c.name}
                  onClick={() => setParam('category', c.name)}
                >
                  {c.name} <span aria-hidden="true">{c.n}</span>
                </button>
              ))}
            </div>
          )}

          <p className="muted" role="status">
            {data.total === 0 && !data.tutors.length
              ? `Nothing matched “${query}”.`
              : `${data.total} class${data.total === 1 ? '' : 'es'} for “${query}”`}
          </p>

          {data.classes.length > 0 && (
            <section aria-label="Classes">
              <h2 className="section-minor">Classes</h2>
              <div className="grid-cards">
                {data.classes.map((c) => (
                  <ClassCard
                    key={c.id}
                    klass={c}
                    to={`/class/${c.slug}`}
                    footer={
                      c.rating?.count > 0 ? (
                        <p className="xcard__meta">
                          <Stars value={c.rating.average} count={c.rating.count} showValue />
                        </p>
                      ) : null
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {data.tutors.length > 0 && (
            <section aria-label="Instructors">
              <h2 className="section-minor">Instructors</h2>
              <div className="grid-cards">
                {data.tutors.map((t) => (
                  <article className="panel" key={t.id}>
                    <div className="app-avatar app-avatar--lg" style={{ '--avatar-hue': t.hue }}>
                      {t.name.charAt(0)}
                    </div>
                    <h3>{t.name}</h3>
                    {t.headline && <p className="muted">{t.headline}</p>}
                    {t.expertise && <p className="muted">{t.expertise}</p>}
                    <p className="muted">
                      {t.classCount} class{t.classCount === 1 ? '' : 'es'}
                    </p>
                    <Link className="btn btn--sm" to={`/search?q=${encodeURIComponent(t.name)}&type=classes`}>
                      See their classes
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {data.total === 0 && data.tutors.length === 0 && (
            <Empty title="No results">
              <p>Try a broader term, or clear the topic filter.</p>
            </Empty>
          )}
        </>
      )}
    </div>
  );
}
