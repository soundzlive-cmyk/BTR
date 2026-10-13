(() => {
  const form = document.getElementById('signinForm');
  if (!form) return;
  const status = document.getElementById('signinStatus');
  const submit = document.getElementById('signinSubmit');
  const say = (message, error = false) => {status.textContent = message; status.classList.toggle('is-error', error);};
  const eventSelect = form.elements.event;
  const otherField = document.getElementById('otherEventField');
  const otherInput = form.elements.otherEvent;

  // Hide events that are already over; preselect today's event (or ?event=slug).
  const today = new Date().toLocaleDateString('en-CA');
  for (const option of [...eventSelect.options]) if (option.dataset.date && option.dataset.date < today) option.remove();
  const requested = new URLSearchParams(location.search).get('event');
  const match = [...eventSelect.options].find(o => o.dataset.slug && o.dataset.slug === requested)
    || [...eventSelect.options].find(o => o.dataset.date === today);
  if (match) eventSelect.value = match.value;

  const updateOther = () => {
    const isOther = eventSelect.value === 'Other';
    otherField.hidden = !isOther;
    otherInput.required = isOther;
    if (!isOther) otherInput.value = '';
  };
  eventSelect.addEventListener('change', updateOther);
  updateOther();

  const phone = form.elements.phone;
  phone.addEventListener('input', () => phone.setCustomValidity(!phone.value || (phone.value.match(/\d/g) || []).length >= 7 ? '' : 'Enter a valid phone number.'));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    for (const el of form.querySelectorAll('input[type="text"],input[type="email"],input[type="tel"],textarea')) el.value = el.value.trim();
    phone.dispatchEvent(new Event('input'));
    if (!form.checkValidity()) {say('Please complete the required fields.', true); form.reportValidity(); return;}
    submit.disabled = true;
    say('Signing you in…');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(form.action, {method:'POST', body:new FormData(form), headers:{Accept:'application/json'}, credentials:'omit', signal:controller.signal});
      let result = null;
      try {result = await response.json();} catch {}
      if (!response.ok || !result || !result.ok) throw new Error(result && result.message ? result.message : 'Your sign-in could not be sent.');
      const keep = eventSelect.value;
      form.reset();
      eventSelect.value = keep; // keep the event selected for the next guest
      updateOther();
      say(result.message || 'You’re signed in. Thank you for joining us!');
      form.elements.firstName.focus();
    } catch (error) {
      say((error.name === 'AbortError' || error instanceof TypeError ? 'We couldn’t reach the sign-in service.' : error.message) + ' Please try again, or let a BTR team member know you’re here.', true);
    } finally {clearTimeout(timer); submit.disabled = false;}
  });
})();
