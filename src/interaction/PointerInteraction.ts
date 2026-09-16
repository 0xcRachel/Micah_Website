import gsap from 'gsap';

export const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const FINE_POINTER =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Press down: 1 -> 0.96 + 1-2px. Fast + tactile (80-120ms). */
export function pressDown(el: HTMLElement) {
  gsap.killTweensOf(el, 'scale,y');
  gsap.to(el, {
    scale: 0.96,
    y: 2,
    duration: 0.1,
    ease: 'power2.out',
    overwrite: 'auto',
  });
}

/** Release: 0.96 -> 1.012 -> 1, settles fast with minimal overshoot. */
export function pressUp(el: HTMLElement) {
  gsap.killTweensOf(el, 'scale,y');
  if (REDUCED_MOTION) {
    gsap.to(el, { scale: 1, y: 0, duration: 0.12, ease: 'power2.out', overwrite: 'auto' });
    return;
  }
  const tl = gsap.timeline();
  tl.to(el, { scale: 1.012, y: 0, duration: 0.09, ease: 'expo.out', overwrite: 'auto' }).to(el, {
    scale: 1,
    y: 0,
    duration: 0.3,
    ease: 'elastic.out(1, 0.6)',
  });
}

/** Subtle button text shift (-4px out, masked re-entry). Major CTAs only. */
export function nudgeButtonText(el: HTMLElement) {
  if (REDUCED_MOTION) return;
  const span = el.querySelector('span:not(.click-ripple)');
  if (!span) return;
  gsap.killTweensOf(span);
  gsap.timeline()
    .to(span, { y: -4, duration: 0.09, ease: 'power2.out' })
    .to(span, { y: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
}

/** Arrow personality: travel farther on click, elastic settle. */
export function nudgeArrow(el: HTMLElement) {
  if (REDUCED_MOTION) return;
  const svg = el.querySelector('svg');
  if (!svg) return;
  gsap.killTweensOf(svg);
  gsap.timeline()
    .to(svg, { x: 5, y: -1, duration: 0.1, ease: 'power2.out' })
    .to(svg, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
}
