# Design audit — fixes
Companion to [design-audit-2026-05-14.md](design-audit-2026-05-14.md). Numbered to match. All fixes are CSS / markup only; no JS rewrites unless noted.

---

## 1. Section numbers
Renumber to match the actual page flow (hero stop-01 → Receipts → Work → Timeline → Close).

- `src/components/sections/Receipts.astro:11` → keep `<b>Section 02</b>`
- `src/components/sections/Work.astro:7` → keep `<b>Section 03</b>`
- `src/components/sections/Timeline.astro:66` → change `<b>Section 03</b>` to `<b>Section 04</b>`
- `src/components/sections/Close.astro:5` → change `<b>Section 05</b>` to `<b>Section 05</b>` (already correct after Timeline becomes 04)

Optional: delete `Phil.astro` and `Off.astro` if they're not in the roadmap, so the numbering inside them doesn't drift again.

## 2. Drop the duplicate Timeline H2
Keep `.tl-h` (brand voice). Remove `.spine-h` (redundant). Keep `.spine-eye` as a meta strap above the rail.

In `src/components/sections/Timeline.astro:69-73`, replace:
```astro
<div class="spine-head reveal">
  <div class="spine-eye"><span class="r"></span> FOLD 04B &nbsp;·&nbsp; LOGBOOK · {ROLES.length} ENTRIES</div>
  <h2 class="spine-h">A career, <em>read in order.</em></h2>
</div>
```
with:
```astro
<div class="spine-head reveal">
  <div class="spine-eye"><span class="r"></span> LOGBOOK · {ROLES.length} ENTRIES</div>
</div>
```
Then drop the `.spine-h` and `.spine-h em` rule blocks in the style section (~lines 218–234). You can leave `.spine-head` and `.spine-eye` CSS — they still apply to the strap.

## 3. Cap `.cl-h` below hero
In `src/components/sections/Close.astro:42`, change:
```css
.cl-h {
  font-size: clamp(64px, 11vw, 220px);
}
```
to:
```css
.cl-h {
  font-size: clamp(56px, 9vw, 168px);
}
```
168px keeps it just under the 170px hero ceiling.

## 4. Floor body paragraphs and let them grow
Five hardcoded paragraph sizes → clamp each.

- `Receipts.astro:101` (`.tnote`): `font-size: 13px;` → `font-size: clamp(13px, 1vw, 15px);`
- `Work.astro:154` (`.work-blurb`): `font-size: 15px;` → `font-size: clamp(15px, 1.1vw, 18px);`
- `Work.astro:302` (`.proj-desc`): `font-size: 14.5px;` → `font-size: clamp(14.5px, 1.05vw, 17px);`
- `Timeline.astro:382` (`.lentry .where`): `font-size: 16px;` → `font-size: clamp(15px, 1vw, 17px);`
- `Timeline.astro:389` (`.lentry .note`): `font-size: 15.5px;` → `font-size: clamp(15.5px, 1.1vw, 18px);`

## 5. Floor sub-12px mono labels at 10px
Bump every 8–9.5px mono label up to 10px. Tracking can drop slightly to compensate.

- `HeroWords.astro:334` (`.hp-meta`): `font-size: 8px; letter-spacing: 0.22em;` → `font-size: 10px; letter-spacing: 0.18em;`
- `Work.astro:315` (`.proj-tag`): `font-size: 9px;` → `font-size: 10px;`
- `Work.astro:376` (`.stub .lbl`): `font-size: 9px;` → `font-size: 10px;`
- `Work.astro:254` (`.polaroid .yr`): `font-size: 9px;` → `font-size: 10px;`
- `Work.astro:264` (`.polaroid .pol-lbl`): `font-size: 9.5px;` → `font-size: 10px;`
- `Close.astro:97` (`.cl-cap`): `font-size: 9px;` → `font-size: 10px;`
- `Close.astro:117` (`.cl-end`): `font-size: 9px;` → `font-size: 10px;`
- `pages/work/[slug].astro:123` (`.cs-tag`): `font-size: 9px;` → `font-size: 10px;`
- `Desk.astro:777,789,796,878,952` — every 8/8.5/9px → 10px (Desk has 8-10 of these stamp labels). Same for `.dcb-meta` and the postcard amount stamps.

