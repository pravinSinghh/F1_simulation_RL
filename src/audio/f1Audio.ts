class F1AudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;

  // Car audio oscillators
  private oscBase1: OscillatorNode | null = null;
  private oscBase2: OscillatorNode | null = null;
  private oscBase3: OscillatorNode | null = null;
  private gainBase: GainNode | null = null;

  private oscRL1: OscillatorNode | null = null;
  private oscRL2: OscillatorNode | null = null;
  private oscRL3: OscillatorNode | null = null;
  private gainRL: GainNode | null = null;

  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireGain: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Baseline Car V6 Synth
      this.gainBase = this.ctx.createGain();
      this.gainBase.gain.setValueAtTime(0.15, this.ctx.currentTime);
      this.gainBase.connect(this.masterGain);

      this.oscBase1 = this.ctx.createOscillator();
      this.oscBase1.type = 'sawtooth';
      this.oscBase1.frequency.setValueAtTime(180, this.ctx.currentTime);
      this.oscBase1.connect(this.gainBase);
      this.oscBase1.start();

      this.oscBase2 = this.ctx.createOscillator();
      this.oscBase2.type = 'triangle';
      this.oscBase2.frequency.setValueAtTime(360, this.ctx.currentTime);
      this.oscBase2.connect(this.gainBase);
      this.oscBase2.start();

      // RL Car V6 Synth
      this.gainRL = this.ctx.createGain();
      this.gainRL.gain.setValueAtTime(0.15, this.ctx.currentTime);
      this.gainRL.connect(this.masterGain);

      this.oscRL1 = this.ctx.createOscillator();
      this.oscRL1.type = 'sawtooth';
      this.oscRL1.frequency.setValueAtTime(200, this.ctx.currentTime);
      this.oscRL1.connect(this.gainRL);
      this.oscRL1.start();

      this.oscRL2 = this.ctx.createOscillator();
      this.oscRL2.type = 'triangle';
      this.oscRL2.frequency.setValueAtTime(400, this.ctx.currentTime);
      this.oscRL2.connect(this.gainRL);
      this.oscRL2.start();

      // Tire scrub noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.tireNoiseNode = this.ctx.createBufferSource();
      this.tireNoiseNode.buffer = noiseBuffer;
      this.tireNoiseNode.loop = true;

      this.tireFilter = this.ctx.createBiquadFilter();
      this.tireFilter.type = 'bandpass';
      this.tireFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.tireFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.tireGain = this.ctx.createGain();
      this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.tireNoiseNode.connect(this.tireFilter);
      this.tireFilter.connect(this.tireGain);
      this.tireGain.connect(this.masterGain);
      this.tireNoiseNode.start();
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }
    if (this.masterGain && this.ctx) {
      const targetGain = muted ? 0.0 : 0.22;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
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
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // F1 V6 turbo hybrid fundamental frequency (approx 120Hz at 5000 RPM up to 550Hz at 15000 RPM)
    const baseFreq = 80 + (baseRpm / 15000) * 440;
    const rlFreq = 80 + (rlRpm / 15000) * 440;

    if (this.oscBase1) this.oscBase1.frequency.setTargetAtTime(baseFreq, now, 0.03);
    if (this.oscBase2) this.oscBase2.frequency.setTargetAtTime(baseFreq * 2, now, 0.03);

    if (this.oscRL1) this.oscRL1.frequency.setTargetAtTime(rlFreq, now, 0.03);
    if (this.oscRL2) this.oscRL2.frequency.setTargetAtTime(rlFreq * 2.05, now, 0.03);

    // Tire noise when cornering hard (> 3.5G) or locking brakes
    if (this.tireGain) {
      const scrubIntensity = Math.max(0, Math.min(1, (latG - 3.2) / 1.8 + baseBrake * 0.4 + rlBrake * 0.4));
      this.tireGain.gain.setTargetAtTime(scrubIntensity * 0.12, now, 0.05);
    }
  }
}

export const f1Audio = new F1AudioEngine();
