(() => {
  'use strict';
  const carousel = document.querySelector('[data-service-hero]');
  if (!carousel) return;
  const slides = Array.from(carousel.querySelectorAll('[data-service-slide]'));
  const counter = carousel.querySelector('[data-service-slide-status]');
  const controls = carousel.querySelector('[data-service-controls]');
  if (!counter || !controls || slides.length < 2) return;
  let index = 0;
  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    counter.textContent = `${index + 1} / ${slides.length} · ${slides[index].dataset.title}`;
  };
  controls.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-step]');
    if (button) show(index + Number(button.dataset.step));
  });
  controls.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(index + (event.key === 'ArrowLeft' ? -1 : 1));
  });
  controls.hidden = false;
  show(0);
})();
