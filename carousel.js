(() => {
  for (const root of document.querySelectorAll('.carousel')) {
    const track = root.querySelector('.carousel-track');
    const slides = [...root.querySelectorAll('.carousel-slide')];
    const dots = [...root.querySelectorAll('.carousel-dot')];
    const toggle = root.querySelector('.carousel-toggle');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const delay = 5000;
    let index = 0, timer = null, paused = reduceMotion.matches, hovering = false;

    function show(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(${-index * 100}%)`;
      slides.forEach((s, n) => {
        s.setAttribute('aria-hidden', n === index ? 'false' : 'true');
        s.inert = n !== index;
      });
      dots.forEach((d, n) => n === index ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'));
      // Load the next photo ahead of time so it is ready when the slide moves.
      const next = slides[(index + 1) % slides.length].querySelector('img');
      if (next) next.loading = 'eager';
    }
    function stop() { clearInterval(timer); timer = null; }
    function start() {
      stop();
      if (paused || hovering || document.hidden) return;
      timer = setInterval(() => show(index + 1), delay);
    }
    function setPaused(value) {
      paused = value;
      toggle.textContent = paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      // Announce slide changes to screen readers only when the user is in control.
      track.setAttribute('aria-live', paused ? 'polite' : 'off');
      paused ? stop() : start();
    }
    function go(i) { show(i); start(); }

    root.querySelector('.carousel-prev').addEventListener('click', () => go(index - 1));
    root.querySelector('.carousel-next').addEventListener('click', () => go(index + 1));
    dots.forEach((d, n) => d.addEventListener('click', () => go(n)));
    toggle.addEventListener('click', () => setPaused(!paused));

    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
    });
    root.addEventListener('mouseenter', () => { hovering = true; stop(); });
    root.addEventListener('mouseleave', () => { hovering = false; start(); });
    root.addEventListener('focusin', () => { hovering = true; stop(); });
    root.addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) { hovering = false; start(); } });
    document.addEventListener('visibilitychange', start);

    // Swipe on touch screens; the track follows the finger, then snaps.
    let startX = null, startY = null, dx = 0, swiping = false;
    const frame = root.querySelector('.carousel-frame');
    frame.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' || e.target.closest('button')) return;
      startX = e.clientX; startY = e.clientY; dx = 0; swiping = false; stop();
    });
    frame.addEventListener('pointermove', e => {
      if (startX === null) return;
      dx = e.clientX - startX;
      if (!swiping && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - startY)) {
        swiping = true; track.classList.add('is-dragging'); frame.setPointerCapture(e.pointerId);
      }
      if (swiping) track.style.transform = `translateX(calc(${-index * 100}% + ${dx}px))`;
    });
    const endSwipe = () => {
      if (startX === null) return;
      track.classList.remove('is-dragging');
      if (swiping && Math.abs(dx) > frame.clientWidth * 0.15) show(index + (dx < 0 ? 1 : -1));
      else show(index);
      startX = null; swiping = false; start();
    };
    frame.addEventListener('pointerup', endSwipe);
    frame.addEventListener('pointercancel', endSwipe);

    reduceMotion.addEventListener?.('change', e => { if (e.matches) setPaused(true); });
    show(0);
    setPaused(paused);
  }
})();
