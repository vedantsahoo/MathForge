import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as math from 'mathjs';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Layers } from 'lucide-react';

interface GraphFunction {
  id: string;
  name: string;
  expr: string;
  color: string;
  isDerivative?: boolean;
}

interface CriticalPoint {
  x: number;
  y: number;
  label: string;
  type: 'root' | 'min' | 'max' | 'intercept';
}

interface GraphViewProps {
  functions: GraphFunction[];
  integralArea?: { from: number; to: number };
  criticalPoints?: CriticalPoint[];
  initialDomain?: [number, number];
  initialRange?: [number, number];
  onAddFunction?: (expr: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  functions,
  integralArea,
  criticalPoints = [],
  initialDomain = [-8, 8],
  initialRange = [-6, 6],
  onAddFunction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Coordinate viewport state
  const [domain, setDomain] = useState<[number, number]>(initialDomain);
  const [range, setRange] = useState<[number, number]>(initialRange);
  const [visibleFuncs, setVisibleFuncs] = useState<Record<string, boolean>>({});
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Custom secondary function input
  const [newFuncExpr, setNewFuncExpr] = useState('');
  const [customFuncs, setCustomFuncs] = useState<GraphFunction[]>([]);

  // Update visible funcs when functions prop changes
  useEffect(() => {
    const nextVis: Record<string, boolean> = { ...visibleFuncs };
    functions.forEach(f => {
      if (nextVis[f.id] === undefined) nextVis[f.id] = true;
    });
    setVisibleFuncs(nextVis);
  }, [functions]);

  // Combined function list
  const allFunctions = [...functions, ...customFuncs];

  // Canvas drawing loop
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    const [xMin, xMax] = domain;
    const [yMin, yMax] = range;
    const xSpan = xMax - xMin;
    const ySpan = yMax - yMin;

    const toScreenX = (x: number) => ((x - xMin) / xSpan) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / ySpan) * height;
    const toMathX = (px: number) => xMin + (px / width) * xSpan;
    const toMathY = (py: number) => yMin + ((height - py) / height) * ySpan;

    // Draw Grid Lines
    // Determine reasonable grid spacing
    const targetGridLines = 10;
    const roughStepX = xSpan / targetGridLines;
    const powerX = Math.pow(10, Math.floor(Math.log10(roughStepX)));
    let stepX = powerX;
    if (roughStepX / powerX >= 5) stepX = powerX * 5;
    else if (roughStepX / powerX >= 2) stepX = powerX * 2;

    const roughStepY = ySpan / targetGridLines;
    const powerY = Math.pow(10, Math.floor(Math.log10(roughStepY)));
    let stepY = powerY;
    if (roughStepY / powerY >= 5) stepY = powerY * 5;
    else if (roughStepY / powerY >= 2) stepY = powerY * 2;

    // Vertical grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    const firstGridX = Math.floor(xMin / stepX) * stepX;
    for (let x = firstGridX; x <= xMax; x += stepX) {
      const px = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();

      if (Math.abs(x) > 1e-6) {
        const py = Math.min(Math.max(toScreenY(0) + 14, 15), height - 5);
        ctx.fillText(parseFloat(x.toFixed(4)).toString(), px, py);
      }
    }

    // Horizontal grid lines
    ctx.textAlign = 'right';
    const firstGridY = Math.floor(yMin / stepY) * stepY;
    for (let y = firstGridY; y <= yMax; y += stepY) {
      const py = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();

      if (Math.abs(y) > 1e-6) {
        const px = Math.min(Math.max(toScreenX(0) - 6, 25), width - 5);
        ctx.fillText(parseFloat(y.toFixed(4)).toString(), px, py + 3);
      }
    }

    // Main Axes (X and Y = 0)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#475569';

