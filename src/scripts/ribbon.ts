export function initRibbon() {
  const t = document.querySelector<HTMLElement>('#tt');
  if (!t) return;
  let x = 0;
  const base = 0.4;
  let vel = 0;
  let ly = window.scrollY;

  function tick() {
    const dy = Math.abs(window.scrollY - ly);
    vel = vel * 0.9 + dy * 0.05;
    ly = window.scrollY;
    x -= base + vel * 0.4;
    const tw = t!.scrollWidth / 2;
    if (-x > tw) x += tw;
    t!.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
