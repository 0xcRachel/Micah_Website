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

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;

  // Subtle precision micro-pulse rather than messy deform
  float pulse = sin(uTime * 1.5 + position.y * 2.0) * 0.02 * uDistortion;
  vec3 newPosition = position + normal * pulse;

  vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
  vWorldPosition = worldPos.xyz;

  vec4 mvPosition = viewMatrix * worldPos;
  vViewPosition = -mvPosition.xyz;

  // Precompute view-normal Fresnel for ultra-crisp performance
  vec3 viewDir = normalize(-mvPosition.xyz);
  vFresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 3.5);

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

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Key and Rim Light directions
  vec3 keyLightDir = normalize(vec3(3.0, 5.0, 4.0));
  vec3 rimLightDir = normalize(vec3(-4.0, -2.0, -3.0));

  // Diffuse terms
  float nDotL = max(0.0, dot(normal, keyLightDir));
  float rimDotL = max(0.0, dot(normal, rimLightDir));

  // High-exponent Specular Highlights (Mirror Obsidian / Liquid Titanium)
  vec3 halfVector = normalize(keyLightDir + viewDir);
  float spec = pow(max(0.0, dot(normal, halfVector)), 64.0) * 2.2;

  vec3 halfRim = normalize(rimLightDir + viewDir);
  float specRim = pow(max(0.0, dot(normal, halfRim)), 32.0) * 1.0;

  // Deep Obsidian Base (Luxurious, Crisp Space Black)
  vec3 obsidian = vec3(0.015, 0.015, 0.022);
  vec3 chromeHighlight = vec3(0.92, 0.95, 1.0);

  // Prismatic Chromatic Dispersion at the grazing rim
  vec3 dispersion;
  dispersion.r = pow(vFresnel, 3.8);
  dispersion.g = pow(vFresnel, 3.2);
  dispersion.b = pow(vFresnel, 2.7);

  // Laser Accent Glow (#d7ff00)
  vec3 accentSignal = vec3(0.843, 1.0, 0.0);

  // Procedural Cybernetic Seams / Facet Hairlines
  float seamPattern = abs(fract(vPosition.x * 2.0) - 0.5) + abs(fract(vPosition.y * 2.0) - 0.5);
  float seam = smoothstep(0.06, 0.01, seamPattern) * 0.45;

  // Composite lighting
  vec3 color = obsidian;
  color += chromeHighlight * (spec + specRim * 0.5);
  color += dispersion * 0.65;
  color += accentSignal * (vFresnel * uAccentMix * 1.4 + seam * uAccentMix);

  // Internal Core Glow emission
  float innerGlow = max(0.0, 1.0 - length(vPosition) * 0.7);
  color += accentSignal * (innerGlow * 0.25 * (0.8 + 0.2 * sin(uTime * 3.0)));

  gl_FragColor = vec4(color, uOpacity);
}
`;
