import gsap from 'gsap';

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initTextAnimations() {
  if (REDUCED) {
    // Keep content visible, no motion
    gsap.set('.hero-word, .hero-sub, .hero-metric-pill, .hero-actions, .hero-badge, .aerospace-reticle', {
      clearProps: 'all',
    });
    return;
  }

  // ── Cinematic hero entrance: badge -> words -> sub -> actions -> metrics ──
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  tl.fromTo(
    '.hero-badge',
    { opacity: 0, y: 18, filter: 'blur(6px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7 },
    0.35
  )
    .fromTo(
      '.hero-word',
      { opacity: 0, y: 70, rotateX: -35, filter: 'blur(12px)' },
      { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', duration: 1.25, stagger: 0.09 },
      0.45
    )
    .fromTo(
      '.hero-sub',
      { opacity: 0, y: 32, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0 },
      0.95
    )
    .fromTo(
      '.hero-actions',
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out' },
      1.1
    )
    .fromTo(
      '.hero-metric-pill',
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' },
      1.2
    )
    // 3D stage reticle scales in like a lens focusing
    .fromTo(
      '.aerospace-reticle',
      { opacity: 0, scale: 0.92, filter: 'blur(6px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'expo.out' },
      0.7
    );
}
