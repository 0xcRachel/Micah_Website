import gsap from 'gsap';

export function initTextAnimations() {
  // Hero headline editorial word reveal
  const heroWords = document.querySelectorAll('.hero-word');
  if (heroWords.length > 0) {
    gsap.fromTo(
      heroWords,
      {
        opacity: 0,
        y: 60,
        rotateX: -30,
        filter: 'blur(10px)'
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        filter: 'blur(0px)',
        duration: 1.2,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.4
      }
    );
  }

  // Supporting subtitle fade with blur clearance
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    gsap.fromTo(
      heroSub,
      { opacity: 0, y: 30, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out', delay: 0.9 }
    );
  }

  // Metric pills stagger
  const metricPills = document.querySelectorAll('.hero-metric-pill');
  if (metricPills.length > 0) {
    gsap.fromTo(
      metricPills,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out', delay: 1.1 }
    );
  }
}
