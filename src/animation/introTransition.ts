import gsap from 'gsap';
import type { IntroScene } from '../three/IntroScene';
import type { SceneManager } from '../three/SceneManager';
import { initSmoothScroll } from './lenis';
import { initScrollNarrative } from './scrollNarrative';

// introTransition - seamless handoff from intro into hero scroll world
export function executeIntroTransition(
  introScene:   IntroScene,
  sceneManager: SceneManager,
  onDone:       () => void
) {
  const overlay = document.getElementById('intro-overlay');
  const pageContent = document.getElementById('page-content');
  const nav = document.querySelector('nav, header') as HTMLElement;

  // 1. Seamless camera handoff: SceneManager takes over exactly where IntroCamera left off
  const introBasePos  = introScene.camera.basePosition;
  const introBaseLook = introScene.camera.baseLookAt;

  sceneManager.isIntroActive = false;
  sceneManager.targetCamPos.copy(introBasePos);
  sceneManager.targetLookAt.copy(introBaseLook);
  sceneManager.currentCamPos.copy(introBasePos);
  sceneManager.currentLookAt.copy(introBaseLook);

  const tl = gsap.timeline({
    onComplete: () => {
      // Remove overlay from DOM entirely
      overlay?.classList.add('intro-done');

      // Init Lenis smooth scroll + ScrollTrigger narrative
      initSmoothScroll();
      initScrollNarrative(sceneManager);
      sceneManager.setSectionState('hero', 0);

      // Destroy intro-only 3D objects
      introScene.destroy();

      onDone();
    },
  });

  // Page content reveals smoothly underneath
  if (pageContent) {
    tl.to(pageContent, {
      opacity: 1,
      duration: 0.85,
      ease: 'power2.out',
      onStart: () => {
        pageContent.classList.remove('intro-hidden');
        pageContent.classList.add('intro-visible');
        pageContent.style.pointerEvents = 'auto';
      }
    }, 0.1);
  }

  // Activate navigation
  if (nav) {
    tl.to(nav, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out',
      onStart: () => {
        nav.style.pointerEvents = 'auto';
      }
    }, 0.3);
  }

  // Overlay HUD fades to transparent
  if (overlay) {
    tl.to(overlay, {
      opacity:  0,
      duration: 0.65,
      ease:     'power2.inOut',
    }, 0.35);
  }
}
