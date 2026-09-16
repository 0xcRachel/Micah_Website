import gsap from 'gsap';
import type { IntroScene } from '../three/IntroScene';
import {
  revealCornerLabel,
  hideCornerLabel,
  revealLimeSignal,
  revealIntroTitle,
  revealIntroTagline,
  revealHairlines,
} from './introText';

// Proxy objects tweened by GSAP to drive Three.js values each frame
interface TweenProxy {
  particleProgress: number;
  shellScaleY:      number;
  envReveal:        number;
  coreOpacity:      number;
}

export function createIntroTimeline(
  introScene: IntroScene,
  onComplete: () => void
): gsap.core.Timeline {

  const proxy: TweenProxy = {
    particleProgress: 0,
    shellScaleY:      0.001,
    envReveal:        0,
    coreOpacity:      0,
  };

  const { productCore, camera, particles, environment } = introScene;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Master timeline - paused, played once assets are ready
  const tl = gsap.timeline({
    paused:     true,
    onComplete: () => {
      introScene.emit('heroReveal');
      onComplete();
    },
  });

  if (reducedMotion) {
    // ─── REDUCED MOTION: immediate minimal reveal ──────────────────────────
    tl.add(() => {
      productCore.targetOpacity = 1;
      productCore.group.scale.set(1, 1, 1);
      productCore.targetScale.set(1, 1, 1);
      camera.moveBase([0, 0, 5.2], [0.4, 0, 0], 0.8, 'power2.out');
    }, 0)
    .add(() => revealLimeSignal(), 0.4)
    .add(() => revealIntroTitle(), 0.6)
    .add(() => revealIntroTagline(), 1.0)
    .add(() => onComplete(), 1.8);
    return tl;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 0.00 — VOID: pure black. Camera very close. Everything invisible.
  //        Identity scale Y = 0.001 (disc-flat).
  // ─────────────────────────────────────────────────────────────────────────
  tl.add(() => {
    introScene.isRunning = true;
    productCore.setTargetPosition(0, 0, 0);
    productCore.group.position.set(0, 0, 0);
    productCore.targetScale.set(1, 0.001, 1);
    productCore.group.scale.set(1, 0.001, 1);
    productCore.targetOpacity = 0;
    productCore.currentOpacity = 0;
    introScene.emit('introStart');
  }, 0);

  // ─── 0.20: Corner label fades in (barely visible) ─────────────────────
  tl.add(() => revealCornerLabel(), 0.2);

  // ─── 0.28: SIGNAL — micro dot pulses into existence ───────────────────
  tl.add(() => {
    const dot = document.querySelector('.intro-signal-dot') as HTMLElement;
    if (!dot) return;
    introScene.emit('signalAppear');
    gsap.to(dot, {
      opacity: 1,
      scale: 1,
      duration: 0.45,
      ease: 'back.out(2.5)',
    });
    // Micro dot pulses a few times then fades as particles appear
    gsap.to(dot, { opacity: 0, duration: 0.6, delay: 1.2, ease: 'power2.in' });
  }, 0.28);

  // ─── 0.55: Particles attraction begins ────────────────────────────────
  tl.to(proxy, {
    particleProgress: 0.45,
    duration: 1.8,
    ease: 'power1.inOut',
    onUpdate: () => particles.setProgress(proxy.particleProgress),
  }, 0.55);

  tl.add(() => introScene.emit('geometryForm'), 0.55);

  // ─── 1.05: 2D identity disc appears (flat, barely opaque, pure signal) ─
  tl.to(proxy, {
    coreOpacity: 0.45,
    duration:    0.9,
    ease:        'power2.out',
    onUpdate:    () => {
      productCore.targetOpacity = proxy.coreOpacity;
    },
  }, 1.05);

  // Hairlines suggest depth behind the flat disc
  tl.add(() => revealHairlines(), 1.3);

  // ─── 1.55: 3D EXTRUSION — Y scale 0 → 1 (the 2D→3D physical reveal) ──
  tl.to(proxy, {
    shellScaleY: 1.0,
    duration:    1.25,
    ease:        'power2.inOut',
    onUpdate: () => {
      productCore.group.scale.y = proxy.shellScaleY;
      productCore.targetScale.y = proxy.shellScaleY;
    },
  }, 1.55);

  // Camera begins slight tilt as depth arrives (perspective lock-in)
  tl.add(() => {
    camera.moveBase([0.2, 0.15, 2.4], [0, 0, 0], 1.4, 'power2.inOut');
    introScene.emit('depthReveal');
  }, 1.7);

  // Opacity rises to full during extrusion
  tl.to(proxy, {
    coreOpacity: 1.0,
    duration:    1.0,
    ease:        'power2.out',
    onUpdate: () => {
      productCore.targetOpacity = proxy.coreOpacity;
    },
  }, 2.0);

  // ─── 2.6: CAMERA PULLBACK — "what I thought was a disc is a world" ────
  tl.add(() => {
    camera.moveBase([0, 0, 5.2], [0.4, 0, 0], 2.0, 'power2.inOut');
    introScene.emit('systemOnline');
    // Environment depth layers reveal as world expands
    proxy.envReveal = 0;
  }, 2.6);

  tl.to(proxy, {
    envReveal: 1.0,
    duration:  1.8,
    ease:      'power1.out',
    onUpdate:  () => environment.setReveal(proxy.envReveal),
  }, 2.6);

  // Particles complete orbit formation
  tl.to(proxy, {
    particleProgress: 0.9,
    duration: 1.4,
    ease: 'power1.out',
    onUpdate: () => particles.setProgress(proxy.particleProgress),
  }, 2.8);

  // Internal distortion energy surges
  tl.add(() => {
    productCore.setDistortion(1.4);
    productCore.setAccentMix(0.45);
  }, 3.0);

  // Settles back
  tl.add(() => {
    productCore.setDistortion(1.0);
    productCore.setAccentMix(0.35);
  }, 3.6);

  // ─── 3.82: LIME SIGNAL — SYSTEM ONLINE. Once. ─────────────────────────
  tl.add(() => {
    revealLimeSignal();
    hideCornerLabel();
    introScene.emit('systemOnline');
  }, 3.82);

  // ─── 4.15: MICAH 0xC typography arrives from depth ────────────────────
  tl.add(() => {
    introScene.emit('logoReveal');
    revealIntroTitle();
  }, 4.15);

  // ─── 4.92: Tagline whispers in ────────────────────────────────────────
  tl.add(() => revealIntroTagline(), 4.92);

  // ─── 5.4: World expansion — particles to full orbit ───────────────────
  tl.to(proxy, {
    particleProgress: 1.0,
    duration: 1.2,
    ease: 'power2.out',
    onUpdate: () => particles.setProgress(proxy.particleProgress),
  }, 5.4);

  // Move identity to hero position (right side) as world opens
  tl.add(() => {
    productCore.setTargetPosition(1.4, 0, 0);
    productCore.setTargetScale(1.0);
  }, 5.6);

  // ─── 6.2: Transition begins — camera glides into hero position ────────
  tl.add(() => {
    introScene.emit('heroReveal');
  }, 6.2);

  // Typography fades slightly (hero section own text will appear)
  tl.to('.intro-typography-wrap', {
    opacity:  0,
    y:        -20,
    duration: 0.7,
    ease:     'power2.in',
  }, 6.25);

  tl.to('.intro-lime-signal', {
    opacity:  0,
    duration: 0.4,
    ease:     'power1.in',
  }, 6.3);

  // Total duration target: ~7.0s before onComplete fires
  tl.add(() => {}, 7.0);

  return tl;
}