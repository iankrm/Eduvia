import { useState } from 'react';
import { Button } from './Button.jsx';
import { EMAIL } from '../data/content.js';

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <section className="section section--tint" id="contact">
      <div className="container">
        <div className="email">
          <div className="email__copy">
            <h2 className="mc-text-d1">{EMAIL.title}</h2>
            <p className="email__body mc-text-large mc-text--tint">{EMAIL.body}</p>
          </div>

          {done ? (
            <p className="email__done mc-text-large mc-animate-fade-in" role="status">
              Thanks — you’re on the list.
            </p>
          ) : (
            <form
              className="email__form"
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setDone(true);
              }}
            >
              <label className="mc-sr-only" htmlFor="email">
                {EMAIL.placeholder}
              </label>
              <input
                id="email"
                className="c-input email__input"
                type="email"
                required
                autoComplete="email"
                placeholder={EMAIL.placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" size="lg" className="email__submit">
                {EMAIL.cta}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
