export function initClock() {
  const el = document.querySelector<HTMLElement>('#local-time');
  if (!el) return;
  function up() {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    el!.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} local · Rochester`;
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
    // Once the user scrolls past ~30vh, retire the "where could we go next?"
    // coda so it doesn't linger if they come back.
    document.body.classList.toggle('coda-dismissed', window.scrollY > window.innerHeight * 0.3);
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
    const target = e.target as HTMLElement | null;
    if (target && target.closest('#np-x')) {
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
  const loader = document.querySelector<HTMLElement>('#loader');
  if (!loader) return;

  // Atmospheric intro:
  //   t=0      ink screen, content invisible
  //   t≈80ms   `.in` → eyebrow / mark / place fade in (CSS staggers them)
  //   t=1700   `.shift` → background crossfades ink → cream (1.4s)
  //   t=3100   `.fade` → loader opacity 1 → 0 (1.1s)
  //   t=4250   loader removed, hero revealed
  setTimeout(() => loader.classList.add('in'), 80);
  setTimeout(() => loader.classList.add('shift'), 1700);
  setTimeout(() => loader.classList.add('fade', 'gone'), 3100);
  setTimeout(() => {
    loader.style.display = 'none';
    revealHero();
  }, 4250);
}

export function dismissLoaderInstant() {
  const loader = document.querySelector<HTMLElement>('#loader');
  if (loader) loader.style.display = 'none';
}

export function revealHero(opts: { instant?: boolean; skipCinema?: boolean } = {}) {
  const words = document.querySelectorAll<HTMLElement>('#hero-name .word');
  const reveals = document.querySelectorAll<HTMLElement>('#hero .reveal');
  const photo = document.querySelector<HTMLElement>('#hero-photo');
  const np = document.querySelector<HTMLElement>('#np');

  if (opts.instant) {
    words.forEach((w) => w.classList.add('in'));
    reveals.forEach((el) => el.classList.add('in'));
    if (photo) photo.classList.add('in');
  } else {
    words.forEach((w, i) => setTimeout(() => w.classList.add('in'), i * 120));
    reveals.forEach((el) => el.classList.add('in'));
    if (photo) setTimeout(() => photo.classList.add('in'), 480);
  }

  if (np) np.classList.add('show');
  if (!opts.skipCinema && (window as any).__startRailCinema) {
    (window as any).__startRailCinema();
  }
}

/* Magnetic photo — rotateX/Y on mousemove. Disabled on touch / reduced-motion. */
export function initMagneticPhoto() {
  if (matchMedia('(hover:none)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ph = document.querySelector<HTMLElement>('#hero-photo');
  if (!ph) return;
  ph.addEventListener('mousemove', (e) => {
    const r = ph.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) / r.width;
    const y = (e.clientY - r.top - r.height / 2) / r.height;
    ph.style.transform = `rotate(0deg) rotateX(${(y * -8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateY(-6px) scale(1.03)`;
  });
  ph.addEventListener('mouseleave', () => {
    ph.style.transform = '';
  });
}
