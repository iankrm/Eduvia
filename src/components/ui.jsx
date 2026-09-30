import { Link } from 'react-router-dom';

/* Format seconds as 1h 24m / 48m. */
export function runtime(seconds = 0) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function Spinner({ label = 'Loading' }) {
  return <div className="spinner" role="status" aria-label={label} />;
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <p style={{ fontSize: '1.8rem', color: 'var(--mc-color-text-light)', marginTop: 0 }}>{title}</p>
      {children}
    </div>
  );
}

export function Bar({ percent = 0 }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="bar"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped}% complete`}
    >
      <span style={{ width: `${clamped}%` }} />
    </div>
  );
}

/* Catalogue card. `to` decides whether it links out or is used as a row.
   When `footer` holds interactive controls the link cannot wrap the whole
   card (a button inside an anchor is invalid and swallows the click), so the
   footer is pulled out into its own block below the link. */
export function ClassCard({ klass, to, footer }) {
  const info = (
    <>
      <span className="badge">{klass.category}</span>
      <h3 className="xcard__title">{klass.title}</h3>
      {klass.subtitle && <p className="xcard__meta">{klass.subtitle}</p>}
      <p className="xcard__meta">
        {klass.tutor_name}
        {klass.lessonCount ? ` · ${klass.lessonCount} lessons` : ''}
        {klass.runtimeSeconds ? ` · ${runtime(klass.runtimeSeconds)}` : ''}
      </p>
    </>
  );

  if (footer) {
    return (
      <div className="xcard">
        {to ? (
          <Link className="xcard__hit" to={to}>
            <div className="xcard__art" style={{ '--card-hue': klass.hue }}>
              {klass.title?.charAt(0)}
            </div>
            <div className="xcard__body">{info}</div>
          </Link>
        ) : (
          <>
            <div className="xcard__art" style={{ '--card-hue': klass.hue }}>
              {klass.title?.charAt(0)}
            </div>
            <div className="xcard__body">{info}</div>
          </>
        )}
        <div className="xcard__foot">{footer}</div>
      </div>
    );
  }

  const body = (
    <>
      <div className="xcard__art" style={{ '--card-hue': klass.hue }}>
        {klass.title?.charAt(0)}
      </div>
      <div className="xcard__body">{info}</div>
    </>
  );

  if (to) {
    return (
      <Link className="xcard" to={to}>
        {body}
      </Link>
    );
  }
  return <div className="xcard">{body}</div>;
}

/* Toggle row used across Settings. */
export function Toggle({ label, hint, checked, onChange, id }) {
  return (
    <div className="setting-row">
      <span className="setting-row__text">
        <label className="setting-row__label" htmlFor={id}>
          {label}
        </label>
        {hint && <span className="setting-row__hint">{hint}</span>}
      </span>
      <span className="switch">
        <input
          id={id}
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch__track" />
      </span>
    </div>
  );
}

/* Read-only star row. `showValue` adds the numeric average next to it. */
export function Stars({ value = 0, count, showValue = false, size = 'md' }) {
  const rounded = Math.round(value);
  return (
    <span className={`stars stars--${size}`}>
      <span aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rounded ? 'stars__on' : 'stars__off'}>
            ★
          </span>
        ))}
      </span>
      <span className="sr-only">
        {value ? `${value} out of 5 stars` : 'Not yet rated'}
        {count ? ` from ${count} review${count === 1 ? '' : 's'}` : ''}
      </span>
      {showValue && value > 0 && (
        <span className="stars__value" aria-hidden="true">
          {value.toFixed(1)}
          {count ? ` (${count})` : ''}
        </span>
      )}
    </span>
  );
}

/* Interactive 1-5 picker used by the review form. */
export function StarPicker({ value, onChange, id = 'rating' }) {
  return (
    <div className="star-picker" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          className={`star-picker__btn ${n <= value ? 'stars__on' : 'stars__off'}`}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
      <span className="star-picker__label">
        {value ? `${value} of 5` : 'Pick a rating'}
      </span>
      <input type="hidden" id={id} name="rating" value={value} readOnly />
    </div>
  );
}

/* Inline counter of unread notifications, hidden when zero. */
export function Badge2({ children }) {
  if (!children) return null;
  return <span className="badge2">{children}</span>;
}
