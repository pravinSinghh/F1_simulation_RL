import * as THREE from 'three';
import {
  TrackId,
  WeatherConditionId,
  WeatherCondition,
  TrackDefinition,
} from '../types';

// Track 1: Silverstone (Aerodynamic High-Speed Circuit)
const SILVERSTONE_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, -250),       // Start/Finish (Hamilton Straight)
  new THREE.Vector3(0, 0, 160),        // Abbey fast right entry
  new THREE.Vector3(40, 0, 240),       // Farm curve
  new THREE.Vector3(90, 0, 290),       // Village & The Loop (Tight chicane/hairpin)
  new THREE.Vector3(135, 0, 260),      // Aintree exit onto Wellington
  new THREE.Vector3(195, 0, 195),      // Wellington Straight
  new THREE.Vector3(260, 0, 140),      // Brooklands left entry
  new THREE.Vector3(300, 0, 70),       // Luffield long right carousel
  new THREE.Vector3(330, 0, -10),      // Woodcote exit
  new THREE.Vector3(350, 0, -120),     // Copse high-speed blind right (280 km/h)
  new THREE.Vector3(330, 0, -220),     // Maggotts entry
  new THREE.Vector3(280, 0, -310),     // Becketts apex (4.9G directional switch)
  new THREE.Vector3(210, 0, -360),     // Chapel exit
  new THREE.Vector3(130, 0, -420),     // Hangar Straight top speed (335 km/h)
  new THREE.Vector3(40, 0, -460),      // Stowe braking zone
  new THREE.Vector3(-40, 0, -450),     // Stowe apex fast right
  new THREE.Vector3(-90, 0, -400),     // Vale heavy braking
  new THREE.Vector3(-95, 0, -330),     // Club chicane right-left
  new THREE.Vector3(-55, 0, -280),     // Exit back to Hamilton Straight
];

// Track 2: Monza (Temple of Speed & Low Drag)
const MONZA_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, -320),       // Rettifilo Main Straight (355 km/h)
  new THREE.Vector3(0, 0, 200),        // T1 Prima Variante heavy braking zone (5.4G)
  new THREE.Vector3(35, 0, 280),       // T1 Rettifilo chicane apex right-left
  new THREE.Vector3(85, 0, 320),       // Curva Grande flat-out sweeping right
  new THREE.Vector3(160, 0, 310),      // Curva Grande mid-point
  new THREE.Vector3(240, 0, 240),      // Approach to Variante della Roggia
  new THREE.Vector3(290, 0, 160),      // Roggia chicane (left-right)
  new THREE.Vector3(320, 0, 80),       // Straight to Lesmo 1
  new THREE.Vector3(340, 0, -10),      // Curva di Lesmo 1 (90° right)
  new THREE.Vector3(330, 0, -100),     // Lesmo 2 (fast technical right)
  new THREE.Vector3(280, 0, -200),     // Serraglio curve under overpass
  new THREE.Vector3(210, 0, -320),     // Straight to Variante Ascari
  new THREE.Vector3(150, 0, -410),     // Ascari Entry (Left)
  new THREE.Vector3(100, 0, -440),     // Ascari Mid & Exit (Right-Left transition)
  new THREE.Vector3(20, 0, -470),      // Back straight to Parabolica (340 km/h)
  new THREE.Vector3(-70, 0, -460),     // Curva Parabolica (Alboreto) braking
  new THREE.Vector3(-120, 0, -390),    // Parabolica apex long sweeping right
  new THREE.Vector3(-80, 0, -340),     // Parabolica acceleration exit onto main straight
];

