export function initClock() {
  const el = document.querySelector<HTMLElement>('#local-time');
  if (!el) return;
  function up() {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    el!.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} local · Boston`;
  }
  up();
  setInterval(up, 30000);
}

export function initChromeReveal() {
  const ask = document.querySelector<HTMLElement>('#ask');
  const np = document.querySelector<HTMLElement>('#np');
  function up() {
    const past = window.scrollY > window.innerHeight * 0.55;
    if (ask) ask.classList.toggle('live', past);
    if (np && np.classList.contains('show')) np.classList.toggle('live', past);
  }
  window.addEventListener('scroll', up, { passive: true });
  up();
}

const SPOTIFY_TRACKS = [
  { t: 'Time (You and I)',          a: 'Khruangbin' },
  { t: 'Maps',                       a: 'Yeah Yeah Yeahs' },
  { t: 'Pyramids',                   a: 'Frank Ocean' },
  { t: 'Motion Sickness',            a: 'Phoebe Bridgers' },
  { t: 'cold/mess',                  a: 'Prateek Kuhad' },
  { t: 'In a Sentimental Mood',      a: 'Ellington & Coltrane' },
  { t: 'Dehradun',                   a: 'Khruangbin (live)' },
  { t: 'Pink + White',               a: 'Frank Ocean' },
  { t: 'Heart of Glass',             a: 'Blondie' },
  { t: 'Saturn',                     a: 'SZA' },
  { t: 'All Night Long',             a: 'Lionel Richie' },
  { t: 'Tabla loop · untitled',      a: "Friend's record (unreleased)" },
];

export function initNowPlaying() {
  const np = document.querySelector<HTMLElement>('#np');
  const tt = document.querySelector<HTMLElement>('#np-title');
  const ts = document.querySelector<HTMLElement>('#np-sub');
  const x = document.querySelector<HTMLElement>('#np-x');
  if (!np || !tt || !ts) return;

  let i = Math.floor(Math.random() * SPOTIFY_TRACKS.length);
  function show() {
    const tr = SPOTIFY_TRACKS[i];
    tt!.style.opacity = '0';
    ts!.style.opacity = '0';
    setTimeout(() => {
      tt!.textContent = tr.t;
      ts!.textContent = tr.a + " · Shivam's playlist";
      tt!.style.opacity = '1';
      ts!.style.opacity = '1';
    }, 300);
  }
  show();
  setInterval(() => {
    i = (i + 1) % SPOTIFY_TRACKS.length;
    show();
  }, 9000);

  np.addEventListener('click', (e) => {
    if (e.target === x) {
      np.classList.add('collapsed');
      return;
    }
    window.open('https://open.spotify.com/playlist/4FidzePzkgudGlOJknEjhN', '_blank', 'noopener');
  });
}

export function initSmoothAnchors() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: (target as HTMLElement).getBoundingClientRect().top + window.scrollY - 40,
        behavior: 'smooth',
      });
    });
  });
}

export function initLoader() {
  const lcount = document.querySelector<HTMLElement>('#lcount');
  const lline = document.querySelector<HTMLElement>('#lline');
  const lpct = document.querySelector<HTMLElement>('#lpct');
  const loader = document.querySelector<HTMLElement>('#loader');
  if (!lcount || !lline || !lpct || !loader) return;

  const dur = 2200;
  const start = performance.now();

  function frame(t: number) {
    const p = Math.min(1, (t - start) / dur);
    const n = Math.floor(p * 100);
    lcount!.textContent = String(n).padStart(2, '0');
    lline!.style.width = p * 100 + '%';
    lpct!.textContent = n + '%';
    if (p < 1) requestAnimationFrame(frame);
    else {
      setTimeout(() => {
        loader!.style.transition = 'clip-path 1s cubic-bezier(.7,0,.3,1),opacity .6s';
        loader!.style.clipPath = 'inset(0 0 100% 0)';
        loader!.classList.add('gone');
        setTimeout(() => {
          loader!.style.display = 'none';
          revealHero();
        }, 1000);
      }, 300);
    }
  }
  requestAnimationFrame(frame);
}

function revealHero() {
  document.querySelectorAll<HTMLElement>('#hero-name .word').forEach((w, i) =>
    setTimeout(() => w.classList.add('in'), i * 120)
  );
  document.querySelectorAll<HTMLElement>('#hero .reveal').forEach((el) => el.classList.add('in'));
  const np = document.querySelector<HTMLElement>('#np');
  if (np) np.classList.add('show');
  if ((window as any).__startRailCinema) (window as any).__startRailCinema();
}
