import * as THREE from 'three';

export class SteamNetwork {
  public group: THREE.Group;
  public targetOpacity = 0.0;
  public currentOpacity = 0.0;
  private nodes: THREE.Mesh[] = [];
  private lines: THREE.LineSegments;
  private pulses: { mesh: THREE.Mesh; startPos: THREE.Vector3; endPos: THREE.Vector3; progress: number; speed: number }[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    // Node layout
    const nodeCoords = [
      new THREE.Vector3(0, 0, 0),        // Center: Micah Core Hook
      new THREE.Vector3(-2.8, 1.4, -0.5),// Steam Process Tree
      new THREE.Vector3(2.8, 1.2, -0.8), // DLL Injection Target
      new THREE.Vector3(-2.2, -1.8, 0.4),// micah_mode.toml
      new THREE.Vector3(2.4, -1.6, 0.2), // Manifest Hub Sync
      new THREE.Vector3(0, 2.6, 0.5)     // Hot-Reload File Watcher
    ];

    const nodeGeo = new THREE.OctahedronGeometry(0.24, 0);

    nodeCoords.forEach((pos, idx) => {
      const isCenter = idx === 0;
      const mat = new THREE.MeshBasicMaterial({
        color: isCenter ? 0xd7ff00 : 0xcccccc,
        wireframe: true,
        transparent: true,
        opacity: 0.85
      });
      const node = new THREE.Mesh(nodeGeo, mat);
      node.position.copy(pos);
      this.group.add(node);
      this.nodes.push(node);
    });

    // Connection network lines
    const linePositions: number[] = [];
    for (let i = 1; i < nodeCoords.length; i++) {
      // Connect center to all satellites
      linePositions.push(nodeCoords[0].x, nodeCoords[0].y, nodeCoords[0].z);
      linePositions.push(nodeCoords[i].x, nodeCoords[i].y, nodeCoords[i].z);

      // Connect perimeter neighbours
      const next = i === nodeCoords.length - 1 ? 1 : i + 1;
      linePositions.push(nodeCoords[i].x, nodeCoords[i].y, nodeCoords[i].z);
      linePositions.push(nodeCoords[next].x, nodeCoords[next].y, nodeCoords[next].z);
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.45
    });
    this.lines = new THREE.LineSegments(lineGeo, lineMat);
    this.group.add(this.lines);

    // Dynamic data packets traveling along lines
    const pulseGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xd7ff00, transparent: true, opacity: 0.9 });

    for (let i = 1; i < nodeCoords.length; i++) {
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      this.group.add(pulse);
      this.pulses.push({
        mesh: pulse,
        startPos: nodeCoords[0],
        endPos: nodeCoords[i],
        progress: Math.random(),
        speed: 0.4 + Math.random() * 0.4
      });
    }
  }

  public setOpacity(v: number) {
    this.targetOpacity = Math.max(0, Math.min(1, v));
  }

  public update(delta: number, elapsed: number) {
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.group.visible = this.currentOpacity > 0.005;

    // Update material opacities
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material as THREE.Material;
        mat.transparent = true;
        mat.opacity = this.currentOpacity * 0.85;
      }
    });

    // Rotate nodes
    this.nodes.forEach((node, i) => {
      node.rotation.x += delta * (0.8 + i * 0.2);
      node.rotation.y += delta * (0.6 + i * 0.1);
    });

    // Animate data pulses
    this.pulses.forEach((p) => {
      p.progress += delta * p.speed;
      if (p.progress > 1.0) {
        p.progress = 0;
      }
      p.mesh.position.lerpVectors(p.startPos, p.endPos, p.progress);
    });

    // Slow orbital rotation of entire network
    this.group.rotation.y = Math.sin(elapsed * 0.3) * 0.25;
  }
}
