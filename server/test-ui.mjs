/* Headless UI walkthrough of the real flows, driven over the Chrome DevTools
   Protocol so it needs no extra npm dependency. */
const BASE = 'http://localhost:3001';
const EMAIL = `ui${Date.now()}@test.dev`;
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

/* Evaluate an expression in the page and return its JSON value. */
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {
    expression: `(async () => { ${expression} })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  }
  return r.result.value;
}

async function goto(path) {
  await send('Page.navigate', { url: BASE + path });
  await new Promise((r) => setTimeout(r, 900));
}

/* Types into a React-controlled input by dispatching a native setter + input event. */
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

const browser = await fetch('http://localhost:9222/json/new?about:blank', { method: 'PUT' }).then((r) => r.json());
ws = new WebSocket(browser.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve);
  ws.addEventListener('error', reject);
});

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  }
});

await send('Page.enable');
// Chrome is shared between suites, so a token left behind by an earlier run
// would make these signed-out checks run signed in.
await send('Storage.clearDataForOrigin', { origin: BASE, storageTypes: 'all' });
await send('Runtime.enable');
await send('Log.enable');

const consoleErrors = [];
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    consoleErrors.push(msg.params.entry.text);
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(msg.params.exceptionDetails.exception?.description || 'exception');
  }
});

console.log('\nresetting to a signed-out session');
await goto('/');
await evaluate(`localStorage.clear(); return 1;`);
await goto('/');
ok('starting signed out', (await evaluate('return location.pathname;')) === '/');

console.log(`\nsigning up as a STUDENT (${EMAIL})`);
await goto('/signup');
ok('signup page renders', (await textOf('h1')) === 'Create your account');

const roleCount = await evaluate(`return document.querySelectorAll('input[name="role"]').length;`);
ok('role selector offers both options', roleCount === 2, `got ${roleCount}`);

const roleLabels = await evaluate(`
  return [...document.querySelectorAll('.role-option__title')].map((n) => n.textContent);
`);
ok('student option present', JSON.stringify(roleLabels).includes('student'), JSON.stringify(roleLabels));
ok('tutor option present', JSON.stringify(roleLabels).includes('tutor'), JSON.stringify(roleLabels));

// Default is student; fill and submit.
await fill('#name', 'UI Student');
await fill('#email', EMAIL);
await fill('#password', PASSWORD);
await fill('#headline', 'Product designer');
ok('student form hides tutor fields', (await evaluate(`return !document.querySelector('#expertise');`)) === true);

await clickText('button[type="submit"]', 'Create');
await new Promise((r) => setTimeout(r, 1400));

let path = await evaluate('return location.pathname;');
ok('student lands on /dashboard', path === '/dashboard', `got ${path}`);
ok('dashboard greets by first name', ((await textOf('h1')) || '').includes('Hey UI'), await textOf('h1'));

// Sign out first: /signup redirects signed-in users to their dashboard.
// The landing nav intentionally has no auth links, so clear the session
// directly rather than clicking through the marketing header.
await evaluate(`localStorage.clear(); return 1;`);
await goto('/login');

console.log('\nsignup as a TUTOR shows extra fields');
const TUTOR = `tut${Date.now()}@test.dev`;
await goto('/signup');
ok('signed-out /signup renders again', (await textOf('h1')) === 'Create your account');
await evaluate(`document.querySelector('input[name="role"][value="tutor"]').click(); return 1;`);
await new Promise((r) => setTimeout(r, 300));
ok('tutor form reveals expertise field', (await evaluate(`return !!document.querySelector('#expertise');`)) === true);
ok('tutor form reveals credentials field', (await evaluate(`return !!document.querySelector('#credentials');`)) === true);

await fill('#name', 'UI Tutor');
await fill('#email', TUTOR);
await fill('#password', PASSWORD);
await fill('#expertise', 'Sound design');
const submitLabel = await textOf('button[type="submit"]');
ok('submit button reflects tutor role', (submitLabel || '').includes('tutor'), submitLabel);

await clickText('button[type="submit"]', 'Create');
await new Promise((r) => setTimeout(r, 1400));
path = await evaluate('return location.pathname;');
ok('tutor lands on /teach', path === '/teach', `got ${path}`);

console.log('\ntutor can author a class');
await clickText('a, button', 'New class');
await new Promise((r) => setTimeout(r, 1600));
const onEditor = await evaluate('return location.pathname;');
ok('editor opened', /^\/teach\/.+/.test(onEditor), onEditor);

await fill('#title', 'Editing Under Pressure');
await fill('#subtitle', 'Making good work on a deadline.');
await clickText('button[type="submit"]', 'Save changes');
await new Promise((r) => setTimeout(r, 900));
ok('class saved', ((await evaluate(`return document.body.textContent;`)) || '').includes('Saved'));

await fill('#l-title', 'The First Cut');
await clickText('button[type="submit"]', 'Add lesson');
await new Promise((r) => setTimeout(r, 1000));
ok('lesson added', ((await evaluate(`return document.body.textContent;`)) || '').includes('The First Cut'));

await evaluate(`
  const sel = document.querySelector('#status');
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, 'published');
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return 1;
`);
await clickText('button[type="submit"]', 'Save changes');
await new Promise((r) => setTimeout(r, 900));
ok('published', ((await evaluate(`return document.body.textContent;`)) || '').includes('published'));

console.log('\nsign in as the student');
// Still signed in as the tutor; the landing nav has no sign-out control,
// so end the session directly instead of routing through the header.
await evaluate(`localStorage.clear(); return 1;`);
await goto('/login');
ok('login page renders', (await textOf('h1')) === 'Sign in');
await fill('#email', EMAIL);
await fill('#password', 'wrong-password');
await clickText('button[type="submit"]', 'Sign in');
await new Promise((r) => setTimeout(r, 1000));
ok('bad password shows an error', ((await textOf('.alert--error')) || '').length > 0);

await fill('#password', PASSWORD);
await clickText('button[type="submit"]', 'Sign in');
await new Promise((r) => setTimeout(r, 1400));
ok('correct password lands on /dashboard', (await evaluate('return location.pathname;')) === '/dashboard');

console.log('\nstudent can browse, enrol, and watch');
await goto('/browse');
await new Promise((r) => setTimeout(r, 900));
const cardCount = await evaluate(`return document.querySelectorAll('.xcard').length;`);
ok('catalogue lists classes', cardCount >= 2, `got ${cardCount}`);

await fill('#q', 'short story');
await new Promise((r) => setTimeout(r, 500));
const filtered = await evaluate(`return document.querySelectorAll('.xcard').length;`);
ok('search narrows results', filtered >= 1 && filtered < cardCount, `${cardCount} -> ${filtered}`);

await goto('/browse');
await new Promise((r) => setTimeout(r, 800));
await evaluate(`document.querySelector('.xcard').click(); return 1;`);
await new Promise((r) => setTimeout(r, 1200));
ok('class detail opens', (await evaluate('return location.pathname;')).startsWith('/class/'));

await clickText('button', 'Enrol');
await new Promise((r) => setTimeout(r, 1200));
ok('enrol button becomes Continue', ((await evaluate('return document.body.textContent;')) || '').includes('Continue class'));

await clickText('button', 'Continue class');
await new Promise((r) => setTimeout(r, 1400));
ok('learn page opens', (await evaluate('return location.pathname;')).startsWith('/learn/'));
const lessonCount = await evaluate(`return document.querySelectorAll('.learn__lesson').length;`);
ok('curriculum sidebar lists lessons', lessonCount >= 1, `got ${lessonCount}`);

await clickText('.learn__lesson', 'Emotional beat');
await new Promise((r) => setTimeout(r, 900));
ok('switching lessons works', (await evaluate(`return document.querySelectorAll('.learn__lesson[aria-current="true"]').length;`)) === 1);

await clickText('button', 'Mark complete');
await new Promise((r) => setTimeout(r, 1000));
ok('marking complete updates progress', ((await evaluate('return document.body.textContent;')) || '').includes('Completed'));

await goto('/dashboard');
await new Promise((r) => setTimeout(r, 1100));
ok('dashboard shows the enrolled class', ((await evaluate('return document.body.textContent;')) || '').includes('Directing Great Films'));
ok('dashboard shows lesson count', ((await evaluate('return document.body.textContent;')) || '').includes('/6 lessons'));

console.log('\nsettings');
await goto('/settings');
await new Promise((r) => setTimeout(r, 900));
ok('settings renders', (await textOf('h1')) === 'Settings');

const before = await evaluate(`
  const el = document.querySelector('#t-autoplay');
  return el.checked;
