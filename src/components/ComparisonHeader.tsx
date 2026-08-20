import React, { useState, useEffect, useRef } from 'react';
import { TelemetryPoint, LapSummary, TrackId, WeatherConditionId, StintLengthOption } from '../types';
import { TRACKS_DATA, WEATHER_CONDITIONS } from '../physics/f1Track';
import { Cpu, Activity, MapPin, CloudRain, ChevronDown, Trophy } from 'lucide-react';

interface ComparisonHeaderProps {
  currentTrackId: TrackId;
  onChangeTrack: (trackId: TrackId) => void;
  currentWeatherId: WeatherConditionId;
  onChangeWeather: (weatherId: WeatherConditionId) => void;
  baseTelemetry: TelemetryPoint;
  rlTelemetry: TelemetryPoint;
  lapSummary: LapSummary;
  progress: number;
  currentLap: number;
  targetLaps: StintLengthOption;
  onChangeTargetLaps: (laps: StintLengthOption) => void;
  onOpenInspector: () => void;
  onOpenTelemetryGraph: () => void;
  onOpenStintEvaluation: () => void;
}

export const ComparisonHeader: React.FC<ComparisonHeaderProps> = ({
  currentTrackId,
  onChangeTrack,
  currentWeatherId,
  onChangeWeather,
  baseTelemetry,
  rlTelemetry,
  lapSummary,
  progress,
  currentLap,
  targetLaps,
  onChangeTargetLaps,
  onOpenInspector,
  onOpenTelemetryGraph,
  onOpenStintEvaluation,
}) => {
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);
  const [isWeatherDropdownOpen, setIsWeatherDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsTrackDropdownOpen(false);
        setIsWeatherDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDeltaTime = rlTelemetry.time - baseTelemetry.time;
  const speedDelta = Math.round(rlTelemetry.speed - baseTelemetry.speed);

  // Mini-sector blocks (24 micro-sectors)
  const numMiniSectors = 24;
  const currentMiniSector = Math.floor(progress * numMiniSectors);

  const activeTrack = TRACKS_DATA[currentTrackId] || TRACKS_DATA.silverstone;
  const activeWeather = WEATHER_CONDITIONS[currentWeatherId] || WEATHER_CONDITIONS.dry;

  return (
    <header className="px-2 sm:px-3 pt-2 pb-0.5 select-none z-30">
      {/* Bento Grid Top Container */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
        {/* Bento Cell 1: App Identity & Track / Weather Selectors (Cols 1-4) */}
        <div className="md:col-span-4 bg-[#11131c]/90 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-2 px-3 flex items-center justify-between gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-zinc-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.45)]">
              F1
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-black text-white tracking-tight">
                  F1 Simulator
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  PPO-v3
                </span>
              </div>
            </div>
          </div>

          {/* Track & Weather Selector Dropdowns */}
          <div ref={dropdownRef} className="flex items-center gap-1.5 relative">
            {/* Track Switcher */}
            <div className="relative">
              <button
                id="btn-select-track"
                onClick={() => {
                  setIsTrackDropdownOpen(!isTrackDropdownOpen);
                  setIsWeatherDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-[11px] font-medium text-zinc-200 transition-all hover:border-cyan-500/40"
                title="Select Grand Prix Circuit"
              >
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span className="max-w-[75px] truncate font-bold">{activeTrack.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {isTrackDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#0d1017] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-2xl">
                  <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-zinc-400 border-b border-white/5 font-bold">
                    Select Grand Prix Circuit
                  </div>
                  {(Object.keys(TRACKS_DATA) as TrackId[]).map((tId) => {
                    const t = TRACKS_DATA[tId];
                    const isSelected = tId === currentTrackId;
                    return (
                      <button
                        key={tId}
                        onClick={() => {
                          onChangeTrack(tId);
                          setIsTrackDropdownOpen(false);
                        }}
                        className={`flex flex-col text-left px-2.5 py-1.5 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300'
                            : 'hover:bg-zinc-800/80 text-zinc-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{t.name}</span>
                          <span className="text-[9px] font-mono text-zinc-400">{(t.lengthMeters / 1000).toFixed(2)} km</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate">{t.evaluationFocus}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weather / Seasonal Condition Switcher */}
            <div className="relative">
              <button
                id="btn-select-weather"
                onClick={() => {
                  setIsWeatherDropdownOpen(!isWeatherDropdownOpen);
                  setIsTrackDropdownOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-[11px] font-medium text-amber-300 transition-all hover:border-amber-500/40"
                title="Select Seasonal / Weather Condition"
              >
                <CloudRain className="w-3 h-3 text-amber-400" />
                <span className="max-w-[65px] truncate">{activeWeather.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {isWeatherDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-64 bg-[#0d1017] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-2xl">
                  <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-zinc-400 border-b border-white/5 font-bold">
                    Seasonal Environmental Conditions
                  </div>
                  {(Object.keys(WEATHER_CONDITIONS) as WeatherConditionId[]).map((wId) => {
                    const w = WEATHER_CONDITIONS[wId];
                    const isSelected = wId === currentWeatherId;
                    return (
                      <button
                        key={wId}
                        onClick={() => {
                          onChangeWeather(wId);
                          setIsWeatherDropdownOpen(false);
                        }}
                        className={`flex flex-col text-left px-2.5 py-1.5 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                            : 'hover:bg-zinc-800/80 text-zinc-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{w.name}</span>
                          <span className="text-[9px] font-mono font-bold text-amber-400">{w.trackTemp}°C</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 truncate">{w.description}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bento Cell 2: Stint Round Selector & Live Gap Dominance (Cols 5-8) */}
        <div className="md:col-span-4 bg-[#11131c]/90 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-1.5 px-3 flex flex-col items-center justify-center gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between w-full font-mono text-[11px]">
            {/* Laps Stint Selector */}
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
              {([5, 10, 20] as StintLengthOption[]).map((l) => (
                <button
                  key={l}
                  onClick={() => onChangeTargetLaps(l)}
                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded transition-colors ${
                    targetLaps === l
                      ? 'bg-cyan-500 text-zinc-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {l}L
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-semibold tracking-wider text-[10px]">
                LAP {currentLap}/{targetLaps}
              </span>
              <span className="text-emerald-400 font-extrabold text-xs tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                {currentDeltaTime <= 0 ? `${currentDeltaTime.toFixed(3)}s` : `+${currentDeltaTime.toFixed(3)}s`}
              </span>
            </div>
          </div>

          {/* Micro-Sectors Indicator Strip */}
          <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/5 w-full justify-center">
            {Array.from({ length: numMiniSectors }).map((_, i) => {
              const isPassed = i <= currentMiniSector;
              const isCurrent = i === currentMiniSector;
              const isRLDominant = i !== 0 && i !== 12;
              
              let bgColor = 'bg-zinc-800/80';
              if (isCurrent) {
                bgColor = 'bg-white shadow-[0_0_8px_#ffffff] scale-110';
              } else if (isPassed) {
                bgColor = isRLDominant ? 'bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]' : 'bg-amber-400';
              }

              return (
                <div
                  key={i}
                  className={`w-2 sm:w-2.5 h-1.5 rounded-[2px] transition-all duration-75 ${bgColor}`}
                  title={`Mini Sector ${i + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Bento Cell 3: Technical Modal Triggers & Grand Prix Evaluation (Cols 9-12) */}
        <div className="md:col-span-4 bg-[#11131c]/90 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-1.5 px-2 flex items-center justify-end gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          {/* Stint Evaluation Button */}
          <button
            id="btn-open-evaluation"
            onClick={onOpenStintEvaluation}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 hover:from-cyan-500/30 hover:to-emerald-500/30 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            title="Open Stint Evaluation & RL Aero Benchmark Report"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Evaluation ({targetLaps}L)</span>
          </button>

          <button
            id="btn-open-inspector"
            onClick={onOpenInspector}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-[11px] font-semibold text-zinc-200 transition-all hover:border-cyan-500/50"
            title="Inspect RL Component Optimizations"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Aero Parts</span>
          </button>

          <button
            id="btn-open-telemetry-graph"
            onClick={onOpenTelemetryGraph}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-semibold text-cyan-300 transition-all"
            title="View Real-Time Lap Traces & Delta Chart"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Traces</span>
          </button>
        </div>
      </div>
    </header>
  );
};
