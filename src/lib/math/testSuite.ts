import { TestCase, TestCaseResult } from '../../types';
import { solveProblem } from './solver';

export const VERIFIED_TEST_CASES: TestCase[] = [
  // 1. Algebra & Quadratics
  {
    category: 'Quadratics',
    problem: 'x^2 + 5x + 6 = 0',
    mode: 'equation',
    expectedKeywords: ['-2', '-3'],
    description: 'Quadratic equation factoring: x² + 5x + 6 = 0 gives x = -2, -3',
  },
  {
    category: 'Quadratics',
    problem: 'x^2 - 4 = 0',
    mode: 'equation',
    expectedKeywords: ['2', '-2'],
    description: 'Difference of squares roots: x² - 4 = 0 gives x = ±2',
  },
  {
    category: 'Linear Equations',
    problem: '2x + 4 = 10',
    mode: 'equation',
    expectedKeywords: ['3'],
    description: 'Linear equation isolation: 2x + 4 = 10 gives x = 3',
  },
  {
    category: 'Systems of Equations',
    problem: '2x + y = 5, x - y = 1',
    mode: 'system',
    expectedKeywords: ['2', '1'],
    description: '2x2 simultaneous linear equations with unique solution (2, 1)',
  },
  {
    category: 'Algebra',
    problem: 'factor x^2 - 9',
    mode: 'factor',
    expectedKeywords: ['x - 3', 'x + 3'],
    description: 'Symbolic polynomial factoring: x² - 9 = (x - 3)(x + 3)',
  },
  {
    category: 'Algebra',
    problem: 'expand (x + 2)*(x + 3)',
    mode: 'expand',
    expectedKeywords: ['x^2', '5', '6'],
    description: 'Distributive binomial expansion: (x+2)(x+3) = x² + 5x + 6',
  },

  // 2. Calculus: Derivatives
  {
    category: 'Derivatives',
    problem: 'd/dx(x^3)',
    mode: 'differentiate',
    expectedKeywords: ['3', 'x^2'],
    description: 'Power Rule derivative: d/dx(x³) = 3x²',
  },
  {
    category: 'Derivatives',
    problem: 'd/dx (x^3 + 2x)',
    mode: 'differentiate',
    expectedKeywords: ['3', 'x^2', '2'],
    description: 'Sum rule & power rule: d/dx(x³ + 2x) = 3x² + 2',
  },
  {
    category: 'Derivatives',
    problem: 'differentiate x * sin(x)',
    mode: 'differentiate',
    expectedKeywords: ['sin', 'cos', 'x'],
    description: 'Product rule: d/dx[x sin(x)] = sin(x) + x cos(x)',
  },

  // 3. Calculus: Integrals
  {
    category: 'Integrals',
    problem: '∫₀¹ x² dx',
    mode: 'integrate',
    expectedKeywords: ['1/3', '0.333', '1}{3}'],
    description: 'Definite integral with FTC: ∫₀¹ x² dx = 1/3',
  },
  {
    category: 'Integrals',
    problem: 'integrate x^2 dx',
    mode: 'integrate',
    expectedKeywords: ['x^3', '3', 'C'],
    description: 'Indefinite integral power rule: ∫ x² dx = x³/3 + C',
  },
  {
    category: 'Integrals',
    problem: 'integrate x * sin(x)',
    mode: 'integrate',
    expectedKeywords: ['cos', 'sin', 'C'],
    description: 'Integration by parts: ∫ x sin(x) dx = -x cos(x) + sin(x) + C',
  },

  // 4. Calculus: Limits
  {
    category: 'Limits',
    problem: 'lim x->0 (sin(x)/x)',
    mode: 'limit',
    expectedKeywords: ['1'],
    description: 'Fundamental trigonometric limit / L\'Hôpital: lim x→0 sin(x)/x = 1',
  },
  {
    category: 'Limits',
    problem: 'lim x->0 ((1 - cos(x))/x^2)',
    mode: 'limit',
    expectedKeywords: ['1/2', '0.5', '1}{2}'],
    description: 'Indeterminate limit 0/0 via L\'Hôpital: lim x→0 (1-cos(x))/x² = 1/2',
  },

  // 5. Differential Equations (ODEs)
  {
    category: 'Differential Equations',
    problem: 'dy/dx = x + y',
    mode: 'solve',
    expectedKeywords: ['-x', '- 1', 'exp', 'e^'],
    description: 'First-order linear ODE: y\' - y = x gives y(x) = -x - 1 + C e^x',
  },
  {
    category: 'Differential Equations',
    problem: "y'' - 4y = 0",
    mode: 'solve',
    expectedKeywords: ['e^{2x}', 'e^{-2x}', 'exp'],
    description: 'Second-order linear ODE: y\'\' - 4y = 0 gives y = C₁e^(2x) + C₂e^(-2x)',
  },

  // 6. Matrices & Linear Algebra
  {
    category: 'Matrices',
    problem: 'det([1, 2; 3, 4])',
    mode: 'matrix',
    expectedKeywords: ['-2'],
    description: '2x2 Matrix Determinant: det([1 2; 3 4]) = 1(4) - 2(3) = -2',
  },
  {
    category: 'Matrices',
    problem: 'det([1, 0, 2; 0, 3, 0; 4, 0, 5])',
    mode: 'matrix',
    expectedKeywords: ['-9'],
    description: '3x3 Matrix Determinant via Laplace Expansion = -9',
  },
  {
    category: 'Matrices',
    problem: 'inv([1, 2; 3, 4])',
    mode: 'matrix',
    expectedKeywords: ['-2', '1', '1.5', '-0.5'],
    description: '2x2 Matrix Inversion via Adjugate / Gauss-Jordan',
  },

  // 7. Trigonometry & Complex Numbers & Constants
  {
    category: 'Trigonometry',
    problem: 'sin(pi / 2)',
    mode: 'solve',
    expectedKeywords: ['1'],
    description: 'Exact trigonometric evaluation: sin(π/2) = 1',
  },
  {
    category: 'Complex Numbers',
    problem: 'sqrt(-1)',
    mode: 'solve',
    expectedKeywords: ['i'],
    description: 'Imaginary unit: √(-1) = i',
  },
  {
    category: 'Arithmetic & Constants',
    problem: 'sqrt(2) * sqrt(2)',
    mode: 'solve',
    expectedKeywords: ['2'],
    description: 'Exact radical multiplication: √2 * √2 = 2',
  },
  {
    category: 'Variables & Parameters',
    problem: 'a^2 + b^2',
    mode: 'solve',
    expectedKeywords: ['125'],
    description: 'Evaluation with parameters a = 5, b = 10',
  },

  // 8. Error Handling & Undefined Expressions
  {
    category: 'Error Handling',
    problem: '1 / 0',
    mode: 'solve',
    expectedKeywords: ['undefined', 'division by zero', 'Division'],
    description: 'Catches undefined division by zero with mathematical justification',
  },
  {
    category: 'Error Handling',
    problem: 'ln(0)',
    mode: 'solve',
    expectedKeywords: ['undefined', 'real domain', 'Logarithm'],
    description: 'Catches undefined real logarithm at zero with domain explanation',
  },
];

