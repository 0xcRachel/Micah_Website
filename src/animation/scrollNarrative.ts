import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SceneManager } from '../three/SceneManager';

gsap.registerPlugin(ScrollTrigger);

export function initScrollNarrative(sceneManager: SceneManager) {
  const sections = [
    'hero', 'intro', 'features', 'games',
    'steam', 'system', 'lua', 'interactive', 'character', 'download'
  ];

  // Set initial state
  sceneManager.setSectionState('hero', 0);

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CONTINUOUS SCRUBBED CHOREOGRAPHY: HERO -> INTRO
  // Eliminates the sudden jump/pop and provides continuous velocity & smooth flow
  // ─────────────────────────────────────────────────────────────────────────────
  const heroEl = document.getElementById('hero');
  const introEl = document.getElementById('intro');

  if (heroEl && introEl) {
    ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      endTrigger: introEl,
      end: 'center center',
      scrub: 1.2, // Continuous smooth scrubbing with inertia
      onUpdate: (self) => {
        const p = self.progress; // 0 (top of hero) -> 1 (center of intro)

        // Smooth position glide from x=1.4 to x=0.0, z=0.0 to z=-0.3
        sceneManager.productCore.targetPosition.x = gsap.utils.interpolate(1.4, 0.0, p);
        sceneManager.productCore.targetPosition.y = gsap.utils.interpolate(0.0, 0.0, p);
        sceneManager.productCore.targetPosition.z = gsap.utils.interpolate(0.0, -0.3, p);

        // Smooth scale: 1.0 -> 1.05 (prevent sudden expansion!)
        const scaleVal = gsap.utils.interpolate(1.0, 1.05, p);
        sceneManager.productCore.targetScale.set(scaleVal, scaleVal, scaleVal);

        // Smooth camera distance: 5.2 -> 4.8
        sceneManager.targetCamPos.z = gsap.utils.interpolate(5.2, 4.8, p);
        sceneManager.targetLookAt.x = gsap.utils.interpolate(0.4, 0.0, p);

        // Smooth distortion & rotation
        sceneManager.productCore.targetDistortion = gsap.utils.interpolate(1.0, 1.3, p);
        sceneManager.productCore.mainMesh.rotation.y = p * Math.PI * 0.75;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CONTINUOUS SCRUBBED CHOREOGRAPHY: INTRO -> FEATURES
  // ─────────────────────────────────────────────────────────────────────────────
  const featuresEl = document.getElementById('features');
  if (introEl && featuresEl) {
    ScrollTrigger.create({
      trigger: introEl,
      start: 'center center',
      endTrigger: featuresEl,
      end: 'center center',
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;
        sceneManager.productCore.targetPosition.x = gsap.utils.interpolate(0.0, -2.0, p);
        sceneManager.productCore.targetPosition.y = gsap.utils.interpolate(0.0, 0.3, p);
        sceneManager.productCore.targetPosition.z = gsap.utils.interpolate(-0.3, -0.5, p);

        const scaleVal = gsap.utils.interpolate(1.05, 0.95, p);
        sceneManager.productCore.targetScale.set(scaleVal, scaleVal, scaleVal);

        sceneManager.targetCamPos.x = gsap.utils.interpolate(0.0, -0.5, p);
        sceneManager.targetCamPos.z = gsap.utils.interpolate(4.8, 4.8, p);
        sceneManager.targetLookAt.x = gsap.utils.interpolate(0.0, -1.0, p);

        sceneManager.productCore.targetDistortion = gsap.utils.interpolate(1.3, 0.8, p);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. CONTINUOUS CROSS-FADE & SCRUB: FEATURES -> GAMES
  // ─────────────────────────────────────────────────────────────────────────────
  const gamesEl = document.getElementById('games');
  if (featuresEl && gamesEl) {
    ScrollTrigger.create({
      trigger: featuresEl,
      start: 'center center',
      endTrigger: gamesEl,
      end: 'center center',
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;
        // Cross-fade productCore -> gamePlanes
        sceneManager.productCore.targetOpacity = 1.0 - p;
        sceneManager.gamePlanes.targetOpacity = p;

        sceneManager.productCore.targetPosition.z = gsap.utils.interpolate(-0.5, -3.0, p);
        sceneManager.targetCamPos.x = gsap.utils.interpolate(-0.5, 0.0, p);
        sceneManager.targetCamPos.z = gsap.utils.interpolate(4.8, 4.2, p);
        sceneManager.targetLookAt.x = gsap.utils.interpolate(-1.0, 0.0, p);
      }
    });

    // Gallery internal depth scroll
    ScrollTrigger.create({
      trigger: gamesEl,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        sceneManager.gamePlanes.update(0.016, performance.now() * 0.001, self.progress);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. CONTINUOUS CROSS-FADE: GAMES -> STEAM
  // ─────────────────────────────────────────────────────────────────────────────
  const steamEl = document.getElementById('steam');
  if (gamesEl && steamEl) {
    ScrollTrigger.create({
      trigger: gamesEl,
      start: 'center center',
      endTrigger: steamEl,
      end: 'center center',
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;
        sceneManager.gamePlanes.targetOpacity = 1.0 - p;
        sceneManager.steamNetwork.targetOpacity = p;

        sceneManager.targetCamPos.y = gsap.utils.interpolate(0.0, 0.2, p);
        sceneManager.targetCamPos.z = gsap.utils.interpolate(4.2, 4.5, p);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. CONTINUOUS CROSS-FADE: STEAM -> SYSTEM
  // ─────────────────────────────────────────────────────────────────────────────
  const systemEl = document.getElementById('system');
  if (steamEl && systemEl) {
    ScrollTrigger.create({
      trigger: steamEl,
      start: 'center center',
      endTrigger: systemEl,
      end: 'center center',
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;
        sceneManager.steamNetwork.targetOpacity = 1.0 - p;
        sceneManager.systemDiagnostics.targetOpacity = p;

        sceneManager.targetCamPos.y = gsap.utils.interpolate(0.2, 0.0, p);
        sceneManager.targetCamPos.z = gsap.utils.interpolate(4.5, 4.0, p);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. CONTINUOUS CROSS-FADE: SYSTEM -> LUA
  // ─────────────────────────────────────────────────────────────────────────────
  const luaEl = document.getElementById('lua');
  if (systemEl && luaEl) {
    ScrollTrigger.create({
      trigger: systemEl,
      start: 'center center',
      endTrigger: luaEl,
      end: 'center center',
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;
        sceneManager.systemDiagnostics.targetOpacity = 1.0 - p;
        sceneManager.luaStream.targetOpacity = p;

        sceneManager.targetCamPos.z = gsap.utils.interpolate(4.0, 4.8, p);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. CONTINUOUS CROSS-FADE: LUA -> INTERACTIVE WORKBENCH
  // ─────────────────────────────────────────────────────────────────────────────
  const interactiveEl = document.getElementById('interactive');
  if (luaEl && interactiveEl) {
    ScrollTrigger.create({
      trigger: luaEl,
      start: 'center center',
      endTrigger: interactiveEl,
      end: 'center center',
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;
        sceneManager.luaStream.targetOpacity = 1.0 - p;
        sceneManager.productCore.targetOpacity = p;

        sceneManager.productCore.targetPosition.set(0, 0, 0);
        sceneManager.productCore.targetScale.set(1, 1, 1);
        sceneManager.targetCamPos.z = gsap.utils.interpolate(4.8, 4.8, p);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. CONTINUOUS CROSS-FADE: INTERACTIVE -> CHARACTER
  // ─────────────────────────────────────────────────────────────────────────────
  const characterEl = document.getElementById('character');
  if (interactiveEl && characterEl) {
    ScrollTrigger.create({
      trigger: interactiveEl,
      start: 'center center',
      endTrigger: characterEl,
      end: 'center center',
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;
        sceneManager.productCore.targetOpacity = 1.0 - p;
        sceneManager.characterStage.targetOpacity = p;

        sceneManager.targetCamPos.z = gsap.utils.interpolate(4.8, 4.2, p);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. CONTINUOUS CROSS-FADE: CHARACTER -> DOWNLOAD (FINAL CONVERGENCE)
  // ─────────────────────────────────────────────────────────────────────────────
  const downloadEl = document.getElementById('download');
  if (characterEl && downloadEl) {
    ScrollTrigger.create({
      trigger: characterEl,
      start: 'center center',
      endTrigger: downloadEl,
      end: 'center center',
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;
        sceneManager.characterStage.targetOpacity = 1.0 - p;
        sceneManager.productCore.targetOpacity = p;

        sceneManager.productCore.targetPosition.set(0, gsap.utils.interpolate(0.0, 0.5, p), 0);
        sceneManager.productCore.targetScale.set(1, 1, 1);
        sceneManager.productCore.targetDistortion = gsap.utils.interpolate(1.0, 0.5, p);
        sceneManager.productCore.targetAccentMix = gsap.utils.interpolate(0.25, 0.85, p);

        sceneManager.targetCamPos.z = gsap.utils.interpolate(4.2, 5.0, p);
        sceneManager.targetLookAt.y = gsap.utils.interpolate(0.0, 0.3, p);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. SECTION TRACKING FOR [data-current_section] & EDITORIAL TEXT REVEALS
  // ─────────────────────────────────────────────────────────────────────────────
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => {
        document.body.dataset.currentSection = id;
      },
      onEnterBack: () => {
        document.body.dataset.currentSection = id;
      }
    });

    // Editorial text reveals
    const titleEls = el.querySelectorAll('.anim-title');
    if (titleEls.length > 0) {
      gsap.fromTo(
        titleEls,
        { opacity: 0, y: 50, filter: 'blur(8px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)',
          duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 80%' }
        }
      );
    }

    const fadeEls = el.querySelectorAll('.anim-fade');
    if (fadeEls.length > 0) {
      gsap.fromTo(
        fadeEls,
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0,
          duration: 0.85, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 75%' }
        }
      );
    }
  });
}
