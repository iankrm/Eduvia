import { useState } from 'react';
import { Button } from './Button.jsx';
import { HERO, MOSAIC_COLUMNS } from '../data/content.js';
import { Quiz } from './Quiz.jsx';

function MosaicCard({ person }) {
  return (
    <article className="mosaic__card">
      <div
        className="mosaic__portrait"
        style={{ '--hue': person.hue }}
        role="img"
        aria-label={`${person.name}, ${person.field}`}
      >
        {person.image ? (
          <img className="mosaic__image" src={person.image} alt={`${person.name}`} />
        ) : (
          <span className="mosaic__monogram" aria-hidden="true">
            {person.name.split(' ').map((w) => w[0]).join('')}
          </span>
        )}
      </div>
      <div className="mosaic__meta">
        <h3 className="mosaic__name mc-text-h8">{person.name}</h3>
        <p className="mosaic__field mc-text-x-small">{person.field}</p>
      </div>
    </article>
  );
}

/* Each column duplicates its group end to end so the -50% keyframe loops
   seamlessly. Duration/delay/reverse are set inline so the two columns
   counter-scroll against each other. */
function MosaicColumn({ people, duration, delay, paused, reverse }) {
  return (
    <div className="mosaic__col">
      <div
        className="mosaic__track"
        style={{
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          animationDirection: reverse ? 'reverse' : 'normal',
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {[0, 1].map((copy) => (
          <div className="mosaic__group" aria-hidden={copy === 1} key={copy}>
            {people.map((p) => (
              <MosaicCard key={p.name} person={p} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="hero" id="top">
      <div className="container hero__shell">
        <div className="row hero__row">
          <div className="col-12 col-md-7 col-lg-6 hero__copy">
            <h1 className="hero__title mc-text-d2">
              {HERO.title.map((line) => (
                <span className="hero__title-line" key={line}>
                  {line}
                </span>
              ))}
            </h1>

            <p className="hero__sub mc-text-large mc-text--balance">{HERO.sub}</p>

            <div className="hero__pricing">
              <span className="hero__price mc-text-h3">{HERO.price}</span>
              <span className="hero__price-note mc-text-small">{HERO.priceNote}</span>
            </div>

            <div className="hero__ctas">
              <Button as="a" href="#membership" size="lg">
                {HERO.cta}
              </Button>
              <Button as="a" href="#trailer" variant="tertiary" size="lg" className="c-button--with-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
                <span>{HERO.secondaryCta}</span>
              </Button>
            </div>

            <p className="hero__guarantee mc-text-small">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8.5 12.2l2.4 2.4 4.6-4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {HERO.guarantee}
            </p>
          </div>

          <div className="col-12 col-md-4 col-lg-6 hero__mosaic-wrap">
            <div className="mosaic" id="instructors">
              <MosaicColumn people={MOSAIC_COLUMNS[0]} duration={100} delay={0} paused={paused} />
              <MosaicColumn people={MOSAIC_COLUMNS[1]} duration={100} delay={-50} paused={paused} reverse />
            </div>

            <button
              type="button"
              className="mosaic__control c-button c-button--tertiary c-button--sm c-button--symmetrical"
              onClick={() => setPaused((v) => !v)}
              aria-pressed={paused}
              aria-label={paused ? 'Resume instructor carousel' : 'Pause instructor carousel'}
            >
              {paused ? (
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <Quiz />
    </section>
  );
}
