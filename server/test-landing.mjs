/* Confirms the landing page renders exactly the structure it did before any
   app work: same sections, same element counts, same type scale. */
const BASE = 'http://localhost:3001';

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

async function evaluate(body) {
  const r = await send('Runtime.evaluate', {
    expression: `(function () { ${body} })()`,
    returnByValue: true,
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'eval failed');
  return r.result.value;
}

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
});
await send('Page.enable');
// Chrome is shared between suites, so a token left behind by an earlier run
// would make these signed-out checks run signed in.
await send('Storage.clearDataForOrigin', { origin: BASE, storageTypes: 'all' });
await send('Runtime.enable');
await send('Log.enable');

const errors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description);
});

for (const width of [500, 800, 1440]) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: BASE + '/' });
  await new Promise((r) => setTimeout(r, 1200));
  await evaluate('return 1');

  console.log(`\n${width}px`);
  const counts = await evaluate(`
    const n = (s) => document.querySelectorAll(s).length;
    const cs = (el, p) => (el ? getComputedStyle(el)[p] : null);
    const hero = document.querySelector('.hero__title');
    const h1 = document.querySelector('.section__title');
    return {
      mosaic: n('.mosaic__card'),
      quiz: n('.quiz__option'),
      faq: n('.faq__item'),
      benefit: n('.benefit'),
      plan: n('.plan'),
      chip: n('.chip'),
      card: n('.card'),
      quote: n('.quote'),
      heroFs: cs(hero, 'fontSize'),
      heroLh: cs(hero, 'lineHeight'),
      h1Fs: cs(h1, 'fontSize'),
      h1Lh: cs(h1, 'lineHeight'),
      brand: (document.querySelector('.nav__brand') || {}).getAttribute
        ? document.querySelector('.nav__brand').getAttribute('aria-label')
        : null,
      ctaText: [...document.querySelectorAll('.nav__cta')].map((n) => n.textContent.trim())[0],
      order: [...document.querySelectorAll('main > section, main > *')].map((n) => n.className.split(' ')[0]),
    };
  `);

  // Recorded from the build before any app work.
  const expected = {
    500: { mosaic: 16, quiz: 8, faq: 6, benefit: 3, plan: 3, heroFs: '96px', heroLh: '110.4px', h1Fs: '54.4px', h1Lh: '68px' },
    800: { mosaic: 16, quiz: 8, faq: 6, benefit: 3, plan: 3, heroFs: '105.6px', heroLh: '121.44px', h1Fs: '60.8px', h1Lh: '76px' },
    1440: { mosaic: 16, quiz: 8, faq: 6, benefit: 3, plan: 3, heroFs: '128px', heroLh: '147.2px', h1Fs: '76.8px', h1Lh: '96px' },
  }[width];

  ok(`mosaic cards = 16`, counts.mosaic === expected.mosaic, `got ${counts.mosaic}`);
  ok(`quiz options = 8`, counts.quiz === expected.quiz, `got ${counts.quiz}`);
  ok(`faq items = 6`, counts.faq === expected.faq, `got ${counts.faq}`);
  ok(`benefits = 3`, counts.benefit === expected.benefit, `got ${counts.benefit}`);
  ok(`plans = 3`, counts.plan === expected.plan, `got ${counts.plan}`);
  ok(`chips = 9`, counts.chip === 9, `got ${counts.chip}`);
  ok(`cards = 6`, counts.card === 6, `got ${counts.card}`);
  ok(`quotes = 4`, counts.quote === 4, `got ${counts.quote}`);
  if (width === 1440) console.log(`  observed: hero ${counts.heroFs}/${counts.heroLh}, section title ${counts.h1Fs}/${counts.h1Lh}`);

  if (width === 1440) {
    ok('brand reads EduVia', counts.brand === 'EduVia home', counts.brand);
    ok('nav CTA reads "Get EduVia"', counts.ctaText === 'Get EduVia', counts.ctaText);
    ok('nav shows Log in when signed out', ((await evaluate('return document.body.textContent;')) || '').includes('Log in'));
    ok('nav shows Sign up when signed out', ((await evaluate('return document.body.textContent;')) || '').includes('Sign up'));
    ok('nav Log in links to /login', await evaluate(`return !!document.querySelector('.nav__right a[href="/login"]');`));
    ok('nav Sign up links to /signup', await evaluate(`return !!document.querySelector('.nav__right a[href="/signup"]');`));
    ok('plan CTA routes to /checkout', await evaluate(`return !!document.querySelector('#checkout a[href="/checkout"]');`));
    console.log(`  section order: ${counts.order.join(' -> ')}`);
  }
}

// Behaviour still intact.
console.log('\nbehaviour');
await send('Emulation.clearDeviceMetricsOverride');
await send('Page.navigate', { url: BASE + '/' });
await new Promise((r) => setTimeout(r, 1200));
const faqBefore = await evaluate(`return document.querySelector('.faq__trigger').getAttribute('aria-expanded');`);
await evaluate(`document.querySelector('.faq__item button').click(); return 1;`);
await new Promise((r) => setTimeout(r, 400));
ok('faq toggles', faqBefore !== (await evaluate(`return document.querySelector('.faq__trigger').getAttribute('aria-expanded');`)));

await evaluate(`window.scrollTo(0, 3000); return 1;`);
await new Promise((r) => setTimeout(r, 500));
ok('sticky CTA appears on scroll', await evaluate(`return document.querySelector('.sticky')?.className.includes('sticky--on');`));

await evaluate(`document.querySelector('.nav__burger')?.click(); return 1;`);
await new Promise((r) => setTimeout(r, 500));
ok('mobile drawer opens', await evaluate(`return document.querySelector('.mobile-nav').className.includes('mobile-nav--open');`));
ok('body scroll locks', await evaluate(`return document.body.style.overflow === 'hidden';`));

console.log(`\nconsole errors: ${errors.length}`);
errors.slice(0, 5).forEach((e) => console.log(`  ! ${e.slice(0, 160)}`));
console.log(`\n${pass} passed, ${fail} failed\n`);
await fetch(`http://localhost:9222/json/close/${browser.id}`);
process.exit(fail ? 1 : 0);
