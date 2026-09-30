import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, CLASSES } from '../data/content.js';

const CHEV = {
  prev: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
};

function CarouselNav({ onPrev, onNext, prevLabel, nextLabel }) {
  return (
    <div className="carousel-nav d-none d-lg-flex">
      <button type="button" className="carousel-nav__btn" onClick={onPrev} aria-label={prevLabel}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d={CHEV.prev} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button type="button" className="carousel-nav__btn" onClick={onNext} aria-label={nextLabel}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d={CHEV.next} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export function Trending() {
  const [cat, setCat] = useState('all');
  const trackRef = useRef(null);

  const items = cat === 'all' ? CLASSES : CLASSES.filter((c) => c.category === cat);

  useEffect(() => {
    trackRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [cat]);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <section className="section section--flush" id="trending">
      <div className="container">
        <div className="section__head">
          <h2 className="section__title mc-text-h1">Trending now</h2>
          <CarouselNav
            onPrev={() => scrollBy(-1)}
            onNext={() => scrollBy(1)}
            prevLabel="Previous classes"
            nextLabel="Next classes"
          />
        </div>
      </div>

      <div className="container">
        <ul className="chips" role="tablist" aria-label="Class categories">
          <li role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={cat === 'all'}
              className={`chip ${cat === 'all' ? 'chip--on' : ''}`}
              onClick={() => setCat('all')}
            >
              All
            </button>
          </li>
          {CATEGORIES.map((c) => (
            <li role="presentation" key={c.id}>
              <button
                type="button"
                role="tab"
                aria-selected={cat === c.id}
                className={`chip ${cat === c.id ? 'chip--on' : ''}`}
                onClick={() => setCat(c.id)}
              >
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow">
        <ul className="carousel container" ref={trackRef} tabIndex={-1}>
          {items.map((c) => (
            <li className="carousel__item" key={c.title}>
              <a className="card" href="#checkout">
                <div
                  className="card__art"
                  style={{
                    '--hue': c.hue,
                    backgroundImage: c.image ? `url("${c.image}")` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  aria-hidden="true"
                >
                  <span className="card__play">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                  </span>
                </div>
                <h3 className="card__title mc-text-h6 mc-text--2-lines">{c.title}</h3>
                <p className="card__instructor mc-text-small mc-text--tint">{c.instructor}</p>
                <p className="card__meta mc-text-x-small mc-text--tint">{c.meta}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
