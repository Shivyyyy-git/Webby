/*
  Timeline journey — pinned scrub through 5 chapters (Delhi → Punjab → London → Boston → Vision).
  Train slides along a zig-zag track from top-left to bottom-right as scroll progresses.

  Waypoints (in % of the journey container, where x=0..100, y=0..100):
    [0]  ( 6,  6)   top-left      — Delhi
    [1]  (92, 26)   upper-right   — Punjab
    [2]  ( 6, 50)   middle-left   — London
    [3]  (92, 74)   lower-right   — Boston
    [4]  (92, 94)   bottom-right  — Vision
*/

const WAYPOINTS: ReadonlyArray<readonly [number, number]> = [
  [6, 6], [92, 26], [6, 50], [92, 74], [92, 94],
] as const;

export async function initJourney() {
  const journey = document.querySelector<HTMLElement>('#tl-journey');
  if (!journey) return;

  const chapters = Array.from(journey.querySelectorAll<HTMLElement>('.tl-chapter'));
  const stations = Array.from(journey.querySelectorAll<HTMLElement>('.tl-station'));
  const trainEl  = journey.querySelector<SVGElement>('#tl-train');
  const trackFill = journey.querySelector<SVGPathElement>('#tl-track-fill');
  if (!chapters.length || !trainEl) return;

  // Position stations at each waypoint (CSS percentages).
  stations.forEach((el, i) => {
    if (WAYPOINTS[i]) {
      el.style.left = WAYPOINTS[i][0] + '%';
      el.style.top  = WAYPOINTS[i][1] + '%';
    }
  });

  // Compute total path length (in viewBox units) for the fill animation.
  const segments: Array<{ a: readonly [number, number]; b: readonly [number, number]; len: number; cum: number }> = [];
  let total = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    segments.push({ a, b, len, cum: total });
    total += len;
  }
  // For the dasharray-based fill: total path length in raw SVG units.
  // The path `d` uses viewBox 0..100, but the actual rendered length differs by aspect.
  // Use getTotalLength() if available.
  let trackPathLen = total;
  const fillPath = trackFill;
  if (fillPath && 'getTotalLength' in fillPath) {
    try { trackPathLen = (fillPath as SVGPathElement).getTotalLength() || total; } catch {}
    if (fillPath) fillPath.setAttribute('stroke-dasharray', `0 ${trackPathLen}`);
  }

  function trainPos(progress: number): { x: number; y: number; angle: number; segIdx: number } {
    const segCount = segments.length;
    const t = Math.min(0.9999, Math.max(0, progress)) * segCount;
    const segIdx = Math.min(segCount - 1, Math.floor(t));
    const segT = t - segIdx;
    const seg = segments[segIdx];
    const x = seg.a[0] + (seg.b[0] - seg.a[0]) * segT;
    const y = seg.a[1] + (seg.b[1] - seg.a[1]) * segT;
    // Angle in screen-space: convert percent-deltas to actual pixel deltas using
    // the journey's aspect ratio so diagonal angles look right.
    const w = journey!.clientWidth || 1;
    const h = journey!.clientHeight || 1;
    const dxPx = (seg.b[0] - seg.a[0]) * w / 100;
    const dyPx = (seg.b[1] - seg.a[1]) * h / 100;
    const angle = Math.atan2(dyPx, dxPx) * 180 / Math.PI;
    return { x, y, angle, segIdx };
  }

  function applyProgress(progress: number) {
    const p = Math.min(1, Math.max(0, progress));
    const pos = trainPos(p);

    // Train transform — flip horizontally when going right→left so the
    // locomotive faces the direction of travel. Clamp rotation to ±22° so
    // the train stays mostly horizontal even on near-vertical segments
    // (otherwise the locomotive ends up on its side).
    const flipped = Math.abs(pos.angle) > 90;
    let baseAngle = flipped ? pos.angle - 180 : pos.angle;
    if (baseAngle > 22) baseAngle = 22;
    if (baseAngle < -22) baseAngle = -22;
    trainEl!.style.left = pos.x + '%';
    trainEl!.style.top  = pos.y + '%';
    trainEl!.style.transform =
      `translate(-50%, -50%) rotate(${baseAngle.toFixed(2)}deg) scaleX(${flipped ? -1 : 1})`;

    // Track fill — reveals as train progresses.
    if (fillPath) {
      fillPath.setAttribute('stroke-dasharray', `${(p * trackPathLen).toFixed(2)} ${trackPathLen}`);
    }

    // Active chapter = waypoint nearest to current segment.
    // Use floor so chapter advances at the start of each segment, but bias
    // slightly forward so transition feels paced with the train arriving.
    const advanced = p * (chapters.length - 1) + 0.15;
    const activeIdx = Math.min(chapters.length - 1, Math.max(0, Math.floor(advanced)));
    chapters.forEach((c, i) => { c.dataset.active = String(i === activeIdx); });
    stations.forEach((s, i) => { s.dataset.live = String(i <= activeIdx); });
  }

  // Initial state — train parked at first waypoint, no progress.
  applyProgress(0);

  // Lazy-load GSAP + ScrollTrigger
  const [gsapMod, stMod] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ]);
  const gsap = (gsapMod as any).default ?? gsapMod;
  const ScrollTrigger = (stMod as any).ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: journey,
    start: 'top top',
    end: '+=400%',
    pin: true,
    pinSpacing: true,
    scrub: 0.6,
    anticipatePin: 1,
    onUpdate: ({ progress }: { progress: number }) => applyProgress(progress),
  });

  // Recompute angles on resize (journey aspect can change).
  window.addEventListener('resize', () => {
    // No state change needed — applyProgress reads journey.clientWidth/Height live.
    // ScrollTrigger handles its own resize via refresh().
    if (typeof ScrollTrigger.refresh === 'function') ScrollTrigger.refresh();
  });
}
