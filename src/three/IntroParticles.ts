import * as THREE from 'three';

// ─── GPU Particle Vertex Shader ────────────────────────────────────────────────
const particleVertexShader = /* glsl */`
attribute vec3 aInitialPos;
attribute vec3 aTargetPos;
attribute float aSize;
attribute float aSpeed;
attribute float aPhase;
attribute float aIsSignal;

uniform float uTime;
uniform float uProgress;
uniform vec2 uPointer;
uniform float uVelocity;

varying float vIsSignal;
varying float vAlpha;
varying float vDepth;

void main() {
  // Attraction phase: 0.25 -> 0.75 of total progress
  float attraction = smoothstep(0.2, 0.75, uProgress);

  vec3 pos = mix(aInitialPos, aTargetPos, attraction);

  // Continuous orbital drift (different speed per particle)
  float t = uTime * aSpeed + aPhase;
  float orbitR = length(aTargetPos.xz) * 0.025;
  pos.x += cos(t * 1.3) * orbitR;
  pos.z += sin(t * 1.1) * orbitR;
  pos.y += sin(t * 0.7) * orbitR * 0.5;

  // Mouse repulsion field
  vec2 toPointer = pos.xy - uPointer * 3.8;
  float dist2 = max(0.25, dot(toPointer, toPointer));
  float repulse = uVelocity * 0.012 / dist2;
  pos.xy += normalize(toPointer) * repulse;

  vIsSignal = aIsSignal;
  // Depth-based alpha and a breathing cycle
  vAlpha = attraction * (0.5 + 0.5 * sin(t * 1.8 + aPhase));
  vDepth = 1.0 / (1.0 + abs(pos.z) * 0.15);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Size: base + breathing + perspective divide
  float sz = aSize * (1.0 + 0.25 * sin(uTime * aSpeed * 2.1 + aPhase));
  gl_PointSize = sz * (280.0 / -mvPosition.z);
}
`;

// ─── GPU Particle Fragment Shader ─────────────────────────────────────────────
const particleFragmentShader = /* glsl */`
varying float vIsSignal;
varying float vAlpha;
varying float vDepth;

void main() {
  // Soft disc — discard corners
  vec2 uv = gl_PointCoord - 0.5;
  float dist = length(uv);
  if (dist > 0.5) discard;

  float softEdge = 1.0 - smoothstep(0.2, 0.5, dist);
  float alpha = softEdge * vAlpha * vDepth * 0.75;

  // White for normal particles, lone lime signal particle
  vec3 color = mix(
    vec3(1.0, 1.0, 1.0),
    vec3(0.843, 1.0, 0.0),
    vIsSignal
  );

  gl_FragColor = vec4(color, alpha);
}
`;

// ─── IntroParticles ────────────────────────────────────────────────────────────
export class IntroParticles {
  public mesh: THREE.Points;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;
  private isMobile: boolean;

  constructor(private scene: THREE.Scene) {
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    const count = this.isMobile ? 160 : 600;
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime:     { value: 0 },
        uProgress: { value: 0 },
        uPointer:  { value: new THREE.Vector2(0, 0) },
        uVelocity: { value: 0 },
      },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    this.buildGeometry(count);
    this.mesh = new THREE.Points(this.geometry, this.material);
    scene.add(this.mesh);
  }

  private buildGeometry(count: number) {
    const initial = new Float32Array(count * 3);
    const target  = new Float32Array(count * 3);
    const sizes   = new Float32Array(count);
    const speeds  = new Float32Array(count);
    const phases  = new Float32Array(count);
    const signal  = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Initial: scattered random sphere
      const theta0 = Math.random() * Math.PI * 2;
      const phi0   = Math.acos(2 * Math.random() - 1);
      const r0     = 2.5 + Math.random() * 5.5;
      initial[i * 3]     = r0 * Math.sin(phi0) * Math.cos(theta0);
      initial[i * 3 + 1] = r0 * Math.sin(phi0) * Math.sin(theta0);
      initial[i * 3 + 2] = r0 * Math.cos(phi0);

      // Target: equatorial orbit around identity
      const theta1 = Math.random() * Math.PI * 2;
      const r1     = 1.7 + Math.random() * 0.9;
      const y1     = (Math.random() - 0.5) * 0.55;
      target[i * 3]     = Math.cos(theta1) * r1;
      target[i * 3 + 1] = y1;
      target[i * 3 + 2] = Math.sin(theta1) * r1;

      sizes[i]  = 1.5 + Math.random() * 2.8;
      speeds[i] = 0.3 + Math.random() * 1.4;
      phases[i] = Math.random() * Math.PI * 2;
      signal[i] = 0;
    }

    // One LIME SIGNAL particle — perfectly placed
    signal[0]        = 1.0;
    sizes[0]         = 5.0;
    target[0]        = 0.85;
    target[1]        = 0.12;
    target[2]        = 1.7;

    // Seed position buffer (active positions start as initial)
    const posArray = new Float32Array(initial);
    this.geometry.setAttribute('position',   new THREE.BufferAttribute(posArray, 3));
    this.geometry.setAttribute('aInitialPos',new THREE.BufferAttribute(new Float32Array(initial), 3));
    this.geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(target, 3));
    this.geometry.setAttribute('aSize',      new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('aSpeed',     new THREE.BufferAttribute(speeds, 1));
    this.geometry.setAttribute('aPhase',     new THREE.BufferAttribute(phases, 1));
    this.geometry.setAttribute('aIsSignal',  new THREE.BufferAttribute(signal, 1));
  }

  public setProgress(v: number) {
    this.material.uniforms.uProgress.value = Math.max(0, Math.min(1, v));
  }

  public update(elapsed: number, pointer: THREE.Vector2, velocity: number) {
    this.material.uniforms.uTime.value     = elapsed;
    this.material.uniforms.uPointer.value.copy(pointer);
    this.material.uniforms.uVelocity.value = velocity;
  }

  public setVisible(v: boolean) {
    this.mesh.visible = v;
  }

  public dispose() {
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}