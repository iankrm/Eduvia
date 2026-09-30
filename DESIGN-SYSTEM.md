# MasterClass — Extracted Design System

Source: `https://www.masterclass.com/` SSR HTML + all 9 production stylesheets (420KB).
Raw CSS archived in `/tmp/opencode/css_*.css`.

---

## 1. Brand Core

| Token | Value | Use |
|---|---|---|
| Brand pink (primary) | `#e32652` (`pink-500`) | CTAs, logo accent, active states |
| Primary hover / pressed | `#d61a46` / `#c71a42` | Button interaction |
| Brand highlight | `#ef4562` | Legacy accent, logos |
| Cream / nameplate | `#fffef2` | Certificate wordmark, inverted logo |
| Page background | `#0d0d0e` (`neutral-1000`) | **Dark site** |
| Page foreground | `#ffffff` | Body text |
| Focus ring | `#3787ff` | Accessibility outlines |
| Announce | `#eed37f` | Announcement text |
| AI accent | `rgb(101,34,242)` | AI-themed sections |

## 2. Neutral Ramp

```
90   #ffffff   100  #f4f4f5   200  #e9eaec   300  #d4d5d9
400  #b3b5bc   500  #9ea0a9   600  #565961   700  #43454c
800  #303136   900  #222326   1000 #0d0d0e   1010 #000000
```

Semantic aliases:
- `--mc-color-bg-page-default` → `neutral-1000`
- `--mc-color-text-default` / `-light` → `#ffffff`
- `--mc-color-text-dark` → `#000000`
- `--mc-color-text-tint` → `neutral-500`
- `--mc-color-divider-subtle` → `neutral-800`
- `--mc-color-divider-strong` → `neutral-500`
- `--mc-color-elevation` → `neutral-900`
- `--mc-color-secondary-default` → `neutral-700`

## 3. Status Ramp (all 100→900)

| Ramp | 500 | Notes |
|---|---|---|
| primary | `#e32652` | pink |
| utility | `#4721d0` | purple |
| success | `#3ebb70` | green |
| warning | `#ff9000` | yellow/orange |
| error | `#ff3333` | red |

## 4. Typography

### Families
| Family | Weights | Role |
|---|---|---|
| `Sohne` | 400 (Buch), 600 (Halbfett) | Body + all headings |
| `Sohne Schmal` | 600 (Dreiviertelfett) | Condensed display / poster type |
| `Ivar Display Condensed` | 400 | Editorial display accent |
| `Impact-fallback` | — | `size-adjust: 73%` metric fallback |

Söhne is licensed (Klim Type Foundry). Substitute a metrically similar grotesk
(e.g. Inter / Roboto) with `ascent-override: 80%; descent-override: 20%`.

### Line heights
```
--mc-lh-heading--ultra-tight : 0.9
--mc-lh-heading--super-tight : 1
--mc-lh-heading--tight       : 1.15
--mc-lh-heading              : 1.25
--mc-lh-body                 : 1.5
--mc-lh-body--tight          : 1.45
--mc-lh-body--relaxed        : 1.6
```

### Type scale — `mc-text-*`
`d*` = `font-weight 600`, `line-height 1.15`. `h1`–`h8` = `font-weight 600`,
`line-height 1.25`, `letter-spacing .03em`.

