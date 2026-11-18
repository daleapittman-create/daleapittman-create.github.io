'use strict';

(() => {
  const form = document.getElementById('service-intake');
  const offerSelect = document.getElementById('service-offer');
  const offerNote = document.getElementById('selected-offer-note');
  const result = document.getElementById('service-form-status');
  if (!form || !offerSelect || !offerNote || !result) return;

  const offers = {
    campaign: {
      title: 'Holiday / New Year Campaign Kit — $650',
      terms: 'The full $650 is due upfront once we agree on the brief and start date.',
      request: 'I’m interested in the $650 Holiday / New Year Campaign Kit, paid in full upfront after we agree on the scope and start date. I’d like one visual direction, three designs in three agreed sizes each (nine static exports), and two consolidated revision rounds.'
    },
    monthly: {
      title: 'Monthly Content Partner — $500 introductory month',
      terms: 'Introductory month: $500 upfront for up to 10 total service hours, including setup and revisions. Continuing at $1,000/month requires explicit agreement; no automatic price increase.',
      request: 'I’m interested in the $500 introductory month of Monthly Content Partner support, with up to 10 total service hours including setup, production, and revisions. I understand any continuation at $1,000/month would require a separate explicit agreement.'
    },
    question: {
      title: 'Choosing a creative project starting point',
      terms: 'We’ll choose a suitable starting point and agree the scope, timing, and payment arrangements before work begins.',
      request: 'I’d like help choosing the right starting point for my project.'
    }
  };

  function updateOffer() {
    const offer = offers[offerSelect.value] || offers.question;
    offerNote.textContent = offer.terms;
    result.replaceChildren();
  }

  document.querySelectorAll('.offer-intake-link[data-offer]').forEach(link => {
    link.addEventListener('click', () => {
      if (offers[link.dataset.offer]) {
        offerSelect.value = link.dataset.offer;
        updateOffer();
      }
    });
  });
  offerSelect.addEventListener('change', updateOffer);

  // Service payment URLs are deliberately null until independently verified.
  // These are separate from the $49/$19/$9 self-serve Gumroad downloads.
  // Do not populate a monthly URL with a checkout that excludes ongoing services.
  try {
    const config = JSON.parse(document.getElementById('service-payment-config')?.textContent || '{}');
    for (const [offer, key] of [['campaign', 'campaignKitUrl'], ['monthly', 'partnerIntroMonthUrl']]) {
      if (typeof config[key] !== 'string' || !config[key].trim()) continue;
      const url = new URL(config[key]);
      if (url.protocol !== 'https:') continue;
      const link = document.querySelector(`[data-payment-link="${offer}"]`);
      if (link) { link.href = url.href; link.hidden = false; }
    }
  } catch {
    // Intake remains functional when payment configuration is absent or invalid.
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const offer = offers[String(fields.get('offer'))] || offers.question;
    const name = String(fields.get('name') || '').trim();
    const email = String(fields.get('email') || '').trim();
    const brief = String(fields.get('brief') || '').trim();
    const deadline = String(fields.get('deadline') || '').trim();
    const subject = `${offer.title} — ${name}`;
    const body = `Hi Dale,\n\n${offer.request}\n\nWHAT I’M WORKING ON\n${brief}\n\nDEADLINE / IDEAL START\n${deadline || 'To discuss'}\n\nPlease let me know the confirmed scope, availability, and next steps before payment.\n\n${name}\n${email}`;
    const mailto = `mailto:daleapittman@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    result.replaceChildren(document.createTextNode('Your request is ready. Review and send it in your email app. If the app didn’t open, '));
    const fallback = document.createElement('a');
    fallback.href = mailto;
    fallback.textContent = 'open the prepared email';
    result.append(fallback, document.createTextNode('. No request has been sent by this page.'));
    window.location.href = mailto;
  });
  updateOffer();
})();
