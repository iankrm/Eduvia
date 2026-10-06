# EduVia

A learning platform built as a React rebuild of the MasterClass landing page,
rebranded. It has two audiences: **students** take classes and track progress,
**tutors** publish classes and see who is taking them. Accounts are created by
picking a role at signup, and each role gets its own pages.

Around that core it now also carries search, reviews and Q&A, a wishlist,
notifications, certificates with public verification, transcripts and private
lesson notes, promo codes, tutor earnings, an admin moderation desk, and
password reset plus email verification.

## Run

```bash
npm install
npm run dev      # API on :3001 + Vite on :5173 (proxies /api)
```

The app now requires Supabase Postgres. Create `.env` from `.env.example`, set
`DATABASE_URL` to the project's server database connection string, and restart
the API. Keep that value private and do not prefix it with `VITE_`; browser code
must never receive the database password. The Supabase publishable key is not
the Postgres connection string.

## Move the current SQLite data to Supabase

1. Rotate the database password if it has been shared, then set the new
   connection string in the ignored `.env` file. URL-encode special characters
   in the password (for example, `@` becomes `%40`).
2. Run `npm run db:preflight` to confirm connectivity and inspect table counts.
   Then run `npm run db:apply` (or apply
   `supabase/migrations/20260930000000_initial_schema.sql` in Supabase's SQL
   Editor).
3. Run `npm run db:copy-sqlite`. The Postgres copy script preserves IDs and
   relationships and refuses to run if any destination table already has rows.
   If your network cannot reach PostgreSQL directly, use
   `npm run db:copy-sqlite-rest` with `SUPABASE_URL` and the server-only
   `SUPABASE_SERVICE_ROLE_KEY` in `.env`; this HTTPS path remaps IDs and all
   foreign-key references, and also refuses a non-empty destination.
4. Start with `npm run dev`. The API exits at startup if `DATABASE_URL` is missing;
   it never silently falls back to SQLite.

