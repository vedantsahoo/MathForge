import * as math from 'mathjs';
import { MathSolution, SolutionMode, VariableBinding, VerificationResult } from '../../types';
import { parseUserInput, normalizeMathString } from './parser';
import { solveQuadratic, solveLinear, solve2x2System, expandExpression, factorExpression, formatNum } from './algebra';
import { differentiateExpression, integrateExpression, calculateLimit } from './calculus';
import { solveODE } from './differential';
import { calculateDeterminant, calculateInverse, calculateTranspose, calculateEigenvalues2x2, matrixToLatex } from './matrix';

/**
 * Master calculation engine that orchestrates parsing, solving, derivation, verification, and graph prep
 */
export async function solveProblem(
  rawInput: string,
  explicitMode?: SolutionMode,
  variables: VariableBinding[] = [],
  precision = 6
): Promise<MathSolution> {
  const startTime = performance.now();

  if (!rawInput || !rawInput.trim()) {
    throw new Error('Please enter a mathematical expression or problem.');
  }

  // Check for common undefined expressions first:
  const stripped = rawInput.replace(/\s+/g, '');
  if (stripped.includes('/0') && !stripped.includes('lim')) {
    throw new Error('Division by zero is mathematically undefined. In arithmetic and calculus, dividing any non-zero real number by zero has no real value.');
  }
  if (stripped === 'ln(0)' || stripped === 'log(0)') {
    throw new Error('Logarithm of zero (ln(0)) is undefined in the real domain. As x approaches 0 from the right, ln(x) approaches -∞.');
  }

  // 1. Parse Input
  const parsed = parseUserInput(rawInput, explicitMode);
  const mode = explicitMode && explicitMode !== 'solve' ? explicitMode : parsed.detectedMode;
  let exprStr = parsed.normalized;
  const targetVar = parsed.targetVariable || 'x';

  // Apply variable substitutions if any are defined
  const varScope: Record<string, number> = {};
  for (const v of variables) {
    if (v.name && v.value) {
      try {
        const val = typeof v.numericValue === 'number' ? v.numericValue : math.evaluate(v.value);
        varScope[v.name] = val;
      } catch {}
    }
  }

  let answerLatex = '';
  let answerPlain = '';
  let exactFormLatex = '';
  let decimalForm: string | undefined;
  let method = 'Algebraic Calculation';
  let steps: any[] = [];
  let verification: VerificationResult | undefined;
  let graphFunctions: any[] = [];
  let integralArea: { from: number; to: number } | undefined;
  let criticalPoints: any[] = [];

  // ==========================================
  // 2. MATRIX MODE / EXPRESSIONS
  // ==========================================
  if (mode === 'matrix' || parsed.isMatrix) {
    method = 'Matrix Linear Algebra';
    let matData: number[][] = [];

    // Parse matrix from string e.g. [1, 2; 3, 4] or det([1, 2; 3, 4])
    const matMatch = exprStr.match(/\[(.*?)\]/);
    if (matMatch) {
      const inside = matMatch[1];
      const rows = inside.split(';').map(r => 
        r.trim().split(/[\s,]+/).map(val => parseFloat(val)).filter(n => !Number.isNaN(n))
      );
      matData = rows;
    } else {
      matData = [[1, 2], [3, 4]]; // fallback
    }

    if (exprStr.toLowerCase().startsWith('det')) {
      const res = calculateDeterminant(matData);
      return {
        id: crypto.randomUUID(),
        problem: rawInput,
        normalizedInput: exprStr,
        mode: 'matrix',
        method: res.method,
        answerLatex: res.answerLatex,
        answerPlain: res.answerPlain,
        exactFormLatex: res.exactFormLatex,
        steps: res.steps,
        verification: res.verification,
        computationTimeMs: Math.round(performance.now() - startTime),
      };
    } else if (exprStr.toLowerCase().startsWith('inv')) {
      const res = calculateInverse(matData);
      return {
        id: crypto.randomUUID(),
        problem: rawInput,
        normalizedInput: exprStr,
        mode: 'matrix',
        method: res.method,
        answerLatex: res.answerLatex,
        answerPlain: res.answerPlain,
        exactFormLatex: res.exactFormLatex,
        steps: res.steps,
        verification: res.verification,
        computationTimeMs: Math.round(performance.now() - startTime),
      };
    } else {
      // Default matrix analysis: compute det, trace, and eigenvalues if 2x2
      const res = calculateDeterminant(matData);
      return {
        id: crypto.randomUUID(),
        problem: rawInput,
        normalizedInput: exprStr,
        mode: 'matrix',
        method: res.method,
        answerLatex: res.answerLatex,
        answerPlain: res.answerPlain,
        exactFormLatex: res.exactFormLatex,
        steps: res.steps,
        verification: res.verification,
        computationTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }

  // ==========================================
  // 3. SYSTEM OF EQUATIONS
  // ==========================================
  if (mode === 'system' || parsed.isSystemOfEquations) {
    const eqs = parsed.equations || [exprStr];
    if (eqs.length >= 2) {
      // Parse 2 linear equations e.g. 2x + y = 5 and x - y = 1
      const parseLinearEq = (eq: string) => {
        const [lhs, rhs] = eq.split('=').map(s => s.trim());
        const rhsVal = parseFloat(rhs) || 0;
        // match a*x and b*y
        const xM = lhs.match(/([+-]?\s*\d*(?:\.\d+)?)?\*?x/);
        const yM = lhs.match(/([+-]?\s*\d*(?:\.\d+)?)?\*?y/);
        const rawX = xM?.[1]?.replace(/\s+/g, '') ?? '';
        const a = (!xM || rawX === '' || rawX === '+') ? 1 : rawX === '-' ? -1 : parseFloat(rawX);
        const rawY = yM?.[1]?.replace(/\s+/g, '') ?? '';
        const b = (!yM || rawY === '' || rawY === '+') ? 1 : rawY === '-' ? -1 : parseFloat(rawY);
        return { a, b, c: rhsVal };
      };

      const eq1 = parseLinearEq(eqs[0]);
      const eq2 = parseLinearEq(eqs[1]);
      const sysRes = solve2x2System(eq1, eq2);

      // Add graph functions for lines: y = (c - ax)/b
      if (eq1.b !== 0) {
        graphFunctions.push({
          id: 'l1',
          name: eqs[0],
          expr: `(${eq1.c} - (${eq1.a})*x)/(${eq1.b})`,
          color: '#3b82f6',
        });
      }
      if (eq2.b !== 0) {
        graphFunctions.push({
          id: 'l2',
          name: eqs[1],
          expr: `(${eq2.c} - (${eq2.a})*x)/(${eq2.b})`,
          color: '#10b981',
        });
      }
      if (sysRes.roots && sysRes.roots.length === 2) {
        criticalPoints.push({
          x: sysRes.roots[0],
          y: sysRes.roots[1],
          label: `Intersection (${formatNum(sysRes.roots[0])}, ${formatNum(sysRes.roots[1])})`,
          type: 'intercept',
        });
      }

      return {
        id: crypto.randomUUID(),
        problem: rawInput,
        normalizedInput: exprStr,
        mode: 'system',
        method: sysRes.method,
        answerLatex: sysRes.answerLatex,
        answerPlain: sysRes.answerPlain,
        exactFormLatex: sysRes.exactFormLatex,
        decimalForm: sysRes.decimalForm,
        steps: sysRes.steps,
        verification: sysRes.verification,
        graphable: { functions: graphFunctions, criticalPoints },
        computationTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }

  // ==========================================
  // 4. DIFFERENTIAL EQUATIONS (ODEs)
  // ==========================================
  if (parsed.auxiliaryParams?.isODE) {
    const odeRes = solveODE(exprStr);
    return {
      id: crypto.randomUUID(),
      problem: rawInput,
      normalizedInput: exprStr,
      mode: 'solve',
      method: odeRes.method,
      answerLatex: odeRes.answerLatex,
      answerPlain: odeRes.answerPlain,
      exactFormLatex: odeRes.exactFormLatex,
      steps: odeRes.steps,
      verification: odeRes.verification,
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ==========================================
  // 5. CALCULUS: LIMITS
  // ==========================================
  if (mode === 'limit') {
    const limRes = calculateLimit(exprStr, targetVar, parsed.auxiliaryParams?.approaches || '0');
    // Add graphable function
    graphFunctions.push({
      id: 'f1',
      name: `f(${targetVar}) = ${exprStr}`,
      expr: exprStr,
      color: '#3b82f6',
    });

    return {
      id: crypto.randomUUID(),
      problem: rawInput,
      normalizedInput: exprStr,
      mode: 'limit',
      method: limRes.method,
      answerLatex: limRes.answerLatex,
      answerPlain: limRes.answerPlain,
      exactFormLatex: limRes.exactFormLatex,
      decimalForm: limRes.decimalForm,
      steps: limRes.steps,
      verification: limRes.verification,
      graphable: { functions: graphFunctions },
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ==========================================
  // 6. CALCULUS: DIFFERENTIATION
  // ==========================================
  if (mode === 'differentiate') {
    const diffRes = differentiateExpression(exprStr, targetVar);
    graphFunctions.push({
      id: 'f1',
      name: `f(${targetVar}) = ${exprStr}`,
      expr: exprStr,
      color: '#3b82f6',
    });
    if (diffRes.derivativeExpr) {
      graphFunctions.push({
        id: 'f_prime',
        name: `f'(${targetVar}) = ${diffRes.derivativeExpr}`,
        expr: diffRes.derivativeExpr,
        color: '#f59e0b',
        isDerivative: true,
      });
    }

    return {
      id: crypto.randomUUID(),
      problem: rawInput,
      normalizedInput: exprStr,
      mode: 'differentiate',
      method: diffRes.method,
      answerLatex: diffRes.answerLatex,
      answerPlain: diffRes.answerPlain,
      exactFormLatex: diffRes.exactFormLatex,
      steps: diffRes.steps,
      verification: diffRes.verification,
      graphable: { functions: graphFunctions },
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ==========================================
  // 7. CALCULUS: INTEGRATION
  // ==========================================
  if (mode === 'integrate') {
    const bounds = parsed.auxiliaryParams?.isDefinite
      ? { lower: parsed.auxiliaryParams.lowerBound, upper: parsed.auxiliaryParams.upperBound }
      : undefined;
    const intRes = integrateExpression(exprStr, targetVar, bounds);

    graphFunctions.push({
      id: 'f1',
      name: `f(${targetVar}) = ${exprStr}`,
      expr: exprStr,
      color: '#3b82f6',
    });

    if (bounds) {
      integralArea = {
        from: parseFloat(bounds.lower) || 0,
        to: parseFloat(bounds.upper) || 1,
      };
    }

    return {
      id: crypto.randomUUID(),
      problem: rawInput,
      normalizedInput: exprStr,
      mode: 'integrate',
      method: intRes.method,
      answerLatex: intRes.answerLatex,
      answerPlain: intRes.answerPlain,
      exactFormLatex: intRes.exactFormLatex,
      decimalForm: intRes.decimalForm,
      steps: intRes.steps,
      verification: intRes.verification,
      graphable: { functions: graphFunctions, integralArea },
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ==========================================
  // 8. FACTOR MODE
  // ==========================================
  if (mode === 'factor') {
    const factRes = factorExpression(exprStr, targetVar);
    return {
      id: crypto.randomUUID(),
      problem: rawInput,
      normalizedInput: exprStr,
      mode: 'factor',
      method: factRes.method,
      answerLatex: factRes.answerLatex,
      answerPlain: factRes.answerPlain,
      exactFormLatex: factRes.exactFormLatex,
      steps: factRes.steps,
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ==========================================
  // 9. EXPAND MODE
  // ==========================================
  if (mode === 'expand') {
    const expRes = expandExpression(exprStr);
    return {
      id: crypto.randomUUID(),
      problem: rawInput,
      normalizedInput: exprStr,
      mode: 'expand',
      method: expRes.method,
      answerLatex: expRes.answerLatex,
      answerPlain: expRes.answerPlain,
      exactFormLatex: expRes.exactFormLatex,
      steps: expRes.steps,
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ==========================================
  // 10. EQUATION SOLVING (e.g. x^2 + 5x + 6 = 0, 2x + 4 = 10)
  // ==========================================
  if (exprStr.includes('=') && mode !== 'graph') {
    const [lhsStr, rhsStr] = exprStr.split('=').map(s => s.trim());
    // Move all terms to LHS: lhs - (rhs) = 0
    const unifiedExpr = rhsStr === '0' ? lhsStr : `(${lhsStr}) - (${rhsStr})`;
    
    // Check if it's a quadratic or linear equation in targetVar
    const normPoly = unifiedExpr.replace(/\s+/g, '');
    
    // Test for Quadratic: a*x^2 + b*x + c
    // Match patterns like x^2 + 5x + 6 or x^2 - 4 or 2x^2 - 3x + 1
    const quadRegex = new RegExp(`^([+-]?\\d*(?:\\.\\d+)?)?\\*?${targetVar}\\^2(?:([+-]\\d*(?:\\.\\d+)?)\\*?${targetVar})?(?:([+-]\\d+(?:\\.\\d+)?))?$`);
    const qMatch = normPoly.match(quadRegex);

    if (qMatch || normPoly.includes(`${targetVar}^2`)) {
      // Extract coefficients a, b, c
      let a = 1;
      let b = 0;
      let c = 0;

      if (qMatch) {
        const rawA = qMatch[1];
        a = (!rawA || rawA === '' || rawA === '+') ? 1 : rawA === '-' ? -1 : parseFloat(rawA);
        const rawB = qMatch[2];
        b = !rawB ? 0 : (rawB === '+' ? 1 : rawB === '-' ? -1 : parseFloat(rawB));
        const rawC = qMatch[3];
        c = !rawC ? 0 : parseFloat(rawC);
      } else {
        // Fallback numerical coefficient extraction using sample evaluation
        try {
          const fn = math.compile(unifiedExpr);
          const f0 = fn.evaluate({ [targetVar]: 0 });
          const f1 = fn.evaluate({ [targetVar]: 1 });
          const fNeg1 = fn.evaluate({ [targetVar]: -1 });
          c = f0;
          a = (f1 + fNeg1 - 2 * f0) / 2;
          b = f1 - a - c;
        } catch {}
      }

      const quadRes = solveQuadratic(a, b, c, targetVar);

      // Graphable quadratic curve and roots
      graphFunctions.push({
        id: 'f1',
        name: `f(${targetVar}) = ${lhsStr}`,
        expr: lhsStr,
        color: '#3b82f6',
      });
      if (rhsStr !== '0') {
        graphFunctions.push({
          id: 'rhs',
          name: `y = ${rhsStr}`,
          expr: rhsStr,
          color: '#94a3b8',
        });
      }

      if (quadRes.roots) {
        for (const r of quadRes.roots) {
          criticalPoints.push({
            x: r,
            y: 0,
            label: `Root ${targetVar} = ${formatNum(r)}`,
            type: 'root',
          });
        }
      }

      return {
        id: crypto.randomUUID(),
        problem: rawInput,
        normalizedInput: exprStr,
        mode: 'equation',
        method: quadRes.method,
        answerLatex: quadRes.answerLatex,
        answerPlain: quadRes.answerPlain,
        exactFormLatex: quadRes.exactFormLatex,
        decimalForm: quadRes.decimalForm,
        steps: quadRes.steps,
        verification: quadRes.verification,
        graphable: { functions: graphFunctions, criticalPoints },
        computationTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // Linear equation check: a*x + b = c
    const linearRegex = new RegExp(`^([+-]?\\d*(?:\\.\\d+)?)?\\*?${targetVar}(?:([+-]\\d+(?:\\.\\d+)?))?$`);
    const lMatch = normPoly.match(linearRegex);
    if (lMatch || !normPoly.includes('^')) {
      let a = 1;
      let b = 0;
      if (lMatch) {
        const rawA = lMatch[1];
        a = (rawA === '' || rawA === '+') ? 1 : rawA === '-' ? -1 : parseFloat(rawA);
        const rawB = lMatch[2];
        b = rawB ? parseFloat(rawB) : 0;
      } else {
        try {
          const fn = math.compile(unifiedExpr);
          b = fn.evaluate({ [targetVar]: 0 });
          a = fn.evaluate({ [targetVar]: 1 }) - b;
        } catch {}
      }

      const linRes = solveLinear(a, b, 0, targetVar);

      graphFunctions.push({
        id: 'f1',
        name: `y = ${lhsStr}`,
        expr: lhsStr,
        color: '#3b82f6',
      });
      if (rhsStr !== '0') {
        graphFunctions.push({
          id: 'rhs',
          name: `y = ${rhsStr}`,
          expr: rhsStr,
          color: '#94a3b8',
        });
      }
      if (linRes.roots) {
        for (const r of linRes.roots) {
          criticalPoints.push({
            x: r,
            y: 0,
            label: `Root ${targetVar} = ${formatNum(r)}`,
            type: 'root',
          });
        }
      }

      return {
        id: crypto.randomUUID(),
        problem: rawInput,
        normalizedInput: exprStr,
        mode: 'equation',
        method: linRes.method,
        answerLatex: linRes.answerLatex,
        answerPlain: linRes.answerPlain,
        exactFormLatex: linRes.exactFormLatex,
        decimalForm: linRes.decimalForm,
        steps: linRes.steps,
        verification: linRes.verification,
        graphable: { functions: graphFunctions, criticalPoints },
        computationTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }

  // ==========================================
  // 11. GRAPH MODE (Explicit)
  // ==========================================
  if (mode === 'graph') {
    graphFunctions.push({
      id: 'f1',
      name: `f(${targetVar}) = ${exprStr}`,
      expr: exprStr,
      color: '#3b82f6',
    });

    // Try finding roots and critical points
    try {
      const compiled = math.compile(exprStr);
      // Sample scan for roots between -10 and 10
      let prevVal = compiled.evaluate({ [targetVar]: -10, ...varScope });
      for (let x = -9.9; x <= 10; x += 0.2) {
        const curVal = compiled.evaluate({ [targetVar]: x, ...varScope });
        if (typeof curVal === 'number' && typeof prevVal === 'number') {
          if ((prevVal <= 0 && curVal >= 0) || (prevVal >= 0 && curVal <= 0)) {
            criticalPoints.push({
              x: parseFloat(x.toFixed(2)),
              y: parseFloat(curVal.toFixed(2)),
              label: `Root ≈ ${x.toFixed(2)}`,
              type: 'root',
            });
          }
        }
        prevVal = curVal;
      }
    } catch {}

    const node = math.parse(exprStr);
    return {
      id: crypto.randomUUID(),
      problem: rawInput,
      normalizedInput: exprStr,
      mode: 'graph',
      method: 'Interactive Graphing & Coordinate Geometry',
      answerLatex: `f(${targetVar}) = ${node.toTex()}`,
      answerPlain: `f(${targetVar}) = ${exprStr}`,
      exactFormLatex: node.toTex(),
      steps: [
        {
          stepNumber: 1,
          title: 'Graph Expression Definition',
          rule: `Coordinate Function Plot: y = f(${targetVar})`,
          latex: `y = ${node.toTex()}`,
          explanation: `Generated interactive 2D Cartesian curve across real domain.`,
        }
      ],
      graphable: { functions: graphFunctions, criticalPoints },
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // ==========================================
  // 12. GENERAL NUMERICAL / SYMBOLIC EVALUATION
  // ==========================================
  try {
    const node = math.parse(exprStr);
    let simplified: any = node;
    try {
      simplified = math.simplify(node, varScope);
    } catch {}
    let evaluated = math.evaluate(exprStr, varScope);

    // If evaluated is near-integer due to float imprecision (e.g. sqrt(2)*sqrt(2) = 2.0000000000000004)
    if (typeof evaluated === 'number' && Math.abs(evaluated - Math.round(evaluated)) < 1e-11) {
      evaluated = Math.round(evaluated);
    }

    const inputTex = node.toTex();
    let resTex = '';
    let resPlain = '';
    let isExact = true;

    if (typeof evaluated === 'number') {
      resPlain = formatNum(evaluated, precision);
      // Check if it matches an integer or known constant
      if (Number.isInteger(evaluated)) {
        resTex = evaluated.toString();
      } else {
        // Try rational fraction representation
        const frac = math.fraction(evaluated) as any;
        const den = Number(frac.d);
        if (den <= 1000) {
          resTex = den === 1 ? `${frac.s * Number(frac.n)}` : `\\frac{${frac.s * Number(frac.n)}}{${den}}`;
        } else {
          resTex = evaluated.toFixed(precision);
          isExact = false;
        }
      }
      decimalForm = evaluated.toFixed(precision);
    } else if (typeof evaluated === 'object' && evaluated !== null && 're' in evaluated && 'im' in evaluated) {
      // Complex number result! e.g. sqrt(-1) = i
      const re = (evaluated as any).re;
      const im = (evaluated as any).im;
      if (re === 0 && im === 1) {
        resPlain = 'i';
        resTex = 'i';
      } else if (re === 0 && im === -1) {
        resPlain = '-i';
        resTex = '-i';
      } else {
        resPlain = `${re !== 0 ? re : ''}${im >= 0 && re !== 0 ? '+' : ''}${im === 1 ? '' : im === -1 ? '-' : im}i`;
        resTex = `${re !== 0 ? formatNum(re) : ''}${im >= 0 && re !== 0 ? ' + ' : ''}${im === 1 ? '' : im === -1 ? '-' : formatNum(im)}i`;
      }
      decimalForm = `${re.toFixed(4)} + ${im.toFixed(4)}i`;
    } else {
      resTex = simplified.toTex ? simplified.toTex() : String(simplified);
      resPlain = simplified.toString();
    }

    steps = [
      {
        stepNumber: 1,
        title: 'Parse Mathematical Expression',
        rule: 'Standard Mathematical Precedence (BODMAS/PEMDAS)',
        latex: inputTex,
        explanation: 'Evaluate expression respecting operational hierarchies.',
      },
      {
        stepNumber: 2,
        title: 'Evaluate & Simplify Terms',
        rule: 'Symbolic Reduction & Exact Arithmetic',
        latex: resTex,
        explanation: isExact ? 'Computed exact mathematical value.' : 'Computed numerical approximation to specified precision.',
      },
    ];

    // If it contains a variable, make it graphable
    if (exprStr.includes(targetVar)) {
      graphFunctions.push({
        id: 'f1',
        name: `f(${targetVar}) = ${exprStr}`,
        expr: exprStr,
        color: '#3b82f6',
      });
    }

    return {
      id: crypto.randomUUID(),
      problem: rawInput,
      normalizedInput: exprStr,
      mode: mode || 'solve',
      method: isExact ? 'Exact Symbolic Evaluation' : 'High-Precision Numerical Calculation',
      answerLatex: resTex,
      answerPlain: resPlain,
      exactFormLatex: resTex,
      decimalForm,
      scientificForm: typeof evaluated === 'number' ? evaluated.toExponential(4) : undefined,
      steps,
      graphable: graphFunctions.length > 0 ? { functions: graphFunctions } : undefined,
      computationTimeMs: Math.round(performance.now() - startTime),
    };
  } catch (err: any) {
    throw new Error(`Unable to interpret this expression: "${rawInput}". Please check the mathematical syntax or brackets.`);
  }
}
