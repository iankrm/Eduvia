import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, get, post } from '../lib/api.js';
import { Alert, Empty, Spinner } from '../components/ui.jsx';

function when(iso) {
  if (!iso) return '';
  const then = new Date(`${String(iso).replace(' ', 'T')}Z`).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function Notifications() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    return get('/notifications')
      .then((d) => setItems(d.notifications))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    document.title = 'Notifications | EduVia';
    load();
  }, [load]);

  const markAll = async () => {
    setError('');
    try {
      await post('/notifications/read');
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await del(`/notifications/${id}`);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const clearAll = async () => {
    setError('');
    try {
      await del('/notifications');
      setItems([]);
    } catch (e) {
      setError(e.message);
    }
  };

  const unread = (items || []).filter((n) => !n.read).length;

  return (
    <div className="page-head">
      <div className="row row--between">
        <div>
          <h1>Notifications</h1>
          <p className="muted">Your updates from classes, mentors, and your learning journey.</p>
        </div>
        {items?.length > 0 && (
          <div className="row">
            {unread > 0 && (
              <button className="btn btn--sm btn--quiet" onClick={markAll}>
                Mark all read
              </button>
            )}
            <button className="btn btn--sm btn--quiet" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="summary-grid">
          <div className="summary-card">
            <span>Total</span>
            <strong>{items?.length ?? 0}</strong>
          </div>
          <div className="summary-card">
            <span>Unread</span>
            <strong>{unread}</strong>
          </div>
          <div className="summary-card">
            <span>Focus</span>
            <strong>Learning</strong>
          </div>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {!items && !error && <Spinner label="Loading notifications" />}

      {items && items.length === 0 && (
        <div>
          <div className="quick-links">
            <Link className="quick-link" to="/dashboard">Open dashboard</Link>
            <Link className="quick-link" to="/browse">Browse classes</Link>
          </div>
          <Empty title="You are all caught up">
            <p>Enrolments, answers, and certificates show up here.</p>
          </Empty>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="notif-list">
          {items.map((n) => (
            <li key={n.id} className={`notif ${n.read ? '' : 'notif--unread'}`}>
              <div className="notif__body">
                <p className="notif__title">
                  {n.link ? <Link to={n.link}>{n.title}</Link> : n.title}
                </p>
                {n.body && <p className="muted">{n.body}</p>}
                <p className="notif__time">
                  <time dateTime={n.createdAt}>{when(n.createdAt)}</time>
                </p>
              </div>
              <button
                className="btn btn--sm btn--quiet"
                aria-label={`Dismiss notification: ${n.title}`}
                onClick={() => remove(n.id)}
              >
                Dismiss
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