For deployment, set `DATABASE_URL` and a long random `JWT_SECRET` as server-side
environment variables. Vercel runs the Express API as serverless functions, so
use the Supabase transaction pooler connection string for `DATABASE_URL` (copy
it from Supabase's Connect panel; do not construct the pooler hostname). Keep
the direct connection string for local or persistent-server use. The migration
enables RLS on the application tables; the server connects privately and does
not expose database credentials to the frontend.

## Deploy to Vercel

1. Push this project to a Git repository and import it into Vercel. Keep `.env`
   out of the repository; it is ignored by Git.
2. Use the project root as the Root Directory. The included `vercel.json` sets
   the Vite build command and `dist` output, routes API calls to Vercel Functions,
   and falls back to the SPA for client-side routes.
3. In Vercel Project Settings → Environment Variables, add `DATABASE_URL` using
   the Supabase **Transaction pooler** URI from the Connect panel, plus
   `JWT_SECRET`. Add both for Preview and Production, then redeploy. Do not use
   the service-role key as `DATABASE_URL`.
4. Open `/api/health` on the deployment URL. It should report
   `database: "supabase-postgres"` and return the user/class counts.

Production:

```bash
npm run build    # bundle to dist/
npm start        # Express serves dist/ and the API on :3001
```

Tests (all of them need the app running on :3001, and a fresh seed is
recommended between suites because they mutate data):

```bash
npm run test:api            # 76 assertions against the REST API
npm run test:api:features   # 80 assertions for search, reviews, Q&A, admin…
npm run test:ui             # 46 assertions driving real Chrome over CDP
npm run test:ui:features    # 86 assertions for the newer surfaces
npm run test:landing        # 35 assertions protecting the landing page
npm test                    # every suite in order
```

The `test:ui*` and `test:landing` suites need Chrome listening on port 9222:

```bash
google-chrome --headless=new --remote-debugging-port=9222 \
  --user-data-dir=/tmp/cdp about:blank
```

## Demo accounts

Password for all seeded accounts is `password123`.

| Role | Email |
|---|---|
| Student | `student@iankrm.test` |
| Tutor | `kenji@iankrm.test` |
| Admin | `admin@iankrm.test` |

The admin account has a normal `student` role plus an `is_admin` flag, and
reaches `/admin` where it can hide reviews, unpublish classes, and read the
moderation log.

## Stack

Vite 8 · React 19 · React Router 7 · Express 5 · Supabase Postgres via `pg` ·
JWT auth with bcrypt hashes. No UI, carousel, or ORM library.

## Routes

| Route | Who | What |
|---|---|---|
| `/` | everyone | Marketing landing page |
| `/signup` | signed out | Create an account — pick **student** or **tutor** |
| `/login` | signed out | Sign in |
| `/browse` | any | Catalogue with search and category filter |
| `/class/:slug` | any | Class detail and enrolment |
| `/learn/:slug` | any | Video player, curriculum, progress |
| `/dashboard` | student | Enrolled classes and progress |
| `/teach` | tutor | Own classes, drafts, enrolled students |
| `/teach/new` | tutor | Create a class |
| `/teach/:slug` | tutor | Edit class, add lessons, publish |
| `/settings` | any | Profile, preferences, password, subscription, delete |
| `/checkout` | any | Choose a plan, optionally with a promo code |
| `/search` | any | Full results across classes and tutors |
| `/wishlist` | student | Saved classes |
| `/certificates` | student | Completed classes and their certificates |
| `/notifications` | any | Notification feed |
| `/earnings` | tutor | Sales, share, and promo codes |
| `/admin` | admin | Review/class moderation, users, moderation log |
| `/forgot-password` | signed out | Request a reset link |
| `/reset-password` | signed out | Set a new password from a token |
| `/verify-email` | signed out | Confirm an email address from a token |
| `/verify/:code` | everyone | Public certificate verification |
| `/terms` `/privacy` `/cookies` | everyone | Legal pages |

Role guards live in `src/components/Guards.jsx`. A student who opens `/teach`
is redirected to `/dashboard` and vice versa; `RequireAdmin` bounces anyone
without `is_admin` to their own home page. The reset and verification routes
are deliberately reachable while signed out, because the person holding the
link may not have a session.

## Structure

```
server/
  index.js              Express app, static SPA serving, error handling
  db.js                 schema, seed data, demo credentials
  auth.js               JWT sign/verify, requireAuth, requireRole
  test-api.mjs          API test suite
  test-features-api.mjs API suite for the newer endpoints
  test-ui.mjs           headless browser test suite
  test-features-ui.mjs  headless suite for the newer pages
  test-landing.mjs      guards the landing page against regressions
  routes/
    auth.js             signup, login, me
    account.js          password reset, email verification
    classes.js          catalogue, detail, tutor authoring, ratings
    enrollments.js      enrol, progress, per-lesson state, certificates
    settings.js         preferences, password, account deletion
    billing.js          mock checkout with promo codes
    reviews.js          ratings and review CRUD
    questions.js        Q&A: ask, reply, answer
    wishlist.js         saved classes
    notifications.js    feed, mark read
    certificates.js     issue and public verification
    notes.js            transcripts and private lesson notes
    search.js           class and tutor search
    admin.js            moderation, users, earnings, promo codes

src/
  main.jsx              entry, stylesheet order
  App.jsx               router
  lib/api.js            fetch wrapper, token storage
  context/AuthContext.jsx
  pages/
    Landing.jsx         the marketing page
    Signup.jsx          student/tutor role selector
    Login.jsx
    Browse.jsx  ClassDetail.jsx  Learn.jsx  Checkout.jsx  NotFound.jsx
    StudentDashboard.jsx  TutorDashboard.jsx  TutorClassEditor.jsx
    Settings.jsx  Search.jsx  Wishlist.jsx  Notifications.jsx
    Certificates.jsx  Account.jsx  Legal.jsx  Admin.jsx  Reviews.jsx
  components/
    AppShell.jsx        signed-in header
    Guards.jsx          route protection
    ui.jsx              cards, stars, progress bar, toggles, alerts
    Nav.jsx Hero.jsx Quiz.jsx Benefits.jsx Featured.jsx Trending.jsx
    Banners.jsx Testimonials.jsx EmailCapture.jsx Faq.jsx StickyCta.jsx
    Logo.jsx  Button.jsx
  styles/
    tokens.css base.css utilities.css sections.css    ← landing page (recovered)
    app.css                                        ← app shell and pages
  data/content.js        landing page copy and content
```

## Data model

`users` (with a `role` of `student` or `tutor`, plus `is_admin` and
`email_verified_at`) · `tutor_profiles` · `subscriptions` · `classes` (owned by
a tutor, `draft` or `published`) · `lessons` · `enrollments` ·
`lesson_progress` · `settings` · `reviews` · `questions` · `wishlist` ·
`notifications` · `certificates` · `transcripts` · `lesson_notes` ·
`earnings` · `promo_codes` · `auth_tokens` · `moderation_log`.

Migrations are additive and re-runnable, so an existing `data/` directory
upgrades in place on the next boot instead of needing a reset.

`data/iankrm.db` is retained only as the one-time migration source. The API no
longer opens or seeds SQLite, and Supabase Postgres is not seeded on startup.

## Auth

Passwords are bcrypt-hashed (cost 10). Signup and login return a JWT that the
client stores in `localStorage` under `iankrm.token`. A `401` from the API
clears the stored token automatically, so a dead session cannot loop.

Tokens are stateless and valid for 7 days. `POST /api/auth/logout` is advisory
— the client discards the token. Add a server-side denylist if you need
immediate revocation.

## What is real and what is not

Working: accounts and roles, enrolment, per-lesson progress with resume
position, tutor authoring and publishing, preferences that persist, password
change, account deletion, subscription state, search, reviews and ratings, Q&A,
wishlist, notifications, certificate issuing with public verification,
transcripts written by the owning tutor, private lesson notes, promo codes,
earnings reporting, and admin moderation.

Not real:

- **Payments.** Checkout is a demo: enter any 4 digits and a plan activates.
  Replace `server/routes/billing.js` with a Stripe PaymentIntent plus webhook
  before taking money.
- **Video.** Lessons take a plain video URL. The seed data points at Google's
  public sample MP4s. There is no transcoding, DRM, or adaptive streaming.
- **Imagery.** Instructor and class art is generated from a `hue` value
  (gradient + monogram). Replace with real photography.
- **Light theme.** The setting persists but only dark renders.
- **Email.** No messages are sent at all. Password reset and email verification
  mint real single-use tokens with a 60-minute expiry, but with no mail
  transport the link is surfaced in the UI and through a
  `/api/auth/token-debug/*` route that returns 404 in production. Preferences
  are stored only.
- **Payouts.** Earnings are computed and displayed per tutor, but there is no
  Stripe Connect onboarding or transfer to a bank account.

## Fonts

Söhne (Klim Type Foundry) is commercially licensed, so the licensed `.woff2`
files are **not** included. `src/styles/base.css` declares `@font-face` rules
with `local()` sources, so Söhne is used automatically if it is installed
locally. Otherwise **Inter** loads from Google Fonts as the metric substitute.

To self-host a licensed copy, drop the files in `public/fonts/` and add the
`src: url(...)` lines to the `@font-face` blocks.

## Notes on the landing page

- The landing page CSS (`tokens.css`, `base.css`, `sections.css`,
  `utilities.css`) is the recovered first-pass build and is kept separate from
  `app.css` so the app work cannot disturb it.
- **Fluid scale.** One `--mc-scale-*` ramp drives both spacing and font-size,
  re-declared at 768px and 960px. Verified: `mc-text-d2` is 96 / 105.6 / 128px
  and `mc-text-h1` is 54.4 / 60.8 / 76.8px across the three tiers.
- **Mosaic.** The production hero is JS-driven (Slick + rAF) at 50s per lap,
  doubled to 100s. This uses a duplicated CSS track with a `-50%` keyframe,
  which produces the same motion and adds a pause control.
- **Not the live page.** The production homepage was mined for real component
  values; those notes are in `DESIGN-SYSTEM.md` under "Part 2 — Homepage
  component values". They are **not** what this build implements — it follows
  the two-column hero and `mc-text-*` type scale described above.

This is a design study and is not affiliated with MasterClass.
