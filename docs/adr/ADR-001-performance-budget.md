# ADR-001: Performance & Motion Budget for shivam.website

**Status:** Accepted (initial fast-path landed 2026-05-14; CI budget enforcement pending)
**Date:** 2026-05-14
**Deciders:** Shivam (sole)

## Context

The site is a one-pager hire-me portfolio targeting hiring managers and recruiters at AI-forward product orgs (Decagon, Ramp, Sierra, BCG X). Brief specifies a 30-second action: scroll, see Maya AI as proof, click the demo or case study, leave convinced this person ships.

The current build loads, before that proof is visible:

- **Three.js** (~150KB gzip) for the hero "Desk" scene (REMOVED post-ADR, was dead code)
- **GSAP** (~30KB gzip) for ribbon, reveal, journey, magnetic-photo, smooth-anchor animations
- **Tone.js** (~50KB gzip) for an opt-in soundtrack with two music modes (punjabi, english) plus silent
- A **greeter gate** that intercepts the first paint and asks for a music preference before the loader/hero reveal sequence runs

Combined, the eager JS payload was large enough to materially affect LCP on a 4G phone (the device most recruiters scan from). The greeter also adds a click-through before the proof is reachable. Returning visitors skip the greeter, but recruiters are first-time visitors.

The risk is not the site looking impressive, it does. The risk is that the cinematic intro is a tax paid by every first-time recruiter, and the brief's 30-second window starts ticking from URL paste, not from after the loader.

### Constraints

- The interactive layer is a deliberate identity choice. The opinion in the brief ("most AI product demos are dishonest") and the founder/builder positioning argue *for* a site that demonstrates craft. Stripping the interactive layer entirely would weaken the proof.
- No SSR/runtime backend; this is a static Astro build. All gating must happen client-side.
- Mobile-first: hiring managers triage on phones.
- Maintained solo. Whatever policy ships has to be easy for one person to enforce.

## Decision

Adopt a **tiered loading policy** with hard performance budgets, and **decouple proof from cinema**: Maya AI proof renders in the first viewport without waiting for Three.js, GSAP-driven scroll reveals, or Tone.js.

**Tier 0 (critical path, eager, ≤50KB JS gzip):**
- HTML, CSS, Astro chrome
- Hero copy ("HeroWords"), Maya AI proof block, primary CTA, navigation
- A minimal vanilla scroll handler for the ribbon and basic anchor links
- No Three.js, no GSAP, no Tone.js in this tier

**Tier 1 (enhancement, deferred, lazy):**
- Three.js Desk scene: lazy-init on `requestIdleCallback` + `IntersectionObserver` (when hero is visible), with a static poster image fallback rendered immediately
- GSAP scroll reveals: dynamic `import()` after first contentful paint
- Custom cursor, magnetic photo, ribbon flourish: deferred

**Tier 2 (opt-in, on-demand):**
- Tone.js: loaded only after the user picks `punjabi` or `english` in the greeter (already lazy via `await import('tone')` in `audio.ts`)
- Greeter itself: **make it non-blocking** for capable devices, **skip entirely** for slow devices.

**Feature gates (implemented in `src/scripts/capability.ts`):**
- `prefers-reduced-motion: reduce` → skip cinema entirely
- `navigator.connection.saveData === true` → skip cinema
- `effectiveType` in `('slow-2g','2g','3g')` → skip cinema
- `deviceMemory < 4` AND viewport < 768px → skip cinema
- `?nocinema=1` URL param → force skip (testing)

**Performance budget (target, CI enforcement pending):**
- LCP ≤ 2.0s on emulated 4G (Lighthouse mobile)
- TBT ≤ 200ms
- Total JS transferred on first load ≤ 80KB gzip for Tier 0
- Total CSS ≤ 30KB gzip
- Hero poster image ≤ 100KB (AVIF preferred, JPEG fallback)

## Options Considered

### Option A: Status quo, ship everything eager, optimize later

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low (no changes) |
| Cost | Free in dev time, paid in conversion |
| Scalability | Fine for traffic, bad for LCP on mobile |
| Team familiarity | Already built |

