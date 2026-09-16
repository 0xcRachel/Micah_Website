import * as THREE from 'three';
import gsap from 'gsap';

// ─── IntroCamera \u2014 Multi-layer physically operated camera system ─────────────────
// Layers: base (GSAP-driven) + mouse parallax + micro-noise + lerp inertia
export class IntroCamera {
  // GSAP-tweened base targets
  private basePos  = new THREE.Vector3(0, 0, 2.6);
  private baseLook = new THREE.Vector3(0, 0, 0);

  // Live interpolated positions
  private currentPos  = new THREE.Vector3(0, 0, 2.6);
  private currentLook = new THREE.Vector3(0, 0, 0);

  // Parallax accumulator (lerped toward mouse offset)
  private parallax = new THREE.Vector3();

  // Micro-noise time
  private noiseT = 0;

  // Lerp speed (tighter during sharp camera moves, looser during idle)
  private lerpSpeed = 0.07;

  constructor(private camera: THREE.PerspectiveCamera) {
    camera.position.copy(this.basePos);
    camera.lookAt(this.baseLook);
  }

  // Smoothly drive base position + lookAt via GSAP
  public moveBase(
    pos:  [number, number, number],
    look: [number, number, number],
    duration = 1.2,
    ease     = 'power2.inOut'
  ) {
    gsap.to(this.basePos,  { x: pos[0],  y: pos[1],  z: pos[2],  duration, ease, overwrite: 'auto' });
    gsap.to(this.baseLook, { x: look[0], y: look[1], z: look[2], duration, ease, overwrite: 'auto' });
  }

  // Called every frame from animate()
  public update(delta: number, mouseNdc: THREE.Vector2) {
    this.noiseT += delta;

    // Micro-noise: two independent sin frequencies — physically plausible hand-held sway
    const nx = Math.sin(this.noiseT * 0.38) * 0.007;
    const ny = Math.sin(this.noiseT * 0.26) * 0.004;
    const nz = Math.sin(this.noiseT * 0.19) * 0.003;

    // Mouse parallax: soft inertial follow
    this.parallax.x += (mouseNdc.x * 0.22 - this.parallax.x) * 0.045;
    this.parallax.y += (mouseNdc.y * 0.14 - this.parallax.y) * 0.045;

    // Compose final camera position target
    const target = new THREE.Vector3(
      this.basePos.x + this.parallax.x + nx,
      this.basePos.y + this.parallax.y + ny,
      this.basePos.z + nz
    );

    // Smooth lerp of current position toward target
    this.currentPos.lerp(target, this.lerpSpeed);
    this.camera.position.copy(this.currentPos);

    // LookAt: base look + tiny mouse follow
    const lookTarget = new THREE.Vector3(
      this.baseLook.x + mouseNdc.x * 0.06,
      this.baseLook.y + mouseNdc.y * 0.04,
      this.baseLook.z
    );
    this.currentLook.lerp(lookTarget, 0.06);
    this.camera.lookAt(this.currentLook);
  }

  // Expose base targets for external animation (introTransition uses this)
  public get basePosition(): THREE.Vector3 { return this.basePos; }
  public get baseLookAt(): THREE.Vector3   { return this.baseLook; }
}