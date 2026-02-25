'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ShortcutsOverlayContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const ShortcutsOverlayContext =
  React.createContext<ShortcutsOverlayContextValue | null>(null);

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: '⌘K / Ctrl+K', label: 'Command palette' },
  { keys: '?', label: 'Deze shortcuts' },
  { keys: 'Esc', label: 'Sluit overlay / palette' },
  { keys: 'G → H', label: 'Home' },
  { keys: 'G → T', label: 'Todo' },
  { keys: 'G → P', label: 'Projects' },
  { keys: 'G → R', label: 'Roadmap' },
  { keys: 'G → A', label: 'Audit' },
];

export function ShortcutsOverlay() {
  const ctx = React.useContext(ShortcutsOverlayContext);
  const isOpen = ctx?.isOpen ?? false;
  const close = React.useMemo(() => ctx?.close ?? (() => {}), [ctx?.close]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  if (!ctx) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            role="presentation"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal
            aria-label="Keyboard shortcuts"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-72 border-l border-slate-700 bg-slate-900/95 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200">
                ⌨️ Shortcuts
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Sluiten"
              >
                Esc
              </button>
            </div>
            <div className="grid gap-3">
              {SHORTCUTS.map(({ keys, label }) => (
                <div
                  key={keys}
                  className={cn(
                    'flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2'
                  )}
                >
                  <span className="text-xs text-slate-300">{label}</span>
                  <kbd className="font-mono text-[11px] text-slate-400">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
