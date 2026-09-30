import { useState } from 'react';
import { Link } from 'react-router-dom';

const categories = [
  { title: 'Getting started', text: 'Learn how to subscribe, browse classes, and begin your first lesson.' },
  { title: 'Account', text: 'Update your profile, reset passwords, and manage your personal settings.' },
  { title: 'Billing', text: 'Review plans, payment history, renewals, and cancellation options.' },
  { title: 'Learning', text: 'Troubleshoot video playback, course access, and certificates.' },
];

const articles = [
  { title: 'How do I start learning?', meta: 'Getting started', to: '/browse' },
  { title: 'How can I change my plan?', meta: 'Billing', to: '/billing' },
  { title: 'How do I update my profile?', meta: 'Account', to: '/settings' },
  { title: 'How do I reset my password?', meta: 'Account', to: '/forgot-password' },
  { title: 'How do I download a certificate?', meta: 'Learning', to: '/certificates' },
];

export default function SupportCenter() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Help centre</h1>
        <p>Everything you need to learn, manage your account, and get support fast.</p>
      </div>

      <section className="grid-cards">
        {categories.map((category) => (
          <div key={category.title} className="panel">
            <h3>{category.title}</h3>
            <p className="setting-row__hint">{category.text}</p>
            <Link className="btn btn--quiet btn--sm" to="/settings" style={{ marginTop: '1.2rem' }}>
              Learn more
            </Link>
          </div>
        ))}
      </section>

      <section className="panel stack stack--tight">
        <h2>Popular articles</h2>
        <div className="panel" style={{ border: '1px solid var(--mc-color-neutral-800)' }}>
          {articles.map((article) => (
            <div key={article.title} className="setting-row">
              <span className="setting-row__text">
                <Link to={article.to} className="setting-row__label" style={{ color: '#fff' }}>
                  {article.title}
                </Link>
                <span className="setting-row__hint">{article.meta}</span>
              </span>
              <Link className="btn btn--quiet btn--sm" to={article.to}>Open</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack stack--tight">
        <h2>Contact support</h2>
        <form
          className="stack stack--tight"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="field">
            <label htmlFor="support-email">Email</label>
            <input id="support-email" type="email" defaultValue="student@iankrm.test" />
          </div>
          <div className="field">
            <label htmlFor="support-subject">Subject</label>
            <input id="support-subject" defaultValue="Need help with my account" />
          </div>
          <div className="field">
            <label htmlFor="support-message">Message</label>
            <textarea id="support-message" rows="5" defaultValue="I’m having trouble accessing my account and would like help with billing and course access." />
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <button className="btn" type="submit">Send request</button>
            <a className="btn btn--quiet" href="mailto:support@eduvia.app">Email support</a>
          </div>
          {submitted && (
            <p className="setting-row__hint" style={{ margin: 0 }}>
              Your request has been queued. Our support team typically replies within 2 hours.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
