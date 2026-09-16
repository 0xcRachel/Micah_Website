import * as THREE from 'three';
import { IntroCamera } from './IntroCamera';
import { IntroParticles } from './IntroParticles';
import { IntroEnvironment } from './IntroEnvironment';
import type { ProductCore } from './ProductCore';

// ─── IntroScene \u2014 Master WebGL orchestrator for the cinematic intro ─────────────
export class IntroScene {
  public camera: IntroCamera;
  public particles: IntroParticles;
  public environment: IntroEnvironment;

  // Mouse state
  public mouseNdc      = new THREE.Vector2();
  public pointerVelocity = 0;
  private lastPointer  = new THREE.Vector2();

  // Running state
  public isRunning = false;
  private elapsed  = 0;

  // Event hooks for sound design integration
  private eventCallbacks: Record<string, (() => void)[]> = {};

  constructor(
    private threeCamera: THREE.PerspectiveCamera,
    private scene:       THREE.Scene,
    public  productCore: ProductCore
  ) {
    // Build camera controller (overrides SceneManager camera)
    this.camera = new IntroCamera(threeCamera);

    // Particles
    this.particles = new IntroParticles(scene);

    // Background environment
    this.environment = new IntroEnvironment(scene);

    // Initialize identity: start flat (scale.y = 0) and invisible
    productCore.group.visible = true;
    productCore.targetOpacity  = 0;
    productCore.currentOpacity = 0;
    // Flattened Y for 2D-to-3D reveal — Y=0 = disc, Y=1 = full 3D
    productCore.group.scale.set(1, 0.001, 1);
    productCore.targetScale.set(1, 0.001, 1);
  }

  // ─── Mouse handler (called from Layout orchestrator) ──────────────────────
  public handleMouse(clientX: number, clientY: number) {
    const x =  (clientX / window.innerWidth)  * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;
    const dx = x - this.lastPointer.x;
    const dy = y - this.lastPointer.y;
    this.pointerVelocity = Math.min(4.0, Math.sqrt(dx * dx + dy * dy) * 60);
    this.lastPointer.set(x, y);
    this.mouseNdc.set(x, y);
  }

  // ─── Per-frame update (called from SceneManager.animate) ──────────────────
  public update(delta: number) {
    if (!this.isRunning) return;
    this.elapsed += delta;

    // Decay velocity naturally
    this.pointerVelocity *= 0.9;

    this.camera.update(delta, this.mouseNdc);
    this.particles.update(this.elapsed, this.mouseNdc, this.pointerVelocity);
    this.environment.update(this.elapsed);
  }

  // ─── Sound-ready event emitter ────────────────────────────────────────────
  public on(event: string, cb: () => void) {
    if (!this.eventCallbacks[event]) this.eventCallbacks[event] = [];
    this.eventCallbacks[event].push(cb);
  }

  public emit(event: string) {
    window.dispatchEvent(new CustomEvent(`intro:${event}`));
    (this.eventCallbacks[event] ?? []).forEach(cb => cb());
  }

  // ─── Cleanup after intro complete ─────────────────────────────────────────
  public destroy() {
    this.isRunning = false;
    this.particles.dispose();
    this.environment.dispose();
  }
}