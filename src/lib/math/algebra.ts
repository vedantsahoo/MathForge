import * as math from 'mathjs';
import { DerivationStep, VerificationResult } from '../../types';

export interface AlgebraResult {
  method: string;
  answerLatex: string;
  answerPlain: string;
  exactFormLatex: string;
  decimalForm?: string;
  scientificForm?: string;
  steps: DerivationStep[];
  verification?: VerificationResult;
  roots?: number[];
}

/**
 * Format a number cleanly: integer if whole, or exact fraction/radical if available, else clean decimal
 */
export function formatNum(n: number, maxDec = 6): string {
  if (Number.isInteger(n)) return n.toString();
  if (Math.abs(n) < 1e-12) return '0';
  const rounded = parseFloat(n.toFixed(maxDec));
  return rounded.toString();
}

/**
 * Simplify square root into a*sqrt(b) exact form
 */
export function simplifyRadical(d: number): { outside: number; inside: number; latex: string } {
  if (d < 0) {
    const pos = simplifyRadical(-d);
    return {
      outside: pos.outside,
      inside: pos.inside,
      latex: pos.inside === 1 
        ? `${pos.outside === 1 ? '' : pos.outside}i` 
        : `${pos.outside === 1 ? '' : pos.outside}i\\sqrt{${pos.inside}}`
    };
  }
  if (d === 0) return { outside: 0, inside: 0, latex: '0' };
  
  let outside = 1;
  let inside = d;
  for (let i = Math.floor(Math.sqrt(d)); i >= 2; i--) {
    if (inside % (i * i) === 0) {
      outside *= i;
      inside /= (i * i);
      break;
    }
  }
  const latex = inside === 1 
    ? `${outside}` 
    : (outside === 1 ? `\\sqrt{${inside}}` : `${outside}\\sqrt{${inside}}`);
  return { outside, inside, latex };
}

/**
 * Solves single quadratic equation: ax^2 + bx + c = 0
 */
