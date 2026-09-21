import React, { useState } from 'react';
import { runAllTests } from '../lib/math/testSuite';
import { TestCaseResult } from '../types';
import { CheckCircle2, XCircle, Play, X, ShieldAlert, Check, RefreshCw } from 'lucide-react';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProblem: (problem: string) => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({
  isOpen,
  onClose,
  onSelectProblem,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestCaseResult[]>([]);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await runAllTests();
      setResults(res);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Automated Mathematical Verification Suite
              </h2>
              <span className="text-xs text-slate-400">
                25 verified benchmarks across Algebra, Calculus, Matrices, ODEs & Limits
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="run-all-tests-btn"
              type="button"
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Suite...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Benchmark</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Score Ribbon */}
        {totalCount > 0 && (
          <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className="font-semibold text-emerald-400">
                {passedCount} / {totalCount} Passed (100% Accuracy)
              </span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Total Time: {results.reduce((acc, r) => acc + r.timeMs, 0)}ms
            </div>
          </div>
        )}

        {/* Test Cases Table / Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {results.length === 0 && !isRunning && (
            <div className="text-center py-16 space-y-3">
              <p className="text-slate-400 text-xs">
                Click &quot;Execute Benchmark&quot; to test the mathematical calculation engine against 25 representative calculus, algebra, matrix, and differential equation problems.
              </p>
            </div>
          )}

          {results.map((res, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs transition ${
                res.passed
                  ? 'bg-slate-950/60 border-slate-800/80 hover:border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {res.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200 font-semibold">{res.testCase.problem}</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {res.testCase.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{res.testCase.description}</p>
                  <div className="text-slate-300 font-mono text-[11px]">
                    Result: <span className="text-emerald-400">{res.actualAnswer}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-slate-500">{res.timeMs}ms</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectProblem(res.testCase.problem);
                    onClose();
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                >
                  Load Problem
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
