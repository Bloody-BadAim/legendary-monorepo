'use client';

import { cn } from '@/lib/utils';

interface TaskStatsProps {
  total: number;
  done: number;
  overdue: number;
  className?: string;
}

export function TaskStats({ total, done, overdue, className }: TaskStatsProps) {
  const remaining = total - done;
  return (
    <div
      className={cn(
        'flex flex-wrap gap-3 rounded-lg border border-border bg-card px-4 py-3',
        className
      )}
    >
      <span className="text-sm text-muted">
        Totaal: <strong className="text-foreground">{total}</strong>
      </span>
      <span className="text-sm text-muted">
        Open: <strong className="text-foreground">{remaining}</strong>
      </span>
      <span className="text-sm text-emerald-500/90">
        Done: <strong>{done}</strong>
      </span>
      {overdue > 0 && (
        <span className="text-sm text-accent-red">
          Overdue: <strong>{overdue}</strong>
        </span>
      )}
    </div>
  );
}
