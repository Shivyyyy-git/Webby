/*
  Capability detection — gates the cinematic interactive layer.

  shouldLoadCinema() returns false (= skip the greeter, the loader, and the
  ride cinema; render hero proof immediately) when the device or user signals
  that the cinematic experience would hurt more than help:
   - prefers-reduced-motion: reduce
   - Save-Data is on
   - effectiveType is slow-2g, 2g, or 3g
   - deviceMemory < 4GB on a small viewport
*/

export function prefersReducedMotion(): boolean {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

export function isSaveData(): boolean {
  try {
    const c = (navigator as any).connection;
    return !!(c && c.saveData === true);
  } catch { return false; }
}

export function isSlowConnection(): boolean {
  try {
    const c = (navigator as any).connection;
    const eff = c?.effectiveType as string | undefined;
    return !!eff && (eff === 'slow-2g' || eff === '2g' || eff === '3g');
  } catch { return false; }
}

export function isLowMemory(): boolean {
  try {
    const m = (navigator as any).deviceMemory as number | undefined;
    return typeof m === 'number' && m > 0 && m < 4;
  } catch { return false; }
}

function hasForceFlag(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('nocinema') === '1';
  } catch { return false; }
}

export function shouldLoadCinema(): boolean {
  if (hasForceFlag()) return false;
  if (prefersReducedMotion()) return false;
  if (isSaveData()) return false;
  if (isSlowConnection()) return false;
  if (isLowMemory() && window.innerWidth < 768) return false;
  return true;
}
