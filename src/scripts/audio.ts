/*
  Web Audio synthesis for the postcard ride.
   - rumble bed (brownian noise lowpass)
   - wheel clack (noise burst bandpass)
   - Indian Railways train horn (D4/G4 fifth)
   - station bell (4-partial brass)
   - PA chime (E5/G5/C6 ascending)

  Optional Tone.js ambient pad — gated, very low gain. Loaded lazily.
*/

interface AudioState {
  ctx: AudioContext | null;
  master: GainNode | null;
  rumble: AudioBufferSourceNode | null;
  rumbleGain: GainNode | null;
  clackTimer: number | null;
  on: boolean;
  unlocked: boolean;
}

const A: AudioState = {
  ctx: null,
  master: null,
  rumble: null,
  rumbleGain: null,
  clackTimer: null,
  on: false,
  unlocked: false,
};

export function audInit() {
  if (A.ctx) return;
  try {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    A.ctx = new C();
    A.master = A.ctx.createGain();
    A.master.gain.value = 0;
    A.master.connect(A.ctx.destination);
  } catch {}
}

export function audUnlock() {
  if (!A.ctx) audInit();
  if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume();
  A.unlocked = true;
}

export function audState() {
  return A;
}

export function audRumbleStart() {
  if (!A.ctx || A.rumble) return;
  const ctx = A.ctx;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 160;
  lp.Q.value = 0.7;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 35;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(lp).connect(hp).connect(g).connect(A.master!);
  src.start();
  A.rumble = src;
  A.rumbleGain = g;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.4);
}

export function audRumbleStop() {
  if (!A.rumbleGain || !A.ctx) return;
  const ctx = A.ctx;
  A.rumbleGain.gain.cancelScheduledValues(ctx.currentTime);
  A.rumbleGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.6);
  setTimeout(() => {
    try { A.rumble?.stop(); } catch {}
    A.rumble = null;
    A.rumbleGain = null;
  }, 1800);
  if (A.clackTimer) {
    clearInterval(A.clackTimer);
    A.clackTimer = null;
  }
}

export function audClack() {
  if (!A.ctx || !A.on) return;
  const ctx = A.ctx;
  const t = ctx.currentTime;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 220;
  bp.Q.value = 2.2;
  const g = ctx.createGain();
  g.gain.value = 0.22;
  src.connect(bp).connect(g).connect(A.master!);
  src.start(t);
}

export function audClackLoop(intervalMs: number) {
  if (A.clackTimer) clearInterval(A.clackTimer);
  A.clackTimer = setInterval(() => {
    audClack();
    setTimeout(audClack, 90);
  }, intervalMs) as unknown as number;
}

export function audHorn(pattern: [number, number][]) {
  if (!A.ctx || !A.on) return;
  const ctx = A.ctx;
  const t0 = ctx.currentTime;
  let t = t0;
  pattern.forEach(([dur, gap]) => {
    const f1 = 294, f2 = 392; // D4 + G4
    [f1, f2, f1 * 2, f2 * 2].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'sawtooth' : 'triangle';
      o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
      const g = ctx.createGain();
      g.gain.value = 0;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 5.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = f * 0.004;
      lfo.connect(lfoGain).connect(o.frequency);
      const bp = ctx.createBiquadFilter();
      bp.type = 'lowpass';
      bp.frequency.value = 2400;
      bp.Q.value = 0.6;
      o.connect(bp).connect(g).connect(A.master!);
      const peak = i === 0 ? 0.22 : i === 1 ? 0.18 : i === 2 ? 0.06 : 0.05;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 0.18);
      g.gain.linearRampToValueAtTime(peak * 0.85, t + dur - 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      lfo.start(t); o.start(t);
      lfo.stop(t + dur + 0.05); o.stop(t + dur + 0.05);
    });
    t += dur + gap;
  });
}

export function audBell() {
  if (!A.ctx || !A.on) return;
  const ctx = A.ctx;
  const t = ctx.currentTime;
  [880, 1318, 2200, 2640].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0;
    o.connect(g).connect(A.master!);
    const peak = [0.16, 0.10, 0.06, 0.04][i];
    g.gain.linearRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2 - i * 0.2);
    o.start(t);
    o.stop(t + 2.4);
  });
}

export function audPAChime() {
  if (!A.ctx || !A.on) return;
  const ctx = A.ctx;
  const t0 = ctx.currentTime;
  [659.25, 783.99, 1046.5].forEach((f, i) => {
    const t = t0 + i * 0.22;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0;
    o.connect(g).connect(A.master!);
    g.gain.linearRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.start(t); o.stop(t + 1);

    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain();
    g2.gain.value = 0;
    o2.connect(g2).connect(A.master!);
    g2.gain.linearRampToValueAtTime(0.05, t + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o2.start(t); o2.stop(t + 0.8);
  });
}

export function audSetOn(on: boolean) {
  A.on = on;
  if (!A.ctx) return;
  const t = A.ctx.currentTime;
  A.master!.gain.cancelScheduledValues(t);
  A.master!.gain.linearRampToValueAtTime(on ? 0.5 : 0, t + 0.6);
  const tog = document.getElementById('aud-tog');
  if (tog) {
    tog.classList.toggle('on', on);
    if (tog.lastChild) tog.lastChild.textContent = on ? 'sound on' : 'sound off';
  }
}

export function audSetupUnlock() {
  document.addEventListener('click', audUnlock, { once: true });
  document.addEventListener('pointerdown', audUnlock, { once: true });
}

/* OPTIONAL: Tone.js ambient pad. Loaded lazily — only if explicitly invoked. */
let _padStarted = false;
export async function startAmbientPad() {
  if (_padStarted) return;
  _padStarted = true;
  try {
    const Tone = await import('tone');
    await Tone.start();
    const reverb = new Tone.Reverb({ decay: 8, wet: 0.6 }).toDestination();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 0, sustain: 1, release: 6 },
    }).connect(reverb);
    synth.volume.value = -28;
    // Cm9 voicing — section-key per design brief #2
    synth.triggerAttack(['C3', 'Eb3', 'G3', 'Bb3', 'D4']);
  } catch {
    _padStarted = false;
  }
}
