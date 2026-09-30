/* Headless walkthrough of the features added after the first release:
   search, reviews, wishlist, notifications, certificates, Q&A, notes,
   password reset, email verification, earnings, promo codes, admin. */
const BASE = 'http://localhost:3001';
const STAMP = Date.now();
const STUDENT = `feat${STAMP}@test.dev`;
const TUTOR = `feattut${STAMP}@test.dev`;
const PASSWORD = 'password123';

let id = 1;
const pending = new Map();
let ws;

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = id++;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

let pass = 0;
let fail = 0;
function ok(label, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`  \x1b[32mPASS\x1b[0m ${label}`);
  } else {
    fail++;
    console.log(`  \x1b[31mFAIL\x1b[0m ${label} ${extra}`);
  }
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {
    expression: `(async () => { ${expression} })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r.result.value;
}

/* Polls for a selector instead of sleeping a fixed amount, so a slow fetch
   cannot turn into a false failure. */
async function waitFor(selector, timeout = 6000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(`return !!document.querySelector(${JSON.stringify(selector)});`)) return true;
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function goto(path) {
  await send('Page.navigate', { url: BASE + path });
  await new Promise((r) => setTimeout(r, 900));
}

const SET_INPUT = `
  function setValue(el, value) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
`;

async function fill(selector, value) {
  return evaluate(`
    ${SET_INPUT}
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return 'missing:' + ${JSON.stringify(selector)};
    setValue(el, ${JSON.stringify(value)});
    return 'ok';
  `);
}

async function clickText(selector, text) {
  return evaluate(`
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find((n) => n.textContent.trim().toLowerCase().includes(${JSON.stringify(text.toLowerCase())}));
    if (!el) return 'not-found';
    el.click();
    return 'clicked';
  `);
}

async function textOf(selector) {
  return evaluate(`
    const el = document.querySelector(${JSON.stringify(selector)});
    return el ? el.textContent.trim() : null;
  `);
}

const body = () => evaluate('return document.body.textContent;');
const h1 = () => textOf('h1');
const path = () => evaluate('return location.pathname;');

async function signUp(email, role) {
  await goto('/signup');
  await evaluate('localStorage.clear(); return 1;');
  await goto('/signup');
  await evaluate(`
    const el = document.querySelector('input[name="role"][value="${role}"]');
    if (el) el.click();
    return 1;
  `);
  await new Promise((r) => setTimeout(r, 300));
  await fill('#name', role === 'tutor' ? 'Feature Tutor' : 'Feature Student');
  await fill('#email', email);
  await fill('#password', PASSWORD);
  if (role === 'tutor') {
    await fill('#expertise', 'Cinematography');
  } else {
    await fill('#headline', 'Filmmaker in training');
  }
  await clickText('button[type="submit"]', 'Create');
  await new Promise((r) => setTimeout(r, 1600));
}

async function signOut() {
  await evaluate('localStorage.clear(); return 1;');
}

const errors = [];
const browser = await fetch('http://localhost:9222/json/new?about:blank', { method: 'PUT' }).then((r) => r.json());
ws = new WebSocket(browser.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res);
  ws.addEventListener('error', rej);
});
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : resolve(m.result);
  }
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    errors.push(m.params.entry.text);
  }
  if (m.method === 'Runtime.exceptionThrown') {
    errors.push(m.params.exceptionDetails.exception?.description || 'exception');
  }
});
await send('Page.enable');
// Chrome is shared between suites, so a token left behind by an earlier run
// would make these signed-out checks run signed in.
await send('Storage.clearDataForOrigin', { origin: BASE, storageTypes: 'all' });
await send('Runtime.enable');
await send('Log.enable');

console.log('\npublic pages work while signed out');
await goto('/');
ok('landing renders', (await body()).includes('EduVia'));
ok('skip link is first focusable', await evaluate(`
  const el = document.querySelector('.skip-link');
  return !!el && document.body.firstElementChild === el;
`));
ok('landing search is a real form', await evaluate(`
  const f = document.querySelector('.nav__search');
  return f && f.tagName === 'FORM' && !!f.querySelector('input[name="q"]');
`));
ok('Browse pill links to /browse', await evaluate(`
  return !!document.querySelector('a.nav__browse[href="/browse"]');
`));

for (const [p, title] of [['/terms', 'Terms'], ['/privacy', 'Privacy'], ['/cookies', 'Cookie']]) {
  await goto(p);
  ok(`${p} renders`, ((await h1()) || '').includes(title), await h1());
}
ok('legal page set the document title', await evaluate(`
  return document.title.includes('EduVia') && document.title !== 'EduVia — Learn from the best, be your best';
`));

console.log('\nauth recovery while signed out');
await goto('/forgot-password');
ok('forgot-password renders', (await h1()) === 'Forgot your password?');
await fill('#email', STUDENT);
await clickText('button[type="submit"]', 'Send reset link');
await new Promise((r) => setTimeout(r, 900));
ok('forgot-password confirms', ((await body()) || '').includes('reset link is on its way'));
await goto('/reset-password');
ok('reset-password without a token explains itself', ((await body()) || '').includes('Reset link missing'));

console.log('\nstudent signs up');
await signUp(STUDENT, 'student');
ok('student lands on /dashboard', (await path()) === '/dashboard', await path());
ok('dashboard greets by first name', ((await h1()) || '').includes('Hey Feature'), await h1());
ok('app shell links to Saved', await evaluate(`return !!document.querySelector('a[href="/wishlist"]');`));
ok('app shell links to Certificates', await evaluate(`return !!document.querySelector('a[href="/certificates"]');`));
ok('notification bell present', await evaluate(`return !!document.querySelector('a.bell[href="/notifications"]');`));

console.log('\nsearch');
await goto('/search');
ok('search page renders', (await h1()) === 'Search');
await fill('#q', 'directing');
await clickText('button[type="submit"]', 'Search');
await new Promise((r) => setTimeout(r, 1100));
ok('search finds the seeded class', ((await body()) || '').includes('Directing Great Films'));
ok('search shows a result count', await evaluate(`return !!document.querySelector('.muted[role="status"]');`));
await goto('/search?q=zzzznothing');
ok('no-match search says so', ((await body()) || '').includes('Nothing matched'), await h1());
await goto('/search');
ok('empty search prompts for input', ((await body()) || '').includes('Start typing to search'));

console.log('\nbrowse + class detail');
await goto('/browse');
ok('browse renders', ((await h1()) || '').includes('Browse'), await h1());
await goto('/class/directing-great-films');
ok('class detail renders', ((await h1()) || '').includes('Directing Great Films'));
ok('save button present', await evaluate(`return !!document.querySelector('.save-btn');`));
ok('reviews section mounted', await evaluate(`return !!document.querySelector('section[aria-label="Reviews"]');`));
ok('questions section mounted', await evaluate(`return !!document.querySelector('#questions');`));
ok('rating stat shown', ((await body()) || '').includes('Rating'));

console.log('\nreview needs an enrolment first');
ok('review form hidden before enrolling', await evaluate(`
  return !document.querySelector('.review-form');
`));
await clickText('button', 'Enrol for free');
await new Promise((r) => setTimeout(r, 1400));
ok('enrol button becomes Continue', ((await body()) || '').includes('Continue class'));
ok('review form appears after enrolling', await evaluate(`return !!document.querySelector('.review-form');`));

console.log('\npost a review');
await evaluate(`
  const btns = [...document.querySelectorAll('.star-picker__btn')];
  btns[4].click();
  return 1;
`);
await new Promise((r) => setTimeout(r, 250));
await fill('#review-body', 'Blocking finally clicked for me.');
await clickText('button[type="submit"]', 'Post review');
await new Promise((r) => setTimeout(r, 1400));
ok('review appears in the list', ((await body()) || '').includes('Blocking finally clicked for me.'));
ok('five stars rendered for the review', await evaluate(`
  const r = document.querySelector('.review');
  return r && r.querySelectorAll('.stars__on').length >= 5;
`));
ok('delete control offered on own review', await evaluate(`return !!document.querySelector('.review .btn--quiet');`));

console.log('\nwishlist');
await evaluate(`document.querySelector('.save-btn').click(); return 1;`);
await new Promise((r) => setTimeout(r, 1000));
ok('save button flips to Saved', ((await body()) || '').includes('Saved'));
await goto('/wishlist');
ok('wishlist page renders', (await h1()) === 'Saved classes');
ok('saved class listed', ((await body()) || '').includes('Directing Great Films'));
ok('remove control offered', await evaluate(`return !!document.querySelector('.xcard .btn');`));
await clickText('.xcard button', 'Remove');
await new Promise((r) => setTimeout(r, 1200));
ok('removing empties the list', ((await body()) || '').includes('Nothing saved yet'), await h1());

console.log('\nnotes and transcript in the player');
await goto('/learn/directing-great-films?lesson=1');
ok('learn page opens', ((await h1()) || '').includes('Directing Great Films') || (await path()).startsWith('/learn'));
ok('companion panel mounted', await evaluate(`return !!document.querySelector('section[aria-label="Transcript and notes"]');`));
await clickText('button[role="tab"]', 'My notes');
await new Promise((r) => setTimeout(r, 400));
ok('notes tab opens', await evaluate(`return !!document.querySelector('#lesson-note');`));
await fill('#lesson-note', 'Rewatch the blocking chapter');
await clickText('button', 'Save note');
await new Promise((r) => setTimeout(r, 1100));
ok('note saved confirmation', ((await body()) || '').includes('Note saved'), (await body()).slice(0, 120));
await clickText('button[role="tab"]', 'Transcript');
await new Promise((r) => setTimeout(r, 400));
ok('transcript tab readable', await evaluate(`
  return !!document.querySelector('.transcript, .setting-row__hint');
`));

console.log('\ncourse completion issues a certificate');
const lessonIds = await evaluate(`
  const r = await fetch('/api/classes/directing-great-films', { headers: { authorization: 'Bearer ' + localStorage.getItem('iankrm.token') } });
  const d = await r.json();
  return d.lessons.map((l) => l.id);
`);
for (const lid of lessonIds) {
  await evaluate(`
    await fetch('/api/enrollments/1/lessons/${lid}', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + localStorage.getItem('iankrm.token') },
      body: JSON.stringify({ completed: true, position_seconds: 5 }),
    });
    return 1;
  `);
}
await goto('/certificates');
ok('certificates page renders', (await h1()) === 'Certificates');
ok('certificate issued on completion', ((await body()) || '').includes('Certificate of completion'), (await body()).slice(0, 150));
const code = await evaluate(`
  const el = [...document.querySelectorAll('.cert__code')][0];
  return el ? el.textContent.trim() : null;
