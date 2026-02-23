'use client';

import { ROADMAP } from '@/data/roadmap';
import { getStatusColor } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function RoadmapPage() {
  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-blue to-slate-600" />

      <div className="flex flex-col gap-6">
        {ROADMAP.map((week) => (
          <div key={week.week} className="relative pl-12">
            <div
              className={cn(
                'absolute left-3 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 text-[10px] text-white',
                week.status === 'done' && 'border-emerald-500 bg-emerald-500',
                week.status === 'current' &&
                  'border-accent-blue bg-accent-blue shadow-[0_0_12px_rgba(59,130,246,0.33)]',
                week.status === 'upcoming' && 'border-slate-500 bg-slate-800'
              )}
            >
              {week.status === 'done' ? '✓' : ''}
            </div>

            <div
              className={cn(
                'rounded-xl border p-4',
                week.status === 'current'
                  ? 'border-accent-blue/20 bg-accent-blue/5'
                  : 'border-border bg-white/[0.02]'
              )}
            >
              <div className="mb-3.5 flex items-center gap-2.5">
                <span
                  className="text-sm font-bold"
                  style={{ color: getStatusColor(week.status) }}
                >
                  Week {week.week}
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {week.title}
                </span>
                <span
                  className="ml-auto rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    background: `${getStatusColor(week.status)}22`,
                    color: getStatusColor(week.status),
                  }}
                >
                  {week.status}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {week.tasks.map((task) => (
                  <div key={task.task} className="flex items-center gap-2 py-1">
                    <div
                      className={cn(
                        'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[10px] text-white',
                        task.done
                          ? 'border border-emerald-500 bg-emerald-500'
                          : 'border-2 border-slate-600 bg-transparent'
                      )}
                    >
                      {task.done ? '✓' : ''}
                    </div>
                    <span
                      className={cn(
                        'text-xs',
                        task.done ? 'text-muted line-through' : 'text-slate-300'
                      )}
                    >
                      {task.task}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2.5">
                <div className="h-1 flex-1 overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full rounded transition-[width]"
                    style={{
                      width: `${Math.round(
                        (week.tasks.filter((t) => t.done).length /
                          week.tasks.length) *
                          100
                      )}%`,
                      background: getStatusColor(week.status),
                    }}
                  />
                </div>
                <span className="font-mono text-[11px] text-muted">
                  {week.tasks.filter((t) => t.done).length}/{week.tasks.length}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
