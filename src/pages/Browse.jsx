import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get } from '../lib/api.js';
import { ClassCard, Empty, Spinner } from '../components/ui.jsx';

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');

  // The landing page search bar links here with ?q=
  const query = params.get('q') || '';

  useEffect(() => {
    get('/classes')
      .then((r) => setClasses(r.classes))
      .catch((e) => setError(e.message));
  }, []);

  const categories = useMemo(() => {
    if (!classes) return [];
    return ['all', ...new Set(classes.map((c) => c.category))];
  }, [classes]);

  if (error) return <p className="alert alert--error">{error}</p>;
  if (!classes) return <Spinner label="Loading catalogue" />;

  const needle = query.trim().toLowerCase();
  const visible = classes.filter((c) => {
    if (category !== 'all' && c.category !== category) return false;
    if (!needle) return true;
    return (
      c.title.toLowerCase().includes(needle) ||
      (c.subtitle || '').toLowerCase().includes(needle) ||
      c.tutor_name.toLowerCase().includes(needle)
    );
  });

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Browse classes</h1>
        <p>{classes.length} published classes.</p>
      </div>

      <div className="row">
        <div className="field" style={{ marginBottom: 0, flex: '1 1 28rem' }}>
          <label htmlFor="q">Search</label>
          <input
            id="q"
            type="search"
            placeholder="Title, topic, or tutor"
            value={query}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          />
        </div>
      </div>

      <div className="row" role="group" aria-label="Filter by category">
        {categories.map((c) => (
          <button
            key={c}
            className="btn btn--quiet btn--sm"
            aria-pressed={category === c}
            style={
              category === c
                ? { background: 'var(--mc-color-pink-500)', borderColor: 'var(--mc-color-pink-500)' }
                : undefined
            }
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Empty title="Nothing matches that search" />
      ) : (
        <div className="grid-cards">
          {visible.map((k) => (
            <ClassCard key={k.id} klass={k} to={`/class/${k.slug}`} />
          ))}
        </div>
      )}
    </div>
  );
}
