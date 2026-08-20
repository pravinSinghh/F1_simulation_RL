import {
  TelemetryPoint,
  LapSummary,
  CarOptimizationSpec,
  TrackId,
  WeatherConditionId,
  AeroPartCondition,
  StintEvaluationReport,
  StintLapResult,
} from '../types';
import {
  TRACKS_DATA,
  WEATHER_CONDITIONS,
  getTrackCurve,
  getTrackPointAtDistance,
} from './f1Track';

export const AERO_PART_CONDITIONS: AeroPartCondition[] = [
  {
    id: 'front-wing',
    partName: 'Front Wing Mainplane & Flap Chord',
    category: 'Front Axle',
    baselineStatus: 'Static 18.5° Angle of Attack (High Pitch Sensitivity)',
    rlOptimizedStatus: 'Adaptive 20.9° AoA with Active Slot Vortex Shedding',
    aerodynamicGain: '+12.8% Front Axle Downforce & Reduced Understeer',
    telemetryImpact: 'Maintains crisp turn-in bite; baseline loses 0.18s at mid-corner apexes due to front-end wash.',
    efficiencyRating: 96,
  },
  {
    id: 'venturi-floor',
    partName: 'Venturi Underfloor Tunnels & Diffuser Expander',
    category: 'Underfloor / Diffuser',
    baselineStatus: '28mm Static Ride Height (Susceptible to Porpoising & Flow Separation)',
    rlOptimizedStatus: '22mm Dynamic Sealed Profile with Curved Floor Edge Wings',
    aerodynamicGain: '+18.5% Low-Drag Ground Effect Suction (L/D +0.34)',
    telemetryImpact: 'Generates up to 1,480 kg of suction at 300 km/h with zero porpoising oscillations.',
    efficiencyRating: 99,
  },
  {
    id: 'rear-wing-drs',
    partName: 'Rear Wing Beam & DRS Drag Reduction Slot',
    category: 'Rear / DRS',
    baselineStatus: 'Conventional Gurney Camber & Fixed Flap Geometry',
    rlOptimizedStatus: 'Variable Boundary Layer Gurney & Optimized DRS Slot Gap',
    aerodynamicGain: '+14.2% DRS Straight-Line Drag Reduction (-42 N Induced Drag)',
    telemetryImpact: 'Top speed elevated by +7 to +11 km/h on main straights; instant high-speed braking rear clamp.',
    efficiencyRating: 94,
  },
  {
    id: 'brake-cooling',
    partName: 'Brake Cooling Airfoils & Wheel Rim Aero Covers',
    category: 'Cooling & Ducts',
    baselineStatus: 'Open Fixed Scoops (Turbulent Wheel Wake & Overcooling)',
    rlOptimizedStatus: 'Laminar Venting Channels (Strict 580°C Brake Rotor Window)',
    aerodynamicGain: '+8.4% Cleaner Outwash Around Rotating Front Wheels',
    telemetryImpact: 'Eliminates brake fade over 20-lap race distance while shedding parasitic aerodynamic drag.',
    efficiencyRating: 92,
  },
  {
    id: 'sidepod-halo',
    partName: 'Sidepod Undercut & Halo Flow Conditioners',
    category: 'Tire Aero Vortex',
    baselineStatus: 'Standard Radiator Inlets & Linear Airflow Channeling',
    rlOptimizedStatus: 'Extreme Deep Undercut Guiding Clean Air to Beam Wing',
    aerodynamicGain: '+11.6% Increased Rear Downforce from Beam Wing',
    telemetryImpact: 'Car remains planted under rapid high-speed directional changes (e.g. Maggotts-Becketts, Ascari).',
    efficiencyRating: 95,
  },
];

