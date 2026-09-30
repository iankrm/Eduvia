import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { get, post } from '../lib/api.js';
import { Alert, Spinner } from '../components/ui.jsx';
import { BRAND } from '../data/content.js';

/* POST /api/auth/forgot-password */
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [devLink, setDevLink] = useState('');

  useEffect(() => {
    document.title = `Reset your password | ${BRAND}`;
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setDevLink('');
    try {
      await post('/auth/forgot-password', { email });
      setSent(true);
      // No mail transport in this build, so surface the link for local use.
      if (import.meta.env.DEV) {
        try {
          const d = await get(`/auth/token-debug/reset?email=${encodeURIComponent(email)}`);
          setDevLink(d.token);
        } catch {
          /* account may not exist; the generic message still stands */
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__panel">
        <h1>Forgot your password?</h1>
        <p className="auth__sub">
          Enter your email and we will send you a link to choose a new one.
        </p>

        {error && <Alert>{error}</Alert>}

        {sent ? (
          <div className="stack">
            <Alert kind="ok">
              If that email exists, a reset link is on its way. It expires in 60 minutes.
            </Alert>
            {devLink && (
              <Alert kind="ok">
                <span className="muted">Development only — no mail server configured:</span>
                <br />
                <Link to={`/reset-password?token=${devLink}`}>Open the reset link</Link>
              </Alert>
            )}
            <Link className="btn btn--block" to="/login">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="stack" onSubmit={submit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn btn--block" type="submit" disabled={busy}>
              {busy ? <Spinner label="Sending" /> : 'Send reset link'}
            </button>
            <Link className="btn btn--block btn--quiet" to="/login">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

/* POST /api/auth/reset-password */
export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = `Choose a new password | ${BRAND}`;
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Those passwords do not match');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await post('/auth/reset-password', { token, password });
      navigate('/login', { replace: true, state: { justReset: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="auth">
        <div className="auth__panel">
          <h1>Reset link missing</h1>
          <Alert>This page needs the token from your reset email.</Alert>
          <Link className="btn btn--block" to="/forgot-password">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth__panel">
        <h1>Choose a new password</h1>
        <p className="auth__sub">At least 8 characters.</p>
        {error && <Alert>{error}</Alert>}
        <form className="stack" onSubmit={submit}>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button className="btn btn--block" type="submit" disabled={busy}>
            {busy ? <Spinner label="Saving" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* GET /api/auth/verify-email?token= */
export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState('working');
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = `Verify your email | ${BRAND}`;
    let cancelled = false;

    if (!token) {
      setState('error');
      setError('This page needs the token from your verification email.');
      return undefined;
    }

    get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => !cancelled && setState('done'))
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="auth">
      <div className="auth__panel">
        <h1>Email verification</h1>
        {state === 'working' && <Spinner label="Verifying" />}
        {state === 'done' && (
          <>
            <Alert kind="ok">Your email is verified. Thanks!</Alert>
            <Link className="btn btn--block" to="/dashboard">
              Go to your dashboard
            </Link>
          </>
        )}
        {state === 'error' && (
          <>
            <Alert>{error}</Alert>
            <Link className="btn btn--block" to="/settings">
              Resend from settings
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
