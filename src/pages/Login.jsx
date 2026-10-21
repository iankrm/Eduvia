import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { RedirectIfAuthed } from '../components/Guards.jsx';
import { Alert } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = location.state?.from;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      if (from) navigate(from, { replace: true });
      else navigate(user.role === 'tutor' ? '/teach' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RedirectIfAuthed>
      <div className="auth">
        <aside className="auth__aside">
          <div>
            <p className="auth__eyebrow">Welcome back</p>
            <h2>Continue building your next skill.</h2>
            <p>Pick up right where you left off with your classes, progress, and certificates.</p>
          </div>

          <div className="auth__stats" aria-label="Learning highlights">
            <div className="auth__stat">
              <strong>12k+</strong>
              <span>lessons</span>
            </div>
            <div className="auth__stat">
              <strong>4.9/5</strong>
              <span>average rating</span>
            </div>
            <div className="auth__stat">
              <strong>1:1</strong>
              <span>mentor feedback</span>
            </div>
          </div>

          <ul className="auth__feature-list">
            <li>Track your learning streak and resume anywhere.</li>
            <li>Follow curated paths designed for real-world growth.</li>
            <li>Earn certificates that help you stand out.</li>
          </ul>
        </aside>

        <div className="auth__panel">
          <form className="auth__form" onSubmit={onSubmit} noValidate>
            <h1>Sign in to Elevora</h1>
            <p className="auth__sub">
              New here? <Link to="/signup">Create an account</Link>
            </p>

            <Alert>{error}</Alert>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="auth__actions">
              <button className="btn btn--block" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
              <Link className="btn btn--block btn--quiet" to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <div className="auth__demo">
              <p>Demo accounts <span>(password: password123)</span></p>
              <ul>
                <li><strong>Student</strong> — student@iankrm.test</li>
                <li><strong>Tutor</strong> — kenji@iankrm.test</li>
                <li><strong>Admin</strong> — admin@iankrm.test</li>
              </ul>
            </div>
          </form>
        </div>
      </div>
    </RedirectIfAuthed>
  );
}