After this pass, 10px becomes the absolute floor for mono labels.

## 6. Tablet copy butts against the left spine
Two equivalent fixes; pick one.

**Option A (recommended):** widen the breakpoint that hides the spine on small screens.
- `src/components/chrome/Margins.astro:96`: `@media (max-width: 720px)` → `@media (max-width: 900px)`
- `src/components/chrome/Margins.astro:135`: `@media (max-width: 720px)` → `@media (max-width: 900px)` (crop marks)

**Option B:** raise the gutter floor so copy always clears the spine.
- `src/styles/tokens.css:16`: `--g: clamp(24px, 5vw, 80px);` → `--g: clamp(40px, 5vw, 80px);`
- `src/styles/base.css:144`: `@media (max-width: 900px) { :root { --g: 24px; } }` → `@media (max-width: 600px) { :root { --g: 24px; } }`

Option A is less invasive — only touches Margins.astro.

## 7. `mix-blend-mode: difference` on chrome nav
Drop the blend mode; pin a single color with a backdrop chip behind it.

In `src/components/chrome/Chrome.astro:58-75`, change:
```css
#chrome {
  position: fixed;
  top: 22px;
  ...
  pointer-events: none;
  mix-blend-mode: difference;
  color: var(--cream);
}
```
to:
```css
#chrome {
  position: fixed;
  top: 22px;
  ...
  pointer-events: none;
  color: var(--cream);
  background: linear-gradient(to bottom,
    rgba(29, 46, 34, 0.92) 0%,
    rgba(29, 46, 34, 0.78) 60%,
    rgba(29, 46, 34, 0) 100%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
```
The gradient keeps the nav legible against any section without painting a hard bar.

Then remove the mention of mix-blend-mode at the bottom comment (`Chrome.astro:117-119`).

## 8. Promote `#e8ff3a` to `--acid` token
In `src/styles/tokens.css`, add to the palette block:
```css
--acid: #e8ff3a;
```
Then replace literals:
- `Work.astro:333` (`.stub` background): `background: #e8ff3a;` → `background: var(--acid);`
- `Timeline.astro:237`: delete `.spine-rail { --acid: #e8ff3a; }` (no longer needed; inherits from `:root`)
- `Timeline.astro:423,322` and Work `.polaroid .tape`: replace `var(--acid, #e8ff3a)` fallback shorthand with `var(--acid)`

## 9. Hero name descender clipping
In `src/components/hero/HeroWords.astro:217`, bump the `.word` bottom padding so the period and ascenders sit safely inside the overflow-hidden box.
```css
.hero-name .word {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
  line-height: 0.95;
  padding: 0 0.04em 0.18em; /* was 0.14em */
}
```

## 10. Timeline floating preview is empty
Photos aren't ready; remove the feature until they are. Otherwise every hover shows "PLACEHOLDER".

In `src/components/sections/Timeline.astro`:
- Delete the `#toc-preview` markup block (lines 105–112).
- Delete the entire `<script>` block (lines 116–175).
- Delete the `#toc-preview*` CSS (~lines 400–479).
- Remove `data-preview` and `data-photo` attributes from the `<li class="lentry">` template (lines 84–85).
- Remove `preview:` and `photo:` keys from each `ROLES` entry (lines 14, 23, 32, 41, 50, 59).

When you have a photo for the NOW row, restore the block from git history.

## 11. Project row mid-band layout
Add a 1100–1280 breakpoint to relax the 5-column grid before it stacks.

In `src/components/sections/Work.astro`, between the existing 1100 and 900 media queries (~line 429), insert:
```css
@media (max-width: 1280px) and (min-width: 1101px) {
  .proj { grid-template-columns: 60px 200px 1.4fr 1.4fr 200px; gap: 28px; }
  .polaroid { width: 200px; }
}
```
And keep the 1100 query as-is.

## 12. Work detail heading hierarchy
Either guarantee MDX provides h2s, or add a default h2 above the content.

