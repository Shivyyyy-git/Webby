export function initCursor() {
  if (matchMedia('(hover:none)').matches) return;

  const cur = document.querySelector<HTMLElement>('#cur');
  const ring = document.querySelector<HTMLElement>('#cur-ring');
  const lbl = document.querySelector<HTMLElement>('#cur-lbl');
  if (!cur || !ring || !lbl) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cur.style.left = mx + 'px';
    cur.style.top = my + 'px';
    lbl.style.left = mx + 'px';
    lbl.style.top = my + 'px';
  });

  function tick() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring!.style.left = rx + 'px';
    ring!.style.top = ry + 'px';
    requestAnimationFrame(tick);
  }
  tick();

  const SEL = 'a,button,.proj,.ask-chip,.off-card,#np,.cl-mail,.pcard,.tl-row';
  document.querySelectorAll<HTMLElement>(SEL).forEach((el) => {
    const t = el.dataset.cur || (el.tagName === 'A' || el.tagName === 'BUTTON' ? 'link' : 'link');
    el.addEventListener('mouseenter', () => {
      document.body.dataset.cur = t;
      if (el.dataset.curLbl) lbl!.textContent = el.dataset.curLbl;
    });
    el.addEventListener('mouseleave', () => {
      document.body.dataset.cur = '';
    });
  });

  document.querySelectorAll<HTMLElement>('input,textarea').forEach((el) => {
    el.addEventListener('mouseenter', () => { document.body.dataset.cur = 'text'; });
    el.addEventListener('mouseleave', () => { document.body.dataset.cur = ''; });
  });
}
