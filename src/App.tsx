import React, { useState, useEffect, useCallback } from 'react';
import { MathSolution, SolutionMode, VariableBinding, HistoryEntry } from './types';
import { solveProblem } from './lib/math/solver';
import { MathInput } from './components/MathInput';
import { SolutionSteps } from './components/SolutionSteps';
import { GraphView } from './components/GraphView';
import { MatrixCalculator } from './components/MatrixCalculator';
import { VariablesManager } from './components/VariablesManager';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AIExplanationView } from './components/AIExplanationView';
import { TestSuiteModal } from './components/TestSuiteModal';
import { QuickExamples } from './components/QuickExamples';
import { 
  Sigma, 
  History, 
  CheckCircle2, 
  Settings2, 
  Layers, 
  Grid, 
  Sparkles, 
  AlertTriangle,
  Play,
  Share2,
  Cpu
} from 'lucide-react';

export default function App() {
  const [problemInput, setProblemInput] = useState('x^2 + 5x + 6 = 0');
  const [currentMode, setCurrentMode] = useState<SolutionMode>('solve');
  const [precision, setPrecision] = useState(6);
  const [variables, setVariables] = useState<VariableBinding[]>([
    { name: 'a', value: '5', numericValue: 5 },
    { name: 'b', value: '10', numericValue: 10 },
  ]);
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Layout & Tabs
  const [activeRightTab, setActiveRightTab] = useState<'graph' | 'matrix' | 'variables'>('graph');
  const [mobileTab, setMobileTab] = useState<'input' | 'solution' | 'graph'>('solution');

  // Modals & Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // AI Explanation State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mathforge_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save history to localStorage
  const saveToHistory = (sol: MathSolution) => {
    const entry: HistoryEntry = {
      id: sol.id,
      timestamp: Date.now(),
      problem: sol.problem,
      mode: sol.mode,
      answerLatex: sol.answerLatex,
      answerPlain: sol.answerPlain,
      method: sol.method,
    };
    const next = [entry, ...history.filter(h => h.problem !== sol.problem)].slice(0, 30);
    setHistory(next);
    try {
      localStorage.setItem('mathforge_history', JSON.stringify(next));
    } catch {}
  };

  // Main Solver Invocation
  const handleSolve = useCallback(async (inputToSolve?: string, modeToUse?: SolutionMode) => {
    const targetInput = inputToSolve ?? problemInput;
    const targetMode = modeToUse ?? currentMode;
    if (!targetInput.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setAiExplanation(null);

    try {
      const result = await solveProblem(targetInput, targetMode, variables, precision);
      setSolution(result);
      saveToHistory(result);

      // Auto-switch to Graph tab if function is graphable
      if (result.graphable) {
        setActiveRightTab('graph');
      }
      setMobileTab('solution');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to interpret this mathematical expression.');
    } finally {
      setIsLoading(false);
    }
  }, [problemInput, currentMode, variables, precision, history]);

  // Initial solve on mount
  useEffect(() => {
    handleSolve('x^2 + 5x + 6 = 0', 'equation');
  }, []);

  // AI Explanation Handler
  const handleExplainWithAI = async () => {
    if (!solution) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: solution.problem,
          answer: solution.answerPlain,
          steps: solution.steps,
          method: solution.method,
          mode: solution.mode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.explanation) {
        setAiExplanation(data.explanation);
      } else {
        setAiExplanation(data.explanation || data.error || 'AI explanation service unavailable.');
      }
    } catch (err: any) {
      setAiExplanation('Unable to contact the AI explanation service. Your mathematical result remains fully verified by the symbolic engine.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectExample = (problem: string, mode?: SolutionMode) => {
    setProblemInput(problem);
    if (mode) setCurrentMode(mode);
    handleSolve(problem, mode);
  };

  return (
    <div id="mathforge-app" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-serif font-bold shadow-lg shadow-blue-500/20">
            ∑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                MathForge
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                Advanced Problem Solver
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Symbolic & Numerical Mathematics Engine with Step-by-Step Proofs
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Precision selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300">
            <span className="text-slate-400 text-[11px]">Precision:</span>
            <select
              value={precision}
              onChange={(e) => setPrecision(Number(e.target.value))}
              className="bg-transparent text-blue-400 font-mono focus:outline-none cursor-pointer"
            >
              <option value={4} className="bg-slate-900">4 Dec</option>
              <option value={6} className="bg-slate-900">6 Dec</option>
              <option value={8} className="bg-slate-900">8 Dec</option>
              <option value={12} className="bg-slate-900">12 Dec</option>
            </select>
          </div>

          {/* Test Suite Button */}
          <button
            id="open-test-suite-btn"
            type="button"
            onClick={() => setIsTestSuiteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">25 Test Cases</span>
          </button>

          {/* History Button */}
          <button
            id="open-history-btn"
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-800 hover:border-slate-700 transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">History</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-[10px] text-white font-bold">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 px-2 py-1 text-xs">
        <button
          type="button"
          onClick={() => setMobileTab('input')}
          className={`py-2 px-3 rounded-lg font-medium ${mobileTab === 'input' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
        >
          1. Input & Controls
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('solution')}
          className={`py-2 px-3 rounded-lg font-medium ${mobileTab === 'solution' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
        >
          2. Solution & Steps
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('graph')}
          className={`py-2 px-3 rounded-lg font-medium ${mobileTab === 'graph' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
        >
          3. Graph & Tools
        </button>
      </div>

      {/* Main Responsive Grid Layout */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1700px] w-full mx-auto space-y-4">
        {/* Quick Example Pills */}
        <QuickExamples onSelect={handleSelectExample} />

        {/* 3-Column Desktop Layout / Stacked Mobile Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ==================================================== */}
          {/* LEFT COLUMN: Input & Keypad (Desktop: 4 cols)        */}
          {/* ==================================================== */}
          <div className={`lg:col-span-4 space-y-4 ${mobileTab !== 'input' ? 'hidden lg:block' : 'block'}`}>
            <MathInput
              value={problemInput}
              onChange={setProblemInput}
              onSubmit={() => handleSolve()}
              currentMode={currentMode}
              onModeChange={(m) => {
                setCurrentMode(m);
                handleSolve(problemInput, m);
              }}
              isLoading={isLoading}
            />

            {/* Variables and Parameters Component */}
            <VariablesManager
              variables={variables}
              onChange={setVariables}
            />

            {/* Mathematical Capabilities Reference */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Engine Support</span>
              </div>
              <p className="leading-relaxed">
                Analytical power rule, product/quotient/chain rules, integration by parts, L&apos;Hôpital&apos;s limits, ODE integrating factors, and Laplace matrix expansion.
              </p>
            </div>
          </div>

          {/* ==================================================== */}
          {/* CENTER COLUMN: Solution & Steps (Desktop: 4 cols)    */}
          {/* ==================================================== */}
          <div className={`lg:col-span-4 space-y-4 ${mobileTab !== 'solution' ? 'hidden lg:block' : 'block'}`}>
            {/* Error Message banner */}
            {errorMessage && (
              <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-rose-200 text-xs space-y-1 shadow-lg">
                <div className="flex items-center gap-2 font-semibold text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Mathematical Exception</span>
                </div>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Active Solution Display */}
            {solution && (
              <>
                <SolutionSteps
                  solution={solution}
                  onExplainWithAI={handleExplainWithAI}
                  isAiLoading={isAiLoading}
                />

                {/* AI Explanation Section (if generated) */}
                {aiExplanation && (
                  <AIExplanationView
                    explanation={aiExplanation}
                    verifiedAnswer={solution.answerPlain}
                    problem={solution.problem}
                    onClose={() => setAiExplanation(null)}
                  />
                )}
              </>
            )}

            {!solution && !errorMessage && (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800/60 rounded-2xl text-slate-500 text-xs">
                Enter an equation or select an example above to compute the solution with verified step-by-step reasoning.
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: Graph / Matrix Studio (Desktop: 4 cols)*/}
          {/* ==================================================== */}
          <div className={`lg:col-span-4 space-y-4 ${mobileTab !== 'graph' ? 'hidden lg:block' : 'block'}`}>
            {/* Right Pane Navigation Header */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveRightTab('graph')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeRightTab === 'graph'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2D Graph
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('matrix')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeRightTab === 'matrix'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Matrix Studio
              </button>
            </div>

            {/* Tab 1: Interactive Coordinate Graph */}
            {activeRightTab === 'graph' && (
              <GraphView
                functions={solution?.graphable?.functions || [
                  { id: 'default-f', name: 'f(x) = x^2', expr: 'x^2', color: '#3b82f6' },
                ]}
                integralArea={solution?.graphable?.integralArea}
                criticalPoints={solution?.graphable?.criticalPoints}
              />
            )}

            {/* Tab 2: Visual Matrix Studio */}
            {activeRightTab === 'matrix' && (
              <MatrixCalculator
                onApplyMatrixToSolver={(expr) => {
                  setProblemInput(expr);
                  setCurrentMode('matrix');
                  handleSolve(expr, 'matrix');
                }}
              />
            )}
          </div>

        </div>
      </main>

      {/* History Drawer Modal */}
      <HistoryDrawer
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={(entry) => {
          setProblemInput(entry.problem);
          setCurrentMode(entry.mode);
          handleSolve(entry.problem, entry.mode);
        }}
        onDelete={(id) => {
          const next = history.filter(h => h.id !== id);
          setHistory(next);
          localStorage.setItem('mathforge_history', JSON.stringify(next));
        }}
        onClear={() => {
          setHistory([]);
          localStorage.removeItem('mathforge_history');
        }}
      />

      {/* 25-Case Automated Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
        onSelectProblem={(prob) => {
          setProblemInput(prob);
          handleSolve(prob);
        }}
      />
    </div>
  );
}