// Track 3: Spa-Francorchamps (High Elevation Rollercoaster & Ardennes)
const SPA_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, -280),       // Start/Finish straight
  new THREE.Vector3(0, 0, 60),         // Approach to La Source
  new THREE.Vector3(45, 0, 130),       // La Source tight right hairpin (75 km/h)
  new THREE.Vector3(90, -12, 220),     // Downhill drop into Eau Rouge basin (-12m)
  new THREE.Vector3(135, 8, 300),      // Eau Rouge left compression (+8m)
  new THREE.Vector3(175, 32, 360),     // Raidillon blind uphill crest (+32m)
  new THREE.Vector3(230, 36, 320),     // Kemmel Straight peak (+36m, 345 km/h)
  new THREE.Vector3(310, 30, 220),     // Kemmel Straight mid-section
  new THREE.Vector3(370, 24, 100),     // Les Combes heavy braking zone (right-left-right)
  new THREE.Vector3(380, 16, -20),     // Malmedy exit downhill
  new THREE.Vector3(350, 8, -130),     // Bruxelles (Rivage) off-camber hairpin
  new THREE.Vector3(290, 2, -220),     // Speaker's Corner / No Name
  new THREE.Vector3(220, -5, -310),    // Double Gauche (Pouhon) high-speed double left
  new THREE.Vector3(150, -8, -380),    // Pouhon exit towards Fagnes
  new THREE.Vector3(75, -4, -420),     // Fagnes chicane
  new THREE.Vector3(0, 0, -450),       // Stavelot sweeping right
  new THREE.Vector3(-75, 2, -430),     // Blanchimont 1 & 2 flat out (315 km/h)
  new THREE.Vector3(-120, 1, -360),    // Approach to Bus Stop
  new THREE.Vector3(-80, 0, -300),     // Bus Stop chicane tight right-left
];

// Track 4: Suzuka (Technical Crossover & High Rhythm)
const SUZUKA_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, -260),       // Main Straight
  new THREE.Vector3(0, 0, 140),        // First Curve (Turn 1 fast right)
  new THREE.Vector3(35, 0, 220),       // Turn 2 tight right apex
  new THREE.Vector3(75, 0, 280),       // S-Curves Entry (Turn 3 Left)
  new THREE.Vector3(120, 0, 260),      // Turn 4 Right
  new THREE.Vector3(160, 0, 210),      // Turn 5 Left
  new THREE.Vector3(200, 0, 150),      // Turn 6 Dunlop uphill curve
  new THREE.Vector3(245, 0, 70),       // Degner 1 (Fast right 240 km/h)
  new THREE.Vector3(275, 0, 0),        // Degner 2 (90° square right over curbs)
  new THREE.Vector3(280, 0, -80),      // Under the Crossover Bridge
  new THREE.Vector3(250, 0, -170),     // Hairpin entry
  new THREE.Vector3(190, 0, -220),     // 200R sweeping curve
  new THREE.Vector3(120, 0, -280),     // Spoon Curve entry (Turn 13)
  new THREE.Vector3(50, 0, -350),      // Spoon Curve exit (Turn 14) onto Back Straight
  new THREE.Vector3(-30, 0, -380),     // West Straight top speed
  new THREE.Vector3(-110, 0, -360),    // Overpass (crossing above lower track)
  new THREE.Vector3(-150, 0, -300),    // 130R flat-out mega left (305 km/h, 4.8G)
  new THREE.Vector3(-120, 0, -240),    // Casio Triangle heavy braking chicane
  new THREE.Vector3(-55, 0, -250),     // Final corner onto Main Straight
];

// Track 5: Monaco (High Downforce Street Circuit)
const MONACO_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, -200),       // Boulevard Albert 1er (Main Straight)
  new THREE.Vector3(0, 0, 100),        // Approach to Sainte-Dévote
  new THREE.Vector3(40, 6, 170),       // Sainte-Dévote 90° right & Beau Rivage climb (+6m)
  new THREE.Vector3(85, 16, 230),      // Beau Rivage uphill crest (+16m)
  new THREE.Vector3(130, 18, 260),     // Massenet long blind left
  new THREE.Vector3(175, 14, 230),     // Casino Square right downhill
  new THREE.Vector3(210, 8, 170),      // Mirabeau Haute tight right downhill
  new THREE.Vector3(230, 4, 110),      // Grand Hotel (Fairmont) Hairpin - slowest corner (48 km/h)
  new THREE.Vector3(215, 0, 50),       // Mirabeau Bas & Portier entry
  new THREE.Vector3(175, -2, 0),       // Portier Turn 8 right onto Tunnel
  new THREE.Vector3(110, -2, -100),    // The Covered Tunnel flat-out right sweep (290 km/h)
  new THREE.Vector3(40, 0, -210),      // Tunnel exit heavy braking into daylight
  new THREE.Vector3(-15, 0, -260),     // Nouvelle Chicane tight left-right
  new THREE.Vector3(-70, 0, -280),     // Tabac fast left entry to harbour
  new THREE.Vector3(-115, 0, -260),    // Louis Chiron fast chicane (Swimming Pool 1)
  new THREE.Vector3(-140, 0, -210),    // Swimming Pool Exit chicane (tight kerbs)
  new THREE.Vector3(-125, 0, -150),    // La Rascasse double apex hairpin
  new THREE.Vector3(-70, 0, -160),     // Anthony Noghès tight right exit onto straight
];

