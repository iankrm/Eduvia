import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button.jsx';
import { BRAND, FOOTER_COLUMNS, STICKY_VERBS } from '../data/content.js';

export function StickyCta() {
  const [shown, setShown] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!shown) return;
    const id = setInterval(() => setI((n) => (n + 1) % STICKY_VERBS.length), 2200);
    return () => clearInterval(id);
  }, [shown]);

  return (
    <div className={`sticky ${shown ? 'sticky--on' : ''}`} aria-hidden={!shown}>
      <div className="container sticky__inner">
        <p className="sticky__text mc-text-small d-none d-md-block">
          Learn while you <span className="sticky__verb">{STICKY_VERBS[i]}</span>
        </p>
        <div className="sticky__actions">
          <Button as="a" href="#membership" size="sm">
            7 days free
          </Button>
          <Button as={Link} to="/checkout" variant="tertiary" size="sm" className="d-md-none">
            Subscribe
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="footer" id="login">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a href="#top" className="footer__logo" aria-label={`${BRAND} home`}>
              <span className="logo logo--on-dark">
                <svg className="logo__mark" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path
                    d="M12 0.5 L14.4 8.1 L22.5 4.6 L18.4 12.4 L24 16.2 L16.2 17.1 L16.9 25.1 L11.6 19.2 L6.2 25.1 L6.9 17.1 L-0.9 16.2 L4.7 12.4 L0.6 4.6 L8.7 8.1 Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="logo__word">{BRAND}</span>
              </span>
            </a>
            <p className="footer__tagline mc-text-small mc-text--tint">Learn anything. From the best.</p>
          </div>

          <nav className="footer__nav" aria-label="Footer">
            {FOOTER_COLUMNS.map((col) => (
              <div className="footer__group" key={col.title}>
                <h3 className="footer__group-title mc-text-x-small mc-text--uppercase">{col.title}</h3>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="footer__link mc-text-small">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer__legal">
          <p className="mc-text-x-small mc-text--tint">
            © {new Date().getFullYear()} {BRAND}. All rights reserved.
          </p>
          <p className="mc-text-x-small mc-text--tint">Recreated as a design study.</p>
        </div>
      </div>
    </footer>
  );
}