`);
ok('certificate carries a code', !!code && code.startsWith('EDV-'), code);
await goto(`/verify/${code}`);
ok('public verification page confirms', ((await body()) || '').includes('Valid certificate'), (await body()).slice(0, 140));
await goto('/verify/EDV-NOPE');
ok('bad code reports invalid', ((await body()) || '').includes('No certificate matches'), (await body()).slice(0, 140));

console.log('\nquestions');
await goto('/class/directing-great-films?tab=questions#questions');
ok('question form visible for enrolled student', await evaluate(`return !!document.querySelector('#question');`));
await fill('#question', 'How do you block a two-shot?');
await clickText('button[type="submit"]', 'Ask');
await new Promise((r) => setTimeout(r, 1300));
ok('question appears', ((await body()) || '').includes('How do you block a two-shot?'));

console.log('\nnotifications');
await goto('/notifications');
ok('notifications page renders', (await h1()) === 'Notifications');
ok('certificate notification recorded', ((await body()) || '').includes('Certificate earned'));
ok('student is not spammed with tutor notices', !((await body()) || '').includes('enrolled in'));
ok('mark all read offered', await evaluate(`return !!document.querySelector('.btn--quiet');`));
await clickText('button', 'Mark all read');
await new Promise((r) => setTimeout(r, 1000));
ok('dismiss control offered', await evaluate(`return !!document.querySelector('.notif .btn--quiet');`));

console.log('\nstudent cannot reach staff pages');
await goto('/admin');
ok('/admin redirects a student away', (await path()) === '/dashboard', await path());
await goto('/earnings');
ok('/earnings redirects a student away', (await path()) === '/dashboard', await path());
ok('no Admin link in a student shell', await evaluate(`return !document.querySelector('a[href="/admin"]');`));

console.log('\ntutor: earnings, promo codes, answering');
await signOut();
await signUp(TUTOR, 'tutor');
ok('tutor lands on /teach', (await path()) === '/teach', await path());
await goto('/earnings');
ok('earnings page renders', (await h1()) === 'Earnings');
ok('your share is shown', ((await body()) || '').includes('70%'), (await body()).slice(0, 200));
await fill('#code', `SAVE${STAMP % 1000}`);
await fill('#percentOff', '25');
await clickText('button[type="submit"]', 'Create');
await new Promise((r) => setTimeout(r, 1300));
ok('promo code created', ((await body()) || '').includes(`SAVE${STAMP % 1000}`), (await body()).slice(0, 200));

await goto('/class/directing-great-films?tab=questions#questions');
ok('tutor sees an Answer control', await evaluate(`return !!document.querySelector('.qa .btn');`));
await clickText('.qa button', 'Answer');
await new Promise((r) => setTimeout(r, 500));
await evaluate(`
  const ta = document.querySelector('.qa textarea');
  if (!ta) return 0;
  const proto = HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(ta, 'Stay wide and let them wander.');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  return 1;
