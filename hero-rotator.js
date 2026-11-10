// Home banner: crossfade through the hero photos.
(() => {
  const slides = [...document.querySelectorAll('.hero-rotator .hero-slide')];
  if (slides.length < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  slides.forEach(s => { s.loading = 'eager'; });
  let i = 0;
  setInterval(() => {
    if (document.hidden) return;
    slides[i].classList.remove('is-active');
    i = (i + 1) % slides.length;
    slides[i].classList.add('is-active');
  }, 6000);
})();
