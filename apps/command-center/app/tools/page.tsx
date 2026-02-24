'use client';

import { useState } from 'react';
import { CategoryFilter } from '@/components/tools/category-filter';
import { ToolCard } from '@/components/tools/tool-card';
import { TOOL_CATEGORIES } from '@/data/tools';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'active' | 'setup' | 'unused';

export default function ToolsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const totalTools = TOOL_CATEGORIES.reduce((a, c) => a + c.tools.length, 0);
  const activeTools = TOOL_CATEGORIES.reduce(
    (a, c) => a + c.tools.filter((t) => t.status === 'active').length,
    0
  );
  const unusedTools = TOOL_CATEGORIES.reduce(
    (a, c) => a + c.tools.filter((t) => t.status === 'unused').length,
    0
  );

  const filteredCategories = TOOL_CATEGORIES.map((cat) => ({
    ...cat,
    tools:
      filterStatus === 'all'
        ? cat.tools
        : cat.tools.filter((t) => t.status === filterStatus),
  })).filter((cat) => cat.tools.length > 0);

  return (
    <div>
      <CategoryFilter
        value={filterStatus}
        onChange={setFilterStatus}
        counts={{ total: totalTools, active: activeTools, unused: unusedTools }}
      />

      <div className="flex flex-col gap-4">
        {filteredCategories.map((cat, ci) => (
          <div
            key={cat.name}
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: `${cat.color}22` }}
          >
            <button
              type="button"
              onClick={() =>
                setSelectedCategory(selectedCategory === ci ? null : ci)
              }
              className={cn(
                'flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors',
                selectedCategory === ci ? 'bg-white/5' : 'bg-transparent'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{cat.icon}</span>
                <span className="text-sm font-semibold text-slate-200">
                  {cat.name}
                </span>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: cat.color }}
                >
                  {cat.tools.length}
                </span>
              </div>
              <span
                className={cn(
                  'text-lg text-slate-500 transition-transform duration-200',
                  selectedCategory === ci ? 'rotate-180' : 'rotate-0'
                )}
              >
                ▾
              </span>
            </button>

            {selectedCategory === ci && (
              <div className="grid grid-cols-1 gap-2 border-t border-border bg-slate-900/20 p-4 md:grid-cols-2">
                {cat.tools.map((tool) => (
                  <ToolCard
                    key={tool.name}
                    name={tool.name}
                    status={tool.status}
                    description={tool.description}
                    link={tool.link}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