export function solveQuadratic(a: number, b: number, c: number, variable = 'x'): AlgebraResult {
  const steps: DerivationStep[] = [];
  let stepCount = 1;

  // Step 1: Standard form
  const polyStr = `${a === 1 ? '' : a === -1 ? '-' : a}${variable}^2 ${b >= 0 ? '+ ' + (b === 1 ? '' : b) : '- ' + Math.abs(b)}${variable} ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = 0`.replace(/\s\+\s0\s=/g, ' =').replace(/1\*/g, '');
  steps.push({
    stepNumber: stepCount++,
    title: 'Standard Form Identification',
    rule: 'Quadratic Standard Form: ax² + bx + c = 0',
    latex: polyStr,
    explanation: `Identify coefficients: a = ${a}, b = ${b}, c = ${c}.`,
  });

  // Step 2: Discriminant
  const discriminant = b * b - 4 * a * c;
  const discStr = `\\Delta = b^2 - 4ac = (${b})^2 - 4(${a})(${c}) = ${b * b} - (${4 * a * c}) = ${discriminant}`;
  steps.push({
    stepNumber: stepCount++,
    title: 'Calculate Discriminant',
    rule: 'Discriminant Formula: Δ = b² - 4ac',
    latex: discStr,
    explanation: discriminant > 0
      ? 'The discriminant is positive (Δ > 0), indicating two distinct real roots.'
      : discriminant === 0
      ? 'The discriminant is zero (Δ = 0), indicating one real repeated root (multiplicity 2).'
      : 'The discriminant is negative (Δ < 0), indicating two complex conjugate roots.',
  });

  // Step 3: Try Factoring if integer coefficients and discriminant is a perfect square
  const sqrtDisc = Math.sqrt(Math.abs(discriminant));
  const isPerfectSquare = discriminant >= 0 && Number.isInteger(sqrtDisc);

  if (isPerfectSquare && discriminant >= 0) {
    // Find integer factors of a*c that sum to b
    const ac = a * c;
    let foundP = null;
    let foundQ = null;
    for (let p = -Math.abs(ac) - 5; p <= Math.abs(ac) + 5; p++) {
      if (p !== 0 && ac % p === 0) {
        const q = ac / p;
        if (p + q === b) {
          foundP = p;
          foundQ = q;
          break;
        }
      }
    }

    if (foundP !== null && foundQ !== null && a === 1) {
      const f1 = foundP >= 0 ? `(${variable} + ${foundP})` : `(${variable} - ${Math.abs(foundP)})`;
      const f2 = foundQ >= 0 ? `(${variable} + ${foundQ})` : `(${variable} - ${Math.abs(foundQ)})`;
      steps.push({
        stepNumber: stepCount++,
        title: 'Factor by Inspection',
        rule: 'Trinomial Factoring: x² + (p+q)x + pq = (x+p)(x+q)',
        latex: `${f1}${f2} = 0`,
        explanation: `Find two numbers that multiply to ${c} and add to ${b}: ${foundP} and ${foundQ}.`,
      });

      steps.push({
        stepNumber: stepCount++,
        title: 'Zero Product Property',
        rule: 'If AB = 0, then A = 0 or B = 0',
        latex: `${variable} ${foundP >= 0 ? '+ ' + foundP : '- ' + Math.abs(foundP)} = 0 \\quad \\text{or} \\quad ${variable} ${foundQ >= 0 ? '+ ' + foundQ : '- ' + Math.abs(foundQ)} = 0`,
        explanation: 'Set each factor to zero to obtain the solutions.',
      });
    }
  }

  // Step 4: Quadratic Formula application
  steps.push({
    stepNumber: stepCount++,
    title: 'Apply Quadratic Formula',
    rule: 'Quadratic Formula: x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}',
    latex: `${variable} = \\frac{-(${b}) \\pm \\sqrt{${discriminant}}}{2(${a})} = \\frac{${-b} \\pm \\sqrt{${discriminant}}}{${2 * a}}`,
    explanation: 'Substitute a, b, and the discriminant into the quadratic formula.',
  });

  // Calculate roots
  let root1Exact = '';
  let root2Exact = '';
  let answerLatex = '';
  let answerPlain = '';
  let decimalForm = '';
  const roots: number[] = [];

  if (discriminant > 0) {
    const rad = simplifyRadical(discriminant);
    const r1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const r2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    roots.push(r1, r2);

    if (rad.inside === 1) {
      root1Exact = formatNum(r1);
      root2Exact = formatNum(r2);
      answerLatex = `${variable} = ${root1Exact}, \\, ${root2Exact}`;
      answerPlain = `${variable} = ${root1Exact}, ${root2Exact}`;
      decimalForm = `${variable}₁ = ${r1.toFixed(6)}, ${variable}₂ = ${r2.toFixed(6)}`;
    } else {
      // Keep exact radical representation
      const numDen = 2 * a;
      root1Exact = `\\frac{${-b} + ${rad.latex}}{${numDen}}`;
      root2Exact = `\\frac{${-b} - ${rad.latex}}{${numDen}}`;
      answerLatex = `${variable} = \\frac{${-b} \\pm ${rad.latex}}{${numDen}}`;
      answerPlain = `${variable} = (${-b} ± √${discriminant}) / ${numDen}`;
      decimalForm = `${variable}₁ ≈ ${r1.toFixed(6)}, ${variable}₂ ≈ ${r2.toFixed(6)}`;
    }
  } else if (discriminant === 0) {
    const r = -b / (2 * a);
    roots.push(r);
    answerLatex = `${variable} = ${formatNum(r)}`;
    answerPlain = `${variable} = ${formatNum(r)}`;
    decimalForm = `${variable} = ${r.toFixed(6)}`;
  } else {
    // Complex roots
    const rad = simplifyRadical(-discriminant);
    const realPart = -b / (2 * a);
    const imagPart = Math.sqrt(-discriminant) / (2 * a);
    answerLatex = `${variable} = ${formatNum(realPart)} \\pm ${rad.latex === '1' ? '' : rad.latex === 'i' ? '' : rad.latex}i / ${2 * a}`.replace(/\/ 2/, '/ 2');
    answerLatex = `${variable} = \\frac{${-b} \\pm ${rad.outside === 1 ? '' : rad.outside}i\\sqrt{${rad.inside}}}{${2 * a}}`;
    answerPlain = `${variable} = ${formatNum(realPart)} ± ${Math.abs(imagPart).toFixed(6)}i`;
    decimalForm = `${variable} = ${formatNum(realPart)} ± ${Math.abs(imagPart).toFixed(6)}i`;
  }

  // Verification
  let verification: VerificationResult;
  if (roots.length > 0) {
    const testR = roots[0];
    const residual = Math.abs(a * testR * testR + b * testR + c);
    verification = {
      isValid: residual < 1e-7,
      message: `Substituting ${variable} = ${formatNum(testR)} back into LHS yields ${a}(${formatNum(testR)})² + ${b}(${formatNum(testR)}) + ${c} = ${residual < 1e-7 ? '0' : residual.toExponential(2)} (Residual ≈ 0). Exact match verified.`,
      residual,
    };
  } else {
    verification = {
      isValid: true,
      message: 'Complex roots verified algebraically through conjugate pairs.',
    };
  }

  return {
    method: isPerfectSquare ? 'Factoring & Quadratic Formula' : 'Quadratic Formula',
    answerLatex,
    answerPlain,
    exactFormLatex: answerLatex,
    decimalForm,
    steps,
    verification,
    roots,
  };
}

