import * as THREE from 'three';

export interface GameCardData {
  id: string;
  title: string;
  tag: string;
  score: string;
  price: string;
  specs: string;
  storage: string;
  accent: string;
}

export class GamePlanes {
  public group: THREE.Group;
  public targetOpacity = 0.0;
  public currentOpacity = 0.0;
  public activeIndex = 0;

  private pointer = new THREE.Vector2(0, 0);
  private planes: {
    group: THREE.Group;
    targetPos: THREE.Vector3;
    targetRot: THREE.Vector3;
    targetScale: THREE.Vector3;
    targetAlpha: number;
    currentAlpha: number;
    edgeLine: THREE.LineSegments;
    edgeMat: THREE.LineBasicMaterial;
    data: GameCardData;
  }[] = [];

  // Spatial connecting network between cards
  private networkLines!: THREE.LineSegments;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;
    this.initPlanes();
    this.initNetwork();
  }

  public setOpacity(v: number) {
    this.targetOpacity = Math.max(0, Math.min(1, v));
  }

  public setPointer(ndcX: number, ndcY: number) {
    this.pointer.set(ndcX, ndcY);
  }

  public setActiveCard(index: number) {
    if (index < 0 || index >= this.planes.length) return;
    this.activeIndex = index;
    this.recalculateSlots();
  }

  private createCardTexture(data: GameCardData): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 860;
    const ctx = canvas.getContext('2d')!;

    // Ultra-deep titanium background
    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, 0, 640, 860);

    // Fine tech isometric grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 640; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 860);
      ctx.stroke();
    }
    for (let j = 0; j < 860; j += 32) {
      ctx.beginPath();
      ctx.moveTo(0, j); ctx.lineTo(640, j);
      ctx.stroke();
    }

    // Outer framing border with corner cutouts
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 600, 820);

    // Corner brackets
    ctx.strokeStyle = '#d7ff00';
    ctx.lineWidth = 4;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(20, 50); ctx.lineTo(20, 20); ctx.lineTo(50, 20); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(590, 20); ctx.lineTo(620, 20); ctx.lineTo(620, 50); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(20, 810); ctx.lineTo(20, 840); ctx.lineTo(50, 840); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(590, 840); ctx.lineTo(620, 840); ctx.lineTo(620, 810); ctx.stroke();

    // Header badge
    ctx.fillStyle = '#7e7e7e';
    ctx.font = '600 18px monospace';
    ctx.fillText(`MANIFEST // ${data.tag}`, 46, 72);

    // Game Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 36px "Inter", sans-serif';
    ctx.fillText(data.title, 46, 126);

    // Circular Score Ring
    const centerX = 515;
    const centerY = 98;
    const radius = 38;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#d7ff00';
    ctx.lineWidth = 5;
    ctx.beginPath();
    const scoreVal = parseInt(data.score) || 90;
    const scoreAngle = (scoreVal / 100) * Math.PI * 2 - Math.PI / 2;
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, scoreAngle);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(data.score, centerX, centerY + 8);
    ctx.textAlign = 'left';

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(46, 170); ctx.lineTo(594, 170);
    ctx.stroke();

    // Specification Badges
    ctx.fillStyle = '#9e9e9e';
    ctx.font = '600 17px monospace';
    ctx.fillText(`STORE PROTOCOL:`, 46, 215);
    ctx.fillStyle = '#d7ff00';
    ctx.fillText(`STEAM API // VERIFIED 0xC`, 230, 215);

    ctx.fillStyle = '#9e9e9e';
    ctx.fillText(`VALUATION:`, 46, 255);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.price, 230, 255);

    ctx.fillStyle = '#9e9e9e';
    ctx.fillText(`STORAGE REQ:`, 46, 295);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.storage, 230, 295);

    ctx.fillStyle = '#9e9e9e';
    ctx.fillText(`GPU TARGET:`, 46, 335);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.specs, 230, 335);

    // Decorative Hardware Visual Waveform
    ctx.strokeStyle = 'rgba(215, 255, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 46; x < 594; x += 8) {
      const freq = data.title.length * 0.005;
      const y = 490 + Math.sin(x * 0.04 + freq) * 38 + Math.cos(x * 0.015) * 18;
      if (x === 46) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Telemetry Block Fill
    ctx.fillStyle = 'rgba(215, 255, 0, 0.04)';
    ctx.fillRect(46, 560, 548, 180);
    ctx.strokeStyle = 'rgba(215, 255, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(46, 560, 548, 180);

    ctx.fillStyle = '#7e7e7e';
    ctx.font = '500 15px monospace';
    ctx.fillText('DIRECT DLL HOOK // STEAMWORKS PIPE READY', 64, 600);
    ctx.fillText(`APPID: ${data.id} // MANIFEST HUB AUTO-SYNC`, 64, 635);
    ctx.fillText('SURGICAL TOML INJECTION // ZERO RESTART', 64, 670);
    ctx.fillText('LOW RAM MEMORY FOOTPRINT // NATIVE TAURI 2', 64, 705);

    // Footer
    ctx.fillStyle = '#555555';
    ctx.font = '500 14px monospace';
    ctx.fillText('MICAH 0xC ARCHIVAL EXHIBITION // REAL-TIME HUD', 46, 796);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  private initPlanes() {
    const cardsData: GameCardData[] = [
      {
        id: "1091500",
        title: "CYBERPUNK 2077",
        tag: "STEAM // 1091500",
        score: "88",
        price: "$59.99 USD",
        specs: "RTX 2060 / i7-6700",
        storage: "70 GB SSD",
        accent: "#d7ff00"
      },
      {
        id: "1245620",
        title: "ELDEN RING",
        tag: "STEAM // 1245620",
        score: "94",
        price: "$59.99 USD",
        specs: "GTX 1060 3GB / i5-8400",
        storage: "60 GB STORAGE",
        accent: "#d7ff00"
      },
      {
        id: "1086940",
        title: "BALDUR'S GATE 3",
        tag: "STEAM // 1086940",
        score: "96",
        price: "$59.99 USD",
        specs: "RTX 2060 Super / i7-8700K",
        storage: "150 GB SSD",
        accent: "#ffffff"
      },
      {
        id: "367520",
        title: "HOLLOW KNIGHT",
        tag: "STEAM // 367520",
        score: "97",
        price: "$14.99 USD",
        specs: "Intel Core 2 Duo / 4GB RAM",
        storage: "9 GB AVAILABLE",
        accent: "#ffffff"
      }
    ];

    const planeGeo = new THREE.PlaneGeometry(1.85, 2.55);

    cardsData.forEach((data, index) => {
      const texture = this.createCardTexture(data);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });

      const cardGroup = new THREE.Group();
      const mesh = new THREE.Mesh(planeGeo, mat);
      cardGroup.add(mesh);

      // Glowing edge outline
      const edges = new THREE.EdgesGeometry(planeGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: index === 0 ? 0xd7ff00 : 0x666666,
        transparent: true,
        opacity: index === 0 ? 0.85 : 0.45
      });
      const edgeLine = new THREE.LineSegments(edges, edgeMat);
      cardGroup.add(edgeLine);

      this.group.add(cardGroup);

      this.planes.push({
        group: cardGroup,
        targetPos: new THREE.Vector3(),
        targetRot: new THREE.Vector3(),
        targetScale: new THREE.Vector3(1, 1, 1),
        targetAlpha: 1.0,
        currentAlpha: 0.0,
        edgeLine,
        edgeMat,
        data
      });
    });

    this.recalculateSlots();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3D Spatial Deck Slot Calculation
  // Spreads 4 cards across the viewport: active card near center,
  // background cards fan right, left flank anchors the composition.
  // ─────────────────────────────────────────────────────────────────────────────
  private recalculateSlots() {
    const total = this.planes.length;

    // Slot definitions — centered around X≈0.5 so nothing crowds one edge.
    // Camera lookAt is (0,0,0), cards are visible left-to-right.
    const slotOffsets = [
      // Slot 0: Active — center-stage, slight right offset, closest to camera
      { pos: new THREE.Vector3(0.4,  0.05,  0.7),  rot: new THREE.Vector3(0.03, -0.18, -0.02), scale: 1.08, alpha: 1.0,  isHighlight: true  },
      // Slot 1: Mid-right — receding in depth, tilted right
      { pos: new THREE.Vector3(2.0,  0.30, -0.6),  rot: new THREE.Vector3(0.05, -0.36,  0.03),  scale: 0.92, alpha: 0.82, isHighlight: false },
      // Slot 2: Deep-right background — furthest, most reclined
      { pos: new THREE.Vector3(3.2,  0.70, -1.7),  rot: new THREE.Vector3(0.07, -0.46,  0.05),  scale: 0.82, alpha: 0.60, isHighlight: false },
      // Slot 3: Left flank — balances the composition, slightly behind active
      { pos: new THREE.Vector3(-1.4, -0.30, -0.5), rot: new THREE.Vector3(0.02,  0.20, -0.04),  scale: 0.88, alpha: 0.72, isHighlight: false }
    ];

    this.planes.forEach((plane, i) => {
      // Offset relative to active card
      const slotIndex = (i - this.activeIndex + total) % total;
      const slot = slotOffsets[slotIndex];

      plane.targetPos.copy(slot.pos);
      plane.targetRot.copy(slot.rot);
      plane.targetScale.set(slot.scale, slot.scale, slot.scale);
      plane.targetAlpha = slot.alpha;

      // Highlight active card edge in electric lime
      plane.edgeMat.color.setHex(slot.isHighlight ? 0xd7ff00 : 0x555555);
      plane.edgeMat.opacity = slot.isHighlight ? 0.9 : 0.4;
    });
  }

  // Laser data threads linking the cards in 3D space
  private initNetwork() {
    const linePositions = new Float32Array(4 * 3 * 2);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xd7ff00,
      transparent: true,
      opacity: 0.35
    });
    this.networkLines = new THREE.LineSegments(lineGeo, lineMat);
    this.group.add(this.networkLines);
  }

  public update(delta: number, elapsed: number, _scrollProgress: number) {
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * 0.08;
    this.group.visible = this.currentOpacity > 0.005;

    // Mouse tilt parallax across the whole 3D deck
    const mouseTiltX = -this.pointer.y * 0.15;
    const mouseTiltY =  this.pointer.x * 0.18;

    const positions: number[] = [];

    this.planes.forEach((plane, i) => {
      // Floating oscillation unique per card
      const floatY = Math.sin(elapsed * 1.3 + i * 1.6) * 0.07;
      const floatRotZ = Math.sin(elapsed * 0.8 + i * 1.2) * 0.015;

      const destPos = new THREE.Vector3(
        plane.targetPos.x,
        plane.targetPos.y + floatY,
        plane.targetPos.z
      );

      // Smooth inertial interpolation
      plane.group.position.lerp(destPos, 0.07);
      plane.group.scale.lerp(plane.targetScale, 0.07);

      plane.group.rotation.x += (plane.targetRot.x + mouseTiltX - plane.group.rotation.x) * 0.06;
      plane.group.rotation.y += (plane.targetRot.y + mouseTiltY - plane.group.rotation.y) * 0.06;
      plane.group.rotation.z += (plane.targetRot.z + floatRotZ - plane.group.rotation.z) * 0.06;

      // Smooth opacity
      plane.currentAlpha += (plane.targetAlpha - plane.currentAlpha) * 0.08;
      const finalAlpha = plane.currentAlpha * this.currentOpacity;

      plane.group.traverse((obj) => {
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material as THREE.Material;
          mat.transparent = true;
          mat.opacity = finalAlpha;
        }
      });

      positions.push(plane.group.position.x, plane.group.position.y, plane.group.position.z);
    });

    // Update connecting laser threads between adjacent cards
    const linePosAttr = this.networkLines.geometry.getAttribute('position') as THREE.BufferAttribute;
    const lineArray = linePosAttr.array as Float32Array;

    if (positions.length >= 12) {
      // Connect 0-1, 1-2, 2-3, 3-0
      const pairs = [[0, 1], [1, 2], [2, 3], [3, 0]];
      let ptr = 0;
      pairs.forEach(([a, b]) => {
        lineArray[ptr++] = positions[a * 3];
        lineArray[ptr++] = positions[a * 3 + 1];
        lineArray[ptr++] = positions[a * 3 + 2];
        lineArray[ptr++] = positions[b * 3];
        lineArray[b * 3 + 1]; // read
        lineArray[ptr++] = positions[b * 3 + 1];
        lineArray[ptr++] = positions[b * 3 + 2];
      });
      linePosAttr.needsUpdate = true;
    }
  }
}
