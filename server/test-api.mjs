/* End-to-end API check. Run with the server up:  npm run dev:api  then  npm run test:api */
const BASE = process.env.API_BASE || 'http://localhost:3001/api';

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

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* some responses may be empty */
  }
  return { status: res.status, json };
}

const stamp = Date.now();
const studentEmail = `stu${stamp}@test.dev`;
const tutorEmail = `tut${stamp}@test.dev`;
const PASSWORD = 'password123';

console.log('\nhealth');
{
  const r = await call('GET', '/health');
  ok('health responds', r.status === 200 && r.json?.ok === true, JSON.stringify(r.json));
}

console.log('\nsignup validation');
{
  const noRole = await call('POST', '/auth/signup', { body: { email: `x${stamp}@t.dev`, password: PASSWORD, name: 'X' } });
  ok('rejects missing role', noRole.status === 400, noRole.status);

  const badRole = await call('POST', '/auth/signup', { body: { email: `x${stamp}@t.dev`, password: PASSWORD, name: 'X', role: 'admin' } });
  ok('rejects unknown role', badRole.status === 400, badRole.status);

  const shortPw = await call('POST', '/auth/signup', { body: { email: `x${stamp}@t.dev`, password: 'short', name: 'X', role: 'student' } });
  ok('rejects short password', shortPw.status === 400, shortPw.status);

  const badEmail = await call('POST', '/auth/signup', { body: { email: 'nope', password: PASSWORD, name: 'X', role: 'student' } });
  ok('rejects bad email', badEmail.status === 400, badEmail.status);

  const noName = await call('POST', '/auth/signup', { body: { email: `x${stamp}@t.dev`, password: PASSWORD, role: 'student' } });
  ok('rejects missing name', noName.status === 400, noName.status);
}

console.log('\nsignup roles');
let studentToken;
let tutorToken;
{
  const s = await call('POST', '/auth/signup', {
    body: { email: studentEmail, password: PASSWORD, name: 'Test Student', role: 'student', headline: 'Designer' },
  });
  ok('student signs up', s.status === 201 && !!s.json?.token, JSON.stringify(s.json));
  ok('student role stored', s.json?.user?.role === 'student');
  ok('student has no tutor profile', s.json?.user?.tutorProfile === null);
  ok('student gets default settings', !!s.json?.user?.settings);
  studentToken = s.json?.token;

  const t = await call('POST', '/auth/signup', {
    body: {
      email: tutorEmail,
      password: PASSWORD,
      name: 'Test Tutor',
      role: 'tutor',
      headline: 'Filmmaker',
      expertise: 'Direction',
      credentials: 'BA',
    },
  });
  ok('tutor signs up', t.status === 201 && !!t.json?.token, JSON.stringify(t.json));
  ok('tutor role stored', t.json?.user?.role === 'tutor');
  ok('tutor profile captured', t.json?.user?.tutorProfile?.expertise === 'Direction');
  tutorToken = t.json?.token;

  const dupe = await call('POST', '/auth/signup', { body: { email: studentEmail, password: PASSWORD, name: 'Dupe', role: 'student' } });
  ok('rejects duplicate email', dupe.status === 409, dupe.status);
}

console.log('\nlogin');
{
  const good = await call('POST', '/auth/login', { body: { email: studentEmail, password: PASSWORD } });
  ok('student logs in', good.status === 200 && !!good.json?.token);

  const badPw = await call('POST', '/auth/login', { body: { email: studentEmail, password: 'wrongwrong' } });
  ok('rejects wrong password', badPw.status === 401);

  const noUser = await call('POST', '/auth/login', { body: { email: 'ghost@nowhere.dev', password: PASSWORD } });
  ok('unknown email gives same 401', noUser.status === 401);

  const demo = await call('POST', '/auth/login', { body: { email: 'student@iankrm.test', password: 'password123' } });
  ok('seeded student logs in', demo.status === 200);

  const demoTutor = await call('POST', '/auth/login', { body: { email: 'kenji@iankrm.test', password: 'password123' } });
  ok('seeded tutor logs in', demoTutor.status === 200);
}

console.log('\nauth guards');
{
  const anon = await call('GET', '/auth/me');
  ok('/me rejects anonymous', anon.status === 401, anon.status);

  const badToken = await call('GET', '/auth/me', { token: 'garbage.token.here' });
  ok('/me rejects bad token', badToken.status === 401);

  const me = await call('GET', '/auth/me', { token: studentToken });
  ok('/me returns the student', me.status === 200 && me.json?.user?.email === studentEmail);
}

console.log('\nprofile');
{
  const patch = await call('PATCH', '/auth/me', {
    token: studentToken,
    body: { name: 'Renamed Student', headline: 'Illustrator', bio: 'Bio line' },
  });
  ok('student updates profile', patch.status === 200 && patch.json?.user?.name === 'Renamed Student');
  ok('headline saved', patch.json?.user?.headline === 'Illustrator');
}

