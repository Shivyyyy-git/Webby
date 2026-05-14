# Design + typography audit
**Date:** 2026-05-14
**Scope:** homepage (`/`), work detail (`/work/[slug]`), all chrome (Margins, Chrome nav, NowPlaying, AskAI, Greeter), every section component.
**Method:** read every component's CSS, then inspect computed font-size / line-height / letter-spacing in the live preview at desktop (1440), tablet (768), and mobile (375).

---

## Type scale — what's actually rendering

Measured in the preview at three viewports. Numbers are computed `font-size` after `clamp()`.

| Token | Mobile 375 | Tablet 768 | Desktop 1440 | Notes |
|---|---|---|---|---|
| `.hero-name` (h1) | 60px | 80.6px | 151.2px | clamp 60 / 10.5vw / 170 |
| `.work-mast .wm-letter` (WORK) | 72px | 107.5px | 201.6px | clamp 72 / 14vw / 220 — biggest type on page |
| `.cl-h` (close) | 64px | 84.5px | 158.4px | clamp 64 / 11vw / 220 — capped above `.hero-name` ceiling |
| `.tnum` (receipts numbers) | 64px | 64px | 115.2px | clamp 64 / 8vw / 128 |
| `.work-h` (Things I built…) | 46px | 53.8px | 100.8px | clamp 46 / 7vw / 118 |
| `.rh` (Numbers I can defend.) | 40px | 47.6px | 89.3px | clamp 40 / 6.2vw / 108 |
| `.spine-h` (A career, read in order.) | — | — | 86.4px | clamp 44 / 6vw / 88 |
| `.tl-h` (Three cities. Two exits.) | 40px | 46px | 86.4px | clamp 40 / 6vw / 108 |
| `.cs-title` (work detail h1) | 52px | 69px | 129.6px | clamp 52 / 9vw / 140 |
| `.proj-name` (h3) | 36px | 36px | 66.2px | clamp 36 / 4.6vw / 68 — frozen below 780 |
| `.lentry h3` (timeline role) | 26px | 26px | 37.4px | clamp 26 / 2.6vw / 40 |
| `.hero-sub .hs-line` | 20px | 20px | 25.9px | clamp 20 / 1.8vw / 28 |
| `.lentry .where` | 16px (fixed) | 16px | 16px | hardcoded, doesn't scale |
| `.lentry .note` | 15.5px (fixed) | 15.5px | 15.5px | hardcoded |
| `.work-blurb` | 15px (fixed) | 15px | 15px | hardcoded |
| `.hero-bio` | 15px | 15px | 15.8px | clamp 15 / 1.1vw / 17 |
| `.proj-desc` | 14.5px (fixed) | 14.5px | 14.5px | hardcoded |
| `.tnote` (receipts caption) | 13px (fixed) | 13px | 13px | hardcoded — small for a paragraph |
| body root | 16 / 1.55 | 16 / 1.55 | 16 / 1.55 | fine |
| `.cap`, `.tlbl`, `.proj-cta` | 10px | 10px | 10px | mono, tracked 0.16em |
| `.proj-tag`, `.cl-cap`, `.cl-end` | 9px | 9px | 9px | mono, tracked |
| `.hp-meta`, stamp/sticker meta | 8–8.5px | 8–8.5px | 8–8.5px | very small |

**What this says:**
- The display ladder is well-tuned at desktop. Receipts → Work → Timeline → Close descend in importance correctly, except `.cl-h` peaks at 220px in `clamp()` — above `.hero-name` (170px) — and `.wm-letter` peaks at 220 too. The "close" headline shouldn't outweigh the hero name; the hero is the anchor.
- Body copy floors are in a narrow band (13–17px). Several paragraph-class elements (`.tnote` 13, `.proj-desc` 14.5, `.work-blurb` 15, `.lentry .note` 15.5) are hardcoded and never grow. On a 27" monitor these read like fine print next to a 200px masthead.
- The 8–10px mono labels are decorative tracking, which works as ornament but fails when zoomed for accessibility users.

---

## Issues, ranked

