const menu=document.getElementById('menu');const nav=document.getElementById('navigation');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');menu.textContent=open?'Close':'Menu';nav.classList.toggle('open',open)});nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');menu.textContent='Menu'}});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){menu.click();menu.focus()}});

// Gala countdown in the announcement bar
(() => {
  const bar = document.querySelector('.announcement');
  if (!bar) return;
  const start = new Date('2026-11-14T19:00:00-05:00').getTime();
  const end = new Date('2026-11-15T00:00:00-05:00').getTime();
  if (Date.now() >= end) return;
  const box = document.createElement('span');
  box.className = 'gala-countdown';
  box.setAttribute('role', 'timer');
  box.setAttribute('aria-label', 'Time until the Evening of Excellence Gala');
  const units = [['days', 86400], ['hrs', 3600], ['min', 60], ['sec', 1]];
  box.innerHTML = units.map(([u]) => `<span class="cd-unit"><b data-u="${u}">--</b><small>${u}</small></span>`).join('');
  bar.appendChild(box);
  const cells = Object.fromEntries(units.map(([u]) => [u, box.querySelector(`[data-u="${u}"]`)]));
  const tick = () => {
    const now = Date.now();
    if (now >= end) { box.remove(); clearInterval(timer); return; }
    if (now >= start) { box.innerHTML = '<span class="cd-live">Happening now!</span>'; clearInterval(timer); return; }
    let s = Math.floor((start - now) / 1000);
    for (const [u, size] of units) { const v = Math.floor(s / size); s -= v * size; cells[u].textContent = u === 'days' ? v : String(v).padStart(2, '0'); }
  };
  tick();
  const timer = setInterval(tick, 1000);
})();
