import React, { useState } from 'react';
import { MathSolution } from '../types';
import { MathRenderer } from './MathRenderer';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Layers, 
  Clock, 
  Sparkles, 
  Share2, 
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface SolutionStepsProps {
  solution: MathSolution;
  onExplainWithAI?: () => void;
  isAiLoading?: boolean;
}

export const SolutionSteps: React.FC<SolutionStepsProps> = ({
  solution,
  onExplainWithAI,
  isAiLoading = false,
}) => {
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [showDecimal, setShowDecimal] = useState(false);

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(solution.answerPlain);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(solution.answerLatex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  return (
    <div id="solution-panel" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-sm space-y-6">
      {/* Header bar with Method badge & Meta info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Derivation & Verified Result
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-blue-400">{solution.method}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {solution.computationTimeMs}ms
              </span>
            </div>
          </div>
        </div>

        {/* AI Explain trigger */}
        {onExplainWithAI && (
          <button
            id="ai-explain-btn"
            type="button"
            onClick={onExplainWithAI}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>{isAiLoading ? 'Explaining...' : 'Explain with AI'}</span>
          </button>
        )}
      </div>

      {/* Main Highlighted Answer Card */}
      <div id="final-answer-card" className="relative p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/30 border border-blue-500/30 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Final Mathematical Result</span>
          </div>

          <div className="flex items-center gap-1.5">
            {solution.decimalForm && (
              <button
                type="button"
                onClick={() => setShowDecimal(!showDecimal)}
                className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition"
              >
                {showDecimal ? 'Show Exact' : 'Show Decimal'}
              </button>
            )}
            <button
              id="copy-answer-btn"
              type="button"
              onClick={handleCopyAnswer}
              title="Copy answer text"
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
            >
              {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              id="copy-latex-btn"
              type="button"
              onClick={handleCopyLatex}
              title="Copy LaTeX formula"
              className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 border border-slate-800 transition"
            >
              {copiedLatex ? 'LaTeX ✓' : 'LaTeX'}
            </button>
          </div>
        </div>

        {/* KaTeX Display for Answer */}
        <div className="text-xl sm:text-2xl font-semibold text-slate-100 py-1 overflow-x-auto">
          {showDecimal && solution.decimalForm ? (
            <span className="font-mono text-emerald-400">{solution.decimalForm}</span>
          ) : (
            <MathRenderer latex={solution.answerLatex} displayMode={true} />
          )}
        </div>

        {/* Dual exact & decimal display footer */}
        <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div>
            <span className="text-slate-500">Exact Form: </span>
            <span className="text-slate-300 font-semibold">{solution.answerPlain}</span>
          </div>
          {solution.decimalForm && !showDecimal && (
            <div>
              <span className="text-slate-500">Decimal: </span>
              <span className="text-slate-300">{solution.decimalForm}</span>
            </div>
          )}
          {solution.scientificForm && (
            <div>
              <span className="text-slate-500">Scientific: </span>
              <span className="text-slate-300">{solution.scientificForm}</span>
            </div>
          )}
        </div>
      </div>

      {/* Verification Card (if available) */}
      {solution.verification && (
        <div id="solution-verification" className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-emerald-300">Solution Verification</span>
            <p className="text-slate-300 leading-relaxed">
              {solution.verification.message}
            </p>
          </div>
        </div>
      )}

      {/* Step-by-Step Derivation Breakdown */}
      <div id="derivation-steps-list" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Step-by-Step Mathematical Derivation ({solution.steps.length} Steps)
          </h3>
        </div>

        <div className="relative border-l-2 border-blue-500/30 ml-3.5 pl-5 space-y-5">
          {solution.steps.map((step) => (
            <div
              key={step.stepNumber}
              id={`step-${step.stepNumber}`}
              className="relative group bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all"
            >
              {/* Step indicator node on timeline */}
              <div className="absolute -left-[29px] top-4 w-4 h-4 rounded-full bg-slate-950 border-2 border-blue-500 flex items-center justify-center text-[9px] font-bold text-blue-400">
                {step.stepNumber}
              </div>

              {/* Step Title & Rule badge */}
              <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                <span className="text-xs font-semibold text-slate-200">
                  {step.title}
                </span>
                {step.rule && (
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-300 rounded border border-blue-500/20">
                    {step.rule}
                  </span>
                )}
              </div>

              {/* Rendered Math Formula for this step */}
              <div className="my-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-100 overflow-x-auto text-center font-serif">
                <MathRenderer latex={step.latex} displayMode={true} />
              </div>

              {/* Explanatory text for the mathematical transformation */}
              <p className="text-xs text-slate-400 leading-relaxed">
                {step.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
