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
      const response = await fetch(form.action, {method:'POST', body:new FormData(form), headers:{Accept:'application/json'}, credentials:'omit', signal:controller.signal});
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

// Prefill the message when arriving from the Support menu
(() => {
  const box = document.getElementById('comments');
  if (!box || box.value) return;
  const msgs = {
    mentor: "I'm interested in becoming a mentor with BTR. Please tell me how to get started.",
    involved: "I just want to get involved with BTR. Please let me know how I can help."
  };
  const pick = msgs[new URLSearchParams(location.search).get('interest')];
  if (pick) box.value = pick;
})();
