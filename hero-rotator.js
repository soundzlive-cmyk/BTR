// Home banner: crossfade through the hero photos, with a pause control (WCAG 2.2.2).
(() => {
  const slides = [...document.querySelectorAll('.hero-rotator .hero-slide')];
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  slides.forEach(s => { s.loading = 'eager'; });
  const btn = document.querySelector('.hero-toggle');
  let i = 0, paused = false;
  if (btn) {
    btn.hidden = false;
    btn.addEventListener('click', () => {
      paused = !paused;
      btn.setAttribute('aria-pressed', String(paused));
      btn.textContent = paused ? 'Play slideshow' : 'Pause slideshow';
    });
  }
  setInterval(() => {
    if (document.hidden || paused) return;
    slides[i].classList.remove('is-active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-active');
  }, 6000);
})();