`);
await new Promise((r) => setTimeout(r, 250));
await clickText('.qa button', 'Post answer');
await new Promise((r) => setTimeout(r, 1400));
ok('answer posted', ((await body()) || '').includes('Stay wide and let them wander.'), (await body()).slice(0, 160));

console.log('\ntranscripts are gated to people with access');
await goto('/learn/directing-great-films?lesson=1');
await clickText('button[role="tab"]', 'Transcript');
await new Promise((r) => setTimeout(r, 600));
ok('an unrelated tutor is refused', ((await body()) || '').includes('Enrol to watch'), (await body()).slice(0, 160));

await signOut();
await goto('/login');
await fill('#email', 'kenji@iankrm.test');
await fill('#password', 'password123');
await clickText('button[type="submit"]', 'Sign in');
await new Promise((r) => setTimeout(r, 1500));
ok('the class tutor signs in', (await path()) === '/teach', await path());
await goto('/learn/directing-great-films?lesson=1');
await clickText('button[role="tab"]', 'Transcript');
await waitFor('.transcript');
// Assert on presence rather than the seeded wording: an earlier suite may
// have rewritten this transcript.
// Presence and non-emptiness only: an earlier suite may have rewritten this
// transcript, so the exact wording is not ours to assert.
const trLen = await evaluate(`
  const el = document.querySelector('.transcript');
  return el ? el.textContent.trim().length : -1;
