import { BRAND } from '../data/content.js';

export function Logo({ className = '', onDark = true }) {
  return (
    <span className={`logo ${onDark ? 'logo--on-dark' : ''} ${className}`}>
      <span className="logo__mark" aria-hidden="true">M</span>
      <span className="logo__word">{BRAND}</span>
    </span>
  );
}
