import gsap from 'gsap';
import { REDUCED_MOTION } from './PointerInteraction';

/**
 * Lightweight DOM effects: shockwave + organic ripple + tiny particle burst.
 * Temporary nodes only, always cleaned up. No permanent layers.
 */

export function createShockwave(x: number, y: number, size = 1) {
  if (REDUCED_MOTION) return;
  const el = document.createElement('div');
  el.className = 'click-shockwave';
  el.style.transform = `translate(${x}px, ${y}px) scale(0.2)`;
  document.body.appendChild(el);
  // 0ms point -> 40ms expand -> 120ms peak -> 280ms fade
  gsap.timeline({ onComplete: () => el.remove() })
    .to(el, {
      transform: `translate(${x}px, ${y}px) scale(${3 * size})`,
      opacity: 0.7,
      duration: 0.12,
      ease: 'power2.out',
    })
    .to(el, {
      transform: `translate(${x}px, ${y}px) scale(${7 * size})`,
      opacity: 0,
      duration: 0.16,
      ease: 'power1.out',
    });
}

export function createRipple(host: HTMLElement, x: number, y: number, boost = 0) {
  if (REDUCED_MOTION) return;
  const rect = host.getBoundingClientRect();
  const maxDim = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'click-ripple';
  const size = maxDim * (0.7 + Math.min(boost, 0.5));
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x - rect.left}px`;
  ripple.style.top = `${y - rect.top}px`;
  host.appendChild(ripple);
  gsap.timeline({ onComplete: () => ripple.remove() })
    .fromTo(ripple,
      { xPercent: -50, yPercent: -50, scale: 0, opacity: 0.9 },
      { xPercent: -50, yPercent: -50, scale: 1, opacity: 0.9, duration: 0.16, ease: 'power2.out' })
    .to(ripple, {
      xPercent: -50,
      yPercent: -50,
      scale: 1.6,
      opacity: 0,
      duration: 0.3,
      ease: 'power1.out',
    });
}

/** Tiny burst for MAJOR elements only (download / hero CTA). 5-12 particles. */
export function createBurst(x: number, y: number, count = 10, boost = 0) {
  if (REDUCED_MOTION) return;
  const n = Math.max(5, Math.min(20, count));
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'click-particle';
    const size = 3 + Math.random() * 2.5;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
    p.style.background = Math.random() > 0.4 ? '#d7ff00' : '#ffffff';
    p.style.transform = `translate(${x}px, ${y}px)`;
    document.body.appendChild(p);
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const dist = (26 + Math.random() * 38) * (1 + Math.min(boost, 0.5));
    gsap.to(p, {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      opacity: 0,
      duration: 0.4 + Math.random() * 0.2,
      ease: 'power3.out', // fast deceleration, short life
      overwrite: 'auto',
      onComplete: () => p.remove(),
    });
  }
}
