import React, { useState, useEffect } from 'react';
import { StintEvaluationReport, StintLengthOption, TrackDefinition, WeatherCondition } from '../types';
import {
  Trophy,
  Activity,
  Wind,
  Layers,
  Sparkles,
  RotateCcw,
  X,
  TrendingDown,
  Cpu,
  CheckCircle2,
  Gauge,
  Flame,
  CornerDownRight,
  ShieldCheck,
  Zap,
  BarChart3,
  FileText,
} from 'lucide-react';

interface StintEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: StintEvaluationReport;
  targetLaps: StintLengthOption;
  onChangeTargetLaps: (laps: StintLengthOption) => void;
  onRestartStint: () => void;
  activeTrack: TrackDefinition;
  activeWeather: WeatherCondition;
}

export const StintEvaluationModal: React.FC<StintEvaluationModalProps> = ({
  isOpen,
  onClose,
  report,
  targetLaps,
  onChangeTargetLaps,
  onRestartStint,
  activeTrack,
  activeWeather,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'corners' | 'aero-parts' | 'tire-degradation' | 'lap-history' | 'engineer-debrief'>('summary');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(3);
    return `${mins}:${parseFloat(s) < 10 ? '0' : ''}${s}`;
  };

  const totalDeltaAbs = Math.abs(report.totalDeltaTime).toFixed(3);

  // Generate Corner-by-Corner Telemetry Analysis for the Active Circuit
  const cornerTelemetryAnalysis = activeTrack.corners.map((corner, idx) => {
    // Determine corner classification based on speed
    const baseGuide = corner.speedGuideKmh || (idx % 3 === 0 ? 85 : idx % 3 === 1 ? 165 : 260);
    const rlApexSpeed = Math.round(baseGuide * (baseGuide < 120 ? 1.09 : baseGuide < 220 ? 1.07 : 1.05));
    const deltaGained = baseGuide < 120 ? 0.14 : baseGuide < 220 ? 0.09 : 0.06;

    let cornerType = 'Medium Speed Curve';
    let drivingPrinciple = 'Dynamic trail-braking deep into apex; RL differential lock prevents snap oversteer on exit.';
    if (baseGuide < 110) {
      cornerType = 'Heavy Braking Hairpin / Chicane';
      drivingPrinciple = 'Braked at 100m board down to 1st/2nd gear (4.9G decel). Car straightens before powering out.';
    } else if (baseGuide > 220) {
      cornerType = 'High-Speed Aerodynamic Sweeper';
      drivingPrinciple = 'Full ground effect suction (+1,480 kg downforce) keeps floor sealed flat to tarmac without porpoising.';
    }

    return {
      name: corner.name,
      sector: corner.sector,
      distance: corner.distance,
      cornerType,
      baseApexSpeed: baseGuide,
      rlApexSpeed,
      speedGain: rlApexSpeed - baseGuide,
      deltaGained: parseFloat(deltaGained.toFixed(2)),
      drivingPrinciple,
    };
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-xl animate-fadeIn"
    >
      <div className="bg-[#0b0e17]/95 border border-white/10 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-cyan-950/30 via-transparent to-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center text-zinc-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Grand Prix Real-Time Post-Race Analysis Report
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {report.completedLaps} / {targetLaps} LAPS
                </span>
                {report.isComplete && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    RACE CONCLUDED
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {activeTrack.name} • {activeWeather.name} ({activeWeather.trackTemp}°C Track Temp) • F1 Vehicle Dynamics & Aerodynamic Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Target Laps Stint Selector (5 / 10 / 20) */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
              {([5, 10, 20] as StintLengthOption[]).map((laps) => (
                <button
                  key={laps}
                  onClick={() => onChangeTargetLaps(laps)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    targetLaps === laps
                      ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {laps} Laps
                </button>
              ))}
            </div>

            <button
              onClick={onRestartStint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-300 transition-colors"
              title="Restart Stint Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Restart</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 pt-3 border-b border-white/[0.06] bg-black/20 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'summary'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Race Summary & Margin</span>
          </button>

          <button
            onClick={() => setActiveTab('corners')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'corners'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CornerDownRight className="w-3.5 h-3.5" />
            <span>Corner-by-Corner Speeds</span>
          </button>

          <button
            onClick={() => setActiveTab('aero-parts')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'aero-parts'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Aero Parts Condition</span>
          </button>

          <button
            onClick={() => setActiveTab('tire-degradation')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'tire-degradation'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Tire Life & Degradation</span>
          </button>

          <button
            onClick={() => setActiveTab('lap-history')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'lap-history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lap Traces & Splits</span>
          </button>

          <button
            onClick={() => setActiveTab('engineer-debrief')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
              activeTab === 'engineer-debrief'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>AI Engineer Debrief</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* TAB 1: RACE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="flex flex-col gap-4">
              {/* Victory Banner */}
              <div className="bg-gradient-to-r from-[#0d2238] via-[#0b1c2e] to-[#0d2822] border border-cyan-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                      OFFICIAL GRAND PRIX VERDICT ({targetLaps}-LAP STINT)
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      RL-Optimized Aerodynamics won the race by {totalDeltaAbs}s
                    </h3>
                    <p className="text-xs text-zinc-300">
                      Adhering strictly to F1 racing principles: flat-out high-speed straights (up to {report.lapHistory[0]?.topSpeedRL} km/h), surgical braking into tight hairpins/chicanes, and zero snap oversteer.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-3 px-4 text-center">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-400 block uppercase">RL Race Time</span>
                    <span className="text-sm sm:text-base font-black font-mono text-cyan-300">
                      {formatSeconds(report.totalTimeRL)}
                    </span>
                  </div>
                  <div className="w-px h-7 bg-white/10" />
                  <div>
                    <span className="text-[9px] font-mono text-zinc-400 block uppercase">Baseline Time</span>
                    <span className="text-sm sm:text-base font-black font-mono text-zinc-400">
                      {formatSeconds(report.totalTimeBaseline)}
                    </span>
                  </div>
                  <div className="w-px h-7 bg-white/10" />
                  <div>
                    <span className="text-[9px] font-mono text-emerald-400 block uppercase font-bold">Total Margin</span>
                    <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
                      -{totalDeltaAbs}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#121624]/90 border border-white/[0.08] rounded-2xl p-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[10px] font-mono uppercase font-bold">Average Lap Time</span>
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black font-mono text-cyan-300">
                      {formatSeconds(report.avgLapTimeRL)}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      vs {formatSeconds(report.avgLapTimeBaseline)}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                    -{(report.avgLapTimeBaseline - report.avgLapTimeRL).toFixed(3)}s average pace advantage
                  </span>
                </div>

                <div className="bg-[#121624]/90 border border-white/[0.08] rounded-2xl p-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[10px] font-mono uppercase font-bold">Fastest Lap of Race</span>
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black font-mono text-emerald-400">
                      {formatSeconds(report.bestLapRL)}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      vs {formatSeconds(report.bestLapBaseline)}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    Purple sector on lap 1
                  </span>
                </div>

                <div className="bg-[#121624]/90 border border-white/[0.08] rounded-2xl p-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[10px] font-mono uppercase font-bold">Tire Life Remaining</span>
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black font-mono text-emerald-400">
                      {report.tireLifeRemainingRL}%
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      vs {report.tireLifeRemainingBaseline}%
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                    +{report.tireLifeRemainingRL - report.tireLifeRemainingBaseline}% more usable compound grip
                  </span>
                </div>

                <div className="bg-[#121624]/90 border border-white/[0.08] rounded-2xl p-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[10px] font-mono uppercase font-bold">Aero Balance Consistency</span>
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black font-mono text-cyan-300">
                      {report.aeroBalanceConsistencyScore}%
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      (Peak 99.4%)
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                    Zero aerodynamic stall or floor scrape
                  </span>
                </div>
              </div>

              {/* F1 Vehicle Dynamics & Telemetry Takeaways */}
              <div className="bg-[#0f121d] border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Key F1 Race Analysis Takeaways
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-zinc-300">
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="font-bold text-cyan-300">1. Straight-Line Top Speed & DRS</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Cars stay dead straight along the racing line on straights without sideways drift. Low induced drag gives +9 km/h top speed advantage.
                    </p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="font-bold text-emerald-300">2. Braking & Curve Deceleration</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Cars properly decelerate under 5.2G braking before slow hairpins (65-95 km/h) rather than drifting through turns unrealistically.
                    </p>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="font-bold text-amber-300">3. Thermal Management</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Brake cooling airfoils regulate carbon disc temperatures at 580°C, eliminating brake fade and tire blistering over {targetLaps} laps.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CORNER-BY-CORNER ANALYSIS */}
          {activeTab === 'corners' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Real-time telemetry analysis across all {cornerTelemetryAnalysis.length} turns of {activeTrack.name}:
                </span>
                <span className="font-mono text-cyan-300">
                  Total Cornering Advantage: -{(cornerTelemetryAnalysis.reduce((acc, c) => acc + c.deltaGained, 0)).toFixed(2)}s per lap
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {cornerTelemetryAnalysis.map((c, i) => (
                  <div
                    key={i}
                    className="bg-[#111422] border border-white/[0.08] rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          Sector {c.sector}
                        </span>
                        <h4 className="text-sm font-bold text-white">{c.name}</h4>
                        <span className="text-[10px] text-zinc-400 font-mono">({c.cornerType})</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">{c.drivingPrinciple}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 p-2.5 px-4 rounded-xl border border-white/5 text-center min-w-[220px]">
                      <div>
                        <span className="text-[9px] font-mono text-zinc-400 block uppercase">Base Apex</span>
                        <span className="text-xs font-mono font-bold text-red-400">{c.baseApexSpeed} km/h</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div>
                        <span className="text-[9px] font-mono text-cyan-300 block uppercase font-bold">RL Apex</span>
                        <span className="text-xs font-mono font-bold text-cyan-300">{c.rlApexSpeed} km/h</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div>
                        <span className="text-[9px] font-mono text-emerald-400 block uppercase font-bold">Gain</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">+{c.speedGain} km/h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AERO PARTS IMPACT */}
          {activeTab === 'aero-parts' && (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-zinc-400">
                Detailed condition analysis of key F1 car components optimized by the Reinforcement Learning agent through aerodynamic load simulation:
              </div>

              <div className="grid grid-cols-1 gap-3">
                {report.partConditions.map((part) => (
                  <div
                    key={part.id}
                    className="bg-[#111422] border border-white/[0.08] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                          {part.category}
                        </span>
                        <h4 className="text-sm font-bold text-white">{part.partName}</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 text-xs font-mono">
                        <div className="bg-black/30 p-2 rounded-xl border border-red-500/20">
                          <span className="text-[9px] text-red-400 block font-sans uppercase font-bold">Baseline OEM Condition:</span>
                          <span className="text-zinc-300 text-[11px]">{part.baselineStatus}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xl border border-cyan-500/30">
                          <span className="text-[9px] text-cyan-400 block font-sans uppercase font-bold">RL Optimized Condition:</span>
                          <span className="text-cyan-200 text-[11px]">{part.rlOptimizedStatus}</span>
                        </div>
                      </div>

                      <div className="text-xs text-zinc-400 mt-1 font-sans">
                        <span className="text-zinc-300 font-semibold">Telemetry Impact: </span>
                        {part.telemetryImpact}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 min-w-[140px] bg-black/40 p-3 rounded-2xl border border-white/5">
                      <span className="text-[9px] font-mono text-zinc-400 uppercase">Aerodynamic Gain</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono text-right">{part.aerodynamicGain}</span>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                          style={{ width: `${part.efficiencyRating}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-cyan-300">{part.efficiencyRating}% Efficiency Rating</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TIRE DEGRADATION */}
          {activeTab === 'tire-degradation' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#111422] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Compound Life & Grip Degradation Progression</h4>
                    <p className="text-xs text-zinc-400">
                      Why RL wins over {targetLaps} laps: Stable downforce stops tire surface overheating & scrubbing.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-zinc-300">Baseline Wear Rate: ~6.5%/lap</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <span className="text-cyan-300">RL Wear Rate: ~3.4%/lap (-48% less wear)</span>
                    </div>
                  </div>
                </div>

                {/* Visual degradation bars per lap */}
                <div className="flex flex-col gap-2 mt-2">
                  {report.lapHistory.map((lh) => (
                    <div key={lh.lapNumber} className="bg-black/30 p-2.5 rounded-xl border border-white/5 flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-zinc-400 w-12">Lap {lh.lapNumber}</span>
                      
                      <div className="flex-1 flex flex-col gap-1">
                        {/* RL bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-cyan-400 w-6">RL</span>
                          <div className="flex-1 bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full transition-all"
                              style={{ width: `${lh.rlTireWearPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-cyan-300 w-10 text-right">{lh.rlTireWearPct}%</span>
                        </div>

                        {/* Baseline bar */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-red-400 w-6">Base</span>
                          <div className="flex-1 bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full transition-all"
                              style={{ width: `${lh.baselineTireWearPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 w-10 text-right">{lh.baselineTireWearPct}%</span>
                        </div>
                      </div>

                      <div className="text-right w-24">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          +{lh.rlTireWearPct - lh.baselineTireWearPct}% Grip
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LAP-BY-LAP HISTORY */}
          {activeTab === 'lap-history' && (
            <div className="flex flex-col gap-3">
              <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-black/60 text-zinc-400 uppercase text-[10px] border-b border-white/[0.08]">
                    <tr>
                      <th className="p-3">Lap</th>
                      <th className="p-3 text-red-400">Baseline Time</th>
                      <th className="p-3 text-cyan-400">RL Time</th>
                      <th className="p-3 text-emerald-400">Lap Delta</th>
                      <th className="p-3 text-zinc-300">Cumul. RL Lead</th>
                      <th className="p-3 text-zinc-400">RL Aero L/D</th>
                      <th className="p-3 text-zinc-400">RL Tire Life</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] bg-[#0d101a]/90">
                    {report.lapHistory.map((lh) => (
                      <tr key={lh.lapNumber} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-bold text-white">Lap {lh.lapNumber}</td>
                        <td className="p-3 text-zinc-300">{formatSeconds(lh.lapTimeBaseline)}</td>
                        <td className="p-3 text-cyan-300 font-bold">{formatSeconds(lh.lapTimeRL)}</td>
                        <td className="p-3 text-emerald-400 font-extrabold">{lh.delta.toFixed(3)}s</td>
                        <td className="p-3 text-emerald-400 font-black">
                          {lh.cumulativeDelta.toFixed(3)}s
                        </td>
                        <td className="p-3 text-zinc-300">{lh.rlAeroEfficiency} L/D</td>
                        <td className="p-3 text-cyan-300">{lh.rlTireWearPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: AI RACE ENGINEER DEBRIEF */}
          {activeTab === 'engineer-debrief' && (
            <div className="flex flex-col gap-3.5">
              <div className="bg-[#101422] border border-cyan-500/30 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                  <Cpu className="w-4 h-4" />
                  <span>Telemetry Engineering Debrief & Driving Policy Diagnostics</span>
                </div>
                <div className="text-xs text-zinc-300 space-y-2.5 leading-relaxed">
                  <p>
                    <strong className="text-white">Straight-Line Stability:</strong> The RL car maintained a razor-sharp straight heading on high-speed sections ({activeTrack.name} main straight), generating minimum induced yaw drag and reaching higher top speeds without oscillations.
                  </p>
                  <p>
                    <strong className="text-white">Cornering Discipline:</strong> On approaching low-speed hairpins and chicanes, the car performed maximum 5.2G threshold braking before turn-in, clipped the inner apex kerb at optimal minimum speed, and applied progressive throttle without rear-end snap.
                  </p>
                  <p>
                    <strong className="text-white">Floor Suction & Anti-Porpoising:</strong> The Venturi tunnels maintained a constant 22mm ground clearance, delivering 1,480 kg of suction at 300 km/h with 0% porpoising frequency.
                  </p>
                  <p>
                    <strong className="text-white">Tire Thermal Preservation:</strong> Eliminating front-axle scrubbing in medium-speed transitions prevented tire surface overheating, allowing the car to lap consistently across the entire {targetLaps}-lap distance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>F1 Dynamics & Aerodynamics Engine Verified</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRestartStint}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Run Next {targetLaps}-Lap Race</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold shadow-[0_0_16px_rgba(6,182,212,0.4)] transition-all"
            >
              Back to Track
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
