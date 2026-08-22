import React, { useState } from 'react';
import { RL_OPTIMIZATIONS } from '../physics/carSimulation';
import { LapSummary } from '../types';
import { Cpu, Wind, Wrench, Sparkles, Zap, TrendingUp, Sliders, CheckCircle2 } from 'lucide-react';

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
        return <Wind className="w-4 h-4 text-sky-600" />;
      case 'mechanical':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'control_policy':
        return <Cpu className="w-4 h-4 text-indigo-600" />;
      default:
        return <Sliders className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                RL Engineering & Aero Upgrades
              </h2>
              <p className="text-xs text-slate-700 font-medium">
                Component-by-component comparison: RL-Optimized Car (#77) vs Baseline Car (#01)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center font-bold text-xs border border-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Lap Gains Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:px-6 bg-slate-50/60 border-b border-slate-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-700 uppercase font-bold tracking-wider">Lap Time Advantage</span>
            <div className="text-xl font-black font-mono text-emerald-600 mt-0.5">
              {lapSummary.deltaLapTime}s
            </div>
            <span className="text-[11px] text-slate-700 font-mono">{lapSummary.lapTimeRL.toFixed(2)}s vs {lapSummary.lapTimeBaseline.toFixed(2)}s</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-700 uppercase font-bold tracking-wider">Cornering G-Force</span>
            <div className="text-xl font-black font-mono text-sky-800 mt-0.5">
              {lapSummary.maxLateralGRL} G
            </div>
            <span className="text-[11px] text-slate-700 font-mono">+{((lapSummary.maxLateralGRL - lapSummary.maxLateralGBaseline)).toFixed(2)}G over Base</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-700 uppercase font-bold tracking-wider">Avg Apex Speed</span>
            <div className="text-xl font-black font-mono text-sky-800 mt-0.5">
              {lapSummary.avgCornerSpeedRL} km/h
            </div>
            <span className="text-[11px] text-slate-700 font-mono">+{lapSummary.avgCornerSpeedRL - lapSummary.avgCornerSpeedBaseline} km/h faster</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
            <span className="text-[10px] text-slate-700 uppercase font-bold tracking-wider">Tire Preservation</span>
            <div className="text-xl font-black font-mono text-emerald-600 mt-0.5">
              -28% Wear
            </div>
            <span className="text-[11px] text-slate-700 font-mono">{lapSummary.tireWearRL}%/lap vs {lapSummary.tireWearBaseline}%</span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-3 sm:px-6 border-b border-slate-200 bg-white">
          {[
            { id: 'all', label: 'All Upgrades' },
            { id: 'aerodynamics', label: 'Aerodynamics' },
            { id: 'mechanical', label: 'Mechanical Setup' },
            { id: 'control_policy', label: 'RL Driving & Braking Policy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as 'all' | 'aerodynamics' | 'mechanical' | 'control_policy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Component Cards Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-white">
          {filteredSpecs.map((spec) => (
            <div
              key={spec.name}
              className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-sky-300 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                    {getCategoryIcon(spec.category)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{spec.name}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-700 tracking-wider">
                      {spec.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
                  {spec.delta}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-700 block text-[9px] uppercase font-bold">Standard Baseline Setup</span>
                  <span className="text-slate-800 font-semibold">{spec.baselineVal}</span>
                </div>
                <div>
                  <span className="text-sky-800 block text-[9px] uppercase font-bold">RL-Optimized Output</span>
                  <span className="text-sky-800 font-bold">{spec.optimizedVal}</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                {spec.gainDescription}
              </p>
            </div>
          ))}

          {/* RL Intelligence Card */}
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-xs sm:text-sm">
              <Zap className="w-4 h-4 text-sky-600 fill-sky-600" />
              <span>How Reinforcement Learning Optimized the Race Car</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              Trained over 4.2 million simulated track kilometers in high-fidelity aerodynamic simulation models using PPO policy gradients. The neural network learns the optimal compromise between downforce suction, tire temperature preservation, and straightaway top speed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
