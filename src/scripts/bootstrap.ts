import { initLoader, initClock, initChromeReveal, initNowPlaying, initSmoothAnchors, initMagneticPhoto } from './chrome';
import { initCursor } from './cursor';
import { initDesk } from './desk';
import { initReveal, initCounters } from './reveal';
import { initRibbon } from './ribbon';
import { initJourney } from './journey';
import { audSetupUnlock } from './audio';

function run() {
  audSetupUnlock();
  initLoader();
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