| Class | Scale | Mobile | ≥768px | ≥960px | tracking | weight / lh |
|---|---|---|---|---|---|---|
| `mc-text-d1` | 10 | 73.6 | 83.2 | **102.4** | .03em | 600 / 1.15 |
| `mc-text-d2` | 11 | 96 | 105.6 | **128** | .03em | 600 / 1.15 |
| `mc-text-d3` | 12 | 115.2 | 128 | **153.6** | .01em | 600 / 1.15 |
| `mc-text-h1` | 9 | 54.4 | 60.8 | **76.8** | .03em | 600 / 1.25 |
| `mc-text-h2` | 8 | 32 | 38.4 | **51.2** | .03em | 600 / 1.25 |
| `mc-text-h3` | 7 | 32 | 35.2 | **44.8** | .03em | 600 / 1.25 |
| `mc-text-h4` | 6 | 28.8 | 32 | **38.4** | .03em | 600 / 1.25 |
| `mc-text-h5` | 5 | 28.8 | 28.8 | **32** | .03em | 600 / 1.25 |
| `mc-text-h6` | 4 | 25.6 | 25.6 | **25.6** | .03em | 600 / 1.25 |
| `mc-text-h7` | 3.5 | 22.4 | 22.4 | **22.4** | .03em | 600 / 1.25 |
| `mc-text-h8` | 3 | 19.2 | 19.2 | **19.2** | .03em | 600 / 1.25 |
| `mc-text-large` | 5 | 28.8 | 28.8 | **32** | .01em | 400 / 1.6 |
| `mc-text-small` | 3.5 | 22.4 | 22.4 | **22.4** | .02em | 400 / 1.5 |
| `mc-text-x-small` | 3 | 19.2 | 19.2 | **19.2** | .02em | 400 / 1.45 |

Line clamping is token-driven: `.mc-text--N-lines` sets
`height: calc(N * var(--mc-lh-body*) * 1em)` (up to 16 lines).

## 5. Spacing — `--mc-scale-*`

Single fluid scale that grows at `md`/`lg` breakpoints. Used for **both**
spacing and font-size, which is why type scales fluidly.

| Scale | Mobile | ≥768 | ≥960 |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 1 | 6.4 | 6.4 | 6.4 |
| 2 | 12.8 | 12.8 | 12.8 |
| 3 | 19.2 | 19.2 | 19.2 |
| 4 | 25.6 | 25.6 | 25.6 |
| 5 | 28.8 | 28.8 | 32 |
| 6 | 28.8 | 32 | 38.4 |
| 7 | 32 | 35.2 | 44.8 |
| 8 | 32 | 38.4 | 51.2 |
| 9 | 54.4 | 60.8 | 76.8 |
| 10 | 73.6 | 83.2 | 102.4 |
| 11 | 96 | 105.6 | 128 |
| 12 | 115.2 | 128 | 153.6 |
| 13 | 137.6 | 150.4 | 179.2 |
| 14 | 156.8 | 172.8 | 204.8 |
| 15 | 870.4 | 886.4 | 921.6 |
| 16 | 966.4 | 985.6 | 1024 |
| 3.5 | 22.4 | 22.4 | 22.4 |

Utilities: `.mc-p{m,t,b,x,y}-{scale}`, `.mc-m{...}`, `.mc-gap-{scale}`.

Section rhythm (observed in DOM): `mc-my-10` / `mc-my-12`, heading blocks
`mc-mt-11 mc-mb-10`.

## 6. Layout

```
--mc-bp-xs: 0        --mc-bp-sm: 576px
--mc-bp-md: 768px    --mc-bp-lg: 960px
--mc-bp-xl: 1200px

--mc-grid-columns: 12
--mc-grid-gutter-width: scale-8 / 2
--mc-container-padding: gutter * 2
--mc-container-max-width: 1136px
--mc-maximum-content-width: 1264px
--mc-page-content-width: min(1264px, 100vw)
--mc-page-margin: 100vw - page-content-width + (container-padding + gutter)
--mc-overflow-inner-padding: page-margin / 2
--mc-overflow-outer-margin: -inner-padding - gutter/2
```

Grid: 12-col flex, `.row` has negative margin `-8px`, `.col-*` spans.
Legacy aliases: `--container-max-width: 1200px`, `.container--md` 880px,
`.container-sm` 824px, `.container-lg` 1600px.

Hero: `col-12 col-md-7 col-lg-6` (copy) + `col-md-4 col-lg-6` (instructor
mosaic) — stacks below `md`.

## 7. Radii & Borders

```
--mc-corners--sm : scale-2
--mc-corners--md : scale-3
--mc-corners--lg : scale-4
--mc-corners--xl : scale-6
--mc-corners--0 / --circle / --rounded (utilities)
partials: --corners-top-left--sm, --corners-bottom-right--sm

--mc-border--default: 1px solid var(--mc-theme-form-border)
--mc-border--md     : 2px solid var(--mc-theme-form-border)
```

