// BTR site analytics: logs one page view per page load to the BTR Google Sheet.
// No cookies or IP addresses; a random ID in this browser tells new and returning visitors apart.
(() => {
  try {
    const ENDPOINT = 'https://script.google.com/macros/s/AKfycbybdMCkCQkDfuNPqe3OkluHDtybmGvPmJXeaF7aux7ilLj4HfCnWgjc8Hd3hDIMV-d5bg/exec';
    if (!/(^|\.)breakingthroughroadblocks\.org$/.test(location.hostname)) return; // skip local previews
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return;
    if (/bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit/i.test(navigator.userAgent)) return;

    const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
    let vid = '', sid = '';
    try {
      vid = localStorage.getItem('btr_vid') || rid();
      localStorage.setItem('btr_vid', vid);
      // A visit ends after 30 minutes without a page view.
      const s = JSON.parse(localStorage.getItem('btr_sess') || 'null');
      sid = s && Date.now() - s.t < 30 * 60 * 1000 ? s.id : rid();
      localStorage.setItem('btr_sess', JSON.stringify({ id: sid, t: Date.now() }));
    } catch {
      vid = sid = rid();
    }

    let ref = '';
    try { if (document.referrer && new URL(document.referrer).hostname !== location.hostname) ref = document.referrer; } catch {}

    const d = new FormData();
    d.append('formType', 'pageview');
    d.append('page', location.pathname.replace(/\/index\.html$/, '/') || '/');
    d.append('title', document.title);
    d.append('ref', ref);
    d.append('vid', vid);
    d.append('sid', sid);
    d.append('ua', navigator.userAgent);
    d.append('lang', navigator.language || '');
    d.append('screen', `${screen.width}x${screen.height}`);
    d.append('tz', Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    if (!(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, d)))
      fetch(ENDPOINT, { method: 'POST', body: d, mode: 'no-cors', keepalive: true, credentials: 'omit' });
  } catch {}
})();
