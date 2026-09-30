import { Link, useParams } from 'react-router-dom';

export default function PaymentStatus() {
  const { status } = useParams();
  const success = status === 'success';

  return (
    <div className="stack" style={{ maxWidth: '72rem', margin: '6rem auto', padding: '0 2rem' }}>
      <div className="panel stack stack--tight" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <span className={`badge ${success ? 'badge--live' : 'badge--draft'}`}>
          {success ? 'Payment successful' : 'Payment cancelled'}
        </span>
        <h1 style={{ margin: 0 }}>{success ? 'Your EduVia membership is active.' : 'Your checkout was cancelled.'}</h1>
        <p className="setting-row__hint" style={{ margin: 0 }}>
          {success
            ? 'You can now access all classes, assignments, and certificates from your dashboard.'
            : 'No charges were made. You can try again anytime from your billing page.'}
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link className="btn" to={success ? '/dashboard' : '/billing'}>
            {success ? 'Go to dashboard' : 'Return to billing'}
          </Link>
          <Link className="btn btn--quiet" to="/support">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