## 8. Buttons — `.c-button`

```css
.c-button {
  padding: var(--mc-scale-3) var(--mc-scale-6);
  font-size: var(--mc-scale-4);
  line-height: var(--mc-scale-5);
  font-weight: 600;
  letter-spacing: .01em;
  text-transform: capitalize;
  color: #fff;
  border-radius: var(--mc-scale-2);
  display: inline-flex; align-items: center; justify-content: center;
  transition: background .25s ease, box-shadow .25s ease;
}
.c-button:focus-visible {
  outline: 2px solid var(--mc-color-element-focus-outline);
  outline-offset: 2px;
}
.c-button:disabled { opacity: .3; cursor: not-allowed; }
```

Sizes:
| Modifier | Padding | Font-size | Line-height |
|---|---|---|---|
| `--xs` | scale-1 / scale-4 | — | — |
| `--sm` | scale-2 / scale-5 | scale-3 | scale-4 |
| `--lg` | scale-4 / scale-7 | scale-5 | scale-6 |
| `--symmetrical` | scale-3 (all sides) | | |

Variants: `--primary` (pink 500/600/700) · `--accent` · `--secondary`
(neutral 700/800/900) · `--tertiary` (transparent + `inset 0 0 0 2px`
neutral-700 ring) · `--utility` (purple) · `--play` (white) · `--link`
(underline on hover via `span:after`) · `--control` (round, scale-9 ⌀).
Social: `--google #fff/#000` · `--facebook #3c5a99` · `--twitter #2ba2ef` ·
`--messenger #0078ff` · `--pinterest #bd081c` · `--paypal #ffc439` ·
`--linked-in #0e76a8` · `--apple #000`.

Other flags: `--full-width`, `--with-icon` (icon gap `1.3rem`),
`--loading` (hides content, spins `spin .5s linear infinite`).

## 9. Dark Theme Overrides

`--mc-theme-background: #000` · `--mc-theme-text: #fff` · form bg `#191c21` ·
form border `#272c33` · placeholder `rgba(255,255,255,.5)` · dropdown
`#191c21` / border `#272c33` · tooltip `#272c33` · carousel dot `#596170`
(active `#fff`) · carousel arrow bg `#272c33` (hover `#31333b`) · arrow
`#949aa4` (hover `#fff`) · checkbox/radio border `#949aa4` · selected
checkout `rgba(25,28,33,.8)`.

## 10. Motion

Only three keyframes ship: `spin`, `mcAnimateFadeIn`, `rotation`.
Transitions are `0.25s ease` on background/box-shadow. The hero instructor
mosaic is a JS-driven (Slick + rAF) dual-column vertical loop, 50s per
column doubled to 100s, pauseable via a control button.

## 11. Page Composition (top → bottom)

1. Dark dual-tier nav — `neutral-1000` promo strip + main bar
2. Hero — copy left / scrolling instructor mosaic right
3. Personalization quiz — 8 interest options
4. Membership benefits — 3 plans, $10/mo, 30-day guarantee
5. Featured instructor
6. Category picker + trending carousel
7. Start Journey CTA
8. Certificates split banner
9. MasterClass at Work (business, `neutral-900`)
10. Member testimonial carousel
11. Email capture
12. FAQ accordion
13. Sticky footer CTA (rotating verb: "Learn while you walk/commute/cook/…")
14. Dark footer

---

# Part 2 — Homepage component values

> **Reference only — not implemented in this build.** These are the real values
> measured from the live MasterClass homepage (full-bleed wall hero, Söhne
> Schmal display type, `#dcff00` second accent). The app in this repo follows
> the earlier two-column hero and `mc-text-*` type scale documented in Part 1.
> Kept here because it is the accurate extraction, and it is the natural
> starting point if the layout is ever brought in line with production.

Read directly out of the production CSS modules. These supersede the
first-pass guesses above.

