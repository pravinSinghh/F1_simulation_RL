import { TelemetryPoint } from '../types';

/**
 * Vehicle-Centric Automotive Audio Synthesizer
 * 
 * Re-engineered for authentic internal-combustion physics:
 * - Deep, guttural engine chassis rumble (40 Hz - 140 Hz sub-bass)
 * - Throaty multi-cylinder combustion pulses (80 Hz - 280 Hz)
 * - Warm low-pass acoustic filtering (strictly cuts off harsh piercing frequencies > 1.4 kHz)
 * - Guttural wide-open throttle (WOT) air induction roar
 * - Muffled low-frequency exhaust pops & downshift throttle blips
 * - Natural low-end mechanical tire rolling & chassis vibration
 */

class VehicleEngineSound {
  private ctx: AudioContext;
  private panner: StereoPannerNode | null = null;
  private masterCarGain: GainNode;
  private shiftCutGain: GainNode;

  // Cylinder Combustion Oscillators (Deep & Guttural)
  private oscCrankshaft: OscillatorNode | null = null; // 0.5x Crank rotation sub-bass
  private oscCombustion: OscillatorNode | null = null; // 1.5x Cylinder firing fundamental
  private oscExhaustBody: OscillatorNode | null = null; // 3.0x Exhaust manifold resonance

  private gainCrankshaft: GainNode;
  private gainCombustion: GainNode;
  private gainExhaustBody: GainNode;

  // Intake Induction Roar (Guttural throatiness on throttle)
  private intakeNoiseNode: AudioBufferSourceNode | null = null;
  private intakeFilter: BiquadFilterNode;
  private intakeGain: GainNode;

  // Warm Acoustic Vehicle Exhaust Filters (eliminates any screeching/whining high pitch)
  private exhaustLowPass1: BiquadFilterNode;
  private exhaustLowPass2: BiquadFilterNode;
  private exhaustBassBoost: BiquadFilterNode;
  private exhaustFormant: BiquadFilterNode;

  // Mechanical Gearbox Mesh (Warm & subtle)
  private gearOsc: OscillatorNode | null = null;
  private gearGain: GainNode;

  // Gearshift tracking
  private lastGear: number = 1;
  private lastThrottle: number = 0;
  private lastShiftTime: number = 0;

