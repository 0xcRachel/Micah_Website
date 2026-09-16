import gsap from 'gsap';
import { FINE_POINTER, REDUCED_MOTION } from './PointerInteraction';

const SELECTOR = '.btn-magnetic.btn-primary-signal, [data-magnetic]';
let initialized = false;

/** Magnetic pull for primary CTAs only. Yields instantly to press state. */
export function initMagnetic() {
  if (initialized || !FINE_POINTER || REDUCED_MOTION) return;
  initialized = true;

  const els = () => Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));

  document.addEventListener('pointermove', (e) => {
    for (const el of els()) {
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left - 24 && e.clientX <= rect.right + 24 &&
        e.clientY >= rect.top - 24 && e.clientY <= rect.bottom + 24;
      if (!inside) continue;
      if (el.dataset.pressed === '1') continue; // press owns the transform
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      gsap.to(el, {
        x: dx * 0.08,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  }, { passive: true });

  document.addEventListener('pointerout', (e) => {
    const el = e.target instanceof Element ? e.target.closest<HTMLElement>(SELECTOR) : null;
    if (!el) return;
    if (el.dataset.pressed === '1') return;
    gsap.to(el, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
  });
}
