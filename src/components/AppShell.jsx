import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { get, post } from '../lib/api.js';
import { BRAND } from '../data/content.js';
import { IconBell } from './Icons.jsx';

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, hue = 348, size = '' }) {
  const cls = ['app-avatar', size && `app-avatar--${size}`].filter(Boolean).join(' ');
  return (
    <span className={cls} style={{ '--app-hue': hue }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

/* Unread badge that polls the notification feed while signed in. */
function Bell() {
  const [unread, setUnread] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;

    const poll = () => {
      get('/notifications')
        .then((d) => alive && setUnread(d.unread))
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [user]);

  const open = async (e) => {
    // Mark read on arrival so the badge clears as the user sees them.
    if (unread > 0) {
      await post('/notifications/read').catch(() => {});
      setUnread(0);
    }
    e.preventDefault();
  };

  return (
    <Link
      to="/notifications"
      className="bell"
      aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      onClick={open}
    >
      <span className="bell__icon" aria-hidden="true"><IconBell size={18} /></span>
      {unread > 0 && <span className="bell__dot">{unread > 9 ? '9+' : unread}</span>}
    </Link>
  );
}

/* Header for every signed-in page. Links differ by role. */
export function AppShell({ children }) {
  const { user, isTutor, logout } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="app">
      <header className="app-shell">
        <div className="container app-shell__inner">
          <Link to="/" className="app-shell__brand">
            {BRAND}
          </Link>

          <nav className="app-shell__links" aria-label="Account">
            <NavLink to="/browse" className="app-shell__link">
              Browse
            </NavLink>
            <NavLink to="/search" className="app-shell__link">
              Search
            </NavLink>
            <NavLink to={isTutor ? '/teach' : '/dashboard'} className="app-shell__link">
              {isTutor ? 'Teach' : 'My classes'}
            </NavLink>
            {!isTutor && (
              <>
                <NavLink to="/wishlist" className="app-shell__link">
                  Saved
                </NavLink>
                <NavLink to="/certificates" className="app-shell__link">
                  Certificates
                </NavLink>
              </>
            )}
            {isTutor && (
              <>
                <NavLink to="/teach/new" className="app-shell__link">
                  New class
                </NavLink>
                <NavLink to="/earnings" className="app-shell__link">
                  Earnings
                </NavLink>
              </>
            )}
            {user?.is_admin && (
              <NavLink to="/admin" className="app-shell__link">
                Admin
              </NavLink>
            )}
            <NavLink to="/settings" className="app-shell__link">
              Settings
            </NavLink>
          </nav>

          <div className="row">
            <Bell />
            <Link to="/settings" aria-label={`Settings for ${user?.name}`}>
              <Avatar name={user?.name} hue={user?.hue} />
            </Link>
            <button type="button" className="btn btn--quiet btn--sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="app__main">
        <div className="container">{children}</div>
      </main>

      <footer className="app-foot">
        <div className="container row">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/cookies">Cookies</Link>
          <span className="muted">© {new Date().getFullYear()} {BRAND}</span>
        </div>
      </footer>
    </div>
  );
}
