// Sponsor slideshow: autoplay, arrows, swipe, pause on hover/focus.
document.querySelectorAll('.sponsor-carousel').forEach(root => {
  const slides = [...root.querySelectorAll('.sc-slide')];
  const count = root.querySelector('.sc-count');
  const pauseBtn = root.querySelector('.sc-pause');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, timer = null, userPaused = reduce, hover = false;
  const show = n => {
    slides[i].classList.remove('is-active');
    i = (n + slides.length) % slides.length;
    const img = slides[i].querySelector('img'); if (img) img.loading = 'eager';
    const nxt = slides[(i + 1) % slides.length].querySelector('img'); if (nxt) nxt.loading = 'eager';
    slides[i].classList.add('is-active');
    count.textContent = (i + 1) + ' / ' + slides.length;
  };
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => { stop(); if (!userPaused && !hover) timer = setInterval(() => { if (!document.hidden) show(i + 1); }, 3500); };
  root.querySelector('.sc-prev').addEventListener('click', () => { show(i - 1); start(); });
  root.querySelector('.sc-next').addEventListener('click', () => { show(i + 1); start(); });
  pauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    pauseBtn.textContent = userPaused ? 'Play' : 'Pause';
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
    start();
  });
  if (reduce) { pauseBtn.textContent = 'Play'; pauseBtn.setAttribute('aria-label', 'Play slideshow'); }
  root.addEventListener('mouseenter', () => { hover = true; stop(); });
  root.addEventListener('mouseleave', () => { hover = false; start(); });
  root.addEventListener('focusin', () => { hover = true; stop(); });
  root.addEventListener('focusout', () => { hover = false; start(); });
  let x0 = null;
  root.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, {passive: true});
  root.addEventListener('touchend', e => {
    if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); start(); }
  });
  root.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { show(i + 1); start(); }
    if (e.key === 'ArrowLeft') { show(i - 1); start(); }
  });
  start();
});
