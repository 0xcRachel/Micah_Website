import * as THREE from 'three';

export class CharacterStage {
  public group: THREE.Group;
  public characterMesh: THREE.Mesh;
  public haloRing: THREE.Mesh;
  public shadowPlane: THREE.Mesh;
  public targetOpacity = 0.0;
  public currentOpacity = 0.0;

  private charMat: THREE.MeshBasicMaterial;
  private haloMat: THREE.MeshBasicMaterial;
  private shadowMat: THREE.MeshBasicMaterial;

  private targetRotationY = 0;
  private targetRotationX = 0;
  private blinkTimer = 0;
  private isBlinking = false;
  private clickImpulse = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    // Texture loader for official dark mode character asset
    const textureLoader = new THREE.TextureLoader();
    const charTexture = textureLoader.load('/assets/dark_mode_char.png');
    charTexture.colorSpace = THREE.SRGBColorSpace;

    // Layered 2.5D character plane
    const charGeo = new THREE.PlaneGeometry(3.0, 3.8);
    this.charMat = new THREE.MeshBasicMaterial({
      map: charTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      opacity: 0.0
    });
    this.characterMesh = new THREE.Mesh(charGeo, this.charMat);
    this.characterMesh.position.set(0, 0.2, 0);
    this.group.add(this.characterMesh);

    // Subtle Ground Shadow
    const shadowGeo = new THREE.CircleGeometry(1.2, 32);
    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.0
    });
    this.shadowPlane = new THREE.Mesh(shadowGeo, this.shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.set(0, -1.8, 0);
    this.group.add(this.shadowPlane);

    // Atmospheric Tech Halo Ring
    const haloGeo = new THREE.RingGeometry(1.9, 1.92, 64);
    this.haloMat = new THREE.MeshBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.haloRing = new THREE.Mesh(haloGeo, this.haloMat);
    this.haloRing.position.set(0, 0.2, -0.2);
    this.group.add(this.haloRing);
  }

  public setOpacity(v: number) {
    this.targetOpacity = Math.max(0, Math.min(1, v));
  }

  public setPointer(ndcX: number, ndcY: number) {
    this.targetRotationY = ndcX * 0.35;
    this.targetRotationX = -ndcY * 0.2;
  }

  public triggerClickReaction() {
    this.clickImpulse = 1.0;
  }

  public update(delta: number, elapsed: number) {
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.group.visible = this.currentOpacity > 0.005;

    this.charMat.opacity = this.currentOpacity;
    this.shadowMat.opacity = 0.6 * this.currentOpacity;
    this.haloMat.opacity = 0.35 * this.currentOpacity;

    // Decay click impulse
    this.clickImpulse = Math.max(0, this.clickImpulse - delta * 2.5);

    // Breathing oscillation
    const breathFreq = 2.2;
    const breathOffset = Math.sin(elapsed * breathFreq);
    const floatY = 0.2 + breathOffset * 0.08 + this.clickImpulse * 0.25;

    this.characterMesh.position.y = floatY;

    // Organic secondary delay on rotation
    this.characterMesh.rotation.y += (this.targetRotationY - this.characterMesh.rotation.y) * 0.08;
    this.characterMesh.rotation.x += (this.targetRotationX - this.characterMesh.rotation.x) * 0.08;
    this.characterMesh.rotation.z = Math.sin(elapsed * 1.2) * 0.02;

    // Halo subtle counter-wobble
    this.haloRing.rotation.z += delta * 0.4;
    this.haloRing.rotation.x = Math.sin(elapsed * 1.5) * 0.15;
    this.haloRing.position.y = floatY;

    // Shadow expansion
    const shadowScale = 1.0 - (breathOffset * 0.08 + this.clickImpulse * 0.2);
    this.shadowPlane.scale.set(shadowScale, shadowScale, 1.0);

    // Blink timer
    this.blinkTimer += delta;
    if (this.blinkTimer > 3.8) {
      this.isBlinking = true;
      if (this.blinkTimer > 4.0) {
        this.blinkTimer = 0;
        this.isBlinking = false;
      }
    }
  }
}