export interface TrackPoint3D {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  binormal: THREE.Vector3;
  curvature: number;
  distance: number;
}

// Track metadata definitions
export const TRACKS_DATA: Record<TrackId, TrackDefinition> = {
  silverstone: {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    location: 'Northamptonshire, United Kingdom',
    countryCode: 'GB',
    lengthMeters: 5891,
    turnsCount: 18,
    lapRecord: '1:27.097 (Max Verstappen)',
    drsZonesCount: 2,
    elevationDiffMeters: 11.3,
    circuitType: 'high-speed',
    evaluationFocus: 'High-Speed Aerodynamic Downforce, Floor Venturi Suction & Anti-Roll Stability',
    description: 'Home of the British GP. Characterized by relentless high-G lateral directional changes (Maggotts, Becketts, Chapel, Copse) where RL floor ground-effect and stiffness prevent aero stall.',
    sectors: [
      {
        id: 1,
        name: 'Sector 1: Abbey, Farm & The Loop',
        type: 'chicane',
        startDist: 0,
        endDist: 1550,
        apexSpeedBaseline: 112,
        apexSpeedRL: 126,
        keyOptimization: 'Brake Bias Migration & Trail-Braking Apex Radius',
        description: 'Heavy braking into Village and tight Loop hairpin. RL model shifts brake bias rearward (54.2%) to rotate early and gain exit drive.',
      },
      {
        id: 2,
        name: 'Sector 2: Brooklands, Luffield & Copse',
        type: 'high-speed-s',
        startDist: 1550,
        endDist: 3650,
        apexSpeedBaseline: 242,
        apexSpeedRL: 268,
        keyOptimization: 'Floor Venturi Ground Effect & Front Wing Flap Bite',
        description: 'Fast entry through Copse (280 km/h) and into high-downforce Maggotts-Becketts complex with 4.85G sustained load.',
      },
      {
        id: 3,
        name: 'Sector 3: Hangar Straight, Stowe & Club',
        type: 'heavy-braking',
        startDist: 3650,
        endDist: 5891,
        apexSpeedBaseline: 135,
        apexSpeedRL: 148,
        keyOptimization: 'DRS Low-Drag Beam & Differential Traction Vectoring',
        description: 'Top speed reach down Hangar straight (335 km/h) followed by high-speed Stowe deceleration and final Club chicane traction.',
      },
    ],
    corners: [
      { name: 'Hamilton Straight (DRS 1)', distance: 0, sector: 1, speedGuideKmh: 315 },
      { name: 'Abbey & Farm Curve', distance: 680, sector: 1, speedGuideKmh: 275 },
      { name: 'The Loop Hairpin', distance: 1240, sector: 1, speedGuideKmh: 85 },
      { name: 'Copse High-Speed Right', distance: 2650, sector: 2, speedGuideKmh: 282 },
      { name: 'Maggotts-Becketts Esses', distance: 3180, sector: 2, speedGuideKmh: 265 },
      { name: 'Hangar Straight (DRS 2)', distance: 4100, sector: 3, speedGuideKmh: 338 },
      { name: 'Stowe Corner Entry', distance: 4850, sector: 3, speedGuideKmh: 195 },
      { name: 'Vale & Club Chicane', distance: 5420, sector: 3, speedGuideKmh: 105 },
    ],
    brakingMarkers: [
      { dist: 1240 - 150, label: '150' },
      { dist: 1240 - 100, label: '100' },
      { dist: 1240 - 50, label: '50' },
      { dist: 4850 - 150, label: '150' },
      { dist: 4850 - 100, label: '100' },
      { dist: 4850 - 50, label: '50' },
    ],
    drsRanges: [
      { start: 0, end: 500 },
      { start: 4000, end: 4750 },
    ],
  },

  monza: {
    id: 'monza',
    name: 'Autodromo Nazionale Monza',
    location: 'Monza, Italy',
    countryCode: 'IT',
    lengthMeters: 5793,
    turnsCount: 11,
    lapRecord: '1:21.046 (Rubens Barrichello)',
    drsZonesCount: 2,
    elevationDiffMeters: 9.8,
    circuitType: 'low-drag',
    evaluationFocus: 'Extreme Low-Drag Aero Efficiency, 5.4G Braking Stability & Curbs Absorption',
    description: 'The historic Temple of Speed. Teams run ultra-skinny low-downforce wings. Evaluates RL braking threshold under 355 km/h and aggressive kerb-hopping dynamics.',
    sectors: [
      {
        id: 1,
        name: 'Sector 1: Rettifilo & Curva Grande',
        type: 'heavy-braking',
        startDist: 0,
        endDist: 1850,
        apexSpeedBaseline: 72,
        apexSpeedRL: 84,
        keyOptimization: 'Extreme Brake Migration (5.4G Decel) & Low-Drag DRS',
        description: 'Brutal deceleration from 355 km/h down to 75 km/h for the Prima Variante chicane, followed by flat-out Curva Grande sweep.',
      },
      {
        id: 2,
        name: 'Sector 2: Roggia, Lesmo 1 & Lesmo 2',
        type: 'chicane',
        startDist: 1850,
        endDist: 3800,
        apexSpeedBaseline: 125,
        apexSpeedRL: 139,
        keyOptimization: 'Kerb Strike Suspension Damping & Mid-Corner Traction',
        description: 'Variante della Roggia chicane followed by the double right-handers of Lesmo 1 and 2 where mid-corner stability is crucial.',
      },
      {
        id: 3,
        name: 'Sector 3: Serraglio, Ascari & Parabolica',
        type: 'high-speed-s',
        startDist: 3800,
        endDist: 5793,
        apexSpeedBaseline: 195,
        apexSpeedRL: 216,
        keyOptimization: 'Ascari High-Speed Kerb Ride & Parabolica Lateral Grip',
        description: 'High-speed Ascari chicane leading onto the back straight and the iconic sweeping Curva Parabolica (Alboreto).',
      },
    ],
    corners: [
      { name: 'Main Straight (DRS 1)', distance: 0, sector: 1, speedGuideKmh: 355 },
      { name: 'Prima Variante T1 Chicane', distance: 1100, sector: 1, speedGuideKmh: 78 },
      { name: 'Curva Grande (Biassono)', distance: 1650, sector: 1, speedGuideKmh: 310 },
      { name: 'Variante della Roggia', distance: 2450, sector: 2, speedGuideKmh: 115 },
      { name: 'Curva di Lesmo 1 & 2', distance: 3200, sector: 2, speedGuideKmh: 168 },
      { name: 'Variante Ascari Complex', distance: 4400, sector: 3, speedGuideKmh: 210 },
      { name: 'Curva Parabolica (Alboreto)', distance: 5250, sector: 3, speedGuideKmh: 205 },
    ],
    brakingMarkers: [
      { dist: 1100 - 150, label: '150' },
      { dist: 1100 - 100, label: '100' },
      { dist: 1100 - 50, label: '50' },
      { dist: 2450 - 150, label: '150' },
      { dist: 2450 - 100, label: '100' },
      { dist: 2450 - 50, label: '50' },
      { dist: 5250 - 150, label: '150' },
      { dist: 5250 - 100, label: '100' },
    ],
    drsRanges: [
      { start: 0, end: 950 },
      { start: 3800, end: 4300 },
    ],
  },

  spa: {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps',
    location: 'Stavelot, Belgium',
    countryCode: 'BE',
    lengthMeters: 7004,
    turnsCount: 19,
    lapRecord: '1:46.286 (Valtteri Bottas)',
    drsZonesCount: 2,
    elevationDiffMeters: 102.5,
    circuitType: 'elevation-change',
    evaluationFocus: 'Vertical Compression Control (Eau Rouge), High Elevation Ride-Height & Pouhon Lateral Aero',
    description: 'The legendary Ardennes rollercoaster. Features massive vertical compression through Eau Rouge (+40m climb) and downhill high-G Pouhon sweep.',
    sectors: [
      {
        id: 1,
        name: 'Sector 1: La Source, Eau Rouge & Raidillon',
        type: 'high-speed-s',
        startDist: 0,
        endDist: 2350,
        apexSpeedBaseline: 275,
        apexSpeedRL: 304,
        keyOptimization: 'Dynamic Heave Spring Compression & Ridge Anti-Bottoming',
        description: 'Tight La Source hairpin followed by the downhill plunge into Eau Rouge and 300+ km/h blind uphill crest through Raidillon.',
      },
      {
        id: 2,
        name: 'Sector 2: Kemmel Straight, Les Combes & Pouhon',
        type: 'heavy-braking',
        startDist: 2350,
        endDist: 5050,
        apexSpeedBaseline: 220,
        apexSpeedRL: 245,
        keyOptimization: 'Floor Suction through Pouhon (4.9G) & Downhill Agility',
        description: 'Kemmel straight top speed into Les Combes, down to Rivage hairpin and the fearsome high-speed downhill Pouhon double-left.',
      },
      {
        id: 3,
        name: 'Sector 3: Stavelot, Blanchimont & Bus Stop',
        type: 'chicane',
        startDist: 5050,
        endDist: 7004,
        apexSpeedBaseline: 90,
        apexSpeedRL: 104,
        keyOptimization: 'Blanchimont Full-Throttle Stability & Bus Stop Trail-Brake',
        description: 'Flat out through Blanchimont at 315 km/h before the ultimate heavy braking test at the tight Bus Stop chicane.',
      },
    ],
    corners: [
      { name: 'Main Straight (DRS 1)', distance: 0, sector: 1, speedGuideKmh: 310 },
      { name: 'La Source Hairpin', distance: 320, sector: 1, speedGuideKmh: 75 },
      { name: 'Eau Rouge & Raidillon (+40m Climb)', distance: 1150, sector: 1, speedGuideKmh: 305 },
      { name: 'Kemmel Straight (DRS 2)', distance: 1950, sector: 1, speedGuideKmh: 345 },
      { name: 'Les Combes Chicane', distance: 2700, sector: 2, speedGuideKmh: 140 },
      { name: 'Bruxelles (Rivage) Hairpin', distance: 3450, sector: 2, speedGuideKmh: 110 },
      { name: 'Pouhon High-Speed Double-Left', distance: 4400, sector: 2, speedGuideKmh: 255 },
      { name: 'Blanchimont Sweeper', distance: 6200, sector: 3, speedGuideKmh: 315 },
      { name: 'Bus Stop Chicane', distance: 6720, sector: 3, speedGuideKmh: 88 },
    ],
    brakingMarkers: [
      { dist: 320 - 100, label: '100' },
      { dist: 320 - 50, label: '50' },
      { dist: 2700 - 150, label: '150' },
      { dist: 2700 - 100, label: '100' },
      { dist: 6720 - 150, label: '150' },
      { dist: 6720 - 100, label: '100' },
      { dist: 6720 - 50, label: '50' },
    ],
    drsRanges: [
      { start: 0, end: 280 },
      { start: 1650, end: 2600 },
    ],
  },

  suzuka: {
    id: 'suzuka',
    name: 'Suzuka International Racing Course',
    location: 'Mie Prefecture, Japan',
    countryCode: 'JP',
    lengthMeters: 5807,
    turnsCount: 18,
    lapRecord: '1:30.983 (Lewis Hamilton)',
    drsZonesCount: 1,
    elevationDiffMeters: 40.4,
    circuitType: 'technical-figure8',
    evaluationFocus: 'Rhythmic Transient Directional Changes (S-Curves), Asymmetric Tire Thermal Management & 130R G-Force',
    description: 'The sole figure-8 crossover Grand Prix circuit. Demands ultimate flow and rhythm through the opening uphill Esses and nerves of steel through 130R.',
    sectors: [
      {
        id: 1,
        name: 'Sector 1: Turn 1 & Uphill S-Curves (Snake)',
        type: 'high-speed-s',
        startDist: 0,
        endDist: 1850,
        apexSpeedBaseline: 215,
        apexSpeedRL: 238,
        keyOptimization: 'Continuous Transient Flow & Roll-Rate Damping',
        description: 'Challenging uphill snake complex where mistakes in one turn ruin momentum for the next 4 corners.',
      },
      {
        id: 2,
        name: 'Sector 2: Degners, Hairpin & Spoon Curve',
        type: 'hairpin',
        startDist: 1850,
        endDist: 4100,
        apexSpeedBaseline: 110,
        apexSpeedRL: 124,
        keyOptimization: 'Differential Vectoring at Hairpin & Spoon High-G Exit',
        description: 'Fast Degner curves, cross under the bridge, tight hairpin, and the sweeping long double-apex Spoon curve.',
      },
      {
        id: 3,
        name: 'Sector 3: Back Straight, 130R & Casio Triangle',
        type: 'heavy-braking',
        startDist: 4100,
        endDist: 5807,
        apexSpeedBaseline: 92,
        apexSpeedRL: 106,
        keyOptimization: '130R Aero Grip (4.8G Flat Out) & Casio Chicane Braking',
        description: 'Full throttle over the overpass and through terrifying 130R (305 km/h) before braking hard for the Casio Triangle.',
      },
    ],
    corners: [
      { name: 'Main Straight (DRS)', distance: 0, sector: 1, speedGuideKmh: 320 },
      { name: 'First & Second Curves', distance: 600, sector: 1, speedGuideKmh: 235 },
      { name: 'Uphill S-Curves Complex', distance: 1250, sector: 1, speedGuideKmh: 220 },
      { name: 'Degner 1 & 2 Curves', distance: 2150, sector: 2, speedGuideKmh: 175 },
      { name: 'Suzuka Hairpin', distance: 2950, sector: 2, speedGuideKmh: 78 },
      { name: 'Spoon Curve (Double Apex)', distance: 3850, sector: 2, speedGuideKmh: 195 },
      { name: '130R High-Speed Left', distance: 4950, sector: 3, speedGuideKmh: 308 },
      { name: 'Casio Triangle Chicane', distance: 5400, sector: 3, speedGuideKmh: 82 },
    ],
    brakingMarkers: [
      { dist: 600 - 100, label: '100' },
      { dist: 2950 - 150, label: '150' },
      { dist: 2950 - 100, label: '100' },
      { dist: 2950 - 50, label: '50' },
      { dist: 5400 - 150, label: '150' },
      { dist: 5400 - 100, label: '100' },
    ],
    drsRanges: [
      { start: 0, end: 550 },
    ],
  },

  monaco: {
    id: 'monaco',
    name: 'Circuit de Monaco',
    location: 'Monte Carlo, Monaco',
    countryCode: 'MC',
    lengthMeters: 3337,
    turnsCount: 19,
    lapRecord: '1:12.909 (Lewis Hamilton)',
    drsZonesCount: 1,
    elevationDiffMeters: 42.0,
    circuitType: 'high-downforce',
    evaluationFocus: 'Maximum Downforce Aero Angles (+28% Wing AoA), Low-Speed Steering Lock & Millimeter Barrier Precision',
    description: 'The crown jewel street race. Zero margin for error between Armco barriers. Slowest corner on calendar (Fairmont Hairpin, 48 km/h) demanding peak slow-speed mechanical grip.',
    sectors: [
      {
        id: 1,
        name: 'Sector 1: Sainte-Dévote & Beau Rivage Climb',
        type: 'chicane',
        startDist: 0,
        endDist: 1050,
        apexSpeedBaseline: 92,
        apexSpeedRL: 106,
        keyOptimization: 'Steering Turn-in Agility & Uphill Traction Recovery',
        description: 'Hard braking into Sainte-Dévote 90° right, then powering up the steep Beau Rivage hill past Massenet.',
      },
      {
        id: 2,
        name: 'Sector 2: Casino, Fairmont Hairpin & Tunnel',
        type: 'hairpin',
        startDist: 1050,
        endDist: 2200,
        apexSpeedBaseline: 46,
        apexSpeedRL: 54,
        keyOptimization: 'Steering Lock Rate & Differential Unlock in Slowest Hairpin',
        description: 'Past Casino Square, down Mirabeau to Fairmont Hairpin (48 km/h), Portier, and the echoing high-speed Tunnel.',
      },
      {
        id: 3,
        name: 'Sector 3: Nouvelle Chicane, Tabac & Rascasse',
        type: 'heavy-braking',
        startDist: 2200,
        endDist: 3337,
        apexSpeedBaseline: 82,
        apexSpeedRL: 95,
        keyOptimization: 'Harbour Kerb Ride & Low-Speed Exit Hook at Rascasse',
        description: 'Blinding daylight exit into Nouvelle Chicane, fast Tabac, swimming pool chicanes, and tight Rascasse.',
      },
    ],
    corners: [
      { name: 'Boulevard Albert 1er (DRS)', distance: 0, sector: 1, speedGuideKmh: 285 },
      { name: 'Sainte-Dévote 90° Right', distance: 340, sector: 1, speedGuideKmh: 95 },
      { name: 'Massenet & Casino Square', distance: 880, sector: 1, speedGuideKmh: 135 },
      { name: 'Mirabeau Haute', distance: 1220, sector: 2, speedGuideKmh: 82 },
      { name: 'Fairmont (Grand Hotel) Hairpin', distance: 1480, sector: 2, speedGuideKmh: 48 },
      { name: 'The Covered Tunnel Section', distance: 1950, sector: 2, speedGuideKmh: 290 },
      { name: 'Nouvelle Chicane (Harbour)', distance: 2320, sector: 3, speedGuideKmh: 75 },
      { name: 'Tabac & Swimming Pool', distance: 2750, sector: 3, speedGuideKmh: 175 },
      { name: 'La Rascasse & Anthony Noghès', distance: 3120, sector: 3, speedGuideKmh: 68 },
    ],
    brakingMarkers: [
      { dist: 340 - 100, label: '100' },
      { dist: 340 - 50, label: '50' },
      { dist: 2320 - 100, label: '100' },
      { dist: 2320 - 50, label: '50' },
      { dist: 3120 - 50, label: '50' },
    ],
    drsRanges: [
      { start: 0, end: 300 },
    ],
  },
};