**Pros:** No work. Cinema is the brand.
**Cons:** Greeter gates the proof. ~230KB JS before paint. Likely 3.5–5s LCP on a mid-tier Android over 4G. Recruiters bounce before Maya AI is on screen.

### Option B: Strip the interactive layer, go full static

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low (delete code) |
| Cost | Free in dev time, paid in differentiation |
| Scalability | Excellent |
| Team familiarity | Trivial |

**Pros:** Fastest possible site. Pure proof.
**Cons:** Removes the part of the site that demonstrates "ships polished, opinionated work." A founder/builder with a static one-pager reads as a contractor, not a craftsperson. Contradicts the brief's positioning.

### Option C (chosen): Tiered loading with proof decoupled from cinema

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium (refactor bootstrap.ts, add poster fallbacks, feature gates) |
| Cost | ~1–2 days of work |
| Scalability | Excellent, budget enforced at build time |
| Team familiarity | Astro patterns are standard |

**Pros:** Proof is reachable in <2s on any device. Cinema still ships for the device class that can afford it. Honest with the brief's positioning.
**Cons:** Two code paths to maintain. Poster image must stay visually consistent with the Three.js scene or the swap looks jarring.

### Option D: Server-side render Three.js to a single canvas snapshot, hydrate on interaction

| Dimension | Assessment |
|-----------|------------|
| Complexity | High |
| Cost | Several days plus ongoing fragility |
| Scalability | Good once built |
| Team familiarity | Niche; few examples to copy from |

**Pros:** Best of both worlds in theory.
**Cons:** Astro static + Three.js SSR is fragile. Maintenance burden too high for a solo project. Not worth it for a portfolio.

## Trade-off Analysis

The real trade-off is between **identity (cinematic, opinionated, demonstrates craft)** and **conversion (proof reachable in 30 seconds on a phone)**. Options A and B sit at the extremes; both fail the brief in different ways.

Option C splits the difference by treating the cinema as enhancement, not entry. The proof loads first; the polish layers in. A recruiter on a fast laptop sees the full experience. A recruiter scanning on a phone in an Uber sees the proof and the CTA, and the cinema never auto-plays if the connection is slow.

## Consequences

**Easier:**
- LCP and TBT measurable in CI on every PR (Lighthouse-CI on the Astro build), pending
- Future content additions don't compete for the critical path
- Reduced-motion and save-data users get a first-class experience, not a degraded one
- Greeter becomes optional for slow devices, which removes the only hard click between landing and proof

**Harder:**
- Two visual states for the hero (poster, then live scene). Need a designer's eye on the transition or it reads as a glitch.
- Dynamic imports add a small mental tax when debugging; stack traces span async boundaries.
- The build now has a perf budget that can fail CI. That's the point, but it does mean some changes that would have shipped will get blocked until they fit.

**Revisit:**
- After 30 days of analytics (per ADR-003), check whether mobile bounce rate at the hero correlates with cinema init. If it does, tighten the budget further.
- If a recruiter conversation ever mentions "the site was slow," promote that signal above any Lighthouse number.

## Action Items

1. [x] Add `src/scripts/capability.ts` with `shouldLoadCinema()` + capability detection
2. [x] Refactor `src/scripts/bootstrap.ts` into `runFastPath()` and `runCinemaPath()`
3. [x] Export `revealHero({ instant, skipCinema })` and `dismissLoaderInstant()` from `chrome.ts`
4. [x] Add `body.no-cinema` CSS rules in `base.css` to render hero in final visible state
5. [x] Add `?nocinema=1` URL flag for testing the fast path on any browser
6. [x] Remove dead Three.js code (deps, AmbientField, three-field.ts)
7. [ ] Render a static poster image for the Desk hero in `Desk.astro`; swap to the live scene when initialized
8. [ ] Make the greeter non-blocking *visually* for capable devices too (overlay above an already-painted page)
9. [ ] Wire Lighthouse-CI into the build with budget thresholds: LCP ≤ 2.0s, TBT ≤ 200ms, JS ≤ 80KB gzip
10. [ ] Add a one-paragraph "Performance" note to the project README so the policy doesn't drift
11. [ ] Manually test on a throttled iPhone SE profile in DevTools, both paths
