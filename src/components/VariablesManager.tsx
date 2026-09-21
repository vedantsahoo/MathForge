import React, { useState } from 'react';
import { VariableBinding } from '../types';
import { Variable, Plus, Trash2, Check } from 'lucide-react';

interface VariablesManagerProps {
  variables: VariableBinding[];
  onChange: (variables: VariableBinding[]) => void;
}

export const VariablesManager: React.FC<VariablesManagerProps> = ({
  variables,
  onChange,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [valInput, setValInput] = useState('');

  const handleAdd = () => {
    if (!nameInput.trim() || !valInput.trim()) return;
    const cleanName = nameInput.trim().replace(/[^a-zA-Z]/g, '');
    const num = parseFloat(valInput);
    const newVars = [
      ...variables.filter(v => v.name !== cleanName),
      {
        name: cleanName,
        value: valInput.trim(),
        numericValue: Number.isNaN(num) ? undefined : num,
      }
    ];
    onChange(newVars);
    setNameInput('');
    setValInput('');
  };

  const handleRemove = (name: string) => {
    onChange(variables.filter(v => v.name !== name));
  };

  return (
    <div id="variables-manager-panel" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Variable className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Variables & Parameters ({variables.length})
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">e.g. a = 5, b = 10</span>
      </div>

      {/* Existing Variables List */}
      <div className="flex flex-wrap gap-2">
        {variables.map((v) => (
          <div
            key={v.name}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 shadow-sm"
          >
            <span className="text-blue-400 font-semibold">{v.name}</span>
            <span className="text-slate-500">=</span>
            <span>{v.value}</span>
            <button
              type="button"
              onClick={() => handleRemove(v.name)}
              className="text-slate-500 hover:text-rose-400 transition ml-1"
              title="Remove variable"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {variables.length === 0 && (
          <span className="text-xs text-slate-500 italic py-1">
            No custom variables defined. Try adding a = 5, b = 10.
          </span>
        )}
      </div>

      {/* Add Variable Input bar */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder="Var (e.g. a)"
          className="w-20 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
        />
        <span className="text-slate-500">=</span>
        <input
          type="text"
          value={valInput}
          onChange={(e) => setValInput(e.target.value)}
          placeholder="Value (e.g. 5 or pi/4)"
          className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!nameInput.trim() || !valInput.trim()}
          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
};
