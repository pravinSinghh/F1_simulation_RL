import React from 'react';
import { TelemetryPoint, StintLengthOption } from '../types';
import { Sparkles, Gauge, Zap } from 'lucide-react';

interface SingleScreenHUDProps {
  baseTelemetry: TelemetryPoint;
  rlTelemetry: TelemetryPoint;
  useMph?: boolean;
  deltaSeconds?: number;
  currentCornerName?: string;
  currentLap?: number;
  targetLaps?: StintLengthOption;
}

export const TelemetryHUD: React.FC<SingleScreenHUDProps> = ({
  baseTelemetry,
  rlTelemetry,
  useMph = false,
  deltaSeconds = 0,
  currentCornerName = '',
  currentLap = 1,
  targetLaps = 5,
}) => {
  const displaySpeedBase = useMph ? Math.round(baseTelemetry.speed * 0.621371) : Math.round(baseTelemetry.speed);
  const displaySpeedRL = useMph ? Math.round(rlTelemetry.speed * 0.621371) : Math.round(rlTelemetry.speed);
  const speedUnit = useMph ? 'MPH' : 'KM/H';

  const speedDelta = displaySpeedRL - displaySpeedBase;
  const downforceDelta = rlTelemetry.downforceKg - baseTelemetry.downforceKg;
  const distanceGap = Math.abs(rlTelemetry.distance - baseTelemetry.distance).toFixed(1);

  // RPM Shift lights calculation for lead car (5,000 - 15,000 RPM)
  const rpmPercent = Math.min(1, Math.max(0, (rlTelemetry.rpm - 5000) / 10000));
  const activeLeds = Math.round(rpmPercent * 15);
  const isOptimalShiftZone = rlTelemetry.rpm >= 13500;

  return (
    <div className="absolute inset-0 pointer-events-none p-2.5 sm:p-3.5 flex flex-col justify-between select-none">
      {/* TOP CONTAINER: Leaderboard + Shift Indicator Bar (Moved to Top) */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Race Badges & Live Delta */}
        <div className="flex items-start justify-between gap-2">
          {/* Top Left: Baseline Car Quick Badge */}
          <div
            id="hud-badge-baseline"
            className="bg-[#0f111a]/85 border border-red-500/30 backdrop-blur-xl rounded-2xl p-2 px-3 flex items-center gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-zinc-200">
                #1 Baseline (OEM)
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">
                {displaySpeedBase} {speedUnit} • Gear {baseTelemetry.gear}
              </span>
            </div>
          </div>

          {/* Top Center: Live Delta Banner & Lap Counter */}
          <div className="bg-[#0b1329]/90 border border-cyan-500/40 backdrop-blur-xl rounded-2xl px-4 py-1.5 flex items-center gap-3 shadow-[0_0_24px_rgba(6,182,212,0.25)]">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                LAP {currentLap}/{targetLaps}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold ml-1">RL LEAD:</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                {deltaSeconds <= 0 ? `${deltaSeconds.toFixed(3)}s` : `+${deltaSeconds.toFixed(3)}s`}
              </span>
            </div>
            <div className="w-px h-3.5 bg-white/10" />
            <div className="text-[10px] font-mono text-zinc-300">
              <span className="text-zinc-400">Gap: </span>
              <span className="text-cyan-300 font-bold">{distanceGap}m</span>
            </div>
          </div>

          {/* Top Right: RL-Optimized Car Quick Badge */}
          <div
            id="hud-badge-rl"
            className="bg-[#071929]/90 border border-cyan-500/50 backdrop-blur-xl rounded-2xl p-2 px-3 flex items-center gap-2.5 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-cyan-300 flex items-center justify-end gap-1">
                <span>#77 RL-Optimized</span>
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </span>
              <span className="text-[9px] text-cyan-200/80 font-mono">
                {displaySpeedRL} {speedUnit} • Gear {rlTelemetry.gear}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Elevated RPM & Aerodynamic Shift Indicator Bar (With clear explanation) */}
        <div className="self-center flex items-center gap-3 bg-[#0d101a]/90 border border-white/10 backdrop-blur-xl rounded-2xl px-3.5 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.55)]">
          {/* Label explaining what the bar shows */}
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Gauge className="w-3 h-3 text-cyan-400" />
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-zinc-400">
              ENGINE REV & AERO SHIFT TIMING
            </span>
          </div>

          {/* 15-LED Shift Light Array */}
          <div className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-full border border-white/10">
            {Array.from({ length: 15 }).map((_, i) => {
              const isActive = i < activeLeds;
              let ledColor = 'bg-zinc-800/80';
              if (isActive) {
                if (i < 5) ledColor = 'bg-emerald-500 shadow-[0_0_6px_#10b981]';
                else if (i < 10) ledColor = 'bg-amber-400 shadow-[0_0_6px_#f59e0b]';
                else ledColor = 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
              }
              return (
                <div
                  key={i}
                  className={`w-2 sm:w-2.5 h-2 rounded-[2px] transition-colors duration-75 ${ledColor}`}
                />
              );
            })}
          </div>

          {/* RPM Readout & Shift Zone Badge */}
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-cyan-300 font-extrabold">{rlTelemetry.rpm.toLocaleString()} RPM</span>
            {isOptimalShiftZone ? (
              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-cyan-500 text-zinc-950 shadow-[0_0_8px_#22d3ee] animate-pulse flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5 fill-current" />
                OPTIMAL SHIFT
              </span>
            ) : (
              <span className="text-[8px] text-zinc-500">POWERBAND</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle viewport is completely open and clear for full-screen car action */}
      <div className="flex-1" />

      {/* Bottom Telemetry Comparison Dock */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
        {/* Left Bento: Original Baseline Car Telemetry (Cols 1-4) */}
        <div className="md:col-span-4 bg-[#10121a]/90 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-2.5 flex flex-col gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-extrabold text-zinc-300 uppercase tracking-wider">Baseline Car</span>
            </div>
            <span className="text-[9px] font-mono text-zinc-400">{baseTelemetry.rpm.toLocaleString()} RPM</span>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            {/* Speed & Gear */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-white tracking-tighter">{displaySpeedBase}</span>
              <span className="text-[9px] text-zinc-400 font-medium">{speedUnit}</span>
              <span className="ml-auto text-base font-black font-mono text-zinc-300">G{baseTelemetry.gear}</span>
            </div>

            {/* Downforce */}
            <div className="text-right">
              <span className="text-[8px] text-zinc-500 block">DOWNFORCE</span>
              <span className="text-xs font-mono font-bold text-zinc-300">{baseTelemetry.downforceKg} kg</span>
            </div>
          </div>

          {/* Pedals */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[8px] font-mono font-bold text-emerald-400">
                <span>THR</span>
                <span>{Math.round(baseTelemetry.throttle * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                  style={{ width: `${Math.round(baseTelemetry.throttle * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[8px] font-mono font-bold text-rose-400">
                <span>BRK</span>
                <span>{Math.round(baseTelemetry.brake * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-75 rounded-full"
                  style={{ width: `${Math.round(baseTelemetry.brake * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Bento: Real-Time Telemetry Delta & Apex Comparison (Cols 5-8) */}
        <div className="md:col-span-4 bg-[#0a101d]/92 border border-cyan-500/30 backdrop-blur-xl rounded-2xl p-2.5 flex flex-col items-center justify-between gap-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between w-full text-[9px] font-bold text-zinc-400">
            <span className="text-red-400">BASELINE</span>
            <span className="text-cyan-400 uppercase tracking-wider">TELEMETRY DELTA</span>
            <span className="text-cyan-400">RL OPTIMIZED</span>
          </div>

          <div className="grid grid-cols-3 w-full text-center gap-1 my-0.5">
            {/* Speed Delta */}
            <div className="bg-black/40 rounded-xl p-1 border border-white/5">
              <span className="text-[8px] text-zinc-500 block uppercase">Speed Advantage</span>
              <span
                className={`text-xs sm:text-sm font-mono font-black ${
                  speedDelta >= 0 ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]' : 'text-rose-400'
                }`}
              >
                {speedDelta >= 0 ? `+${speedDelta}` : speedDelta} <span className="text-[8px] font-normal">{speedUnit}</span>
              </span>
            </div>

            {/* Downforce Delta */}
            <div className="bg-black/40 rounded-xl p-1 border border-white/5">
              <span className="text-[8px] text-zinc-500 block uppercase">Aero Suction</span>
              <span className="text-xs sm:text-sm font-mono font-black text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">
                +{downforceDelta} <span className="text-[8px] font-normal">kg</span>
              </span>
            </div>

            {/* Corner G Advantage */}
            <div className="bg-black/40 rounded-xl p-1 border border-white/5">
              <span className="text-[8px] text-zinc-500 block uppercase">Lateral Grip</span>
              <span className="text-xs sm:text-sm font-mono font-black text-cyan-300">
                {Math.abs(rlTelemetry.lateralG).toFixed(2)}G
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full text-[8px] text-zinc-400 font-mono border-t border-white/5 pt-1">
            <span>Base G: {Math.abs(baseTelemetry.lateralG).toFixed(2)}G</span>
            <span className="text-emerald-400 font-bold">
              RL Advantage: +{(Math.abs(rlTelemetry.lateralG) - Math.abs(baseTelemetry.lateralG)).toFixed(2)}G
            </span>
          </div>
        </div>

        {/* Right Bento: RL-Optimized Car Telemetry (Cols 9-12) */}
        <div className="md:col-span-4 bg-[#0a1524]/90 border border-cyan-500/40 backdrop-blur-xl rounded-2xl p-2.5 flex flex-col gap-2 shadow-[0_8px_24px_rgba(6,182,212,0.2)]">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              <span className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider">RL-Optimized Car</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                rlTelemetry.drsActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-500'
              }`}
            >
              DRS {rlTelemetry.drsActive ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            {/* Speed & Gear */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-cyan-300 tracking-tighter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                {displaySpeedRL}
              </span>
              <span className="text-[9px] text-zinc-400 font-medium">{speedUnit}</span>
              <span className="ml-auto text-base font-black font-mono text-cyan-400">G{rlTelemetry.gear}</span>
            </div>

            {/* Downforce */}
            <div className="text-right">
              <span className="text-[8px] text-zinc-400 block">DOWNFORCE</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{rlTelemetry.downforceKg} kg</span>
            </div>
          </div>

          {/* Pedals */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[8px] font-mono font-bold text-emerald-400">
                <span>THR</span>
                <span>{Math.round(rlTelemetry.throttle * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 shadow-[0_0_6px_#34d399] transition-all duration-75 rounded-full"
                  style={{ width: `${Math.round(rlTelemetry.throttle * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[8px] font-mono font-bold text-rose-400">
                <span>BRK</span>
                <span>{Math.round(rlTelemetry.brake * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 shadow-[0_0_6px_#f43f5e] transition-all duration-75 rounded-full"
                  style={{ width: `${Math.round(rlTelemetry.brake * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
