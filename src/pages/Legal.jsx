import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../data/content.js';

const UPDATED = 'Last updated 1 September 2026';

function Legal({ title, intro, sections, children }) {
  useEffect(() => {
    document.title = `${title} | ${BRAND}`;
  }, [title]);

  return (
    <div className="page-head legal-shell">
      <h1>{title}</h1>
      <p className="muted">{intro}</p>
      <p className="muted">{UPDATED}</p>

      <div className="legal">
        {sections.map((s) => (
          <section key={s.heading} className="legal-card">
            <h2>{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {s.list && (
              <ul>
                {s.list.map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <div className="legal-card">{children}</div>
      </div>

      <nav className="row" aria-label="Legal pages" style={{ marginTop: '2rem' }}>
        <Link className="btn btn--sm btn--quiet" to="/terms">
          Terms
        </Link>
        <Link className="btn btn--sm btn--quiet" to="/privacy">
          Privacy
        </Link>
        <Link className="btn btn--sm btn--quiet" to="/cookies">
          Cookies
        </Link>
      </nav>
    </div>
  );
}

export function Terms() {
  return (
    <Legal
      title="Terms of service"
      intro={`These terms cover your use of ${BRAND}.`}
      sections={[
        {
          heading: 'Your account',
          body: [
            'You need an account to enrol in classes. Keep your password to yourself, and tell us if you think someone else has got in.',
            'You must be old enough to enter a contract where you live to buy a subscription.',
          ],
        },
        {
          heading: 'Subscriptions',
          body: [
            'Subscriptions renew automatically until you cancel. Cancel from Settings and you keep access until the end of the period you have already paid for.',
          ],
        },
        {
          heading: 'Payments',
          body: [
            'Payments are handled by our payment provider. We never see or store your full card number. Charges are made at the start of each period.',
          ],
        },
        {
          heading: 'Your content',
          body: [
            'You own what you write. You give us permission to host and show it as part of the service, and to show it publicly where you have chosen to publish it.',
          ],
        },
        {
          heading: 'Class content',
          body: [
            'Lessons belong to their instructors. Do not download, record, or redistribute them. We will remove accounts that do.',
          ],
        },
        {
          heading: 'Ending things',
          body: [
            'You can delete your account at any time from Settings. We may suspend accounts that break these terms or abuse the service.',
          ],
        },
        {
          heading: 'Liability',
          body: [
            'The service is provided as is. Our liability for any claim relating to it is limited to the amount you paid us in the last twelve months.',
          ],
        },
      ]}
    />
  );
}

export function Privacy() {
  return (
    <Legal
      title="Privacy policy"
      intro={`What ${BRAND} collects, and why.`}
      sections={[
        {
          heading: 'What we hold',
          body: ['To run your account and your classes, we store:'],
          list: [
            'Your name, email address, and a hashed password.',
            'Your role, headline, and biography.',
            'Which classes you enrolled in, which lessons you finished, and where you stopped watching.',
            'Your notes, saved classes, reviews, and questions.',
            'Your subscription plan, status, and the last four digits of your card.',
          ],
        },
        {
          heading: 'What we do not do',
          body: [
            'We do not sell your personal information. We do not store full card numbers. We do not use your lesson notes to train models.',
          ],
        },
        {
          heading: 'Email',
          body: [
            'We email you about your account, your classes, and billing. Marketing email is off until you turn it on in Settings.',
          ],
        },
        {
          heading: 'Cookies and local storage',
          body: [
            'We store your session token and your reading preferences in your browser. See the cookies page for the detail.',
          ],
        },
        {
          heading: 'Your rights',
          body: [
            'You can read, correct, or delete your data from Settings. Deleting your account removes your enrolments, progress, notes, and reviews.',
          ],
        },
        {
          heading: 'Keeping data safe',
          body: [
            'Passwords are hashed and never stored in plain text. Password reset links are single use and expire.',
          ],
        },
      ]}
    >
      <Alertish />
    </Legal>
  );
}

function Alertish() {
  return (
    <p className="muted">
      Want your data gone entirely? Delete your account from Settings, or email privacy@iankrm.test.
    </p>
  );
}

export function Cookies() {
  return (
    <Legal
      title="Cookie policy"
      intro={`What ${BRAND} puts in your browser.`}
      sections={[
        {
          heading: 'Strictly necessary',
          body: ['These keep you signed in and cannot be switched off.'],
          list: [
            'A session token in local storage, so you stay signed in between visits.',
            'Your playback and privacy preferences, so we do not ask twice.',
          ],
        },
        {
          heading: 'Analytics',
          body: [
            'We measure which pages are read and which classes are popular so we can improve them. This build does not include a third-party analytics tracker.',
          ],
        },
        {
          heading: 'Marketing',
          body: ['We do not run advertising cookies.'],
        },
        {
          heading: 'Managing them',
          body: [
            'Clearing your browser storage signs you out and resets your preferences. Your account and progress are unaffected.',
          ],
        },
      ]}
    />
  );
}
