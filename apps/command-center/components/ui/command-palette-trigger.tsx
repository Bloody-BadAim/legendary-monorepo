'use client';

import React from 'react';
import { CommandPaletteContext } from '@/components/ui/command-palette';
import { cn } from '@/lib/utils';

export function CommandPaletteTrigger({ className }: { className?: string }) {
  const ctx = React.useContext(CommandPaletteContext);

  if (!ctx) return null;

  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <button
      type="button"
      onClick={ctx.open}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-slate-200',
        className
      )}
      aria-label="Open command palette (Cmd+K)"
    >
      <span aria-hidden>{isMac ? '⌘' : 'Ctrl'}</span>
      <span>K</span>
    </button>
  );
}
