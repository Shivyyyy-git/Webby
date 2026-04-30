import { initLoader, initClock, initChromeReveal, initNowPlaying, initSmoothAnchors, initMagneticPhoto } from './chrome';
import { initCursor } from './cursor';
import { initDesk } from './desk';
import { initReveal, initCounters } from './reveal';
import { initRibbon } from './ribbon';
import { initJourney } from './journey';
import { audSetupUnlock, audUnlock, audSetOn } from './audio';
import { initGreeter, hasGreeted, getStoredPref, type GreeterPayload } from './greeter';

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

function run() {
  audSetupUnlock();
  initCursor();
  initClock();
  initDesk();
  initChromeReveal();
  initReveal();
  initCounters();
  initRibbon();
  initNowPlaying();
  initSmoothAnchors();
  initMagneticPhoto();
  initJourney();

  // Greeter gates the cinema. On submit (or skip, or a returning visitor),
  // startMainSequence kicks off the atmospheric loader → hero reveal → cinema.
  const formIsShown = initGreeter((payload) => startMainSequence(payload));
  if (!formIsShown) {
    // hasGreeted() returned true — initGreeter already invoked the callback
    // synchronously with the stored preference. Nothing else to do.
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
