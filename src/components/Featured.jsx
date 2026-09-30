import { Button } from './Button.jsx';
import { FEATURED } from '../data/content.js';

export function Featured() {
  const f = FEATURED;

  return (
    <section className="section section--flush" id="trailer">
      <div className="container">
        <div className="featured">
          <div className="featured__art">
            <div
              className="featured__portrait"
              role="img"
              aria-label={`${f.name}, ${f.field}`}
              style={f.image ? { backgroundImage: `url("${f.image}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!f.image && (
                <span className="featured__monogram" aria-hidden="true">
                  {f.name.split(' ').map((w) => w[0]).join('')}
                </span>
              )}
              <span className="featured__play" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="26" height="26">
                  <path d="M8 5v14l11-7z" fill="currentColor" />
                </svg>
              </span>
            </div>
          </div>

          <div className="featured__copy">
            <p className="eyebrow mc-text-x-small mc-text--uppercase mc-text--tint">{f.eyebrow}</p>

            <h2 className="featured__title mc-text-d1">
              {f.title.split('\n').map((line) => (
                <span className="featured__title-line" key={line}>
                  {line}
                </span>
              ))}
            </h2>

            <p className="featured__byline mc-text-large">
              {f.name}{' '}
              <span className="mc-text--tint">· {f.field}</span>
            </p>

            <p className="featured__body mc-text-large mc-text--tint">{f.body}</p>

            <dl className="featured__meta">
              <div>
                <dt className="mc-text-x-small mc-text--uppercase mc-text--tint">Lessons</dt>
                <dd className="mc-text-h6">{f.lessons}</dd>
              </div>
              <div>
                <dt className="mc-text-x-small mc-text--uppercase mc-text--tint">Runtime</dt>
                <dd className="mc-text-h6">{f.runtime}</dd>
              </div>
            </dl>

            <Button as="a" href="#checkout" size="lg">
              {f.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
