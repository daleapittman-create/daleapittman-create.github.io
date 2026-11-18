'use strict';

(() => {
  const form = document.getElementById('service-intake');
  const offerSelect = document.getElementById('service-offer');
  const offerNote = document.getElementById('selected-offer-note');
  const result = document.getElementById('service-form-status');
  if (!form || !offerSelect || !offerNote || !result) return;

  const offers = {
    campaign: {
      title: 'Holiday & New Year Campaign Kit — $650',
      terms: 'The $650 kit is paid upfront after we agree on scope and start date.',
      request: 'I’d like to book the $650 campaign kit.'
    },
    monthly: {
      title: 'Social Media and Ad Support — Discovery',
      terms: '$500 discovery deposit. Ongoing support is $1,000/month by agreement.',
      request: 'I’m interested in discovery for Social Media and Ad Support. Please confirm the scope and start date for the $500 deposit.'
    },
    question: {
      title: 'Creative project inquiry',
      terms: 'I’ll confirm scope and timing by email.',
      request: 'I’d like to discuss a creative project.'
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

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const offer = offers[String(fields.get('offer'))] || offers.question;
    const name = String(fields.get('name') || '').trim();
    const email = String(fields.get('email') || '').trim();
    const brief = String(fields.get('brief') || '').trim();
    const subject = `${offer.title} — ${name}`;
    const body = `Hi Dale,\n\n${offer.request}\n\n${brief}\n\nPlease let me know the confirmed scope, availability, and next steps before payment.\n\n${name}\n${email}`;
    const mailto = `mailto:daleapittman@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    result.replaceChildren(document.createTextNode('Your request is ready. Review and send it in your email app. If the app didn’t open, '));
    const fallback = document.createElement('a');
    fallback.href = mailto;
    fallback.textContent = 'open the prepared email';
    result.append(fallback, document.createTextNode('.'));
    window.location.href = mailto;
  });
  updateOffer();
})();

(() => {
  const controls = document.querySelector('.studio-switch');
  if (!controls) return;
  const buttons = [...controls.querySelectorAll('[data-studio-view]')];
  controls.hidden = false;
  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const view of buttons) {
        const selected = view === button;
        view.setAttribute('aria-pressed', String(selected));
        document.getElementById(view.getAttribute('aria-controls')).hidden = !selected;
      }
    });
  }
})();