`);
await evaluate(`document.querySelector('#t-autoplay').click(); return 1;`);
await new Promise((r) => setTimeout(r, 700));
const after = await evaluate(`return document.querySelector('#t-autoplay').checked;`);
ok('autoplay toggle flips', before !== after, `${before} -> ${after}`);

await fill('#s-headline', 'Staff product designer');
await clickText('button[type="submit"]', 'Save profile');
await new Promise((r) => setTimeout(r, 900));
ok('profile saves', ((await evaluate('return document.body.textContent;')) || '').includes('Profile saved'));

console.log('\nrole isolation');
await goto('/teach');
await new Promise((r) => setTimeout(r, 1000));
ok('student cannot open /teach', (await evaluate('return location.pathname;')) === '/dashboard', await evaluate('return location.pathname;'));

await goto('/checkout');
await new Promise((r) => setTimeout(r, 1000));
const planCount = await evaluate(`return document.querySelectorAll('input[name="plan"]').length;`);
ok('checkout lists plans', planCount === 3, `got ${planCount}`);
await fill('#card', '4242');
await clickText('button[type="submit"]', 'Start');
await new Promise((r) => setTimeout(r, 1400));
ok('checkout returns to dashboard', (await evaluate('return location.pathname;')) === '/dashboard');
ok('plan now shows on dashboard', ((await evaluate('return document.body.textContent;')) || '').toLowerCase().includes('annual'));

await goto('/settings');
await new Promise((r) => setTimeout(r, 900));
ok('subscription visible in settings', ((await evaluate('return document.body.textContent;')) || '').includes('annual'));

console.log('\n404 + landing page');
await goto('/nope-nothing-here');
ok('unknown route shows 404', ((await textOf('.empty')) || '').includes('404'));

await goto('/');
await new Promise((r) => setTimeout(r, 1000));
const landingChecks = await evaluate(`
  return {
    hero: !!document.querySelector('.hero__title'),
    mosaic: document.querySelectorAll('.mosaic__card').length,
    quiz: document.querySelectorAll('.quiz__option').length,
    faq: document.querySelectorAll('.faq__item').length,
  };
