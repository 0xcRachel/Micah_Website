import * as THREE from 'three';
import { coreVertexShader, coreFragmentShader } from './shaders/core.vert';

export class ProductCore {
  public group: THREE.Group;
  public mainMesh: THREE.Mesh;
  public outerCage: THREE.LineSegments;
  public innerNucleus: THREE.Mesh;
  public outerGimbal: THREE.Group;
  public orbitalNodes: THREE.Points;
  public shockwaveRings: THREE.Mesh[] = [];
  public material: THREE.ShaderMaterial;

  private edgeMat: THREE.LineBasicMaterial;
  private nucleusMat: THREE.MeshBasicMaterial;
  private ringMats: THREE.MeshBasicMaterial[] = [];
  private satelliteMeshes: THREE.Mesh[] = [];
  private shockwaveMat: THREE.MeshBasicMaterial;

  // Inertial smooth-follow targets
  public targetPosition = new THREE.Vector3(1.4, 0, 0);
  public targetScale = new THREE.Vector3(1, 1, 1);
  public targetDistortion = 1.0;
  public currentDistortion = 1.0;
  public targetAccentMix = 0.35;
  public currentAccentMix = 0.35;
  public targetOpacity = 1.0;
  public currentOpacity = 1.0;

  private targetRotationX = 0;
  private targetRotationY = 0;

  // Particle positions & orbital speeds
  private particleCount = 260;
  private particleSpeeds: Float32Array;
  private particleRadii: Float32Array;
  private particleAngles: Float32Array;
  private particleHeights: Float32Array;

  // Scroll-velocity energy (target fed by events, smoothed every frame — no pops)
  public scrollBoost = 0.0;
  private scrollBoostTarget = 0.0;

  public addScrollBoost(v: number) {
    this.scrollBoostTarget = Math.max(0, Math.min(1.2, this.scrollBoostTarget + Math.min(v, 8) * 0.02));
  }

  // Shockwave expansion timers
  private shockwaveProgress = [0.0, 0.5];

