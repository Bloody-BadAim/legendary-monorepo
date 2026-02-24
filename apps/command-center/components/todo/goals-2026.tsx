'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GOALS_2026 } from '@/data/goals-2026';

export function Goals2026() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('goals-2026');
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const handleToggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (typeof window !== 'undefined') {
        localStorage.setItem('goals-2026', JSON.stringify(next));
      }
      return next;
    });
  };

  const doneCount = GOALS_2026.filter((g) => checked[g.id]).length;
  const total = GOALS_2026.length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="text-lg">🎯</span> Goede voornemens 2026
      </h2>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-purple transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mb-4 text-xs text-muted">
        {doneCount}/{total} – {progress}%
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GOALS_2026.map((goal) => (
          <li key={goal.id}>
            <label
              style={mounted ? undefined : { opacity: 0.8 }}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border py-2 px-3 transition-colors',
                checked[goal.id]
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-border bg-white/5 text-slate-300 hover:bg-white/10'
              )}
            >
              <input
                type="checkbox"
                checked={!!checked[goal.id]}
                onChange={() => handleToggle(goal.id)}
                className="h-4 w-4 rounded border-border accent-accent-blue"
              />
              <span className="text-sm font-medium">{goal.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
