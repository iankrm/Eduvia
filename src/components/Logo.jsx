import { BRAND } from '../data/content.js';

export function Logo({ className = '', onDark = true }) {
  return (
    <span className={`logo ${onDark ? 'logo--on-dark' : ''} ${className}`}>
      <img
        src="/logo.svg"
        alt={`${BRAND} logo`}
        className="logo__image"
        width="138"
        height="42"
      />
    </span>
  );
}
