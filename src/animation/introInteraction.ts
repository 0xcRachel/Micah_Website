import gsap from 'gsap';
import type { IntroScene } from '../three/IntroScene';

// introInteraction - mouse/pointer handling during intro sequence
export function initIntroInteraction(introScene: IntroScene): () => void {
  const onMove = (e: MouseEvent) => {
    introScene.handleMouse(e.clientX, e.clientY);
  };
  const onTouch = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      introScene.handleMouse(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  // Returns cleanup fn
  return () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('touchmove', onTouch);
  };
}