  constructor(ctx: AudioContext, destination: AudioNode, pan: number = 0) {
    this.ctx = ctx;

    // Shift cut node for crisp gear changes
    this.shiftCutGain = ctx.createGain();
    this.shiftCutGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // Car volume
    this.masterCarGain = ctx.createGain();
    this.masterCarGain.gain.setValueAtTime(0.28, ctx.currentTime);

    // Panning
    if (ctx.createStereoPanner) {
      this.panner = ctx.createStereoPanner();
      this.panner.pan.setValueAtTime(pan, ctx.currentTime);
      this.masterCarGain.connect(this.panner);
      this.panner.connect(destination);
    } else {
      this.masterCarGain.connect(destination);
    }

    // Individual engine harmonic gains
    this.gainCrankshaft = ctx.createGain();
    this.gainCombustion = ctx.createGain();
    this.gainExhaustBody = ctx.createGain();

    this.gainCrankshaft.gain.setValueAtTime(0.45, ctx.currentTime);
    this.gainCombustion.gain.setValueAtTime(0.35, ctx.currentTime);
    this.gainExhaustBody.gain.setValueAtTime(0.20, ctx.currentTime);

    // Warm Low-Shelf Bass Boost (+5dB around 85 Hz for deep vehicle rumble)
    this.exhaustBassBoost = ctx.createBiquadFilter();
    this.exhaustBassBoost.type = 'lowshelf';
    this.exhaustBassBoost.frequency.setValueAtTime(95, ctx.currentTime);
    this.exhaustBassBoost.gain.setValueAtTime(5.5, ctx.currentTime);

    // Deep Midrange Formant (~280 Hz - gives throaty car exhaust character)
    this.exhaustFormant = ctx.createBiquadFilter();
    this.exhaustFormant.type = 'peaking';
    this.exhaustFormant.frequency.setValueAtTime(260, ctx.currentTime);
    this.exhaustFormant.Q.setValueAtTime(1.4, ctx.currentTime);
    this.exhaustFormant.gain.setValueAtTime(3.5, ctx.currentTime);

    // Dual Cascaded Low-Pass Filters (Steep 24dB/oct cutoff, completely cuts off piercing high freqs)
    this.exhaustLowPass1 = ctx.createBiquadFilter();
    this.exhaustLowPass1.type = 'lowpass';
    this.exhaustLowPass1.frequency.setValueAtTime(750, ctx.currentTime);
    this.exhaustLowPass1.Q.setValueAtTime(1.0, ctx.currentTime);

    this.exhaustLowPass2 = ctx.createBiquadFilter();
    this.exhaustLowPass2.type = 'lowpass';
    this.exhaustLowPass2.frequency.setValueAtTime(1100, ctx.currentTime);
    this.exhaustLowPass2.Q.setValueAtTime(0.8, ctx.currentTime);

    // Engine Bus
    const engineMixBus = ctx.createGain();
    engineMixBus.gain.setValueAtTime(1.0, ctx.currentTime);

    this.gainCrankshaft.connect(engineMixBus);
    this.gainCombustion.connect(engineMixBus);
    this.gainExhaustBody.connect(engineMixBus);

    // Route: Mix -> BassBoost -> Formant -> LowPass1 -> LowPass2 -> ShiftCut -> Master
    engineMixBus.connect(this.exhaustBassBoost);
    this.exhaustBassBoost.connect(this.exhaustFormant);
    this.exhaustFormant.connect(this.exhaustLowPass1);
    this.exhaustLowPass1.connect(this.exhaustLowPass2);
    this.exhaustLowPass2.connect(this.shiftCutGain);
    this.shiftCutGain.connect(this.masterCarGain);

    // --- Intake Throaty Induction Roar ---
    this.intakeFilter = ctx.createBiquadFilter();
    this.intakeFilter.type = 'bandpass';
    this.intakeFilter.frequency.setValueAtTime(220, ctx.currentTime);
    this.intakeFilter.Q.setValueAtTime(1.6, ctx.currentTime);

    this.intakeGain = ctx.createGain();
    this.intakeGain.gain.setValueAtTime(0.0, ctx.currentTime);

    this.intakeFilter.connect(this.intakeGain);
    this.intakeGain.connect(this.shiftCutGain);

    // --- Mechanical Gearbox Mesh (Smooth, low level) ---
    this.gearGain = ctx.createGain();
    this.gearGain.gain.setValueAtTime(0.0, ctx.currentTime);
    this.gearGain.connect(this.masterCarGain);

    this.startNodes();
  }

  private startNodes() {
    const t = this.ctx.currentTime;

    // 1. Crankshaft rotation sub-bass (triangle wave: smooth, powerful chest punch)
    this.oscCrankshaft = this.ctx.createOscillator();
    this.oscCrankshaft.type = 'triangle';
    this.oscCrankshaft.frequency.setValueAtTime(45, t);
    this.oscCrankshaft.connect(this.gainCrankshaft);
    this.oscCrankshaft.start();

    // 2. Multi-cylinder primary firing pulse (custom warm sawtooth)
    this.oscCombustion = this.ctx.createOscillator();
    this.oscCombustion.type = 'sawtooth';
    this.oscCombustion.frequency.setValueAtTime(95, t);
    this.oscCombustion.connect(this.gainCombustion);
    this.oscCombustion.start();

    // 3. Exhaust manifold low body (sine wave with slight warmth)
    this.oscExhaustBody = this.ctx.createOscillator();
    this.oscExhaustBody.type = 'sawtooth';
    this.oscExhaustBody.frequency.setValueAtTime(190, t);
    this.oscExhaustBody.connect(this.gainExhaustBody);
    this.oscExhaustBody.start();

    // 4. Intake Induction Noise generator (warm brown/pink noise)
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.2;
      data[i] = (b0 + b1 + b2) * 0.8;
    }

