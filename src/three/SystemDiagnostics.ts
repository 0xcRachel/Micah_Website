import * as THREE from 'three';

export class SystemDiagnostics {
  public group: THREE.Group;
  public targetOpacity = 0.0;
  public currentOpacity = 0.0;
  private radarPlane: THREE.Mesh;
  private rings: THREE.LineLoop[] = [];
  private pointCloud: THREE.Points;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    // Diagnostic Concentric Rings
    const ringRadii = [1.2, 1.8, 2.5, 3.2];
    ringRadii.forEach((r, idx) => {
      const segments = 64;
      const positions = new Float32Array(segments * 3);
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        positions[i * 3] = Math.cos(theta) * r;
        positions[i * 3 + 1] = Math.sin(theta) * r;
        positions[i * 3 + 2] = 0;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: idx === 1 ? 0xd7ff00 : 0x555555,
        transparent: true,
        opacity: idx === 1 ? 0.6 : 0.25
      });
      const ring = new THREE.LineLoop(geo, mat);
      this.group.add(ring);
      this.rings.push(ring);
    });

    // Radar Scanning Sweep
    const sweepGeo = new THREE.CircleGeometry(3.2, 32, 0, Math.PI / 4);
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    this.radarPlane = new THREE.Mesh(sweepGeo, sweepMat);
    this.group.add(this.radarPlane);

    // Telemetry Particle Grid (Analytical Point Matrix)
    const particleCount = 280;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const rad = 0.5 + Math.random() * 3.0;
      pPositions[i * 3] = Math.cos(theta) * rad;
      pPositions[i * 3 + 1] = Math.sin(theta) * rad;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.65
    });
    this.pointCloud = new THREE.Points(pGeo, pMat);
    this.group.add(this.pointCloud);
  }

  public setOpacity(v: number) {
    this.targetOpacity = Math.max(0, Math.min(1, v));
  }

  public update(delta: number, elapsed: number) {
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.group.visible = this.currentOpacity > 0.005;

    // Modulate opacity across children
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material as THREE.Material;
        mat.transparent = true;
      }
    });

    // Rotate radar plane
    this.radarPlane.rotation.z -= delta * 1.4;

    // Counter-rotate concentric rings
    this.rings.forEach((ring, i) => {
      ring.rotation.z += delta * (0.2 + i * 0.1) * (i % 2 === 0 ? 1 : -1);
      ring.rotation.x = Math.sin(elapsed * 0.5 + i) * 0.15;
    });

    // Subtle drift of point cloud
    this.pointCloud.rotation.z += delta * 0.08;
    this.group.rotation.y = Math.cos(elapsed * 0.4) * 0.2;
  }
}
