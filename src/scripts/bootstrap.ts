import {
  initLoader, initClock, initChromeReveal, initNowPlaying, initSmoothAnchors,
  initMagneticPhoto, revealHero, dismissLoaderInstant,
} from './chrome';
import { initCursor } from './cursor';
import { initDesk } from './desk';
import { initReveal, initCounters } from './reveal';
import { audSetupUnlock, audUnlock, audSetOn } from './audio';
import { initGreeter, type GreeterPayload } from './greeter';
import { shouldLoadCinema } from './capability';

function startMainSequence(payload: GreeterPayload) {
  // Honor music preference. punjabi/english → audio on; silent → off.
  if (payload.music === 'punjabi' || payload.music === 'english') {
    audUnlock();
    audSetOn(true);
    // Stash on a global so desk.ts cinema can pick it up.
    (window as any).__shivam_music = payload.music;
  } else {
    (window as any).__shivam_music = 'silent';
  }
  initLoader();
}

function runFastPath() {
  // Reduced-motion, save-data, or slow connection: skip the greeter gate and
  // the 4.25s loader sequence. Render hero proof immediately. The interactive
  // rail (desk.ts) still wires up so postcards remain navigable, but the
  // auto-playing cinema does not fire.
  document.body.classList.add('no-cinema');
  (window as any).__shivam_music = 'silent';

  // Hide the greeter and loader synchronously so they never paint.
  const greeter = document.querySelector<HTMLElement>('#greeter');
  if (greeter) greeter.classList.add('hidden');
  dismissLoaderInstant();

  initCursor();
  initClock();
  initDesk();
  initChromeReveal();
  initReveal();
  initCounters();
  initNowPlaying();
  initSmoothAnchors();
  initMagneticPhoto();

  revealHero({ instant: true, skipCinema: true });
}

function runCinemaPath() {
  audSetupUnlock();
  initCursor();
  initClock();
  initDesk();
  initChromeReveal();
  initReveal();
  initCounters();
  initNowPlaying();
  initSmoothAnchors();
  initMagneticPhoto();

  // Greeter gates the cinema. On submit (or skip, or a returning visitor),
  // startMainSequence kicks off the atmospheric loader → hero reveal → cinema.
  const formIsShown = initGreeter((payload) => startMainSequence(payload));
  if (!formIsShown) {
    // hasGreeted() returned true — initGreeter already invoked the callback
    // synchronously with the stored preference. Nothing else to do.
  }
}

function run() {
  if (shouldLoadCinema()) {
    runCinemaPath();
  } else {
    runFastPath();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
