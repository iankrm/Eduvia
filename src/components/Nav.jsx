import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './Button.jsx';
import { Logo } from './Logo.jsx';
import { BRAND, NAV_LINKS } from '../data/content.js';
import { useAuth } from '../context/AuthContext.jsx';
import { IconChevronDown, IconSearch } from './Icons.jsx';

export function Nav() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [term, setTerm] = useState('');
  const { user, loading, logout, isTutor } = useAuth();
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const onSignOut = async () => {
    await logout();
    setOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div className="promo-strip">
        <div className="container d-flex justify-content-between align-items-center">
          <p className="promo-strip__text mc-text-small">
            <span className="promo-strip__badge">New</span>
            7 days free, then $10/mo. Cancel anytime.
          </p>
          <Button as="a" href="#membership" size="sm" className="promo-strip__cta">
            Start Free Trial
          </Button>
        </div>
      </div>

      <header className={`nav ${stuck ? 'nav--stuck' : ''}`}>
        <div className="container nav__inner">
          <div className="nav__left">
            <a href="#top" className="nav__brand" aria-label={`${BRAND} home`}>
              <Logo />
            </a>

            <Link to="/browse" className="nav__browse c-button c-button--secondary c-button--sm">
              Browse <IconChevronDown size={16} />
            </Link>

            <form className="nav__search" role="search" onSubmit={onSearch}>
              <IconSearch size={18} />
              <label className="sr-only" htmlFor="nav-search">
                Search classes and instructors
              </label>
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="What do you want to learn today?"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </form>
          </div>

          <div className="nav__right">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nav__link mc-text-small">
                {l.label}
              </a>
            ))}
            {!loading &&
              (user ? (
                <>
                  <Link to="/browse" className="nav__link mc-text-small">
                    Browse
                  </Link>
                  <Link to="/notifications" className="nav__link mc-text-small">
                    Notifications
                  </Link>
                  <Link to="/wishlist" className="nav__link mc-text-small">
                    Saved
                  </Link>
                  <Link to="/billing" className="nav__link mc-text-small">
                    Billing
                  </Link>
                  <Link to="/support" className="nav__link mc-text-small">
                    Help
                  </Link>
                  <Button
                    as={Link}
                    to={isTutor ? '/teach' : '/dashboard'}
                    size="sm"
                    variant="secondary"
                    className="nav__link--button"
                  >
                    Dashboard
                  </Button>
                  <Button size="sm" variant="tertiary" className="nav__link--button" onClick={onSignOut}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav__link mc-text-small">
                    Log in
                  </Link>
                  <Button as={Link} to="/signup" size="sm" className="nav__link--button">
                    Sign up
                  </Button>
                </>
              ))}
            <Button as="a" href="#membership" size="sm" className="nav__cta">
              Get {BRAND}
            </Button>
            <button
              type="button"
              className="nav__burger c-button c-button--tertiary c-button--sm c-button--symmetrical d-lg-none"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                {open ? (
                  <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-nav" className={`mobile-nav ${open ? 'mobile-nav--open' : ''}`}>
        <nav className="mobile-nav__links" aria-label="Mobile">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="mobile-nav__link mc-text-h3" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <Button as="a" href="#membership" fullWidth className="mc-my-8">
            Start free trial
          </Button>
          {!loading &&
            (user ? (
              <>
                <Link to="/browse" className="mobile-nav__link mc-text-h3" onClick={() => setOpen(false)}>
                  Browse
                </Link>
                <Link to="/notifications" className="mobile-nav__link mc-text-h3" onClick={() => setOpen(false)}>
                  Notifications
                </Link>
                <Link to="/wishlist" className="mobile-nav__link mc-text-h3" onClick={() => setOpen(false)}>
                  Saved
                </Link>
                <Link to="/billing" className="mobile-nav__link mc-text-h3" onClick={() => setOpen(false)}>
                  Billing
                </Link>
                <Link to="/support" className="mobile-nav__link mc-text-h3" onClick={() => setOpen(false)}>
                  Help
                </Link>
                <Button
                  as={Link}
                  to={isTutor ? '/teach' : '/dashboard'}
                  variant="secondary"
                  fullWidth
                  className="nav__link--button mc-my-8"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Button>
                <Button variant="tertiary" fullWidth className="nav__link--button" onClick={onSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-nav__link mc-text-h3" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Button
                  as={Link}
                  to="/signup"
                  fullWidth
                  className="nav__link--button mc-my-8"
                  onClick={() => setOpen(false)}
                >
                  Sign up
                </Button>
              </>
            ))}
        </nav>
      </div>
    </>
  );
}
