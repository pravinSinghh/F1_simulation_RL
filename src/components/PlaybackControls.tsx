import React from 'react';
import { CameraMode, SyncMode, TrackSector } from '../types';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera,
  Wind,
  Route,
  Timer,
} from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  progress: number;
  onSeek: (prog: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  cameraMode: CameraMode;
  onChangeCameraMode: (mode: CameraMode) => void;
  syncMode: SyncMode;
  onToggleSyncMode: () => void;
  showAeroFlow: boolean;
  onToggleAeroFlow: () => void;
  showRacingLines: boolean;
  onToggleRacingLines: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  useMph: boolean;
  onToggleUnit: () => void;
  currentTimeSeconds: number;
  totalLapTimeSeconds: number;
  currentCornerName: string;
  sectors?: TrackSector[];
  totalTrackLength?: number;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onReset,
  progress,
  onSeek,
  playbackSpeed,
  onChangeSpeed,
  cameraMode,
  onChangeCameraMode,
  syncMode,
  onToggleSyncMode,
  showAeroFlow,
  onToggleAeroFlow,
  showRacingLines,
  onToggleRacingLines,
  isMuted,
  onToggleMute,
  useMph,
  onToggleUnit,
  currentTimeSeconds,
  totalLapTimeSeconds,
  currentCornerName,
  sectors = [],
  totalTrackLength = 5891,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const cameraOptions: { id: CameraMode; label: string }[] = [
    { id: 'director', label: 'Auto TV Director' },
    { id: 'chase', label: 'Chase Cam' },
    { id: 'trackside', label: 'Trackside' },
    { id: 'overhead', label: 'Overhead' },
    { id: 'cockpit', label: 'Cockpit' },
    { id: 'gyro', label: 'Nose Gyro' },
    { id: 'split', label: 'Split Screen' },
  ];

  return (
    <div className="px-2 sm:px-4 pb-3 pt-1 select-none z-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        
        {/* Timeline & Sector Scrubber Card */}
        <div className="bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-2xl p-2.5 sm:px-4 flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-900 font-bold text-xs tracking-tight font-sans">
                {currentCornerName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
              <span className="text-sky-700">{formatTime(currentTimeSeconds)}</span>
              <span className="text-slate-700">/</span>
              <span className="text-slate-700">{formatTime(totalLapTimeSeconds)}</span>
            </div>
          </div>

          {/* Interactive Track Timeline Bar */}
          <div className="relative w-full h-4 flex items-center group cursor-pointer">
            {/* Sector Background segments */}
            <div className="absolute inset-y-0.5 inset-x-0 bg-slate-100 rounded-full flex overflow-hidden border border-slate-200">
              {sectors.map((sector, idx) => {
                const widthPct = ((sector.endDist - sector.startDist) / Math.max(1, totalTrackLength)) * 100;
                const sectorBg = idx === 0 ? 'bg-slate-100' : idx === 1 ? 'bg-slate-200/60' : 'bg-slate-100';
                return (
                  <div
                    key={sector.id}
                    className={`h-full border-r border-slate-200 flex items-center px-2 text-[9px] text-slate-700 font-mono font-bold ${sectorBg}`}
                    style={{ width: `${widthPct}%` }}
                  >
                    S{sector.id}
                  </div>
                );
              })}
            </div>

            {/* Active Progress Fill */}
            <div
              className="absolute top-0.5 bottom-0.5 left-0 bg-gradient-to-r from-sky-500 via-sky-400 to-emerald-500 rounded-l-full pointer-events-none transition-all duration-75 shadow-sm"
              style={{ width: `${progress * 100}%` }}
            />

            {/* Scrubber Knob */}
            <div
              className="absolute w-4 h-4 bg-white border-2 border-sky-500 rounded-full shadow-md top-0 -ml-2 transition-transform duration-75 group-hover:scale-125"
              style={{ left: `${progress * 100}%` }}
            />

            {/* Hidden Range Input */}
            <input
              id="f1-timeline-scrubber"
              type="range"
              min="0"
              max="1"
              step="0.0005"
              value={progress}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>

        {/* Controls Row: Transport, Camera switcher, Quick Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          
          {/* Sub-Cell A: Transport & Speed (Cols 1-3) */}
          <div className="md:col-span-3 bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-2xl p-1.5 px-3 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-1.5">
              {/* Play/Pause Button */}
              <button
                id="btn-play-pause"
                onClick={onTogglePlay}
                className={`flex items-center justify-center w-8 h-8 rounded-xl font-bold transition-all ${
                  isPlaying
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                    : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                }`}
                title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* Reset Button */}
              <button
                id="btn-reset-lap"
                onClick={onReset}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
                title="Restart Lap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
              {[0.25, 0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    playbackSpeed === s
                      ? 'bg-white text-sky-800 shadow-sm border border-slate-200'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Cell B: Camera Angles (Cols 4-8) */}
          <div className="md:col-span-5 bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-2xl p-1.5 px-2.5 flex items-center gap-1 overflow-x-auto shadow-sm scrollbar-none">
            {cameraOptions.map((cam) => {
              const isActive = cameraMode === cam.id;
              const isDirector = cam.id === 'director';
              return (
                <button
                  key={cam.id}
                  onClick={() => onChangeCameraMode(cam.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? isDirector
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-sky-600 text-white shadow-sm'
                      : isDirector
                      ? 'text-red-700 hover:bg-red-50 border border-red-200'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {isDirector ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-red-500'}`} />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                  <span>{cam.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Cell C: Visual Toggles & Audio (Cols 9-12) */}
          <div className="md:col-span-4 bg-white/95 border border-slate-200/90 backdrop-blur-md rounded-2xl p-1.5 px-2.5 flex items-center justify-end gap-1.5 shadow-sm">
            {/* Sync Mode Toggle */}
            <button
              id="btn-toggle-sync"
              onClick={onToggleSyncMode}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                syncMode === 'time'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Time Sync (Live Race Battle) vs Distance Sync (Apex Alignment)"
            >
              <Timer className="w-3 h-3 text-emerald-700" />
              <span>{syncMode === 'time' ? 'Live Race' : 'Apex Sync'}</span>
            </button>

            {/* Racing Lines 3D Toggle */}
            <button
              id="btn-toggle-lines"
              onClick={onToggleRacingLines}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                showRacingLines
                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Toggle 3D Racing Trajectory on Asphalt"
            >
              <Route className="w-3 h-3 text-sky-700" />
              <span>Lines</span>
            </button>

            {/* Aero Flow Streamlines Toggle */}
            <button
              id="btn-toggle-aero"
              onClick={onToggleAeroFlow}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                showAeroFlow
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Toggle Aerodynamic Vortices"
            >
              <Wind className="w-3 h-3 text-indigo-700" />
              <span>Aero</span>
            </button>

            {/* Unit Toggle */}
            <button
              id="btn-toggle-unit"
              onClick={onToggleUnit}
              className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-mono font-bold text-slate-700 transition-colors"
            >
              {useMph ? 'MPH' : 'KM/H'}
            </button>

            {/* Audio Toggle */}
            <button
              id="btn-toggle-audio"
              onClick={onToggleMute}
              className={`p-1.5 rounded-xl border transition-colors ${
                !isMuted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={!isMuted ? 'Mute Audio' : 'Unmute Engine Audio'}
            >
              {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