// Weather & Seasonal Conditions Definitions
export const WEATHER_CONDITIONS: Record<WeatherConditionId, WeatherCondition> = {
  dry: {
    id: 'dry',
    name: 'Optimal Dry / Sunny',
    badge: '☀️ 38°C DRY',
    gripMultiplier: 1.0,
    airTemp: 26,
    trackTemp: 38,
    airDensity: 1.225,
    rainIntensity: 0.0,
    tireCompound: 'Pirelli Soft (C5 Red)',
    skyColor: 0xbed6f2,
    description: 'Perfect race conditions. Maximum tire friction coefficient, peak aerodynamic downforce suction, and crisp rubber line groove.',
  },
  wet: {
    id: 'wet',
    name: 'Wet / Heavy Rain',
    badge: '🌧️ WET / MONSOON',
    gripMultiplier: 0.73,
    airTemp: 16,
    trackTemp: 18,
    airDensity: 1.250,
    rainIntensity: 0.95,
    tireCompound: 'Pirelli Cinturato Wet (Blue Grooved)',
    skyColor: 0x94a3b8,
    description: 'Standing water & low adhesion surface. Tests RL intelligent throttle ramp-up, hydroplane avoidance, and wet brake temperature maintenance.',
  },
  night: {
    id: 'night',
    name: 'Night / Floodlit Desert GP',
    badge: '🌙 24°C NIGHT GP',
    gripMultiplier: 0.97,
    airTemp: 22,
    trackTemp: 24,
    airDensity: 1.240,
    rainIntensity: 0.0,
    tireCompound: 'Pirelli Medium (Yellow)',
    skyColor: 0x0f172a,
    description: 'Desert stadium floodlights. Dense cool air boosts aerodynamic efficiency and power output; glowing brake rotors under 5G deceleration.',
  },
  hot: {
    id: 'hot',
    name: 'Scorching Hot / Thermal Blistering',
    badge: '🔥 48°C HIGH DEGRADATION',
    gripMultiplier: 0.88,
    airTemp: 38,
    trackTemp: 48,
    airDensity: 1.185,
    rainIntensity: 0.0,
    tireCompound: 'Pirelli Hard (White)',
    skyColor: 0xfef08a,
    description: 'Extreme thermal degradation test. Baseline car overheats tire surface past 122°C (thermal blister), whereas RL dynamic slip angle control preserves 104°C core.',
  },
  cold: {
    id: 'cold',
    name: 'Cold / Damp Morning',
    badge: '❄️ 14°C COLD GRAINING',
    gripMultiplier: 0.83,
    airTemp: 11,
    trackTemp: 14,
    airDensity: 1.265,
    rainIntensity: 0.15,
    tireCompound: 'Pirelli Intermediate (Green)',
    skyColor: 0xd1d5db,
    description: 'Low track temperature causes cold tire graining. Tests RL adaptive tire scrubbing and quick heat generation without locking up.',
  },
};

