/*
  Greeter — first-visit form. Saves to localStorage and (optionally)
  posts to a Google Apps Script Web App URL set in GREETER_WEBHOOK.

  To wire the Google Sheet:
   1. Open a new Google Sheet, name it "Webby Greetings".
      Add headers in row 1: ts, name, city, email, music, ua, ref
   2. Extensions → Apps Script. Replace the script with:

        function doPost(e) {
          const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
          const data = JSON.parse(e.postData.contents || '{}');
          sheet.appendRow([
            new Date().toISOString(),
            data.name || '',
            data.city || '',
            data.email || '',
            data.music || '',
            data.ua || '',
            data.ref || ''
          ]);
          return ContentService.createTextOutput(JSON.stringify({ok:true}))
            .setMimeType(ContentService.MimeType.JSON);
        }

   3. Deploy → New deployment → Type: Web app
      - Execute as: Me
      - Who has access: Anyone
      - Click Deploy → copy the URL
   4. Replace GREETER_WEBHOOK below with that URL.
*/

const GREETER_WEBHOOK = ''; // ← paste Google Apps Script Web App URL here

const STORAGE_KEY = 'shivam_greeted';
const PREF_KEY = 'shivam_pref';

export interface GreeterPayload {
  name: string;
  city: string;
  email: string;
  music: 'punjabi' | 'english' | 'silent';
}

export function hasGreeted(): boolean {
  try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
}

export function getStoredPref(): GreeterPayload | null {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function initGreeter(onDone: (payload: GreeterPayload) => void): boolean {
  const greeter = document.querySelector<HTMLElement>('#greeter');
  const form = document.querySelector<HTMLFormElement>('#greeter-form');
  const skip = document.querySelector<HTMLButtonElement>('#greeter-skip');
  if (!greeter || !form) return false;

  // Returning visitor — skip immediately, no flash.
  if (hasGreeted()) {
    greeter.classList.add('hidden');
    const stored = getStoredPref();
    onDone(stored ?? defaultPayload());
    return false;
  }

  // Remember where focus was before the dialog opened so we can restore it.
  const trigger = (document.activeElement as HTMLElement | null) ?? null;

  // Focus management: move focus into the dialog, trap Tab while open.
  function focusableEls(): HTMLElement[] {
    return Array.from(
      greeter!.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('hidden') && el.offsetParent !== null || el.tagName === 'INPUT');
  }
  const firstInput = greeter.querySelector<HTMLElement>('input[name="name"]');
  // Move focus into the dialog on the next frame (after any browser focus on body).
  requestAnimationFrame(() => {
    if (firstInput) firstInput.focus();
  });

  function onKeydown(e: KeyboardEvent) {
    if (greeter!.classList.contains('hidden') || greeter!.classList.contains('gone')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      complete({ name: '', city: '', email: '', music: 'silent' });
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = focusableEls();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
  document.addEventListener('keydown', onKeydown);

  function complete(payload: GreeterPayload) {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
      localStorage.setItem(PREF_KEY, JSON.stringify(payload));
    } catch {}

    // Best-effort webhook post. Non-blocking.
    if (GREETER_WEBHOOK) {
      try {
        fetch(GREETER_WEBHOOK, {
          method: 'POST',
          mode: 'no-cors',  // Apps Script doesn't return CORS headers
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            ...payload,
            ua: navigator.userAgent,
            ref: document.referrer || '',
          }),
        }).catch(() => {});
      } catch {}
    }

    // Tear down focus trap and restore focus.
    document.removeEventListener('keydown', onKeydown);
    // Fade greeter, then hand off to loader/cinema.
    greeter!.classList.add('gone');
    setTimeout(() => {
      greeter!.classList.add('hidden');
      onDone(payload);
      // Restore focus to the original trigger if it still exists, otherwise main.
      const main = document.getElementById('main-content');
      if (trigger && document.body.contains(trigger)) {
        trigger.focus();
      } else if (main) {
        main.focus();
      }
    }, 950);

    window.dispatchEvent(new CustomEvent('greeter:done', { detail: payload }));
  }

  function payloadFromForm(): GreeterPayload {
    const data = new FormData(form!);
    return {
      name: String(data.get('name') || '').trim(),
      city: String(data.get('city') || '').trim(),
      email: String(data.get('email') || '').trim(),
      music: (String(data.get('music') || 'silent') as GreeterPayload['music']),
    };
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    complete(payloadFromForm());
  });

  if (skip) {
    skip.addEventListener('click', () => {
      complete({ name: '', city: '', email: '', music: 'silent' });
    });
  }

  return true;
}

function defaultPayload(): GreeterPayload {
  return { name: '', city: '', email: '', music: 'silent' };
}