  constructor() {
    this.group = new THREE.Group();
    this.group.position.copy(this.targetPosition);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ORGANIC LIQUID OBSIDIAN & IRIDESCENT CORE (Alche Studio standard)
    // High-resolution subdivided icosahedron deformed by 3D simplex noise
    // ─────────────────────────────────────────────────────────────────────────
    this.material = new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDistortion: { value: 1.0 },
        uCameraPos: { value: new THREE.Vector3(0, 0, 5) },
        uPointer: { value: new THREE.Vector3(0, 0, 0) },
        uAccentMix: { value: 0.35 },
        uOpacity: { value: 1.0 }
      },
      transparent: true,
      depthWrite: false, // Prevents clipping & severing of surrounding elements
      depthTest: true,
      side: THREE.FrontSide
    });

    // High-subdivision mesh (smooth fluid waves)
    const shellGeo = new THREE.IcosahedronGeometry(1.35, 4);
    this.mainMesh = new THREE.Mesh(shellGeo, this.material);
    this.group.add(this.mainMesh);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. HOLOGRAPHIC GEODESIC WIREFRAME CAGE (Floating outer energy lattice)
    // ─────────────────────────────────────────────────────────────────────────
    const cageGeo = new THREE.IcosahedronGeometry(1.58, 1);
    const edgeGeo = new THREE.EdgesGeometry(cageGeo);
    this.edgeMat = new THREE.LineBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      opacity: 0.40,
      depthWrite: false
    });
    this.outerCage = new THREE.LineSegments(edgeGeo, this.edgeMat);
    this.group.add(this.outerCage);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. INNER QUANTUM NUCLEUS (Bioluminescent crystal anchor)
    // ─────────────────────────────────────────────────────────────────────────
    const nucGeo = new THREE.OctahedronGeometry(0.55, 0);
    this.nucleusMat = new THREE.MeshBasicMaterial({
      color: 0xd7ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    this.innerNucleus = new THREE.Mesh(nucGeo, this.nucleusMat);
    this.group.add(this.innerNucleus);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. AEROSPACE GYROSCOPIC ASTROLABE (3D Torus Rings + Satellites)
    // No 2D planar clipping ("không bị khuyết")
    // ─────────────────────────────────────────────────────────────────────────
    this.outerGimbal = new THREE.Group();

    // Ring 1: Equatorial Gyro Ring
    const ringGeo1 = new THREE.TorusGeometry(1.95, 0.005, 6, 96);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    this.ringMats.push(ringMat1);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.outerGimbal.add(ring1);

    // Satellite 1
    const satGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const satMat1 = new THREE.MeshBasicMaterial({ color: 0xd7ff00, depthWrite: false });
    const sat1 = new THREE.Mesh(satGeo, satMat1);
    sat1.position.x = 1.95;
    ring1.add(sat1);
    this.satelliteMeshes.push(sat1);

    // Ring 2: Meridian Gyro Ring
    const ringGeo2 = new THREE.TorusGeometry(2.18, 0.004, 6, 96);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    this.ringMats.push(ringMat2);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    this.outerGimbal.add(ring2);

    // Satellite 2
    const satMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, depthWrite: false });
    const sat2 = new THREE.Mesh(satGeo, satMat2);
    sat2.position.x = 2.18;
    ring2.add(sat2);
    this.satelliteMeshes.push(sat2);

    // Ring 3: Polar Accent Gyro Ring (Electric Lime)
    const ringGeo3 = new THREE.TorusGeometry(2.42, 0.005, 6, 96);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      opacity: 0.40,
      depthWrite: false
    });
    this.ringMats.push(ringMat3);
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.y = Math.PI / 3;
    this.outerGimbal.add(ring3);

    // Satellite 3
    const satMat3 = new THREE.MeshBasicMaterial({ color: 0xd7ff00, depthWrite: false });
    const sat3 = new THREE.Mesh(satGeo, satMat3);
    sat3.position.x = 2.42;
    ring3.add(sat3);
    this.satelliteMeshes.push(sat3);

    this.group.add(this.outerGimbal);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. EXPANDING SHOCKWAVE PULSE RINGS (Periodic radar wave impulse)
    // ─────────────────────────────────────────────────────────────────────────
    this.shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    for (let i = 0; i < 2; i++) {
      const swGeo = new THREE.RingGeometry(1.4, 1.43, 80);
      const swMesh = new THREE.Mesh(swGeo, this.shockwaveMat.clone());
      swMesh.rotation.x = Math.PI / 2.2;
      swMesh.scale.set(1, 1, 1);
      this.shockwaveRings.push(swMesh);
      this.group.add(swMesh);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. ACCRETION DISC PARTICLE SWARM (260 Stardust vortex motes)
    // ─────────────────────────────────────────────────────────────────────────
    this.particleSpeeds = new Float32Array(this.particleCount);
    this.particleRadii  = new Float32Array(this.particleCount);
    this.particleAngles = new Float32Array(this.particleCount);
    this.particleHeights = new Float32Array(this.particleCount);

    const motePos = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      this.particleRadii[i] = 1.7 + Math.random() * 1.3;
      this.particleAngles[i] = Math.random() * Math.PI * 2;
      this.particleSpeeds[i] = 0.25 + Math.random() * 0.45;
      this.particleHeights[i] = (Math.random() - 0.5) * 0.55;

      motePos[i * 3]     = Math.cos(this.particleAngles[i]) * this.particleRadii[i];
      motePos[i * 3 + 1] = this.particleHeights[i];
      motePos[i * 3 + 2] = Math.sin(this.particleAngles[i]) * this.particleRadii[i];
    }

    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.038,
      transparent: true,
      opacity: 0.70,
      depthWrite: false
    });
    this.orbitalNodes = new THREE.Points(moteGeo, moteMat);
    this.group.add(this.orbitalNodes);
  }

  public setPointer(ndcX: number, ndcY: number, worldX: number, worldY: number) {
    this.targetRotationY = ndcX * 0.75;
    this.targetRotationX = -ndcY * 0.75;
    this.material.uniforms.uPointer.value.set(worldX, worldY, 1.0);
  }

  public setOpacity(v: number) {
    this.targetOpacity = Math.max(0, Math.min(1, v));
  }

  public setDistortion(v: number) {
    this.targetDistortion = v;
  }

  public setAccentMix(v: number) {
    this.targetAccentMix = v;
  }

  public setTargetPosition(x: number, y: number, z: number) {
    this.targetPosition.set(x, y, z);
  }

  public setTargetScale(s: number) {
    this.targetScale.set(s, s, s);
  }

  // Trigger interactive shockwave pulse (+ accent flash, restores section values)
  // Note: no scale pop here — the core must never look like it "grows" on click.
  public dischargeImpulse() {
    const prevDistortion = this.targetDistortion;
    const prevAccent = this.targetAccentMix;
    this.targetDistortion = 2.2;
    this.targetAccentMix = Math.max(this.targetAccentMix, 0.85);
    this.shockwaveProgress[0] = 0.0;
    setTimeout(() => {
      this.targetDistortion = prevDistortion;
      this.targetAccentMix = prevAccent;
    }, 450);
  }

  public update(delta: number, elapsed: number, cameraPos: THREE.Vector3) {
    // Smooth physical position and scale interpolation
    this.group.position.lerp(this.targetPosition, 0.08);
    this.group.scale.lerp(this.targetScale, 0.08);

    // Smooth lerps for shader parameters (+ smoothed scroll energy overlay)
    this.scrollBoostTarget = Math.max(0, this.scrollBoostTarget - delta * 1.1);
    this.scrollBoost += (this.scrollBoostTarget - this.scrollBoost) * Math.min(1, delta * 6);
    const energyBoost = this.scrollBoost * 0.25;
    this.currentDistortion += (this.targetDistortion - this.currentDistortion) * 0.08;
    this.material.uniforms.uDistortion.value = this.currentDistortion + energyBoost;

    this.currentAccentMix += (this.targetAccentMix - this.currentAccentMix) * 0.08;
    this.material.uniforms.uAccentMix.value = this.currentAccentMix;

    // Smooth opacity lerp
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.material.uniforms.uOpacity.value = this.currentOpacity;

    const op = this.currentOpacity;
    this.nucleusMat.opacity = 0.85 * op;
    this.edgeMat.opacity = 0.40 * op;
    this.ringMats.forEach((m, i) => {
      m.opacity = (i === 2 ? 0.40 : 0.30) * op;
    });
    (this.orbitalNodes.material as THREE.PointsMaterial).opacity = 0.70 * op;

    this.group.visible = this.currentOpacity > 0.005;

    // Shader uniforms
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uCameraPos.value.copy(cameraPos);

    // ─────────────────────────────────────────────────────────────────────────
    // MOTION DYNAMICS: Counter-rotations & Organic Fluid Breathing
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Fluid organic core rotation with silky pointer inertia (+ smooth energy spin)
    const energySpin = this.scrollBoost * 0.5;
    this.mainMesh.rotation.y += (this.targetRotationY - this.mainMesh.rotation.y) * 0.05 + delta * (0.18 + energySpin);
    this.mainMesh.rotation.x += (this.targetRotationX - this.mainMesh.rotation.x) * 0.05 + delta * (0.10 + energySpin * 0.5);

    // 2. Outer Geodesic Cage counter-rotates slowly & breathes (energized smoothly)
    const cageEnergy = this.scrollBoost * 0.3;
    this.outerCage.rotation.y -= delta * (0.12 + cageEnergy);
    this.outerCage.rotation.z += delta * (0.07 + cageEnergy * 0.5);
    const cagePulse = 1.0 + Math.sin(elapsed * 1.8) * 0.035;
    this.outerCage.scale.set(cagePulse, cagePulse, cagePulse);

    // 3. Inner Quantum Nucleus fast spin & pulse
    this.innerNucleus.rotation.y -= delta * 0.85;
    this.innerNucleus.rotation.z += delta * 0.55;
    const nucPulse = 1.0 + Math.sin(elapsed * 3.0) * 0.08;
    this.innerNucleus.scale.set(nucPulse, nucPulse, nucPulse);

    // 4. Outer Gimbals: Multi-axis gyroscopic rotation
    this.outerGimbal.children[0].rotation.z += delta * 0.14;
    this.outerGimbal.children[1].rotation.x += delta * 0.10;
    this.outerGimbal.children[2].rotation.y -= delta * 0.16;

    // Orbiting satellites rotate along rings
    this.satelliteMeshes.forEach((sat, i) => {
      sat.position.y = Math.sin(elapsed * (1.5 + i * 0.4)) * 0.12;
    });

    // 5. Shockwave Pulse Expansion
    this.shockwaveRings.forEach((sw, idx) => {
      this.shockwaveProgress[idx] += delta * 0.45;
      if (this.shockwaveProgress[idx] > 1.0) {
        this.shockwaveProgress[idx] = 0.0;
      }
      const prog = this.shockwaveProgress[idx];
      const scale = 1.0 + prog * 1.4; // Expands from 1.0 -> 2.4
      sw.scale.set(scale, scale, scale);
      (sw.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1.0 - prog) * 0.35 * op);
    });

    // 6. Accretion Disc Vortex Particles
    const posAttr = this.orbitalNodes.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      this.particleAngles[i] += delta * this.particleSpeeds[i];
      const r = this.particleRadii[i] + Math.sin(elapsed * 1.2 + i) * 0.08;
      posArray[i * 3]     = Math.cos(this.particleAngles[i]) * r;
      posArray[i * 3 + 1] = this.particleHeights[i] + Math.sin(elapsed * 2.0 + this.particleAngles[i]) * 0.06;
      posArray[i * 3 + 2] = Math.sin(this.particleAngles[i]) * r;
    }
    posAttr.needsUpdate = true;
  }
}