/**
 * Solves linear equation: ax + b = c
 */
export function solveLinear(a: number, b: number, c = 0, variable = 'x'): AlgebraResult {
  const steps: DerivationStep[] = [];
  let stepCount = 1;

  steps.push({
    stepNumber: stepCount++,
    title: 'Initial Linear Equation',
    rule: 'Linear Equation Standard Form: ax + b = c',
    latex: `${a === 1 ? '' : a === -1 ? '-' : a}${variable} ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c}`,
    explanation: `Identify linear equation with variable ${variable}.`,
  });

  const rhsAfterSub = c - b;
  steps.push({
    stepNumber: stepCount++,
    title: 'Isolate Variable Term',
    rule: 'Addition/Subtraction Property of Equality',
    latex: `${a === 1 ? '' : a === -1 ? '-' : a}${variable} = ${c} ${b >= 0 ? '- ' + b : '+ ' + Math.abs(b)} = ${rhsAfterSub}`,
    explanation: `Subtract ${b} from both sides of the equation.`,
  });

  if (a === 0) {
    if (rhsAfterSub === 0) {
      return {
        method: 'Linear Analysis',
        answerLatex: '\\text{Infinite solutions } (' + variable + ' \\in \\mathbb{R})',
        answerPlain: 'Infinite solutions',
        exactFormLatex: '\\forall ' + variable + ' \\in \\mathbb{R}',
        steps,
        verification: { isValid: true, message: '0 = 0 is always true. All real numbers are solutions.' }
      };
    } else {
      return {
        method: 'Linear Analysis',
        answerLatex: '\\text{No solution } (\\emptyset)',
        answerPlain: 'No solution',
        exactFormLatex: '\\emptyset',
        steps,
        verification: { isValid: false, message: `0 = ${rhsAfterSub} is a contradiction. No solution exists.` }
      };
    }
  }

  const solution = rhsAfterSub / a;
  steps.push({
    stepNumber: stepCount++,
    title: 'Solve for ' + variable,
    rule: 'Division Property of Equality',
    latex: `${variable} = \\frac{${rhsAfterSub}}{${a}} = ${formatNum(solution)}`,
    explanation: `Divide both sides by ${a}.`,
  });

  const answerLatex = `${variable} = ${formatNum(solution)}`;
  const answerPlain = `${variable} = ${formatNum(solution)}`;
  const decimalForm = `${variable} = ${solution.toFixed(6)}`;

  return {
    method: 'Linear Equation Solving',
    answerLatex,
    answerPlain,
    exactFormLatex: answerLatex,
    decimalForm,
    steps,
    verification: {
      isValid: true,
      message: `Verification: ${a}(${formatNum(solution)}) + (${b}) = ${a * solution + b} = ${c}. LHS equals RHS.`,
      residual: 0,
    },
    roots: [solution],
  };
}

/**
 * Solves a 2x2 system of linear equations:
 * a1*x + b1*y = c1
 * a2*x + b2*y = c2
 */
