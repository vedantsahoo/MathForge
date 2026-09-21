import React from 'react';
import { HistoryEntry } from '../types';
import { MathRenderer } from './MathRenderer';
import { History, Trash2, Copy, Play, X, Clock } from 'lucide-react';

interface HistoryDrawerProps {
  history: HistoryEntry[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  isOpen,
  onClose,
  onSelect,
  onDelete,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Calculation History ({history.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium transition px-2 py-1 rounded hover:bg-rose-950/30"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No calculations stored yet. Solved problems will appear here.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    {item.mode}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="font-mono text-xs text-slate-200 truncate font-medium">
                  {item.problem}
                </div>

                <div className="p-2 rounded bg-slate-900 border border-slate-800/60 overflow-x-auto text-xs font-serif text-slate-100">
                  <MathRenderer latex={item.answerLatex} displayMode={false} />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.answerPlain);
                    }}
                    title="Copy Answer"
                    className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    title="Delete Entry"
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Reopen</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