### 1. Section numbers are wrong (factual bug)
- `Receipts.astro` — Section 02
- `Work.astro` — **Section 03**
- `Timeline.astro` — **Section 03** ← duplicate
- `Close.astro` — Section 05 ← skips 04
- `Phil.astro`, `Off.astro` carry Section 05 / 06 but aren't rendered

The eyebrow caps are a typographic device the brief leans on — the numbers being broken undermines it. Renumber to 02 / 03 / 04 / 05 after the page-level cut.

[Receipts.astro:11](src/components/sections/Receipts.astro:11), [Work.astro:7](src/components/sections/Work.astro:7), [Timeline.astro:66](src/components/sections/Timeline.astro:66), [Close.astro:5](src/components/sections/Close.astro:5)

### 2. Timeline has two competing H2s
```astro
<h2 class="tl-h">Three cities. Two exits.<br/>One <em>thread</em>.</h2>
<!-- followed immediately by -->
<h2 class="spine-h">A career, <em>read in order.</em></h2>
```
Two display serif headlines stacked on the same section, both h2, both `text-wrap: balance`, both italic accent. Pick one. The `spine-h` reads like it was added later to introduce the logbook spine, but it duplicates the work `tl-h` already does. Easiest fix: drop `spine-h` and keep the `spine-eye` meta line alone above the rail.

[Timeline.astro:67-73](src/components/sections/Timeline.astro:67)

### 3. Close headline can exceed the hero
`.cl-h` clamps to **220px** ceiling but `.hero-name` ceilings at 170px. At a 1920+ viewport the close section outweighs the hero typographically. Cap `.cl-h` at ~160–170 to keep the hero the loudest moment.

[Close.astro:42](src/components/sections/Close.astro:42)

### 4. Body paragraphs don't scale with viewport
Four paragraph elements are hardcoded:
- `.tnote` 13px
- `.proj-desc` 14.5px
- `.work-blurb` 15px
- `.lentry .note` 15.5px
- `.lentry .where` 16px

On a 27" 4K display these read as captions next to display type running at 100–200px. Convert each to a small clamp, e.g. `.proj-desc { font-size: clamp(14.5px, 1vw, 17px); }`. Same for the others.

### 5. Sub-12px mono labels are everywhere
Below 12px:
- `.cap` 10px
- `.proj-tag` 9px
- `.cl-cap` 9px, `.cl-end` 9px
- `.cs-tag` 9px
- `.stub .lbl` 9px
- `.polaroid .yr` 9px, `.polaroid .pol-lbl` 9.5px
- `.hp-meta` 8px
- Various Desk stamps at 8–8.5px

Decorative ornament — but at 9px tracked 0.14em on `--paper` they're at the edge of WCAG comfortable reading. None are below 4.5:1 contrast (the muted token was bumped to 0.72 alpha specifically for this), but anyone using browser zoom hits ragged tracking immediately. **Floor everything at 10px**, and prefer 11px for any label that conveys content (not pure decoration like crop-mark text). Specifically: bump `.proj-tag`, `.cs-tag`, `.cl-cap`, `.stub .lbl` to 10px; bump `.hp-meta` and Desk stamp `font-size: 8px` lines to at least 9.5px.

### 6. Hero left-spine collides with copy at tablet
The `.margin-lspine` (rotated "SHIVAM SHARMA · MMXXVI · ROCHESTER") is a fixed 28px column on the left. The `.w` container uses `padding: 0 var(--g)` where `--g = clamp(24px, 5vw, 80px)`.
- At 1440: gutter = 72px → 44px of clearance from spine. Fine.
- At 768 (tablet): gutter = 38.4px → **only 10px** clearance. The "delhi." headline in the Desk hero visibly butts up against the spine label.
- At 720: spine hides via `@media (max-width: 720px) { display: none }`. Cliff edge.

Fix: raise `--g` floor (e.g. `clamp(40px, 5vw, 80px)`) OR widen the spine hide breakpoint to `(max-width: 900px)`.

[Margins.astro:96](src/components/chrome/Margins.astro:96), [base.css:143](src/styles/base.css:143)

