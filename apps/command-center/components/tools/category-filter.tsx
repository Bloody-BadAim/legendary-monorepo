'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterValue = 'all' | 'active' | 'setup' | 'unused';

interface CategoryFilterProps {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  counts: { total: number; active: number; unused: number };
}

const FILTERS: { key: FilterValue; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'active', label: 'Actief' },
  { key: 'setup', label: 'Setup' },
  { key: 'unused', label: 'Ongebruikt' },
];

export function CategoryFilter({
  value,
  onChange,
  counts,
}: CategoryFilterProps) {
  const label = (key: FilterValue) => {
    if (key === 'all') return `Alle (${counts.total})`;
    if (key === 'active') return `Actief (${counts.active})`;
    if (key === 'unused') return `Ongebruikt (${counts.unused})`;
    return 'Setup';
  };

  return (
    <div className="mb-5 flex gap-2">
      {FILTERS.map(({ key }) => (
        <Button
          key={key}
          variant={value === key ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(key)}
          className={cn(
            value === key
              ? 'bg-accent-blue text-white'
              : 'bg-white/5 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          )}
        >
          {label(key)}
        </Button>
      ))}
    </div>
  );
}