In `src/pages/work/[slug].astro:49-54`, change:
```astro
<div class="cs-body">
  <div class="cs-note" set:html={note} />
  <div class="cs-content">
    <Content />
  </div>
</div>
```
to:
```astro
<div class="cs-body">
  <section aria-labelledby="cs-overview">
    <h2 class="cs-section-h" id="cs-overview">Overview</h2>
    <div class="cs-note" set:html={note} />
  </section>
  <section aria-labelledby="cs-detail">
    <h2 class="cs-section-h" id="cs-detail">Detail</h2>
    <div class="cs-content">
      <Content />
    </div>
  </section>
</div>
```
And add a small rule:
```css
.cs-section-h {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(237, 228, 211, 0.55);
  margin-bottom: 18px;
}
```
A mono micro-headline keeps the design language without competing with `.cs-title`.

## 13. Back-link arrow consistency
Wrap the literal `←` in `aria-hidden` to match the `→` pattern used everywhere else.

In `src/pages/work/[slug].astro:29`:
```astro
<a href="/" class="cs-back">← Shivam Sharma</a>
```
→
```astro
<a href="/" class="cs-back"><span aria-hidden="true">←</span> Shivam Sharma</a>
```

And `:57`:
```astro
<a href="/" class="cs-back-foot">← Back to portfolio</a>
```
→
```astro
<a href="/" class="cs-back-foot"><span aria-hidden="true">←</span> Back to portfolio</a>
```

## 14. Z-index tokens
Add to `src/styles/tokens.css`:
```css
/* Z-INDEX */
--z-main: 10;
--z-spread: 120;
--z-margin: 240;
--z-chrome: 300;
--z-ticker: 350;
--z-overlay: 600;
--z-toc: 8000;
--z-modal: 9100;
--z-cursor: 9998;
--z-cursor-dot: 9999;
--z-skip: 10000;
```
Then replace literal `z-index: 300;` etc. across files with `z-index: var(--z-chrome);`. Not urgent — do as part of next maintenance pass.

## 15. (covered in 5)

## 16. Spine letter-spacing
Optional, stylistic. Reduce only if you start zoom-testing.
- `Margins.astro:89`: `letter-spacing: 0.32em;` → `letter-spacing: 0.22em;`
- `Greeter.astro:110`: same change.

## 17. Hero polaroid empty space
The card's 3:4 ratio vs the inner 1:1 photo leaves ~60px of empty paper. Tighten the bottom pad.

`HeroWords.astro:264`:
```css
#hero-photo {
  padding: 16px 16px 62px; /* was 62 */
}
```
→
```css
#hero-photo {
  padding: 16px 16px 40px;
}
```
And adjust `figcaption` bottom from `14px` to `10px` (`HeroWords.astro:316`).

## 18. Consolidate breakpoints to 900 and 600
Pick two breakpoints across the site. Apply globally.

- `Margins.astro:96,135`: 720 → 900 (already in #6)
- `Timeline.astro:481`: `max-width: 780px` → `max-width: 900px`
- `Greeter.astro:357`: `max-width: 720px` → `max-width: 600px`
- `Close.astro:125`: `max-width: 480px` → `max-width: 600px`
- `Work.astro:429,433`: keep 1100/900, fine

The big ones are Timeline (rail collapse) and Greeter (radio chip layout). After this, every breakpoint in the project is one of: 1280, 1100, 900, 600.

---

## Suggested PR sequencing

1. **One commit — content/numbering fixes (1, 2, 12, 13)**. Low risk, high payoff.
2. **One commit — type-scale floors (4, 5, 9)**. Visual change but contained to font-size lines.
3. **One commit — gutter & breakpoint cleanup (6, 18)**. Touches multiple files but small changes each.
4. **One commit — chrome nav (7)**. Bigger visual change; deserves its own diff.
5. **One commit — tokens (8, 14)**. Mechanical refactor.
6. **One commit — remove timeline preview (10)**. Deletes code; clean removal.

Items 3, 11, 15–17 can ride along with whichever commit they fit best.
