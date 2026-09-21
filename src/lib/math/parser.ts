import { SolutionMode } from '../../types';

export interface ParsedProblem {
  raw: string;
  normalized: string;
  detectedMode: SolutionMode;
  targetVariable: string;
  auxiliaryParams?: Record<string, any>;
  isSystemOfEquations?: boolean;
  equations?: string[];
  isMatrix?: boolean;
}

/**
 * Normalizes Unicode math symbols and user shorthands into parseable expressions
 */
export function normalizeMathString(input: string): string {
  let s = input.trim();

  // Replace unicode superscripts
  const superscripts: Record<string, string> = {
    '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4',
    '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
    '⁻': '^-', '⁺': '^+', 'ⁿ': '^n', 'ˣ': '^x',
  };
  for (const [sup, rep] of Object.entries(superscripts)) {
    s = s.replaceAll(sup, rep);
  }

  // Replace unicode subscripts (especially for integral bounds like ∫₀¹)
  const subscripts: Record<string, string> = {
    '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4',
    '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9',
  };
  for (const [sub, rep] of Object.entries(subscripts)) {
    s = s.replaceAll(sub, rep);
  }

  // Replace unicode roots, pi, infinity, arrows
  s = s.replace(/√\(([^)]+)\)/g, 'sqrt($1)');
  s = s.replace(/√([a-zA-Z0-9]+)/g, 'sqrt($1)');
  s = s.replaceAll('π', 'pi');
  s = s.replaceAll('∞', 'Infinity');
  s = s.replaceAll('→', '->');
  s = s.replaceAll('–', '-');
  s = s.replaceAll('—', '-');
  s = s.replaceAll('×', '*');
  s = s.replaceAll('÷', '/');
  s = s.replaceAll('≤', '<=');
  s = s.replaceAll('≥', '>=');
  s = s.replaceAll('≠', '!=');

  // Replace LaTeX fragments if any
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
  s = s.replace(/\\sin/g, 'sin');
  s = s.replace(/\\cos/g, 'cos');
  s = s.replace(/\\tan/g, 'tan');
  s = s.replace(/\\ln/g, 'log');
  s = s.replace(/\\log/g, 'log10');
  s = s.replace(/\\pi/g, 'pi');
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\\times/g, '*');

  // Insert implicit multiplication: e.g. 5x -> 5*x, 2(x+1) -> 2*(x+1), (x+1)(x+2) -> (x+1)*(x+2)
  // Avoid inserting * immediately following limit arrows like -> 0 (
  s = s.replace(/(\d+)([a-zA-Z])/g, (match, num, letter) => {
    return `${num}*${letter}`;
  });
  s = s.replace(/(?<!->\s*)(?<!to\s*)(\d)\s*\(/g, '$1*(');
  s = s.replace(/\)\s*\(/g, ')*(');
  s = s.replace(/\)\s*([a-zA-Z])/g, ')*$1');

  return s.trim();
}

/**
 * Parses user input to detect intent, operation mode, and extract components
 */
