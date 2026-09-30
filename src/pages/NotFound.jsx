import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="app">
      <div className="app__main">
        <div className="container">
          <div className="empty">
            <p style={{ fontSize: '4.8rem', color: 'var(--mc-color-text-light)', margin: 0 }}>404</p>
            <p>That page does not exist.</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link className="btn" to="/">
                Back to the homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
