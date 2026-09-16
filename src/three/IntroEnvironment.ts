import * as THREE from 'three';

// ─── IntroEnvironment \u2014 depth geometry, hairlines, atmosphere ───────────────────
// These live only during the intro and are disposed on hand-off.
export class IntroEnvironment {
  public group: THREE.Group;

  private hairlines: THREE.Mesh[] = [];
  private depthLines: THREE.LineSegments[] = [];
  private atmosphereMotes!: THREE.Points;

  private hairlineMats: THREE.MeshBasicMaterial[] = [];
  private depthLineMats: THREE.LineBasicMaterial[] = [];

  private targetOpacity = 0;
  private currentOpacity = 0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this.buildHairlines();
    this.buildDepthCross();
    this.buildAtmosphericMotes();
  }

  // Thin horizontal depth-suggestion hairlines
  private buildHairlines() {
    const yPositions = [-0.05, 0.0, 0.05];
    const widths     = [12, 16, 12];
    yPositions.forEach((y, i) => {
      const geo = new THREE.PlaneGeometry(widths[i], 0.002);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, y, -2.5 - i * 1.5);
      this.group.add(mesh);
      this.hairlines.push(mesh);
      this.hairlineMats.push(mat);
    });
  }

  // Precision cross / corner markers in deep space
  private buildDepthCross() {
    const positions = [
      new THREE.Vector3(-5.5, -3.0, -4),
      new THREE.Vector3( 5.5, -3.0, -6),
      new THREE.Vector3(-5.5,  3.2, -5),
      new THREE.Vector3( 5.5,  3.2, -7),
    ];

    positions.forEach((pos) => {
      const size = 0.18;
      const pts = [
        new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0),
        new THREE.Vector3(0, -size, 0), new THREE.Vector3(0, size, 0),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const line = new THREE.LineSegments(geo, mat);
      line.position.copy(pos);
      this.group.add(line);
      this.depthLines.push(line);
      this.depthLineMats.push(mat);
    });
  }

  // Very sparse background atmosphere — NOT for hero section ambient
  private buildAtmosphericMotes() {
    const count = 80;
    const pos   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = -3 - Math.random() * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.atmosphereMotes = new THREE.Points(geo, mat);
    this.group.add(this.atmosphereMotes);
  }

  public setReveal(v: number) {
    this.targetOpacity = Math.max(0, Math.min(1, v));
  }

  public update(elapsed: number) {
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.05;

    this.hairlineMats.forEach((mat, i) => {
      mat.opacity = this.currentOpacity * (i === 1 ? 0.055 : 0.03);
    });
    this.depthLineMats.forEach((mat) => {
      mat.opacity = this.currentOpacity * 0.28;
    });
    (this.atmosphereMotes.material as THREE.PointsMaterial).opacity = this.currentOpacity * 0.18;

    // Slow atmospheric rotation
    this.group.rotation.y = Math.sin(elapsed * 0.06) * 0.025;
  }

  public dispose() {
    this.group.parent?.remove(this.group);
    this.hairlineMats.forEach(m => m.dispose());
    this.depthLineMats.forEach(m => m.dispose());
    (this.atmosphereMotes.material as THREE.PointsMaterial).dispose();
    this.atmosphereMotes.geometry.dispose();
    this.hairlines.forEach(m => m.geometry.dispose());
    this.depthLines.forEach(l => l.geometry.dispose());
  }
}