export function parseUserInput(rawInput: string, explicitMode?: SolutionMode): ParsedProblem {
  const trimmed = rawInput.trim();
  let normalized = normalizeMathString(trimmed);
  let detectedMode: SolutionMode = explicitMode || 'solve';
  let targetVariable = 'x';
  const auxiliaryParams: Record<string, any> = {};

  // Check for Matrix expression: e.g. det([1,2;3,4]), inv([..]), or pure [1 2; 3 4]
  if (/^det\s*\(/i.test(normalized) || /^inv\s*\(/i.test(normalized) || /^[\[][\d\s,;\.\-\+]+[\]]$/.test(normalized.trim())) {
    detectedMode = 'matrix';
    return {
      raw: trimmed,
      normalized,
      detectedMode,
      targetVariable: 'x',
      isMatrix: true,
    };
  }

  // Check for plain-text commands
  const lower = normalized.toLowerCase();

  // Natural language limit
  const limitMatch = normalized.match(/(?:find\s+the\s+limit\s+of|limit\s+of|lim)\s*(?:as\s+([a-zA-Z])\s*(?:approaches|->)\s*([^\s,]+)|([a-zA-Z])\s*->\s*([^\s,]+))?\s*(?:of)?\s*(.*)/i);
  if (/^lim/i.test(normalized) || limitMatch) {
    detectedMode = 'limit';
    // Match patterns like lim x->0 (sin(x)/x) or lim_(x->0)
    const limReg = /lim(?:\s*_\s*\{?|\s+)?([a-zA-Z])\s*(?:->|to)\s*([a-zA-Z0-9_\.\-]+)\}?\s*(.*)/i;
    const m = normalized.match(limReg);
    if (m) {
      targetVariable = m[1];
      auxiliaryParams.approaches = m[2];
      normalized = m[3].replace(/^[,\s:]+/, '').trim();
      // Remove enclosing outer brackets if present
      if (normalized.startsWith('(') && normalized.endsWith(')')) {
        normalized = normalized.slice(1, -1).trim();
      }
    } else {
      // Fallback: search for approaches 0
      auxiliaryParams.approaches = '0';
      normalized = normalized.replace(/^lim\s*/i, '').trim();
    }
    return { raw: trimmed, normalized, detectedMode, targetVariable, auxiliaryParams };
  }

  // Definite or Indefinite integral: e.g., ∫_0^1 x^2 dx or integrate x^2 from 0 to 1 or ∫₀¹ x² dx
  if (/^∫/i.test(normalized) || /^integrate\b/i.test(normalized) || /integrate.*from/i.test(normalized) || /^\s*int\s*\(/.test(normalized)) {
    detectedMode = 'integrate';
    const boundsMatch = normalized.match(/(?:from\s+([^\s,]+)\s+to\s+([^\s,]+)|_\{?([^\}^]+)\}?\^\{?([^\s}]+)\}?)/i);
    if (boundsMatch) {
      const lowerBound = boundsMatch[1] || boundsMatch[3] || '0';
      const upperBound = boundsMatch[2] || boundsMatch[4] || '1';
      auxiliaryParams.isDefinite = true;
      auxiliaryParams.lowerBound = lowerBound;
      auxiliaryParams.upperBound = upperBound;
    }
    // Clean up "integrate", "∫", "dx"
    let expr = normalized
      .replace(/^integrate\s+/i, '')
      .replace(/^∫[^\s]*\s*/i, '')
      .replace(/from\s+.*?\s+to\s+[^\s,]+/i, '')
      .replace(/_\{?[^_\^]*\}?\^\{?[^_\^]*\}?/i, '')
      .replace(/\s*d([a-zA-Z])$/i, (m, v) => {
        targetVariable = v;
        return '';
      })
      .trim();
    if (expr.startsWith('(') && expr.endsWith(')')) {
      expr = expr.slice(1, -1);
    }
    normalized = expr;
    return { raw: trimmed, normalized, detectedMode, targetVariable, auxiliaryParams };
  }

  // Derivative: e.g. d/dx(x^3 + 2x), differentiate x^3, dy/dx = ..., (x^3)'
  if (/^d\/d([a-zA-Z])/i.test(normalized) || /^differentiate\s+/i.test(normalized) || /'\s*$/.test(normalized) || /^derivative\s+of\s+/i.test(normalized)) {
    detectedMode = 'differentiate';
    const varMatch = normalized.match(/^d\/d([a-zA-Z])/i);
    if (varMatch) targetVariable = varMatch[1];
    let expr = normalized
      .replace(/^d\/d[a-zA-Z]\s*/i, '')
      .replace(/^differentiate\s+(?:of\s+)?/i, '')
      .replace(/^derivative\s+of\s+/i, '')
      .replace(/'\s*$/, '')
      .trim();
    if (expr.startsWith('(') && expr.endsWith(')') || expr.startsWith('[') && expr.endsWith(']')) {
      expr = expr.slice(1, -1);
    }
    normalized = expr;
    return { raw: trimmed, normalized, detectedMode, targetVariable, auxiliaryParams };
  }

  // Differential Equation: e.g. dy/dx = x + y, y' + 2y = 4, y'' + 4y = 0
  if (/dy\/dx\s*=/i.test(normalized) || /y''\s*[\+\-]/i.test(normalized) || /y'\s*[\+\-]/i.test(normalized) || /y\s*'\s*=/i.test(normalized)) {
    detectedMode = 'solve';
    auxiliaryParams.isODE = true;
    return { raw: trimmed, normalized, detectedMode, targetVariable: 'x', auxiliaryParams };
  }

  // Factor
  if (/^factor\s+/i.test(normalized)) {
    detectedMode = 'factor';
    normalized = normalized.replace(/^factor\s+/i, '').trim();
    return { raw: trimmed, normalized, detectedMode, targetVariable };
  }

  // Expand
  if (/^expand\s+/i.test(normalized)) {
    detectedMode = 'expand';
    normalized = normalized.replace(/^expand\s+/i, '').trim();
    return { raw: trimmed, normalized, detectedMode, targetVariable };
  }

  // Simplify
  if (/^simplify\s+/i.test(normalized)) {
    detectedMode = 'simplify';
    normalized = normalized.replace(/^simplify\s+/i, '').trim();
    return { raw: trimmed, normalized, detectedMode, targetVariable };
  }

  // System of equations: Contains comma or semicolon with '=' in each or multiple equations
  if ((normalized.includes(',') || normalized.includes(';')) && normalized.includes('=')) {
    const parts = normalized.split(/[,;]/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every(p => p.includes('='))) {
      return {
        raw: trimmed,
        normalized,
        detectedMode: 'system',
        targetVariable: 'x',
        isSystemOfEquations: true,
        equations: parts,
      };
    }
  }

  // Graph command
  if (/^(?:graph|plot)\s+/i.test(normalized)) {
    detectedMode = 'graph';
    normalized = normalized.replace(/^(?:graph|plot)\s+/i, '').replace(/^f\(x\)\s*=\s*/i, '').replace(/^y\s*=\s*/i, '').trim();
    return { raw: trimmed, normalized, detectedMode, targetVariable };
  }

  // Solve command: "solve x^2 + 5x + 6 = 0"
  if (/^solve\s+/i.test(normalized)) {
    detectedMode = 'solve';
    normalized = normalized.replace(/^solve\s+/i, '').trim();
  }

  // If explicit mode was chosen by the user and is different
  if (explicitMode && explicitMode !== 'solve') {
    detectedMode = explicitMode;
  }

  // If it has equality or inequalities, it is an equation/inequality
  if (/[=><]/.test(normalized) && detectedMode !== 'system') {
    if (detectedMode === 'solve' || detectedMode === 'equation') {
      detectedMode = 'equation';
    }
  }

  // Detect primary variable (x, y, t, z, n)
  const varMatches = normalized.match(/\b([a-zA-Z])\b/g);
  if (varMatches) {
    const commonVars = ['x', 'y', 't', 'z', 'n', 'u', 'v', 'r', 'theta'];
    for (const v of commonVars) {
      if (varMatches.includes(v)) {
        targetVariable = v;
        break;
      }
    }
  }

  return {
    raw: trimmed,
    normalized,
    detectedMode,
    targetVariable,
    auxiliaryParams,
  };
}
