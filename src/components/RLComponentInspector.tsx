import React, { useState } from 'react';
import { RL_OPTIMIZATIONS } from '../physics/carSimulation';
import { LapSummary } from '../types';
import { Cpu, Wind, Wrench, Shield, CheckCircle2, TrendingUp, Sliders, Zap } from 'lucide-react';

interface RLComponentInspectorProps {
  lapSummary: LapSummary;
  isOpen: boolean;
  onClose: () => void;
}

export const RLComponentInspector: React.FC<RLComponentInspectorProps> = ({
  lapSummary,
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'aerodynamics' | 'mechanical' | 'control_policy'>('all');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSpecs = selectedCategory === 'all'
    ? RL_OPTIMIZATIONS
    : RL_OPTIMIZATIONS.filter((s) => s.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'aerodynamics':
        return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'mechanical':
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'control_policy':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      default:
        return <Sliders className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl"
    >
      <div className="bg-[#0f111a]/95 border border-white/10 w-full max-w-4xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                RL Optimization Architecture Matrix
              </h2>
              <p className="text-xs text-zinc-400">
                PPO Deep Policy Component Matrix vs OEM Baseline Benchmark
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center justify-center font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Lap Gains Summary Bento Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-black/40 border-b border-white/[0.06]">
          <div className="bg-[#141724]/90 border border-white/[0.08] rounded-2xl p-3 shadow-md">
            <span className="text-[9px] text-zinc-400 uppercase font-semibold tracking-wider">Lap Time Delta</span>
            <div className="text-xl font-black font-mono text-emerald-400 mt-0.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              {lapSummary.deltaLapTime}s
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{lapSummary.lapTimeRL.toFixed(2)}s vs {lapSummary.lapTimeBaseline.toFixed(2)}s</span>
          </div>

          <div className="bg-[#141724]/90 border border-white/[0.08] rounded-2xl p-3 shadow-md">
            <span className="text-[9px] text-zinc-400 uppercase font-semibold tracking-wider">Peak Cornering G</span>
            <div className="text-xl font-black font-mono text-cyan-400 mt-0.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              {lapSummary.maxLateralGRL} G
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">+{((lapSummary.maxLateralGRL - lapSummary.maxLateralGBaseline)).toFixed(2)}G over Base</span>
          </div>

          <div className="bg-[#141724]/90 border border-white/[0.08] rounded-2xl p-3 shadow-md">
            <span className="text-[9px] text-zinc-400 uppercase font-semibold tracking-wider">Avg Corner Speed</span>
            <div className="text-xl font-black font-mono text-cyan-400 mt-0.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              {lapSummary.avgCornerSpeedRL} km/h
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">+{lapSummary.avgCornerSpeedRL - lapSummary.avgCornerSpeedBaseline} km/h edge</span>
          </div>

          <div className="bg-[#141724]/90 border border-white/[0.08] rounded-2xl p-3 shadow-md">
            <span className="text-[9px] text-zinc-400 uppercase font-semibold tracking-wider">Tire Wear Rate</span>
            <div className="text-xl font-black font-mono text-emerald-400 mt-0.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              -28% Wear
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{lapSummary.tireWearRL}%/lap vs {lapSummary.tireWearBaseline}%</span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 p-3 sm:px-6 border-b border-white/[0.06] bg-[#0c0e17]">
          {[
            { id: 'all', label: 'All Components' },
            { id: 'aerodynamics', label: 'Aerodynamics' },
            { id: 'mechanical', label: 'Mechanical Setup' },
            { id: 'control_policy', label: 'RL Policy & Braking' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as 'all' | 'aerodynamics' | 'mechanical' | 'control_policy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Component Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {filteredSpecs.map((spec) => (
            <div
              key={spec.name}
              className="bg-[#141724]/80 border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 hover:border-cyan-500/30 transition-colors shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    {getCategoryIcon(spec.category)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{spec.name}</h3>
                    <span className="text-[9px] uppercase font-mono text-zinc-400 tracking-wider">
                      {spec.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                  {spec.delta}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-black/40 p-3 rounded-xl border border-white/[0.04]">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase">Baseline Standard Setup</span>
                  <span className="text-zinc-300 font-semibold">{spec.baselineVal}</span>
                </div>
                <div>
                  <span className="text-cyan-400 block text-[9px] uppercase font-bold">RL-Optimized Output</span>
                  <span className="text-cyan-300 font-bold">{spec.optimizedVal}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {spec.gainDescription}
              </p>
            </div>
          ))}

          {/* Neural Architecture Card */}
          <div className="bg-gradient-to-r from-purple-950/40 via-[#141724]/90 to-cyan-950/40 border border-purple-500/30 rounded-2xl p-4 flex flex-col gap-2 shadow-lg">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs sm:text-sm">
              <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
              <span>RL Agent Optimization Details (PPO Actor-Critic)</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Trained over 4.2 million simulated track kilometers in high-fidelity CFD aerodynamic mesh models. The agent maximizes lap time reward while penalizing tire degradation and aerodynamic floor stall during lateral weight transfer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
