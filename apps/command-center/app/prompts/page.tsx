'use client';

import { useState, useEffect } from 'react';
import { PROMPTS } from '@/data/prompts';

export default function PromptsPage() {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={
        mounted ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'
      }
    >
      <p className="mb-5 text-sm text-muted">
        AI prompt templates die ik vaak gebruik in Cursor en andere tools.
      </p>
      <div className="flex flex-col gap-2">
        {PROMPTS.map((p) => (
          <div
            key={p.name}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <button
              type="button"
              onClick={() => setExpanded(expanded === p.name ? null : p.name)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted">
                  {p.category}
                </span>
              </div>
              <span className="text-muted">
                {expanded === p.name ? '▴' : '▾'}
              </span>
            </button>
            {expanded === p.name && (
              <div className="border-t border-border px-4 py-3">
                <p className="mb-2 text-xs text-muted">{p.description}</p>
                <pre className="whitespace-pre-wrap rounded bg-slate-800/50 p-3 font-mono text-xs text-slate-300">
                  {p.content}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
