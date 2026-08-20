import React, { useState, useEffect } from 'react';
import { TelemetryPoint, TrackDefinition, WeatherCondition } from '../types';
import { Activity } from 'lucide-react';

interface TelemetryGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProgress: number;
  onSeek: (prog: number) => void;
  baselineTelemetry: TelemetryPoint[];
  rlTelemetry: TelemetryPoint[];
  activeTrack: TrackDefinition;
  activeWeather: WeatherCondition;
}

export const TelemetryGraphModal: React.FC<TelemetryGraphModalProps> = ({
  isOpen,
  onClose,
  currentProgress,
  onSeek,
  baselineTelemetry,
  rlTelemetry,
  activeTrack,
  activeWeather,
}) => {
  const [metricTab, setMetricTab] = useState<'speed' | 'gforce' | 'delta' | 'throttle-brake'>('speed');

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

  const basePoints = baselineTelemetry;
  const rlPoints = rlTelemetry;
  const numPts = basePoints.length;

  // Downsample to 250 points for super smooth SVG rendering
  const step = Math.max(1, Math.floor(numPts / 250));
  const sampleData: {
    distPct: number;
    baseSpeed: number;
    rlSpeed: number;
    baseG: number;
    rlG: number;
    baseThr: number;
    rlThr: number;
    baseBrk: number;
    rlBrk: number;
    delta: number;
  }[] = [];

  for (let i = 0; i < numPts; i += step) {
    const b = basePoints[i] || basePoints[0];
    const r = rlPoints[i] || rlPoints[0];
    sampleData.push({
      distPct: b.progress,
      baseSpeed: b.speed,
      rlSpeed: r.speed,
      baseG: Math.abs(b.lateralG),
      rlG: Math.abs(r.lateralG),
      baseThr: b.throttle,
      rlThr: r.throttle,
      baseBrk: b.brake,
      rlBrk: r.brake,
      delta: r.time - b.time,
    });
  }

  // Graph dimensions
  const svgWidth = 800;
  const svgHeight = 260;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Create SVG path string generator
  const createSvgPath = (getValue: (d: (typeof sampleData)[0]) => number, minVal: number, maxVal: number) => {
    return sampleData
      .map((d, i) => {
        const x = padLeft + (d.distPct * plotWidth);
        const normY = (getValue(d) - minVal) / (maxVal - minVal || 1);
        const y = padTop + plotHeight - Math.max(0, Math.min(plotHeight, normY * plotHeight));
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const currentScrubberX = padLeft + currentProgress * plotWidth;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="bg-[#0e111a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-[0_24px_64px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  High-Resolution Telemetry Traces
                </h2>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {activeTrack.name}
                </span>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {activeWeather.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Full-lap overlay comparison across throttle, braking, lateral cornering load, and apex speeds
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-4 flex items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'speed', label: 'Speed Profile (km/h)' },
              { id: 'gforce', label: 'Lateral G-Force (G)' },
              { id: 'delta', label: 'Time Delta Δ (s)' },
              { id: 'throttle-brake', label: 'Throttle & Braking Inputs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMetricTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  metricTab === tab.id
                    ? 'bg-cyan-500 text-zinc-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-red-500 rounded-full" />
              <span className="text-zinc-400">Baseline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-cyan-400 rounded-full shadow-[0_0_6px_#22d3ee]" />
              <span className="text-cyan-300 font-bold">RL-Optimized</span>
            </div>
          </div>
        </div>

        {/* Interactive SVG Chart Viewport */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          <div className="relative w-full bg-[#080a10] border border-white/10 rounded-2xl p-2 overflow-hidden shadow-inner cursor-crosshair">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto block"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const normX = Math.max(0, Math.min(1, (clickX - (padLeft / svgWidth) * rect.width) / ((plotWidth / svgWidth) * rect.width)));
                onSeek(normX);
              }}
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = padTop + pct * plotHeight;
                return (
                  <line
                    key={i}
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + plotWidth}
                    y2={y}
                    stroke="#27272a"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Sector Dividers */}
              {activeTrack.sectors.map((sec) => {
                const startPct = sec.startDist / activeTrack.lengthMeters;
                const x = padLeft + startPct * plotWidth;
                return (
                  <g key={sec.id}>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + plotHeight}
                      stroke="#3f3f46"
                      strokeWidth="1.5"
                    />
                    <text
                      x={x + 6}
                      y={padTop + 14}
                      fill="#71717a"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      S{sec.id}
                    </text>
                  </g>
                );
              })}

              {/* Chart Series depending on active tab */}
              {metricTab === 'speed' && (
                <>
                  <path
                    d={createSvgPath((d) => d.baseSpeed, 60, 360)}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeOpacity="0.85"
                  />
                  <path
                    d={createSvgPath((d) => d.rlSpeed, 60, 360)}
                    fill="none"
                    stroke="#00e5ff"
                    strokeWidth="2.5"
                  />
                </>
              )}

              {metricTab === 'gforce' && (
                <>
                  <path
                    d={createSvgPath((d) => d.baseG, 0, 5.5)}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeOpacity="0.85"
                  />
                  <path
                    d={createSvgPath((d) => d.rlG, 0, 5.5)}
                    fill="none"
                    stroke="#00e5ff"
                    strokeWidth="2.5"
                  />
                </>
              )}

              {metricTab === 'delta' && (
                <path
                  d={createSvgPath((d) => d.delta, -2.5, 0.5)}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />
              )}

              {metricTab === 'throttle-brake' && (
                <>
                  {/* RL Throttle */}
                  <path
                    d={createSvgPath((d) => d.rlThr, 0, 1)}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  {/* RL Brake */}
                  <path
                    d={createSvgPath((d) => d.rlBrk, 0, 1)}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2"
                  />
                </>
              )}

              {/* Real-Time Live Playback Scrubber Line */}
              <line
                x1={currentScrubberX}
                y1={padTop}
                x2={currentScrubberX}
                y2={padTop + plotHeight}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={currentScrubberX}
                cy={padTop + plotHeight}
                r="4"
                fill="#00e5ff"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>START / FINISH</span>
            <span>DISTANCE ALONG CIRCUIT (0 → {(activeTrack.lengthMeters / 1000).toFixed(2)} KM)</span>
            <span>LAP COMPLETION</span>
          </div>
        </div>
      </div>
    </div>
  );
};