console.log('\ncatalogue');
let firstSlug;
{
  const list = await call('GET', '/classes');
  ok('lists published classes', list.status === 200 && list.json?.classes?.length >= 2);
  ok('classes are decorated', list.json?.classes?.[0]?.lessonCount > 0);
  firstSlug = list.json?.classes?.[0]?.slug;

  const detail = await call('GET', `/classes/${firstSlug}`);
  ok('class detail loads', detail.status === 200 && !!detail.json?.class);
  ok('lessons included', Array.isArray(detail.json?.lessons) && detail.json.lessons.length > 0);
  ok('tutor name included', !!detail.json?.class?.tutor_name);

  const missing = await call('GET', '/classes/does-not-exist');
  ok('unknown class 404s', missing.status === 404);

  const search = await call('GET', '/classes?q=directing');
  ok('search filters', search.json?.classes?.length >= 1 && search.json.classes.every((c) => /directing/i.test(c.title)));

  const cat = await call('GET', '/classes?category=film');
  ok('category filters', cat.json?.classes?.every((c) => c.category === 'film'));
}

console.log('\nenrollment + progress');
let classId;
let lessonId;
let lessonCount;
{
  const detail = await call('GET', `/classes/${firstSlug}`);
  classId = detail.json.class.id;
  lessonId = detail.json.lessons[0].id;
  lessonCount = detail.json.lessons.length;

  const noAuth = await call('GET', '/enrollments');
  ok('enrollments reject anonymous', noAuth.status === 401);

  // Progress writes must fail before the student is enrolled.
  const early = await call('PATCH', `/enrollments/${classId}/lessons/${lessonId}`, {
    token: studentToken,
    body: { position_seconds: 480 },
  });
  ok('progress rejected before enrolling', early.status === 403, early.status);

  const enrolled = await call('POST', `/enrollments/${classId}`, { token: studentToken });
  ok('student enrolls', enrolled.status === 201 && enrolled.json?.enrolled === true, JSON.stringify(enrolled.json));

  const dupe = await call('POST', `/enrollments/${classId}`, { token: studentToken });
  ok('double enroll rejected', dupe.status === 409);

  const list = await call('GET', '/enrollments', { token: studentToken });
  ok('enrollment listed with progress', list.json?.enrollments?.[0]?.progress?.percent === 0);

  const saved = await call('PATCH', `/enrollments/${classId}/lessons/${lessonId}`, {
    token: studentToken,
    body: { position_seconds: 480, completed: true },
  });
  const expected = Math.round((1 / lessonCount) * 100);
  ok('progress saved', saved.status === 200 && saved.json?.progress?.completedCount === 1, JSON.stringify(saved.json?.progress));
  ok('percent recomputed from lesson count', saved.json?.progress?.percent === expected, `got ${saved.json?.progress?.percent}, want ${expected}`);

  const clamped = await call('PATCH', `/enrollments/${classId}/lessons/${lessonId}`, {
    token: studentToken,
    body: { position_seconds: 999999, completed: true },
  });
  ok('position clamps to runtime', clamped.status === 200);

  const rollback = await call('PATCH', `/enrollments/${classId}/lessons/${lessonId}`, {
    token: studentToken,
    body: { position_seconds: 10, completed: false },
  });
  ok('completion cannot be undone by a later partial save', rollback.json?.progress?.completedCount === 1);

  const prog = await call('GET', `/enrollments/${classId}/progress`, { token: studentToken });
  ok('progress endpoint reads back', prog.status === 200 && prog.json?.progress?.completedCount === 1);
}

console.log('\nsettings');
{
  const get = await call('GET', '/settings', { token: studentToken });
  ok('reads settings', get.status === 200 && typeof get.json?.settings?.autoplay === 'number');

  const patch = await call('PATCH', '/settings', {
    token: studentToken,
    body: { autoplay: false, playback_speed: 1.5, theme: 'dark', captions: true },
  });
  ok("saves toggles", patch.status === 200 && patch.json?.settings?.autoplay === 0, JSON.stringify(patch.json));
  ok("saves speed", patch.json?.settings?.playback_speed === 1.5, JSON.stringify(patch.json));
  ok("saves captions", patch.json?.settings?.captions === 1, JSON.stringify(patch.json));

  const clamped = await call('PATCH', '/settings', { token: studentToken, body: { playback_speed: 99 } });
  ok('speed clamps to 2x', clamped.json?.settings?.playback_speed === 2);

  const badTheme = await call('PATCH', '/settings', { token: studentToken, body: { theme: 'neon' } });
  ok('rejects unknown theme', badTheme.json?.settings?.theme === 'dark');

  const wrongPw = await call('POST', '/settings/password', {
    token: studentToken,
    body: { current_password: 'nope-nope', new_password: 'brand-new-password' },
  });
  ok('rejects wrong current password', wrongPw.status === 401);

  const changed = await call('POST', '/settings/password', {
    token: studentToken,
    body: { current_password: PASSWORD, new_password: 'brand-new-password' },
  });
  ok('changes password', changed.status === 200);

  const relogin = await call('POST', '/auth/login', { body: { email: studentEmail, password: 'brand-new-password' } });
  ok('new password works', relogin.status === 200);

  const oldPw = await call('POST', '/auth/login', { body: { email: studentEmail, password: PASSWORD } });
  ok('old password no longer works', oldPw.status === 401);
}

