# ADR-003: Lead Capture & Analytics

**Status:** Proposed
**Date:** 2026-05-14

## Context

The site has no feedback loop today. No analytics, no error tracking, no visibility into whether the proof lands or which sections cause bounce. The greeter optionally posts name/city/email/music-preference to a Google Apps Script URL, but `GREETER_WEBHOOK` in `greeter.ts:33` is empty, even that signal is dark right now.

The brief says the primary call is *hire (full-time AI PM roles)*. The site needs to do two jobs:
1. **Capture interested parties**, let a hiring manager reach you with low friction.
2. **Learn what's working**, know whether the Maya AI proof, the founder story, or the Work case studies are doing the conversion lifting.

The voice in the brief ("most AI product demos are dishonest", "no asterisks in the footnote") rules out heavy tracking, cookie banners, or anything that contradicts the site's privacy line ("No tracking, no cookies.", `Greeter.astro:71`). So this isn't GA4 territory.

### Constraints

- Privacy-respecting. The site explicitly promises no tracking, no cookies. Any analytics must clear that bar.
- Cheap or free. This is a personal site.
- Must work with whatever stack ADR-002 settles on.
- Single page, so session-level engagement matters more than pageview counts.
- Brief constraint: never invent a metric. Same rule applies to recruiter signal, if 3 people visited the site, that's "3 people," not "double-digit organic interest."

## Decision

**Three-layer setup**, each picked for a specific job:

1. **Cloudflare Web Analytics**, pageviews, top countries, top referrers, Core Web Vitals. Free, no cookies, no client JS hit worth measuring (single beacon).
2. **Plausible (self-hosted) OR Umami Cloud free tier**, for richer event tracking: section scroll-depth (was Maya AI visible? Was the Work section reached?), CTA clicks (live demo, resume, contact). Privacy-friendly, no cookies, GDPR-clean.
3. **Greeter webhook re-enabled + Calendly link as the primary CTA**, for the conversion signal that actually matters: someone said hi.

**Explicit non-choices:**
- No GA4. Cookie banner cost is higher than the signal value at this traffic volume.
- No HubSpot, no marketing-automation. Overkill, and contradicts the site's voice.
- No Hotjar / Microsoft Clarity session replay. Too creepy for a privacy-promised site.

## Options Considered

### Analytics

| Tool | Cookie-free | Cost | Self-host? | What it tracks |
|---|---|---|---|---|
| **CF Web Analytics + Plausible/Umami** (chosen) | ✓ | Free | Yes for Plausible | Pageviews, Core Web Vitals, scroll depth, CTA clicks |
| Google Analytics 4 | ✗ (cookie banner required in EU) | Free | No | Everything, with sampling |
| Vercel Analytics | ✓ | Free tier limited | No | Pageviews, Web Vitals |
| Fathom | ✓ | $14/mo | No | Pageviews, events |
| No analytics | n/a | Free | n/a | Nothing |

### Lead capture

| Tool | Friction | What you learn |
|---|---|---|
| **Greeter webhook + Calendly** (chosen) | Low (greeter is opt-in; Calendly is one click) | Name, email if given, music choice, plus a real booking |
| Direct mailto link | Lowest | Just the email, no name, no calendar |
| Typeform / Tally form | Medium | Structured, but heavy iframe |
| HubSpot meeting link | Medium | Better tracking, more setup |

## Trade-off Analysis

The big choice is **cookies vs. signal**. GA4 gives you the most data but forces a cookie banner that screams "this site doesn't mean what it says about privacy." The chosen stack gives you ~80% of the actionable signal (where do people drop off, do they reach the Work section, do they click the demo) with zero cookies and zero compliance burden.

The second choice is **how much friction to put in front of "I want to talk to you."** A Calendly link is one click and produces a real signal (someone booked time). The greeter form is doing a different job, capturing curious passers-by who aren't ready to book but might be later. Keeping both is the right call; they capture different intent levels.

What the chosen stack *deliberately doesn't* answer:
- Individual session replay (creepy, off-brief)
- Cross-device user tracking (cookies, off-brief)
- Granular conversion attribution per channel (overkill at this volume)

That's a feature, not a bug. The signal you actually need to act on is: "Did the recruiter make it to the Maya AI section?" and "Did anyone book?"

## Consequences

**Easier:**
- Honest analytics. "No tracking, no cookies" stays true.
- A real feedback loop on which sections work without bloating the JS payload.
- Calendly bookings become the cleanest top-of-funnel metric (better than GA "engaged sessions").

**Harder:**
- No demographic data. You won't know if visitors are "senior PMs at Series C startups", just country and referrer.
- Self-hosted Plausible adds a small ops surface (one Worker or one container). Umami Cloud avoids this at the cost of a third-party.
- The greeter webhook needs to be wired (currently `GREETER_WEBHOOK = ''`). Pick: keep Google Apps Script (zero infra), or replace with a Cloudflare Worker / Node endpoint once on host.

**Revisit:**
- After 60 days of analytics, check whether scroll-depth correlates with Calendly bookings. If not, the Work section ordering or the Maya AI hook needs to change.
- If site traffic ever exceeds ~10K/month, Plausible self-hosted becomes meaningfully cheaper than Cloud.

## Action Items

1. [ ] Enable Cloudflare Web Analytics on the production domain (post ADR-002)
2. [ ] Decide: Plausible self-hosted via Workers, or Umami Cloud free tier. Default to Umami Cloud for the first 90 days; switch if traffic grows.
3. [ ] Add a tiny event-tracking helper (`src/scripts/track.ts`): one function, fires on CTA clicks (demo, resume, contact, Calendly) and on the `IntersectionObserver` for the Work section
4. [ ] Wire `GREETER_WEBHOOK` to either the existing Google Apps Script URL or a new endpoint; remove the empty-string default
5. [ ] Add a Calendly link as the primary CTA in `#close` and the chrome top-right (`Open to roles` is the current pill, keep that label, point it at Calendly)
6. [ ] Add a `/contact` route or `mailto:` fallback for non-Calendly users
7. [ ] Add one line to the README documenting what's tracked and what isn't, your future self will forget