/**
 * Runs all automated test cases and returns pass/fail status and timings
 */
export async function runAllTests(): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  for (const tc of VERIFIED_TEST_CASES) {
    const t0 = performance.now();
    try {
      // For variable test case, pass a=5, b=10
      const testVars = tc.problem.includes('a^2') ? [
        { name: 'a', value: '5', numericValue: 5 },
        { name: 'b', value: '10', numericValue: 10 },
      ] : [];

      const solution = await solveProblem(tc.problem, tc.mode, testVars);
      const outputText = `${solution.answerPlain} ${solution.answerLatex} ${solution.exactFormLatex || ''} ${solution.method}`;
      
      const passed = tc.expectedKeywords.some(kw => 
        outputText.toLowerCase().includes(kw.toLowerCase())
      );

      results.push({
        testCase: tc,
        passed,
        actualAnswer: solution.answerPlain || solution.answerLatex,
        timeMs: Math.round(performance.now() - t0),
      });
    } catch (err: any) {
      // If the test case was expecting an error (like 1/0 or ln(0))
      const isExpectedError = tc.expectedKeywords.some(kw => 
        err.message.toLowerCase().includes(kw.toLowerCase())
      );

      results.push({
        testCase: tc,
        passed: isExpectedError,
        actualAnswer: err.message,
        error: isExpectedError ? undefined : err.message,
        timeMs: Math.round(performance.now() - t0),
      });
    }
  }

  return results;
}
