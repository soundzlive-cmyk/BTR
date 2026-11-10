// Home video: play with sound when the browser allows it. Browsers block
// autoplay with sound until the visitor interacts, so if blocked we play
// muted and turn sound on at the first click, tap, or key press.
(() => {
  const v = document.getElementById('homeVideo');
  const btn = document.getElementById('videoSoundBtn');
  if (!v) return;
  const events = ['pointerdown', 'touchstart', 'keydown'];
  const unmute = () => {
    v.muted = false; v.volume = 1;
    v.play().catch(() => {});
    if (btn) btn.hidden = true;
    events.forEach(e => document.removeEventListener(e, unmute, true));
  };
  v.muted = false;
  v.play().then(() => { if (btn) btn.hidden = true; }).catch(() => {
    v.muted = true;
    v.play().catch(() => {});
    if (btn) btn.hidden = false;
    events.forEach(e => document.addEventListener(e, unmute, {capture: true, once: false, passive: true}));
  });
  btn?.addEventListener('click', unmute);
  v.addEventListener('volumechange', () => { if (!v.muted && btn) btn.hidden = true; });
})();
