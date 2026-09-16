import * as THREE from 'three';
import gsap from 'gsap';
import { ProductCore } from './ProductCore';
import { GamePlanes } from './GamePlanes';
import { SteamNetwork } from './SteamNetwork';
import { SystemDiagnostics } from './SystemDiagnostics';
import { LuaStream } from './LuaStream';
import { CharacterStage } from './CharacterStage';

export interface StageOpacity {
  productCore: number;
  gamePlanes: number;
  steamNetwork: number;
  systemDiagnostics: number;
  luaStream: number;
  characterStage: number;
}

export class SceneManager {
  private container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  // Sub-stages
  public productCore: ProductCore;
  public gamePlanes: GamePlanes;
  public steamNetwork: SteamNetwork;
  public systemDiagnostics: SystemDiagnostics;
  public luaStream: LuaStream;
  public characterStage: CharacterStage;

  // Ambient dust field
  private ambientParticles: THREE.Points;

  // Camera animation targets (smoothly lerped in animate loop)
  public targetCamPos = new THREE.Vector3(0, 0, 5.2);
  public currentCamPos = new THREE.Vector3(0, 0, 5.2);
  public targetLookAt = new THREE.Vector3(0.4, 0, 0);
  public currentLookAt = new THREE.Vector3(0.4, 0, 0);

  // Pointer state
  private pointerNdc = new THREE.Vector2(0, 0);
  private pointerVelocity = 0;
  private lastPointerPos = new THREE.Vector2(0, 0);
  private isVisible = true;
  public currentSection = '';
  public isIntroActive = false;

  // Live opacity proxy for GSAP tweens
  public opacityProxy: StageOpacity = {
    productCore: 1,
    gamePlanes: 0,
    steamNetwork: 0,
    systemDiagnostics: 0,
    luaStream: 0,
    characterStage: 0,
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.045);
    this.clock = new THREE.Clock();

    // Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.copy(this.currentCamPos);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 5);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7e7e7e, 1.2);
    fillLight.position.set(-5, -3, -2);
    this.scene.add(fillLight);

    const accentLight = new THREE.PointLight(0xd7ff00, 1.8, 15);
    accentLight.position.set(0, 2, 3);
    this.scene.add(accentLight);

    // Instantiate Sub-stages
    this.productCore = new ProductCore();
    this.scene.add(this.productCore.group);

    this.gamePlanes = new GamePlanes();
    this.scene.add(this.gamePlanes.group);

    this.steamNetwork = new SteamNetwork();
    this.scene.add(this.steamNetwork.group);

    this.systemDiagnostics = new SystemDiagnostics();
    this.scene.add(this.systemDiagnostics.group);

    this.luaStream = new LuaStream();
    this.scene.add(this.luaStream.group);

    this.characterStage = new CharacterStage();
    this.scene.add(this.characterStage.group);

    // Set initial opacities
    this.productCore.setOpacity(1);
    this.productCore.targetOpacity = 1;
    this.productCore.currentOpacity = 1;
    this.productCore.setTargetPosition(1.4, 0, 0);
    this.productCore.group.position.set(1.4, 0, 0);
    this.productCore.setTargetScale(1.0);
    this.productCore.group.scale.set(1, 1, 1);
    this.gamePlanes.setOpacity(0);
    this.steamNetwork.setOpacity(0);
    this.systemDiagnostics.setOpacity(0);
    this.luaStream.setOpacity(0);
    this.characterStage.setOpacity(0);