### 7. `mix-blend-mode: difference` chrome nav is unreliable
`#chrome { mix-blend-mode: difference; color: var(--cream); }` produces dynamic legibility. Reads fine against the cream hero and the ink Work section, but on the cream Close section the "OPEN TO ROLES" pill border becomes a low-contrast olive against grain. The hamburger bars below 900px have the same issue.

Either:
- swap to a solid backdrop (small ink chip behind the nav, like the ticker), or
- pin the nav color per-section via section-scoped `data-` attribute and remove the blend.

[Chrome.astro:73](src/components/chrome/Chrome.astro:73)

### 8. Acid yellow `#e8ff3a` is not a token
Used in three files (`Work.astro` `.stub`, `Timeline.astro` `--acid`, `Greeter.astro` indirectly). Brief says "palette locked in tokens.css." Promote to `--acid: #e8ff3a` in `tokens.css` and reference everywhere.

[tokens.css:1](src/styles/tokens.css), [Work.astro:333](src/components/sections/Work.astro:333), [Timeline.astro:237](src/components/sections/Timeline.astro:237)

### 9. Hero name baseline / descender risk
`.hero-name` has `line-height: 0.82`, `letter-spacing: -0.055em`, `text-transform: lowercase`. The trailing period after "sharma" plus the descenders on "h" (none) and "m" (none) are okay, but the **lowercase italic Fraunces "sharma."** at line-height 0.82 means the period sits just at the bottom of the .word container. Padding `0 0.04em 0.14em` partially compensates. Check at the largest end (≥1700px viewport) — the period can be clipped by `overflow: hidden` on `.word`. Easiest: bump `.word` `padding-bottom` to `0.18em` or raise `line-height` to 0.86.

[HeroWords.astro:212-225](src/components/hero/HeroWords.astro:212)

### 10. Floating timeline preview is empty
Every `ROLES[i].photo` is `null`. The `#toc-preview` card and its cursor-tracking JS exist but every hover shows the diagonal-hatch "PLACEHOLDER" label. Either populate the photo field for at least the NOW row (Maya AI / ESC) or remove the floating preview entirely until photos exist — currently it advertises "we ran out of time" on hover.

[Timeline.astro:14,24,33,42,51,60](src/components/sections/Timeline.astro:14)

### 11. Project row grid is fragile in the 900–1100 band
Desktop grid: `60px 220px 1.3fr 1.5fr 220px` (5 cols with polaroid + stats on the outside).
At 1100→900 it shifts to `50px 180px 1fr 1fr 200px`. That's five cells in ~860px of content width — each ~170px. The middle two `1fr` cells each hold a 36px h3 + 14.5px description with tags — viable but cramped. Below 900 it stacks to 1col, which is fine.
Consider one more breakpoint at ~1280 to drop the right-side stats column under the description.

[Work.astro:158-162,429](src/components/sections/Work.astro:158)

### 12. Heading hierarchy on work detail page is weak
`/work/[slug]/` has one h1 (`.cs-title`) and then no h2 until the markdown content provides them — which it may not. The `.cs-stats` numbers and `.cs-note` block read as the body, then `<Content/>` from MDX. If a case study MDX doesn't open with an h2, screen readers see one h1 followed by paragraphs. Consider promoting `Overview` / `Stats` / `Note` to proper h2 labels on the page.

[work/[slug].astro:32-54](src/pages/work/[slug].astro:32)

### 13. `cs-back` arrows vs sitewide arrow style
On the work detail page the back link is a literal `←` Unicode glyph + text. Everywhere else, arrows are `→` placed inside `<span aria-hidden="true">→</span>`. Decorative vs in-text inconsistency. Either wrap the `←` in an aria-hidden span (and read "Back to Shivam Sharma" for SR) or unify by stripping the aria-hidden pattern elsewhere. Pick one.

[work/[slug].astro:29,57](src/pages/work/[slug].astro:29)

### 14. Z-index uses literal magic numbers across files
Visible from inspect: skip 10000, cursor 9999/9998, greeter 9100, toc-preview 8000, np 600, ask 610, chrome 300, margin-ticker 350, spread 120, main 10. They mostly resolve cleanly but a single regression (e.g. `np` and `ask` overlapping when both visible) would be invisible from a diff. Suggest a small `--z-cursor / --z-modal / --z-chrome / --z-ticker / --z-main` token block in `tokens.css`. Not a visual bug now; a maintenance bug.

