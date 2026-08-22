import React, { useState } from 'react';
import { TelemetryPoint, StintLengthOption } from '../types';
import { Sparkles, Gauge, Zap, Wind, TrendingUp, Info } from 'lucide-react';

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
  const [hudMode, setHudMode] = useState<'simple' | 'pro'>('simple');

  const displaySpeedBase = useMph ? Math.round(baseTelemetry.speed * 0.621371) : Math.round(baseTelemetry.speed);
  const displaySpeedRL = useMph ? Math.round(rlTelemetry.speed * 0.621371) : Math.round(rlTelemetry.speed);
  const speedUnit = useMph ? 'MPH' : 'KM/H';

  const speedDelta = displaySpeedRL - displaySpeedBase;
  const downforceDelta = rlTelemetry.downforceKg - baseTelemetry.downforceKg;
  const distanceGap = Math.abs(rlTelemetry.distance - baseTelemetry.distance).toFixed(1);
  const isRLLeading = deltaSeconds <= 0;

  // Determine dynamic plain-English insight based on what the car is doing
  let liveInsightText = 'Racing at full speed down the straight';
  let liveInsightCategory = 'Straightaway Speed';
  let liveInsightIcon = <Wind className="w-4 h-4 text-sky-600" />;

  if (rlTelemetry.brake > 0.3) {
    liveInsightCategory = 'Braking Advantage';
    liveInsightText = `RL AI brakes later (-15m) using rear-biased stability (4.8G decel).`;
    liveInsightIcon = <Zap className="w-4 h-4 text-rose-500" />;
  } else if (Math.abs(rlTelemetry.lateralG) > 2.0) {
    liveInsightCategory = 'Cornering Grip';
    liveInsightText = `Underfloor ground effect generates +${downforceDelta} kg suction through apex.`;
    liveInsightIcon = <TrendingUp className="w-4 h-4 text-emerald-600" />;
  } else if (rlTelemetry.drsActive) {
    liveInsightCategory = 'DRS Top Speed';
    liveInsightText = `Rear wing flap open: drag reduced by 22%, gaining +${Math.max(8, speedDelta)} ${speedUnit}.`;
    liveInsightIcon = <Wind className="w-4 h-4 text-indigo-600" />;
  } else if (rlTelemetry.throttle > 0.85 && displaySpeedRL < 220) {
    liveInsightCategory = 'Traction Exit';
    liveInsightText = `Differential lock allows 100% throttle pickup earlier without tire spin.`;
    liveInsightIcon = <Sparkles className="w-4 h-4 text-amber-500" />;
  }

  // RPM Shift lights calculation for lead car (5,000 - 15,000 RPM)
  const rpmPercent = Math.min(1, Math.max(0, (rlTelemetry.rpm - 5000) / 10000));
  const activeLeds = Math.round(rpmPercent * 12);
  const isOptimalShiftZone = rlTelemetry.rpm >= 13500;

  return (
    <div className="absolute inset-0 pointer-events-none p-2.5 sm:p-4 flex flex-col justify-between select-none">
      
      {/* 1. TOP BAR: Leaderboard + Quick Lead Banner + View Mode Switcher */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          
          {/* Top Left: Baseline Car Quick Badge */}
          <div
            id="hud-badge-baseline"
            className="bg-white/90 border border-slate-200/90 backdrop-blur-md rounded-2xl p-2 px-3 flex items-center gap-2.5 shadow-sm"
          >
            <div className="w-3 h-3 rounded-full bg-red-600 shadow-sm" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                #01 Baseline Car
              </span>
              <span className="text-xs font-mono font-black text-slate-900">
                {displaySpeedBase} <span className="text-[10px] font-semibold text-slate-700">{speedUnit}</span>
                <span className="text-[11px] font-bold text-slate-700 ml-1.5 font-sans">Gear {baseTelemetry.gear}</span>
              </span>
            </div>
          </div>

          {/* Top Center: Live Race Advantage Banner */}
          <div className="bg-white/95 border border-sky-200 backdrop-blur-md rounded-2xl px-3.5 py-1.5 flex items-center gap-2.5 sm:gap-3.5 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                LAP {currentLap}/{targetLaps}
              </span>
              <span className="text-xs font-bold text-slate-700 uppercase">
                {isRLLeading ? 'RL Lead:' : 'Base Lead:'}
              </span>
              <span className="text-sm font-black font-mono text-emerald-600">
                {isRLLeading ? `-${Math.abs(deltaSeconds).toFixed(3)}s` : `+${deltaSeconds.toFixed(3)}s`}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="text-xs font-mono font-bold text-slate-800">
              <span className="text-slate-700 font-normal">Gap: </span>
              <span className="text-sky-700">{distanceGap}m</span>
            </div>
          </div>

          {/* Top Right: RL-Optimized Car Badge & View Toggle */}
          <div className="flex items-center gap-1.5">
            {/* View Mode Toggle Switch (Simple vs Pro) */}
            <div className="pointer-events-auto bg-white/90 border border-slate-200/90 backdrop-blur-md rounded-2xl p-1 flex items-center gap-1 shadow-sm">
              <button
                onClick={() => setHudMode('simple')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  hudMode === 'simple'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Simple Beginner Overview with Plain-English Insights"
              >
                Simple
              </button>
              <button
                onClick={() => setHudMode('pro')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  hudMode === 'pro'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Pro Telemetry with RPM, G-Forces & Throttle/Brake Dials"
              >
                Telemetry
              </button>
            </div>

            {/* RL Car Badge */}
            <div
              id="hud-badge-rl"
              className="bg-white/90 border border-sky-200 backdrop-blur-md rounded-2xl p-2 px-3 flex items-center gap-2.5 shadow-sm"
            >
              <div className="w-3 h-3 rounded-full bg-sky-500 ring-2 ring-sky-300" />
              <div className="flex flex-col text-right">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center justify-end gap-1">
                  <span>#77 RL Car</span>
                  <Sparkles className="w-3 h-3 text-sky-500" />
                </span>
                <span className="text-xs font-mono font-black text-slate-900">
                  {displaySpeedRL} <span className="text-[10px] font-semibold text-slate-700">{speedUnit}</span>
                  <span className="text-[11px] font-bold text-slate-700 ml-1.5 font-sans">Gear {rlTelemetry.gear}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE VIEWPORT: Left completely open so cars are unobstructed */}
      <div className="flex-1" />

      {/* 3. BOTTOM COMPARISON DOCK */}
      {hudMode === 'simple' ? (
        /* SIMPLE BEGINNER-FRIENDLY ANALYSIS DOCK */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end max-w-5xl mx-auto w-full">
          
          {/* Card 1: Speed & Straightaway Comparison */}
          <div className="md:col-span-4 bg-white/95 border border-slate-200 backdrop-blur-md rounded-2xl p-3 flex flex-col gap-1.5 shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-1">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-sky-600" />
                <span>Live Speed Comparison</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                speedDelta >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700'
              }`}>
                {speedDelta >= 0 ? `RL +${speedDelta} ${speedUnit}` : `Base +${Math.abs(speedDelta)} ${speedUnit}`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-[10px] font-bold text-slate-700 uppercase">#01 Baseline</span>
                <span className="text-xl font-black font-mono text-slate-800 mt-0.5">{displaySpeedBase}</span>
                <span className="text-[10px] text-slate-700 font-medium">Gear {baseTelemetry.gear}</span>
              </div>

              <div className="bg-sky-50 p-2 rounded-xl border border-sky-100 flex flex-col">
                <span className="text-[10px] font-bold text-sky-800 uppercase flex items-center justify-between">
                  <span>#77 RL-Optimized</span>
                  <span className="text-[9px] font-black text-sky-700">{rlTelemetry.drsActive ? 'DRS' : ''}</span>
                </span>
                <span className="text-xl font-black font-mono text-sky-900 mt-0.5">{displaySpeedRL}</span>
                <span className="text-[10px] text-sky-800 font-medium">Gear {rlTelemetry.gear}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Plain-English Live Insight (Center Hero) */}
          <div className="md:col-span-5 bg-gradient-to-br from-white to-slate-50 border-2 border-sky-300 backdrop-blur-md rounded-2xl p-3 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <div className="flex items-center gap-1.5">
                {liveInsightIcon}
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  {liveInsightCategory}
                </span>
              </div>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                {currentCornerName.split('(')[0].trim()}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-700 my-1 leading-relaxed">
              {liveInsightText}
            </p>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 pt-1 border-t border-slate-100">
              <span>Road Grip: <strong className="text-slate-800 font-bold">{rlTelemetry.downforceKg} kg</strong></span>
              <span className="text-emerald-700 font-bold">Corner Force: {Math.abs(rlTelemetry.lateralG).toFixed(1)}G</span>
            </div>
          </div>

          {/* Card 3: Aerodynamic Downforce & Grip Comparison */}
          <div className="md:col-span-3 bg-white/95 border border-slate-200 backdrop-blur-md rounded-2xl p-3 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-1">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-indigo-600" />
                <span>Aero Suction</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                +{downforceDelta} kg
              </span>
            </div>

            <div className="my-1 flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-700">
                <span>RL Ground Grip</span>
                <span className="font-bold text-sky-800 font-mono">{rlTelemetry.downforceKg} kg</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min(100, (rlTelemetry.downforceKg / 2200) * 100)}%` }}
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-700 flex items-center gap-1 font-medium">
              <Info className="w-3 h-3 text-slate-700" />
              <span>More downforce = faster cornering without sliding</span>
            </div>
          </div>

        </div>
      ) : (
        /* PRO TELEMETRY ENGINEERING DOCK */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end max-w-6xl mx-auto w-full">
          
          {/* Left: Baseline Car Telemetry */}
          <div className="md:col-span-4 bg-white/95 border border-slate-200 backdrop-blur-md rounded-2xl p-3 flex flex-col gap-2 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">#01 Baseline Car</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700">{baseTelemetry.rpm.toLocaleString()} RPM</span>
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">{displaySpeedBase}</span>
                <span className="text-xs text-slate-700 font-semibold">{speedUnit}</span>
                <span className="ml-auto text-base font-black font-mono text-slate-700">G{baseTelemetry.gear}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">DOWNFORCE</span>
                <span className="text-xs font-mono font-bold text-slate-800">{baseTelemetry.downforceKg} kg</span>
              </div>
            </div>

            {/* Pedals */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[10px] font-mono font-bold text-emerald-700">
                  <span>THROTTLE</span>
                  <span>{Math.round(baseTelemetry.throttle * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.round(baseTelemetry.throttle * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[10px] font-mono font-bold text-rose-700">
                  <span>BRAKE</span>
                  <span>{Math.round(baseTelemetry.brake * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.round(baseTelemetry.brake * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center: Shift Light Array & Real-Time Deltas */}
          <div className="md:col-span-4 bg-white/95 border border-sky-200 backdrop-blur-md rounded-2xl p-3 flex flex-col items-center justify-between gap-1.5 shadow-md">
            <div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1">
              <span className="text-red-700">BASELINE</span>
              <span className="text-sky-800 uppercase tracking-wider">LIVE TELEMETRY DELTA</span>
              <span className="text-sky-700">RL CAR</span>
            </div>

            {/* 12-LED Shift Lights */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 px-3 rounded-full border border-slate-200 my-0.5">
              {Array.from({ length: 12 }).map((_, i) => {
                const isActive = i < activeLeds;
                let ledColor = 'bg-slate-300';
                if (isActive) {
                  if (i < 4) ledColor = 'bg-emerald-500';
                  else if (i < 8) ledColor = 'bg-amber-500';
                  else ledColor = 'bg-sky-500 ring-2 ring-sky-300';
                }
                return (
                  <div
                    key={i}
                    className={`w-2.5 h-2 rounded-[2px] transition-colors duration-75 ${ledColor}`}
                  />
                );
              })}
              <span className="text-[10px] font-mono font-bold text-slate-700 ml-1">
                {rlTelemetry.rpm.toLocaleString()} RPM
              </span>
            </div>

            <div className="grid grid-cols-3 w-full text-center gap-1.5 my-0.5">
              <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-200">
                <span className="text-[9px] text-slate-700 block uppercase font-bold">Speed Delta</span>
                <span className={`text-xs font-mono font-black ${speedDelta >= 0 ? 'text-sky-800' : 'text-rose-700'}`}>
                  {speedDelta >= 0 ? `+${speedDelta}` : speedDelta} {speedUnit}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-200">
                <span className="text-[9px] text-slate-700 block uppercase font-bold">Aero Delta</span>
                <span className="text-xs font-mono font-black text-emerald-700">
                  +{downforceDelta} kg
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-200">
                <span className="text-[9px] text-slate-700 block uppercase font-bold">Lateral G</span>
                <span className="text-xs font-mono font-black text-indigo-700">
                  {Math.abs(rlTelemetry.lateralG).toFixed(2)}G
                </span>
              </div>
            </div>
          </div>

          {/* Right: RL-Optimized Car Telemetry */}
          <div className="md:col-span-4 bg-white/95 border border-sky-200 backdrop-blur-md rounded-2xl p-3 flex flex-col gap-2 shadow-md">
            <div className="flex items-center justify-between border-b border-sky-100 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs font-extrabold text-sky-900 uppercase tracking-wider">#77 RL-Optimized Car</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                rlTelemetry.drsActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'text-slate-700'
              }`}>
                DRS {rlTelemetry.drsActive ? 'ACTIVE' : 'CLOSED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-sky-900 tracking-tight">{displaySpeedRL}</span>
                <span className="text-xs text-slate-700 font-semibold">{speedUnit}</span>
                <span className="ml-auto text-base font-black font-mono text-sky-700">G{rlTelemetry.gear}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">DOWNFORCE</span>
                <span className="text-xs font-mono font-bold text-sky-800">{rlTelemetry.downforceKg} kg</span>
              </div>
            </div>

            {/* Pedals */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[10px] font-mono font-bold text-emerald-700">
                  <span>THROTTLE</span>
                  <span>{Math.round(rlTelemetry.throttle * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.round(rlTelemetry.throttle * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[10px] font-mono font-bold text-rose-700">
                  <span>BRAKE</span>
                  <span>{Math.round(rlTelemetry.brake * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.round(rlTelemetry.brake * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
