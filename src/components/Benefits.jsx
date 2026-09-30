import { Button } from './Button.jsx';
import { BENEFITS, PLANS } from '../data/content.js';

const ICON_PATHS = [
  'M4 19V9m5 10V5m5 14v-7m5 7V8',
  'M12 3l2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.4 9.4l6-.9z',
  'M12 21a9 9 0 100-18 9 9 0 000 18zm0-13v5l3 2',
];

function BenefitIcon({ index }) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d={ICON_PATHS[index]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Benefits() {
  return (
    <section className="section" id="membership">
      <div className="container">
        <h2 className="section__title mc-text-h1 mc-text-center">What’s in every EduVia membership?</h2>

        <div className="benefits">
          {BENEFITS.map((b, i) => (
            <article className="benefit" key={b.title}>
              <span className="benefit__icon">
                <BenefitIcon index={i} />
              </span>
              <h3 className="benefit__title mc-text-h4">{b.title}</h3>
              <p className="benefit__body mc-text-small mc-text--tint">{b.body}</p>
            </article>
          ))}
        </div>

        <div className="plans" id="checkout">
          {PLANS.map((p) => (
            <article className={`plan ${p.featured ? 'plan--featured' : ''}`} key={p.id}>
              {p.featured && <span className="plan__flag mc-text-x-small">Most popular</span>}

              <h3 className="plan__name mc-text-h5">{p.name}</h3>

              <p className="plan__price">
                <span className="plan__amount mc-text-d3">{p.price}</span>
                <span className="plan__per mc-text-large">{p.per}</span>
              </p>

              <p className="plan__billed mc-text-small mc-text--tint">{p.billed}</p>

              <ul className="plan__perks">
                {p.perks.map((perk) => (
                  <li className="plan__perk mc-text-small" key={perk}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>

              <Button as="a" href="#checkout" variant={p.featured ? 'primary' : 'tertiary'} fullWidth>
                Choose {p.name}
              </Button>
            </article>
          ))}
        </div>

        <p className="plans__note mc-text-small mc-text-center mc-text--tint">
          30-day money-back guarantee. Cancel any time.
        </p>
      </div>
    </section>
  );
}
