import type { SceneManager } from '../three/SceneManager';
import { pressDown, pressUp, nudgeButtonText, nudgeArrow, REDUCED_MOTION } from './PointerInteraction';
import { createShockwave, createRipple, createBurst } from './ClickEffects';
import { WebGLInteraction, type ImpactLevel } from './WebGLInteraction';
import { initCursor } from './CursorInteraction';
import { initMagnetic } from './MagneticInteraction';

type ClickKind = 'download' | 'primary' | 'menu' | 'card' | 'tab' | 'image' | 'secondary' | 'link';

const world = new WebGLInteraction();
let initialized = false;
let lastX = 0;
let lastY = 0;
let lastMoveT = 0;
let velocity = 0;
let pressedEl: HTMLElement | null = null;

function classify(el: HTMLElement): ClickKind {
  const tagged = el.getAttribute('data-click');
  if (tagged === 'download' || tagged === 'primary' || tagged === 'menu' ||
      tagged === 'card' || tagged === 'tab' || tagged === 'image' || tagged === 'secondary') {
    return tagged;
  }
  if (el.hasAttribute('download')) return 'download';
  if (el.id === 'menu-toggle') return 'menu';
  if (el.classList.contains('game-tab-btn')) return 'tab';
  if (el.classList.contains('hud-box') || el.classList.contains('guide-box')) return 'card';
  if (el.classList.contains('master-download-btn') || el.classList.contains('hero-cta')) return 'primary';
  if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('#')) return 'link';
  if (el.tagName === 'BUTTON') return 'secondary';
  return 'link';
}

function levelFor(kind: ClickKind): ImpactLevel {
  if (kind === 'download' || kind === 'primary') return 3;
  if (kind === 'card' || kind === 'image' || kind === 'menu' || kind === 'tab') return 2;
  return 1;
}

function findInteractive(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  if (target instanceof HTMLInputElement) return null; // sliders keep native drag
  return target.closest<HTMLElement>('[data-click], a, button, .hud-box, .guide-box');
}

function haptic(kind: ClickKind) {
  if (kind !== 'download' && kind !== 'primary') return;
  try {
    (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(8);
  } catch { /* optional only */ }
}

export function initInteractionManager(sceneManager: SceneManager | null) {
  if (initialized) return;
  initialized = true;
  if (sceneManager) world.attach(sceneManager);
  initCursor();
  initMagnetic();

  document.addEventListener('pointermove', (e) => {
    const now = performance.now();
    const dt = Math.max(now - lastMoveT, 1);
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    velocity = Math.min(Math.sqrt(dx * dx + dy * dy) / dt, 3);
    lastX = e.clientX;
    lastY = e.clientY;
    lastMoveT = now;
  }, { passive: true });

  document.addEventListener('pointerdown', (e) => {
    const el = findInteractive(e.target);
    if (!el) return;
    pressedEl = el;
    el.dataset.pressed = '1';
    pressDown(el);
  });

  const release = () => {
    if (!pressedEl) return;
    const el = pressedEl;
    pressedEl = null;
    delete el.dataset.pressed;
    pressUp(el);
  };
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);

  document.addEventListener('click', (e) => {
    if (!(e instanceof MouseEvent)) return;
    const el = findInteractive(e.target);
    if (!el) return;
    const kind = classify(el);
    const level = levelFor(kind);
    const boost = Math.min(velocity * 0.4, 0.5); // fast cursor => slightly stronger

    // Universal: ripple on buttons/links (organic, subtle)
    if (el.tagName === 'BUTTON' || el.tagName === 'A') {
      createRipple(el, e.clientX, e.clientY, boost);
    }
    // Medium+: small radial shockwave at exact click point
    if (level >= 2) createShockwave(e.clientX, e.clientY, level === 3 ? 1.2 : 0.9);
    // Major only: tiny burst for download / hero CTA
    if (level === 3 && (kind === 'download' || kind === 'primary')) {
      createBurst(e.clientX, e.clientY, 10, boost);
      nudgeButtonText(el);
      nudgeArrow(el);
    } else if (kind === 'secondary') {
      nudgeArrow(el);
    }

    // DOM click -> persistent Three.js world (never restarts scene)
    world.impact(e.clientX, e.clientY, level);
    haptic(kind);

    // Anchor nav: Lenis owns the scroll (lenis.ts delegation). Add pre-travel world cue only.
    const href = el.getAttribute('href');
    if (el.tagName === 'A' && href?.startsWith('#') && href.length > 1) {
      if (document.querySelector(href) && !REDUCED_MOTION) {
        world.impact(e.clientX, e.clientY, 2);
      }
    }
    // Download: NEVER delay navigation — animation is immediate, default proceeds
  });

  // Keyboard parity: press feedback on Enter/Space (native click follows for effects)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = findInteractive(e.target);
    if (!el) return;
    pressDown(el);
  });
  document.addEventListener('keyup', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = findInteractive(e.target);
    if (!el) return;
    pressUp(el);
  });
}
