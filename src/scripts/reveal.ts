export function initReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

export function initCounters() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const to = parseFloat(el.dataset.to || '0');
        const dur = 1400;
        const start = performance.now();
        function frame(t: number) {
          const p = Math.min(1, (t - start) / dur);
          const v = to * (1 - Math.pow(1 - p, 3));
          el.textContent = String(Math.round(v));
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        io.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll<HTMLElement>('.cnum').forEach((el) => io.observe(el));
}
