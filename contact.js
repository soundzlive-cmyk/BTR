(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const status = document.getElementById('contactStatus');
  const submit = document.getElementById('contactSubmit');
  const say = (message, error = false) => {status.textContent = message; status.classList.toggle('is-error', error);};
  const phone = form.elements.phone;
  phone.addEventListener('input', () => phone.setCustomValidity(!phone.value || (phone.value.match(/\d/g) || []).length >= 7 ? '' : 'Enter a valid phone number.'));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    for (const el of form.querySelectorAll('input[type="text"],input[type="email"],input[type="tel"],textarea')) el.value = el.value.trim();
    phone.dispatchEvent(new Event('input'));
    if (!form.checkValidity()) {say('Please complete the required fields.', true); form.reportValidity(); return;}
    submit.disabled = true;
    say('Sending your message…');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(form.action, {method:'POST', body:(() => {const d = new FormData(form); const i = form.elements.interest; if (i && i.value) d.set('comments', `[Interest: ${i.options[i.selectedIndex].text}]\n\n` + d.get('comments')); return d;})(), headers:{Accept:'application/json'}, credentials:'omit', signal:controller.signal});
      let result = null;
      try {result = await response.json();} catch {}
      if (!response.ok || !result || !result.ok) throw new Error(result && result.message ? result.message : 'Your message could not be sent.');
      form.reset();
      say(result.message || 'Thank you! Your message has been sent.');
    } catch (error) {
      say((error.name === 'AbortError' || error instanceof TypeError ? 'We couldn’t reach the message service.' : error.message) + ' Please try again, or email info@breakingthroughroadblocks.org.', true);
    } finally {clearTimeout(timer); submit.disabled = false;}
  });
})();

// Support menu links: preselect the dropdown and prefill the message
(() => {
  const box = document.getElementById('comments');
  const sel = document.getElementById('interest');
  if (!box || !sel) return;
  const msgs = {
    donate: "I'd like to make a donation to BTR. Please share the ways I can give.",
    sponsor: "I'm interested in becoming a BTR sponsor. Please send me sponsorship details.",
    mentor: "I'm interested in becoming a mentor with BTR. Please tell me how to get started.",
    involved: "I just want to get involved with BTR. Please let me know how I can help."
  };
  const fill = key => { if (!box.value.trim() || Object.values(msgs).includes(box.value)) box.value = msgs[key] || ''; };
  const req = new URLSearchParams(location.search).get('interest');
  if (req && msgs[req]) { sel.value = req; fill(req); }
  sel.addEventListener('change', () => fill(sel.value));
})();