`);
ok('the class tutor reads the transcript', trLen > 0, `transcript length ${trLen}`);
await clickText('button', 'Edit transcript');
await new Promise((r) => setTimeout(r, 500));
ok('the class tutor can edit the transcript', await evaluate(`
  return !!document.querySelector('#transcript-body');
`), (await body()).slice(0, 200));
await fill('#transcript-body', 'Frame the intention before you frame the shot.\n\nRewritten by the tutor.');
await clickText('button', 'Save transcript');
await new Promise((r) => setTimeout(r, 1300));
ok('tutor transcript saved', ((await body()) || '').includes('Rewritten by the tutor'), (await body()).slice(0, 200));
ok('save is confirmed', ((await body()) || '').includes('Transcript saved'));

console.log('\npassword reset end to end');
await signOut();
const token = await evaluate(`
  const r = await fetch('/api/auth/token-debug/reset?email=${STUDENT}');
  const d = await r.json();
  return d.token;
`);
ok('dev reset token issued', !!token);
await goto(`/reset-password?token=${token}`);
ok('reset form renders', (await h1()) === 'Choose a new password');
await fill('#password', 'brandnewpass1');
await fill('#confirm', 'brandnewpass1');
await clickText('button[type="submit"]', 'Update password');
await new Promise((r) => setTimeout(r, 1500));
ok('reset lands on /login', (await path()) === '/login', await path());
await fill('#email', STUDENT);
await fill('#password', 'brandnewpass1');
await clickText('button[type="submit"]', 'Sign in');
await new Promise((r) => setTimeout(r, 1500));
ok('new password signs in', (await path()) === '/dashboard', await path());

console.log('\nadmin sees the moderation dashboard');
await signOut();
await goto('/login');
await fill('#email', 'admin@iankrm.test');
await fill('#password', 'password123');
await clickText('button[type="submit"]', 'Sign in');
await new Promise((r) => setTimeout(r, 1500));
ok('admin signs in', (await path()) === '/dashboard', await path());
ok('admin link appears in the shell', await evaluate(`return !!document.querySelector('a[href="/admin"]');`));
await goto('/admin');
ok('/admin renders for staff', (await h1()) === 'Admin');
ok('admin sees review totals', ((await body()) || '').includes('Reviews'));
ok('admin sees the moderation log', await evaluate(`
  return !!document.querySelector('section[aria-label="Moderation log"]');
`));
const sections = await evaluate(`
  return [...document.querySelectorAll('main section[aria-label], section[aria-label]')]
    .map((n) => n.getAttribute('aria-label'));
`);
ok('all admin sections present', sections.length >= 3, JSON.stringify(sections));
ok('users and classes are listed', ((await body()) || '').includes('kenji@iankrm.test'), (await body()).slice(0, 200));
const hiddenBtn = await clickText('button', 'Hide');
ok('admin can hide a review', hiddenBtn === 'clicked', hiddenBtn);
await new Promise((r) => setTimeout(r, 1200));
ok('hiding is confirmed', await evaluate(`return !!document.querySelector('.btn--quiet');`));
await clickText('button', 'Restore');
await new Promise((r) => setTimeout(r, 1200));
ok('restoring is offered', ((await body()) || '').includes('Hidden'), (await body()).slice(0, 120));

console.log('\nunknown route');
await goto('/definitely-not-a-page');
ok('404 page renders', ((await body()) || '').includes('404') && ((await body()) || '').includes('Back to the homepage'));
ok('404 page links home', await evaluate(`return !!document.querySelector('a[href="/"]');`));

const realErrors = errors.filter((e) => !/favicon|manifest/i.test(e));
console.log(`\nconsole errors: ${realErrors.length}`);
realErrors.slice(0, 6).forEach((e) => console.log(`  ! ${String(e).slice(0, 200)}`));

console.log(`\n${pass} passed, ${fail} failed\n`);
await fetch(`http://localhost:9222/json/close/${browser.id}`);
process.exit(fail ? 1 : 0);