## Typography families actually in use

| Family | Role | Substitute |
|---|---|---|
| `Sohne` (400/600) | body, buttons, form fields | Inter |
| `Sohne Schmal` (600) | **all display type** via `.mc-text--brand`, `.mc-text-b1/b2`, `.common_Title` | Archivo (variable `wdth`) |
| `Ivar Display Condensed` (400) | certificates banner title only | Bodoni Moda |
| `Söhne Mono` | guarantee lines (11px) | JetBrains Mono |

Key finding: `.mc-text--brand` is the condensed **face**, not a colour — the
colour equivalent is `.mc-text-color--primary`. Display type runs
`line-height: .85` and `line-height: .91` in the hero, not the 1.15/1.25 of the
`d*`/`h*` scale.

```css
.mc-text--brand { font-family: 'Sohne Schmal', …; line-height: .85;
                  letter-spacing: .01em; font-weight: 500; }
.mc-text-b1, .mc-text-b2 { font-family: 'Sohne Schmal', …;
                          font-weight: 800; text-transform: uppercase; }
.common_Title { font-family: 'Sohne Schmal', …; line-height: 85%;
               text-transform: uppercase; overflow: hidden;
               text-overflow: ellipsis; }
body { font-variant-ligatures: none; text-rendering: optimizeLegibility; }
```

## Second brand accent

`--c-brand-highlight: #dcff00` — a lime, not pink. Used for the certificates
CTA, the active filter-picker border (`--mc-color-outline-announce: #eed37f` is
the related token), and the plan "Most popular" flag.

## `DualCtaHero` — the hero is a full-bleed wall

Not a two-column text-and-mosaic layout. The hero is `min-height:
calc(100svh - 64px)` (86vh ≥768px) on `#14020a`, filled edge to edge with a row
of narrow portrait columns that scroll vertically in alternating directions.
Copy is **absolutely positioned at the bottom and centred**.

```css
.hero        { background: #14020a; min-height: calc(100svh - 64px); }
.wall        { --tile-w: 120px;  bottom: 2px; }   /* 140px ≥768, 172px ≥960 */
.wall__col   { width: var(--tile-w);
               animation: wall-scroll-up 60s linear infinite; }
.wall__col:nth-child(2n) { animation-name: wall-scroll-down; }
.wall__tile  { width: var(--tile-w); height: calc(var(--tile-w) * 1.45); }
.wall__overlay { background: linear-gradient(0deg, #14020a 0,
                  rgba(20,2,10,.98) 42%, rgba(20,2,10,.82) 60%,
                  rgba(20,2,10,.35) 80%, rgba(20,2,10,.45)); }
.hero__content { position: absolute; inset-inline: 0; bottom: 0;
                 padding-block: var(--mc-scale-8); }
.hero__lockup  { display: flex; flex-direction: column;
                 gap: var(--mc-scale-6); text-align: center; }
.line1 { font-size: 48px; line-height: .91; letter-spacing: .48px; }  /* 52px ≥960 */
.line2 { font-size: 88px; line-height: .91; letter-spacing: .48px; }  /* 96px ≥960 */
.subtitle { font-size: 16px; line-height: 1.5; max-width: 280px; }
.price    { font-size: 16px; line-height: 1.5; color: rgba(255,255,255,.7); }
.actions  { width: 317px; }                                        /* ≥768 */
.guarantee{ font-family: var(--font-sohne-mono), monospace;
            font-size: 11px; line-height: 1.38; color: rgba(255,255,255,.8); }
```

## `DualCtaBlock` — quiz and plans

```css
.title  { font-size: clamp(40px, 11.2vw, 80px); line-height: .9; }
         /* ≥768: clamp(48px, 5.3vw, 80px) */
.subtitle { margin-top: var(--mc-scale-4); }
.actions  { margin-top: var(--mc-scale-6); max-width: 340px; }     /* ≥768 */
.divider  { width: 24px; height: 4px; background: var(--mc-color-brand); }
```

## `FilterPicker` — dark pills, not filled