export const RL_OPTIMIZATIONS: CarOptimizationSpec[] = [
  {
    name: 'Front Wing Angle & Flap Chord',
    category: 'aerodynamics',
    baselineVal: '18.5° Angle of Attack',
    optimizedVal: '20.9° (+2.4° Adaptive)',
    delta: '+12.8% Front Downforce',
    gainDescription: 'Enhances high-speed front axle bite into fast sweepers, minimizing understeer during mid-corner transitions.',
    impactScore: 9.4,
  },
  {
    name: 'Floor Venturi Tunnels & Ground Effect',
    category: 'aerodynamics',
    baselineVal: '28mm Static Ride Height',
    optimizedVal: '22mm Dynamic Anti-Porpoise Profile',
    delta: '+18.5% Floor Suction (L/D +0.34)',
    gainDescription: 'Reinforcement learning dynamic floor seal maintains optimum ground effect under heavy yaw angle without triggering stall.',
    impactScore: 9.8,
  },
  {
    name: 'Rear Wing Beam & DRS Efficiency',
    category: 'aerodynamics',
    baselineVal: 'Standard Camber & Slot Gap',
    optimizedVal: 'Variable Boundary Layer Gurney',
    delta: '+14.2% DRS Drag Reduction',
    gainDescription: 'Reduces induced vortex drag on straights by 42 N while increasing high-speed rear stability in braking zones.',
    impactScore: 8.9,
  },
  {
    name: 'Suspension Heave & Anti-Roll Rates',
    category: 'mechanical',
    baselineVal: 'Front 160 N/mm | Rear 140 N/mm',
    optimizedVal: 'Front 188 N/mm | Rear 155 N/mm',
    delta: '+17.5% Pitch Platform Stability',
    gainDescription: 'Controls aerodynamic aero platform dive under braking, preventing front wing scraping and keeping aero center of pressure invariant.',
    impactScore: 9.1,
  },
  {
    name: 'Brake Bias Migration Policy',
    category: 'control_policy',
    baselineVal: 'Static 57.0% Front',
    optimizedVal: 'Dynamic 58.5% -> 53.8% Trail-Off',
    delta: '-4.2m Braking Distance',
    gainDescription: 'RL policy automatically migrates brake bias rearward as pedal pressure drops, unlocking aggressive trail-braking deep into apex.',
    impactScore: 9.6,
  },
  {
    name: 'Differential Slip & Torque Vectoring',
    category: 'control_policy',
    baselineVal: 'Entry 65% | Exit 75% Lock',
    optimizedVal: 'Predictive Dynamic Slip Map',
    delta: '+28m Earlier 100% Throttle',
    gainDescription: 'Eliminates corner exit wheel spin and snap oversteer, transferring power to tarmac 0.35s earlier on corner exit.',
    impactScore: 9.5,
  },
];

// Gear Ratios & Shift Points for 8-speed F1 gearbox
const GEAR_SPEED_RANGES = [
  { gear: 1, min: 0, max: 105, minRpm: 5000, maxRpm: 12500 },
  { gear: 2, min: 95, max: 145, minRpm: 8000, maxRpm: 13000 },
  { gear: 3, min: 135, max: 185, minRpm: 8500, maxRpm: 13500 },
  { gear: 4, min: 175, max: 225, minRpm: 9000, maxRpm: 13800 },
  { gear: 5, min: 215, max: 265, minRpm: 9200, maxRpm: 14200 },
  { gear: 6, min: 255, max: 300, minRpm: 9500, maxRpm: 14500 },
  { gear: 7, min: 290, max: 335, minRpm: 9800, maxRpm: 14800 },
  { gear: 8, min: 325, max: 375, minRpm: 10000, maxRpm: 15000 },
];

function calculateGearAndRpm(speedKmh: number): { gear: number; rpm: number } {
  for (let i = 0; i < GEAR_SPEED_RANGES.length; i++) {
    const range = GEAR_SPEED_RANGES[i];
    if (speedKmh <= range.max || i === GEAR_SPEED_RANGES.length - 1) {
      const fraction = Math.max(0, Math.min(1, (speedKmh - range.min) / (range.max - range.min)));
      const rpm = Math.round(range.minRpm + fraction * (range.maxRpm - range.minRpm));
      return { gear: range.gear, rpm };
    }
  }
  return { gear: 8, rpm: 14800 };
}

