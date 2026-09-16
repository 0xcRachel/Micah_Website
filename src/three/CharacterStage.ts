import * as THREE from 'three';

export class CharacterStage {
  public group: THREE.Group;
  public characterMesh: THREE.Mesh;
  public haloGroup: THREE.Group;
  public shadowPlane: THREE.Mesh;
  public sparklePoints: THREE.Points;
  public shockwaveRing: THREE.Mesh;
  public scanBeam: THREE.Line;

  public targetOpacity = 0.0;
  public currentOpacity = 0.0;

  private charMat: THREE.MeshBasicMaterial;
  private shadowMat: THREE.MeshBasicMaterial;
  private haloMats: THREE.MeshBasicMaterial[] = [];
  private shockwaveMat: THREE.MeshBasicMaterial;

  private targetRotationY = 0;
  private targetRotationX = 0;
  private clickImpulse = 0;

  // Orbiting satellite beads
  private satelliteMeshes: THREE.Mesh[] = [];

  // Sparkle particle data
  private sparkleCount = 130;
  private sparklePositions: Float32Array;
  private sparkleSpeeds: Float32Array;

  // Scanline vertical sweep
  private scanProgress = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    // ─────────────────────────────────────────────────────────────────────────
    // Align Character to Right Editorial Column (X: 1.45)
    // Completely frees the left column for editorial text and CTA buttons
    // ─────────────────────────────────────────────────────────────────────────
    this.group.position.set(1.45, 0.0, 0);

    // 1. Texture loader for official dark mode character asset
    const textureLoader = new THREE.TextureLoader();
    const charTexture = textureLoader.load('/assets/dark_mode_char.png');
    charTexture.colorSpace = THREE.SRGBColorSpace;

    // 2. Layered 2.5D character plane
    const charGeo = new THREE.PlaneGeometry(3.1, 3.9);
    this.charMat = new THREE.MeshBasicMaterial({
      map: charTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      opacity: 0.0
    });
    this.characterMesh = new THREE.Mesh(charGeo, this.charMat);
    this.characterMesh.position.set(0, 0.15, 0);
    this.group.add(this.characterMesh);

