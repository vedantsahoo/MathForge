export type SolutionMode =
  | 'solve'
  | 'simplify'
  | 'factor'
  | 'expand'
  | 'differentiate'
  | 'integrate'
  | 'limit'
  | 'equation'
  | 'system'
  | 'matrix'
  | 'graph'
  | 'numerical';

export interface DerivationStep {
  stepNumber: number;
  title: string;
  rule?: string; // e.g. "Power Rule: d/dx[xⁿ] = n xⁿ⁻¹"
  latex: string;
  explanation: string;
  substeps?: string[];
}

export interface VerificationResult {
  isValid: boolean;
  message: string;
  residual?: number;
  substitutions?: { variable: string; value: string; equationLhs: string; equationRhs: string }[];
}

export interface MathSolution {
  id: string;
  problem: string;
  normalizedInput: string;
  mode: SolutionMode;
  method: string;
  answerLatex: string;
  answerPlain: string;
  exactFormLatex?: string;
  decimalForm?: string;
  scientificForm?: string;
  steps: DerivationStep[];
  verification?: VerificationResult;
  graphable?: {
    functions: { id: string; name: string; expr: string; color: string; isDerivative?: boolean }[];
    domain?: [number, number];
    range?: [number, number];
    integralArea?: { from: number; to: number };
    criticalPoints?: { x: number; y: number; label: string; type: 'root' | 'min' | 'max' | 'intercept' }[];
  };
  domainWarnings?: string[];
  computationTimeMs: number;
  aiExplanation?: string;
}

export interface VariableBinding {
  name: string;
  value: string;
  numericValue?: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  problem: string;
  mode: SolutionMode;
  answerLatex: string;
  answerPlain: string;
  method: string;
}

export interface TestCase {
  category: string;
  problem: string;
  mode: SolutionMode;
  expectedKeywords: string[];
  description: string;
}

export interface TestCaseResult {
  testCase: TestCase;
  passed: boolean;
  actualAnswer: string;
  error?: string;
  timeMs: number;
}