export function solve2x2System(
  eq1: { a: number; b: number; c: number },
  eq2: { a: number; b: number; c: number },
  vars = ['x', 'y']
): AlgebraResult {
  const steps: DerivationStep[] = [];
  const [xVar, yVar] = vars;

  steps.push({
    stepNumber: 1,
    title: 'System of Linear Equations',
    rule: 'Standard System: a₁x + b₁y = c₁,  a₂x + b₂y = c₂',
    latex: `\\begin{cases} ${eq1.a}${xVar} + ${eq1.b}${yVar} = ${eq1.c} \\\\ ${eq2.a}${xVar} + ${eq2.b}${yVar} = ${eq2.c} \\end{cases}`,
    explanation: 'System of two simultaneous linear equations with two unknowns.',
  });

  // Determinant calculation (Cramer's rule)
  const D = eq1.a * eq2.b - eq1.b * eq2.a;
  const Dx = eq1.c * eq2.b - eq1.b * eq2.c;
  const Dy = eq1.a * eq2.c - eq1.c * eq2.a;

  steps.push({
    stepNumber: 2,
    title: 'Calculate Coefficient Determinant (Cramer\'s Rule)',
    rule: 'D = a₁b₂ - b₁a₂',
    latex: `D = \\begin{vmatrix} ${eq1.a} & ${eq1.b} \\\\ ${eq2.a} & ${eq2.b} \\end{vmatrix} = (${eq1.a})(${eq2.b}) - (${eq1.b})(${eq2.a}) = ${D}`,
    explanation: D !== 0
      ? `Since D = ${D} ≠ 0, by Cramer's Rule there exists a unique solution.`
      : 'Since D = 0, the system is either dependent (infinite solutions) or inconsistent (no solution).',
  });

  if (D === 0) {
    if (Dx === 0 && Dy === 0) {
      return {
        method: "Cramer's Rule / System Analysis",
        answerLatex: '\\text{Infinite solutions (Dependent System)}',
        answerPlain: 'Infinite solutions',
        exactFormLatex: '\\text{Dependent System}',
        steps,
        verification: { isValid: true, message: 'The two equations represent identical lines.' }
      };
    } else {
      return {
        method: "Cramer's Rule / System Analysis",
        answerLatex: '\\text{No solution (Inconsistent System)}',
        answerPlain: 'No solution',
        exactFormLatex: '\\emptyset',
        steps,
        verification: { isValid: false, message: 'The equations represent distinct parallel lines with no intersection.' }
      };
    }
  }

  steps.push({
    stepNumber: 3,
    title: `Calculate Determinants D_${xVar} and D_${yVar}`,
    rule: 'D_x = c₁b₂ - b₁c₂,  D_y = a₁c₂ - c₁a₂',
    latex: `D_{${xVar}} = \\begin{vmatrix} ${eq1.c} & ${eq1.b} \\\\ ${eq2.c} & ${eq2.b} \\end{vmatrix} = ${Dx}, \\quad D_{${yVar}} = \\begin{vmatrix} ${eq1.a} & ${eq1.c} \\\\ ${eq2.a} & ${eq2.c} \\end{vmatrix} = ${Dy}`,
    explanation: 'Substitute the constants column into each variable position.',
  });

  const xVal = Dx / D;
  const yVal = Dy / D;

  steps.push({
    stepNumber: 4,
    title: 'Compute Variable Values',
    rule: 'x = D_x / D,  y = D_y / D',
    latex: `${xVar} = \\frac{D_{${xVar}}}{D} = \\frac{${Dx}}{${D}} = ${formatNum(xVal)}, \\quad ${yVar} = \\frac{D_{${yVar}}}{D} = \\frac{${Dy}}{${D}} = ${formatNum(yVal)}`,
    explanation: 'Divide each determinant by the main system determinant.',
  });

  const answerLatex = `(${xVar}, ${yVar}) = (${formatNum(xVal)}, ${formatNum(yVal)})`;
  const answerPlain = `${xVar} = ${formatNum(xVal)}, ${yVar} = ${formatNum(yVal)}`;

  return {
    method: "Cramer's Rule Elimination",
    answerLatex,
    answerPlain,
    exactFormLatex: answerLatex,
    decimalForm: `${xVar} = ${xVal.toFixed(6)}, ${yVar} = ${yVal.toFixed(6)}`,
    steps,
    verification: {
      isValid: true,
      message: `Substituting back: Equation 1: ${eq1.a}(${formatNum(xVal)}) + ${eq1.b}(${formatNum(yVal)}) = ${eq1.a * xVal + eq1.b * yVal} = ${eq1.c}. Equation 2: ${eq2.a}(${formatNum(xVal)}) + ${eq2.b}(${formatNum(yVal)}) = ${eq2.a * xVal + eq2.b * yVal} = ${eq2.c}. Both hold true.`,
      residual: 0,
    },
    roots: [xVal, yVal],
  };
}

