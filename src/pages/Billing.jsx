import { useState } from 'react';
import { Link } from 'react-router-dom';

const plans = [
  { name: 'Annual', price: '$10/mo', detail: 'Billed annually at $120', tone: 'featured' },
  { name: 'Monthly', price: '$15/mo', detail: 'Flexible month-to-month', tone: 'default' },
  { name: 'Family', price: '$15/mo', detail: 'Up to 6 profiles', tone: 'default' },
];

const invoices = [
  { id: 'INV-4209', date: 'Sep 1, 2026', amount: '$120.00', status: 'Paid' },
  { id: 'INV-4152', date: 'Aug 1, 2026', amount: '$120.00', status: 'Paid' },
  { id: 'INV-4098', date: 'Jul 1, 2026', amount: '$120.00', status: 'Paid' },
];

export default function Billing() {
  const [paymentSaved, setPaymentSaved] = useState(false);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Billing & subscriptions</h1>
        <p>Manage your plan, payment history, and renewal details.</p>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__value">Annual</div>
          <div className="stat__label">Current plan</div>
        </div>
        <div className="stat">
          <div className="stat__value">$120</div>
          <div className="stat__label">Next renewal</div>
        </div>
        <div className="stat">
          <div className="stat__value">Visa ••4242</div>
          <div className="stat__label">Payment method</div>
        </div>
      </div>

      <section className="panel stack stack--tight">
        <h2>Choose a plan</h2>
        <div className="grid-cards">
          {plans.map((plan) => (
            <div key={plan.name} className={`panel ${plan.tone === 'featured' ? 'panel--featured' : ''}`}>
              <div className="row row--between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge--live">{plan.name}</span>
                  <h3 style={{ marginTop: '1rem' }}>{plan.price}</h3>
                </div>
                {plan.tone === 'featured' && <span className="badge">Current</span>}
              </div>
              <p className="setting-row__hint" style={{ marginTop: '0.8rem' }}>{plan.detail}</p>
              <ul className="setting-row__list" style={{ marginTop: '1.4rem' }}>
                <li>Unlimited access</li>
                <li>Download for offline viewing</li>
                <li>New classes every month</li>
              </ul>
              <Link className="btn btn--block" to="/checkout" style={{ marginTop: '1.6rem' }}>
                {plan.tone === 'featured' ? 'Manage plan' : 'Switch plan'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="panel stack stack--tight">
        <h2>Payment method</h2>
        <form
          className="stack stack--tight"
          onSubmit={(e) => {
            e.preventDefault();
            setPaymentSaved(true);
          }}
        >
          <div className="field">
            <label htmlFor="billing-name">Name on card</label>
            <input id="billing-name" defaultValue="Alex Morgan" />
          </div>
          <div className="field">
            <label htmlFor="billing-number">Card number</label>
            <input id="billing-number" defaultValue="4242 4242 4242 4242" />
          </div>
          <div className="row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: '1 1 12rem' }}>
              <label htmlFor="billing-expiry">Expiry</label>
              <input id="billing-expiry" defaultValue="12/29" />
            </div>
            <div className="field" style={{ flex: '1 1 12rem' }}>
              <label htmlFor="billing-cvc">CVC</label>
              <input id="billing-cvc" defaultValue="123" />
            </div>
          </div>
          <button className="btn" type="submit">Save payment method</button>
          {paymentSaved && (
            <p className="setting-row__hint" style={{ margin: 0 }}>
              Your payment method has been updated successfully.
            </p>
          )}
        </form>
      </section>

      <section className="panel stack stack--tight">
        <h2>Payment history</h2>
        <div className="panel" style={{ border: '1px solid var(--mc-color-neutral-800)' }}>
          {invoices.map((invoice) => (
            <div key={invoice.id} className="setting-row">
              <span className="setting-row__text">
                <span className="setting-row__label">{invoice.id}</span>
                <span className="setting-row__hint">{invoice.date}</span>
              </span>
              <span className="setting-row__text" style={{ textAlign: 'right' }}>
                <span className="setting-row__label">{invoice.amount}</span>
                <span className="setting-row__hint">{invoice.status}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
