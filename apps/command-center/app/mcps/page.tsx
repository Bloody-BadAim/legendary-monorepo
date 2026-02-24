'use client';

import { useState, useEffect } from 'react';
import { MCPS } from '@/data/mcps';
import { getStatusColor } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function McpsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const connected = MCPS.filter((m) => m.status === 'connected').length;

  return (
    <div
      className={cn(
        'transition-opacity duration-300',
        mounted ? 'opacity-100' : 'opacity-0'
      )}
    >
      <p className="mb-5 text-sm text-muted">
        {connected}/{MCPS.length} Cursor MCPs (Model Context Protocol)
        connected.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MCPS.map((mcp) => (
          <div
            key={mcp.name}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-opacity-60"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: getStatusColor(mcp.status),
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: getStatusColor(mcp.status) }}
              />
              <h3 className="font-semibold text-foreground">{mcp.name}</h3>
              <span
                className="ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                style={{
                  background: `${getStatusColor(mcp.status)}22`,
                  color: getStatusColor(mcp.status),
                }}
              >
                {mcp.status}
              </span>
            </div>
            <p className="mb-1 text-xs font-medium text-muted">
              {mcp.description}
            </p>
            <p className="text-sm text-slate-300">{mcp.use}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
