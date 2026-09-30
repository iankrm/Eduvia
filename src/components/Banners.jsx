import { Button } from './Button.jsx';
import { BUSINESS, CERTIFICATES, JOURNEY } from '../data/content.js';

export function Journey() {
  return (
    <section className="section section--flush">
      <div className="container">
        <div className="journey">
          <div className="journey__copy">
            <h2 className="journey__title mc-text-d1">{JOURNEY.title}</h2>
            <p className="journey__body mc-text-large mc-text--tint">{JOURNEY.body}</p>
            <Button as="a" href="#checkout" size="lg">
              {JOURNEY.cta}
            </Button>
          </div>

          <div className="journey__art" aria-hidden="true">
            <div className="journey__ring journey__ring--a" />
            <div className="journey__ring journey__ring--b" />
            <div className="journey__ring journey__ring--c" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Certificates() {
  return (
    <section className="section section--flush">
      <div className="container">
        <div className="split">
          <div className="split__art" aria-hidden="true">
            <div className="cert">
              <div className="cert__inner">
                <span className="cert__wordmark">EduVia</span>
                <span className="cert__label mc-text-x-small mc-text--uppercase">Certificate of Completion</span>
                <span className="cert__rule" />
                <span className="cert__name mc-text-h5">A. Student</span>
                <span className="cert__course mc-text-small">for completing The Art of the Short Story</span>
                <span className="cert__seal" />
              </div>
            </div>
          </div>

          <div className="split__copy">
            <h2 className="mc-text-d1">{CERTIFICATES.title}</h2>
            <p className="split__body mc-text-large mc-text--tint">{CERTIFICATES.body}</p>
            <Button as="a" href="#trending" variant="tertiary" size="lg">
              {CERTIFICATES.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Business() {
  return (
    <section className="section section--tint" id="teams">
      <div className="container">
        <div className="split split--reverse">
          <div className="split__art" aria-hidden="true">
            <div className="bignum">
              <span className="bignum__value mc-text-d1">{BUSINESS.stats[0].value}</span>
              <span className="bignum__label mc-text-small mc-text--uppercase">{BUSINESS.stats[0].label}</span>
            </div>
          </div>

          <div className="split__copy">
            <p className="eyebrow mc-text-x-small mc-text--uppercase mc-text--tint">{BUSINESS.eyebrow}</p>

            <h2 className="mc-text-d1">
              {BUSINESS.title.split('\n').map((line) => (
                <span className="split__title-line" key={line}>
                  {line}
                </span>
              ))}
            </h2>

            <p className="split__body mc-text-large mc-text--tint">{BUSINESS.body}</p>

            <dl className="stats">
              {BUSINESS.stats.map((s) => (
                <div className="stats__item" key={s.label}>
                  <dt className="stats__label mc-text-x-small mc-text--uppercase mc-text--tint">{s.label}</dt>
                  <dd className="stats__value mc-text-h3">{s.value}</dd>
                </div>
              ))}
            </dl>

            <Button as="a" href="#contact" size="lg">
              {BUSINESS.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
