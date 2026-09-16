import * as THREE from 'three';
import { coreVertexShader, coreFragmentShader } from './shaders/core.vert';

export class ProductCore {
  public group: THREE.Group;
  public mainMesh: THREE.Mesh;
  public innerNucleus: THREE.Mesh;
  public outerGimbal: THREE.Group;
  public orbitalNodes: THREE.Points;
  public reticleGroup: THREE.Group;
  public material: THREE.ShaderMaterial;

  private nucleusMat: THREE.MeshBasicMaterial;
  private edgeMat: THREE.LineBasicMaterial;
  private ringMat1: THREE.MeshBasicMaterial;
  private ringMat2: THREE.MeshBasicMaterial;
  private ringMat3: THREE.MeshBasicMaterial;
  private reticleMat: THREE.LineBasicMaterial;
  private plateEdges: THREE.LineSegments;

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

  constructor() {
    this.group = new THREE.Group();
    this.group.position.copy(this.targetPosition);

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SIGNATURE OBSIDIAN & TITANIUM FACETED SHELL
    // Clean, precision-cut polyhedral facets (no deformed noisy bumps)
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
      depthWrite: true,
      side: THREE.DoubleSide
    });

    // Precision Truncated Icosahedron / Geodesic Facet Core
    const shellGeo = new THREE.IcosahedronGeometry(1.35, 1);
    this.mainMesh = new THREE.Mesh(shellGeo, this.material);
    this.group.add(this.mainMesh);

    // Razor-Sharp Geometric Seam Edges (Laser Bevel Lines)
    const edgeGeo = new THREE.EdgesGeometry(shellGeo);
    this.edgeMat = new THREE.LineBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      opacity: 0.55
    });
    this.plateEdges = new THREE.LineSegments(edgeGeo, this.edgeMat);
    this.mainMesh.add(this.plateEdges);

    // ─────────────────────────────────────────────────────────────────────────
    // 2. INNER QUANTUM NUCLEUS (Luminous Core Engine)
    // ─────────────────────────────────────────────────────────────────────────
    const nucGeo = new THREE.OctahedronGeometry(0.65, 0);
    this.nucleusMat = new THREE.MeshBasicMaterial({
      color: 0xd7ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    this.innerNucleus = new THREE.Mesh(nucGeo, this.nucleusMat);
    this.group.add(this.innerNucleus);

    // ─────────────────────────────────────────────────────────────────────────
    // 3. AEROSPACE GYROSCOPIC GIMBAL RINGS (Swiss Watch / Quantum Calibrator)
    // ─────────────────────────────────────────────────────────────────────────
    this.outerGimbal = new THREE.Group();

    // Equatorial Ring with Precision Ticks
    const ringGeo1 = new THREE.RingGeometry(1.85, 1.87, 80);
    this.ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x888888,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const ring1 = new THREE.Mesh(ringGeo1, this.ringMat1);

    // Meridian Ring
    const ringGeo2 = new THREE.RingGeometry(2.05, 2.07, 80);
    this.ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xaaaaaa,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22
    });
    const ring2 = new THREE.Mesh(ringGeo2, this.ringMat2);
    ring2.rotation.x = Math.PI / 2;

    // Polar Ring with Lime Accent Highlight
    const ringGeo3 = new THREE.RingGeometry(2.25, 2.27, 80);
    this.ringMat3 = new THREE.MeshBasicMaterial({
      color: 0xd7ff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });
    const ring3 = new THREE.Mesh(ringGeo3, this.ringMat3);
    ring3.rotation.y = Math.PI / 3;

    this.outerGimbal.add(ring1);
    this.outerGimbal.add(ring2);
    this.outerGimbal.add(ring3);
    this.group.add(this.outerGimbal);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. PRECISION HUD CROSSHAIR RETICLE
    // ─────────────────────────────────────────────────────────────────────────
    this.reticleGroup = new THREE.Group();
    const reticlePositions = new Float32Array([
      -0.4, 0, 0,  0.4, 0, 0,
      0, -0.4, 0,  0, 0.4, 0,
      0, 0, -0.4,  0, 0, 0.4
    ]);
    const reticleGeo = new THREE.BufferGeometry();
    reticleGeo.setAttribute('position', new THREE.BufferAttribute(reticlePositions, 3));
    this.reticleMat = new THREE.LineBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      opacity: 0.65
    });
    const reticleLines = new THREE.LineSegments(reticleGeo, this.reticleMat);
    this.reticleGroup.add(reticleLines);
    this.group.add(this.reticleGroup);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. ORBITAL QUANTUM MOTES (Accretion Disc Particles)
    // ─────────────────────────────────────────────────────────────────────────
    const moteCount = 70;
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 1.6 + Math.random() * 0.9;
      motePos[i * 3] = Math.cos(angle) * dist;
      motePos[i * 3 + 1] = (Math.random() - 0.5) * 0.35;
      motePos[i * 3 + 2] = Math.sin(angle) * dist;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.035,
      transparent: true,
      opacity: 0.65
    });
    this.orbitalNodes = new THREE.Points(moteGeo, moteMat);
    this.group.add(this.orbitalNodes);
  }

  public setPointer(ndcX: number, ndcY: number, worldX: number, worldY: number) {
    this.targetRotationY = ndcX * 0.65;
    this.targetRotationX = -ndcY * 0.65;
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

  public update(delta: number, elapsed: number, cameraPos: THREE.Vector3) {
    // Smooth physical position and scale interpolation
    this.group.position.lerp(this.targetPosition, 0.08);
    this.group.scale.lerp(this.targetScale, 0.08);

    // Smooth lerps for shader parameters
    this.currentDistortion += (this.targetDistortion - this.currentDistortion) * 0.08;
    this.material.uniforms.uDistortion.value = this.currentDistortion;

    this.currentAccentMix += (this.targetAccentMix - this.currentAccentMix) * 0.08;
    this.material.uniforms.uAccentMix.value = this.currentAccentMix;

    // Smooth opacity lerp
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.material.uniforms.uOpacity.value = this.currentOpacity;

    const op = this.currentOpacity;
    this.nucleusMat.opacity = 0.85 * op;
    this.edgeMat.opacity = 0.55 * op;
    this.ringMat1.opacity = 0.3 * op;
    this.ringMat2.opacity = 0.22 * op;
    this.ringMat3.opacity = 0.35 * op;
    this.reticleMat.opacity = 0.65 * op;
    (this.orbitalNodes.material as THREE.PointsMaterial).opacity = 0.65 * op;

    this.group.visible = this.currentOpacity > 0.005;

    // Shader uniforms
    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uCameraPos.value.copy(cameraPos);

    // ─────────────────────────────────────────────────────────────────────────
    // MOTION DYNAMICS: Gyroscopic counter-rotations
    // ─────────────────────────────────────────────────────────────────────────
    // Main shell rotation with pointer inertia
    this.mainMesh.rotation.y += (this.targetRotationY - this.mainMesh.rotation.y) * 0.05 + delta * 0.2;
    this.mainMesh.rotation.x += (this.targetRotationX - this.mainMesh.rotation.x) * 0.05 + delta * 0.12;

    // Inner nucleus fast counter-spin
    this.innerNucleus.rotation.y -= delta * 0.7;
    this.innerNucleus.rotation.z += delta * 0.4;
    const pulse = 1.0 + Math.sin(elapsed * 2.5) * 0.06;
    this.innerNucleus.scale.set(pulse, pulse, pulse);

    // Outer Gimbals: Multi-axis precision rotation
    this.outerGimbal.children[0].rotation.z += delta * 0.12;
    this.outerGimbal.children[1].rotation.x += delta * 0.09;
    this.outerGimbal.children[2].rotation.y -= delta * 0.15;

    // Reticle micro-float
    this.reticleGroup.rotation.z = Math.sin(elapsed * 0.8) * 0.1;
    this.reticleGroup.position.z = Math.sin(elapsed * 2.0) * 0.05;

    // Orbital dust slow rotation
    this.orbitalNodes.rotation.y += delta * 0.25;
  }
}
