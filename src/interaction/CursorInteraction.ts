import gsap from 'gsap';
import { FINE_POINTER, REDUCED_MOTION } from './PointerInteraction';

let initialized = false;

/** Desktop-only custom cursor: dot + ring, velocity-aware, morphs on big CTAs. */
export function initCursor() {
  if (initialized || !FINE_POINTER) return;
  initialized = true;

  const dot = document.createElement('div');
  dot.id = 'custom-cursor-dot';
  const ring = document.createElement('div');
  ring.id = 'custom-cursor-ring';
  const label = document.createElement('span');
  label.className = 'cursor-label';
  ring.appendChild(label);
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  // Native cursor is hidden via .has-custom-cursor (CSS) so the two never overlap
  document.documentElement.classList.add('has-custom-cursor');
  // Keep both invisible until the first real pointermove (avoids corner flash)
  gsap.set([dot, ring], { opacity: 0 });
  let shown = false;

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power2.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.28, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.28, ease: 'power3.out' });

  let lastX = -1;
  let lastY = -1;

  window.addEventListener('pointermove', (e) => {
    if (!shown) {
      shown = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.25, ease: 'power1.out', overwrite: 'auto' });
    }
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
    lastX = e.clientX;
    lastY = e.clientY;
  }, { passive: true });

  const isInteractive = (t: EventTarget | null) =>
    t instanceof Element && !!t.closest('a, button, [data-click], input[type="range"]');

  document.addEventListener('pointerover', (e) => {
    const el = e.target instanceof Element ? e.target.closest('[data-cursor-label]') : null;
    if (el && !REDUCED_MOTION) {
      label.textContent = el.getAttribute('data-cursor-label') || '';
      ring.classList.add('has-label');
    } else {
      ring.classList.remove('has-label');
      label.textContent = '';
    }
    gsap.to(ring, {
      scale: isInteractive(e.target) ? 1.5 : 1,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  });

  document.addEventListener('pointerdown', () => {
    gsap.to(ring, { scale: 0.8, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
  });

  document.addEventListener('pointerup', () => {
    gsap.to(ring, {
      scale: lastX >= 0 && isInteractive(document.elementFromPoint(lastX, lastY)) ? 1.5 : 1,
      duration: REDUCED_MOTION ? 0.12 : 0.45,
      ease: REDUCED_MOTION ? 'power2.out' : 'elastic.out(1, 0.5)',
      overwrite: 'auto',
    });
  });
}