    // Cosmic Dust
    const count = 350;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.035,
      transparent: true,
      opacity: 0.5
    });
    this.ambientParticles = new THREE.Points(pGeo, pMat);
    this.scene.add(this.ambientParticles);

    // Event listeners
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) this.clock.start();
    });

    // Start render loop
    this.animate();
  }

  // ─── Smooth Stage Cross-Fade ────────────────────────────────────────────────
  public transitionTo(targets: Partial<StageOpacity>, duration = 0.8) {
    const dur = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
    const keys = Object.keys(targets) as (keyof StageOpacity)[];
    
    keys.forEach((key) => {
      const targetVal = targets[key]!;
      gsap.to(this.opacityProxy, {
        [key]: targetVal,
        duration: dur,
        ease: 'power2.out',
        overwrite: 'auto',
        onUpdate: () => {
          const v = this.opacityProxy[key];
          switch (key) {
            case 'productCore':        this.productCore.setOpacity(v); break;
            case 'gamePlanes':         this.gamePlanes.setOpacity(v); break;
            case 'steamNetwork':       this.steamNetwork.setOpacity(v); break;
            case 'systemDiagnostics':  this.systemDiagnostics.setOpacity(v); break;
            case 'luaStream':          this.luaStream.setOpacity(v); break;
            case 'characterStage':     this.characterStage.setOpacity(v); break;
          }
        }
      });
    });
  }

  // ─── Smooth Camera Interpolation ──────────────────────────────────────────
  public moveCameraTo(pos: [number, number, number], lookAt: [number, number, number], duration = 1.0) {
    const dur = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration;
    gsap.to(this.targetCamPos, {
      x: pos[0], y: pos[1], z: pos[2],
      duration: dur,
      ease: 'power2.out',
      overwrite: 'auto'
    });
    gsap.to(this.targetLookAt, {
      x: lookAt[0], y: lookAt[1], z: lookAt[2],
      duration: dur,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  }

  // ─── Section State Switcher (Fallback / Direct State) ─────────────────────
  public setSectionState(section: string, _progress = 0) {
    if (section === this.currentSection) return;
    this.currentSection = section;

    const ALL_OFF: StageOpacity = {
      productCore: 0, gamePlanes: 0, steamNetwork: 0,
      systemDiagnostics: 0, luaStream: 0, characterStage: 0,
    };

    switch (section) {
      case 'hero':
        this.productCore.setTargetPosition(1.4, 0, 0);
        this.productCore.setTargetScale(1.0);
        this.productCore.setDistortion(1.0);
        this.productCore.setAccentMix(0.25);
        this.moveCameraTo([0, 0, 5.2], [0.4, 0, 0]);
        this.transitionTo({ ...ALL_OFF, productCore: 1 });
        break;

      case 'intro':
        // Smoothly glide to center, do NOT jump or scale huge
        this.productCore.setTargetPosition(0, 0, -0.3);
        this.productCore.setTargetScale(1.05);
        this.productCore.setDistortion(1.3);
        this.productCore.setAccentMix(0.25);
        this.moveCameraTo([0, 0, 4.8], [0, 0, 0]);
        this.transitionTo({ ...ALL_OFF, productCore: 1 });
        break;

      case 'features':
        this.productCore.setTargetPosition(-2.0, 0.3, -0.5);
        this.productCore.setTargetScale(0.95);
        this.productCore.setDistortion(0.8);
        this.moveCameraTo([-0.5, 0, 4.8], [-1.0, 0, 0]);
        this.transitionTo({ ...ALL_OFF, productCore: 0.8 });
        break;

      case 'games':
        this.productCore.setTargetPosition(-3.0, 0, -2.0);
        this.moveCameraTo([0, 0, 4.5], [0.9, 0, 0]);
        this.transitionTo({ ...ALL_OFF, gamePlanes: 1 });
        break;

      case 'steam':
        this.moveCameraTo([0, 0.2, 4.5], [0, 0, 0]);
        this.transitionTo({ ...ALL_OFF, steamNetwork: 1 });
        break;

      case 'system':
        this.moveCameraTo([0, 0, 4.0], [0, 0, 0]);
        this.transitionTo({ ...ALL_OFF, systemDiagnostics: 1 });
        break;

      case 'lua':
        this.moveCameraTo([0, 0, 4.8], [0, 0, 0]);
        this.transitionTo({ ...ALL_OFF, luaStream: 1 });
        break;

      case 'interactive':
        this.productCore.setTargetPosition(0, 0, 0);
        this.productCore.setTargetScale(1.0);
        this.moveCameraTo([0, 0, 4.8], [0, 0, 0]);
        this.transitionTo({ ...ALL_OFF, productCore: 1 });
        break;

      case 'character':
        this.moveCameraTo([0, 0, 4.2], [0, 0, 0]);
        this.transitionTo({ ...ALL_OFF, characterStage: 1 });
        break;

      case 'download':
        this.productCore.setTargetPosition(0, 0.5, 0);
        this.productCore.setTargetScale(1.0);
        this.productCore.setDistortion(0.5);
        this.productCore.setAccentMix(0.85);
        this.moveCameraTo([0, 0, 5.0], [0, 0.3, 0]);
        this.transitionTo({ ...ALL_OFF, productCore: 1 });
        break;
    }
  }

  public setMenuOpen(isOpen: boolean) {
    if (isOpen) {
      this.moveCameraTo([0, -1.0, 7.0], [0, 0, 0]);
      this.productCore.setDistortion(2.4);
    } else {
      this.moveCameraTo([0, 0, 5.0], [0, 0, 0]);
      this.productCore.setDistortion(1.0);
    }
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private onMouseMove(e: MouseEvent) {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;

    const dx = x - this.lastPointerPos.x;
    const dy = y - this.lastPointerPos.y;
    this.pointerVelocity = Math.sqrt(dx * dx + dy * dy);
    this.pointerNdc.set(x, y);
    this.lastPointerPos.set(x, y);

    const worldX = x * (this.camera.aspect * 2.5);
    const worldY = y * 2.5;
    this.productCore.setPointer(x, y, worldX, worldY);
    this.characterStage.setPointer(x, y);
    this.gamePlanes.setPointer(x, y);
  }

  private animate() {
    requestAnimationFrame(this.animate.bind(this));
    if (!this.isVisible) return;

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Smooth camera physics inertia (lerp toward targets with momentum)
    this.currentCamPos.lerp(this.targetCamPos, 0.07);
    this.currentLookAt.lerp(this.targetLookAt, 0.07);
    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);

    // Update stages (internal lerps handle smooth opacity and transforms)
    this.productCore.update(delta, elapsed, this.camera.position);
    this.gamePlanes.update(delta, elapsed, 0);
    this.steamNetwork.update(delta, elapsed);
    this.systemDiagnostics.update(delta, elapsed);
    this.luaStream.update(delta);
    this.characterStage.update(delta, elapsed);

    // Cosmic dust drift
    this.ambientParticles.rotation.y = elapsed * 0.02;

    this.renderer.render(this.scene, this.camera);
  }
}
