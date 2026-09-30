import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { RedirectIfAuthed } from '../components/Guards.jsx';
import { Alert } from '../components/ui.jsx';

const ROLES = [
  {
    value: 'student',
    title: "I'm a student",
    desc: 'Take classes, track your progress, and manage your membership.',
  },
  {
    value: 'tutor',
    title: "I'm a tutor",
    desc: 'Publish classes, mentor students, and grow your teaching business.',
  },
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    headline: '',
    expertise: '',
    credentials: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await signup({ ...form, role });
      navigate(user.role === 'tutor' ? '/teach' : '/dashboard', { replace: true });
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
          <p className="auth__eyebrow">Start learning</p>
          <h2>One account. Two ways to grow.</h2>
          <p>
            Choose your path and unlock a learner-first platform built for ambitious people who want to sharpen their craft.
          </p>
        </aside>

        <div className="auth__panel">
          <form className="auth__form" onSubmit={onSubmit} noValidate>
            <h1>Create your EduVia account</h1>
            <p className="auth__sub">Already have one? <Link to="/login">Sign in</Link></p>

            <Alert>{error}</Alert>

            <fieldset className="auth__fieldset">
              <legend>I am joining as</legend>
              <div className="role-grid">
                {ROLES.map((r) => (
                  <label className="role-option" key={r.value}>
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={() => setRole(r.value)}
                    />
                    <span className="role-option__card">
                      <span className="role-option__title">{r.title}</span>
                      <span className="role-option__desc">{r.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" autoComplete="name" required value={form.name} onChange={set('name')} />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set('email')}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
              />
              <span className="field__hint">At least 8 characters.</span>
            </div>

            <div className="field">
              <label htmlFor="headline">{role === 'tutor' ? 'Your discipline' : 'What you do'}</label>
              <input
                id="headline"
                name="headline"
                placeholder={role === 'tutor' ? 'Filmmaker' : 'Product designer'}
                value={form.headline}
                onChange={set('headline')}
              />
            </div>

            {role === 'tutor' && (
              <>
                <div className="field">
                  <label htmlFor="expertise">Expertise</label>
                  <input
                    id="expertise"
                    name="expertise"
                    placeholder="Directing, cinematography"
                    value={form.expertise}
                    onChange={set('expertise')}
                  />
                </div>
                <div className="field">
                  <label htmlFor="credentials">Credentials</label>
                  <input
                    id="credentials"
                    name="credentials"
                    placeholder="BA Film, AFI alumni"
                    value={form.credentials}
                    onChange={set('credentials')}
                  />
                </div>
              </>
            )}

            <button className="btn btn--block" type="submit" disabled={busy}>
              {busy ? 'Creating…' : role === 'tutor' ? 'Create tutor account' : 'Create student account'}
            </button>
          </form>
        </div>
      </div>
    </RedirectIfAuthed>
  );
}
