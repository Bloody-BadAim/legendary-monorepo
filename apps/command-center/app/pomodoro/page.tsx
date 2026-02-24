'use client';

import { useState, useEffect } from 'react';
import { PomodoroTimer } from '@/components/dashboard/pomodoro-timer';
import { useNotionTasks } from '@/hooks/use-notion-tasks';
import { cn } from '@/lib/utils';

export default function PomodoroPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [promptTaskId, setPromptTaskId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => setMounted(true), []);

  const { tasks, fromNotion, mutate } = useNotionTasks();
  const selectedTask =
    selectedTaskId && fromNotion
      ? (() => {
          const t = tasks.find((x) => x.id === selectedTaskId);
          return t ? { id: t.id, name: t.task } : null;
        })()
      : null;

  const handleFocusComplete = (taskId: string | null) => {
    if (taskId) setPromptTaskId(taskId);
  };

  const handleSetInProgress = async () => {
    if (!promptTaskId) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/notion/tasks/${promptTaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In progress' }),
      });
      if (res.ok) {
        setPromptTaskId(null);
        await mutate();
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={cn(
        'max-w-md space-y-4',
        mounted ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'
      )}
    >
      {fromNotion && (
        <div className="rounded-xl border border-border bg-card p-4">
          <label
            htmlFor="pomodoro-task"
            className="mb-2 block text-xs font-medium text-muted"
          >
            Koppel aan taak (Notion)
          </label>
          <select
            id="pomodoro-task"
            value={selectedTaskId ?? ''}
            onChange={(e) =>
              setSelectedTaskId(e.target.value ? e.target.value : null)
            }
            className="w-full rounded-lg border border-border bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-accent-blue focus:outline-none"
          >
            <option value="">Geen taak gekozen</option>
            {tasks
              .filter((t) => !t.done)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.task}
                </option>
              ))}
          </select>
        </div>
      )}

      <PomodoroTimer
        selectedTask={selectedTask}
        onFocusComplete={handleFocusComplete}
      />

      {promptTaskId && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-200">
            Taak status naar &quot;In progress&quot; zetten?
          </p>
          <p className="mt-1 text-xs text-muted">
            {tasks.find((t) => t.id === promptTaskId)?.task ?? promptTaskId}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleSetInProgress}
              disabled={updating}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {updating ? 'Bezig…' : 'Ja'}
            </button>
            <button
              type="button"
              onClick={() => setPromptTaskId(null)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground"
            >
              Nee
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-muted">
        Tip: zet notificaties aan voor een melding bij einde sessie.
      </p>
    </div>
  );
}
