import React, { useState, useRef } from 'react';
import { SolutionMode } from '../types';
import { 
  Calculator, 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  HelpCircle,
  Hash,
  Sigma,
  FunctionSquare,
  Grid
} from 'lucide-react';

interface MathInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  currentMode: SolutionMode;
  onModeChange: (mode: SolutionMode) => void;
  isLoading?: boolean;
}

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  onSubmit,
  currentMode,
  onModeChange,
  isLoading = false,
}) => {
  const [showKeypad, setShowKeypad] = useState(true);
  const [activeKeypadTab, setActiveKeypadTab] = useState<'calculus' | 'algebra' | 'symbols' | 'matrices'>('calculus');
  const inputRef = useRef<HTMLInputElement>(null);

  const insertSymbol = (symbol: string) => {
    if (!inputRef.current) {
      onChange(value + symbol);
      return;
    }
    const start = inputRef.current.selectionStart || value.length;
    const end = inputRef.current.selectionEnd || value.length;
    const nextVal = value.substring(0, start) + symbol + value.substring(end);
    onChange(nextVal);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(start + symbol.length, start + symbol.length);
      }
    }, 10);
  };

  const modes: { id: SolutionMode; label: string }[] = [
    { id: 'solve', label: 'Auto Solve' },
    { id: 'equation', label: 'Equation' },
    { id: 'differentiate', label: 'd/dx' },
    { id: 'integrate', label: '∫ Integrate' },
    { id: 'limit', label: 'lim' },
    { id: 'system', label: 'System' },
    { id: 'factor', label: 'Factor' },
    { id: 'expand', label: 'Expand' },
    { id: 'simplify', label: 'Simplify' },
    { id: 'matrix', label: 'Matrix' },
    { id: 'graph', label: 'Graph' },
  ];

  const symbolsMap = {
    calculus: [
      { label: 'd/dx', insert: 'd/dx ' },
      { label: '∫ dx', insert: 'integrate ' },
      { label: '∫₀¹ dx', insert: '∫₀¹ ' },
      { label: 'lim x→0', insert: 'lim x->0 ' },
      { label: "y'", insert: "y'" },
      { label: "y''", insert: "y''" },
      { label: 'dy/dx', insert: 'dy/dx = ' },
      { label: '∂/∂x', insert: 'd/dx ' },
    ],
    algebra: [
      { label: 'x²', insert: 'x^2' },
      { label: 'xⁿ', insert: '^' },
      { label: '√x', insert: 'sqrt(' },
      { label: '∛x', insert: 'cbrt(' },
      { label: '1/x', insert: '1/' },
      { label: '( )', insert: '()' },
      { label: 'f(x)', insert: 'f(x) = ' },
      { label: '±', insert: '±' },
    ],
    symbols: [
      { label: 'π', insert: 'pi' },
      { label: 'e', insert: 'e' },
      { label: '∞', insert: 'Infinity' },
      { label: 'θ', insert: 'theta' },
      { label: '≤', insert: '<=' },
      { label: '≥', insert: '>=' },
      { label: '≠', insert: '!=' },
      { label: '≈', insert: '~' },
    ],
    matrices: [
      { label: '[1 2; 3 4]', insert: '[1, 2; 3, 4]' },
      { label: 'det(A)', insert: 'det([1, 2; 3, 4])' },
      { label: 'inv(A)', insert: 'inv([1, 2; 3, 4])' },
      { label: '3x3 Ident', insert: '[1, 0, 0; 0, 1, 0; 0, 0, 1]' },
    ],
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div id="math-input-container" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
      {/* Mode Selector Ribbon */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {modes.map((m) => (
          <button
            key={m.id}
            id={`mode-btn-${m.id}`}
            type="button"
            onClick={() => onModeChange(m.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              currentMode === m.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main Large Mathematical Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-4 text-blue-400 select-none font-serif text-xl italic font-semibold">
          f(x)
        </div>
        <input
          id="main-math-input"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. x^2 + 5x + 6 = 0, d/dx(x^3 + 2x), ∫ x sin(x) dx, lim x->0 (sin(x)/x)"
          className="w-full pl-16 pr-28 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
        />
        
        {/* Actions inside input bar */}
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              id="clear-input-btn"
              type="button"
              onClick={() => onChange('')}
              title="Clear input"
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            id="calculate-submit-btn"
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !value.trim()}
            className="flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            {isLoading ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : (
              <>
                <span>Solve</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Math Keypad Toggle & Insert Buttons */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Quick Math Keypad
            </span>
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveKeypadTab('calculus')}
                className={`px-2 py-0.5 text-[11px] rounded ${activeKeypadTab === 'calculus' ? 'bg-slate-800 text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Calculus
              </button>
              <button
                type="button"
                onClick={() => setActiveKeypadTab('algebra')}
                className={`px-2 py-0.5 text-[11px] rounded ${activeKeypadTab === 'algebra' ? 'bg-slate-800 text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Algebra
              </button>
              <button
                type="button"
                onClick={() => setActiveKeypadTab('symbols')}
                className={`px-2 py-0.5 text-[11px] rounded ${activeKeypadTab === 'symbols' ? 'bg-slate-800 text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Symbols
              </button>
              <button
                type="button"
                onClick={() => setActiveKeypadTab('matrices')}
                className={`px-2 py-0.5 text-[11px] rounded ${activeKeypadTab === 'matrices' ? 'bg-slate-800 text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Matrix
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowKeypad(!showKeypad)}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            {showKeypad ? 'Hide Keypad' : 'Show Keypad'}
          </button>
        </div>

        {showKeypad && (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {symbolsMap[activeKeypadTab].map((sym, idx) => (
              <button
                key={idx}
                type="button"
                id={`keypad-btn-${activeKeypadTab}-${idx}`}
                onClick={() => insertSymbol(sym.insert)}
                className="py-1.5 px-2 bg-slate-950/70 hover:bg-slate-800 hover:text-blue-400 text-slate-200 text-xs font-mono rounded-lg border border-slate-800 hover:border-blue-500/30 transition text-center shadow-sm"
              >
                {sym.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
