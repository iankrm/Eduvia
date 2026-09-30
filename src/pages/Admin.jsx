import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, get, patch, post } from '../lib/api.js';
import { Alert, Empty, Spinner, Stars } from '../components/ui.jsx';
import { BRAND } from '../data/content.js';

const money = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function Admin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(0);

  const load = useCallback(() => {
    setError('');
    return get('/admin/moderation')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    document.title = `Admin | ${BRAND}`;
    load();
  }, [load]);

  const setReviewStatus = async (id, status) => {
    setError('');
    setBusy(id);
    try {
      await patch(`/admin/moderation/reviews/${id}`, { status });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(0);
    }
  };

  const setClassStatus = async (id, status) => {
    setError('');
    setBusy(id);
    try {
      await patch(`/admin/moderation/classes/${id}`, { status });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(0);
    }
  };

  if (!data && !error) return <Spinner label="Loading admin" />;

  const s = data?.stats;

  return (
    <div className="page-head">
      <h1>Admin</h1>
      {error && <Alert>{error}</Alert>}

      {s && (
        <div className="stat-grid">
          <div className="stat">
            <p className="stat__value">{s.users}</p>
            <p className="stat__label">Users</p>
          </div>
          <div className="stat">
            <p className="stat__value">{s.published}/{s.classes}</p>
            <p className="stat__label">Classes live</p>
          </div>
          <div className="stat">
            <p className="stat__value">{s.enrollments}</p>
            <p className="stat__label">Enrolments</p>
          </div>
          <div className="stat">
            <p className="stat__value">{s.reviews}</p>
            <p className="stat__label">Reviews</p>
          </div>
          <div className="stat">
            <p className="stat__value">{s.hidden}</p>
            <p className="stat__label">Hidden</p>
          </div>
          <div className="stat">
            <p className="stat__value">{money(s.earningsCents)}</p>
            <p className="stat__label">Tutor earnings</p>
          </div>
        </div>
      )}

      {data && (
        <>
          <section aria-label="Review moderation">
            <h2 className="section-minor">Reviews</h2>
            {data.reviews.length === 0 && <Empty title="No reviews yet" />}
            <ul className="mod-list">
              {data.reviews.map((r) => (
                <li key={r.id} className={`panel ${r.status === 'hidden' ? 'panel--muted' : ''}`}>
                  <div className="row row--between">
                    <div>
                      <Stars value={r.rating} size="sm" />
                      <p>{r.body}</p>
                      <p className="muted">
                        {r.author} on{' '}
                        <Link to={`/class/${r.classSlug}`}>{r.classTitle}</Link>
                      </p>
                    </div>
                    <div className="row">
                      <span className={`badge ${r.status === 'hidden' ? 'badge--draft' : 'badge--live'}`}>
                        {r.status}
                      </span>
                      <button
                        className="btn btn--sm"
                        disabled={busy === r.id}
                        onClick={() =>
                          setReviewStatus(r.id, r.status === 'hidden' ? 'published' : 'hidden')
                        }
                      >
                        {r.status === 'hidden' ? 'Restore' : 'Hide'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Class moderation">
            <h2 className="section-minor">Classes</h2>
            <ul className="mod-list">
              {data.classes.map((c) => (
                <li key={c.id} className="panel">
                  <div className="row row--between">
                    <div>
                      <h3>{c.title}</h3>
                      <p className="muted">
                        {c.tutor} · {c.studentCount} student{c.studentCount === 1 ? '' : 's'}
                      </p>
                      {c.rating?.count > 0 && <Stars value={c.rating.average} count={c.rating.count} showValue />}
                    </div>
                    <div className="row">
                      <span className={`badge ${c.status === 'published' ? 'badge--live' : 'badge--draft'}`}>
                        {c.status}
                      </span>
                      <button
                        className="btn btn--sm"
                        disabled={busy === c.id}
                        onClick={() => setClassStatus(c.id, c.status === 'published' ? 'draft' : 'published')}
                      >
                        {c.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Users">
            <h2 className="section-minor">Users</h2>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Verified</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      {u.role}
                      {u.is_admin ? ' · admin' : ''}
                    </td>
                    <td>{u.email_verified_at ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-label="Moderation log">
            <h2 className="section-minor">Recent actions</h2>
            {data.log.length === 0 && <Empty title="Nothing logged yet" />}
            <ul className="log-list">
              {data.log.map((l) => (
                <li key={l.id}>
                  <time dateTime={l.created_at}>{String(l.created_at).slice(0, 16).replace('T', ' ')}</time>{' '}
                  <strong>{l.admin_name}</strong> {l.action.replace(/_/g, ' ')} {l.entity_type} #{l.entity_id}
                  {l.note ? ` — ${l.note}` : ''}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

/* Tutor revenue: lifetime, this month, and the ledger behind it. */
export function Earnings() {
  const [data, setData] = useState(null);
  const [codes, setCodes] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ code: '', percentOff: '', maxUses: '' });

  const load = useCallback(() => {
    setError('');
    return Promise.all([get('/admin/earnings'), get('/admin/promo-codes')])
      .then(([e, p]) => {
        setData(e);
        setCodes(p.promoCodes);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    document.title = `Earnings | ${BRAND}`;
    load();
  }, [load]);

  const createCode = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await post('/admin/promo-codes', {
        code: form.code,
        percentOff: Number(form.percentOff),
        maxUses: Number(form.maxUses) || 0,
      });
      setForm({ code: '', percentOff: '', maxUses: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeCode = async (id) => {
    setError('');
    try {
      await del(`/admin/promo-codes/${id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!data && !error) return <Spinner label="Loading earnings" />;

  return (
    <div className="page-head">
      <h1>Earnings</h1>
      {error && <Alert>{error}</Alert>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat">
              <p className="stat__value">{money(data.monthCents)}</p>
              <p className="stat__label">This month</p>
            </div>
            <div className="stat">
              <p className="stat__value">{money(data.lifetimeCents)}</p>
              <p className="stat__label">Lifetime</p>
            </div>
            <div className="stat">
              <p className="stat__value">{data.sales}</p>
              <p className="stat__label">Enrolments</p>
            </div>
            <div className="stat">
              <p className="stat__value">{Math.round(data.share * 100)}%</p>
              <p className="stat__label">Your share</p>
            </div>
          </div>

          <section aria-label="Sales">
            <h2 className="section-minor">Sales</h2>
            {data.recent.length === 0 && <Empty title="No sales yet" />}
            {data.recent.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Class</th>
                    <th scope="col">Student</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r) => (
                    <tr key={r.id}>
                      <td>{String(r.createdAt).slice(0, 10)}</td>
                      <td>{r.classTitle || '—'}</td>
                      <td>{r.studentName || '—'}</td>
                      <td>{money(r.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section aria-label="Promo codes">
            <h2 className="section-minor">Promo codes</h2>
            <form className="row" onSubmit={createCode}>
              <div className="field">
                <label htmlFor="code">Code</label>
                <input
                  id="code"
                  value={form.code}
                  required
                  minLength={3}
                  placeholder="SAVE20"
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="percentOff">% off</label>
                <input
                  id="percentOff"
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={form.percentOff}
                  onChange={(e) => setForm({ ...form, percentOff: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="maxUses">Max uses (0 = unlimited)</label>
                <input
                  id="maxUses"
                  type="number"
                  min={0}
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                />
              </div>
              <button className="btn" type="submit">
                Create
              </button>
            </form>

            {codes.length === 0 ? (
              <Empty title="No promo codes" />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Code</th>
                    <th scope="col">Discount</th>
                    <th scope="col">Used</th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id}>
                      <td>{c.code}</td>
                      <td>{c.percentOff}%</td>
                      <td>
                        {c.usedCount}
                        {c.maxUses ? ` / ${c.maxUses}` : ''}
                      </td>
                      <td>
                        <button className="btn btn--sm btn--quiet" onClick={() => removeCode(c.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
