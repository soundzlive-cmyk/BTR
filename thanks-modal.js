// Home page popup: post-gala thank-you with rotating photos.
(() => {
  const modal = document.getElementById('thanksModal');
  if (!modal) return;
  // Turned off until further notice. Set to true to bring the popup back.
  const POPUP_ENABLED = false;
  const preview = new URLSearchParams(location.search).has('thanks');
  if (!POPUP_ENABLED && !preview) { modal.remove(); return; }
  const KEY = 'btrThanksModalSeen';
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch {}
  const forced = new URLSearchParams(location.search).has('thanks'); // ?thanks always shows it
  if (seen && !forced) { modal.remove(); return; }

  const panel = modal.querySelector('.gala-modal-panel');
  const slides = [...modal.querySelectorAll('.tm-slide')];
  const dots = [...modal.querySelectorAll('.tm-dot')];
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0, timer = null, lastFocus = null, userPaused = false;
  const toggle = modal.querySelector('.tm-toggle');
  if (still && toggle) toggle.hidden = true;

  const show = i => {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle('is-active', n === index));
    if (toggle) toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.textContent = userPaused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', userPaused ? 'Play photos' : 'Pause photos');
    userPaused ? pause() : play();
  });
  dots.forEach((d, n) => { d.classList.toggle('is-active', n === index); if (n === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
  };
  const play = () => { if (still || userPaused || timer) return; timer = setInterval(() => show(index + 1), 4000); };
  const pause = () => { clearInterval(timer); timer = null; };
  dots.forEach((d, n) => d.addEventListener('click', () => { pause(); show(n); play(); }));
  const rot = modal.querySelector('.tm-rotator');
  rot.addEventListener('mouseenter', pause); rot.addEventListener('mouseleave', play);

  const focusables = () => [...modal.querySelectorAll('a[href],button:not([disabled])')];
  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add('modal-open');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    (modal.querySelector('.gala-modal-close') || panel).focus();
    play();
  }
  function close() {
    pause();
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('modal-open');
    try { sessionStorage.setItem(KEY, '1'); } catch {}
    setTimeout(() => { modal.hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowRight') { pause(); show(index + 1); }
    if (e.key === 'ArrowLeft') { pause(); show(index - 1); }
    if (e.key !== 'Tab') return;
    const f = focusables(); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  modal.querySelectorAll('.tm-copy a').forEach(a => a.addEventListener('click', () => { try { sessionStorage.setItem(KEY, '1'); } catch {} }));
  setTimeout(open, 800);
})();
