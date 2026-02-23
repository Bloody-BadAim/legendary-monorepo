'use client';

import { cn } from '@/lib/utils';

interface TaskItem {
  task: string;
  done: boolean;
}

interface TaskListProps {
  tasks: TaskItem[];
  maxItems?: number;
  className?: string;
  mounted?: boolean;
}

export function TaskList({
  tasks,
  maxItems = 5,
  className,
  mounted = true,
}: TaskListProps) {
  const items = tasks.slice(0, maxItems);

  return (
    <ul className={cn('space-y-0', className)}>
      {items.map((item, i) => (
        <li
          key={i}
          className={cn(
            'flex items-center gap-2.5 border-b border-border py-2 transition-opacity duration-300',
            mounted ? 'opacity-100' : 'opacity-0'
          )}
          style={{ transitionDelay: `${300 + i * 80}ms` }}
        >
          <div
            className={cn(
              'h-[18px] w-[18px] flex-shrink-0 rounded border-2 flex items-center justify-center text-[10px]',
              item.done
                ? 'border-emerald-500 bg-emerald-500/20'
                : 'border-accent-blue'
            )}
          >
            {item.done ? '✓' : ''}
          </div>
          <span className="text-sm text-slate-200">{item.task}</span>
        </li>
      ))}
    </ul>
  );
}
