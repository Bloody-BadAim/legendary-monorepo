'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProgressBar } from '@/components/dashboard/progress-bar';
import { RevenueEntryForm } from '@/components/dashboard/revenue-entry-form';
import {
  REVENUE_ENTRIES,
  REVENUE_TARGET,
  REVENUE_PERIOD,
  type RevenueEntry,
} from '@/data/revenue';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'command-center-revenue-entries';
const REVENUE_BAR_COLOR = '#f97316';

function getLocalStorageEntries(): RevenueEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function statusColor(status: RevenueEntry['status']): string {
  switch (status) {
    case 'paid':
      return 'text-emerald-400';
    case 'invoiced':
      return 'text-blue-400';
    case 'pending':
      return 'text-amber-400';
  }
}

function statusLabel(status: RevenueEntry['status']): string {
  switch (status) {
    case 'paid':
      return 'Betaald';
    case 'invoiced':
      return 'Gefactureerd';
    case 'pending':
      return 'Openstaand';
  }
}

export function RevenueTracker() {
  const [entries, setEntries] = useState<RevenueEntry[]>(() => [
    ...REVENUE_ENTRIES,
    ...getLocalStorageEntries(),
  ]);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(() => {
    setEntries([...REVENUE_ENTRIES, ...getLocalStorageEntries()]);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const current = entries.reduce((sum, e) => sum + e.amount, 0);
  const remaining = Math.max(0, REVENUE_TARGET - current);
  const percent =
    REVENUE_TARGET > 0 ? Math.min(100, (current / REVENUE_TARGET) * 100) : 0;
  const targetReached = percent >= 100;
  const lastEntries = entries.slice(-3).reverse();

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="text-lg">💰</span> Revenue Tracker
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
            showForm
              ? 'border-slate-600 bg-slate-700 text-slate-200'
              : 'border-border bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          )}
          aria-label={showForm ? 'Formulier verbergen' : 'Entry toevoegen'}
        >
          +
        </button>
      </div>

      <div className="mb-3 flex items-baseline justify-between gap-4">
        <div className="font-mono text-2xl font-bold text-slate-100">
          €{current} <span className="text-slate-500">/ €{REVENUE_TARGET}</span>
        </div>
        <span
          className="shrink-0 rounded-md bg-slate-800 px-2 py-1 font-mono text-sm font-medium text-slate-200"
          aria-label={`${Math.round(percent)}% van doel`}
        >
          {Math.round(percent)}%
        </span>
      </div>

      <div className="mb-4">
        <ProgressBar value={percent} color={REVENUE_BAR_COLOR} />
      </div>

      <p className="mb-4 text-sm text-slate-400">
        {targetReached ? (
          <span className="text-emerald-400">🎉 Target behaald!</span>
        ) : (
          <>Nog €{remaining} te gaan</>
        )}
        <span className="text-slate-500"> · {REVENUE_PERIOD}</span>
      </p>

      {lastEntries.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            Laatste entries
          </p>
          <ul className="space-y-2">
            {lastEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate text-slate-300">
                  {entry.client} · {entry.service}
                </span>
                <span className={statusColor(entry.status)}>
                  €{entry.amount} · {statusLabel(entry.status)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showForm && <RevenueEntryForm onSubmitted={refresh} />}
    </div>
  );
}
