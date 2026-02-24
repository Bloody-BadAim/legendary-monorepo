'use client';

import { cn } from '@/lib/utils';
import type { NotionAreaItem } from '@/types/notion';
import type { NotionProjectItem } from '@/types/notion';

type Setter<T> = (value: T) => void;

interface TaskFiltersProps {
  areas: NotionAreaItem[];
  projects: NotionProjectItem[];
  selectedAreaId: string | null;
  selectedProjectId: string | null;
  selectedPriority: string | null;
  selectedStatus: string | null;
  onAreaChange: Setter<string | null>;
  onProjectChange: Setter<string | null>;
  onPriorityChange: Setter<string | null>;
  onStatusChange: Setter<string | null>;
  className?: string;
}

const PRIORITIES = [
  { value: 'High Priority', label: 'Hoog' },
  { value: 'Medium Priority', label: 'Medium' },
  { value: 'Low Priority', label: 'Laag' },
];

const STATUSES = [
  { value: 'Not started', label: 'Niet gestart' },
  { value: 'In progress', label: 'Bezig' },
  { value: 'Done', label: 'Klaar' },
];

export function TaskFilters({
  areas,
  projects,
  selectedAreaId,
  selectedProjectId,
  selectedPriority,
  selectedStatus,
  onAreaChange,
  onProjectChange,
  onPriorityChange,
  onStatusChange,
  className,
}: TaskFiltersProps) {
  const projectsInArea =
    selectedAreaId && selectedAreaId !== ''
      ? projects.filter((p) => p.areaIds.includes(selectedAreaId))
      : projects;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3',
        className
      )}
    >
      <select
        value={selectedAreaId ?? ''}
        onChange={(e) =>
          onAreaChange(e.target.value === '' ? null : e.target.value)
        }
        className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue"
        aria-label="Filter op gebied"
      >
        <option value="">Alle gebieden</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name || '(naamloos)'}
          </option>
        ))}
      </select>
      <select
        value={selectedProjectId ?? ''}
        onChange={(e) =>
          onProjectChange(e.target.value === '' ? null : e.target.value)
        }
        className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue"
        aria-label="Filter op project"
      >
        <option value="">Alle projecten</option>
        {projectsInArea.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name || '(naamloos)'}
          </option>
        ))}
      </select>
      <select
        value={selectedPriority ?? ''}
        onChange={(e) =>
          onPriorityChange(e.target.value === '' ? null : e.target.value)
        }
        className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue"
        aria-label="Filter op prioriteit"
      >
        <option value="">Alle prioriteiten</option>
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <select
        value={selectedStatus ?? ''}
        onChange={(e) =>
          onStatusChange(e.target.value === '' ? null : e.target.value)
        }
        className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue"
        aria-label="Filter op status"
      >
        <option value="">Alle statussen</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
