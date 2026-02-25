'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_TABS } from '@/lib/constants';

export interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  action: () => void;
  keywords?: string[];
}

type CommandPaletteContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const CommandPaletteContext =
  React.createContext<CommandPaletteContextValue | null>(null);

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesQuery(item: PaletteItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = normalize(query);
  const label = normalize(item.label);
  if (label.includes(q)) return true;
  if (item.keywords?.some((k) => normalize(k).includes(q))) return true;
  if (item.description && normalize(item.description).includes(q)) return true;
  return false;
}

const NAV_ICONS: Record<string, string> = {
  'Command Center': '⚡',
  Infrastructure: '🏗️',
  Tools: '🛠️',
  Projects: '📁',
  Roadmap: '🗺️',
  Todo: '✅',
  Pomodoro: '🍅',
  MCPs: '🔌',
  Prompts: '💬',
  '🔍 Audit': '🔍',
  '🧠 Intake': '🧠',
};

export function CommandPalette() {
  const router = useRouter();
  const ctx = React.useContext(CommandPaletteContext);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isOpen = ctx?.isOpen ?? false;
  const close = React.useMemo(() => ctx?.close ?? (() => {}), [ctx?.close]);

  const navItems: PaletteItem[] = useMemo(
    () =>
      NAV_TABS.map(({ label, href }) => ({
        id: `nav-${href}`,
        label: label.replace(/^🔍\s*/, '').trim() || label,
        description: href,
        icon: NAV_ICONS[label] ?? '📄',
        action: () => {
          router.push(href);
          close();
        },
        keywords: [href, label],
      })),
    [router, close]
  );

  const actionItems: PaletteItem[] = useMemo(
    () => [
      {
        id: 'action-audit',
        label: 'Run Notion Audit',
        icon: '🔍',
        action: () => {
          router.push('/notion-audit');
          close();
        },
        keywords: ['audit', 'notion'],
      },
      {
        id: 'action-pomodoro',
        label: 'Start Pomodoro',
        icon: '🍅',
        action: () => {
          router.push('/pomodoro');
          close();
        },
        keywords: ['pomodoro', 'focus'],
      },
      {
        id: 'action-new-task',
        label: 'Nieuwe taak toevoegen',
        icon: '➕',
        action: () => {
          router.push('/todo');
          close();
        },
        keywords: ['taak', 'todo', 'nieuw'],
      },
    ],
    [router, close]
  );

  const allItems = useMemo(
    () => [
      { section: 'NAVIGATIE', items: navItems },
      { section: 'ACTIES', items: actionItems },
    ],
    [navItems, actionItems]
  );

  const flatFiltered = useMemo(() => {
    const out: PaletteItem[] = [];
    const q = query.trim();
    for (const { items } of allItems) {
      for (const item of items) {
        if (matchesQuery(item, q)) out.push(item);
      }
    }
    return out;
  }, [allItems, query]);

  const currentItem = flatFiltered[selectedIndex] ?? null;

  const resetSelection = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatFiltered.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) =>
          flatFiltered.length
            ? (i - 1 + flatFiltered.length) % flatFiltered.length
            : 0
        );
        return;
      }
      if (e.key === 'Enter' && currentItem) {
        e.preventDefault();
        currentItem.action();
        return;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, flatFiltered, currentItem]);

  if (!ctx) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            role="presentation"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            aria-hidden
          />
          <div
            className="fixed inset-0 z-50 flex justify-center pt-[20vh]"
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-modal
              aria-label="Command palette"
              className="max-w-lg w-full mx-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-slate-700/50">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') close();
                  }}
                  className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none border-0 border-b border-slate-700/50 focus:border-slate-600"
                  placeholder="Zoek pagina's, taken, acties..."
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <div className="max-h-[60vh] overflow-y-auto py-2">
                {allItems.map(({ section, items }) => {
                  const sectionFiltered = items.filter((it) =>
                    matchesQuery(it, query)
                  );
                  if (sectionFiltered.length === 0) return null;
                  return (
                    <div key={section} className="px-2 pb-2">
                      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {section}
                      </p>
                      <ul className="space-y-0.5">
                        {sectionFiltered.map((item) => {
                          const idx = flatFiltered.indexOf(item);
                          const isSelected = idx === selectedIndex;
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  resetSelection();
                                  item.action();
                                }}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                  isSelected
                                    ? 'bg-slate-700/60 text-slate-100'
                                    : 'text-slate-300 hover:bg-slate-800/60'
                                )}
                              >
                                <span className="text-base" aria-hidden>
                                  {item.icon}
                                </span>
                                <span className="font-medium">
                                  {item.label}
                                </span>
                                {item.description && (
                                  <span className="ml-auto text-xs text-slate-500 truncate max-w-[140px]">
                                    {item.description}
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
                {flatFiltered.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">
                    Geen resultaten voor &quot;{query}&quot;
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