### 15. `.hp-meta` "Rochester · 2026" at 8px
On the hero polaroid figcaption, "Rochester · 2026" runs at 8px mono with 0.22em tracking. That's 1.76px of letter-spacing between glyphs — physically smaller than a comma. Bump to 10px with 0.18em.

[HeroWords.astro:332-338](src/components/hero/HeroWords.astro:332)

### 16. Spine label `letter-spacing: 0.32em` at 10px
The left spine and the greeter eyebrow both use 10–11px mono with `letter-spacing: 0.32em`. At 10px that's 3.2px between glyphs; combined with `writing-mode: vertical-rl` it's pleasantly editorial but borderline glyph-distinguishability. Looks intentional; flagging for awareness, not a fix.

[Margins.astro:89](src/components/chrome/Margins.astro:89), [Greeter.astro:110](src/components/chrome/Greeter.astro:110)

### 17. Hero photo `aspect-ratio` mismatch
`#hero-photo { aspect-ratio: 3/4; padding: 16px 16px 62px; }` with an inner `.hp-frame { aspect-ratio: 1/1; }`. The polaroid card is 3:4, the photo inside is 1:1, the bottom caption pad is 62px. Computed math: at 320px wide, photo is 288px tall (1:1), then 62px caption pad + 16px top → polaroid would need to be 366px tall, but 3:4 of 320 = 426px. So there's ~60px of empty paper between the photo and the figcaption. Visible in the homepage screenshot — works as a polaroid but flag if you wanted a tighter card.

[HeroWords.astro:257-322](src/components/hero/HeroWords.astro:257)

### 18. Tablet mobile-nav threshold mismatch
- Chrome nav switches to hamburger at `max-width: 900px`.
- Margins spine hides at `max-width: 720px`.
- Receipts grid drops to 2col at `max-width: 900px`.
- Project row stacks at `max-width: 900px`.
- Timeline rail collapses at `max-width: 780px`.

The 720 / 780 / 900 thresholds aren't aligned. Pick **two** breakpoints — say 900 (tablet / nav) and 600 (phone) — and consolidate. Today, 780px viewport gets stacked timeline but desktop chrome nav, which feels off.

---

## What's working

- Type stack is restrained (4 families) and applied consistently via `typography.css`. Class-to-family mapping is explicit and easy to audit.
- Color tokens are locked and used everywhere; only `--acid` escaped.
- `text-wrap: balance` is applied to every display heading. Good.
- Custom focus ring (`:focus-visible { outline: 2px solid var(--terra) }`) is consistent and visible despite the custom cursor.
- `prefers-reduced-motion` is honored on the spine pulse, ticker, hero rows, reveal class, and TOC preview. Pre-disabled cinema path (`body.no-cinema`) is also respected.
- Receipts row hover (`scaleX` terra underline) is a clean micro-detail.
- Polaroid yellow stubs + acid sweep on timeline are coherent — same `#e8ff3a` repeated builds a visual language.

---

## Suggested fix order

1. **Section numbering** (1 line each, 4 files) — factual.
2. **Drop or merge the duplicate Timeline H2** (Timeline.astro:67–73) — biggest visual + semantic win.
3. **Re-cap `.cl-h` to 170px** and confirm hero still dominates.
4. **Floor body paragraphs at ~15px and clamp upward** (`.tnote`, `.proj-desc`, `.work-blurb`, `.lentry .note`).
5. **Floor sub-12 mono labels at 10px**; bump `.hp-meta` and Desk stamp text.
6. **Raise `--g` to `clamp(40px, 5vw, 80px)`** so tablet copy clears the spine.
7. **Move `#e8ff3a` to `--acid` in tokens.css**.
8. **Resolve mix-blend chrome nav** — solid backdrop chip.
9. **Photos on timeline OR remove the floating preview**.
10. **Consolidate breakpoints to 900 / 600**.

All of the above are CSS-only changes — no JS, no DOM restructuring required.
