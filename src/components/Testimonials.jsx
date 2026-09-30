import { useRef } from 'react';
import { TESTIMONIALS } from '../data/content.js';

const CHEV = {
  prev: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
};

export function Testimonials() {
  const trackRef = useRef(null);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.7), behavior: 'smooth' });
  };

  return (
    <section className="section section--flush">
      <div className="container">
        <div className="section__head">
          <h2 className="section__title mc-text-h1">What members say</h2>
          <div className="carousel-nav d-none d-lg-flex">
            <button type="button" className="carousel-nav__btn" onClick={() => scrollBy(-1)} aria-label="Previous testimonial">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d={CHEV.prev} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="carousel-nav__btn" onClick={() => scrollBy(1)} aria-label="Next testimonial">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d={CHEV.next} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow">
        <ul className="carousel container" ref={trackRef} tabIndex={-1}>
          {TESTIMONIALS.map((t) => (
            <li className="carousel__item" key={t.name}>
              <figure className="quote">
                <span className="quote__mark" aria-hidden="true">“</span>
                <blockquote className="quote__text mc-text-large">{t.quote}</blockquote>
                <figcaption className="quote__by">
                  <span className="quote__avatar" style={{ '--hue': t.hue }} aria-hidden="true">
                    {t.name[0]}
                  </span>
                  <span>
                    <span className="quote__name mc-text-small">{t.name}</span>
                    <span className="quote__role mc-text-x-small mc-text--tint">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
