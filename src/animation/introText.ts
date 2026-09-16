import gsap from 'gsap';

// ─── introText \u2014 GSAP typographic reveal for MICAH 0xC ────────────────────────
// Each character arrives from Z-depth space, settling with precision stagger.
export function revealIntroTitle(onComplete?: () => void) {
  const chars = document.querySelectorAll('.intro-char');
  if (!chars.length) return;

  // Characters already styled in CSS: opacity:0, translateY:48px, rotateX:18deg, blur:6px
  gsap.to(chars, {
    opacity:        1,
    y:              0,
    rotationX:      0,
    filter:         'blur(0px)',
    letterSpacing:  '-0.02em',
    duration:       1.05,
    ease:           'power3.out',
    stagger: {
      each:   0.06,
      from:   'start',
      ease:   'power2.out',
    },
    onComplete,
    clearProps: 'filter',
  });
}

export function revealIntroTagline(onComplete?: () => void) {
  const tagline = document.querySelector('.intro-tagline') as HTMLElement;
  if (!tagline) return;

  gsap.to(tagline, {
    opacity:  1,
    y:        0,
    duration: 1.0,
    ease:     'power2.out',
    onComplete,
  });
}

export function revealLimeSignal() {
  const signal = document.querySelector('.intro-lime-signal') as HTMLElement;
  if (!signal) return;

  gsap.to(signal, {
    opacity:  1,
    duration: 0.55,
    ease:     'power2.out',
  });
}

export function revealCornerLabel() {
  const corner = document.querySelector('.intro-corner') as HTMLElement;
  if (!corner) return;

  const state = corner.querySelector('.intro-corner-state') as HTMLElement;

  gsap.to(corner, { opacity: 1, duration: 0.5, ease: 'power1.out' });

  // Cycle the state text
  const states = ['INITIALIZING', 'LOADING ASSETS', 'CALIBRATING SHADERS', 'SYSTEM READY'];
  let idx = 0;
  const interval = setInterval(() => {
    idx++;
    if (idx >= states.length || !state) { clearInterval(interval); return; }
    gsap.fromTo(state, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power1.out' });
    state.textContent = states[idx];
  }, 650);
}

export function hideCornerLabel() {
  const corner = document.querySelector('.intro-corner') as HTMLElement;
  if (!corner) return;
  gsap.to(corner, { opacity: 0, duration: 0.4, ease: 'power1.in' });
}

export function revealHairlines() {
  const hairlines = document.querySelectorAll('.intro-hairline');
  gsap.to(hairlines, {
    opacity:  1,
    duration: 1.2,
    stagger:  0.18,
    ease:     'power1.out',
  });
}

export function hideCurtain(onComplete?: () => void) {
  const curtain = document.getElementById('intro-curtain');
  if (!curtain) { onComplete?.(); return; }

  gsap.to(curtain, {
    scaleY:   0,
    duration: 1.1,
    ease:     'power3.inOut',
    transformOrigin: 'top center',
    onComplete,
  });
}