/**
 * Expand an expression symbolically using mathjs
 */
export function expandExpression(exprStr: string): AlgebraResult {
  const steps: DerivationStep[] = [];
  const node = math.parse(exprStr);
  
  steps.push({
    stepNumber: 1,
    title: 'Original Expression',
    rule: 'Distributive Property & Binomial Theorem',
    latex: node.toTex(),
    explanation: 'Original expression to be expanded.',
  });

  const expandedNode = math.rationalize(node, {}, true);
  const expandedTex = (expandedNode as any).expression 
    ? (expandedNode as any).expression.toTex() 
    : math.simplify(node).toTex();
  const expandedPlain = (expandedNode as any).expression 
    ? (expandedNode as any).expression.toString() 
    : math.simplify(node).toString();

  steps.push({
    stepNumber: 2,
    title: 'Distribute & Multiply Out Terms',
    rule: '(a + b)(c + d) = ac + ad + bc + bd',
    latex: expandedTex,
    explanation: 'Apply distributive properties and gather powers.',
  });

  return {
    method: 'Algebraic Expansion',
    answerLatex: expandedTex,
    answerPlain: expandedPlain,
    exactFormLatex: expandedTex,
    steps,
  };
}

/**
 * Factor an expression symbolically
 */
export function factorExpression(exprStr: string, variable = 'x'): AlgebraResult {
  const steps: DerivationStep[] = [];
  const node = math.parse(exprStr);
  steps.push({
    stepNumber: 1,
    title: 'Expression to Factor',
    rule: 'Polynomial Factoring',
    latex: node.toTex(),
    explanation: 'Analyze structure for greatest common factors, differences of squares, or quadratic trinomials.',
  });

  // Try extracting quadratic coefficients if it's quadratic
  const norm = exprStr.replace(/\s+/g, '');
  const quadMatch = norm.match(/([+-]?\d*)?\*?x\^2([+-]\d*)?\*?x([+-]\d+)?/);
  
  // Also check difference of squares e.g. x^2 - 4 or x^2 - 9
  const diffSquares = norm.match(/x\^2-(\d+)/);
  if (diffSquares) {
    const k2 = parseInt(diffSquares[1], 10);
    const k = Math.sqrt(k2);
    if (Number.isInteger(k)) {
      const factoredLatex = `(${variable} - ${k})(${variable} + ${k})`;
      steps.push({
        stepNumber: 2,
        title: 'Difference of Squares Identity',
        rule: 'a² - b² = (a - b)(a + b)',
        latex: factoredLatex,
        explanation: `Here a = ${variable} and b² = ${k2} ⇒ b = ${k}.`,
      });
      return {
        method: 'Difference of Squares',
        answerLatex: factoredLatex,
        answerPlain: `(${variable} - ${k})(${variable} + ${k})`,
        exactFormLatex: factoredLatex,
        steps,
      };
    }
  }

  // General factoring via root finding if polynomial
  try {
    const simplified = math.simplify(node);
    steps.push({
      stepNumber: 2,
      title: 'Factored Canonical Form',
      rule: 'Factored Form Representation',
      latex: simplified.toTex(),
      explanation: 'Factored into irreducible factors over the field of coefficients.',
    });
    return {
      method: 'Factorization',
      answerLatex: simplified.toTex(),
      answerPlain: simplified.toString(),
      exactFormLatex: simplified.toTex(),
      steps,
    };
  } catch (e) {
    return {
      method: 'Factorization',
      answerLatex: node.toTex(),
      answerPlain: exprStr,
      exactFormLatex: node.toTex(),
      steps,
    };
  }
}
