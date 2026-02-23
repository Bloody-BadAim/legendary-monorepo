'use client';

import { useState, useEffect } from 'react';
import { MCPS } from '@/data/mcps';

export default function McpsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={
        mounted ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'
      }
    >
      <p className="mb-5 text-sm text-muted">
        Mijn 6 Cursor MCPs (Model Context Protocol) – gekoppeld aan dit project.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MCPS.map((mcp) => (
          <div
            key={mcp.name}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-opacity-60"
            style={{ borderLeftWidth: 4, borderLeftColor: mcp.color }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">{mcp.icon}</span>
              <h3 className="font-semibold text-foreground">{mcp.name}</h3>
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
