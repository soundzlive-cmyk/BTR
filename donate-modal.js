// Home page popup: "Help us raise the final $881" donation appeal (PayPal).
// Shows once per browser session. Add ?donate to the URL to always show it.
(() => {
  const modal = document.getElementById('donateModal');
  if (!modal) return;
  const POPUP_ENABLED = true; // set to false to turn the popup off
  const forced = new URLSearchParams(location.search).has('donate');
  const KEY = 'btrDonateModalSeen';
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch {}
  if ((!POPUP_ENABLED || seen) && !forced) { modal.remove(); return; }

  const panel = modal.querySelector('.gala-modal-panel');
  let lastFocus = null;
  const remember = () => { try { sessionStorage.setItem(KEY, '1'); } catch {} };
  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    modal.querySelector('.gala-modal-close').focus();
  }
  function close() {
    remember();
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('modal-open');
    setTimeout(() => { modal.hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  modal.querySelector('.donate-modal-link').addEventListener('click', () => { remember(); setTimeout(close, 0); });
  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = [...panel.querySelectorAll('a[href],button')];
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  setTimeout(open, 800);
})();
