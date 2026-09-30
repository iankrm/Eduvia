import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { get, patch, post, del } from '../lib/api.js';
import { Avatar } from '../components/AppShell.jsx';
import { Alert, Toggle } from '../components/ui.jsx';
import { BRAND } from '../data/content.js';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: user.name,
    headline: user.headline || '',
    bio: user.bio || '',
    expertise: user.tutorProfile?.expertise || '',
    credentials: user.tutorProfile?.credentials || '',
  });
  const [profileMsg, setProfileMsg] = useState('');

  const [settings, setSettings] = useState({
    autoplay: !!user.settings?.autoplay,
    captions: !!user.settings?.captions,
    email_classes: !!user.settings?.email_classes,
    email_essays: !!user.settings?.email_essays,
    marketing: !!user.settings?.marketing,
    theme: user.settings?.theme || 'dark',
    playback_speed: Number(user.settings?.playback_speed) || 1,
  });
  const [settingsMsg, setSettingsMsg] = useState('');

  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  const [billing, setBilling] = useState(null);
  const [sub, setSub] = useState(user.subscription);
  const [billingMsg, setBillingMsg] = useState('');

  const [danger, setDanger] = useState('');
  const [dangerErr, setDangerErr] = useState('');

  const isTutor = user.role === 'tutor';

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme || 'dark';
  }, [settings.theme]);

  const setProfileField = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));

  async function saveProfile(e) {
    e.preventDefault();
    setProfileMsg('');
    try {
      await updateProfile(profile);
      setProfileMsg('Profile saved');
    } catch (err) {
      setProfileMsg('');
      setProfileMsg(`Could not save: ${err.message}`);
    }
  }

  async function saveSetting(patchBody) {
    setSettings((s) => ({ ...s, ...patchBody }));
    setSettingsMsg('Saved');
    setTimeout(() => setSettingsMsg(''), 1500);
    try {
      await patch('/settings', patchBody);
    } catch (err) {
      setSettingsMsg(`Could not save: ${err.message}`);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');
    if (pw.new_password !== pw.confirm) {
      setPwErr('The two new passwords do not match');
      return;
    }
    try {
      await post('/settings/password', {
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      setPwMsg('Password changed');
      setPw({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwErr(err.message);
    }
  }

  async function openPlans() {
    try {
      const r = await get('/billing');
      setBilling(r.plans);
    } catch (err) {
      setBillingMsg(`Could not load plans: ${err.message}`);
    }
  }

  async function choosePlan(plan, last4) {
    setBillingMsg('');
    try {
      const r = await post('/billing/checkout', { plan, card_last4: last4 });
      setSub(r.subscription);
      setBillingMsg(`Switched to the ${plan} plan`);
      setBilling(null);
    } catch (err) {
      setBillingMsg(err.message);
    }
  }

  async function cancelSub() {
    setBillingMsg('');
    try {
      const r = await post('/billing/cancel');
      setSub(r.subscription);
      setBillingMsg('Subscription cancelled');
    } catch (err) {
      setBillingMsg(err.message);
    }
  }

  async function deleteAccount() {
    setDangerErr('');
    if (danger !== 'DELETE') {
      setDangerErr('Type DELETE to confirm');
      return;
    }
    try {
      await del('/settings/account');
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      setDangerErr(err.message);
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Settings</h1>
        <p>{isTutor ? 'Your tutor profile and teaching preferences.' : 'Your account and learning preferences.'}</p>
      </div>

      {/* ------------------------------------------------------- profile */}
      <section className="panel stack stack--tight">
        <div className="row">
          <Avatar name={user.name} hue={user.hue} size="xl" />
          <div>
            <h2 style={{ margin: 0 }}>{user.name}</h2>
            <p className="xcard__meta" style={{ margin: 0 }}>
              {user.email} · {user.role}
            </p>
          </div>
        </div>

        <form className="stack stack--tight" onSubmit={saveProfile}>
          <div className="field">
            <label htmlFor="s-name">Name</label>
            <input id="s-name" required value={profile.name} onChange={setProfileField('name')} />
          </div>
          <div className="field">
            <label htmlFor="s-headline">{isTutor ? 'Discipline' : 'What you do'}</label>
            <input id="s-headline" value={profile.headline} onChange={setProfileField('headline')} />
          </div>
          <div className="field">
            <label htmlFor="s-bio">Bio</label>
            <textarea id="s-bio" value={profile.bio} onChange={setProfileField('bio')} />
          </div>

          {isTutor && (
            <>
              <div className="field">
                <label htmlFor="s-expertise">Expertise</label>
                <input id="s-expertise" value={profile.expertise} onChange={setProfileField('expertise')} />
              </div>
              <div className="field">
                <label htmlFor="s-credentials">Credentials</label>
                <input
                  id="s-credentials"
                  value={profile.credentials}
                  onChange={setProfileField('credentials')}
                />
              </div>
            </>
          )}

          <div className="row">
            <button className="btn" type="submit">
              Save profile
            </button>
            {profileMsg && (
              <span style={{ color: profileMsg.startsWith('Could') ? 'var(--mc-color-red-300)' : 'var(--mc-color-green-300)' }}>
                {profileMsg}
              </span>
            )}
          </div>
        </form>
      </section>

      {/* ---------------------------------------------------- preferences */}
      <section className="panel">
        <h2>{isTutor ? 'Publishing' : 'Playback & email'}</h2>

        {isTutor ? (
          <Toggle
            id="t-marketing"
            label="Show my profile in search"
            hint="Students can find your classes by name."
            checked={settings.marketing}
            onChange={(v) => saveSetting({ marketing: v })}
          />
        ) : (
          <>
            <Toggle
              id="t-autoplay"
              label="Autoplay next lesson"
              hint="Start the following lesson automatically."
              checked={settings.autoplay}
              onChange={(v) => saveSetting({ autoplay: v })}
            />
            <Toggle
              id="t-captions"
              label="Captions by default"
              hint="Turn captions on when a video starts."
              checked={settings.captions}
              onChange={(v) => saveSetting({ captions: v })}
            />
            <Toggle
              id="t-classes"
              label="New class emails"
              hint="When a tutor you follow publishes something."
              checked={settings.email_classes}
              onChange={(v) => saveSetting({ email_classes: v })}
            />
            <Toggle
              id="t-essays"
              label={`The ${BRAND} Essay`}
              hint="Our occasional long-form writing."
              checked={settings.email_essays}
              onChange={(v) => saveSetting({ email_essays: v })}
            />
          </>
        )}

        <div className="setting-row">
          <span className="setting-row__text">
            <label className="setting-row__label" htmlFor="s-speed">
              Default speed
            </label>
            <span className="setting-row__hint">Applied when a lesson starts.</span>
          </span>
          <span className="row">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className="btn btn--quiet btn--sm"
                aria-pressed={settings.playback_speed === s}
                style={
                  settings.playback_speed === s
                    ? { background: 'var(--mc-color-pink-500)', borderColor: 'var(--mc-color-pink-500)' }
                    : undefined
                }
                onClick={() => saveSetting({ playback_speed: s })}
              >
                {s}×
              </button>
            ))}
          </span>
        </div>

        <div className="setting-row">
          <span className="setting-row__text">
            <label className="setting-row__label" htmlFor="s-theme">
              Theme
            </label>
            <span className="setting-row__hint">The app currently renders dark only.</span>
          </span>
          <select
            id="s-theme"
            value={settings.theme}
            onChange={(e) => saveSetting({ theme: e.target.value })}
            style={{
              background: 'var(--mc-color-neutral-1000)',
              color: 'var(--mc-color-text-light)',
              border: '1px solid var(--mc-color-neutral-700)',
              borderRadius: '0.8rem',
              padding: '0.8rem 1.2rem',
              fontSize: '1.4rem',
              fontFamily: 'inherit',
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        {settingsMsg && <p className="setting-row__hint">{settingsMsg}</p>}
      </section>

      {/* ------------------------------------------------------- billing */}
      <section className="panel stack stack--tight">
        <h2>Subscription</h2>
        {sub ? (
          <>
            <p style={{ margin: 0 }}>
              <strong style={{ textTransform: 'capitalize' }}>{sub.plan}</strong> · {sub.status}
              {sub.current_period_end ? ` · renews ${sub.current_period_end}` : ''}
            </p>
            <div className="row">
              <button className="btn btn--quiet btn--sm" onClick={openPlans}>
                Change plan
              </button>
              {sub.status === 'active' && (
                <button className="btn btn--quiet btn--sm" onClick={cancelSub}>
                  Cancel
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: 0 }}>No subscription yet.</p>
            <div className="row">
              <button className="btn btn--sm" onClick={openPlans}>
                See plans
              </button>
            </div>
          </>
        )}

        {billing && (
          <div className="panel stack stack--tight" style={{ background: 'var(--mc-color-neutral-1000)' }}>
            <p className="setting-row__hint" style={{ margin: 0 }}>
              Demo checkout — enter any 4 digits. No card is charged.
            </p>
            {billing.map((p) => (
              <div className="setting-row" key={p.id}>
                <span className="setting-row__text">
                  <span className="setting-row__label" style={{ textTransform: 'capitalize' }}>
                    {p.label}
                  </span>
                  <span className="setting-row__hint">{p.days} days of access</span>
                </span>
                <span className="row">
                  <input
                    aria-label={`${p.label} card last 4 digits`}
                    placeholder="4242"
                    inputMode="numeric"
                    maxLength={4}
                    style={{
                      width: '9rem',
                      background: 'var(--mc-color-neutral-900)',
                      color: 'var(--mc-color-text-light)',
                      border: '1px solid var(--mc-color-neutral-700)',
                      borderRadius: '0.8rem',
                      padding: '0.8rem',
                      fontSize: '1.4rem',
                      fontFamily: 'inherit',
                    }}
                    data-plan-last4={p.id}
                  />
                  <button
                    className="btn btn--sm"
                    onClick={(e) => {
                      const card = e.target.closest('.setting-row').querySelector('input');
                      choosePlan(p.id, card.value);
                    }}
                  >
                    Choose
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        {billingMsg && <p className="setting-row__hint">{billingMsg}</p>}
      </section>

      {/* ------------------------------------------------------ password */}
      <section className="panel stack stack--tight">
        <h2>Password</h2>
        <Alert>{pwErr}</Alert>
        <form className="stack stack--tight" onSubmit={savePassword}>
          <div className="field">
            <label htmlFor="s-cur">Current password</label>
            <input
              id="s-cur"
              type="password"
              autoComplete="current-password"
              required
              value={pw.current_password}
              onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="s-new">New password</label>
            <input
              id="s-new"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={pw.new_password}
              onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="s-confirm">Confirm new password</label>
            <input
              id="s-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>
          <div className="row">
            <button className="btn" type="submit">
              Change password
            </button>
            {pwMsg && <span style={{ color: 'var(--mc-color-green-300)' }}>{pwMsg}</span>}
          </div>
        </form>
      </section>

      {/* --------------------------------------------------- danger zone */}
      <section className="panel stack stack--tight">
        <h2>Delete account</h2>
        <p className="setting-row__hint" style={{ margin: 0 }}>
          {isTutor
            ? 'This removes your profile and every class you have published.'
            : 'This removes your profile, enrolments and progress. It cannot be undone.'}
        </p>
        <Alert>{dangerErr}</Alert>
        <div className="row">
          <input
            aria-label="Type DELETE to confirm"
            placeholder="Type DELETE"
            value={danger}
            onChange={(e) => setDanger(e.target.value)}
            style={{
              width: '16rem',
              background: 'var(--mc-color-neutral-1000)',
              color: 'var(--mc-color-text-light)',
              border: '1px solid var(--mc-color-neutral-700)',
              borderRadius: '0.8rem',
              padding: '1.2rem 1.6rem',
              fontSize: '1.5rem',
              fontFamily: 'inherit',
            }}
          />
          <button className="btn btn--danger" onClick={deleteAccount}>
            Delete my account
          </button>
        </div>
      </section>
    </div>
  );
}
