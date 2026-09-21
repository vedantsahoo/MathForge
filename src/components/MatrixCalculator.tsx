import React, { useState } from 'react';
import { 
  calculateDeterminant, 
  calculateInverse, 
  calculateTranspose, 
  calculateEigenvalues2x2, 
  matrixToLatex 
} from '../lib/math/matrix';
import { MathRenderer } from './MathRenderer';
import { Grid, ArrowRight, RefreshCw, Layers } from 'lucide-react';

interface MatrixCalculatorProps {
  onApplyMatrixToSolver: (expression: string) => void;
}

export const MatrixCalculator: React.FC<MatrixCalculatorProps> = ({
  onApplyMatrixToSolver,
}) => {
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [matrixData, setMatrixData] = useState<number[][]>([
    [1, 2],
    [3, 4],
  ]);
  const [activeTab, setActiveTab] = useState<'single' | 'binary'>('single');
  const [matrixB, setMatrixB] = useState<number[][]>([
    [2, 0],
    [1, 3],
  ]);

  const handleCellChange = (r: number, c: number, val: string, isB = false) => {
    const num = parseFloat(val) || 0;
    if (isB) {
      const copy = matrixB.map(row => [...row]);
      copy[r][c] = num;
      setMatrixB(copy);
    } else {
      const copy = matrixData.map(row => [...row]);
      copy[r][c] = num;
      setMatrixData(copy);
    }
  };

  const handleResize = (newRows: number, newCols: number) => {
    setRows(newRows);
    setCols(newCols);
    const newA: number[][] = [];
    const newB: number[][] = [];
    for (let i = 0; i < newRows; i++) {
      newA[i] = [];
      newB[i] = [];
      for (let j = 0; j < newCols; j++) {
        newA[i][j] = matrixData[i]?.[j] ?? (i === j ? 1 : 0);
        newB[i][j] = matrixB[i]?.[j] ?? (i === j ? 1 : 0);
      }
    }
    setMatrixData(newA);
    setMatrixB(newB);
  };

  const setPreset = (type: 'identity' | 'zero' | 'symmetric') => {
    const copy: number[][] = [];
    for (let i = 0; i < rows; i++) {
      copy[i] = [];
      for (let j = 0; j < cols; j++) {
        if (type === 'identity') copy[i][j] = i === j ? 1 : 0;
        else if (type === 'zero') copy[i][j] = 0;
        else copy[i][j] = i === j ? 2 : 1;
      }
    }
    setMatrixData(copy);
  };

  const formatMatrixString = (m: number[][]) => {
    return `[${m.map(row => row.join(', ')).join('; ')}]`;
  };

  return (
    <div id="matrix-calculator-view" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-sm space-y-5">
      {/* Header & Size selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Interactive Matrix Studio
            </h3>
            <span className="text-xs text-slate-400">
              Visual grid editor & linear algebra calculations
            </span>
          </div>
        </div>

        {/* Dimension Controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Dimensions:</span>
          <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => handleResize(2, 2)}
              className={`px-2.5 py-1 rounded ${rows === 2 && cols === 2 ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              2 × 2
            </button>
            <button
              type="button"
              onClick={() => handleResize(3, 3)}
              className={`px-2.5 py-1 rounded ${rows === 3 && cols === 3 ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              3 × 3
            </button>
            <button
              type="button"
              onClick={() => handleResize(4, 4)}
              className={`px-2.5 py-1 rounded ${rows === 4 && cols === 4 ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              4 × 4
            </button>
          </div>
        </div>
      </div>

      {/* Visual Matrix Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Matrix A */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Matrix A ({rows} × {cols})
            </span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setPreset('identity')}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Identity
              </button>
              <button
                type="button"
                onClick={() => setPreset('zero')}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Zero
              </button>
            </div>
          </div>

          <div
            className="grid gap-2 my-2 justify-center"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(44px, 56px))` }}
          >
            {matrixData.map((row, r) =>
              row.map((val, c) => (
                <input
                  key={`a-${r}-${c}`}
                  type="number"
                  value={val}
                  onChange={(e) => handleCellChange(r, c, e.target.value)}
                  className="w-full text-center py-2 px-1 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-mono text-sm focus:border-blue-500 focus:outline-none"
                />
              ))
            )}
          </div>
        </div>

        {/* Single Matrix Operations Suite */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
            Solve & Step Derivations
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onApplyMatrixToSolver(`det(${formatMatrixString(matrixData)})`)}
              className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition text-left flex items-center justify-between"
            >
              <span>Determinant det(A)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onApplyMatrixToSolver(`inv(${formatMatrixString(matrixData)})`)}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition text-left flex items-center justify-between"
            >
              <span>Inverse A⁻¹</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onApplyMatrixToSolver(`transpose(${formatMatrixString(matrixData)})`)}
              className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition text-left flex items-center justify-between"
            >
              <span>Transpose Aᵀ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {rows === 2 && cols === 2 && (
              <button
                type="button"
                onClick={() => onApplyMatrixToSolver(`eigenvalues(${formatMatrixString(matrixData)})`)}
                className="px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition text-left flex items-center justify-between"
              >
                <span>Eigenvalues λ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold">Formula Reference:</div>
            <div>2×2: <code className="text-blue-400">det(A) = ad - bc</code></div>
            <div>Inverse: <code className="text-blue-400">A⁻¹ = (1/det(A)) · adj(A)</code></div>
            <div>Eigenvalues: <code className="text-blue-400">det(A - λI) = 0</code></div>
          </div>
        </div>
      </div>
    </div>
  );
};