console.log('\nbilling');
{
  const read = await call('GET', '/billing', { token: studentToken });
  ok('reads subscription state', read.status === 200 && Array.isArray(read.json?.plans));

  const badCard = await call('POST', '/billing/checkout', { token: studentToken, body: { plan: 'annual', card_last4: '1' } });
  ok('rejects bad card digits', badCard.status === 400);

  const badPlan = await call('POST', '/billing/checkout', { token: studentToken, body: { plan: 'lifetime', card_last4: '4242' } });
  ok('rejects unknown plan', badPlan.status === 400);

  const bought = await call('POST', '/billing/checkout', { token: studentToken, body: { plan: 'annual', card_last4: '4242' } });
  ok('checkout activates plan', bought.status === 201 && bought.json?.subscription?.status === 'active');
  ok('plan persisted', bought.json?.subscription?.plan === 'annual');
  ok('reference issued', /^demo_/.test(bought.json?.subscription?.payment_reference || ''));

  const upgrade = await call('POST', '/billing/checkout', { token: studentToken, body: { plan: 'family', card_last4: '1881' } });
  ok('plan can be changed', upgrade.json?.subscription?.plan === 'family');

  const cancel = await call('POST', '/billing/cancel', { token: studentToken });
  ok('cancel works', cancel.json?.subscription?.status === 'canceled');
}

console.log('\ntutor authoring');
let newClassId;
{
  const denied = await call('POST', '/classes', { token: studentToken, body: { title: 'Nope' } });
  ok('students cannot create classes', denied.status === 403, denied.status);

  const noTitle = await call('POST', '/classes', { token: tutorToken, body: { subtitle: 'no title' } });
  ok('rejects missing title', noTitle.status === 400);

  const created = await call('POST', '/classes', {
    token: tutorToken,
    body: { title: `Test Course ${stamp}`, subtitle: 'Sub', description: 'Desc', category: 'writing' },
  });
  ok('tutor creates class', created.status === 201, JSON.stringify(created.json));
  ok('new class starts as draft', created.json?.class?.status === 'draft');
  newClassId = created.json?.class?.id;

  const dupeSlug = await call('POST', '/classes', { token: tutorToken, body: { title: `Test Course ${stamp}` } });
  ok('duplicate titles get unique slugs', dupeSlug.json?.class?.slug !== created.json?.class?.slug);

  const lesson = await call('POST', `/classes/${newClassId}/lessons`, {
    token: tutorToken,
    body: { title: 'Lesson One', duration_seconds: 300 },
  });
  ok('tutor adds lesson', lesson.status === 201 && lesson.json?.lesson?.position === 0);

  const lesson2 = await call('POST', `/classes/${newClassId}/lessons`, {
    token: tutorToken,
    body: { title: 'Lesson Two' },
  });
  ok('lesson positions increment', lesson2.json?.lesson?.position === 1);

  const published = await call('PATCH', `/classes/${newClassId}`, { token: tutorToken, body: { status: 'published' } });
  ok('tutor publishes class', published.json?.class?.status === 'published');

  const visible = await call('GET', '/classes');
  ok('published class appears in catalogue', visible.json?.classes?.some((c) => c.id === newClassId));
}

console.log('\nownership guards');
{
  const other = await call('POST', '/auth/signup', {
    body: { email: `oth${stamp}@test.dev`, password: PASSWORD, name: 'Other Tutor', role: 'tutor' },
  });

  const steal = await call('PATCH', `/classes/${newClassId}`, { token: other.json.token, body: { title: 'Stolen' } });
  ok('cannot edit another tutor class', steal.status === 403, steal.status);

  const stealLesson = await call('POST', `/classes/${newClassId}/lessons`, {
    token: other.json.token,
    body: { title: 'Injected' },
  });
  ok('cannot add lessons to another tutor class', stealLesson.status === 403);
}

console.log('\ndraft visibility');
{
  const draft = await call('POST', '/classes', { token: tutorToken, body: { title: `Hidden Draft ${stamp}` } });
  const list = await call('GET', '/classes');
  ok('drafts hidden from catalogue', !list.json?.classes?.some((c) => c.id === draft.json.class.id));

  const direct = await call('GET', `/classes/${draft.json.class.slug}`);
  ok('draft still reachable by slug', direct.status === 200);
}

console.log('\naccount deletion');
{
  const del = await call('DELETE', '/settings/account', { token: studentToken });
  ok('account deletes', del.status === 200);

  const after = await call('GET', '/auth/me', { token: studentToken });
  ok('token no longer resolves', after.status === 401);

  const relogin = await call('POST', '/auth/login', { body: { email: studentEmail, password: 'brand-new-password' } });
  ok('deleted account cannot log in', relogin.status === 401);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
