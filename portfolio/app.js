'use strict';
document.documentElement.classList.add('js');
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  let preference = true;
  try { preference = localStorage.getItem('dale-portfolio-motion') !== 'off'; } catch {}
  const status = document.getElementById('live-status');
  function announce(message) { if (status) status.textContent = message; }
  function motionEnabled() { return preference && !reduced.matches; }
  function applyMotion() {
    const on = motionEnabled();
    root.dataset.motion = on ? 'on' : 'off';
    document.querySelectorAll('[data-motion-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(on));
      button.querySelector('[data-motion-label]').textContent = reduced.matches ? 'Reduced motion' : on ? 'Motion on' : 'Motion off';
      button.setAttribute('aria-label', reduced.matches ? 'Reduced motion follows your system setting' : 'Decorative motion');
    });
    if (!on) document.querySelectorAll('[data-tilt]').forEach(card => { card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); });
    document.dispatchEvent(new CustomEvent('portfolio:motion', {detail: {enabled:on}}));
  }
  document.querySelectorAll('[data-motion-toggle]').forEach(button => button.addEventListener('click', () => {
    if (reduced.matches) { announce('Reduced motion is enabled in your system settings. Decorative motion stays off.'); return; }
    preference = !preference;
    try { localStorage.setItem('dale-portfolio-motion', preference ? 'on' : 'off'); } catch {}
    applyMotion();
    announce(preference ? 'Decorative motion on.' : 'Decorative motion paused.');
  }));
  reduced.addEventListener('change', applyMotion);
  applyMotion();
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  function closeMenu(returnFocus=false) {
    if (!menu) return;
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open navigation');
    if (returnFocus) menu.focus();
  }
  menu?.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    menu.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('is-open', expanded);
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav?.classList.contains('is-open')) closeMenu(true); });
  document.addEventListener('click', event => { if (nav?.classList.contains('is-open') && !event.target.closest('.site-header')) closeMenu(); });
  matchMedia('(min-width:561px)').addEventListener('change', () => closeMenu());

  const cards = [...document.querySelectorAll('[data-category]')];
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
    let count = 0;
    cards.forEach(card => { card.hidden = filter !== 'all' && !card.dataset.category.split(' ').includes(filter); if (!card.hidden) count++; });
    document.getElementById('filter-status').textContent = `Showing ${count} ${count === 1 ? 'project' : 'projects'}${filter === 'all' ? '' : ' in ' + filter}.`;
  }));
  document.querySelectorAll('[data-tilt]').forEach(card => {
    let frame = 0;
    card.addEventListener('pointermove', event => {
      if (!motionEnabled() || !fine.matches || event.pointerType === 'touch') return;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--tilt-x', `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 4}deg`);
        card.style.setProperty('--tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 5}deg`);
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y');
    });
  });

  document.querySelector('[data-copy-email]')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    try { await navigator.clipboard.writeText('daleapittman@gmail.com'); button.textContent = 'Email address copied ✓'; announce('Email address copied.'); }
    catch { button.textContent = 'daleapittman@gmail.com'; announce('Copy this address: daleapittman@gmail.com'); }
  });
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const subject = `${values.get('type')} — ${String(values.get('name')).trim()}`;
    const body = `Hi Dale,\n\n${String(values.get('message')).trim()}\n\n${String(values.get('name')).trim()}\n${values.get('email')}`;
    const url = `mailto:daleapittman@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const result = document.getElementById('form-status');
    result.replaceChildren(document.createTextNode('Your draft is ready. Review and send it in your email app. If it didn’t open, '));
    const fallback = document.createElement('a');
    fallback.href = url; fallback.textContent = 'open the email draft'; fallback.style.textDecoration = 'underline';
    result.append(fallback, document.createTextNode('.'));
    location.href = url;
  });
  const specimen = document.querySelector('[data-specimen]');
  function playSpecimen() {
    if (!specimen) return;
    specimen.classList.remove('playing');
    if (!motionEnabled()) { announce('The study is shown still because decorative motion is off.'); return; }
    void specimen.offsetWidth;
    specimen.classList.add('playing');
  }
  document.querySelectorAll('button[data-pace]').forEach(button => button.addEventListener('click', () => {
    specimen.dataset.pace = button.dataset.pace;
    document.querySelectorAll('button[data-pace]').forEach(b => b.setAttribute('aria-pressed',String(button === b)));
    playSpecimen();
    announce(`${button.textContent} rhythm selected.`);
  }));
  document.querySelector('[data-replay]')?.addEventListener('click', playSpecimen);
  document.addEventListener('portfolio:motion', event => { if (!event.detail.enabled) specimen?.classList.remove('playing'); });
  if (specimen && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { playSpecimen(); observer.disconnect(); } },{threshold:.4});
    observer.observe(specimen);
  }
  document.querySelectorAll('button[data-format]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.social-composition').dataset.format = button.dataset.format;
    document.querySelectorAll('button[data-format]').forEach(b => b.setAttribute('aria-pressed', String(button === b)));
    announce(`${button.textContent.trim()} format selected.`);
  }));
})();
