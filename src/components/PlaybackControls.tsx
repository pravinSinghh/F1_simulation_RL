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
    { id: 'director', label: 'Auto-Director (TV)' },
    { id: 'chase', label: 'Dynamic Chase' },
    { id: 'trackside', label: 'TV Trackside' },
    { id: 'overhead', label: 'Overhead Drone' },
    { id: 'cockpit', label: 'Cockpit View' },
    { id: 'gyro', label: 'Front Gyro' },
    { id: 'split', label: 'Split Screen' },
  ];

  return (
    <div className="px-2 sm:px-3 pb-2 pt-0.5 select-none z-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-2">
        {/* Bento Cell 1: Interactive Track Timeline & Sector Scrubber Card */}
        <div className="bg-[#11131c]/90 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-2 sm:px-4 flex flex-col gap-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-white font-bold text-xs tracking-tight">{currentCornerName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-cyan-400 font-extrabold">{formatTime(currentTimeSeconds)}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400 font-medium">{formatTime(totalLapTimeSeconds)}</span>
            </div>
          </div>

          {/* Interactive Track Timeline Bar */}
          <div className="relative w-full h-4 flex items-center group cursor-pointer">
            {/* Sector Background segments */}
            <div className="absolute inset-y-0.5 inset-x-0 bg-black/50 rounded-full flex overflow-hidden border border-white/[0.06]">
              {sectors.map((sector, idx) => {
                const widthPct = ((sector.endDist - sector.startDist) / Math.max(1, totalTrackLength)) * 100;
                const sectorBg = idx === 0 ? 'bg-zinc-800/40' : idx === 1 ? 'bg-zinc-800/70' : 'bg-zinc-800/40';
                return (
                  <div
                    key={sector.id}
                    className={`h-full border-r border-white/5 flex items-center px-2 text-[9px] text-zinc-400 font-mono font-bold ${sectorBg}`}
                    style={{ width: `${widthPct}%` }}
                  >
                    S{sector.id}
                  </div>
                );
              })}
            </div>

            {/* Active Progress Fill */}
            <div
              className="absolute top-0.5 bottom-0.5 left-0 bg-gradient-to-r from-cyan-500/80 via-cyan-400 to-emerald-400 rounded-l-full pointer-events-none transition-all duration-75 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
              style={{ width: `${progress * 100}%` }}
            />

            {/* Scrubber Knob */}
            <div
              className="absolute w-4 h-4 bg-white border-2 border-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee] top-0 -ml-2 transition-transform duration-75 group-hover:scale-125"
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

        {/* Bento Grid Row: Transport, Camera switcher, Quick Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          {/* Bento Sub-Cell A: Transport & Speed (Cols 1-3) */}
          <div className="md:col-span-3 bg-[#11131c]/90 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-1.5 px-2.5 flex items-center justify-between gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-1.5">
              {/* Play/Pause Button */}
              <button
                id="btn-play-pause"
                onClick={onTogglePlay}
                className={`flex items-center justify-center w-8 h-8 rounded-xl font-bold transition-all ${
                  isPlaying
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-[0_0_16px_rgba(6,182,212,0.5)]'
                }`}
                title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              {/* Reset Button */}
              <button
                id="btn-reset-lap"
                onClick={onReset}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 transition-colors"
                title="Restart Lap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center bg-black/40 border border-white/5 rounded-xl p-0.5">
              {[0.25, 0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                    playbackSpeed === s
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Bento Sub-Cell B: Camera Angles (Cols 4-8) */}
          <div className="md:col-span-5 bg-[#11131c]/90 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-1.5 px-2 flex items-center gap-1 overflow-x-auto shadow-[0_4px_20px_rgba(0,0,0,0.3)] scrollbar-none">
            {cameraOptions.map((cam) => {
              const isActive = cameraMode === cam.id;
              const isDirector = cam.id === 'director';
              return (
                <button
                  key={cam.id}
                  onClick={() => onChangeCameraMode(cam.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? isDirector
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold shadow-[0_0_14px_rgba(239,68,68,0.5)] border border-red-400/40'
                        : 'bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : isDirector
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  {isDirector ? (
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-red-400'}`} />
                  ) : (
                    <Camera className="w-3 h-3" />
                  )}
                  <span>{cam.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bento Sub-Cell C: Visual Toggles & Audio (Cols 9-12) */}
          <div className="md:col-span-4 bg-[#11131c]/90 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-1.5 px-2 flex items-center justify-end gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            {/* Sync Mode Toggle */}
            <button
              id="btn-toggle-sync"
              onClick={onToggleSyncMode}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-medium border transition-all ${
                syncMode === 'time'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                  : 'bg-zinc-900 text-zinc-400 border-white/10'
              }`}
              title="Time Sync (Live Race Battle) vs Distance Sync (Apex Alignment)"
            >
              <Timer className="w-3 h-3" />
              <span>{syncMode === 'time' ? 'Live Race' : 'Apex Sync'}</span>
            </button>

            {/* Racing Lines 3D Toggle */}
            <button
              id="btn-toggle-lines"
              onClick={onToggleRacingLines}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-medium border transition-all ${
                showRacingLines
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                  : 'bg-zinc-900 text-zinc-400 border-white/10'
              }`}
              title="Toggle 3D Racing Trajectory on Asphalt"
            >
              <Route className="w-3 h-3" />
              <span>Lines</span>
            </button>

            {/* Aero Flow Streamlines Toggle */}
            <button
              id="btn-toggle-aero"
              onClick={onToggleAeroFlow}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-medium border transition-all ${
                showAeroFlow
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-zinc-200'
              }`}
              title="Toggle Aerodynamic Vortices"
            >
              <Wind className="w-3 h-3" />
              <span>Aero</span>
            </button>

            {/* Unit Toggle */}
            <button
              id="btn-toggle-unit"
              onClick={onToggleUnit}
              className="px-1.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[10px] font-mono font-semibold text-zinc-300 transition-colors"
            >
              {useMph ? 'MPH' : 'KM/H'}
            </button>

            {/* Audio Toggle */}
            <button
              id="btn-toggle-audio"
              onClick={onToggleMute}
              className={`p-1 rounded-xl border transition-colors ${
                !isMuted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-500 border-white/10 hover:text-zinc-300'
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
