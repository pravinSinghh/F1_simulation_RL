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

  const totalDeltaAbs = Math.abs(report?.totalDeltaTime ?? 0).toFixed(3);
  const speedAdvantageKmh = 12;
  const tireAdvantagePct = Math.max(0, (report?.tireLifeRemainingRL ?? 84) - (report?.tireLifeRemainingBaseline ?? 65));
  const consistencyScore = report?.aeroBalanceConsistencyScore ?? 97;
  const rlRemainingTirePct = report?.tireLifeRemainingRL ?? 84;
  const baselineRemainingTirePct = report?.tireLifeRemainingBaseline ?? 65;

  // Generate Corner-by-Corner Telemetry Analysis for the Active Circuit
  const cornerTelemetryAnalysis = (activeTrack?.corners || []).map((corner, idx) => {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-sm">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Race Analysis & Performance Report
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  {report.completedLaps} / {targetLaps} LAPS
                </span>
                {report.isComplete && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    RACE FINISHED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 font-medium">
                {activeTrack.name} • {activeWeather.name} ({activeWeather.trackTemp}°C) • RL-Optimized Car (#77) vs Baseline Car (#01)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Target Laps Stint Selector */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
              {([5, 10, 20] as StintLengthOption[]).map((laps) => (
                <button
                  key={laps}
                  onClick={() => onChangeTargetLaps(laps)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    targetLaps === laps
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {laps} Laps
                </button>
              ))}
            </div>

            <button
              onClick={onRestartStint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
              title="Restart Stint Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-700" />
              <span>Restart</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 pt-3 border-b border-slate-200 bg-slate-50/40 overflow-x-auto scrollbar-none">
          {[
            { id: 'summary', label: 'Race Overview', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'corners', label: 'Corner-by-Corner Speeds', icon: <CornerDownRight className="w-3.5 h-3.5" /> },
            { id: 'aero-parts', label: 'Aerodynamics & Upgrades', icon: <Wind className="w-3.5 h-3.5" /> },
            { id: 'tire-degradation', label: 'Tire Life & Wear', icon: <Flame className="w-3.5 h-3.5" /> },
            { id: 'lap-history', label: 'Lap Times Table', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'engineer-debrief', label: 'Plain-English Summary', icon: <FileText className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'border-sky-600 text-sky-800'
                  : 'border-transparent text-slate-700 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white space-y-4">
          
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              
              {/* Hero Banner: Why RL Won */}
              <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 border border-sky-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-sky-200 flex items-center justify-center text-sky-600 shadow-sm text-2xl">
                    🏆
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      RL-Optimized Car (#77) Leads by {totalDeltaAbs} Seconds
                    </h3>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      Completed {report?.completedLaps ?? 1} laps with {speedAdvantageKmh} km/h higher average corner speed and {tireAdvantagePct}% less tire wear.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 px-4 shadow-sm text-right flex-shrink-0">
                  <span className="text-[10px] text-slate-700 uppercase font-bold block">Total Time Gap</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">
                    -{totalDeltaAbs}s
                  </span>
                </div>
              </div>

              {/* 4 Core Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Fastest Lap</span>
                  <div className="my-1.5">
                    <div className="text-lg font-black font-mono text-sky-800">
                      {formatSeconds(report?.bestLapRL ?? 82.5)}
                    </div>
                    <span className="text-[11px] text-slate-700 font-mono">
                      vs {formatSeconds(report?.bestLapBaseline ?? 83.3)} (Base)
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 self-start">
                    0.84s Faster / Lap
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Cornering Speed</span>
                  <div className="my-1.5">
                    <div className="text-lg font-black font-mono text-sky-800">
                      +{speedAdvantageKmh} km/h
                    </div>
                    <span className="text-[11px] text-slate-700">Average apex speed gain</span>
                  </div>
                  <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 self-start">
                    Floor Venturi Suction
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Tire Life Advantage</span>
                  <div className="my-1.5">
                    <div className="text-lg font-black font-mono text-emerald-700">
                      +{tireAdvantagePct}% Life
                    </div>
                    <span className="text-[11px] text-slate-700">Preserved tire grip</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 self-start">
                    Zero Wheelspin Scrub
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Lap Consistency</span>
                  <div className="my-1.5">
                    <div className="text-lg font-black font-mono text-indigo-700">
                      {consistencyScore}%
                    </div>
                    <span className="text-[11px] text-slate-700">Repeatability index</span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 self-start">
                    Precision Driving Line
                  </span>
                </div>
              </div>

              {/* Side-by-Side Car Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-3 px-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-800">
                  Head-to-Head Telemetry Comparison
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-3 p-3 text-xs font-semibold">
                    <span className="text-slate-700">Metric</span>
                    <span className="text-red-700 font-bold">#01 Baseline Car</span>
                    <span className="text-sky-800 font-bold">#77 RL-Optimized Car</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 text-xs">
                    <span className="text-slate-700 font-medium">Braking Distance from 300 km/h</span>
                    <span className="font-mono text-slate-750 font-bold">118 meters</span>
                    <span className="font-mono text-emerald-700 font-bold">103 meters (-15m shorter)</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 text-xs">
                    <span className="text-slate-700 font-medium">Maximum Downforce Load</span>
                    <span className="font-mono text-slate-750 font-bold">1,820 kg</span>
                    <span className="font-mono text-sky-800 font-bold">2,160 kg (+340 kg extra suction)</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 text-xs">
                    <span className="text-slate-700 font-medium">Peak Cornering Lateral G</span>
                    <span className="font-mono text-slate-750 font-bold">4.2 G</span>
                    <span className="font-mono text-indigo-700 font-bold">4.85 G (+0.65G lateral grip)</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 text-xs">
                    <span className="text-slate-700 font-medium">Full-Throttle Exit Point</span>
                    <span className="font-mono text-slate-750 font-bold">Late (Apex + 18m)</span>
                    <span className="font-mono text-emerald-700 font-bold">Early (Directly at Apex)</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CORNERS */}
          {activeTab === 'corners' && (
            <div className="space-y-3">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>
                  Corner-by-corner analysis showing minimum apex speeds and time gained at each turn.
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-12 p-3 bg-slate-50 text-xs font-bold text-slate-700">
                    <span className="col-span-4">Corner Name</span>
                    <span className="col-span-2 text-center">Sector</span>
                    <span className="col-span-2 text-center">Baseline Speed</span>
                    <span className="col-span-2 text-center">RL Apex Speed</span>
                    <span className="col-span-2 text-right">Advantage</span>
                  </div>
                  {cornerTelemetryAnalysis.map((c, i) => (
                    <div key={i} className="grid grid-cols-12 p-3 text-xs items-center hover:bg-slate-50/80 transition-colors">
                      <div className="col-span-4">
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[11px] text-slate-700 truncate block mt-0.5">{c.drivingPrinciple}</span>
                      </div>
                      <span className="col-span-2 text-center font-mono text-slate-700">S{c.sector}</span>
                      <span className="col-span-2 text-center font-mono text-slate-700 font-bold">{c.baseApexSpeed} km/h</span>
                      <span className="col-span-2 text-center font-mono font-bold text-sky-800">{c.rlApexSpeed} km/h</span>
                      <div className="col-span-2 text-right">
                        <span className="font-mono font-black text-emerald-700 block">+{c.speedGain} km/h</span>
                        <span className="text-[10px] text-emerald-700 font-mono">-{c.deltaGained}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AERO & UPGRADES */}
          {activeTab === 'aero-parts' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold mb-2">
                      <Wind className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Floor Venturi Ground Effect</h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Seals the underfloor air passages using low pressure, producing 1,480 kg of downforce without creating excess aerodynamic drag.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 mt-3 block">+14 km/h faster in high-speed turns</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-2">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Dynamic Brake-Bias Migration</h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Shifts brake balance rearward dynamically as the driver turns in, rotating the car effortlessly and shortening the stopping distance.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 mt-3 block">-15 meters shorter braking distance</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-2">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Adaptive Differential Traction</h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Locks and unlocks the rear differential in milliseconds, preventing wheelspin on corner exit and preserving tire life.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 mt-3 block">18% less tire wear over the race</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIRE DEGRADATION */}
          {activeTab === 'tire-degradation' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Tire Health & Grip Remaining After {report?.completedLaps ?? 1} Laps</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>#77 RL-Optimized Car</span>
                      <span className="text-emerald-700 font-mono">{rlRemainingTirePct}% Grip Remaining</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${rlRemainingTirePct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>#01 Baseline Car</span>
                      <span className="text-amber-700 font-mono">{baselineRemainingTirePct}% Grip Remaining</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${baselineRemainingTirePct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 mt-4 leading-relaxed">
                  The RL policy optimizes steering angles and wheel slip ratios to keep tire carcass temperatures in the optimal 100°C–104°C window, avoiding surface overheating and blister degradation.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: LAP HISTORY */}
          {activeTab === 'lap-history' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                <div className="grid grid-cols-12 p-3 bg-slate-50 text-xs font-bold text-slate-700">
                  <span className="col-span-2">Lap #</span>
                  <span className="col-span-3 text-center">Baseline Time</span>
                  <span className="col-span-3 text-center">RL Time</span>
                  <span className="col-span-2 text-center">Lap Delta</span>
                  <span className="col-span-2 text-right">Cumulative Lead</span>
                </div>
                {(report?.lapHistory || []).map((lap) => (
                  <div key={lap.lapNumber} className="grid grid-cols-12 p-3 text-xs items-center hover:bg-slate-50">
                    <span className="col-span-2 font-bold font-mono text-slate-900">Lap {lap.lapNumber}</span>
                    <span className="col-span-3 text-center font-mono text-slate-700">{formatSeconds(lap.lapTimeBaseline)}</span>
                    <span className="col-span-3 text-center font-mono font-bold text-sky-800">{formatSeconds(lap.lapTimeRL)}</span>
                    <span className="col-span-2 text-center font-mono font-bold text-emerald-700">-{Math.abs(lap.delta).toFixed(3)}s</span>
                    <span className="col-span-2 text-right font-mono font-black text-emerald-700">-{Math.abs(lap.cumulativeDelta).toFixed(3)}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ENGINEER DEBRIEF */}
          {activeTab === 'engineer-debrief' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-200 pb-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Executive Race Engineering Debrief</span>
              </div>
              <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                <p>
                  <strong>1. Aerodynamic Stability:</strong> The reinforcement learning model learned to maximize floor ground-effect downforce while preventing porpoising (aerodynamic stall). This gave the driver confidence to carry +12 to +18 km/h higher speeds through fast sweepers.
                </p>
                <p>
                  <strong>2. Braking Deceleration:</strong> Instead of static front-heavy braking, the RL policy migrates brake bias rearward (from 58% to 54.2%) into corner entry. This enables 15-meter deeper braking markers while eliminating front-lockup flatspots.
                </p>
                <p>
                  <strong>3. Tire Preservation:</strong> By smoothing out rapid steering inputs and managing micro-slip angles, the RL controller achieved 18% less tire wear over the race stint, ensuring consistent lap times until the chequered flag.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
