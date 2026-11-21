import React from 'react';

export function RichContent({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-6 text-base sm:text-lg leading-relaxed text-[#334155] dark:text-slate-300">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n');
          const code = lines.slice(1, lines[lines.length - 1].startsWith('```') ? -1 : undefined).join('\n');
          return (
            <pre
              key={idx}
              className="p-5 bg-[#151B24] text-[#00E582] border border-white/10 overflow-x-auto text-sm font-mono leading-relaxed"
            >
              <code>{code}</code>
            </pre>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className="pt-4 font-display text-2xl sm:text-3xl font-bold text-[#151B24] dark:text-white tracking-tight"
            >
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="pt-2 font-display text-xl sm:text-2xl font-bold text-[#151B24] dark:text-white"
            >
              {trimmed.replace(/^###\s+/, '')}
            </h3>
          );
        }

        const lines = trimmed.split('\n');
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={idx} className="space-y-2.5 pl-5 border-l border-[#00E582]/40">
              {lines.map((line, i) => (
                <li key={i} className="text-[#334155] dark:text-slate-300">
                  {line.trim().replace(/^-\s+/, '')}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-line">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