    // X Axis
    const yZeroPx = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, yZeroPx);
    ctx.lineTo(width, yZeroPx);
    ctx.stroke();

    // Y Axis
    const xZeroPx = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(xZeroPx, 0);
    ctx.lineTo(xZeroPx, height);
    ctx.stroke();

    // Origin 0 label
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('0', xZeroPx - 6, yZeroPx + 14);

    // Draw Integral Shaded Area if present
    if (integralArea && allFunctions.length > 0) {
      const primaryFn = allFunctions[0];
      try {
        const compiled = math.compile(primaryFn.expr);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.beginPath();
        const startPx = toScreenX(integralArea.from);
        const endPx = toScreenX(integralArea.to);
        ctx.moveTo(startPx, toScreenY(0));

        const samples = 100;
        for (let i = 0; i <= samples; i++) {
          const curX = integralArea.from + (i / samples) * (integralArea.to - integralArea.from);
          let curY = 0;
          try {
            curY = compiled.evaluate({ x: curX });
          } catch {}
          ctx.lineTo(toScreenX(curX), toScreenY(curY));
        }
        ctx.lineTo(endPx, toScreenY(0));
        ctx.closePath();
        ctx.fill();
      } catch {}
    }

    // Plot Functions
    const numSamples = width;
    for (const fn of allFunctions) {
      if (visibleFuncs[fn.id] === false) continue;

      try {
        const compiled = math.compile(fn.expr);
        ctx.lineWidth = fn.isDerivative ? 2 : 2.5;
        ctx.strokeStyle = fn.color || '#3b82f6';
        if (fn.isDerivative) {
          ctx.setLineDash([5, 4]);
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        let isDrawing = false;

        for (let px = 0; px <= width; px += 2) {
          const mathX = toMathX(px);
          let mathY = NaN;
          try {
            mathY = compiled.evaluate({ x: mathX });
          } catch {
            mathY = NaN;
          }

          if (typeof mathY === 'number' && Number.isFinite(mathY)) {
            const py = toScreenY(mathY);
            // Handle asymptote discontinuity
            if (py < -height || py > height * 2) {
              isDrawing = false;
            } else {
              if (!isDrawing) {
                ctx.moveTo(px, py);
                isDrawing = true;
              } else {
                ctx.lineTo(px, py);
              }
            }
          } else {
            isDrawing = false;
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      } catch (err) {
        console.warn('Failed to plot:', fn.expr, err);
      }
    }

    // Plot Critical Points / Roots
    for (const pt of criticalPoints) {
      const px = toScreenX(pt.x);
      const py = toScreenY(pt.y);

      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        ctx.fillStyle = pt.type === 'root' ? '#10b981' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label above point
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pt.label, px, py - 9);
      }
    }

    // Draw Crosshair on Hover
    if (hoverCoord) {
      const px = toScreenX(hoverCoord.x);
      const py = toScreenY(hoverCoord.y);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point circle
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [domain, range, allFunctions, visibleFuncs, integralArea, criticalPoints, hoverCoord]);

  // Canvas resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = Math.max(rect.height, 360);
        drawGraph();
      }
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [drawGraph]);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const [xMin, xMax] = domain;
    const [yMin, yMax] = range;
    const mathX = xMin + (px / rect.width) * (xMax - xMin);
    const mathY = yMin + ((rect.height - py) / rect.height) * (yMax - yMin);

    setHoverCoord({ x: parseFloat(mathX.toFixed(3)), y: parseFloat(mathY.toFixed(3)) });

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const xShift = (dx / rect.width) * (xMax - xMin);
      const yShift = (dy / rect.height) * (yMax - yMin);

      setDomain([xMin - xShift, xMax - xShift]);
      setRange([yMin + yShift, yMax + yShift]);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.85;
    zoom(factor);
  };

  const zoom = (factor: number) => {
    const [xMin, xMax] = domain;
    const [yMin, yMax] = range;
    const xMid = (xMin + xMax) / 2;
    const yMid = (yMin + yMax) / 2;
    const halfX = ((xMax - xMin) / 2) * factor;
    const halfY = ((yMax - yMin) / 2) * factor;

    setDomain([xMid - halfX, xMid + halfX]);
    setRange([yMid - halfY, yMid + halfY]);
  };

  const resetView = () => {
    setDomain(initialDomain);
    setRange(initialRange);
  };

  const toggleFunc = (id: string) => {
    setVisibleFuncs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCustomFunc = () => {
    if (!newFuncExpr.trim()) return;
    const colors = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];
    const nextColor = colors[customFuncs.length % colors.length];
    const newFn: GraphFunction = {
      id: `custom-${Date.now()}`,
      name: `g(x) = ${newFuncExpr}`,
      expr: newFuncExpr,
      color: nextColor,
    };
    setCustomFuncs([...customFuncs, newFn]);
    setNewFuncExpr('');
  };

  return (
    <div id="interactive-graph-container" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl backdrop-blur-sm space-y-4">
      {/* Graph Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Interactive Coordinate Plane
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              X: [{domain[0].toFixed(1)}, {domain[1].toFixed(1)}] | Y: [{range[0].toFixed(1)}, {range[1].toFixed(1)}]
            </span>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            id="zoom-in-btn"
            type="button"
            onClick={() => zoom(0.8)}
            title="Zoom in"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="zoom-out-btn"
            type="button"
            onClick={() => zoom(1.25)}
            title="Zoom out"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="reset-view-btn"
            type="button"
            onClick={resetView}
            title="Reset coordinate view"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-crosshair select-none"
      >
        <canvas
          id="math-graph-canvas"
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDragging(false);
            setHoverCoord(null);
          }}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* Coordinate inspection HUD in corner */}
        {hoverCoord && (
          <div className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 shadow-lg pointer-events-none">
            x: <span className="text-blue-400">{hoverCoord.x}</span>, y: <span className="text-emerald-400">{hoverCoord.y}</span>
          </div>
        )}
      </div>

      {/* Active Plotted Functions Legend & Controls */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {allFunctions.map((fn) => {
            const isVisible = visibleFuncs[fn.id] !== false;
            return (
              <div
                key={fn.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: fn.color }}
                />
                <span className="font-mono">{fn.name}</span>
                <button
                  type="button"
                  onClick={() => toggleFunc(fn.id)}
                  title={isVisible ? 'Hide function' : 'Show function'}
                  className="text-slate-500 hover:text-slate-300 ml-1"
                >
                  {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Add extra function overlay bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <input
            id="add-func-input"
            type="text"
            value={newFuncExpr}
            onChange={(e) => setNewFuncExpr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomFunc()}
            placeholder="Add another curve e.g. 2x - 1, sin(x), cos(x)"
            className="flex-1 px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            id="add-func-btn"
            type="button"
            onClick={handleAddCustomFunc}
            disabled={!newFuncExpr.trim()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
          >
            Plot +
          </button>
        </div>
      </div>
    </div>
  );
};
