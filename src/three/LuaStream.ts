import * as THREE from 'three';

export class LuaStream {
  public group: THREE.Group;
  public targetOpacity = 0.0;
  public currentOpacity = 0.0;
  private curve: THREE.CatmullRomCurve3;
  private tubeMesh: THREE.Line;
  private particles: THREE.Points;
  private particleCount = 180;
  private progressArray: Float32Array;
  private markerGroups: THREE.Group[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    // Spline path from Manifest Hub to Steam config
    const points = [
      new THREE.Vector3(-3.5, 2.0, -1.0), // Input / Manifest Hub
      new THREE.Vector3(-1.8, 0.8, 0.5),  // Script Fetch & Tokenize
      new THREE.Vector3(0.0, -0.5, 1.0),  // Surgical TOML Edit
      new THREE.Vector3(1.8, 0.4, 0.2),   // Steam File Watcher
      new THREE.Vector3(3.5, -1.8, -0.8)  // Live Hot Reload (Active)
    ];

    this.curve = new THREE.CatmullRomCurve3(points);

    // Render guide spline line
    const pathPoints = this.curve.getPoints(100);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.35
    });
    this.tubeMesh = new THREE.Line(lineGeo, lineMat);
    this.group.add(this.tubeMesh);

    // Particle flow
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    this.progressArray = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      this.progressArray[i] = i / this.particleCount;
      const pt = this.curve.getPoint(this.progressArray[i]);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xd7ff00,
      size: 0.05,
      transparent: true,
      opacity: 0.85
    });
    this.particles = new THREE.Points(pGeo, pMat);
    this.group.add(this.particles);

    // ─── Pipeline stage marker nodes ─────────────────────────────────────────
    // Each node: octahedron edge-frame (clean diamond, no face diagonals)
    // + flat torus equatorial ring + rotation in update()
    points.forEach((pt, idx) => {
      const nodeGroup = new THREE.Group();
      nodeGroup.position.copy(pt);

      const isActive = idx === 4;
      const color    = isActive ? 0xd7ff00 : 0x777777;
      const size     = isActive ? 0.16 : 0.11;

      // ── Octahedron as clean edge-lines (no mesh diagonals) ──────────────
      const octaGeo  = new THREE.OctahedronGeometry(size, 0);
      const edgesGeo = new THREE.EdgesGeometry(octaGeo);
      const edgesMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: isActive ? 0.95 : 0.60
      });
      const diamond = new THREE.LineSegments(edgesGeo, edgesMat);
      nodeGroup.add(diamond);

      // ── Equatorial ring (horizontal plane) ───────────────────────────────
      const ringGeo = new THREE.TorusGeometry(size * 1.9, 0.006, 4, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: isActive ? 0.55 : 0.28
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2; // lay flat
      nodeGroup.add(ring);

      // ── Active node: outer pulse ring ────────────────────────────────────
      if (isActive) {
        const outerGeo = new THREE.TorusGeometry(size * 3.2, 0.004, 4, 64);
        const outerMat = new THREE.MeshBasicMaterial({
          color: 0xd7ff00,
          transparent: true,
          opacity: 0.20
        });
        const outerRing = new THREE.Mesh(outerGeo, outerMat);
        outerRing.rotation.x = Math.PI / 2;
        nodeGroup.add(outerRing);

        // Vertical accent ring (tilted 90°)
        const vertGeo = new THREE.TorusGeometry(size * 1.9, 0.003, 4, 48);
        const vertMat = new THREE.MeshBasicMaterial({
          color: 0xd7ff00,
          transparent: true,
          opacity: 0.35
        });
        const vertRing = new THREE.Mesh(vertGeo, vertMat);
        vertRing.rotation.z = Math.PI / 2;
        nodeGroup.add(vertRing);
      }

      this.markerGroups.push(nodeGroup);
      this.group.add(nodeGroup);
    });
  }

  public setOpacity(v: number) {
    this.targetOpacity = Math.max(0, Math.min(1, v));
  }

  public update(delta: number) {
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.group.visible = this.currentOpacity > 0.005;

    // Update particle opacity
    (this.particles.material as THREE.PointsMaterial).opacity = 0.85 * this.currentOpacity;

    const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      this.progressArray[i] += delta * 0.22;
      if (this.progressArray[i] > 1.0) {
        this.progressArray[i] = 0;
      }
      const pt = this.curve.getPoint(this.progressArray[i]);
      positions[i * 3]     = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }
    posAttr.needsUpdate = true;

    // Rotate each marker node — active spins faster
    this.markerGroups.forEach((mg, idx) => {
      const isActive = idx === 4;
      mg.rotation.y += delta * (isActive ? 1.1 : 0.55);
      mg.rotation.x += delta * (isActive ? 0.4 : 0.2);
    });
  }
}

