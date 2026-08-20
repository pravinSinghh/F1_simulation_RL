import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CameraMode, SyncMode, TelemetryPoint, TrackId, WeatherConditionId } from '../types';
import {
  TRACKS_DATA,
  WEATHER_CONDITIONS,
  TRACK_WIDTH,
  KERB_WIDTH,
  getTrackCurve,
  getTrackPointAtDistance,
} from '../physics/f1Track';

export type DirectorShotType =
  | 'SPEED_TRAP_TELEPHOTO'
  | 'APEX_KERB_CAM'
  | 'HELI_SWEEP_CRANE'
  | 'ONBOARD_TCAM'
  | 'CHASE_DYNAMIC'
  | 'TOWER_HIGH_PAN'
  | 'NOSE_WING_CAM'
  | 'REVERSE_BATTLE_CAM';

interface DirectorShotState {
  shotType: DirectorShotType;
  shotStartTime: number;
  shotMinDuration: number;
  targetFov: number;
  cameraName: string;
  lensSpecs: string;
  directorReason: string;
  isStationary: boolean;
  anchorWorldPos: THREE.Vector3;
  anchorTrackDist: number;
  orbitAngle: number;
  orbitSpeed: number;
}

interface F1SceneProps {
  trackId: TrackId;
  weatherId: WeatherConditionId;
  cameraMode: CameraMode;
  syncMode: SyncMode;
  baseTelemetry: TelemetryPoint;
  rlTelemetry: TelemetryPoint;
  timeProgress: number; // 0 to 1
  isGhostOverlay: boolean;
  showAeroFlow: boolean;
  showRacingLines?: boolean;
}

// Generate procedural textures for track asphalt, carbon fiber, decals, and tire treads
function createProceduralTextures(isWet: boolean) {
  // 1. Asphalt Texture with realistic fine grain & rubber line
  const asphaltCanvas = document.createElement('canvas');
  asphaltCanvas.width = 512;
  asphaltCanvas.height = 512;
  const ctxA = asphaltCanvas.getContext('2d')!;
  ctxA.fillStyle = isWet ? '#0f1118' : '#1c1e24';
  ctxA.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 45000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = Math.floor(isWet ? 12 + Math.random() * 20 : 20 + Math.random() * 25);
    ctxA.fillStyle = `rgb(${shade},${shade + 2},${shade + 6})`;
    ctxA.fillRect(x, y, 1.5, 1.5);
  }

  // Dark rubbered racing line streak down middle
  const grad = ctxA.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.35, isWet ? 'rgba(5,7,10,0.65)' : 'rgba(10,12,16,0.55)');
  grad.addColorStop(0.5, isWet ? 'rgba(2,3,5,0.85)' : 'rgba(5,6,8,0.75)');
  grad.addColorStop(0.65, isWet ? 'rgba(5,7,10,0.65)' : 'rgba(10,12,16,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctxA.fillStyle = grad;
  ctxA.fillRect(0, 0, 512, 512);

  const asphaltTex = new THREE.CanvasTexture(asphaltCanvas);
  asphaltTex.wrapS = THREE.RepeatWrapping;
  asphaltTex.wrapT = THREE.RepeatWrapping;
  asphaltTex.repeat.set(1, 60);

  // 2. Start/Finish Grid texture
  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = 512;
  gridCanvas.height = 256;
  const ctxG = gridCanvas.getContext('2d')!;
  ctxG.fillStyle = isWet ? '#0f1118' : '#1a1c22';
  ctxG.fillRect(0, 0, 512, 256);
  ctxG.fillStyle = '#ffffff';
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 12; col++) {
      if ((row + col) % 2 === 0) {
        ctxG.fillRect(col * 42.6, row * 42.6, 42.6, 42.6);
      }
    }
  }
  const gridTex = new THREE.CanvasTexture(gridCanvas);

  // 3. Carbon fiber weave texture
  const carbonCanvas = document.createElement('canvas');
  carbonCanvas.width = 64;
  carbonCanvas.height = 64;
  const ctxC = carbonCanvas.getContext('2d')!;
  ctxC.fillStyle = '#111317';
  ctxC.fillRect(0, 0, 64, 64);
  ctxC.fillStyle = '#1e2229';
  for (let x = 0; x < 64; x += 8) {
    for (let y = 0; y < 64; y += 8) {
      if ((x + y) % 16 === 0) {
        ctxC.fillRect(x, y, 6, 6);
      }
    }
  }
  const carbonTex = new THREE.CanvasTexture(carbonCanvas);
  carbonTex.wrapS = THREE.RepeatWrapping;
  carbonTex.wrapT = THREE.RepeatWrapping;
  carbonTex.repeat.set(6, 6);

  // 4. Tire sidewall with Pirelli color branding
  const createTireTexture = (isRL: boolean, weather: WeatherConditionId) => {
    const tireCanvas = document.createElement('canvas');
    tireCanvas.width = 256;
    tireCanvas.height = 256;
    const ctxT = tireCanvas.getContext('2d')!;
    ctxT.fillStyle = '#141416';
    ctxT.fillRect(0, 0, 256, 256);

    ctxT.strokeStyle = '#22252c';
    ctxT.lineWidth = 12;
    ctxT.beginPath();
    ctxT.arc(128, 128, 96, 0, Math.PI * 2);
    ctxT.stroke();

    const stripeColor = weather === 'wet' ? '#0070f3' : weather === 'cold' ? '#00d26a' : weather === 'hot' ? '#ffffff' : isRL ? '#00e5ff' : '#ff3b30';
    ctxT.strokeStyle = stripeColor;
    ctxT.lineWidth = 6;
    ctxT.beginPath();
    ctxT.arc(128, 128, 86, 0, Math.PI * 2);
    ctxT.stroke();

    ctxT.fillStyle = '#f8fafc';
    ctxT.font = 'bold 20px sans-serif';
    ctxT.textAlign = 'center';
    ctxT.textBaseline = 'middle';
    ctxT.fillText('PIRELLI', 128, 48);
    ctxT.fillText(weather === 'wet' ? 'CINTURATO' : isRL ? 'P-ZERO RL' : 'P-ZERO', 128, 208);

    const tex = new THREE.CanvasTexture(tireCanvas);
    return tex;
  };

  return {
    asphaltTex,
    gridTex,
    carbonTex,
    baseTireTex: createTireTexture(false, isWet ? 'wet' : 'dry'),
    rlTireTex: createTireTexture(true, isWet ? 'wet' : 'dry'),
  };
}

// 3D Billboard Floating Tag sprite
function createCarTagSprite(isRL: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isRL ? 'rgba(0, 229, 255, 0.92)' : 'rgba(255, 59, 48, 0.92)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 492, 120, 24);
  ctx.fill();

  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#05070d';
  ctx.font = '900 48px monospace, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isRL ? 'RL-OPTIMIZED #01' : 'STANDARD BASELINE #44', 256, 70);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 0.88, 1);
  sprite.position.set(0, 1.85, 0);
  return sprite;
}