    this.intakeNoiseNode = this.ctx.createBufferSource();
    this.intakeNoiseNode.buffer = noiseBuffer;
    this.intakeNoiseNode.loop = true;
    this.intakeNoiseNode.connect(this.intakeFilter);
    this.intakeNoiseNode.start();

    // 5. Gear mesh tone (low subtle whine)
    this.gearOsc = this.ctx.createOscillator();
    this.gearOsc.type = 'triangle';
    this.gearOsc.frequency.setValueAtTime(240, t);
    this.gearOsc.connect(this.gearGain);
    this.gearOsc.start();
  }

  public update(telemetry: TelemetryPoint) {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const rpm = Math.max(3000, Math.min(13000, telemetry.rpm));
    const throttle = Math.max(0, Math.min(1, telemetry.throttle));
    const brake = Math.max(0, Math.min(1, telemetry.brake));
    const speed = Math.max(0, telemetry.speed);
    const gear = telemetry.gear || 1;

    // Scale engine frequencies to warm, vehicle acoustic range:
    // At idle (3500 RPM): Crank = 35 Hz, Combustion = 87 Hz, Manifold = 175 Hz
    // At top revs (12500 RPM): Crank = 104 Hz, Combustion = 260 Hz, Manifold = 520 Hz
    // This places the entire engine body strictly in the satisfying, heavy, throaty zone!
    const crankFreq = (rpm / 60) * 0.55;
    const combustionFreq = (rpm / 60) * 1.35;
    const manifoldFreq = combustionFreq * 2.0;

    // Detect Gearshifts & Downshift throttle blips
    if (gear !== this.lastGear && now - this.lastShiftTime > 0.22) {
      if (gear > this.lastGear) {
        // Upshift: short seamless cut
        this.triggerUpshiftCut(now);
      } else {
        // Downshift: deep throttle blip & exhaust thump
        this.triggerDownshiftThump(now);
      }
      this.lastShiftTime = now;
    } else if (this.lastThrottle > 0.8 && throttle < 0.15 && brake > 0.5 && now - this.lastShiftTime > 0.4) {
      // Off-throttle deceleration pop
      this.triggerDownshiftThump(now);
      this.lastShiftTime = now;
    }

    this.lastGear = gear;
    this.lastThrottle = throttle;

    // Smooth frequency interpolation (prevents zipper noise)
    const smoothTau = 0.035;
    if (this.oscCrankshaft) this.oscCrankshaft.frequency.setTargetAtTime(crankFreq, now, smoothTau);
    if (this.oscCombustion) this.oscCombustion.frequency.setTargetAtTime(combustionFreq, now, smoothTau);
    if (this.oscExhaustBody) this.oscExhaustBody.frequency.setTargetAtTime(manifoldFreq, now, smoothTau);

    // Dynamic Engine Volume & Acoustic Presence Scaled with RPM & Throttle
    // As RPM increases, internal combustion pressure & acoustic SPL scale logarithmically
    const rpmNorm = Math.max(0, Math.min(1, (rpm - 3500) / 9500)); // 0.0 at 3500 RPM -> 1.0 at 13000 RPM
    
    // Base vehicle volume scales with RPM (idle = 0.18, redline = 0.52) + throttle load boost (+0.16)
    const dynamicVolume = (0.18 + Math.pow(rpmNorm, 1.35) * 0.34) * (0.75 + throttle * 0.45);
    this.masterCarGain.gain.setTargetAtTime(dynamicVolume, now, 0.035);

    // Warm Low-Pass Tone tracking:
    // Opens up warmly as RPM climbs, giving that roaring open-exhaust presence at high revs
    const dynamicCutoff1 = 400 + Math.pow(rpmNorm, 1.2) * 550 + throttle * 280;
    const dynamicCutoff2 = 600 + Math.pow(rpmNorm, 1.2) * 650 + throttle * 320;
    this.exhaustLowPass1.frequency.setTargetAtTime(dynamicCutoff1, now, 0.04);
    this.exhaustLowPass2.frequency.setTargetAtTime(dynamicCutoff2, now, 0.04);

    // Formant tracks midrange car exhaust resonance (200 - 380 Hz)
    const formantFreq = 220 + (rpm / 13000) * 140 + throttle * 60;
    this.exhaustFormant.frequency.setTargetAtTime(formantFreq, now, 0.04);

    // Harmonic balance based on RPM and throttle load:
    // Higher RPM amplifies multi-cylinder combustion power and exhaust body
    const crankGain = 0.35 + (1 - rpmNorm * 0.3) * 0.15 + throttle * 0.15;
    const combustionGain = 0.28 + Math.pow(rpmNorm, 1.2) * 0.35 + throttle * 0.22;
    const exhaustGain = 0.14 + Math.pow(rpmNorm, 1.4) * 0.30 + throttle * 0.20;

    this.gainCrankshaft.gain.setTargetAtTime(crankGain, now, 0.04);
    this.gainCombustion.gain.setTargetAtTime(combustionGain, now, 0.04);
    this.gainExhaustBody.gain.setTargetAtTime(exhaustGain, now, 0.04);

    // Throaty Intake induction roar (guttural growl amplifying with both RPM and throttle)
    if (this.intakeGain) {
      const intakeLevel = (Math.pow(throttle, 1.3) * 0.12 + Math.pow(rpmNorm, 1.5) * 0.08);
      this.intakeGain.gain.setTargetAtTime(intakeLevel, now, 0.03);
      this.intakeFilter.frequency.setTargetAtTime(180 + throttle * 120 + rpmNorm * 80, now, 0.04);
    }

    // Subtle gear mechanical pitch (kept warm between 150 - 450 Hz)
    if (this.gearOsc && this.gearGain) {
      const gearFreq = 120 + (speed / 350) * 320;
      this.gearOsc.frequency.setTargetAtTime(gearFreq, now, 0.04);
      this.gearGain.gain.setTargetAtTime(Math.min(0.025, (speed / 350) * 0.025), now, 0.05);
    }
  }

  private triggerUpshiftCut(time: number) {
    // 40ms soft ignition cut
    this.shiftCutGain.gain.cancelScheduledValues(time);
    this.shiftCutGain.gain.setValueAtTime(1.0, time);
    this.shiftCutGain.gain.linearRampToValueAtTime(0.15, time + 0.01);
    this.shiftCutGain.gain.linearRampToValueAtTime(0.25, time + 0.035);
    this.shiftCutGain.gain.exponentialRampToValueAtTime(1.0, time + 0.07);
  }

  private triggerDownshiftThump(time: number) {
    // Deep, punchy exhaust bass thump (65 Hz decaying to 35 Hz)
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, time);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterCarGain);

      osc.start(time);
      osc.stop(time + 0.15);
    } catch {
      // Audio node cleanup
    }
  }
}