    // 3. Ground Ambient Shadow
    const shadowGeo = new THREE.CircleGeometry(1.3, 32);
    this.shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      depthWrite: false,
      opacity: 0.0
    });
    this.shadowPlane = new THREE.Mesh(shadowGeo, this.shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.set(0, -1.85, 0);
    this.group.add(this.shadowPlane);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. MULTI-RING CYBERNETIC ASTROLABE HALO (Layered Tech Backing)
    // ─────────────────────────────────────────────────────────────────────────
    this.haloGroup = new THREE.Group();
    this.haloGroup.position.set(0, 0.15, -0.25);

    // Outer Primary Ring (Electric Lime)
    const haloGeo1 = new THREE.TorusGeometry(2.15, 0.005, 6, 80);
    const haloMat1 = new THREE.MeshBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      depthWrite: false,
      opacity: 0.0
    });
    this.haloMats.push(haloMat1);
    const ring1 = new THREE.Mesh(haloGeo1, haloMat1);
    this.haloGroup.add(ring1);

    // Mid Compass Ring (Titanium Silver)
    const haloGeo2 = new THREE.TorusGeometry(1.82, 0.004, 6, 80);
    const haloMat2 = new THREE.MeshBasicMaterial({
      color: 0x88ffff,
      transparent: true,
      depthWrite: false,
      opacity: 0.0
    });
    this.haloMats.push(haloMat2);
    const ring2 = new THREE.Mesh(haloGeo2, haloMat2);
    ring2.rotation.z = Math.PI / 4;
    this.haloGroup.add(ring2);

    // Orbiting Satellite 1
    const satGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const satMat1 = new THREE.MeshBasicMaterial({ color: 0xd7ff00, depthWrite: false });
    const sat1 = new THREE.Mesh(satGeo, satMat1);
    sat1.position.x = 2.15;
    ring1.add(sat1);
    this.satelliteMeshes.push(sat1);

    // Orbiting Satellite 2
    const satMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false });
    const sat2 = new THREE.Mesh(satGeo, satMat2);
    sat2.position.x = 1.82;
    ring2.add(sat2);
    this.satelliteMeshes.push(sat2);

    // Geometric Diamond Reticle Backing
    const diamondGeo = new THREE.OctahedronGeometry(1.5, 0);
    const diamondEdges = new THREE.EdgesGeometry(diamondGeo);
    const diamondMat = new THREE.LineBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      depthWrite: false,
      opacity: 0.25
    });
    const diamondMesh = new THREE.LineSegments(diamondEdges, diamondMat);
    diamondMesh.scale.set(1.2, 1.2, 0.1);
    this.haloGroup.add(diamondMesh);

    this.group.add(this.haloGroup);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. INTERACTIVE CLICK SHOCKWAVE PULSE
    // ─────────────────────────────────────────────────────────────────────────
    const swGeo = new THREE.RingGeometry(1.2, 1.24, 64);
    this.shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      depthWrite: false,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    this.shockwaveRing = new THREE.Mesh(swGeo, this.shockwaveMat);
    this.shockwaveRing.position.set(0, 0.15, -0.15);
    this.group.add(this.shockwaveRing);

    // ─────────────────────────────────────────────────────────────────────────
    // 6. FLOATING CYBER ETHER SPARKLES (Anime Tech Ambient)
    // ─────────────────────────────────────────────────────────────────────────
    this.sparklePositions = new Float32Array(this.sparkleCount * 3);
    this.sparkleSpeeds = new Float32Array(this.sparkleCount);

    for (let i = 0; i < this.sparkleCount; i++) {
      this.sparklePositions[i * 3]     = (Math.random() - 0.5) * 3.4;
      this.sparklePositions[i * 3 + 1] = (Math.random() - 0.5) * 4.0;
      this.sparklePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      this.sparkleSpeeds[i] = 0.4 + Math.random() * 0.8;
    }

    const sparkleGeo = new THREE.BufferGeometry();
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(this.sparklePositions, 3));
    const sparkleMat = new THREE.PointsMaterial({
      color: 0xd7ff00,
      size: 0.035,
      transparent: true,
      depthWrite: false,
      opacity: 0.0
    });
    this.sparklePoints = new THREE.Points(sparkleGeo, sparkleMat);
    this.group.add(this.sparklePoints);

    // ─────────────────────────────────────────────────────────────────────────
    // 7. HOLOGRAPHIC SCAN BEAM (Cybernetic diagnostic laser line)
    // ─────────────────────────────────────────────────────────────────────────
    const beamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.6, 0, 0.02),
      new THREE.Vector3(1.6, 0, 0.02)
    ]);
    const beamMat = new THREE.LineBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      depthWrite: false,
      opacity: 0.0
    });
    this.scanBeam = new THREE.Line(beamGeo, beamMat);
    this.group.add(this.scanBeam);
  }

  public setOpacity(v: number) {
    this.targetOpacity = Math.max(0, Math.min(1, v));
  }

  public setPointer(ndcX: number, ndcY: number) {
    // Responsive head-tracking towards pointer
    this.targetRotationY = ndcX * 0.28;
    this.targetRotationX = -ndcY * 0.16;
  }

  public triggerClickReaction() {
    this.clickImpulse = 1.0;
  }

  public update(delta: number, elapsed: number) {
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.group.visible = this.currentOpacity > 0.005;

    const op = this.currentOpacity;
    this.charMat.opacity = op;
    this.shadowMat.opacity = 0.55 * op;
    this.haloMats[0].opacity = 0.45 * op;
    this.haloMats[1].opacity = 0.30 * op;
    (this.sparklePoints.material as THREE.PointsMaterial).opacity = 0.65 * op;

    // Decay click impulse
    this.clickImpulse = Math.max(0, this.clickImpulse - delta * 2.2);

    // Organic breathing & spring jump on click
    const breathFreq = 2.0;
    const breathOffset = Math.sin(elapsed * breathFreq);
    const jumpOffset = Math.sin(this.clickImpulse * Math.PI) * 0.35;
    const floatY = 0.15 + breathOffset * 0.07 + jumpOffset;

    this.characterMesh.position.y = floatY;

    // Responsive head/body tracking inertia
    this.characterMesh.rotation.y += (this.targetRotationY - this.characterMesh.rotation.y) * 0.08;
    this.characterMesh.rotation.x += (this.targetRotationX - this.characterMesh.rotation.x) * 0.08;
    this.characterMesh.rotation.z = Math.sin(elapsed * 1.1) * 0.018;

    // Halo astrolabe counter-rotations
    this.haloGroup.position.y = floatY;
    this.haloGroup.children[0].rotation.z += delta * (0.35 + this.clickImpulse * 2.0);
    this.haloGroup.children[1].rotation.z -= delta * (0.25 + this.clickImpulse * 1.5);
    this.haloGroup.children[2].rotation.y = Math.sin(elapsed * 0.9) * 0.15;

    // Satellite beads vertical micro-oscillation
    this.satelliteMeshes.forEach((sat, i) => {
      sat.position.y = Math.sin(elapsed * 2.0 + i) * 0.08;
    });

    // Expanding shockwave pulse on click
    if (this.clickImpulse > 0.01) {
      const scale = 1.0 + (1.0 - this.clickImpulse) * 1.8;
      this.shockwaveRing.scale.set(scale, scale, 1.0);
      this.shockwaveMat.opacity = this.clickImpulse * 0.65 * op;
      this.shockwaveRing.position.y = floatY;
    } else {
      this.shockwaveMat.opacity = 0.0;
    }

    // Holographic scanline sweep
    this.scanProgress = (this.scanProgress + delta * 0.4) % 1.0;
    const scanY = floatY + 1.8 - this.scanProgress * 3.6;
    this.scanBeam.position.y = scanY;
    (this.scanBeam.material as THREE.LineBasicMaterial).opacity = 
      Math.sin(this.scanProgress * Math.PI) * 0.40 * op;

    // Floating sparkle particles
    const posAttr = this.sparklePoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < this.sparkleCount; i++) {
      posArray[i * 3 + 1] += delta * this.sparkleSpeeds[i] * 0.35;
      if (posArray[i * 3 + 1] > 2.2) {
        posArray[i * 3 + 1] = -2.0;
      }
      posArray[i * 3] += Math.sin(elapsed * 1.5 + i) * 0.003;
    }
    posAttr.needsUpdate = true;

    // Shadow plane breathing
    const shadowScale = 1.0 - (breathOffset * 0.06 + jumpOffset * 0.3);
    this.shadowPlane.scale.set(shadowScale, shadowScale, 1.0);
  }
}

