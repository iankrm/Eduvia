import { useCallback, useEffect, useState } from 'react';
import { del, get, patch, post } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Empty, Spinner, StarPicker, Stars } from '../components/ui.jsx';

/* --------------------------------------------------------------- reviews */

export function Reviews({ slug, classId, enrolled }) {
  const { user } = useAuth();
  const isAdmin = !!user?.is_admin;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(0);

  const load = useCallback(() => {
    setError('');
    return get(`/reviews?class=${encodeURIComponent(slug)}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [slug]);

  /* load() returns a promise, which React would treat as a cleanup
     function, so the effect body deliberately returns nothing. */
  useEffect(() => {
    load();
  }, [load]);

  /* Show the student's own review first so they can edit rather than add. */
  const mine = data?.reviews.find((r) => r.userId === user?.id);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mine) await patch(`/reviews/${mine.id}`, { rating, body });
      else await post('/reviews', { classId, rating, body });
      setRating(mine?.rating || 0);
      setBody(mine?.body || '');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await del(`/reviews/${id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const hide = async (id, status) => {
    setError('');
    try {
      await patch(`/reviews/${id}`, { status });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="panel stack stack--tight" aria-label="Reviews">
      <div className="row row--between">
        <h2>Reviews</h2>
        {data?.rating?.count > 0 && (
          <span className="row">
            <Stars value={data.rating.average} count={data.rating.count} showValue />
          </span>
        )}
      </div>

      {error && <Alert>{error}</Alert>}
      {!data && <Spinner label="Loading reviews" />}

      {data && data.reviews.length === 0 && <Empty title="No reviews yet">Be the first.</Empty>}

      {user && enrolled && (
        <form className="stack stack--tight review-form" onSubmit={submit}>
          <h3>{mine ? 'Update your review' : 'Write a review'}</h3>
          <StarPicker value={rating} onChange={setRating} />
          <div className="field">
            <label htmlFor="review-body">Your review</label>
            <textarea
              id="review-body"
              rows={4}
              required
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What worked, what did not?"
            />
          </div>
          <button className="btn" type="submit" disabled={busy || !rating}>
            {busy ? 'Saving…' : mine ? 'Update review' : 'Post review'}
          </button>
        </form>
      )}

      {user && !enrolled && (data?.reviews?.length || 0) > 0 && (
        <p className="muted">Enrol to leave a review.</p>
      )}

      <ul className="review-list">
        {(data?.reviews || []).map((r) => {
          const own = r.userId === user?.id;
          return (
            <li key={r.id} className="review">
              <div className="review__head">
                <div className="app-avatar" style={{ '--avatar-hue': r.authorHue }}>
                  {r.author?.charAt(0)}
                </div>
                <div>
                  <p className="review__author">{r.author}</p>
                  <Stars value={r.rating} size="sm" />
                </div>
              </div>
              <p>{r.body}</p>
              <div className="row">
                {own && (
                  <button className="btn btn--sm btn--quiet" onClick={() => remove(r.id)}>
                    Delete
                  </button>
                )}
                {isAdmin && (
                  <button className="btn btn--sm btn--quiet" onClick={() => setEditing(r.id)}>
                    {r.status === 'hidden' ? 'Restore' : 'Hide'}
                  </button>
                )}
                {isAdmin && editing === r.id && (
                  <button
                    className="btn btn--sm btn--quiet"
                    onClick={() => {
                      hide(r.id, r.status === 'hidden' ? 'published' : 'hidden');
                      setEditing(0);
                    }}
                  >
                    Confirm {r.status === 'hidden' ? 'restore' : 'hide'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------- Q&A */

export function Questions({ slug, classId, enrolled }) {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);
  const [answerFor, setAnswerFor] = useState(0);
  const [answerText, setAnswerText] = useState('');

  const load = useCallback(() => {
    setError('');
    return get(`/questions?class=${encodeURIComponent(slug)}`)
      .then((d) => setItems(d.questions))
      .catch((e) => setError(e.message));
  }, [slug]);

  /* load() returns a promise, which React would treat as a cleanup
     function, so the effect body deliberately returns nothing. */
  useEffect(() => {
    load();
  }, [load]);

  const ask = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await post('/questions', { classId, body: text });
      setText('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reply = async (parentId) => {
    setBusy(true);
    setError('');
    try {
      await post('/questions', { classId, body: replyText, parentId });
      setReplyText('');
      setReplyTo(0);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const answer = async (id) => {
    setBusy(true);
    setError('');
    try {
      await patch(`/questions/${id}`, { answer: answerText });
      setAnswerText('');
      setAnswerFor(0);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setError('');
    try {
      await del(`/questions/${id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="panel stack stack--tight" id="questions" aria-label="Questions and answers">
      <h2>Questions</h2>
      {error && <Alert>{error}</Alert>}
      {!items && <Spinner label="Loading questions" />}

      {items && items.length === 0 && (
        <Empty title="No questions yet">
          {enrolled ? 'Ask the first one.' : 'Enrol to ask a question.'}
        </Empty>
      )}

      {user && enrolled && (
        <form className="stack stack--tight" onSubmit={ask}>
          <div className="field">
            <label htmlFor="question">Ask a question</label>
            <textarea
              id="question"
              rows={3}
              required
              maxLength={1000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <button className="btn" type="submit" disabled={busy}>
            Ask
          </button>
        </form>
      )}

      <ul className="qa-list">
        {(items || []).map((q) => (
          <li key={q.id} className="qa">
            <div className="review__head">
              <div className="app-avatar" style={{ '--avatar-hue': q.authorHue }}>
                {q.author?.charAt(0)}
              </div>
              <div>
                <p className="review__author">{q.author}</p>
                <p className="muted">{String(q.createdAt).slice(0, 10)}</p>
              </div>
            </div>
            <p>{q.body}</p>

            {q.answer && (
              <div className="qa__answer">
                <p className="review__author">Instructor answer</p>
                <p>{q.answer}</p>
              </div>
            )}

            <div className="row">
              {user && (
                <button className="btn btn--sm btn--quiet" onClick={() => setReplyTo(q.id)}>
                  Reply
                </button>
              )}
              {(user?.role === 'tutor' || user?.isAdmin) && !q.answer && (
                <button className="btn btn--sm btn--quiet" onClick={() => setAnswerFor(q.id)}>
                  Answer
                </button>
              )}
              {user && (q.userId === user.id || user.isAdmin) && (
                <button className="btn btn--sm btn--quiet" onClick={() => remove(q.id)}>
                  Delete
                </button>
              )}
            </div>

            {replyTo === q.id && (
              <div className="stack stack--tight">
                <div className="field">
                  <label htmlFor={`reply-${q.id}`}>Your reply</label>
                  <textarea
                    id={`reply-${q.id}`}
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>
                <button className="btn btn--sm" disabled={busy} onClick={() => reply(q.id)}>
                  Post reply
                </button>
              </div>
            )}

            {answerFor === q.id && (
              <div className="stack stack--tight">
                <div className="field">
                  <label htmlFor={`answer-${q.id}`}>Answer</label>
                  <textarea
                    id={`answer-${q.id}`}
                    rows={3}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                  />
                </div>
                <button className="btn btn--sm" disabled={busy} onClick={() => answer(q.id)}>
                  Post answer
                </button>
              </div>
            )}

            {q.replies?.length > 0 && (
              <ul className="qa__replies">
                {q.replies.map((r) => (
                  <li key={r.id}>
                    <p className="review__author">{r.author}</p>
                    <p>{r.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