class F1AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;

  // Car Engine Instances
  private carBase: VehicleEngineSound | null = null;
  private carRL: VehicleEngineSound | null = null;

  // Ambient vehicle sounds (Road rolling rumble & wind)
  private roadRumbleGain: GainNode | null = null;
  private roadFilter: BiquadFilterNode | null = null;
  private roadNoiseNode: AudioBufferSourceNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Studio Limiter (Warm analog mastering limiter)
      this.masterLimiter = this.ctx.createDynamicsCompressor();
      this.masterLimiter.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.masterLimiter.knee.setValueAtTime(8, this.ctx.currentTime);
      this.masterLimiter.ratio.setValueAtTime(6.0, this.ctx.currentTime);
      this.masterLimiter.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.masterLimiter.release.setValueAtTime(0.18, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.masterLimiter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Create engine power units with subtle stereo panning
      this.carBase = new VehicleEngineSound(this.ctx, this.masterLimiter, -0.15); // Baseline #01
      this.carRL = new VehicleEngineSound(this.ctx, this.masterLimiter, 0.15);   // RL-Optimized #77

      // --- Road Rolling Mechanical Rumble (50 - 150 Hz) ---
      const sampleRate = this.ctx.sampleRate;
      const noiseLen = sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, noiseLen, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let lastVal = 0.0;
      for (let i = 0; i < noiseLen; i++) {
        const white = Math.random() * 2 - 1;
        lastVal = lastVal * 0.96 + white * 0.04;
        data[i] = lastVal * 3.0;
      }

      this.roadNoiseNode = this.ctx.createBufferSource();
      this.roadNoiseNode.buffer = noiseBuffer;
      this.roadNoiseNode.loop = true;

      this.roadFilter = this.ctx.createBiquadFilter();
      this.roadFilter.type = 'lowpass';
      this.roadFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.roadRumbleGain = this.ctx.createGain();
      this.roadRumbleGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.roadNoiseNode.connect(this.roadFilter);
      this.roadFilter.connect(this.roadRumbleGain);
      this.roadRumbleGain.connect(this.masterLimiter);
      this.roadNoiseNode.start();
    } catch {
      // Browser user-gesture restriction
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }
    if (this.masterGain && this.ctx) {
      // Pleasant, comfortable master output volume
      const targetGain = muted ? 0.0 : 0.38;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.06);
    }
  }

  public update(baseTelemetry: TelemetryPoint, rlTelemetry: TelemetryPoint) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    if (this.carBase) this.carBase.update(baseTelemetry);
    if (this.carRL) this.carRL.update(rlTelemetry);

    const now = this.ctx.currentTime;
    const maxSpeed = Math.max(baseTelemetry.speed, rlTelemetry.speed);

    // Deep asphalt rolling road texture
    if (this.roadRumbleGain && this.roadFilter) {
      const roadSpeedNorm = Math.min(1.0, maxSpeed / 300);
      const roadGainVal = Math.pow(roadSpeedNorm, 1.2) * 0.12;
      const roadCutoff = 80 + roadSpeedNorm * 120; // 80 - 200 Hz warm road thrum

      this.roadRumbleGain.gain.setTargetAtTime(roadGainVal, now, 0.05);
      this.roadFilter.frequency.setTargetAtTime(roadCutoff, now, 0.05);
    }
  }

  public updateTelemetry(
    baseRpm: number,
    baseThrottle: number,
    baseBrake: number,
    rlRpm: number,
    rlThrottle: number,
    rlBrake: number,
    latG: number
  ) {
    if (this.isMuted || !this.ctx) return;
    const baseMock: TelemetryPoint = {
      time: 0,
      distance: 0,
      progress: 0,
      speed: (baseRpm / 13000) * 320,
      gear: Math.max(1, Math.min(8, Math.floor(baseRpm / 1700))),
      rpm: baseRpm,
      throttle: baseThrottle,
      brake: baseBrake,
      steerAngle: 0,
      lateralG: latG,
      longitudinalG: 0,
      downforceKg: 1200,
      dragN: 800,
      drsActive: false,
      tireGrip: { fl: 95, fr: 95, rl: 95, rr: 95 },
      tireTemp: { fl: 100, fr: 100, rl: 100, rr: 100 },
      suspensionCompression: { fl: 10, fr: 10, rl: 10, rr: 10 },
      racingLineOffset: 0,
    };
    const rlMock: TelemetryPoint = {
      ...baseMock,
      rpm: rlRpm,
      throttle: rlThrottle,
      brake: rlBrake,
    };
    this.update(baseMock, rlMock);
  }
}

export const f1Audio = new F1AudioEngine();
