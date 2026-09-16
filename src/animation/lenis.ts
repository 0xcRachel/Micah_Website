import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

const REDUCED = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initSmoothScroll(): Lenis {
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.8,
  });

  lenisInstance = lenis;

  // Strict integration as required in spec
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // ── Scroll progress hairline + velocity feed for the 3D world ──
  const progressBar = document.getElementById('scroll-progress-fill');
  let targetSkew = 0;
  let currentSkew = 0;
  let titleEls: HTMLElement[] = [];

  if (!REDUCED()) {
    titleEls = Array.from(document.querySelectorAll<HTMLElement>('.anim-title, .hero-headline'));
  }

  lenis.on('scroll', (e: { scroll?: number; limit?: number; velocity?: number }) => {
    // Top progress hairline (transform-only, cheap)
    if (progressBar && typeof e.scroll === 'number' && typeof e.limit === 'number' && e.limit > 0) {
      const p = Math.max(0, Math.min(1, e.scroll / e.limit));
      progressBar.style.transform = `scaleX(${p})`;
    }

    const v = typeof e.velocity === 'number' ? e.velocity : 0;
    // Feed the WebGL world (throttled by magnitude, listeners are cheap)
    if (Math.abs(v) > 0.4 && !REDUCED()) {
      window.dispatchEvent(new CustomEvent('scrollBoost', { detail: { velocity: v } }));
      targetSkew = gsap.utils.clamp(-3, 3, v * -0.35);
    } else {
      targetSkew = 0;
    }
  });

  // Velocity skew on editorial titles — lerped back to 0 every tick (alche feel)
  if (!REDUCED()) {
    gsap.ticker.add(() => {
      currentSkew += (targetSkew - currentSkew) * 0.12;
      if (Math.abs(currentSkew) < 0.01) {
        if (titleEls.length && titleEls[0].style.transform.includes('skew')) {
          gsap.set(titleEls, { skewY: 0 });
        }
        return;
      }
      if (titleEls.length) gsap.set(titleEls, { skewY: currentSkew });
    });
  }

  // In-page anchor click navigation support (offset for fixed 80px header)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId && targetId.length > 1) {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl as HTMLElement, {
            duration: 1.6,
            easing: (t: number) => 1 - Math.pow(2, -10 * t),
            offset: -70,
          });
        }
      }
    });
  });

  return lenis;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}