// Track curve storage cache
const TRACK_CURVES_CACHE: Record<TrackId, {
  curve: THREE.CatmullRomCurve3;
  totalLength: number;
  samples: TrackPoint3D[];
}> = {} as any;

const TRACK_RAW_POINTS: Record<TrackId, THREE.Vector3[]> = {
  silverstone: SILVERSTONE_POINTS,
  monza: MONZA_POINTS,
  spa: SPA_POINTS,
  suzuka: SUZUKA_POINTS,
  monaco: MONACO_POINTS,
};

// Initialize track curves and precompute discretely sampled lookups
function initTrackCurves() {
  const NUM_SAMPLES = 1200;

  (Object.keys(TRACK_RAW_POINTS) as TrackId[]).forEach((tId) => {
    const pts = TRACK_RAW_POINTS[tId];
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
    const totalLength = curve.getLength();
    const samples: TrackPoint3D[] = [];

    for (let i = 0; i <= NUM_SAMPLES; i++) {
      const u = i / NUM_SAMPLES;
      const position = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(up, tangent).normalize();
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      const uNext = Math.min(1, u + 0.005);
      const uPrev = Math.max(0, u - 0.005);
      const tNext = curve.getTangentAt(uNext);
      const tPrev = curve.getTangentAt(uPrev);
      const angleDiff = tNext.angleTo(tPrev);
      const distDiff = (uNext - uPrev) * totalLength;
      const curvature = distDiff > 0 ? angleDiff / distDiff : 0;

      samples.push({
        position,
        tangent,
        normal,
        binormal,
        curvature,
        distance: u * totalLength,
      });
    }

    TRACK_CURVES_CACHE[tId] = {
      curve,
      totalLength,
      samples,
    };
  });
}

