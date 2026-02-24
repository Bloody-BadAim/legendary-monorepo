'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { NotionTaskItem } from '@/types/notion';

const PRIORITY_COLORS: Record<string, string> = {
  'High Priority': 'bg-accent-red/20 text-accent-red border-accent-red/40',
  'Medium Priority':
    'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/40',
  'Low Priority': 'bg-slate-500/20 text-slate-400 border-slate-500/40',
};

type StatusChangeHandler = (taskId: string, newStatus: string) => Promise<void>;

interface TaskCardProps {
  task: NotionTaskItem;
  onStatusChange: StatusChangeHandler;
}

function formatDueDate(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year:
        d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return iso;
  }
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  try {
    const d = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today;
  } catch {
    return false;
  }
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const [updating, setUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState(task.status);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === localStatus) return;
    setUpdating(true);
    setLocalStatus(newStatus);
    try {
      await onStatusChange(task.id, newStatus);
    } catch {
      setLocalStatus(task.status);
    } finally {
      setUpdating(false);
    }
  };

  const overdue = isOverdue(task.dueDate);
  const priorityClass =
    PRIORITY_COLORS[task.priority ?? ''] ??
    'bg-slate-500/20 text-slate-400 border-slate-500/40';

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 transition-opacity',
        task.done && 'opacity-70',
        updating && 'opacity-60'
      )}
    >
      <select
        value={localStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={updating}
        className="rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue"
        aria-label={`Status voor ${task.task}`}
      >
        <option value="Not started">Niet gestart</option>
        <option value="In progress">Bezig</option>
        <option value="Done">Klaar</option>
      </select>
      <span
        className={cn(
          'flex-1 text-sm text-slate-200',
          task.done && 'line-through text-muted'
        )}
      >
        {task.task}
      </span>
      {task.priority && (
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 text-[10px] font-medium',
            priorityClass
          )}
        >
          {task.priority.replace(' Priority', '')}
        </span>
      )}
      {task.dueDate && (
        <span
          className={cn(
            'text-xs',
            overdue ? 'text-accent-red font-medium' : 'text-muted'
          )}
          title={task.dueDate}
        >
          {formatDueDate(task.dueDate)}
          {overdue ? ' (overdue)' : ''}
        </span>
      )}
    </li>
  );
}
