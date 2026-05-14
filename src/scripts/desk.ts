import {
  audUnlock, audState, audSetOn,
  audRumbleStart, audRumbleStop, audClackLoop,
  audHorn, audBell, audPAChime, audClack,
} from './audio';

const SCRIPT = [
  { loc: 'delhi',  eyebrow: 'stop 01 · childhood', h: 'Delhi.',     mood: 'Rowdy.',    p: 'born loud · raised loud' },
  { loc: 'punjab', eyebrow: 'stop 02 · roots',     h: 'Punjab.',    mood: 'Roots.',    p: 'family at the table · bhangra in the bones' },
  { loc: 'london', eyebrow: 'stop 03 · 2019',      h: 'London.',    mood: 'Built.',    p: 'two companies · uk + mena · sold both' },
  { loc: 'usa',    eyebrow: 'stop 04 · now',       h: 'Rochester.', mood: 'Shipping.', p: 'ai pm at esc partners · maya ai end-to-end' },
];

const STATION_DATA = [
  {
    loc: 'delhi', idx: 0, stamp: '₹2', flag: '',
    pmL: 'DELHI G.P.O.', pmDate: 'CHILDHOOD', pmR: '★ DEPART ★',
    eyebrow: 'Stop 01 · Childhood · Delhi', h: 'Delhi. <em>Rowdy.</em>',
    sub: 'Born here. Loud, fast, never quiet. The city taught me speed and survival before school did.',
    p1: 'Delhi was my first interface. Chaotic, layered, fluent in five languages by the time I could read one. <em>Negotiation</em> was a survival skill (rickshaw drivers, cricket teammates, the aunty next door who ran the local intel network).',
    p2: "I owe Delhi my appetite for messy systems. Real users, real edge cases, nothing ever clean. That's where the interesting product work hides.",
    coord: '28.6° N · 77.2° E',
    grid: [['Era', 'Childhood'], ['Languages', 'Hindi · English · Punjabi'], ['Default mode', 'Speed first, sleep later'], ['Took with me', 'Grit · pace · loud laugh']] as [string, string][],
  },
  {
    loc: 'punjab', idx: 1, stamp: '₹5', flag: '',
    pmL: 'JALANDHAR', pmDate: 'EVERY · SUMMER', pmR: '★ ROOTS ★',
    eyebrow: 'Stop 02 · Roots · Punjab', h: 'Punjab. <em>Roots.</em>',
    sub: 'Family roots. Wheat, dhol, daal, and a table where everybody talks at once.',
    p1: 'Punjab is where the family lives. Grandparents on the farm, cousins everywhere, weddings that last a week. I learned <em>warmth as a default state</em> (feed strangers first, ask questions never).',
    p2: "That's why my product instinct defaults to boring industries everybody else skips. Real people, served plainly. Nothing fancy, nothing gated.",
    coord: '31.1° N · 75.3° E',
    grid: [['Family from', 'Jalandhar'], ['Languages', 'Punjabi · Hindi'], ['Default mode', 'Feed everyone first'], ['Took with me', 'Hospitality · loyalty · bhangra']] as [string, string][],
  },
  {
    loc: 'london', idx: 2, stamp: '£1', flag: 'uk',
    pmL: 'LONDON · DUBAI', pmDate: '2019 to 2024', pmR: '★ FOUNDER ★',
    eyebrow: 'Stop 03 · Founder · UK + MENA', h: 'London. <em>Built.</em>',
    sub: 'Two companies in five years. UK and the Middle East. Both sold.',
    p1: 'Started <em>CloudApproach</em> and <em>Approachables</em> between London and Dubai (2019 to 2024). Hired teams. Took payroll personally when cash was thin. Learned the difference between "the deck is good" and "the customer signed the renewal".',
    p2: "$575K combined exits. Roughly $5M influenced in deals closed (deals my team and I drove, not personal revenue). I learned product the hard way before I called myself a PM.",
    coord: 'London · 51.5° N · Dubai · 25.2° N',
    grid: [['Era', '2019 to 2024'], ['Companies', 'CloudApproach · Approachables'], ['Exits', 'Two · $575K combined'], ['Took with me', 'Ship before perfect']] as [string, string][],
  },
  {
    loc: 'usa', idx: 3, stamp: '$1', flag: 'us',
    pmL: 'ROCHESTER · NY', pmDate: 'NOW', pmR: '★ NOW ★',
    eyebrow: 'Stop 04 · Now · Rochester', h: 'Rochester. <em>Shipping.</em>',
    sub: 'AI PM at ESC Partners. Built Maya AI end-to-end. Customer support for utility companies.',
    p1: "After the founder years, the US and a master's in AI at <em>Simon Business School</em> (MS AI in Business, December 2025). Then ESC. I'm the only AI person on the team. Built Maya in about 2.5 months. Voice, chat, SMS, email, mobile, plus an internal console agents use to navigate Oracle CCS.",
    p2: "Pilot is 40+ agents at one US utility. Maya handles first-touch on 70 to 80% of inbound support volume, which means a manager isn't drowning in 100+ emails before lunch. That's the only metric I'll defend in a one-on-one with the engineer who built the thing.",
    coord: '43.2° N · 77.6° W',
    grid: [['Now', 'AI PM · ESC Partners'], ['Built', 'Maya AI (end-to-end)'], ['Stack', 'FastAPI · React · Bedrock · DynamoDB'], ['School', 'Simon · MS AI in Business · Dec 2025']] as [string, string][],
  },
];

