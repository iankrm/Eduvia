import { useState } from 'react';
import { FAQS } from '../data/content.js';

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section" id="faq">
      <div className="container">
        <h2 className="section__title mc-text-h1 mc-text-center">Frequently asked questions</h2>

        <div className="faq">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div className={`faq__item ${isOpen ? 'faq__item--open' : ''}`} key={f.q}>
                <h3 className="faq__heading">
                  <button
                    type="button"
                    className="faq__trigger"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-trigger-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span className="faq__q mc-text-large">{f.q}</span>
                    <span className="faq__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                          d="M12 5v14M5 12h14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          style={{
                            transform: isOpen ? 'rotate(90deg)' : 'none',
                            transition: 'transform .25s ease',
                          }}
                        />
                      </svg>
                    </span>
                  </button>
                </h3>

                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  className="faq__panel"
                  hidden={!isOpen}
                >
                  <p className="faq__a mc-text-small mc-text--tint">{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