// Generate high-resolution telemetry simulation profile for any track and weather condition
export function generateLapSimulations(
  trackId: TrackId = 'silverstone',
  weatherId: WeatherConditionId = 'dry'
): {
  baselineTelemetry: TelemetryPoint[];
  rlTelemetry: TelemetryPoint[];
  lapSummary: LapSummary;
} {
  const NUM_STEPS = 2500;
  const baselineTelemetry: TelemetryPoint[] = [];
  const rlTelemetry: TelemetryPoint[] = [];

  const trackDef = TRACKS_DATA[trackId] || TRACKS_DATA.silverstone;
  const weather = WEATHER_CONDITIONS[weatherId] || WEATHER_CONDITIONS.dry;
  const trackCurveData = getTrackCurve(trackId);
  const trackLength = trackCurveData.totalLength;

  const distStep = trackLength / NUM_STEPS;
  const grip = weather.gripMultiplier;
  const airDensity = weather.airDensity;

  // Track Curvature, Tangents & Elevation profile
  const curvatures: number[] = [];
  const turnDirections: number[] = []; // +1 for right turn, -1 for left turn, 0 for straight

  for (let i = 0; i < NUM_STEPS; i++) {
    const dist = i * distStep;
    const pt = getTrackPointAtDistance(dist, trackId);
    curvatures.push(pt.curvature);

    // Calculate signed turn direction from cross product of tangent derivative
    const distPrev = ((dist - 10) % trackLength + trackLength) % trackLength;
    const distNext = (dist + 10) % trackLength;
    const ptPrev = getTrackPointAtDistance(distPrev, trackId);
    const ptNext = getTrackPointAtDistance(distNext, trackId);

    const crossY = ptPrev.tangent.x * ptNext.tangent.z - ptPrev.tangent.z * ptNext.tangent.x;
    const dir = Math.abs(crossY) > 0.015 ? (crossY > 0 ? 1 : -1) : 0;
    turnDirections.push(dir);
  }

  // Check if position is within DRS ranges
  const isDrsZone = (dist: number) => {
    return trackDef.drsRanges.some((range) => dist >= range.start && dist <= range.end);
  };

  // Base and RL cornering lateral G limits scaled with weather grip (True F1 Aero limits)
  const maxLateralG_Base = 3.85 * grip;
  const maxLateralG_RL = 4.75 * grip; // Superior downforce + dynamic differential control

  const baseSpeeds = new Float64Array(NUM_STEPS);
  const rlSpeeds = new Float64Array(NUM_STEPS);

  // Maximum straight speed capacity by track type (F1 top speeds: 320 - 365 km/h)
  let maxTrackSpeedBase = 93.5; // ~336 km/h (Silverstone, Spa, Suzuka)
  let maxTrackSpeedRL = 98.0;   // ~352 km/h
  if (trackId === 'monza') {
    maxTrackSpeedBase = 98.5;  // ~355 km/h
    maxTrackSpeedRL = 102.0;   // ~367 km/h
  } else if (trackId === 'monaco') {
    maxTrackSpeedBase = 79.5;  // ~286 km/h
    maxTrackSpeedRL = 83.0;    // ~299 km/h
  }

  // 1. Calculate corner apex maximum allowable speeds (v = sqrt(a_lat / curv))
  // Strict F1 principles: Hairpins/Chicanes = 65-95 km/h, Medium turns = 130-185 km/h, Fast sweepers = 230-290 km/h
  for (let i = 0; i < NUM_STEPS; i++) {
    const rawCurv = curvatures[i];
    
    if (rawCurv < 0.0012) {
      // Straightaway: Unlimited by cornering physics, allowed to reach top speed
      baseSpeeds[i] = maxTrackSpeedBase;
      rlSpeeds[i] = maxTrackSpeedRL;
    } else {
      // Corner: Physics-governed cornering limit
      const radius = 1 / Math.max(0.0012, rawCurv);

      // Base corner apex speed (slows down substantially in tight turns)
      const vCornerBase = Math.min(maxTrackSpeedBase, Math.sqrt(radius * maxLateralG_Base * 9.81));
      
      // RL corner apex speed (gains +8% to +14% higher minimum speed due to ground effect suction)
      const effectiveRadiusRL = radius * 1.06;
      const vCornerRL = Math.min(maxTrackSpeedRL, Math.sqrt(effectiveRadiusRL * maxLateralG_RL * 9.81));

      baseSpeeds[i] = vCornerBase;
      rlSpeeds[i] = vCornerRL;
    }
  }

  // 2. Backward pass: Deceleration limits (Braking zones before curves)
  // F1 carbon ceramic brakes produce massive ~4.5G to ~5.4G deceleration
  const decel_Base = 44.0 * grip; // m/s^2 (~4.5 G max braking)
  const decel_RL = 52.5 * grip;   // m/s^2 (~5.35 G max braking with pitch platform stability)

  for (let iter = 0; iter < 3; iter++) {
    for (let i = NUM_STEPS - 1; i >= 0; i--) {
      const nextIdx = (i + 1) % NUM_STEPS;
      const vNextBase = baseSpeeds[nextIdx];
      const maxPossibleBase = Math.sqrt(vNextBase * vNextBase + 2 * decel_Base * distStep);
      if (baseSpeeds[i] > maxPossibleBase) baseSpeeds[i] = maxPossibleBase;

      const vNextRL = rlSpeeds[nextIdx];
      const maxPossibleRL = Math.sqrt(vNextRL * vNextRL + 2 * decel_RL * distStep);
      if (rlSpeeds[i] > maxPossibleRL) rlSpeeds[i] = maxPossibleRL;
    }
  }

  // 3. Forward pass: Acceleration limits (1000 HP Turbo-Hybrid Power Unit & Traction)
  const accel_Base = 11.8 * Math.min(1.0, grip + 0.1);
  const accel_RL = 14.6 * Math.min(1.0, grip + 0.15); // Superior RL torque vectoring traction

  for (let iter = 0; iter < 3; iter++) {
    for (let i = 0; i < NUM_STEPS; i++) {
      const prevIdx = (i - 1 + NUM_STEPS) % NUM_STEPS;
      const vPrevBase = baseSpeeds[prevIdx];
      const dragFactorBase = 1 - Math.pow(vPrevBase / maxTrackSpeedBase, 2) * 0.28;
      const effectiveAccelBase = accel_Base * Math.max(0.18, dragFactorBase);
      const maxPossibleBase = Math.sqrt(vPrevBase * vPrevBase + 2 * effectiveAccelBase * distStep);
      if (baseSpeeds[i] > maxPossibleBase) baseSpeeds[i] = maxPossibleBase;

      const vPrevRL = rlSpeeds[prevIdx];
      const dragFactorRL = 1 - Math.pow(vPrevRL / maxTrackSpeedRL, 2) * 0.22; // Lower drag with RL aero
      const effectiveAccelRL = accel_RL * Math.max(0.22, dragFactorRL);
      const maxPossibleRL = Math.sqrt(vPrevRL * vPrevRL + 2 * effectiveAccelRL * distStep);
      if (rlSpeeds[i] > maxPossibleRL) rlSpeeds[i] = maxPossibleRL;
    }
  }

  // Construct time profiles and telemetry arrays
  let currentTimeBase = 0;
  let currentTimeRL = 0;

  let maxG_Base = 0;
  let maxG_RL = 0;
  let topSpeed_Base = 0;
  let topSpeed_RL = 0;
  let sumCornerSpeed_Base = 0;
  let sumCornerSpeed_RL = 0;
  let cornerCount = 0;

  for (let i = 0; i < NUM_STEPS; i++) {
    const dist = i * distStep;
    const progress = dist / trackLength;
    const vBaseMs = baseSpeeds[i];
    const vRLMs = rlSpeeds[i];

    const speedBaseKmh = vBaseMs * 3.6;
    const speedRLKmh = vRLMs * 3.6;

    topSpeed_Base = Math.max(topSpeed_Base, speedBaseKmh);
    topSpeed_RL = Math.max(topSpeed_RL, speedRLKmh);

    // Delta time step
    const dtBase = distStep / Math.max(10, vBaseMs);
    const dtRL = distStep / Math.max(10, vRLMs);

    currentTimeBase += dtBase;
    currentTimeRL += dtRL;

    // Curvature & G forces
    const curv = curvatures[i];
    const turnDir = turnDirections[i];
    const latGBase = ((vBaseMs * vBaseMs * curv) / 9.81) * (turnDir !== 0 ? turnDir : 1);
    const latGRL = ((vRLMs * vRLMs * curv * 0.94) / 9.81) * (turnDir !== 0 ? turnDir : 1);

    maxG_Base = Math.max(maxG_Base, Math.abs(latGBase));
    maxG_RL = Math.max(maxG_RL, Math.abs(latGRL));

    if (curv > 0.0028) {
      sumCornerSpeed_Base += speedBaseKmh;
      sumCornerSpeed_RL += speedRLKmh;
      cornerCount++;
    }

    // Longitudinal G calculation
    const nextIdx = (i + 1) % NUM_STEPS;
    const accelBase = (baseSpeeds[nextIdx] - vBaseMs) / dtBase;
    const accelRL = (rlSpeeds[nextIdx] - vRLMs) / dtRL;
    const longGBase = accelBase / 9.81;
    const longGRL = accelRL / 9.81;

    // Throttle & Brake signals (F1 telemetry style)
    const throttleBase = accelBase > 0.3 ? Math.min(1, accelBase / 6.2) : 0;
    const brakeBase = accelBase < -0.8 ? Math.min(1, -accelBase / 38.0) : 0;

    const throttleRL = accelRL > 0.3 ? Math.min(1, accelRL / 6.8) : 0;
    const brakeRL = accelRL < -0.8 ? Math.min(1, -accelRL / 44.0) : 0;

    // Downforce in kg (increases with square of speed)
    const drs = isDrsZone(dist);
    const clBase = drs ? 3.1 : 4.0;
    const clRL = drs ? 3.4 : 4.82;
    const cdBase = drs ? 0.75 : 1.05;
    const cdRL = drs ? 0.64 : 0.93;

    const downforceKgBase = Math.round(0.5 * airDensity * clBase * Math.pow(vBaseMs, 2) * (1 / 9.81) * 1.5);
    const downforceKgRL = Math.round(0.5 * airDensity * clRL * Math.pow(vRLMs, 2) * (1 / 9.81) * 1.5);

    const dragNBase = Math.round(0.5 * airDensity * cdBase * Math.pow(vBaseMs, 2) * 1.4);
    const dragNRL = Math.round(0.5 * airDensity * cdRL * Math.pow(vRLMs, 2) * 1.4);

    // Gearing & RPM
    const baseGear = calculateGearAndRpm(speedBaseKmh);
    const rlGear = calculateGearAndRpm(speedRLKmh);

    // Steer angle (Zero on straights, turns smoothly with curvature in curves)
    const steerBase = Math.min(1, Math.max(-1, curv * 260 * (turnDir !== 0 ? turnDir : 1)));
    const steerRL = Math.min(1, Math.max(-1, curv * 240 * (turnDir !== 0 ? turnDir : 1)));

    // Realistic F1 Racing Line Lateral Offset (Out-In-Out Apex geometry, ZERO on straights)
    let racingLineOffsetBase = 0;
    let racingLineOffsetRL = 0;

    if (curv > 0.0015) {
      // In a corner: Clip inside apex curb
      const apexOffset = turnDir > 0 ? -1.4 : 1.4; // Inside of turn
      racingLineOffsetBase = apexOffset * Math.min(1, curv * 180);
      racingLineOffsetRL = apexOffset * 1.25 * Math.min(1, curv * 180);
    } else {
      // On straightaway: Perfect dead center (0.0m offset)
      racingLineOffsetBase = 0;
      racingLineOffsetRL = 0;
    }

    // Tire temperatures based on weather and sliding
    const baseThermalOffset = weatherId === 'hot' ? 18 : weatherId === 'cold' ? -18 : weatherId === 'wet' ? -25 : 0;
    const baseTemp = 100 + baseThermalOffset + Math.abs(latGBase) * 3.8 + brakeBase * 10.0;
    const rlTemp = 96 + (baseThermalOffset * 0.5) + Math.abs(latGRL) * 2.6 + brakeRL * 7.5;

    // Tire Grip based on weather & scrub
    const baseGripPct = Math.round((92 * grip) - Math.abs(latGBase) * 1.8);
    const rlGripPct = Math.round((98 * grip) - Math.abs(latGRL) * 1.1);

    baselineTelemetry.push({
      time: currentTimeBase,
      distance: dist,
      progress,
      speed: speedBaseKmh,
      gear: baseGear.gear,
      rpm: baseGear.rpm,
      throttle: throttleBase,
      brake: brakeBase,
      steerAngle: steerBase,
      lateralG: parseFloat(latGBase.toFixed(2)),
      longitudinalG: parseFloat(longGBase.toFixed(2)),
      downforceKg: downforceKgBase,
      dragN: dragNBase,
      drsActive: drs,
      tireGrip: {
        fl: Math.max(10, Math.min(100, baseGripPct)),
        fr: Math.max(10, Math.min(100, baseGripPct)),
        rl: Math.max(10, Math.min(100, Math.round(baseGripPct - throttleBase * 3.5))),
        rr: Math.max(10, Math.min(100, Math.round(baseGripPct - throttleBase * 3.5))),
      },
      tireTemp: {
        fl: Math.round(baseTemp + 2),
        fr: Math.round(baseTemp - 1),
        rl: Math.round(baseTemp + 4),
        rr: Math.round(baseTemp + 1),
      },
      suspensionCompression: {
        fl: Math.round(18 + downforceKgBase * 0.015 + brakeBase * 12),
        fr: Math.round(18 + downforceKgBase * 0.015 + brakeBase * 12),
        rl: Math.round(15 + downforceKgBase * 0.018 - brakeBase * 8),
        rr: Math.round(15 + downforceKgBase * 0.018 - brakeBase * 8),
      },
      racingLineOffset: racingLineOffsetBase,
    });

    rlTelemetry.push({
      time: currentTimeRL,
      distance: dist,
      progress,
      speed: speedRLKmh,
      gear: rlGear.gear,
      rpm: rlGear.rpm,
      throttle: throttleRL,
      brake: brakeRL,
      steerAngle: steerRL,
      lateralG: parseFloat(latGRL.toFixed(2)),
      longitudinalG: parseFloat(longGRL.toFixed(2)),
      downforceKg: downforceKgRL,
      dragN: dragNRL,
      drsActive: drs,
      tireGrip: {
        fl: Math.max(15, Math.min(100, rlGripPct)),
        fr: Math.max(15, Math.min(100, rlGripPct)),
        rl: Math.max(15, Math.min(100, Math.round(rlGripPct - throttleRL * 1.5))),
        rr: Math.max(15, Math.min(100, Math.round(rlGripPct - throttleRL * 1.5))),
      },
      tireTemp: {
        fl: Math.round(rlTemp),
        fr: Math.round(rlTemp - 1),
        rl: Math.round(rlTemp + 2),
        rr: Math.round(rlTemp),
      },
      suspensionCompression: {
        fl: Math.round(22 + downforceKgRL * 0.018 + brakeRL * 8),
        fr: Math.round(22 + downforceKgRL * 0.018 + brakeRL * 8),
        rl: Math.round(20 + downforceKgRL * 0.021 - brakeRL * 5),
        rr: Math.round(20 + downforceKgRL * 0.021 - brakeRL * 5),
      },
      racingLineOffset: racingLineOffsetRL,
    });
  }

  // Tire wear scaled with thermal load
  const wearMultiplier = weatherId === 'hot' ? 1.65 : weatherId === 'wet' ? 0.6 : 1.0;
  const tireWearBaseline = parseFloat((6.8 * wearMultiplier).toFixed(1));
  const tireWearRL = parseFloat((4.8 * wearMultiplier).toFixed(1));

  const lapSummary: LapSummary = {
    lapTimeBaseline: currentTimeBase,
    lapTimeRL: currentTimeRL,
    deltaLapTime: parseFloat((currentTimeRL - currentTimeBase).toFixed(3)),
    topSpeedBaseline: Math.round(topSpeed_Base),
    topSpeedRL: Math.round(topSpeed_RL),
    avgCornerSpeedBaseline: Math.round(sumCornerSpeed_Base / Math.max(1, cornerCount)),
    avgCornerSpeedRL: Math.round(sumCornerSpeed_RL / Math.max(1, cornerCount)),
    maxLateralGBaseline: parseFloat(maxG_Base.toFixed(2)),
    maxLateralGRL: parseFloat(maxG_RL.toFixed(2)),
    tireWearBaseline,
    tireWearRL,
  };

  return {
    baselineTelemetry,
    rlTelemetry,
    lapSummary,
  };
}

