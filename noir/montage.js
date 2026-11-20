(() => {
  'use strict';

  const hero = document.querySelector('[data-montage]');
  const toggle = hero.querySelector('.montage-toggle');
  const label = toggle.querySelector('.montage-label');
  let picture = hero.querySelector('.cover-art');

  // Alternate graphic silhouettes from across the three study categories.
  const studies = [
    'sphere', 'edmond', 'social-studio', 'van', 'midnight-current', 'skyquest',
    'bridge', 'fieldguide', 'cwc', 'motion-toolkit', 'odd-orbit', 'fse',
    'glow-orb', 'signage', 'motion-os', 'sphere-preview', 'sous', 'gogo-tour',
    'construct', 'portfolio-modes', 'corner-led', 'asset-index', 'creative-automation'
  ];
  const frameRate = 24;
  const holdFrames = [34, 21, 13, 8, 13, 21];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let visible = true;
  let sequence = 0;
  let timer;
  let generation = 0;

  function loadShot(study) {
    const image = new Image();
    image.className = 'cover-art';
    image.alt = '';
    image.decoding = 'async';
    image.src = '/noir/media/' + study + '/plate.svg';
    return image.decode().then(() => image, () => null);
  }

  function scheduleCut() {
    clearTimeout(timer);
    const current = ++generation;
    if (paused || !visible || document.hidden) return;
    const nextSequence = sequence + 1;
    const nextShot = loadShot(studies[nextSequence % studies.length]);
    const duration = holdFrames[sequence % holdFrames.length] * 1000 / frameRate;

    timer = setTimeout(async () => {
      const next = await nextShot;
      if (current !== generation) return;
      if (next) {
        picture.replaceWith(next);
        picture = next;
      }
      sequence = nextSequence;
      scheduleCut();
    }, duration);
  }

  function setPaused(value) {
    paused = value;
    label.textContent = paused ? 'Play montage' : 'Pause montage';
    toggle.toggleAttribute('data-paused', paused);
    scheduleCut();
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => setPaused(!paused));
  motion.addEventListener('change', event => setPaused(event.matches));
  document.addEventListener('visibilitychange', scheduleCut);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      scheduleCut();
    }).observe(hero);
  }
  setPaused(paused);
})();
