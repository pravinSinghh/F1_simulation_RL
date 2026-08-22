import React, { useState, useEffect } from 'react';
import { TelemetryPoint, TrackDefinition, WeatherCondition } from '../types';
import { Activity, Sparkles, Zap, TrendingUp, Info } from 'lucide-react';

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

  // Downsample to 250 points for smooth SVG rendering
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
  const svgHeight = 250;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-100 border border-sky-200 text-sky-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Lap Speed & Telemetry Comparison
                </h2>
                <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {activeTrack.name}
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {activeWeather.badge}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium">
                Visual analysis comparing RL-optimized car (#77) vs Baseline benchmark car (#01)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold transition-colors border border-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Simple User Key Insights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 px-6 bg-sky-50/70 border-b border-sky-100">
          <div className="flex items-start gap-2">
            <div className="p-1 rounded-lg bg-sky-200/70 text-sky-800 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Higher Corner Speed</span>
              <span className="text-[11px] text-slate-700">RL carries +12 km/h higher minimum apex speed with ground-effect suction.</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="p-1 rounded-lg bg-rose-200/70 text-rose-800 mt-0.5">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Later Braking Points</span>
              <span className="text-[11px] text-slate-700">RL brakes 15m deeper into hairpins using dynamic brake-bias migration.</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="p-1 rounded-lg bg-emerald-200/70 text-emerald-800 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Instant Exit Traction</span>
              <span className="text-[11px] text-slate-700">Differential lock prevents wheelspin, giving 0.25s faster corner exit.</span>
            </div>
          </div>
        </div>

        {/* Tab Controls & Legend */}
        <div className="px-6 pt-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5 bg-slate-50/40">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'speed', label: 'Speed Profile (km/h)' },
              { id: 'gforce', label: 'Cornering Grip (Lateral G)' },
              { id: 'delta', label: 'Time Gap Δ (s)' },
              { id: 'throttle-brake', label: 'Throttle & Braking Inputs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMetricTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  metricTab === tab.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 bg-red-500 rounded-full" />
              <span className="text-slate-700 font-sans">#01 Baseline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 bg-sky-600 rounded-full" />
              <span className="text-sky-800 font-sans font-bold">#77 RL Optimized</span>
            </div>
          </div>
        </div>

        {/* Interactive SVG Chart Viewport */}
        <div className="p-6 flex-1 flex flex-col justify-center bg-white">
          <div className="relative w-full bg-slate-50 border border-slate-200 rounded-2xl p-2 overflow-hidden shadow-inner cursor-crosshair">
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
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Sector Dividers */}
              {(activeTrack?.sectors || []).map((sec) => {
                const startPct = sec.startDist / (activeTrack?.lengthMeters || 1);
                const x = padLeft + startPct * plotWidth;
                return (
                  <g key={sec.id}>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + plotHeight}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                    />
                    <text
                      x={x + 6}
                      y={padTop + 14}
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                    >
                      Sector {sec.id}
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
                    stroke="#0284c7"
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
                    stroke="#0284c7"
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
                    strokeWidth="2.5"
                  />
                  {/* RL Brake */}
                  <path
                    d={createSvgPath((d) => d.rlBrk, 0, 1)}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                  />
                </>
              )}

              {/* Real-Time Live Playback Scrubber Line */}
              <line
                x1={currentScrubberX}
                y1={padTop}
                x2={currentScrubberX}
                y2={padTop + plotHeight}
                stroke="#0f172a"
                strokeWidth="2"
              />
              <circle
                cx={currentScrubberX}
                cy={padTop + plotHeight}
                r="4.5"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-700 font-mono font-bold">
            <span>🏁 START / FINISH</span>
            <span>DISTANCE ALONG CIRCUIT (0 → {(activeTrack.lengthMeters / 1000).toFixed(2)} KM)</span>
            <span>LAP COMPLETION 🏁</span>
          </div>
        </div>
      </div>
    </div>
  );
};
