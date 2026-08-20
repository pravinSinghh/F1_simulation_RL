export type CameraMode = 'director' | 'chase' | 'trackside' | 'overhead' | 'cockpit' | 'gyro' | 'split' | 'ghost';

export type SyncMode = 'time' | 'distance';

export type TrackId = 'silverstone' | 'monza' | 'spa' | 'suzuka' | 'monaco';

export type WeatherConditionId = 'dry' | 'wet' | 'night' | 'hot' | 'cold';

export interface WeatherCondition {
  id: WeatherConditionId;
  name: string;
  badge: string;
  gripMultiplier: number;
  airTemp: number;     // °C
  trackTemp: number;   // °C
  airDensity: number;  // kg/m^3
  rainIntensity: number; // 0 to 1
  tireCompound: string;
  skyColor: number;
  description: string;
}

export interface TrackCorner {
  name: string;
  distance: number;
  sector: number;
  speedGuideKmh?: number;
}

export interface BrakingMarker {
  dist: number;
  label: string;
}

export interface TrackDefinition {
  id: TrackId;
  name: string;
  location: string;
  countryCode: string;
  lengthMeters: number;
  turnsCount: number;
  lapRecord: string;
  drsZonesCount: number;
  elevationDiffMeters: number;
  circuitType: 'high-speed' | 'low-drag' | 'high-downforce' | 'elevation-change' | 'technical-figure8';
  evaluationFocus: string;
  description: string;
  sectors: TrackSector[];
  corners: TrackCorner[];
  brakingMarkers: BrakingMarker[];
  drsRanges: { start: number; end: number }[];
}

export interface TelemetryPoint {
  time: number;           // Seconds from lap start
  distance: number;       // Meters along track (0 to trackLength)
  progress: number;       // 0 to 1
  speed: number;          // km/h
  gear: number;           // 1 to 8
  rpm: number;            // 4000 to 15000
  throttle: number;       // 0 to 1
  brake: number;          // 0 to 1
  steerAngle: number;     // -1 (full left) to +1 (full right)
  lateralG: number;       // -5.0 to +5.0 G
  longitudinalG: number;  // -5.5 to +2.5 G
  downforceKg: number;    // kg of downforce
  dragN: number;          // Newtons of drag
  drsActive: boolean;     // DRS open or closed
  tireGrip: {
    fl: number; // 0 to 100%
    fr: number;
    rl: number;
    rr: number;
  };
  tireTemp: {
    fl: number; // °C (e.g. 95 - 118)
    fr: number;
    rl: number;
    rr: number;
  };
  suspensionCompression: {
    fl: number; // mm
    fr: number;
    rl: number;
    rr: number;
  };
  apexDistance?: number;
  racingLineOffset: number; // lateral offset from centerline in meters
}

export interface TrackSector {
  id: number;
  name: string;
  type: 'straight' | 'heavy-braking' | 'high-speed-s' | 'hairpin' | 'sweeper' | 'chicane';
  startDist: number;
  endDist: number;
  apexSpeedBaseline: number; // km/h
  apexSpeedRL: number;       // km/h
  keyOptimization: string;
  description: string;
}

export interface CarOptimizationSpec {
  name: string;
  category: 'aerodynamics' | 'mechanical' | 'control_policy';
  baselineVal: string;
  optimizedVal: string;
  delta: string;
  gainDescription: string;
  impactScore: number; // 1-10
}

export interface LapSummary {
  lapTimeBaseline: number; // e.g. 84.420 s (1:24.420)
  lapTimeRL: number;       // e.g. 82.890 s (1:22.890)
  deltaLapTime: number;    // -1.530 s
  topSpeedBaseline: number;// km/h
  topSpeedRL: number;
  avgCornerSpeedBaseline: number;
  avgCornerSpeedRL: number;
  maxLateralGBaseline: number;
  maxLateralGRL: number;
  tireWearBaseline: number;// %
  tireWearRL: number;
}

export type StintLengthOption = 5 | 10 | 20;

export interface StintLapResult {
  lapNumber: number;
  lapTimeBaseline: number;
  lapTimeRL: number;
  delta: number;
  cumulativeBaseTime: number;
  cumulativeRLTime: number;
  cumulativeDelta: number;
  baselineTireWearPct: number; // remaining tire life %
  rlTireWearPct: number;
  baselineAeroEfficiency: number; // Lift-to-Drag ratio L/D
  rlAeroEfficiency: number;
  topSpeedBaseline: number;
  topSpeedRL: number;
}

export interface AeroPartCondition {
  id: string;
  partName: string;
  category: 'Front Axle' | 'Underfloor / Diffuser' | 'Rear / DRS' | 'Cooling & Ducts' | 'Tire Aero Vortex';
  baselineStatus: string;
  rlOptimizedStatus: string;
  aerodynamicGain: string;
  telemetryImpact: string;
  efficiencyRating: number; // 0 - 100
}

export interface StintEvaluationReport {
  targetLaps: number;
  completedLaps: number;
  isComplete: boolean;
  totalTimeBaseline: number;
  totalTimeRL: number;
  totalDeltaTime: number;
  avgLapTimeBaseline: number;
  avgLapTimeRL: number;
  bestLapBaseline: number;
  bestLapRL: number;
  tireLifeRemainingBaseline: number;
  tireLifeRemainingRL: number;
  fuelEfficiencyGainPct: number;
  aeroBalanceConsistencyScore: number;
  lapHistory: StintLapResult[];
  partConditions: AeroPartCondition[];
}