// Generate full multi-lap stint evaluation report (5, 10, 20 laps)
export function generateStintEvaluation(
  trackId: TrackId = 'silverstone',
  weatherId: WeatherConditionId = 'dry',
  targetLaps: 5 | 10 | 20 = 5,
  currentLap: number = targetLaps
): StintEvaluationReport {
  const baseSim = generateLapSimulations(trackId, weatherId);
  const baseLapTime = baseSim.lapSummary.lapTimeBaseline;
  const rlLapTime = baseSim.lapSummary.lapTimeRL;
  const weather = WEATHER_CONDITIONS[weatherId] || WEATHER_CONDITIONS.dry;
  const wearMultiplier = weatherId === 'hot' ? 1.4 : weatherId === 'wet' ? 0.7 : 1.0;

  const completedLaps = Math.min(targetLaps, Math.max(1, currentLap));
  const isComplete = currentLap >= targetLaps;

  const lapHistory: StintLapResult[] = [];
  let cumBase = 0;
  let cumRL = 0;

  let bestBase = Infinity;
  let bestRL = Infinity;

  // Stint lap-by-lap progression
  for (let l = 1; l <= targetLaps; l++) {
    // Tire degradation impact on lap time
    const baseDeg = (l - 1) * 0.14 * wearMultiplier;
    const rlDeg = (l - 1) * 0.038 * wearMultiplier;

    // Fuel burn effect (car gets slightly lighter: -0.04s per lap)
    const fuelEffect = (l - 1) * 0.04;

    const currentBaseLap = baseLapTime + baseDeg - fuelEffect;
    const currentRLLap = rlLapTime + rlDeg - fuelEffect;

    const delta = currentRLLap - currentBaseLap;

    cumBase += currentBaseLap;
    cumRL += currentRLLap;

    bestBase = Math.min(bestBase, currentBaseLap);
    bestRL = Math.min(bestRL, currentRLLap);

    // Remaining tire life %
    const baseTireRemaining = Math.max(12, 100 - l * (6.5 * wearMultiplier));
    const rlTireRemaining = Math.max(38, 100 - l * (3.4 * wearMultiplier));

    // Aero efficiency (L/D ratio)
    const baseEfficiency = parseFloat((3.85 - (l - 1) * 0.03).toFixed(2));
    const rlEfficiency = parseFloat((4.42 - (l - 1) * 0.008).toFixed(2));

    lapHistory.push({
      lapNumber: l,
      lapTimeBaseline: parseFloat(currentBaseLap.toFixed(3)),
      lapTimeRL: parseFloat(currentRLLap.toFixed(3)),
      delta: parseFloat(delta.toFixed(3)),
      cumulativeBaseTime: parseFloat(cumBase.toFixed(3)),
      cumulativeRLTime: parseFloat(cumRL.toFixed(3)),
      cumulativeDelta: parseFloat((cumRL - cumBase).toFixed(3)),
      baselineTireWearPct: Math.round(baseTireRemaining),
      rlTireWearPct: Math.round(rlTireRemaining),
      baselineAeroEfficiency: baseEfficiency,
      rlAeroEfficiency: rlEfficiency,
      topSpeedBaseline: baseSim.lapSummary.topSpeedBaseline,
      topSpeedRL: baseSim.lapSummary.topSpeedRL,
    });
  }

  // Active completed stint stats
  const activeLaps = lapHistory.slice(0, completedLaps);
  const totalBase = activeLaps[activeLaps.length - 1]?.cumulativeBaseTime || cumBase;
  const totalRL = activeLaps[activeLaps.length - 1]?.cumulativeRLTime || cumRL;

  return {
    targetLaps,
    completedLaps,
    isComplete,
    totalTimeBaseline: totalBase,
    totalTimeRL: totalRL,
    totalDeltaTime: parseFloat((totalRL - totalBase).toFixed(3)),
    avgLapTimeBaseline: parseFloat((totalBase / completedLaps).toFixed(3)),
    avgLapTimeRL: parseFloat((totalRL / completedLaps).toFixed(3)),
    bestLapBaseline: parseFloat(bestBase.toFixed(3)),
    bestLapRL: parseFloat(bestRL.toFixed(3)),
    tireLifeRemainingBaseline: activeLaps[activeLaps.length - 1]?.baselineTireWearPct ?? 65,
    tireLifeRemainingRL: activeLaps[activeLaps.length - 1]?.rlTireWearPct ?? 84,
    fuelEfficiencyGainPct: 7.8,
    aeroBalanceConsistencyScore: 97.4,
    lapHistory,
    partConditions: AERO_PART_CONDITIONS,
  };
}

// Pre-computed default simulation cache
export const SIMULATION_DATA = generateLapSimulations('silverstone', 'dry');