```css
.filterButton { background: var(--mc-color-bg-container-dark);
                color: var(--mc-color-text-tint);
                border: 1px solid var(--mc-color-bg-container-dark); }
.filterButton:hover { color: var(--mc-theme-text); }
.filterButton.active { --active-color: var(--mc-color-outline-announce);
                       color: var(--mc-theme-text);
                       border: 1px solid var(--active-color); }
```

## `GlobalCarousel` / `Carousel`

```css
.tile            { width: 256px; }                     /* 220px ≤768 */
.carousel        { display: flex; flex-wrap: nowrap; overflow-x: auto;
                   scroll-snap-type: x mandatory; }
.carousel > *    { flex-shrink: 0; }
.carousel > *    { scroll-snap-align: start; }
/* veils fade the track edges into the page */
.veil::before/::after { height: var(--mc-scale-11);
                        background: linear-gradient(…, #010002); }
```

## `JumpNav` — sticky catalog bar

```css
.JumpNav { position: sticky; z-index: 1000;
           top: calc(var(--mc-scale-10) - 1px);
           height: var(--mc-scale-10);
           backdrop-filter: blur(6px);
           box-shadow: 0 4px 4px rgba(0,0,0,.25); }
.JumpNav::before { position: absolute; inset: 0;
                   background: var(--mc-color-neutral-1010); opacity: .85; }
.JumpNav_Item    { border-bottom: 2px solid #272c33; opacity: .6; }
.JumpNav_ItemActive { border-bottom-color: #fff; }
```

## `CertificatesBanner`

```css
.contentContainer { background: #211d0d; padding: 48px 32px; }  /* 64/48 ≥768 */
.title  { font-family: 'Ivar Display Condensed', serif;
          font-size: 44px; line-height: 1.1; color: #fffef2;
          max-width: 497px; }                                   /* 64px ≥768 */
.subtitle { font-size: 18px; line-height: 1.6; letter-spacing: .18px; }
.ctaButton { background: #dcff00; color: #211d0d;
             border: 2px solid transparent; }
.ctaButton:hover { background: #3b3227; border-color: #dcff00; color: #fffef2; }
```

## `ForBusinessSection` / `BusinessBanner`

```css
.card { background: radial-gradient(ellipse 120% 95% at 100% 100%,
            rgba(230,12,73,.6) 0, rgba(230,12,73,.35) 25%,
            rgba(230,12,73,.15) 55%, rgba(230,12,73,.05) 80%, transparent),
          var(--mc-color-bg-container-dark); }
/* ≥768: background: rgba(13,13,14,.3); min-height: 492px */
.title { line-height: 90%; letter-spacing: -.01em; white-space: nowrap; }
.titleLight { color: var(--mc-color-neutral-700); }
.banner { height: 335px; }   /* 410 ≥960, 460 ≥1200 */
.logo   { width: 173px; height: 40px; }
```

## `NYTQuote`

```css
.title { margin: 0 auto; max-width: 408px; width: 100%; }
.lineSeparator { background: var(--mc-color-brand);
                 height: 4px; margin: 0 auto; width: 32px; }
```

## `Sticky`

```css
.sticky { position: fixed; width: 100%; z-index: 1001;
          opacity: 0; transform: translateY(100%); visibility: hidden;
          transition: transform .5s ease, opacity .5s ease, visibility .5s ease; }
.stickyActive { opacity: 1; transform: none; visibility: visible; }
.bottomBg { background: rgba(25,28,33,.95); }
.topBg    { background: #000; }
```

## Other extracted details

- `CatalogExplorer_heading`: `font-weight: 400; letter-spacing: 2.4px;
  line-height: 100%` — the "Trending" label is light and wide-tracked.
- `Instructors_image`: `width: 140px` (98px ≤425px).
- `BogoPromoModal_badge`: `background: var(--mc-color-warning-300)`.
- The FAQ, class-card, and footer styles are **not** in the nine initial
  stylesheets — they arrive in lazily-loaded per-route chunks, so those three
  were rebuilt to match the DOM structure and the token system rather than
  ported verbatim.