initTrackCurves();

export const TRACK_WIDTH = 14.0;
export const KERB_WIDTH = 1.6;

// Active track accessor
export function getTrackCurve(trackId: TrackId = 'silverstone') {
  return TRACK_CURVES_CACHE[trackId] || TRACK_CURVES_CACHE.silverstone;
}

export function getTrackPointAtDistance(distance: number, trackId: TrackId = 'silverstone'): TrackPoint3D {
  const cached = getTrackCurve(trackId);
  const totalLength = cached.totalLength;
  const samples = cached.samples;
  const numSamples = samples.length - 1;

  const normDist = ((distance % totalLength) + totalLength) % totalLength;
  const sampleIndex = (normDist / totalLength) * numSamples;
  const i0 = Math.floor(sampleIndex) % numSamples;
  const i1 = (i0 + 1) % numSamples;
  const alpha = sampleIndex - Math.floor(sampleIndex);

  const p0 = samples[i0];
  const p1 = samples[i1];

  const pos = new THREE.Vector3().lerpVectors(p0.position, p1.position, alpha);
  const tan = new THREE.Vector3().lerpVectors(p0.tangent, p1.tangent, alpha).normalize();
  const norm = new THREE.Vector3().lerpVectors(p0.normal, p1.normal, alpha).normalize();
  const binorm = new THREE.Vector3().lerpVectors(p0.binormal, p1.binormal, alpha).normalize();
  const curv = p0.curvature * (1 - alpha) + p1.curvature * alpha;

  return {
    position: pos,
    tangent: tan,
    normal: norm,
    binormal: binorm,
    curvature: curv,
    distance: normDist,
  };
}

// Backward compatibility exports for default track (Silverstone)
export const trackCurve = TRACK_CURVES_CACHE.silverstone.curve;
export const TOTAL_TRACK_LENGTH = TRACK_CURVES_CACHE.silverstone.totalLength;
export const TRACK_SAMPLES = TRACK_CURVES_CACHE.silverstone.samples;
export const TRACK_SECTORS = TRACKS_DATA.silverstone.sectors;
export const CORNERS = TRACKS_DATA.silverstone.corners;
export const BRAKING_MARKER_DISTANCES = TRACKS_DATA.silverstone.brakingMarkers;