`);
ok('landing hero intact', landingChecks.hero);
ok('landing mosaic still 16 cards', landingChecks.mosaic === 16, `got ${landingChecks.mosaic}`);
ok('landing quiz still 8 options', landingChecks.quiz === 8, `got ${landingChecks.quiz}`);
ok('landing faq still 6 items', landingChecks.faq === 6, `got ${landingChecks.faq}`);

// FAQ accordion still works after the router change. The first item may start
// open, so assert that clicking flips it rather than which way it goes.
const faqBefore = await evaluate(`return document.querySelector('.faq__trigger').getAttribute('aria-expanded');`);
await evaluate(`document.querySelector('.faq__item button').click(); return 1;`);
await new Promise((r) => setTimeout(r, 500));
const faqAfter = await evaluate(`return document.querySelector('.faq__trigger').getAttribute('aria-expanded');`);
ok('faq accordion still toggles', faqBefore !== faqAfter, `${faqBefore} -> ${faqAfter}`);
ok(
  'faq open class tracks aria-expanded',
  (await evaluate(`return document.querySelector('.faq__item').className.includes('faq__item--open');`)) === (faqAfter === 'true'),
);
await evaluate(`document.querySelector('.faq__item button').click(); return 1;`);
await new Promise((r) => setTimeout(r, 400));
ok(
  'faq toggles back',
  (await evaluate(`return document.querySelector('.faq__trigger').getAttribute('aria-expanded');`)) === faqBefore,
);

console.log(`\nconsole errors: ${consoleErrors.length}`);
consoleErrors.slice(0, 8).forEach((e) => console.log(`  ! ${e.slice(0, 200)}`));

console.log(`\n${pass} passed, ${fail} failed\n`);
await fetch(`http://localhost:9222/json/close/${browser.id}`);
process.exit(fail ? 1 : 0);
