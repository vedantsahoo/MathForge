import React from 'react';
import { SolutionMode } from '../types';

interface QuickExamplesProps {
  onSelect: (problem: string, mode?: SolutionMode) => void;
}

export const QuickExamples: React.FC<QuickExamplesProps> = ({ onSelect }) => {
  const examples = [
    { label: 'Quadratic: x² + 5x + 6 = 0', problem: 'x^2 + 5x + 6 = 0', mode: 'equation' as SolutionMode },
    { label: 'Derivative: d/dx(x³ + 2x)', problem: 'd/dx (x^3 + 2x)', mode: 'differentiate' as SolutionMode },
    { label: 'Definite Integral: ∫₀¹ x² dx', problem: '∫₀¹ x² dx', mode: 'integrate' as SolutionMode },
    { label: 'Parts: ∫ x sin(x) dx', problem: 'integrate x * sin(x)', mode: 'integrate' as SolutionMode },
    { label: 'Limit: lim x→0 (sin(x)/x)', problem: 'lim x->0 (sin(x)/x)', mode: 'limit' as SolutionMode },
    { label: 'System: 2x+y=5, x-y=1', problem: '2x + y = 5, x - y = 1', mode: 'system' as SolutionMode },
    { label: 'ODE: dy/dx = x + y', problem: 'dy/dx = x + y', mode: 'solve' as SolutionMode },
    { label: 'Matrix: det([1 2; 3 4])', problem: 'det([1, 2; 3, 4])', mode: 'matrix' as SolutionMode },
    { label: 'Factor: x² - 9', problem: 'factor x^2 - 9', mode: 'factor' as SolutionMode },
    { label: 'Expand: (x + 2)(x + 3)', problem: 'expand (x + 2)*(x + 3)', mode: 'expand' as SolutionMode },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
        Try:
      </span>
      {examples.map((ex, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(ex.problem, ex.mode)}
          className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-blue-400 border border-slate-800 hover:border-blue-500/30 text-xs font-mono whitespace-nowrap transition"
        >
          {ex.label}
        </button>
      ))}
    </div>
  );
};
