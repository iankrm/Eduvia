import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { get, patch, put } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Bar, Spinner, runtime } from '../components/ui.jsx';
import { BRAND } from '../data/content.js';

/* Persist a position at most this often while the video is playing. */
const SAVE_INTERVAL_MS = 5000;

const clock = (s) => {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/* Transcript plus the student's private note for the open lesson. The note
   captures the playhead so you can jump back to the moment you wrote it.
   The class's own tutor gets an editor instead of read-only text. */
function LessonCompanion({ lessonId, videoRef, canEdit }) {
  const [tab, setTab] = useState('transcript');
  const [transcript, setTranscript] = useState('');
  const [note, setNote] = useState({ body: '', seconds: 0 });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTranscript('');
    setNote({ body: '', seconds: 0 });
    setStatus('');

    get(`/notes/${lessonId}/transcript`)
      .then((d) => !cancelled && setTranscript(d.transcript))
      .catch(() => {});
    get(`/notes/${lessonId}`)
      .then((d) => !cancelled && setNote(d.note))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  /* Tutors write the transcript through the same component they read it in. */
  const saveTranscript = async () => {
    setBusy(true);
    setStatus('');
    try {
      await put(`/notes/${lessonId}/transcript`, { body: draft });
      setTranscript(draft);
      setEditing(false);
      setStatus('Transcript saved');
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async () => {
    setBusy(true);
    setStatus('');
    try {
      const seconds = Math.floor(videoRef?.current?.currentTime || note.seconds || 0);
      await put(`/notes/${lessonId}`, { body: note.body, seconds });
      setNote((n) => ({ ...n, seconds }));
      setStatus('Note saved');
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel stack stack--tight" aria-label="Transcript and notes">
      <div className="row" role="tablist" aria-label="Lesson companion">
        {['transcript', 'notes'].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`chip ${tab === t ? 'chip--on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'transcript' ? 'Transcript' : 'My notes'}
          </button>
        ))}
      </div>

      {tab === 'transcript' &&
        (editing ? (
          <div className="stack stack--tight">
            <div className="field">
              <label htmlFor="transcript-body">Transcript</label>
              <textarea
                id="transcript-body"
                rows={10}
                maxLength={20000}
                value={draft}
                placeholder="Type or paste what is said in this lesson…"
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <div className="row">
              <button className="btn btn--sm" onClick={saveTranscript} disabled={busy}>
                {busy ? 'Saving…' : 'Save transcript'}
              </button>
              <button
                className="btn btn--sm btn--quiet"
                onClick={() => {
                  setDraft(transcript);
                  setEditing(false);
                  setStatus('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : canEdit ? (
          <div className="stack stack--tight">
            {transcript ? (
              <p className="transcript">{transcript}</p>
            ) : (
              <p className="setting-row__hint">No transcript for this lesson yet.</p>
            )}
            <div>
              <button
                className="btn btn--sm"
                onClick={() => {
                  setDraft(transcript);
                  setEditing(true);
                  setStatus('');
                }}
              >
                {transcript ? 'Edit transcript' : 'Add transcript'}
              </button>
            </div>
          </div>
        ) : transcript ? (
          <p className="transcript">{transcript}</p>
        ) : (
          <p className="setting-row__hint">
            No transcript for this lesson yet.
          </p>
        ))}

      {status && <p className="setting-row__hint">{status}</p>}

      {tab === 'notes' && (
        <div className="stack stack--tight">
          <div className="field">
            <label htmlFor="lesson-note">Private note</label>
            <textarea
              id="lesson-note"
              rows={4}
              maxLength={5000}
              value={note.body}
              placeholder="What clicked, what to rewatch…"
              onChange={(e) => setNote((n) => ({ ...n, body: e.target.value }))}
            />
            <p className="field__hint">
              Tagged at{' '}
              <strong>{clock(note.seconds || 0)}</strong> — press Save to stamp the current playhead.
            </p>
          </div>
          <div className="row">
            <button className="btn btn--sm" onClick={saveNote} disabled={busy}>
              {busy ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Learn() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [enrolled, setEnrolled] = useState(null);
  const [progress, setProgress] = useState({ percent: 0, completedCount: 0, lessonCount: 0 });
  const [done, setDone] = useState({});
  const [lessonStates, setLessonStates] = useState([]);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const lastSaved = useRef(0);

  const lessonId = Number(params.get('lesson'));

  const load = useCallback(() => {
    get(`/classes/${slug}`)
      .then((r) => setData(r))
      .catch((e) => setError(e.message));
  }, [slug]);

  /* load() returns a promise, which React would treat as a cleanup
     function, so the effect body deliberately returns nothing. */
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user || !data) return;
    get('/enrollments')
      .then((r) => {
        const found = r.enrollments.find((e) => e.slug === slug);
        setEnrolled(!!found);
        if (found) setProgress(found.progress);
      })
      .catch(() => setEnrolled(false));
  }, [user, data, slug]);

  const lessons = useMemo(() => data?.lessons ?? [], [data]);

  /* Per-lesson completion marks and resume positions for the sidebar. */
  useEffect(() => {
    if (!user || !enrolled || !data) return;
    let cancelled = false;
    get(`/enrollments/${data.class.id}/progress`)
      .then((r) => {
        if (cancelled) return;
        setProgress(r.progress);
        setDone(Object.fromEntries(r.lessons.map((l) => [l.id, l.completed])));
        setLessonStates(r.lessons);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, enrolled, data]);

  const active = useMemo(
    () => lessons.find((l) => l.id === lessonId) || lessons[0],
    [lessons, lessonId],
  );

  const resumeAt = useMemo(() => {
    if (!active) return 0;
    return lessonStates.find((l) => l.id === active.id)?.position_seconds || 0;
  }, [active, lessonStates]);

  /* Restore the saved position and playback speed when the video loads. */
  function onLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    if (user?.settings?.playback_speed) v.playbackRate = Number(user.settings.playback_speed);
    if (resumeAt > 0 && resumeAt < v.duration - 5) v.currentTime = resumeAt;
    if (user?.settings?.autoplay === 0) return;
    v.play().catch(() => {});
  }

  const save = useCallback(
    (completed = false) => {
      const v = videoRef.current;
      if (!v || !data || !enrolled) return;
      patch(`/enrollments/${data.class.id}/lessons/${active.id}`, {
        position_seconds: Math.floor(v.currentTime),
        completed,
      })
        .then((r) => {
          setProgress(r.progress);
          if (completed) setDone((d) => ({ ...d, [active.id]: true }));
        })
        .catch(() => {});
    },
    [data, enrolled, active],
  );

  function onTimeUpdate() {
    if (Date.now() - lastSaved.current < SAVE_INTERVAL_MS) return;
    lastSaved.current = Date.now();
    save(false);
  }

  function onEnded() {
    save(true);
  }

  function markComplete() {
    save(true);
  }

  if (error && !data) return <Alert>{error}</Alert>;
  if (!data) return <Spinner label="Loading lesson" />;

  const { class: klass } = data;

  /* A tutor must be able to open their own class to proof it and write
     transcripts, even though they are not enrolled in it. */
  const isOwner = !!user && klass?.tutor_id === user.id;

  if (enrolled === false && !isOwner) {
    return (
      <div className="stack">
        <Alert>{null}</Alert>
        <div className="empty">
          <p style={{ fontSize: '1.8rem', color: 'var(--mc-color-text-light)', marginTop: 0 }}>
            Enrol to watch this class
          </p>
          <p>{klass.title} is part of the {BRAND} library.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={() => navigate(`/class/${klass.slug}`)}>
              View class
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row row--between">
        <div>
          <Link to={`/class/${klass.slug}`} style={{ fontSize: '1.3rem', color: 'var(--mc-color-text-medium)' }}>
            ← {klass.title}
          </Link>
          <h1 style={{ fontSize: '3.2rem', margin: '0.8rem 0 0' }}>{active?.title}</h1>
        </div>
        <div style={{ minWidth: '18rem' }}>
          <Bar percent={progress.percent} />
          <p className="setting-row__hint" style={{ textAlign: 'right' }}>
            {progress.completedCount}/{progress.lessonCount} lessons · {progress.percent}%
          </p>
        </div>
      </div>

      <div className="learn">
        <div className="stack stack--tight">
          <div className="learn__player">
            {active?.video_url ? (
              <video
                key={active.id}
                ref={videoRef}
                src={active.video_url}
                controls
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
              />
            ) : (
              <div className="empty" style={{ border: 0, height: '100%', margin: 0, display: 'grid', placeItems: 'center' }}>
                No video attached to this lesson yet.
              </div>
            )}
          </div>

          <div className="row">
            <button className="btn" onClick={markComplete} disabled={done[active?.id]}>
              {done[active?.id] ? 'Completed' : 'Mark complete'}
            </button>
            <span className="setting-row__hint">{runtime(active?.duration_seconds)}</span>
          </div>

          {active?.is_preview ? null : (
            <p className="setting-row__hint">
              Your position saves automatically every few seconds.
            </p>
          )}
        </div>

        {active && (
          <LessonCompanion
            lessonId={active.id}
            videoRef={videoRef}
            canEdit={!!user && !!data?.class && data.class.tutor_id === user.id}
          />
        )}

        <aside className="learn__sidebar">
          <div style={{ padding: '2rem', borderBottom: '1px solid var(--mc-color-neutral-800)' }}>
            <p className="setting-row__label" style={{ margin: 0 }}>
              {klass.title}
            </p>
            <p className="setting-row__hint" style={{ margin: 0 }}>
              {klass.tutor_name}
            </p>
          </div>
          <div>
            {lessons.map((l) => (
              <button
                key={l.id}
                type="button"
                className="learn__lesson"
                aria-current={l.id === active?.id}
                data-done={!!done[l.id]}
                onClick={() => {
                  save(false);
                  setParams({ lesson: String(l.id) });
                }}
              >
                <span>{done[l.id] ? '✓' : l.position + 1}</span>
                <span style={{ flex: 1 }}>{l.title}</span>
                <span style={{ color: 'var(--mc-color-text-tint)' }}>{runtime(l.duration_seconds)}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
