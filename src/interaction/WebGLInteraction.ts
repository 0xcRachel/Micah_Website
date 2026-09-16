import gsap from 'gsap';
import type { SceneManager } from '../three/SceneManager';
import { REDUCED_MOTION } from './PointerInteraction';

export type ImpactLevel = 1 | 2 | 3;

/**
 * Global WebGL shock response. Fans out into EXISTING stage APIs only:
 * dischargeImpulse / distortion / camera nudge. Never restarts the scene.
 */
export class WebGLInteraction {
  private sceneManager: SceneManager | null = null;
  private lastImpact = 0;

  attach(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  impact(clientX: number, clientY: number, level: ImpactLevel) {
    const sm = this.sceneManager;
    if (!sm || REDUCED_MOTION) return;
    // Rapid-click guard: min 90ms between world impacts
    const now = performance.now();
    if (now - this.lastImpact < 90) return;
    this.lastImpact = now;

    // Screen -> NDC for pointer-aware stages
    const ndcX = (clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(clientY / window.innerHeight) * 2 + 1;

    if (level === 1) return; // micro: DOM-only, world untouched

    if (level === 2) {
      // Medium: subtle disturbance, settles by itself
      sm.productCore.setDistortion(1.6);
      sm.characterStage.setPointer(ndcX, ndcY);
      window.setTimeout(() => {
        if (this.sceneManager) this.sceneManager.productCore.setDistortion(1.0);
      }, 300);
      return;
    }

    // Major: "the whole world noticed" — impulse + tiny camera nudge
    sm.productCore.dischargeImpulse();
    sm.characterStage.setPointer(ndcX, ndcY);
    try {
      gsap.to(sm.targetCamPos, {
        z: '-=0.15',
        duration: 0.22,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: 1,
        overwrite: false,
      });
    } catch {
      /* camera nudge is decorative; never throw */
    }
  }
}
