import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  latex,
  displayMode = false,
  className = '',
}) => {
  const html = useMemo(() => {
    if (!latex) return '';
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch (err) {
      console.warn('KaTeX render error for:', latex, err);
      return `<span class="text-rose-400 font-mono text-sm">${latex}</span>`;
    }
  }, [latex, displayMode]);

  return (
    <span
      className={`math-rendered ${displayMode ? 'block my-2 overflow-x-auto py-1 scrollbar-thin' : 'inline-block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
