import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, post } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Spinner } from '../components/ui.jsx';
import { BRAND } from '../data/content.js';

const BLURB = {
  monthly: 'Cancel any time.',
  annual: 'Two months free versus monthly.',
  family: 'Up to six profiles.',
};

export default function Checkout() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState(null);
  const [plan, setPlan] = useState('annual');
  const [last4, setLast4] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get('/billing')
      .then((r) => setPlans(r.plans))
      .catch((e) => setError(e.message));
  }, []);

  async function pay(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await post('/billing/checkout', { plan, card_last4: last4 });
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!plans) return <Spinner label="Loading plans" />;

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Join {BRAND}</h1>
        <p>Every plan unlocks the whole library.</p>
      </div>

      <Alert>{error}</Alert>

      <form className="panel stack" onSubmit={pay}>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: '1.3rem', color: 'var(--mc-color-text-medium)', padding: 0, marginBottom: '1.2rem' }}>
            Choose a plan
          </legend>
          <div className="role-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))' }}>
            {plans.map((p) => (
              <label className="role-option" key={p.id}>
                <input
                  type="radio"
                  name="plan"
                  value={p.id}
                  checked={plan === p.id}
                  onChange={() => setPlan(p.id)}
                />
                <span className="role-option__card">
                  <span className="role-option__title" style={{ textTransform: 'capitalize' }}>
                    {p.label}
                  </span>
                  <span className="role-option__desc">{BLURB[p.id]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="card">Card — last 4 digits</label>
          <input
            id="card"
            inputMode="numeric"
            maxLength={4}
            placeholder="4242"
            required
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
          />
          <span className="field__hint">
            Demo checkout. No card is charged and nothing leaves your browser.
          </span>
        </div>

        <button className="btn btn--block" type="submit" disabled={busy}>
          {busy ? 'Activating…' : `Start ${plan}`}
        </button>

        <p className="setting-row__hint" style={{ margin: 0, textAlign: 'center' }}>
          Signed in as {user.email}. <Link to="/settings">Change plan later in settings.</Link>
        </p>
      </form>
    </div>
  );
}
