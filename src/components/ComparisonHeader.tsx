import React, { useState, useEffect, useRef } from 'react';
import { TelemetryPoint, LapSummary, TrackId, WeatherConditionId, StintLengthOption } from '../types';
import { TRACKS_DATA, WEATHER_CONDITIONS } from '../physics/f1Track';
import { Cpu, Activity, MapPin, CloudSun, ChevronDown, Trophy, Sparkles } from 'lucide-react';

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
  const isRLLeading = currentDeltaTime <= 0;

  // Mini-sector blocks (24 micro-sectors)
  const numMiniSectors = 24;
  const currentMiniSector = Math.floor(progress * numMiniSectors);

  const activeTrack = TRACKS_DATA[currentTrackId] || TRACKS_DATA.silverstone;
  const activeWeather = WEATHER_CONDITIONS[currentWeatherId] || WEATHER_CONDITIONS.dry;

  return (
    <header className="px-2 sm:px-4 pt-2 pb-1 select-none z-30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
        
        {/* Cell 1: Brand & Circuit / Weather Selectors (Cols 1-5) */}
        <div className="md:col-span-5 bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-2xl p-2.5 px-3.5 flex items-center justify-between gap-2 shadow-sm">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white font-black text-xs shadow-sm tracking-tighter">
              F1
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-slate-900 tracking-tight">
                  F1 Simulator
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                  RL vs Base
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium truncate max-w-[160px] sm:max-w-none">
                {activeTrack.name}
              </p>
            </div>
          </div>

          {/* Circuit & Weather Dropdown Trigger Controls */}
          <div ref={dropdownRef} className="flex items-center gap-1.5 relative">
            {/* Track Switcher */}
            <div className="relative">
              <button
                id="btn-select-track"
                onClick={() => {
                  setIsTrackDropdownOpen(!isTrackDropdownOpen);
                  setIsWeatherDropdownOpen(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-800 transition-all hover:border-slate-300"
                title="Select Grand Prix Circuit"
              >
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span className="max-w-[70px] sm:max-w-[90px] truncate">{activeTrack.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-700" />
              </button>

              {isTrackDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl z-50 flex flex-col gap-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-700 border-b border-slate-100 font-extrabold">
                    Select Circuit
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
                        className={`flex flex-col text-left px-3 py-2 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-sky-50 border border-sky-200 text-sky-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{t.name}</span>
                          <span className="text-[10px] text-slate-700 font-mono font-medium">
                            {(t.lengthMeters / 1000).toFixed(2)} km
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-700 truncate mt-0.5">{t.evaluationFocus}</span>
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
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-xs font-bold text-amber-900 transition-all hover:border-amber-300"
                title="Select Weather Condition"
              >
                <CloudSun className="w-3.5 h-3.5 text-amber-600" />
                <span className="max-w-[65px] truncate">{activeWeather.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-amber-700" />
              </button>

              {isWeatherDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xl z-50 flex flex-col gap-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-700 border-b border-slate-100 font-extrabold">
                    Weather & Track Conditions
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
                        className={`flex flex-col text-left px-3 py-2 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-amber-50 border border-amber-200 text-amber-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{w.name}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-700">{w.trackTemp}°C</span>
                        </div>
                        <span className="text-[11px] text-slate-700 truncate mt-0.5">{w.description}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cell 2: Lap Progress & Track Dominance (Cols 6-8) */}
        <div className="md:col-span-3 bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-2xl p-2 px-3.5 flex flex-col justify-center gap-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            {/* Laps Stint Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {([5, 10, 20] as StintLengthOption[]).map((l) => (
                <button
                  key={l}
                  onClick={() => onChangeTargetLaps(l)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                    targetLaps === l
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                  title={`Run ${l}-Lap Stint Simulation`}
                >
                  {l}L
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700">
                LAP {currentLap}/{targetLaps}
              </span>
              <span className="text-xs font-black font-mono px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {isRLLeading ? `-${Math.abs(currentDeltaTime).toFixed(3)}s` : `+${currentDeltaTime.toFixed(3)}s`}
              </span>
            </div>
          </div>

          {/* Micro-Sectors Indicator Strip */}
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 w-full justify-between">
            {Array.from({ length: numMiniSectors }).map((_, i) => {
              const isPassed = i <= currentMiniSector;
              const isCurrent = i === currentMiniSector;
              const isRLDominant = i !== 0 && i !== 12;

              let bgColor = 'bg-slate-300';
              if (isCurrent) {
                bgColor = 'bg-slate-900 ring-2 ring-sky-400 scale-110';
              } else if (isPassed) {
                bgColor = isRLDominant ? 'bg-sky-500' : 'bg-amber-400';
              }

              return (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-[2px] transition-all duration-75 ${bgColor}`}
                  title={`Micro-Sector ${i + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Cell 3: Clear Analysis & Comparison Reports (Cols 9-12) */}
        <div className="md:col-span-4 bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-2xl p-1.5 px-2.5 flex items-center justify-end gap-1.5 shadow-sm">
          {/* Stint Evaluation Button */}
          <button
            id="btn-open-evaluation"
            onClick={onOpenStintEvaluation}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-xs font-bold text-white shadow-sm transition-all"
            title="Open Stint Evaluation & Race Report"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Race Report</span>
          </button>

          {/* Traces / Telemetry Graphs Button */}
          <button
            id="btn-open-telemetry-graph"
            onClick={onOpenTelemetryGraph}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-800 transition-all hover:border-slate-300"
            title="View Real-Time Graphs & Speed Comparison"
          >
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            <span>Speed Traces</span>
          </button>

          {/* Aero Parts Inspector */}
          <button
            id="btn-open-inspector"
            onClick={onOpenInspector}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold text-slate-800 transition-all hover:border-slate-300"
            title="Inspect RL Optimizations & Aero Components"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>RL Upgrades</span>
          </button>
        </div>
      </div>
    </header>
  );
};
