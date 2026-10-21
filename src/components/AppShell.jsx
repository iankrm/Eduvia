import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { get, post } from '../lib/api.js';
import { BRAND, FOOTER_COLUMNS } from '../data/content.js';
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

export function AppShell({ children }) {
  const { user, isTutor, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  async function signOut() {
    setProfileOpen(false);
    await logout();
    navigate('/', { replace: true });
  }

  const primaryLinks = [
    { to: '/browse', label: 'Browse' },
    { to: '/search', label: 'Search' },
    { to: isTutor ? '/teach' : '/dashboard', label: isTutor ? 'Teach' : 'My classes' },
  ];

  const accountLinks = [
    { to: '/settings', label: 'Profile' },
    { to: '/settings/preferences', label: 'Preferences' },
    { to: '/settings/password', label: 'Change password' },
    { to: '/billing', label: 'Billing' },
    { to: '/support', label: 'Help center' },
    ...(isTutor
      ? [
          { to: '/teach/new', label: 'New class' },
          { to: '/earnings', label: 'Earnings' },
        ]
      : [
          { to: '/wishlist', label: 'Saved' },
          { to: '/certificates', label: 'Certificates' },
        ]),
    ...(user?.is_admin ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="app">
      <header className="app-shell">
        <div className="container app-shell__inner">
          <Link to="/" className="app-shell__brand" aria-label={`${BRAND} home`}>
            <img src="/logo.svg" alt={`${BRAND} logo`} />
          </Link>

          <nav className="app-shell__links" aria-label="Primary navigation">
            {primaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className="app-shell__link">
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="app-shell__actions">
            <Bell />

            <div className="profile-menu">
              <button
                type="button"
                className="profile-menu__trigger"
                aria-label="Open account menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((v) => !v)}
              >
                <Avatar name={user?.name} hue={user?.hue} />
              </button>

              {profileOpen && (
                <div className="profile-menu__panel" role="menu" aria-label="Account menu">
                  <div className="profile-menu__header">
                    <span>Signed in as</span>
                    <strong>{user?.name || 'Account'}</strong>
                  </div>
                  {accountLinks.map((link) => (
                    <NavLink key={link.to} to={link.to} className="profile-menu__item" role="menuitem">
                      {link.label}
                    </NavLink>
                  ))}
                  <button type="button" className="profile-menu__item profile-menu__item--danger" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      <main className="app__main">
        <div className="container">{children}</div>
      </main>

      <footer className="app-foot">
        <div className="container">
          <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: '2.4rem', flexWrap: 'wrap' }}>
            <div className="app-foot__brand" style={{ minWidth: '20rem' }}>
              <Link to="/" aria-label={`${BRAND} home`}>
                <img src="/logo.svg" alt={`${BRAND} logo`} style={{ width: '12rem', height: 'auto' }} />
              </Link>
              <p className="muted" style={{ marginTop: '1rem', maxWidth: '24rem' }}>
                Learn anything. From the best.
              </p>
            </div>

            <nav className="row" aria-label="Footer" style={{ gap: '3.2rem', flexWrap: 'wrap' }}>
              {FOOTER_COLUMNS.map((col) => (
                <div key={col.title}>
                  <p style={{ margin: '0 0 1rem', color: 'var(--mc-color-text-tint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '1.1rem' }}>
                    {col.title}
                  </p>
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {col.links.map((link) => (
                      <Link key={link.label} to={link.to} style={{ marginRight: 0 }}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="row" style={{ justifyContent: 'space-between', marginTop: '2.4rem', gap: '1.2rem', flexWrap: 'wrap' }}>
            <span className="muted">© {new Date().getFullYear()} {BRAND}. All rights reserved.</span>
            <span className="muted">Recreated as a design study.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
