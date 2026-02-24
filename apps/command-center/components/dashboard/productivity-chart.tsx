'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { NotionTaskItem } from '@/types/notion';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  'Not started': { label: 'Not started', color: '#64748b' },
  'In progress': { label: 'In progress', color: '#3b82f6' },
  Done: { label: 'Done', color: '#10b981' },
};

const DEFAULT_COLOR = '#475569';

export interface ProductivityChartProps {
  tasks: NotionTaskItem[];
}

export function ProductivityChart({ tasks }: ProductivityChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      const status =
        t.status && STATUS_CONFIG[t.status] ? t.status : 'Not started';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({
      name: STATUS_CONFIG[name]?.label ?? name,
      value,
      color: STATUS_CONFIG[name]?.color ?? DEFAULT_COLOR,
    }));
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">
          Productiviteit (status)
        </h3>
        <p className="py-8 text-center text-sm text-muted">
          Geen taken om weer te geven. Voeg taken toe in Notion of wacht op
          sync.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-200">
        Productiviteit (status)
      </h3>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(30 41 59)',
                border: '1px solid rgb(51 65 85)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value: number) => [value, 'taken']}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value, entry) => (
                <span className="text-xs text-slate-300">
                  {value}:{' '}
                  {data.find((d) => d.name === value)?.value ??
                    entry.payload?.value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
