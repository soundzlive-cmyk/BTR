// BTR intake assistant: a guided chat that asks visitors how they want to connect
// (collaborate, donate, mentor, get involved), collects contact details, and saves
// them to the "Contact" tab of the BTR Google Sheet through the existing Apps Script.
(() => {
  if (document.getElementById('btrAgent')) return;
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbydSUNmFs9R92ZiSnmc9bt1DuG-tNrKiLa-QEVeTR90UeXN7dXE4PZX2pZLe8I4o7BaMg/exec';
  const PAYPAL = 'https://www.paypal.com/ncp/payment/ZL732ZLWXHD96';
  const LOGO = (document.querySelector('.brand-logo') || {}).src || 'btr-logo-2026.png';

  const css = `
  #btrAgent{--ag-red:#d0141d;--ag-ink:#111;--ag-muted:#555;font-family:inherit;color:var(--ag-ink)}
  #btrAgent *{box-sizing:border-box}
  .ag-launch{position:fixed;right:20px;bottom:20px;z-index:900;display:flex;align-items:center;gap:10px;padding:10px 18px 10px 10px;border:0;border-radius:999px;background:var(--ag-red);color:#fff;font:inherit;font-weight:700;font-size:.95rem;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.28)}
  .ag-launch img{width:36px;height:36px;border-radius:50%;background:#fff;object-fit:contain;padding:2px}
  .ag-launch:hover{background:#a80f17}
  .ag-launch:focus-visible,.ag-panel button:focus-visible,.ag-panel a:focus-visible,.ag-panel input:focus-visible,.ag-panel textarea:focus-visible{outline:3px solid #111;outline-offset:2px}
  .ag-panel{position:fixed;right:20px;bottom:20px;z-index:950;width:min(390px,calc(100vw - 24px));height:min(600px,calc(100vh - 40px));display:flex;flex-direction:column;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35)}
  .ag-panel[hidden],.ag-launch[hidden]{display:none}
  .ag-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#0a0a0a;color:#fff;border-bottom:4px solid var(--ag-red)}
  .ag-head img{width:40px;height:40px;object-fit:contain}
  .ag-head strong{display:block;font-size:1rem}
  .ag-head span{font-size:.78rem;color:#cfcfcf}
  .ag-x{margin-left:auto;width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:22px;line-height:1;cursor:pointer}
  .ag-log{flex:1;overflow-y:auto;padding:16px 14px;background:#f5f5f5;display:flex;flex-direction:column;gap:10px}
  .ag-msg{max-width:86%;padding:10px 13px;border-radius:14px;font-size:.93rem;line-height:1.45;white-space:pre-line}
  .ag-bot{align-self:flex-start;background:#fff;border:1px solid #e3e3e3;border-bottom-left-radius:4px}
  .ag-user{align-self:flex-end;background:#111;color:#fff;border-bottom-right-radius:4px}
  .ag-choices{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start;max-width:100%}
  .ag-choices button,.ag-choices a{border:1.5px solid var(--ag-red);background:#fff;color:var(--ag-red);border-radius:999px;padding:8px 14px;font:inherit;font-size:.88rem;font-weight:600;cursor:pointer;text-decoration:none}
  .ag-choices button:hover,.ag-choices a:hover{background:var(--ag-red);color:#fff}
  .ag-choices .ag-primary{background:var(--ag-red);color:#fff}
  .ag-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e3e3e3;background:#fff}
  .ag-form textarea{flex:1;resize:none;border:1px solid #cfcfcf;border-radius:10px;padding:10px;font:inherit;font-size:.93rem;height:44px;max-height:110px}
  .ag-form textarea:disabled{background:#f3f3f3}
  .ag-send{border:0;border-radius:10px;background:var(--ag-red);color:#fff;font:inherit;font-weight:700;padding:0 16px;cursor:pointer}
  .ag-send:disabled{opacity:.45;cursor:default}
  .ag-typing{align-self:flex-start;color:var(--ag-muted);font-size:.85rem;padding:2px 4px}
  .ag-err{color:#b00020;font-size:.8rem;padding:0 12px 8px;background:#fff}
  @media(max-width:520px){.ag-panel{right:0;bottom:0;width:100vw;height:100%;max-height:100dvh;border-radius:0}.ag-launch{right:12px;bottom:12px;padding:8px 14px 8px 8px}}
  @media(prefers-reduced-motion:no-preference){.ag-msg,.ag-choices{animation:agIn .18s ease-out}@keyframes agIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}}
  @media print{#btrAgent{display:none}}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const root = document.createElement('div'); root.id = 'btrAgent';
  root.innerHTML = `
    <button type="button" class="ag-launch" aria-haspopup="dialog" aria-controls="agPanel"><img src="${LOGO}" alt="">Get involved</button>
    <section class="ag-panel" id="agPanel" role="dialog" aria-label="BTR assistant" hidden>
      <div class="ag-head"><img src="${LOGO}" alt=""><div><strong>BTR Assistant</strong><span>Breaking Through Roadblocks</span></div><button type="button" class="ag-x" aria-label="Close assistant">&times;</button></div>
      <div class="ag-log" role="log" aria-live="polite"></div>
      <div class="ag-err" role="alert" hidden></div>
      <form class="ag-form"><label for="agInput" style="position:absolute;left:-9999px">Your answer</label><textarea id="agInput" rows="1" placeholder="Choose an option above" disabled></textarea><button class="ag-send" type="submit" disabled>Send</button></form>
    </section>`;
  document.body.appendChild(root);

  const $ = s => root.querySelector(s);
  const launch = $('.ag-launch'), panel = $('.ag-panel'), log = $('.ag-log'), form = $('.ag-form'), input = $('#agInput'), send = $('.ag-send'), err = $('.ag-err');
  const wait = ms => new Promise(r => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));
  const scroll = () => { log.scrollTop = log.scrollHeight; };

  let data = {}, started = false, pending = null;

  function add(text, who = 'bot') {
    const m = document.createElement('div'); m.className = 'ag-msg ag-' + who; m.textContent = text; log.appendChild(m); scroll(); return m;
  }
  async function say(...lines) {
    for (const l of lines) { const t = document.createElement('div'); t.className = 'ag-typing'; t.textContent = 'BTR is typing…'; log.appendChild(t); scroll(); await wait(450); t.remove(); add(l); }
  }
  // Show buttons; resolves with the chosen option. Options: {label, value, href, primary}
  function choose(options) {
    lockInput('Choose an option above');
    return new Promise(resolve => {
      const box = document.createElement('div'); box.className = 'ag-choices';
      options.forEach(o => {
        const el = document.createElement(o.href ? 'a' : 'button');
        el.textContent = o.label; if (o.primary) el.className = 'ag-primary';
        if (o.href) { el.href = o.href; el.target = o.href.startsWith('http') ? '_blank' : '_self'; if (el.target === '_blank') el.rel = 'noopener'; }
        else el.type = 'button';
        el.addEventListener('click', () => { if (o.href && !o.value) return; box.remove(); add(o.label, 'user'); resolve(o.value); });
        box.appendChild(el);
      });
      log.appendChild(box); scroll(); (box.querySelector('button') || box.querySelector('a')).focus();
    });
  }
  // Ask for typed text; resolves with the text (or '' if skipped).
  function ask({ placeholder = 'Type your answer…', optional = false, validate, multiline = false } = {}) {
    input.disabled = false; send.disabled = false; input.placeholder = placeholder; input.value = '';
    input.style.height = multiline ? '72px' : ''; input.focus();
    let skipBox = null;
    if (optional) {
      skipBox = document.createElement('div'); skipBox.className = 'ag-choices';
      const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Skip';
      skipBox.appendChild(b); log.appendChild(skipBox); scroll();
      b.addEventListener('click', () => pending && pending('', true));
    }
    return new Promise(resolve => {
      pending = (value, skipped) => {
        value = (value || '').trim();
        if (!skipped) {
          if (!value && !optional) { showErr('Please type an answer.'); return; }
          const problem = value && validate ? validate(value) : '';
          if (problem) { showErr(problem); return; }
        }
        showErr(''); pending = null; if (skipBox) skipBox.remove();
        add(skipped || !value ? 'Skip' : value, 'user'); lockInput('');
        resolve(skipped ? '' : value);
      };
    });
  }
  function lockInput(ph) { input.disabled = true; send.disabled = true; input.value = ''; input.placeholder = ph || ''; input.style.height = ''; }
  function showErr(t) { err.textContent = t; err.hidden = !t; }
  form.addEventListener('submit', e => { e.preventDefault(); if (pending) pending(input.value); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (pending) pending(input.value); } });

  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email address, like name@example.com.';
  const phoneOk = v => (v.match(/\d/g) || []).length >= 7 ? '' : 'Please enter a valid phone number, or tap Skip.';

  const PATHS = {
    collaborate: { label: 'Collaborate or partner', interest: 'Collaborate / partner' },
    donate: { label: 'Donate', interest: 'Donate' },
    mentor: { label: 'Become a mentor', interest: 'Become a mentor' },
    targets: { label: 'Interested in T.A.R.G.E.T.S.', interest: 'T.A.R.G.E.T.S. youth program' },
    involved: { label: 'Just get involved', interest: 'Get involved' }
  };

  async function run() {
    data = {};
    await say('Hi! I’m the BTR assistant. Thanks for stopping by Breaking Through Roadblocks.', 'How would you like to connect with us?');
    const path = await choose(Object.entries(PATHS).map(([value, p]) => ({ label: p.label, value })));
    data.path = path; data.notes = [];

    if (path === 'collaborate') {
      await say('Wonderful. We partner with schools, businesses, faith groups, and community organizations to open doors for young people and adults in Brockton.', 'What organization are you with?');
      const org = await ask({ placeholder: 'Organization name', optional: true });
      if (org) data.notes.push('Organization: ' + org);
      await say('What kind of collaboration do you have in mind?');
      const kind = await choose([{ label: 'Event partnership', value: 'Event partnership' }, { label: 'Program or workshop', value: 'Program or workshop' }, { label: 'Sponsorship', value: 'Sponsorship' }, { label: 'Something else', value: 'Something else' }]);
      data.notes.push('Collaboration type: ' + kind);
    }

    if (path === 'donate') {
      await say('Thank you! Every gift helps BTR support youth mentorship and community programs.', 'You can give securely through PayPal right now.');
      const next = await choose([{ label: 'Donate with PayPal ↗', href: PAYPAL, primary: true }, { label: 'Learn about sponsorship', value: 'sponsor' }, { label: 'Have someone contact me', value: 'contact' }, { label: 'That’s all, thanks', value: 'done' }]);
      if (next === 'sponsor') { await say('Our sponsorship levels run from Bronze to Diamond. Opening the sponsorship page for you…'); await wait(900); location.href = 'sponsor.html'; return; }
      if (next === 'done') { await say('Thank you for supporting BTR! You can find the Donate button at the top of any page anytime.'); return end(); }
      data.notes.push('Asked to be contacted about giving');
    }

    if (path === 'mentor') {
      await say('Mentors make a real difference. BTR mentors support young people through our T.A.R.G.E.T.S. program and men’s and women’s meetings.', 'What would you like to help with? For example: career guidance, academics, life skills, or sports.');
      const areas = await ask({ placeholder: 'Areas you could help with', optional: true, multiline: true });
      if (areas) data.notes.push('Mentoring interests: ' + areas);
    }

    if (path === 'targets') {
      await say('T.A.R.G.E.T.S. (Tenacity Allows Reaching Goals Even Through Struggles) is BTR’s mentorship program for young men and women. It helps them set goals, build confidence, and handle setbacks through mentoring, group discussions, and practical workshops.', 'Who is the program for?');
      const who = await choose([{ label: 'My child or a young person I care for', value: 'parent' }, { label: 'Myself', value: 'self' }, { label: 'My school or organization', value: 'org' }]);
      if (who === 'parent') {
        data.notes.push('Inquiring as: parent/guardian or caregiver');
        await say('Is the program for a young man or a young woman?');
        const g = await choose([{ label: 'Young man (boys’ program)', value: 'Boys’ program' }, { label: 'Young woman (girls’ program)', value: 'Girls’ program' }, { label: 'More than one / not sure', value: 'Not sure / more than one' }]);
        data.notes.push('Program: ' + g);
        await say('What grade are they in? (optional)');
        const grade = await ask({ placeholder: 'Grade, e.g. 8th', optional: true });
        if (grade) data.notes.push('Grade: ' + grade);
      } else if (who === 'self') {
        data.notes.push('Inquiring as: young person (self)');
        await say('Awesome, we’d love to meet you! If you’re under 18, please ask a parent or guardian to fill this out with you.');
      } else {
        data.notes.push('Inquiring as: school or organization');
        await say('What school or organization are you with?');
        const org = await ask({ placeholder: 'School or organization', optional: true });
        if (org) data.notes.push('Organization: ' + org);
      }
      await say('Ready to enroll? You can fill out the T.A.R.G.E.T.S. intake & consent form now, or leave your contact details and the BTR team will reach out.');
      const nx = await choose([{ label: 'Open the intake form', value: 'intake' }, { label: 'Have someone contact me', value: 'contact' }]);
      if (nx === 'intake') { await say('Opening the T.A.R.G.E.T.S. intake form…'); await wait(800); location.href = 'intake.html'; return; }
    }

    if (path === 'involved') {
      await say('We love that! Which of these sounds most interesting?');
      const pick = await choose([{ label: 'Volunteering at events', value: 'Volunteering at events' }, { label: 'Men’s or women’s meetings', value: 'Men’s or women’s meetings' }, { label: 'Youth programs (T.A.R.G.E.T.S.)', value: 'Youth programs (T.A.R.G.E.T.S.)' }, { label: 'Not sure yet', value: 'Not sure yet' }]);
      data.notes.push('Interested in: ' + pick);
    }

    await say('Great. Let’s get your contact details so the BTR team can follow up.', 'What’s your first name?');
    data.firstName = await ask({ placeholder: 'First name' });
    await say(`Thanks, ${data.firstName}! And your last name?`);
    data.lastName = await ask({ placeholder: 'Last name' });
    await say('What’s the best email to reach you?');
    data.email = await ask({ placeholder: 'name@example.com', validate: emailOk });
    await say('A phone number? (optional)');
    data.phone = await ask({ placeholder: 'Phone number', optional: true, validate: phoneOk });
    await say('Anything else you’d like us to know? (optional)');
    const extra = await ask({ placeholder: 'Your message', optional: true, multiline: true });
    if (extra) data.notes.push('Message: ' + extra);

    await say(`Here’s what I’ll send to the BTR team:\n\n• ${PATHS[path].label}\n• ${data.firstName} ${data.lastName}\n• ${data.email}${data.phone ? '\n• ' + data.phone : ''}${data.notes.length ? '\n• ' + data.notes.join('\n• ') : ''}`);
    for (;;) {
      const ok = await choose([{ label: 'Send it', value: 'send', primary: true }, { label: 'Start over', value: 'restart' }]);
      if (ok === 'restart') { log.innerHTML = ''; return run(); }
      if (await submit(path)) {
        await say(`Thank you, ${data.firstName}! Your information was sent to the BTR team, and someone will be in touch soon.`);
        if (path === 'mentor' || path === 'involved' || path === 'targets') await say('In the meantime, check out our upcoming events.');
        return end(true);
      }
      await say('Sorry, I couldn’t send that right now. Please try again, or email info@breakingthroughroadblocks.org.');
    }
  }

  async function submit(path) {
    const body = new FormData();
    body.append('formType', 'contact');
    body.append('firstName', data.firstName); body.append('lastName', data.lastName);
    body.append('email', data.email); body.append('phone', data.phone || '');
    body.append('interest', PATHS[path].interest);
    body.append('comments', `[Via website assistant] [Interest: ${PATHS[path].interest}]` + (data.notes.length ? '\n\n' + data.notes.join('\n') : '') + `\n\nPage: ${location.pathname}`);
    body.append('website', '');
    const t = document.createElement('div'); t.className = 'ag-typing'; t.textContent = 'Sending…'; log.appendChild(t); scroll();
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 20000);
      const r = await fetch(ENDPOINT, { method: 'POST', body, credentials: 'omit', headers: { Accept: 'application/json' }, signal: ctrl.signal });
      clearTimeout(timer);
      const j = await r.json().catch(() => null);
      return !!(r.ok && j && j.ok);
    } catch { return false; } finally { t.remove(); }
  }

  async function end(sent) {
    const links = [{ label: 'See upcoming events', href: 'events.html' }, { label: 'Start a new conversation', value: 'restart' }];
    const v = await choose(links);
    if (v === 'restart') { log.innerHTML = ''; run(); }
  }

  function open() {
    launch.hidden = true; panel.hidden = false; showErr('');
    if (!started) { started = true; run(); } else (panel.querySelector('.ag-choices button, .ag-choices a') || input).focus();
  }
  function close() { panel.hidden = true; launch.hidden = false; launch.focus(); }
  launch.addEventListener('click', open);
  $('.ag-x').addEventListener('click', close);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  // Links like <a href="#get-involved" data-open-agent> can open the assistant.
  document.addEventListener('click', e => { const a = e.target.closest('[data-open-agent]'); if (a) { e.preventDefault(); open(); } });
  if (new URLSearchParams(location.search).has('assistant')) open();
})();
