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
                <img src="/logo.svg" alt={`${BRAND} logo`} className="logo__image" />
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
