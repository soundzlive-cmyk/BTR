(() => {
  const endpoint = 'https://thesoe2.net/BTR/api.php';
  const status = document.getElementById('giving-status');
  const money = n => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(n);
  let lastSuccess = null;
  let busy = false;
  async function refresh() {
    if (busy) return;
    busy = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint, {cache:'no-store', credentials:'omit', signal:controller.signal});
      if (!response.ok) throw new Error('Donation source unavailable');
      const data = await response.json();
      if (typeof data.current !== 'number' || typeof data.goal !== 'number' || !Number.isFinite(data.current) || !Number.isFinite(data.goal) || data.current < 0 || data.goal <= 0) throw new Error('Invalid donation totals');
      const percent = Math.min(data.current / data.goal * 100, 100);
      document.getElementById('raised-total').textContent = money(data.current);
      document.getElementById('goal-total').textContent = money(data.goal);
      document.getElementById('giving-fill').style.width = percent + '%';
      document.getElementById('giving-percent').textContent = Math.round(data.current / data.goal * 100) + '% of our goal';
      document.getElementById('giving-remaining').textContent = data.current >= data.goal ? 'Goal reached. Thank you!' : money(data.goal - data.current) + ' to go';
      const meter = document.getElementById('giving-meter');
      meter.setAttribute('aria-valuemax', data.goal);
      meter.setAttribute('aria-valuenow', Math.min(data.current, data.goal));
      meter.setAttribute('aria-valuetext', money(data.current) + ' raised of ' + money(data.goal) + ' goal');
      lastSuccess = new Date();
      status.textContent = 'Updated from BTR’s tracker ' + lastSuccess.toLocaleString('en-US') + '. Refreshes every minute.';
    } catch {
      status.textContent = lastSuccess ? 'Latest refresh unavailable. Showing total received ' + lastSuccess.toLocaleString('en-US') + '.' : 'Last verified October 12, 2026. Live refresh unavailable; see the tracker for the latest total.';
    } finally { clearTimeout(timer); busy = false; }
  }
  refresh();
  setInterval(() => {if (!document.hidden) refresh();}, 60000);
  document.getElementById('share-campaign')?.addEventListener('click', async () => {
    const output = document.getElementById('share-status');
    const url = new URL('support.html', location.href).href;
    try {
      if (navigator.share) await navigator.share({title:'Help BTR reach $100K', text:'Support mentorship, youth opportunities, and community programs.', url});
      else {await navigator.clipboard.writeText(url); output.textContent = 'Campaign link copied. Thank you for spreading the word!';}
    } catch (error) { if (error.name !== 'AbortError') output.textContent = 'Share this page by copying its address from your browser.'; }
  });
})();
