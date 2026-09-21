import React from 'react';
import { Sparkles, ShieldCheck, X } from 'lucide-react';

interface AIExplanationViewProps {
  explanation: string;
  verifiedAnswer: string;
  problem: string;
  onClose?: () => void;
}

export const AIExplanationView: React.FC<AIExplanationViewProps> = ({
  explanation,
  verifiedAnswer,
  problem,
  onClose,
}) => {
  return (
    <div id="ai-pedagogical-panel" className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl backdrop-blur-sm space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-indigo-200">
              AI Pedagogical Explanation
            </h3>
            <span className="text-[11px] text-indigo-400">
              Explains verified engine steps in clear intuitive language
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Separation Banner */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold text-slate-300">Ground Truth Result: </span>
            <span className="font-mono text-emerald-400 font-bold">{verifiedAnswer}</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Engine Verified
        </span>
      </div>

      {/* Explanation Body */}
      <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
        {explanation}
      </div>
    </div>
  );
};
