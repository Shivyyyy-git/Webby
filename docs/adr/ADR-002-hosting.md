# ADR-002: Hosting & CDN Target

**Status:** Proposed (revisit: project now uses `@astrojs/node` adapter + hybrid output, which changes the option matrix, see "Revisit" below)
**Date:** 2026-05-14

## Context

`shivam-portfolio` is an Astro 5 site (content-collection-driven, ~20KB CSS / ~80KB JS once Tier 0 lands). Custom domain `shivam.website`. Single deployer (Shivam). The site exists to convert hiring managers, who triage on phones across the US, EU, and India.

Any static host will technically work. The decision is about: edge latency for a global audience, deploy ergonomics for a solo maintainer, cost ceiling, and ease of wiring DNS + email later.

### Constraints

- Free tier only. No reason to pay for a personal site at this scale.
- Custom domain already owned (`shivam.website`).
- Need: HTTPS, edge CDN, fast deploys from `git push`, OG image support, redirects (e.g., `/resume` → `/resume.pdf`).
- Nice-to-have: form endpoint (for the greeter webhook), edge functions (future analytics proxy), built-in analytics.
- No vendor lock-in beyond DNS and build config.

## Decision

**Cloudflare Pages**, connected via GitHub repo, with the `shivam.website` domain managed by Cloudflare DNS.

## Options Considered

| Dimension | **Cloudflare Pages** (chosen) | Vercel | Netlify | GitHub Pages |
|---|---|---|---|---|
| Global edge POPs | 330+ | ~100 | ~100 | Limited (Fastly) |
| Free build mins | Unlimited | 6000/mo | 300/mo | Unlimited |
| Free bandwidth | Unlimited | 100GB | 100GB | 100GB |
| Custom domain HTTPS | ✓ instant | ✓ | ✓ | ✓ (slower) |
| Edge functions | Workers | Edge Functions | Edge Functions | None |
| Built-in analytics | Cloudflare Web Analytics (free, privacy-friendly) | Vercel Analytics (paid tier) | None (paid) | None |
| DX | Good (CI integration is workmanlike) | Best | Good | Minimal |
| Form endpoint | Workers (DIY) | None | Netlify Forms (100/mo free) | None |
| Locks you in? | Mild | Heavy (framework opt-ins) | Medium | None |

## Trade-off Analysis

The real comparison is Cloudflare vs Vercel.

**Vercel is the more obvious answer for a developer audience**, the DX is best-in-class, deploys are instant, framework integrations are tuned for Astro. But Vercel's analytics, image optimization, and edge functions are gated behind paid tiers above modest free thresholds. For a personal site, you don't need any of that paid layer, so most of Vercel's edge over Cloudflare is invisible.

**Cloudflare Pages wins on three specific axes for this site:**
1. **Global edge.** Cloudflare has roughly 3× the POPs. A recruiter in Bangalore or Berlin gets the site from a closer node. For a one-pager LCP target of ≤2s on 4G, this matters.
2. **Privacy-friendly analytics in-tier.** Cloudflare Web Analytics is free, GDPR-friendly, no cookie banner needed. This becomes load-bearing in ADR-003.
3. **DNS + email + site all on one vendor.** Cloudflare Email Routing forwards `shivam@shivam.website` to your Gmail for free. One dashboard, one set of credentials.

**Netlify** is the middle ground; nothing distinguishes it here vs. Cloudflare. **GitHub Pages** is the floor, fine for a markdown blog, underpowered for a site that wants edge functions, analytics, and proper redirects.

## Consequences

**Easier:**
- Git-push deploys. Preview URLs per PR.
- Free, privacy-friendly analytics with zero JS overhead (uses a single `<script>` tag; under 5KB).
- Custom domain HTTPS in under 5 minutes.
- Future-proof for a Workers-based analytics proxy or a server-rendered route (if you ever switch a page to SSR).

**Harder:**
- Cloudflare's UI is busier than Vercel's. First-time setup takes longer (DNS zone, page rules, etc.).
- Astro SSR adapters for Cloudflare exist (`@astrojs/cloudflare`) but are less mature than `@astrojs/vercel`. The site is static today; not relevant unless you switch.
- Workers (for form endpoints) require a separate deploy step. The current greeter posts to a Google Apps Script URL, which sidesteps this entirely. Keep that pattern.

**Revisit:**
- The project now uses `output: 'hybrid'` with `@astrojs/node` adapter. Cloudflare Pages does not run Node, to deploy this Astro config to Cloudflare, switch to `@astrojs/cloudflare` (Workers runtime). Alternative Node-runtime hosts: Render (free Node web service tier), Fly.io (free allowance), Railway (limited free), or self-host on a small VPS. The recommendation above assumes a swap of adapter; if you stay on Node adapter, Render is the closest equivalent on the trade-off matrix (decent free tier, simple DX, no edge, but small Node site, so edge POPs matter less than a static one).
- If you ever add a paid newsletter, full-text search, or auth, re-evaluate Vercel for its first-party integrations.

## Action Items

1. [ ] Decide: switch to `@astrojs/cloudflare` adapter and deploy to Cloudflare Pages, OR keep `@astrojs/node` and deploy to Render / Fly.io
2. [ ] Create the hosting project, connect the GitHub repo
3. [ ] Transfer `shivam.website` DNS to whichever host runs the site (Cloudflare DNS is free either way and worth using even if hosting is elsewhere)
4. [ ] Point the apex domain at the deployment; enable HTTPS-only redirect
5. [ ] Set up Cloudflare Email Routing: `shivam@shivam.website` → `shivamsharma2023@gmail.com`
6. [ ] Add `_redirects` file to `public/` (or equivalent host config): `/resume /resume.pdf 301`, `/cv /resume.pdf 301`
7. [ ] Enable Cloudflare Web Analytics on the production domain (works regardless of where the site is hosted, as long as DNS is on Cloudflare)
8. [ ] If staying on Node adapter, add a Cloudflare Workers form endpoint (or keep Google Apps Script) for the greeter