export const F1Scene: React.FC<F1SceneProps> = ({
  trackId,
  weatherId,
  cameraMode,
  syncMode,
  baseTelemetry,
  rlTelemetry,
  timeProgress,
  isGhostOverlay,
  showAeroFlow,
  showRacingLines = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mainCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraLeftRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cameraRightRef = useRef<THREE.PerspectiveCamera | null>(null);

  const baseCarGroupRef = useRef<THREE.Group | null>(null);
  const rlCarGroupRef = useRef<THREE.Group | null>(null);
  const baseWheelsRef = useRef<{ mesh: THREE.Mesh; group: THREE.Group; isFront: boolean }[]>([]);
  const rlWheelsRef = useRef<{ mesh: THREE.Mesh; group: THREE.Group; isFront: boolean }[]>([]);
  const baseBrakeDiscsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const rlBrakeDiscsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const rlDrsFlapRef = useRef<THREE.Mesh | null>(null);
  const baseRainLightRef = useRef<THREE.PointLight | null>(null);
  const rlRainLightRef = useRef<THREE.PointLight | null>(null);
  const baseTagSpriteRef = useRef<THREE.Sprite | null>(null);
  const rlTagSpriteRef = useRef<THREE.Sprite | null>(null);
  const leadLineRef = useRef<THREE.Line | null>(null);

  const baseAeroStreamRef = useRef<THREE.Points | null>(null);
  const rlAeroStreamRef = useRef<THREE.Points | null>(null);
  const baseSprayRef = useRef<THREE.Points | null>(null);
  const rlSprayRef = useRef<THREE.Points | null>(null);
  const rainSystemRef = useRef<THREE.Points | null>(null);

  const baseRacingLineRef = useRef<THREE.Line | null>(null);
  const rlRacingLineRef = useRef<THREE.Line | null>(null);
  const texturesRef = useRef<ReturnType<typeof createProceduralTextures> | null>(null);
  const trackGroupRef = useRef<THREE.Group | null>(null);

  // Auto-Director Broadcast Camera Engine State
  const [directorHUD, setDirectorHUD] = useState<{
    name: string;
    lens: string;
    reason: string;
    shotType: DirectorShotType;
    shotStartTime: number;
    shotMinDuration: number;
  } | null>(null);

  const directorStateRef = useRef<DirectorShotState>({
    shotType: 'CHASE_DYNAMIC',
    shotStartTime: performance.now(),
    shotMinDuration: 3.2,
    targetFov: 48,
    cameraName: 'CAM 08: DYNAMIC BROADCAST CHASE',
    lensSpecs: '50mm Broadcast Master',
    directorReason: 'CIRCUIT PACING & GAP TRACKING',
    isStationary: false,
    anchorWorldPos: new THREE.Vector3(),
    anchorTrackDist: 0,
    orbitAngle: 0,
    orbitSpeed: 0.15,
  });

  // Build Realistic F1 Car 3D Mesh
  const createRealisticF1CarModel = (isRL: boolean, textures: ReturnType<typeof createProceduralTextures>) => {
    const car = new THREE.Group();
    const wheels: { mesh: THREE.Mesh; group: THREE.Group; isFront: boolean }[] = [];
    const brakeDiscs: THREE.MeshStandardMaterial[] = [];

    const primaryColor = isRL ? 0x00e5ff : 0xef4444; // Cyan vs Red
    const accentColor = isRL ? 0x10b981 : 0xf59e0b;  // Emerald vs Amber
    const liveryFinish = {
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    };

    const liveryMat = new THREE.MeshPhysicalMaterial({
      color: primaryColor,
      ...liveryFinish,
    });

    const accentMat = new THREE.MeshPhysicalMaterial({
      color: accentColor,
      ...liveryFinish,
    });

    const matteCarbonMat = new THREE.MeshStandardMaterial({
      map: textures.carbonTex,
      color: 0x22252c,
      metalness: 0.4,
      roughness: 0.65,
    });

    const glossBlackMat = new THREE.MeshStandardMaterial({
      color: 0x0d0e12,
      metalness: 0.9,
      roughness: 0.15,
    });

    // 1. Monocoque / Cockpit Core Chassis
    const monocoqueGeo = new THREE.BoxGeometry(0.72, 0.42, 2.2);
    const monocoque = new THREE.Mesh(monocoqueGeo, liveryMat);
    monocoque.position.set(0, 0.28, 0.1);
    monocoque.castShadow = true;
    car.add(monocoque);

    // 2. Aerodynamic Tapered Nose Cone
    const noseGeo = new THREE.ConeGeometry(0.36, 1.4, 6);
    noseGeo.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, liveryMat);
    nose.position.set(0, 0.24, 1.4);
    nose.castShadow = true;
    car.add(nose);

    // 3. Multi-Element Front Wing Assembly
    const frontWingMainGeo = new THREE.BoxGeometry(2.0, 0.035, 0.46);
    const frontWingMain = new THREE.Mesh(frontWingMainGeo, matteCarbonMat);
    frontWingMain.position.set(0, 0.08, 2.15);
    frontWingMain.castShadow = true;
    car.add(frontWingMain);

    const flapAngle = isRL ? 0.28 : 0.22;
    const flapGeo = new THREE.BoxGeometry(1.92, 0.02, 0.22);
    const frontFlap = new THREE.Mesh(flapGeo, isRL ? accentMat : matteCarbonMat);
    frontFlap.position.set(0, 0.14, 2.26);
    frontFlap.rotation.x = -flapAngle;
    car.add(frontFlap);

    // Front Wing Endplates
    [-0.98, 0.98].forEach((x) => {
      const endplateGeo = new THREE.BoxGeometry(0.03, 0.28, 0.58);
      const endplate = new THREE.Mesh(endplateGeo, liveryMat);
      endplate.position.set(x, 0.18, 2.15);
      car.add(endplate);
    });

    // 4. Sidepods with Venturi Undercut
    [-0.56, 0.56].forEach((x) => {
      const sidepodGeo = new THREE.BoxGeometry(0.48, 0.36, 1.4);
      const sidepod = new THREE.Mesh(sidepodGeo, liveryMat);
      sidepod.position.set(x, 0.26, -0.05);
      sidepod.castShadow = true;
      car.add(sidepod);

      const radGeo = new THREE.BoxGeometry(0.38, 0.24, 0.05);
      const radiator = new THREE.Mesh(radGeo, glossBlackMat);
      radiator.position.set(x, 0.28, 0.62);
      car.add(radiator);
    });

    // 5. Floor Edge Winglets & Venturi Inlets
    const floorWidth = isRL ? 1.78 : 1.70;
    const floorGeo = new THREE.BoxGeometry(floorWidth, 0.03, 2.7);
    const floor = new THREE.Mesh(floorGeo, matteCarbonMat);
    floor.position.set(0, 0.06, 0.1);
    floor.receiveShadow = true;
    car.add(floor);

    // 6. Halo Safety Titanium Structure
    const haloLoopGeo = new THREE.TorusGeometry(0.24, 0.032, 10, 20, Math.PI);
    haloLoopGeo.rotateX(Math.PI / 2);
    const haloMat = new THREE.MeshStandardMaterial({ color: 0x1e222a, metalness: 0.95, roughness: 0.2 });
    const haloLoop = new THREE.Mesh(haloLoopGeo, haloMat);
    haloLoop.position.set(0, 0.56, 0.32);
    car.add(haloLoop);

    const haloPillarGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.32);
    const haloPillar = new THREE.Mesh(haloPillarGeo, haloMat);
    haloPillar.position.set(0, 0.44, 0.54);
    haloPillar.rotation.x = -0.3;
    car.add(haloPillar);

    // Driver Helmet
    const helmetGeo = new THREE.SphereGeometry(0.13, 16, 16);
    const helmetMat = new THREE.MeshStandardMaterial({ color: isRL ? 0x00e5ff : 0xfacc15, metalness: 0.5, roughness: 0.2 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 0.46, 0.14);
    car.add(helmet);

    // 7. Engine Airbox & Shark Fin
    const airboxGeo = new THREE.BoxGeometry(0.26, 0.36, 1.2);
    const airbox = new THREE.Mesh(airboxGeo, liveryMat);
    airbox.position.set(0, 0.58, -0.45);
    car.add(airbox);

    const sharkFinGeo = new THREE.BufferGeometry();
    const sharkVerts = new Float32Array([
      0, 0.74, -0.1,
      0, 0.74, -1.2,
      0, 0.42, -1.2,
      0, 0.74, -0.1,
      0, 0.42, -1.2,
      0, 0.42, -0.1,
    ]);
    sharkFinGeo.setAttribute('position', new THREE.BufferAttribute(sharkVerts, 3));
    sharkFinGeo.computeVertexNormals();
    const sharkFin = new THREE.Mesh(sharkFinGeo, accentMat);
    car.add(sharkFin);

    // 8. Rear Wing Assembly & Dynamic DRS Flap
    const rwPylonGeo = new THREE.BoxGeometry(0.04, 0.55, 0.18);
    const rwPylon = new THREE.Mesh(rwPylonGeo, matteCarbonMat);
    rwPylon.position.set(0, 0.52, -1.68);
    car.add(rwPylon);

    const rwMainGeo = new THREE.BoxGeometry(1.36, 0.04, 0.32);
    const rwMain = new THREE.Mesh(rwMainGeo, matteCarbonMat);
    rwMain.position.set(0, 0.78, -1.72);
    rwMain.castShadow = true;
    car.add(rwMain);

    const drsGeo = new THREE.BoxGeometry(1.34, 0.024, 0.22);
    const drsFlap = new THREE.Mesh(drsGeo, isRL ? accentMat : liveryMat);
    drsFlap.position.set(0, 0.88, -1.82);
    drsFlap.rotation.x = 0.26;
    car.add(drsFlap);

    // Rear Wing Endplates
    [-0.68, 0.68].forEach((x) => {
      const rwEndGeo = new THREE.BoxGeometry(0.03, 0.44, 0.52);
      const rwEnd = new THREE.Mesh(rwEndGeo, liveryMat);
      rwEnd.position.set(x, 0.74, -1.74);
      car.add(rwEnd);
    });

    // 9. Rear Rain / Safety LED Light
    const rainLight = new THREE.PointLight(0xff0022, 0, 8);
    rainLight.position.set(0, 0.18, -1.85);
    car.add(rainLight);

    const ledMeshGeo = new THREE.BoxGeometry(0.12, 0.06, 0.02);
    const ledMeshMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const ledMesh = new THREE.Mesh(ledMeshGeo, ledMeshMat);
    ledMesh.position.set(0, 0.18, -1.85);
    car.add(ledMesh);

    // 10. Wheels & Carbon Ceramic Brakes
    const wheelPositions = [
      { x: -0.86, y: 0.28, z: 1.35, isFront: true },
      { x: 0.86, y: 0.28, z: 1.35, isFront: true },
      { x: -0.88, y: 0.30, z: -1.35, isFront: false },
      { x: 0.88, y: 0.30, z: -1.35, isFront: false },
    ];

    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      const rotatingMesh = new THREE.Group();

      const tireRadius = pos.isFront ? 0.34 : 0.36;
      const tireWidth = pos.isFront ? 0.32 : 0.42;
      const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 24);
      tireGeo.rotateZ(Math.PI / 2);

      const tireTex = isRL ? textures.rlTireTex : textures.baseTireTex;
      const tireMat = new THREE.MeshStandardMaterial({
        color: 0x16181d,
        map: tireTex,
        roughness: 0.75,
        metalness: 0.1,
      });

      const tireMesh = new THREE.Mesh(tireGeo, tireMat);
      tireMesh.castShadow = true;
      rotatingMesh.add(tireMesh);

      // BBS Wheel Rim Rim Cover
      const rimGeo = new THREE.CylinderGeometry(0.21, 0.21, tireWidth + 0.005, 18);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0x111317,
        metalness: 0.9,
        roughness: 0.3,
      });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rotatingMesh.add(rimMesh);

      wheelGroup.add(rotatingMesh);

      // Carbon Ceramic Brake Disc inside wheel
      const brakeMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        emissive: 0x000000,
        metalness: 0.95,
        roughness: 0.3,
      });
      brakeDiscs.push(brakeMat);

      const brakeGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16);
      brakeGeo.rotateZ(Math.PI / 2);
      const brakeMesh = new THREE.Mesh(brakeGeo, brakeMat);
      brakeMesh.position.set(pos.x > 0 ? -0.12 : 0.12, 0, 0);
      wheelGroup.add(brakeMesh);

      // Suspension Wishbone Rods
      const wishboneGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.58);
      wishboneGeo.rotateZ(Math.PI / 2.6);
      const wishbone = new THREE.Mesh(wishboneGeo, matteCarbonMat);
      wishbone.position.set(pos.x > 0 ? -0.28 : 0.28, 0.02, 0);
      car.add(wishbone);

      car.add(wheelGroup);
      wheels.push({ mesh: rotatingMesh as any, group: wheelGroup, isFront: pos.isFront });
    });

    // RL Underfloor Venturi Ground-Effect Glow Plane
    if (isRL) {
      const underGlowGeo = new THREE.PlaneGeometry(1.8, 3.4);
      underGlowGeo.rotateX(-Math.PI / 2);
      const underGlowMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const underGlow = new THREE.Mesh(underGlowGeo, underGlowMat);
      underGlow.position.set(0, 0.06, -0.2);
      car.add(underGlow);
    }

    return {
      car,
      wheels,
      brakeDiscs,
      drsFlap,
      rainLight,
    };
  };

  // Build Aerodynamic Flow Particles / Vortex Ribbons
  const createAeroStream = (isRL: boolean) => {
    const particleCount = isRL ? 240 : 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const baseColor = isRL ? new THREE.Color(0x00ffff) : new THREE.Color(0xff3b30);

    for (let i = 0; i < particleCount; i++) {
      const u = i / particleCount;
      const x = (Math.random() - 0.5) * (isRL ? 1.5 : 2.4);
      const y = 0.25 + Math.random() * 0.75;
      const z = 2.4 - u * 5.8;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  };

  // Build Wet Weather Diffuser Water Spray Rooster Tail
  const createWaterSpray = (isRL: boolean) => {
    const particleCount = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const u = i / particleCount;
      const x = (Math.random() - 0.5) * (0.8 + u * 2.8);
      const y = 0.1 + u * 2.2 + Math.random() * 0.5;
      const z = -1.8 - u * 8.0;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const alpha = 0.9 - u * 0.7;
      colors[i * 3] = 0.85 * alpha;
      colors[i * 3 + 1] = 0.92 * alpha;
      colors[i * 3 + 2] = 1.0 * alpha;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.visible = false;
    return points;
  };

  // Build Falling Rain Particle System
  const createRainSystem = () => {
    const count = 3500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 1] = Math.random() * 120;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.6,
    });

    return new THREE.Points(geometry, material);
  };

  // Build Realistic Grand Prix Circuit with Kerbs, Barriers, Grandstands & Braking Boards
  const createRealisticTrackEnvironment = (
    currentTrackId: TrackId,
    currentWeatherId: WeatherConditionId,
    textures: ReturnType<typeof createProceduralTextures>
  ) => {
    const trackGroup = new THREE.Group();
    const segments = 900;
    const isWet = currentWeatherId === 'wet';
    const isNight = currentWeatherId === 'night';

    const trackCurveData = getTrackCurve(currentTrackId);
    const totalLength = trackCurveData.totalLength;
    const trackDef = TRACKS_DATA[currentTrackId] || TRACKS_DATA.silverstone;

    // 1. Asphalt Track Surface
    const trackGeo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];

    // Kerbs (Red/White saw-tooth)
    const kerbGeo = new THREE.BufferGeometry();
    const kerbPos: number[] = [];
    const kerbCols: number[] = [];

    // Astroturf outer strip
    const astroGeo = new THREE.BufferGeometry();
    const astroPos: number[] = [];

    const halfW = TRACK_WIDTH / 2;

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const dist = u * totalLength;
      const pt = getTrackPointAtDistance(dist, currentTrackId);

      const leftPos = pt.position.clone().add(pt.normal.clone().multiplyScalar(halfW));
      const rightPos = pt.position.clone().add(pt.normal.clone().multiplyScalar(-halfW));

      positions.push(leftPos.x, leftPos.y + 0.02, leftPos.z);
      positions.push(rightPos.x, rightPos.y + 0.02, rightPos.z);

      uvs.push(0, u * 120);
      uvs.push(1, u * 120);

      // Kerb calculations
      const isKerbZone = Math.abs(pt.curvature) > 0.0022;
      if (isKerbZone) {
        const kerbInnerLeft = leftPos.clone();
        const kerbOuterLeft = pt.position.clone().add(pt.normal.clone().multiplyScalar(halfW + KERB_WIDTH));
        kerbPos.push(kerbInnerLeft.x, kerbInnerLeft.y + 0.035, kerbInnerLeft.z);
        kerbPos.push(kerbOuterLeft.x, kerbOuterLeft.y + 0.035, kerbOuterLeft.z);

        const isRed = Math.floor(u * 700) % 2 === 0;
        const r = isRed ? 0.95 : 0.98;
        const g = isRed ? 0.12 : 0.98;
        const b = isRed ? 0.15 : 0.98;
        kerbCols.push(r, g, b, r, g, b);
      }

      // Astroturf Runoff strip
      const astroInner = pt.position.clone().add(pt.normal.clone().multiplyScalar(halfW + KERB_WIDTH));
      const astroOuter = pt.position.clone().add(pt.normal.clone().multiplyScalar(halfW + KERB_WIDTH + 3.2));
      astroPos.push(astroInner.x, astroInner.y + 0.015, astroInner.z);
      astroPos.push(astroOuter.x, astroOuter.y + 0.015, astroOuter.z);
    }

    const indices: number[] = [];
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }

    trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    trackGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    trackGeo.setIndex(indices);
    trackGeo.computeVertexNormals();

    const trackMat = new THREE.MeshStandardMaterial({
      map: textures.asphaltTex,
      roughness: isWet ? 0.18 : 0.72,
      metalness: isWet ? 0.35 : 0.15,
      bumpScale: isWet ? 0.02 : 0.05,
    });
    const trackMesh = new THREE.Mesh(trackGeo, trackMat);
    trackMesh.receiveShadow = true;
    trackGroup.add(trackMesh);

    // Kerbs mesh
    if (kerbPos.length > 0) {
      const kerbIndices: number[] = [];
      const numKerbVerts = kerbPos.length / 6;
      for (let i = 0; i < numKerbVerts - 1; i++) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        kerbIndices.push(a, b, c);
        kerbIndices.push(b, d, c);
      }
      kerbGeo.setAttribute('position', new THREE.Float32BufferAttribute(kerbPos, 3));
      kerbGeo.setAttribute('color', new THREE.Float32BufferAttribute(kerbCols, 3));
      kerbGeo.setIndex(kerbIndices);
      kerbGeo.computeVertexNormals();

      const kerbMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: isWet ? 0.25 : 0.6,
        metalness: 0.1,
      });
      const kerbMesh = new THREE.Mesh(kerbGeo, kerbMat);
      kerbMesh.receiveShadow = true;
      trackGroup.add(kerbMesh);
    }

    // 2. Start/Finish Grid Gantry and Line
    const startPt = getTrackPointAtDistance(0, currentTrackId);
    const startLineGeo = new THREE.PlaneGeometry(TRACK_WIDTH, 4.0);
    startLineGeo.rotateX(-Math.PI / 2);
    const startLineMat = new THREE.MeshStandardMaterial({
      map: textures.gridTex,
      transparent: true,
      opacity: 0.9,
    });
    const startLine = new THREE.Mesh(startLineGeo, startLineMat);
    startLine.position.copy(startPt.position).add(new THREE.Vector3(0, 0.04, 0));
    startLine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), startPt.tangent);
    trackGroup.add(startLine);

    // Gantry structure above Start/Finish
    const gantry = new THREE.Group();
    const gantryPillarMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.85, roughness: 0.2 });
    const gantryLeftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 12), gantryPillarMat);
    gantryLeftPillar.position.set(-halfW - 3.0, 6, 0);
    const gantryRightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 12), gantryPillarMat);
    gantryRightPillar.position.set(halfW + 3.0, 6, 0);

    const gantryBeam = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH + 7.5, 1.2, 1.8), gantryPillarMat);
    gantryBeam.position.set(0, 11.5, 0);

    // Start lights (5 Red LEDs)
    for (let light = 0; light < 5; light++) {
      const redLed = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.3, 16),
        new THREE.MeshBasicMaterial({ color: 0xff1e00 })
      );
      redLed.rotateX(Math.PI / 2);
      redLed.position.set(-3.6 + light * 1.8, 11.2, -0.9);
      gantry.add(redLed);
    }

    gantry.add(gantryLeftPillar);
    gantry.add(gantryRightPillar);
    gantry.add(gantryBeam);
    gantry.position.copy(startPt.position);
    gantry.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), startPt.tangent);
    trackGroup.add(gantry);

    // 3. Braking Distance Boards (150m, 100m, 50m) along circuit
    trackDef.brakingMarkers.forEach((bm) => {
      const pt = getTrackPointAtDistance(bm.dist, currentTrackId);
      const boardGroup = new THREE.Group();

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x52525b })
      );
      pole.position.set(0, 1.1, 0);
      boardGroup.add(pole);

      const boardCanvas = document.createElement('canvas');
      boardCanvas.width = 128;
      boardCanvas.height = 96;
      const ctxB = boardCanvas.getContext('2d')!;
      ctxB.fillStyle = '#ffffff';
      ctxB.fillRect(0, 0, 128, 96);
      ctxB.fillStyle = '#09090b';
      ctxB.font = 'bold 54px monospace, sans-serif';
      ctxB.textAlign = 'center';
      ctxB.textBaseline = 'middle';
      ctxB.fillText(bm.label, 64, 48);

      const boardTex = new THREE.CanvasTexture(boardCanvas);
      const boardMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.1, 0.08),
        new THREE.MeshBasicMaterial({ map: boardTex })
      );
      boardMesh.position.set(0, 1.8, 0);
      boardGroup.add(boardMesh);

      const markerPos = pt.position.clone().add(pt.normal.clone().multiplyScalar(halfW + 2.8));
      boardGroup.position.copy(markerPos);
      boardGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pt.tangent);
      trackGroup.add(boardGroup);
    });

    // 4. Infield Grass / Runoff Basin
    const grassGeo = new THREE.PlaneGeometry(1600, 1600, 40, 40);
    grassGeo.rotateX(-Math.PI / 2);
    const grassColor = isWet ? 0x142018 : isNight ? 0x080f0c : currentWeatherId === 'hot' ? 0x2a2818 : 0x1e3a24;
    const grassMat = new THREE.MeshStandardMaterial({
      color: grassColor,
      roughness: 0.95,
      metalness: 0.05,
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.position.set(0, -0.05, 0);
    grassMesh.receiveShadow = true;
    trackGroup.add(grassMesh);

    // 5. Trackside Barrier Tecpro Fences
    const fenceStep = 40;
    for (let i = 0; i < segments; i += fenceStep) {
      const u = i / segments;
      const pt = getTrackPointAtDistance(u * totalLength, currentTrackId);
      const barrierLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 18),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.7, roughness: 0.4 })
      );
      const posL = pt.position.clone().add(pt.normal.clone().multiplyScalar(halfW + 4.5));
      barrierLeft.position.set(posL.x, posL.y + 0.6, posL.z);
      barrierLeft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pt.tangent);
      trackGroup.add(barrierLeft);
    }

    // 6. Stadium Floodlight Towers (Around the circuit)
    const towerPositions = [
      { x: -70, z: -200 },
      { x: 180, z: 240 },
      { x: 420, z: -150 },
      { x: 80, z: -460 },
      { x: -160, z: 80 },
    ];

    towerPositions.forEach((pos) => {
      const tower = new THREE.Group();
      const mastGeo = new THREE.CylinderGeometry(0.6, 0.9, 32, 12);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.set(pos.x, 16, pos.z);
      tower.add(mast);

      // Floodlight Head
      const headGeo = new THREE.BoxGeometry(6, 2.5, 1.2);
      const headMat = new THREE.MeshBasicMaterial({ color: isNight ? 0xfff0b0 : 0xfef08a });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(pos.x, 32, pos.z);
      tower.add(head);

      if (isNight) {
        const spot = new THREE.SpotLight(0xfff3d6, 3.5, 300, Math.PI / 4, 0.4);
        spot.position.set(pos.x, 32, pos.z);
        spot.target.position.set(pos.x * 0.3, 0, pos.z * 0.3);
        tower.add(spot);
        tower.add(spot.target);
      }

      trackGroup.add(tower);
    });

    return trackGroup;
  };

  // Build Dynamic 3D Racing Line Ribbons on the Track
  const createRacingLineRibbon = (currentTrackId: TrackId, isRL: boolean) => {
    const numPoints = 600;
    const pts: THREE.Vector3[] = [];
    const color = isRL ? 0x00e5ff : 0xf59e0b; // Neon Cyan vs Amber Gold

    const trackCurveData = getTrackCurve(currentTrackId);
    const totalLength = trackCurveData.totalLength;

    for (let i = 0; i < numPoints; i++) {
      const dist = (i / numPoints) * totalLength;
      const pt = getTrackPointAtDistance(dist, currentTrackId);
      // Lateral offset: RL has optimized apex trail line
      const offset = isRL
        ? Math.sin((dist / totalLength) * Math.PI * 18 + 0.15) * 2.6
        : Math.sin((dist / totalLength) * Math.PI * 18) * 1.8;

      const pos = pt.position.clone().add(pt.normal.clone().multiplyScalar(offset));
      pts.push(new THREE.Vector3(pos.x, pos.y + 0.04, pos.z));
    }

    const curve = new THREE.CatmullRomCurve3(pts, true);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(800));
    const material = new THREE.LineBasicMaterial({
      color,
      linewidth: 3,
      transparent: true,
      opacity: isRL ? 0.9 : 0.7,
    });

    return new THREE.Line(geometry, material);
  };

  // Initialize Scene, Renderer, Lights & 3D Objects
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const textures = createProceduralTextures(weatherId === 'wet');
    texturesRef.current = textures;

    const scene = new THREE.Scene();
    const weather = WEATHER_CONDITIONS[weatherId] || WEATHER_CONDITIONS.dry;
    scene.background = new THREE.Color(weather.skyColor);
    scene.fog = new THREE.FogExp2(weather.skyColor, weatherId === 'wet' ? 0.0038 : weatherId === 'cold' ? 0.0032 : 0.0018);
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Grand Prix Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, weatherId === 'night' ? 0.45 : weatherId === 'wet' ? 0.8 : 1.05);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(
      weatherId === 'hot' ? 0xffeaaf : weatherId === 'cold' ? 0xccdcff : 0xfff5ea,
      weatherId === 'night' ? 0.6 : weatherId === 'wet' ? 1.6 : 2.5
    );
    mainSun.position.set(160, 240, 120);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.camera.near = 10;
    mainSun.shadow.camera.far = 1200;
    mainSun.shadow.camera.left = -400;
    mainSun.shadow.camera.right = 400;
    mainSun.shadow.camera.top = 400;
    mainSun.shadow.camera.bottom = -400;
    scene.add(mainSun);

    const stadiumFill = new THREE.DirectionalLight(0x60a5fa, weatherId === 'night' ? 1.4 : 0.7);
    stadiumFill.position.set(-150, 120, -150);
    scene.add(stadiumFill);

    // Add Realistic Track Environment
    const trackEnv = createRealisticTrackEnvironment(trackId, weatherId, textures);
    scene.add(trackEnv);
    trackGroupRef.current = trackEnv;

    // 3D Racing Lines on Track
    const rlLine = createRacingLineRibbon(trackId, true);
    const baseLine = createRacingLineRibbon(trackId, false);
    scene.add(rlLine);
    scene.add(baseLine);
    rlRacingLineRef.current = rlLine;
    baseRacingLineRef.current = baseLine;

    // Build Both Cars
    const baseModel = createRealisticF1CarModel(false, textures);
    scene.add(baseModel.car);
    baseCarGroupRef.current = baseModel.car;
    baseWheelsRef.current = baseModel.wheels;
    baseBrakeDiscsRef.current = baseModel.brakeDiscs;
    baseRainLightRef.current = baseModel.rainLight;

    const rlModel = createRealisticF1CarModel(true, textures);
    scene.add(rlModel.car);
    rlCarGroupRef.current = rlModel.car;
    rlWheelsRef.current = rlModel.wheels;
    rlBrakeDiscsRef.current = rlModel.brakeDiscs;
    rlDrsFlapRef.current = rlModel.drsFlap;
    rlRainLightRef.current = rlModel.rainLight;

    // Add AR 3D Billboard Floating Tags
    const baseTag = createCarTagSprite(false);
    baseModel.car.add(baseTag);
    baseTagSpriteRef.current = baseTag;

    const rlTag = createCarTagSprite(true);
    rlModel.car.add(rlTag);
    rlTagSpriteRef.current = rlTag;

    // Aero Flow Streamlines
    const baseAero = createAeroStream(false);
    baseModel.car.add(baseAero);
    baseAeroStreamRef.current = baseAero;

    const rlAero = createAeroStream(true);
    rlModel.car.add(rlAero);
    rlAeroStreamRef.current = rlAero;

    // Wet Weather Water Spray Rooster Tails
    const baseSpray = createWaterSpray(false);
    baseModel.car.add(baseSpray);
    baseSprayRef.current = baseSpray;

    const rlSpray = createWaterSpray(true);
    rlModel.car.add(rlSpray);
    rlSprayRef.current = rlSpray;

    // Rain particle system
    const rain = createRainSystem();
    scene.add(rain);
    rainSystemRef.current = rain;
    rain.visible = weatherId === 'wet' || weatherId === 'cold';

    // Dynamic 3D Leader Line connecting both cars
    const leadLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.4, 0),
      new THREE.Vector3(0, 0.4, 0),
    ]);
    const leadLineMat = new THREE.LineDashedMaterial({
      color: 0x00e5ff,
      dashSize: 1.2,
      gapSize: 0.6,
      linewidth: 2,
    });
    const leadLine = new THREE.Line(leadLineGeo, leadLineMat);
    scene.add(leadLine);
    leadLineRef.current = leadLine;

    // Cameras
    const aspect = width / height;
    const camMain = new THREE.PerspectiveCamera(48, aspect, 0.1, 2400);
    const camLeft = new THREE.PerspectiveCamera(48, (width / 2) / height, 0.1, 2400);
    const camRight = new THREE.PerspectiveCamera(48, (width / 2) / height, 0.1, 2400);

    mainCameraRef.current = camMain;
    cameraLeftRef.current = camLeft;
    cameraRightRef.current = camRight;

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;

      rendererRef.current.setSize(w, h);
      if (camMain) {
        camMain.aspect = w / h;
        camMain.updateProjectionMatrix();
      }
      if (camLeft && camRight) {
        camLeft.aspect = (w / 2) / h;
        camLeft.updateProjectionMatrix();
        camRight.aspect = (w / 2) / h;
        camRight.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      renderer.dispose();
    };
  }, [trackId, weatherId]);

  // Update Frame: Car Positions, Steering Angles, Wheel Speeds, Brake Glowing, DRS Flap & Cameras
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current) return;

    const baseCar = baseCarGroupRef.current;
    const rlCar = rlCarGroupRef.current;

    if (!baseCar || !rlCar) return;

    // Toggle aero visibility & racing lines
    if (baseAeroStreamRef.current) baseAeroStreamRef.current.visible = showAeroFlow;
    if (rlAeroStreamRef.current) rlAeroStreamRef.current.visible = showAeroFlow;
    if (baseRacingLineRef.current) baseRacingLineRef.current.visible = showRacingLines;
    if (rlRacingLineRef.current) rlRacingLineRef.current.visible = showRacingLines;

    // Wet weather spray & rain animation
    const isWetWeather = weatherId === 'wet';
    if (baseSprayRef.current) baseSprayRef.current.visible = isWetWeather && baseTelemetry.speed > 80;
    if (rlSprayRef.current) rlSprayRef.current.visible = isWetWeather && rlTelemetry.speed > 80;

    if (rainSystemRef.current && (weatherId === 'wet' || weatherId === 'cold')) {
      const positions = rainSystemRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 2.2;
        if (positions[i] < 0) positions[i] = 100;
      }
      rainSystemRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Flashing Rain Safety Light in wet
    const rainFlash = isWetWeather && Math.floor(Date.now() / 150) % 2 === 0;
    if (baseRainLightRef.current) baseRainLightRef.current.intensity = rainFlash ? 6.0 : 0;
    if (rlRainLightRef.current) rlRainLightRef.current.intensity = rainFlash ? 6.0 : 0;

    // Track anchor coordinates
    const ptBase = getTrackPointAtDistance(baseTelemetry.distance, trackId);
    const ptRL = getTrackPointAtDistance(rlTelemetry.distance, trackId);

    // Compute 3D Positions with lateral racing line offsets
    const basePos = ptBase.position.clone().add(ptBase.normal.clone().multiplyScalar(baseTelemetry.racingLineOffset));
    const rlPos = ptRL.position.clone().add(ptRL.normal.clone().multiplyScalar(rlTelemetry.racingLineOffset));

    baseCar.position.copy(basePos);
    rlCar.position.copy(rlPos);

    // =========================================================================
    // MATHEMATICALLY ROBUST CAR ORIENTATION (STRICT F1 RACING HEADING)
    // =========================================================================
    const upGlobal = new THREE.Vector3(0, 1, 0);

    // 1. Base Car Orientation Matrix
    // Model coordinates: +Z = forward nose, +X = right lateral, +Y = roof/up
    const forwardBase = ptBase.tangent.clone().normalize();
    const rightBase = new THREE.Vector3().crossVectors(upGlobal, forwardBase).normalize();
    const correctedUpBase = new THREE.Vector3().crossVectors(forwardBase, rightBase).normalize();

    const basisBase = new THREE.Matrix4().makeBasis(rightBase, correctedUpBase, forwardBase);
    baseCar.quaternion.setFromRotationMatrix(basisBase);

    // Subtle F1 chassis dynamics (stiff F1 suspension with minimal roll)
    const rollBase = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -baseTelemetry.lateralG * 0.008);
    const pitchBase = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -baseTelemetry.longitudinalG * 0.006);
    baseCar.quaternion.multiply(rollBase).multiply(pitchBase);

    // 2. RL Car Orientation Matrix
    const forwardRL = ptRL.tangent.clone().normalize();
    const rightRL = new THREE.Vector3().crossVectors(upGlobal, forwardRL).normalize();
    const correctedUpRL = new THREE.Vector3().crossVectors(forwardRL, rightRL).normalize();

    const basisRL = new THREE.Matrix4().makeBasis(rightRL, correctedUpRL, forwardRL);
    rlCar.quaternion.setFromRotationMatrix(basisRL);

    const rollRL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -rlTelemetry.lateralG * 0.006);
    const pitchRL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -rlTelemetry.longitudinalG * 0.004);
    rlCar.quaternion.multiply(rollRL).multiply(pitchRL);

    // Rotate Wheels & Steer Front Wheels with exact steering angle
    const baseSteerRad = baseTelemetry.steerAngle * 0.28;
    baseWheelsRef.current.forEach(({ mesh, group, isFront }) => {
      mesh.rotation.x += (baseTelemetry.speed / 3.6) * 0.024;
      if (isFront) group.rotation.y = baseSteerRad;
    });

    const rlSteerRad = rlTelemetry.steerAngle * 0.26;
    rlWheelsRef.current.forEach(({ mesh, group, isFront }) => {
      mesh.rotation.x += (rlTelemetry.speed / 3.6) * 0.024;
      if (isFront) group.rotation.y = rlSteerRad;
    });

    // Brake Disc Glowing under heavy deceleration (longitudinal G < -1.8)
    const baseBrakeHeat = Math.max(0, Math.min(1, (-baseTelemetry.longitudinalG - 1.2) / 3.5));
    baseBrakeDiscsRef.current.forEach((mat) => {
      mat.emissive.setHex(0xff3300);
      mat.emissiveIntensity = baseBrakeHeat * 3.5;
    });

    const rlBrakeHeat = Math.max(0, Math.min(1, (-rlTelemetry.longitudinalG - 1.2) / 3.5));
    rlBrakeDiscsRef.current.forEach((mat) => {
      mat.emissive.setHex(0xff3300);
      mat.emissiveIntensity = rlBrakeHeat * 3.5;
    });

    // DRS Flap Articulation on RL Car
    if (rlDrsFlapRef.current) {
      const targetDRSAngle = rlTelemetry.drsActive ? -0.15 : 0.28;
      rlDrsFlapRef.current.rotation.x = THREE.MathUtils.lerp(
        rlDrsFlapRef.current.rotation.x,
        targetDRSAngle,
        0.25
      );
    }

    // Dynamic 3D Leader Line connecting both cars
    if (leadLineRef.current) {
      const posAttr = leadLineRef.current.geometry.attributes.position;
      posAttr.setXYZ(0, basePos.x, basePos.y + 0.4, basePos.z);
      posAttr.setXYZ(1, rlPos.x, rlPos.y + 0.4, rlPos.z);
      posAttr.needsUpdate = true;
      leadLineRef.current.computeLineDistances();
      leadLineRef.current.visible = syncMode === 'time' && basePos.distanceTo(rlPos) > 1.2;
    }

    // Camera Positioning & Cinematic Tracking Logic
    const midPoint = new THREE.Vector3().addVectors(basePos, rlPos).multiplyScalar(0.5);
    const leadCarPos = rlPos;
    const tangent = ptRL.tangent.clone().normalize();
    const normal = ptRL.normal.clone().normalize();

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camMain = mainCameraRef.current;
    const camLeft = cameraLeftRef.current;
    const camRight = cameraRightRef.current;

    if (!camMain || !renderer || !scene) return;

    const width = renderer.domElement.clientWidth;
    const height = renderer.domElement.clientHeight;

    if (cameraMode === 'split' && camLeft && camRight) {
      // Split Screen Rendering: Dual Viewports
      renderer.setScissorTest(true);

      // Left Viewport (Standard Baseline Car)
      renderer.setViewport(0, 0, width / 2, height);
      renderer.setScissor(0, 0, width / 2, height);

      const baseTang = ptBase.tangent.clone().normalize();
      const baseNorm = ptBase.normal.clone().normalize();
      camLeft.position.copy(basePos)
        .add(baseTang.clone().multiplyScalar(-10.5))
        .add(new THREE.Vector3(0, 3.8, 0))
        .add(baseNorm.clone().multiplyScalar(2.0));
      camLeft.lookAt(basePos.clone().add(new THREE.Vector3(0, 0.6, 0)));
      renderer.render(scene, camLeft);

      // Right Viewport (RL-Optimized Car)
      renderer.setViewport(width / 2, 0, width / 2, height);
      renderer.setScissor(width / 2, 0, width / 2, height);

      camRight.position.copy(rlPos)
        .add(tangent.clone().multiplyScalar(-10.5))
        .add(new THREE.Vector3(0, 3.8, 0))
        .add(normal.clone().multiplyScalar(2.0));
      camRight.lookAt(rlPos.clone().add(new THREE.Vector3(0, 0.6, 0)));
      renderer.render(scene, camRight);

      renderer.setScissorTest(false);
    } else {
      // Unified Full-Screen Rendering Modes
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, width, height);

      if (cameraMode === 'director') {
        // =========================================================================
        // AUTO-DIRECTOR INTELLIGENT TV BROADCAST CAMERA ENGINE
        // =========================================================================
        const dir = directorStateRef.current;
        const now = performance.now();
        const elapsed = (now - dir.shotStartTime) / 1000;
        const speed = rlTelemetry.speed; // km/h
        const latG = Math.abs(rlTelemetry.lateralG);
        const longG = rlTelemetry.longitudinalG;
        const dist = rlTelemetry.distance;
        const activeTrackData = TRACKS_DATA[trackId] || TRACKS_DATA.silverstone;
        const trackLen = activeTrackData.lengthMeters;

        // Check if stationary trackside camera is out of view range
        let outOfStationaryRange = false;
        if (dir.isStationary) {
          const distFromCam = camMain.position.distanceTo(midPoint);
          if (distFromCam > 120 || distFromCam < 3.5) {
            outOfStationaryRange = true;
          }
        }

        // Real-time dynamic cuts based on racing events
        const isHeavyBraking =
          longG < -1.7 &&
          (dir.shotType === 'SPEED_TRAP_TELEPHOTO' || dir.shotType === 'NOSE_WING_CAM') &&
          elapsed > 1.2;
        const isHighSpeedExit =
          speed > 270 &&
          latG < 1.1 &&
          (dir.shotType === 'APEX_KERB_CAM' || dir.shotType === 'HELI_SWEEP_CRANE') &&
          elapsed > 1.5;

        const shouldSwitch =
          elapsed >= dir.shotMinDuration || outOfStationaryRange || isHeavyBraking || isHighSpeedExit;

        if (shouldSwitch) {
          // Intelligently select optimal camera angle based on vehicle telemetry & track segment
          const candidates: DirectorShotType[] = [];

          if (speed > 265 && latG < 1.4) {
            // High-speed straightaway or DRS activation zone
            candidates.push('SPEED_TRAP_TELEPHOTO', 'NOSE_WING_CAM', 'CHASE_DYNAMIC', 'TOWER_HIGH_PAN');
          } else if (longG < -1.4 || latG > 2.8) {
            // Heavy braking threshold or sharp corner apex
            candidates.push('APEX_KERB_CAM', 'ONBOARD_TCAM', 'HELI_SWEEP_CRANE');
          } else if (latG > 1.8) {
            // High-G sweeping complex (aerodynamic ground effect load)
            candidates.push('HELI_SWEEP_CRANE', 'TOWER_HIGH_PAN', 'APEX_KERB_CAM', 'ONBOARD_TCAM');
          } else {
            // Flowing section / wheel-to-wheel race gap
            candidates.push('CHASE_DYNAMIC', 'REVERSE_BATTLE_CAM', 'ONBOARD_TCAM', 'HELI_SWEEP_CRANE');
          }

          // Pick next distinct shot to avoid abrupt camera flickering
          const filteredPool = candidates.filter((s) => s !== dir.shotType);
          const nextShot =
            filteredPool.length > 0
              ? filteredPool[Math.floor(Math.random() * filteredPool.length)]
              : candidates[0] || 'CHASE_DYNAMIC';

          dir.shotType = nextShot;
          dir.shotStartTime = now;
          dir.shotMinDuration = 2.8 + Math.random() * 1.6; // 2.8s to 4.4s realistic broadcast cadence

          if (nextShot === 'SPEED_TRAP_TELEPHOTO') {
            const ptAhead = getTrackPointAtDistance((dist + 95) % trackLen, trackId);
            const sideOffset = (Math.sin(dist * 0.05) > 0 ? 1 : -1) * 8.5;
            dir.anchorWorldPos
              .copy(ptAhead.position)
              .add(ptAhead.normal.clone().multiplyScalar(sideOffset))
              .add(new THREE.Vector3(0, 2.2, 0));
            dir.anchorTrackDist = (dist + 95) % trackLen;
            dir.isStationary = true;
            dir.targetFov = 26; // High optical compression
            dir.cameraName = `CAM 01: ${activeTrackData.name.toUpperCase()} SPEED TRAP`;
            dir.lensSpecs = '400mm F/2.8 IS Telephoto';
            dir.directorReason = `SPEED TRAP RUN (${Math.round(speed)} KM/H)`;
            camMain.position.copy(dir.anchorWorldPos);
          } else if (nextShot === 'APEX_KERB_CAM') {
            const ptApex = getTrackPointAtDistance((dist + 32) % trackLen, trackId);
            const innerOffset = ptApex.normal.clone().multiplyScalar(-4.5);
            dir.anchorWorldPos
              .copy(ptApex.position)
              .add(innerOffset)
              .add(new THREE.Vector3(0, 0.95, 0));
            dir.anchorTrackDist = (dist + 32) % trackLen;
            dir.isStationary = true;
            dir.targetFov = 38;
            dir.cameraName = `CAM 03: APEX KERB TRACKSIDE`;
            dir.lensSpecs = '85mm F/1.4 Cine Prime';
            dir.directorReason = `CORNER APEX LOAD (${latG.toFixed(1)}G LATERAL)`;
            camMain.position.copy(dir.anchorWorldPos);
          } else if (nextShot === 'TOWER_HIGH_PAN') {
            const ptTower = getTrackPointAtDistance((dist + 45) % trackLen, trackId);
            dir.anchorWorldPos
              .copy(ptTower.position)
              .add(ptTower.normal.clone().multiplyScalar(32.0))
              .add(new THREE.Vector3(0, 16.0, 0));
            dir.anchorTrackDist = (dist + 45) % trackLen;
            dir.isStationary = true;
            dir.targetFov = 30;
            dir.cameraName = `CAM 02: GRANDSTAND TOWER PAN`;
            dir.lensSpecs = '200mm Broadcast Zoom';
            dir.directorReason = `SECTOR OVERVIEW & PACING`;
            camMain.position.copy(dir.anchorWorldPos);
          } else if (nextShot === 'HELI_SWEEP_CRANE') {
            dir.isStationary = false;
            dir.targetFov = 44;
            dir.orbitAngle = Math.atan2(tangent.z, tangent.x) + 0.8;
            dir.orbitSpeed = 0.25;
            dir.cameraName = `CAM 05: GYRO HELI-CRANE 4K`;
            dir.lensSpecs = '35mm Aerial CineLens';
            dir.directorReason = `HIGH-G AERO SWEEPER (${latG.toFixed(1)}G)`;
          } else if (nextShot === 'ONBOARD_TCAM') {
            dir.isStationary = false;
            dir.targetFov = 66;
            dir.cameraName = `CAM 09: ONBOARD T-CAM #01`;
            dir.lensSpecs = '18mm Ultra-Wide Action';
            dir.directorReason = `DRIVER COCKPIT & TRAIL-BRAKE`;
          } else if (nextShot === 'NOSE_WING_CAM') {
            dir.isStationary = false;
            dir.targetFov = 52;
            dir.cameraName = `CAM 07: FRONT NOSE-WING POD`;
            dir.lensSpecs = '24mm Macro Action';
            dir.directorReason = `VENTURI UNDERFLOOR & WING VORTICES`;
          } else if (nextShot === 'REVERSE_BATTLE_CAM') {
            dir.isStationary = false;
            dir.targetFov = 46;
            dir.cameraName = `CAM 06: REVERSE BATTLE PURSUIT`;
            dir.lensSpecs = '35mm Action Prime';
            dir.directorReason = `WHEEL-TO-WHEEL BATTLE GAP`;
          } else {
            // CHASE_DYNAMIC
            dir.isStationary = false;
            dir.targetFov = 48;
            dir.cameraName = `CAM 08: DYNAMIC BROADCAST CHASE`;
            dir.lensSpecs = '50mm Broadcast Master';
            dir.directorReason = `RACE LEAD & VEHICLE DYNAMICS`;
          }

          setDirectorHUD({
            name: dir.cameraName,
            lens: dir.lensSpecs,
            reason: dir.directorReason,
            shotType: dir.shotType,
            shotStartTime: dir.shotStartTime,
            shotMinDuration: dir.shotMinDuration,
          });
        }

        // Frame update for active director camera shot
        if (
          dir.shotType === 'SPEED_TRAP_TELEPHOTO' ||
          dir.shotType === 'APEX_KERB_CAM' ||
          dir.shotType === 'TOWER_HIGH_PAN'
        ) {
          camMain.position.copy(dir.anchorWorldPos);
          const lookTarget = midPoint
            .clone()
            .add(new THREE.Vector3(0, 0.6, 0))
            .add(tangent.clone().multiplyScalar(1.5));
          camMain.lookAt(lookTarget);
        } else if (dir.shotType === 'HELI_SWEEP_CRANE') {
          dir.orbitAngle += 0.008;
          const craneDist = 28.0;
          const heliPos = midPoint.clone().add(
            new THREE.Vector3(
              Math.cos(dir.orbitAngle) * craneDist,
              18.5,
              Math.sin(dir.orbitAngle) * craneDist
            )
          );
          camMain.position.lerp(heliPos, 0.12);
          camMain.lookAt(midPoint.clone().add(new THREE.Vector3(0, 0.6, 0)));
        } else if (dir.shotType === 'ONBOARD_TCAM') {
          const tCamPos = rlPos
            .clone()
            .add(tangent.clone().multiplyScalar(-0.25))
            .add(new THREE.Vector3(0, 1.15, 0))
            .add(normal.clone().multiplyScalar(0.04));
          camMain.position.copy(tCamPos);
          camMain.lookAt(
            rlPos
              .clone()
              .add(tangent.clone().multiplyScalar(22.0))
              .add(new THREE.Vector3(0, 0.5, 0))
          );
        } else if (dir.shotType === 'NOSE_WING_CAM') {
          const nosePos = rlPos
            .clone()
            .add(tangent.clone().multiplyScalar(1.95))
            .add(normal.clone().multiplyScalar(0.75))
            .add(new THREE.Vector3(0, 0.36, 0));
          camMain.position.copy(nosePos);
          camMain.lookAt(
            rlPos
              .clone()
              .add(tangent.clone().multiplyScalar(-1.2))
              .add(new THREE.Vector3(0, 0.55, 0))
          );
        } else if (dir.shotType === 'REVERSE_BATTLE_CAM') {
          const revPos = rlPos
            .clone()
            .add(tangent.clone().multiplyScalar(13.5))
            .add(normal.clone().multiplyScalar(-1.8))
            .add(new THREE.Vector3(0, 2.4, 0));
          camMain.position.lerp(revPos, 0.22);
          camMain.lookAt(midPoint.clone().add(new THREE.Vector3(0, 0.5, 0)));
        } else {
          // CHASE_DYNAMIC
          const targetCamPos = midPoint
            .clone()
            .add(tangent.clone().multiplyScalar(-13.5))
            .add(new THREE.Vector3(0, 4.4, 0))
            .add(normal.clone().multiplyScalar(2.2));
          camMain.position.lerp(targetCamPos, 0.22);
          camMain.lookAt(
            midPoint
              .clone()
              .add(new THREE.Vector3(0, 0.7, 0))
              .add(tangent.clone().multiplyScalar(4.0))
          );
        }

        // Smooth optical FOV zoom lerp
        camMain.fov = THREE.MathUtils.lerp(camMain.fov, dir.targetFov, 0.12);
        camMain.updateProjectionMatrix();
      } else {
        // Reset FOV to standard 48 when outside of Director mode
        if (Math.abs(camMain.fov - 48) > 0.5) {
          camMain.fov = THREE.MathUtils.lerp(camMain.fov, 48, 0.2);
          camMain.updateProjectionMatrix();
        }

        if (cameraMode === 'chase') {
          // Unified Chase Camera showing both cars
          const targetCamPos = midPoint
            .clone()
            .add(tangent.clone().multiplyScalar(-13.5))
            .add(new THREE.Vector3(0, 4.6, 0))
            .add(normal.clone().multiplyScalar(2.4));

          camMain.position.lerp(targetCamPos, 0.22);
          camMain.lookAt(
            midPoint
              .clone()
              .add(new THREE.Vector3(0, 0.8, 0))
              .add(tangent.clone().multiplyScalar(4.5))
          );
        } else if (cameraMode === 'trackside') {
          // High-Zoom Telephoto Lens at Track Apexes
          const tracksidePos = ptRL.position
            .clone()
            .add(normal.clone().multiplyScalar(18.0))
            .add(new THREE.Vector3(0, 4.5, 0));

          camMain.position.lerp(tracksidePos, 0.08);
          camMain.lookAt(midPoint.clone().add(new THREE.Vector3(0, 0.5, 0)));
        } else if (cameraMode === 'overhead') {
          // High-Altitude Tactical Bird's-Eye View
          const overheadPos = midPoint
            .clone()
            .add(new THREE.Vector3(0, 42, 0))
            .add(tangent.clone().multiplyScalar(-8));
          camMain.position.lerp(overheadPos, 0.2);
          camMain.lookAt(midPoint);
        } else if (cameraMode === 'cockpit') {
          // First-person Halo Driver View from RL Car
          const cockpitPos = rlPos
            .clone()
            .add(tangent.clone().multiplyScalar(0.12))
            .add(new THREE.Vector3(0, 0.72, 0));
          camMain.position.copy(cockpitPos);
          camMain.lookAt(
            rlPos
              .clone()
              .add(tangent.clone().multiplyScalar(18.0))
              .add(new THREE.Vector3(0, 0.6, 0))
          );
        } else if (cameraMode === 'gyro') {
          // Dynamic Rolling Drone
          const gyroPos = leadCarPos
            .clone()
            .add(tangent.clone().multiplyScalar(-9.0))
            .add(normal.clone().multiplyScalar(-4.5))
            .add(new THREE.Vector3(0, 3.2, 0));
          camMain.position.lerp(gyroPos, 0.18);
          camMain.lookAt(midPoint);
        } else if (cameraMode === 'ghost') {
          // Tight Close-Up comparing lateral deviation
          const ghostCamPos = midPoint
            .clone()
            .add(tangent.clone().multiplyScalar(-7.5))
            .add(normal.clone().multiplyScalar(3.2))
            .add(new THREE.Vector3(0, 2.4, 0));
          camMain.position.lerp(ghostCamPos, 0.25);
          camMain.lookAt(midPoint.clone().add(new THREE.Vector3(0, 0.4, 0)));
        }
      }

      renderer.render(scene, camMain);
    }
  }, [
    trackId,
    weatherId,
    cameraMode,
    syncMode,
    baseTelemetry,
    rlTelemetry,
    showAeroFlow,
    showRacingLines,
  ]);

  return (
    <div
      ref={containerRef}
      id="f1-3d-scene-container"
      className="relative w-full h-full min-h-0 overflow-hidden bg-[#07090e] cursor-grab active:cursor-grabbing"
    >
      <canvas
        ref={canvasRef}
        id="f1-threejs-canvas"
        className="w-full h-full block"
      />

      {/* AR Viewport Overlay Watermark & Telemetry Grid Target */}
      <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2 text-[10px] font-mono tracking-widest text-white/40 uppercase">
        <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>Grand Prix Neural Sim // {TRACKS_DATA[trackId]?.name.toUpperCase()}</span>
      </div>

      {/* Weather status watermark */}
      <div className="absolute top-3 right-3 pointer-events-none flex items-center gap-2 text-[10px] font-mono tracking-widest text-amber-400/80 bg-black/40 px-2 py-1 rounded border border-white/10 uppercase">
        <span>{WEATHER_CONDITIONS[weatherId]?.badge}</span>
      </div>

      {/* Broadcast TV Auto-Director Graphic Overlay */}
      {cameraMode === 'director' && directorHUD && (
        <div className="absolute bottom-4 left-4 pointer-events-none z-10 animate-fade-in flex flex-col gap-1.5 select-none">
          <div className="bg-[#0b0e18]/90 border border-white/[0.12] backdrop-blur-md rounded-xl p-2.5 px-3 flex items-center gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/90 text-white font-black text-[10px] tracking-wider uppercase shadow-[0_0_12px_rgba(239,68,68,0.7)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE DIRECTED</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white tracking-tight font-mono">
                  {directorHUD.name}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ({directorHUD.lens})
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-cyan-300 font-mono font-medium">
                <span>AI Reason: {directorHUD.reason}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
