export const coreVertexShader = /* glsl */ `
uniform float uTime;
uniform float uDistortion;
uniform vec3 uPointer;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vFresnel;
varying float vDisplacement;

// ─── 3D Simplex Noise by Stefan Gustavson / Ian McEwan ──────────────────────
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vUv = uv;
  vPosition = position;

  // ─── Organic Fluid Noise Waves (Alche Studio style) ──────────────────────
  float t = uTime * 0.65;
  vec3 noiseCoord = position * 0.85 + vec3(0.0, -t * 0.4, t * 0.2);
  float n1 = snoise(noiseCoord);
  float n2 = snoise(noiseCoord * 1.8 + vec3(t * 0.3, 0.0, -t * 0.5)) * 0.5;
  float totalNoise = (n1 + n2);

  // Subtle breathing ripple wave
  float ripple = sin(position.y * 3.5 + t * 2.2) * 0.06;
  
  // Interactive pointer proximity pull
  float pointerDist = length(position.xy - uPointer.xy * 1.5);
  float pointerInfluence = smoothstep(2.5, 0.0, pointerDist) * 0.12;

  // Combined smooth displacement
  float displacement = (totalNoise * 0.18 + ripple + pointerInfluence) * uDistortion;
  vDisplacement = displacement;

  vec3 newPosition = position + normal * displacement;

  // ─── Normal reconstruction using finite difference ──────────────────────
  float offset = 0.015;
  vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.001)));
  vec3 bitangent = cross(normal, tangent);
  
  vec3 p1 = position + tangent * offset;
  vec3 p2 = position + bitangent * offset;
  
  float d1 = (snoise(p1 * 0.85 + vec3(0.0, -t * 0.4, t * 0.2)) + snoise(p1 * 1.53) * 0.5) * 0.18 * uDistortion;
  float d2 = (snoise(p2 * 0.85 + vec3(0.0, -t * 0.4, t * 0.2)) + snoise(p2 * 1.53) * 0.5) * 0.18 * uDistortion;
  
  vec3 np1 = p1 + normal * d1;
  vec3 np2 = p2 + normal * d2;
  
  vec3 deformedNormal = normalize(cross(np1 - newPosition, np2 - newPosition));
  vNormal = normalize(normalMatrix * (length(deformedNormal) > 0.1 ? deformedNormal : normal));

  vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
  vWorldPosition = worldPos.xyz;

  vec4 mvPosition = viewMatrix * worldPos;
  vViewPosition = -mvPosition.xyz;

  vec3 viewDir = normalize(-mvPosition.xyz);
  vFresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.8);

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const coreFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uCameraPos;
uniform float uAccentMix;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vFresnel;
varying float vDisplacement;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Key and Rim Light directions
  vec3 keyLightDir = normalize(vec3(2.5, 4.0, 3.5));
  vec3 fillLightDir = normalize(vec3(-3.0, -1.5, 2.0));
  vec3 rimLightDir = normalize(vec3(-3.5, 3.0, -3.5));

  // High-exponent Specular Highlights (Liquid Obsidian / Chrome)
  vec3 halfVector = normalize(keyLightDir + viewDir);
  float specSharp = pow(max(0.0, dot(normal, halfVector)), 96.0) * 2.8;
  float specSoft  = pow(max(0.0, dot(normal, halfVector)), 18.0) * 0.6;

  vec3 halfRim = normalize(rimLightDir + viewDir);
  float specRim = pow(max(0.0, dot(normal, halfRim)), 36.0) * 1.2;

  // Deep Obsidian Mirror Base
  vec3 obsidian = vec3(0.012, 0.014, 0.020);
  vec3 chromeHighlight = vec3(0.96, 0.98, 1.0);

  // Iridescent Prismatic Dispersion at the grazing rim
  vec3 dispersion;
  dispersion.r = pow(vFresnel, 3.5) * 1.1;
  dispersion.g = pow(vFresnel, 2.7) * 1.0;
  dispersion.b = pow(vFresnel, 2.1) * 0.9;

  // Signature Electric Lime Accent (#d7ff00)
  vec3 limeAccent = vec3(0.843, 1.0, 0.0);

  // Holographic Scanning Ring Wave across surface
  float scanWave = sin(vPosition.y * 8.0 - uTime * 3.2 + vDisplacement * 6.0);
  float scanLine = smoothstep(0.92, 0.99, scanWave) * 0.65;

  // Fluid energy veins based on displacement valleys
  float vein = smoothstep(-0.06, 0.08, vDisplacement) * 0.35;

  // Internal Bioluminescent Quantum Core Pulse
  float innerPulse = 0.5 + 0.5 * sin(uTime * 2.5);
  vec3 internalGlow = limeAccent * (vFresnel * uAccentMix * 1.5 + scanLine * uAccentMix * 0.8 + vein * uAccentMix * 0.5);

  // Composite rich lighting
  vec3 color = obsidian;
  color += chromeHighlight * (specSharp + specSoft + specRim * 0.4);
  color += dispersion * 0.45;
  color += internalGlow;

  // Atmospheric rim edge glow
  color += limeAccent * pow(vFresnel, 4.2) * (0.8 + 0.4 * innerPulse);

  gl_FragColor = vec4(color, uOpacity * 0.96);
}
`;

