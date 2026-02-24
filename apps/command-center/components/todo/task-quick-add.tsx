'use client';

import { useState } from 'react';
import type { NotionProjectItem } from '@/types/notion';

interface TaskQuickAddProps {
  projects: NotionProjectItem[];
  onAdded: () => void;
  className?: string;
}

export function TaskQuickAdd({
  projects,
  onAdded,
  className,
}: TaskQuickAddProps) {
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState<string>('Medium Priority');
  const [projectId, setProjectId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = taskName.trim();
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notion/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: name,
          priority: priority || 'Medium Priority',
          projectId: projectId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Fout bij aanmaken');
        return;
      }
      setTaskName('');
      setProjectId('');
      onAdded();
    } catch {
      setError('Netwerkfout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        className
          ? `${className} rounded-lg border border-border bg-card p-3`
          : 'rounded-lg border border-border bg-card p-3'
      }
    >
      <div className="flex flex-wrap items-end gap-2">
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Nieuwe taak..."
          className="min-w-[180px] flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
          aria-label="Taaknaam"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue"
          aria-label="Prioriteit"
        >
          <option value="High Priority">Hoog</option>
          <option value="Medium Priority">Medium</option>
          <option value="Low Priority">Laag</option>
        </select>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue"
          aria-label="Project"
        >
          <option value="">Geen project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || !taskName.trim()}
          className="rounded bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? '…' : 'Toevoegen'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-accent-red" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
