// Home page popup for the Evening of Excellence Gala featured speaker.
(() => {
  const modal = document.getElementById('galaModal');
  if (!modal) return;
  const endAfter = new Date('2026-11-15T00:00:00-05:00').getTime(); // stop showing once the gala is over
  if (Date.now() >= endAfter) { modal.remove(); return; }
  const KEY = 'btrGalaModalSeen';
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch {}
  if (seen) return;

  const panel = modal.querySelector('.gala-modal-panel');
  let lastFocus = null;
  const focusables = () => [...modal.querySelectorAll('a[href],button:not([disabled])')];

  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    (modal.querySelector('.gala-modal-close') || panel).focus();
  }
  function close() {
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('modal-open');
    try { sessionStorage.setItem(KEY, '1'); } catch {}
    setTimeout(() => { modal.hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  modal.querySelectorAll('.gala-modal-copy a').forEach(a => a.addEventListener('click', () => { try { sessionStorage.setItem(KEY, '1'); } catch {} }));
  setTimeout(open, 800);
})();