export function initDesk() {
  const strip = document.querySelector<HTMLElement>('#desk-strip');
  const rail = document.querySelector<HTMLElement>('#desk-rail');
  if (!strip || !rail) return;

  const cards = Array.from(document.querySelectorAll<HTMLElement>('.pcard'));
  const stationEls = Array.from(document.querySelectorAll<HTMLElement>('.track-station'));
  const trainEl = document.querySelector<HTMLElement>('#desk-train');
  const trackEl = document.querySelector<HTMLElement>('#desk-track');
  let x = 0, target = 0, dragging = false, sx = 0, startX = 0, interactive = false;
  let vx = 0, lastClack = 0;
  let stationXs: number[] = [];
  let trainX = 0, trainTarget = 0;
  let tiesX = 0;
  let focusedIdx = 0;
  let cineFocused = -1;  // -1 means not in cinema; otherwise index of cinema-focused card

  function measureStations() {
    stationXs = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
    stationEls.forEach((el, i) => {
      if (stationXs[i] != null) el.style.left = stationXs[i] + 'px';
    });
    if (!trainTarget && stationXs[0] != null) {
      trainX = trainTarget = stationXs[0];
    }
  }

  function updateTrainTarget() {
    if (stationXs.length < 2) return;
    if (cineFocused >= 0) {
      trainTarget = stationXs[cineFocused];
    } else {
      // Scroll-based: page scroll [0, 1.4*vh] maps train [station0 → station3]
      const heroEnd = window.innerHeight * 1.4;
      const p = Math.min(1, Math.max(0, window.scrollY / heroEnd));
      const first = stationXs[0];
      const last = stationXs[stationXs.length - 1];
      trainTarget = first + (last - first) * p;
    }
    // Update which station is "live" (closest)
    let nearest = 0, best = Infinity;
    for (let i = 0; i < stationXs.length; i++) {
      const d = Math.abs(stationXs[i] - trainTarget);
      if (d < best) { best = d; nearest = i; }
    }
    if (nearest !== focusedIdx) {
      focusedIdx = nearest;
      stationEls.forEach((el, i) =>
        el.dataset.live = (i === nearest) ? 'true' : 'false'
      );
    }
  }

  // Initial measure + retry on layout changes (postcards may not have offsets
  // computed before fonts/images settle).
  measureStations();
  updateTrainTarget();
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => { measureStations(); updateTrainTarget(); });
    ro.observe(strip);
  }
  // Belt-and-suspenders: a few delayed re-measures during initial paint.
  [50, 200, 600, 1500].forEach((d) => setTimeout(() => { measureStations(); updateTrainTarget(); }, d));
  window.addEventListener('resize', () => { measureStations(); updateTrainTarget(); });
  window.addEventListener('scroll', updateTrainTarget, { passive: true });

  const railW = () => rail.clientWidth;
  const stripW = () => strip.scrollWidth;
  const minX = () => Math.min(0, railW() - stripW());
  const maxX = () => 0;
  const clamp = (v: number) => Math.max(minX(), Math.min(maxX(), v));

  function centerOf(i: number) {
    const c = cards[i];
    if (!c) return 0;
    const cx = c.offsetLeft + c.offsetWidth / 2;
    return clamp(railW() / 2 - cx);
  }

  function tick() {
    target = clamp(target);
    const prev = x;
    x += (target - x) * 0.085;
    strip!.style.transform = `translate(${x}px,-50%)`;
    vx = Math.abs(x - prev);
    if (vx > 1.2 && performance.now() - lastClack > 120) {
      audClack();
      lastClack = performance.now();
    }

    // TRAIN — lerp toward trainTarget. The 110px train SVG has its locomotive
    // chimney at viewBox-x≈14, so to "park" the locomotive at the station dot
    // we offset translateX by -14 (in SVG units, ~10px in 110px-wide).
    //
    // TIES + RAIL — scroll the cross-tie + rail highlight patterns opposite
    // to train motion, scaled 2.2× for visual rush. Plus a tiny constant
    // "wind" so the rail never reads as frozen even at full station rest.
    if (trainEl && stationXs.length) {
      const prevTrainX = trainX;
      trainX += (trainTarget - trainX) * 0.07;
      const dTrain = trainX - prevTrainX;
      tiesX -= dTrain * 2.2 + 0.16;  // 0.16px/frame ≈ ~10px/s idle drift
      if (trackEl) trackEl.style.setProperty('--ties-x', tiesX.toFixed(2) + 'px');
      // Vertical bob — amplitude scales with current speed, sells the chug
      const bobAmp = Math.min(1.2, 0.35 + Math.abs(dTrain) * 0.8);
      const bob = Math.sin(performance.now() / 95) * bobAmp;
      const TRAIN_NOSE_OFFSET = 10;
      trainEl.style.transform = `translate3d(${trainX - TRAIN_NOSE_OFFSET}px, ${bob.toFixed(2)}px, 0)`;
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // CINEMA
  const dcEyebrow = document.querySelector<HTMLElement>('#dcc-eyebrow')!;
  const dcH = document.querySelector<HTMLElement>('#dcc-h')!;
  const dcP = document.querySelector<HTMLElement>('#dcc-p')!;
  const dcCap = document.querySelector<HTMLElement>('#dc-caption')!;
  const dcCounter = document.querySelector<HTMLElement>('#dc-counter')!;
  const dcLoc = document.querySelector<HTMLElement>('#dc-loc')!;
  let cineTimers: number[] = [];
  let cineActive = false;

  function clearCine() {
    cineTimers.forEach(clearTimeout);
    cineTimers = [];
  }
  function focusCard(i: number) {
    cards.forEach((c, j) => c.classList.toggle('focus', j === i));
    if (cineActive) {
      cineFocused = i;
      updateTrainTarget();
    }
  }
  function showCap(i: number) {
    const s = SCRIPT[i];
    dcCap.classList.remove('show');
    setTimeout(() => {
      dcEyebrow.textContent = s.eyebrow;
      dcH.innerHTML = s.h + ' <em>' + s.mood + '</em>';
      dcP.textContent = s.p;
      dcCounter.textContent = 'stop 0' + (i + 1) + ' · of 04';
      dcLoc.textContent = s.h;
      requestAnimationFrame(() => dcCap.classList.add('show'));
    }, 220);
  }
  function endCinema() {
    cineActive = false;
    cineFocused = -1;
    clearCine();
    dcCap.classList.remove('show');
    document.body.classList.remove('cinema');
    document.body.classList.add('cinema-done');
    cards.forEach((c) => c.classList.remove('focus'));
    interactive = true;
    target = 0;
    audRumbleStop();
    updateTrainTarget();
    window.dispatchEvent(new CustomEvent('cinemaMode', { detail: { active: false } }));
    try { localStorage.setItem('shivam_seen_intro', '1'); } catch {}
  }
  function playCinema(fast: boolean) {
    if (cineActive) return;
    cineActive = true;
    interactive = false;
    clearCine();
    document.body.classList.remove('cinema-done');
    document.body.classList.add('cinema');
    target = 0;
    audRumbleStart();
    audClackLoop(fast ? 260 : 380);
    cineTimers.push(window.setTimeout(() => audHorn([[1.0, 0.16], [0.3, 0.16], [0.9, 0]]), fast ? 80 : 280));
    window.dispatchEvent(new CustomEvent('cinemaMode', { detail: { active: true } }));
    const travel = fast ? 700 : 1200;
    const dwell = fast ? 1300 : 2200;
    let t = fast ? 500 : 900;
    SCRIPT.forEach((_, i) => {
      cineTimers.push(window.setTimeout(() => {
        target = centerOf(i);
        focusCard(i);
        if (i > 0) cineTimers.push(window.setTimeout(() => audHorn([[0.4, 0]]), travel * 0.5));
      }, t));
      t += travel;
      cineTimers.push(window.setTimeout(() => {
        audBell();
        setTimeout(audPAChime, 550);
        showCap(i);
      }, t));
      t += dwell;
      if (i < SCRIPT.length - 1) {
        cineTimers.push(window.setTimeout(() => dcCap.classList.remove('show'), t - 280));
      }
    });
    cineTimers.push(window.setTimeout(() => audHorn([[1.3, 0]]), t - 200));
    cineTimers.push(window.setTimeout(endCinema, t + 1100));
  }

  (window as any).__playRailCinema = () => playCinema(false);
  (window as any).__startRailCinema = () => {
    let seen = false;
    try { seen = !!localStorage.getItem('shivam_seen_intro'); } catch {}
    setTimeout(() => playCinema(seen), 500);
  };

  // SPREAD MODAL
  const spread = document.querySelector<HTMLElement>('#spread')!;
  const spBd = document.querySelector<HTMLElement>('#spread-bd')!;
  const spClose = document.querySelector<HTMLElement>('#sp-close')!;
  const spEls = {
    art: document.querySelector<HTMLElement>('#sp-art')!,
    city: document.querySelector<HTMLElement>('#sp-city')!,
    coord: document.querySelector<HTMLElement>('#sp-coord')!,
    stampAmt: document.querySelector<HTMLElement>('#sp-stamp-amt')!,
    stampFlag: document.querySelector<HTMLElement>('#sp-stamp-flag')!,
    pmL: document.querySelector<HTMLElement>('#sp-pm-l')!,
    pmDate: document.querySelector<HTMLElement>('#sp-pm-date')!,
    pmR: document.querySelector<HTMLElement>('#sp-pm-r')!,
    eyebrow: document.querySelector<HTMLElement>('#sp-eyebrow')!,
    h: document.querySelector<HTMLElement>('#sp-h')!,
    sub: document.querySelector<HTMLElement>('#sp-sub')!,
    p1: document.querySelector<HTMLElement>('#sp-p1')!,
    p2: document.querySelector<HTMLElement>('#sp-p2')!,
    grid: document.querySelector<HTMLElement>('#sp-grid')!,
    foot: document.querySelector<HTMLElement>('#sp-foot-tag')!,
  };
  const ART: Record<string, string> = {};
  cards.forEach((c) => {
    const art = c.querySelector('.ph-art');
    if (art) ART[c.dataset.loc!] = art.innerHTML;
  });
  let spCurrent = 0;

  function openSpread(i: number) {
    spCurrent = i;
    if (!cineActive) {
      cineFocused = i;  // train pulls into station while spread is open
      updateTrainTarget();
    }
    const d = STATION_DATA[i];
    spread.dataset.loc = d.loc;
    spEls.art.innerHTML = ART[d.loc] || '';
    spEls.city.textContent = d.h.replace(/\.\s*<em>.*/, '.').replace(/<em>|<\/em>/g, '');
    spEls.coord.textContent = d.coord;
    spEls.stampAmt.textContent = d.stamp;
    spEls.stampFlag.className = 'pc-stamp-flag ' + (d.flag || '');
    spEls.pmL.textContent = d.pmL;
    spEls.pmDate.textContent = d.pmDate;
    spEls.pmR.textContent = d.pmR;
    spEls.eyebrow.textContent = d.eyebrow;
    spEls.h.innerHTML = d.h;
    spEls.sub.textContent = d.sub;
    spEls.p1.innerHTML = d.p1;
    spEls.p2.innerHTML = d.p2;
    spEls.grid.innerHTML = d.grid.map(([k, v]) => `<div><b>${k}</b><span>${v}</span></div>`).join('');
    spEls.foot.textContent = 'stop · 0' + (i + 1) + ' of 04';
    spread.classList.add('open');
    audBell();
    target = centerOf(i);
    focusCard(i);
  }
  function closeSpread() {
    spread.classList.remove('open');
    if (!cineActive) {
      cards.forEach((c) => c.classList.remove('focus'));
      // Reset strip pan + train target so the user lands back at rest state
      // (Delhi visible) instead of staying centered on the card they opened.
      target = 0;
      cineFocused = -1;
      updateTrainTarget();
    }
  }
  spBd.addEventListener('click', closeSpread);
  spClose.addEventListener('click', closeSpread);
  document.querySelector('#sp-prev')!.addEventListener('click', () => openSpread((spCurrent + 3) % 4));
  document.querySelector('#sp-next')!.addEventListener('click', () => openSpread((spCurrent + 1) % 4));
  document.addEventListener('keydown', (e) => {
    if (!spread.classList.contains('open')) return;
    if (e.key === 'Escape') closeSpread();
    if (e.key === 'ArrowLeft') openSpread((spCurrent + 3) % 4);
    if (e.key === 'ArrowRight') openSpread((spCurrent + 1) % 4);
  });

  // INTERACTION
  cards.forEach((c, i) => c.addEventListener('click', (e) => {
    if (!interactive) return;
    e.preventDefault();
    openSpread(i);
  }));
  rail.addEventListener('pointerdown', (e) => {
    if (!interactive) return;
    if ((e.target as HTMLElement).closest('.pcard')) return;
    dragging = true;
    sx = e.clientX;
    startX = target;
    strip.classList.add('grab');
    try { rail.setPointerCapture(e.pointerId); } catch {}
  });
  rail.addEventListener('pointermove', (e) => {
    if (!dragging || !interactive) return;
    target = startX + (e.clientX - sx) * 1.4;
  });
  rail.addEventListener('pointerup', () => {
    dragging = false;
    strip.classList.remove('grab');
  });
  rail.addEventListener('wheel', (e) => {
    if (!interactive) return;
    if (window.scrollY < window.innerHeight * 0.6 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      target -= e.deltaX * 1.2;
    }
  }, { passive: false });

  // CONTROLS — guarded since #desk-section is now hidden in the new ride
  // layout but its handlers stay wired in case the old cinema is replayed.
  document.querySelector('#dc-skip')?.addEventListener('click', endCinema);
  document.querySelector('#dc-replay')?.addEventListener('click', () => playCinema(false));
  const tog = document.querySelector<HTMLElement>('#aud-tog');
  if (tog) {
    tog.addEventListener('click', () => {
      audUnlock();
      const next = !audState().on;
      audSetOn(next);
      if (next && cineActive && !audState().rumble) audRumbleStart();
    });
  }

  // ============================================================
  // RIDE — sticky-scroll cinematic journey (new layout)
  // ============================================================
  const rideDriver = document.querySelector<HTMLElement>('#ride-driver');
  const rideStations = Array.from(document.querySelectorAll<HTMLElement>('.station'));
  const rideTrain = document.querySelector<HTMLElement>('#ride-train');
  const rideTrack = document.querySelector<HTMLElement>('.ride-track');
  const rpFill = document.querySelector<HTMLElement>('#rp-fill');
  const rpStops = Array.from(document.querySelectorAll<HTMLElement>('.rp-stop'));
  const rideCoord = document.querySelector<HTMLElement>('#ride-coord');
  const rideNow = document.querySelector<HTMLElement>('#ride-now');

  const RIDE_HUD = [
    { coord: 'N 28.6° · E 77.2°', now: '· DELHI' },
    { coord: 'N 31.1° · E 75.3°', now: '· PUNJAB' },
    { coord: 'L 51.5° · D 25.2°', now: '· LONDON / DUBAI' },
    { coord: 'N 43.2° · W 77.6°', now: '· ROCHESTER' },
  ];

  if (rideDriver && rideStations.length) {
    // Parallax hill refs — translated each frame proportional to scroll.
    const hillFar  = document.querySelector<SVGPathElement>('.ride-hills .hill-far');
    const hillMid  = document.querySelector<SVGPathElement>('.ride-hills .hill-mid');
    const hillNear = document.querySelector<SVGPathElement>('.ride-hills .hill-near');

    let currentActive = 0;
    let rideTiesX = 0;
    // Lerped scroll progress: targetProgress is set by scroll listener,
    // currentProgress catches up each frame for buttery motion.
    let targetProgress = 0;
    let currentProgress = 0;
    let smoothVel = 0;
    let lastCurrent = 0;

    const readTarget = () => {
      const rect = rideDriver.getBoundingClientRect();
      const trackPx = rect.height - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      targetProgress = trackPx > 0 ? Math.min(1, scrolled / trackPx) : 0;
    };

    const updateRide = () => {
      // 1. Smooth progress toward scroll target
      currentProgress += (targetProgress - currentProgress) * 0.085;
      // 2. Smoothed velocity (no spikes on wheel events)
      const instVel = currentProgress - lastCurrent;
      smoothVel += (instVel - smoothVel) * 0.3;
      lastCurrent = currentProgress;

      // 5 segments: 4 stations + 1 coda at the end ("where could we go next?")
      const SEGMENTS = 5;
      const seg = Math.min(SEGMENTS - 1, Math.floor(currentProgress * SEGMENTS));
      const inCoda = seg === SEGMENTS - 1;
      const idx = inCoda ? rideStations.length - 1 : Math.min(rideStations.length - 1, seg);

      document.body.classList.toggle('in-coda', inCoda);

      if (inCoda) {
        // Coda visible — fade all stations out, light all dots, HUD goes terminal.
        rideStations.forEach((s) => s.classList.remove('active'));
        rpStops.forEach((s) => s.classList.add('lit'));
        if (rideCoord) rideCoord.textContent = '· · ·';
        if (rideNow) rideNow.textContent = '· END OF LINE';
        currentActive = -1;
      } else if (idx !== currentActive) {
        rideStations[currentActive]?.classList.remove('active');
        rideStations[idx]?.classList.add('active');
        rpStops.forEach((s, i) => s.classList.toggle('lit', i <= idx));
        const data = RIDE_HUD[idx];
        if (data) {
          if (rideCoord) rideCoord.textContent = data.coord;
          if (rideNow) rideNow.textContent = data.now;
        }
        currentActive = idx;
        if (audState().on) audBell();
      }

      // Progress fill — smooth, off the lerped value
      if (rpFill) rpFill.style.width = (currentProgress * 100).toFixed(2) + '%';

      // Train + parallax + ties
      const sideMargin = 80;
      const trackWidth = window.innerWidth - sideMargin * 2;

      // Parallax hills — far moves slowest, near moves fastest. All
      // move opposite to "travel" direction (right-to-left as we go forward).
      if (hillFar)  hillFar.style.transform  = `translateX(${(-currentProgress * trackWidth * 0.08).toFixed(2)}px)`;
      if (hillMid)  hillMid.style.transform  = `translateX(${(-currentProgress * trackWidth * 0.18).toFixed(2)}px)`;
      if (hillNear) hillNear.style.transform = `translateX(${(-currentProgress * trackWidth * 0.34).toFixed(2)}px)`;

      if (rideTrain) {
        const trainX = sideMargin + currentProgress * trackWidth;
        // Ties scroll opposite to train motion, scaled by smoothed velocity
        rideTiesX -= smoothVel * trackWidth * 2.4 + 0.16;
        if (rideTrack) {
          rideTrack.style.setProperty('--ties-x', rideTiesX.toFixed(2) + 'px');
        }
        // Bob amplitude grows with smoothed velocity (no spikes)
        const bobAmp = Math.min(1.4, 0.32 + Math.abs(smoothVel) * 80);
        const bob = Math.sin(performance.now() / 95) * bobAmp;
        rideTrain.style.transform = `translate3d(${trainX.toFixed(2)}px, ${bob.toFixed(2)}px, 0)`;
        // Smoke puffs faster when train is moving
        const smokeDur = Math.max(0.85, 2.2 - Math.abs(smoothVel) * 38);
        rideTrain.style.setProperty('--smoke-dur', smokeDur.toFixed(2) + 's');
      }
    };

    // Scroll just updates the target — rAF does the smoothing.
    window.addEventListener('scroll', readTarget, { passive: true });
    window.addEventListener('resize', readTarget);

    const rideTick = () => {
      updateRide();
      requestAnimationFrame(rideTick);
    };
    readTarget();
    rideTick();
    [50, 200, 600, 1500].forEach((d) => setTimeout(readTarget, d));

    // Hide #ask (chat) and #np (now playing) while the ride section is in
    // view — they were sitting on top of the train. Two mechanisms in case
    // one fails: IntersectionObserver, plus a direct scroll-based check.
    const rideObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          document.body.classList.toggle('ride-visible', entry.isIntersecting);
        }
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );
    rideObserver.observe(rideDriver);

    const checkRideVisible = () => {
      const r = rideDriver.getBoundingClientRect();
      const inView = r.bottom > window.innerHeight * 0.1 && r.top < window.innerHeight * 0.9;
      document.body.classList.toggle('ride-visible', inView);
    };
    window.addEventListener('scroll', checkRideVisible, { passive: true });
    checkRideVisible();

    // "open the postcard →" buttons trigger the existing spread modal
    document.querySelectorAll<HTMLButtonElement>('.station-open').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.open || '0', 10);
        openSpread(i);
      });
    });

    // rp-stop dots are clickable shortcuts to jump to a station
    rpStops.forEach((stop, i) => {
      stop.style.cursor = 'pointer';
      stop.style.pointerEvents = 'auto';
      stop.addEventListener('click', () => {
        const rect = rideDriver.getBoundingClientRect();
        const driverTop = rect.top + window.scrollY;
        const trackPx = rideDriver.offsetHeight - window.innerHeight;
        const targetY = driverTop + (i / (rideStations.length - 1 || 1)) * trackPx;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });
  }
}
