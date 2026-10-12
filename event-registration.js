(() => {
  const form = document.getElementById('eventForm');
  const status = document.getElementById('eventStatus');
  const submit = document.getElementById('eventSubmit');
  const say = (message, error = false) => {status.textContent = message; status.classList.toggle('is-error', error);};
  const eventSelect = form.elements.event;
  const eventHint = document.getElementById('eventHint');
  const today = new Date().toLocaleDateString('en-CA');
  for (const option of [...eventSelect.options]) if (option.dataset.date && option.dataset.date < today) option.remove();
  const requested = new URLSearchParams(location.search).get('event');
  const match = [...eventSelect.options].find(option => option.dataset.slug && option.dataset.slug === requested);
  if (match) eventSelect.value = match.value;
  const updateHint = () => {eventHint.hidden = eventSelect.selectedOptions[0]?.dataset.slug !== 'gala';};
  eventSelect.addEventListener('change', updateHint);
  updateHint();
  const phone = form.elements.phone;
  phone.addEventListener('input', () => phone.setCustomValidity((phone.value.match(/\d/g) || []).length >= 7 || !phone.value ? '' : 'Enter a valid phone number.'));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    for (const el of form.querySelectorAll('input:not([type="hidden"])')) el.value = el.value.trim();
    phone.dispatchEvent(new Event('input'));
    if (!form.checkValidity()) {say('Please complete the required fields.', true); form.reportValidity(); return;}
    submit.disabled = true;
    say('Sending your registration…');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(form.action, {method:'POST', body:new FormData(form), headers:{Accept:'application/json'}, credentials:'omit', signal:controller.signal});
      let result = null;
      try {result = await response.json();} catch {}
      if (!response.ok || !result || !result.ok) throw new Error(result && result.message ? result.message : 'Registration could not be sent.');
      form.reset();
      updateHint();
      say(result.message || 'Thank you for registering! We look forward to seeing you.');
    } catch (error) {
      say((error.name === 'AbortError' || error instanceof TypeError ? 'We couldn’t reach the registration service.' : error.message) + ' Please try again, or email info@breakingthroughroadblocks.org.', true);
    } finally {clearTimeout(timer); submit.disabled = false;}
  });
})();
