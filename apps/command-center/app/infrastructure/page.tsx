'use client';

import { useState } from 'react';
import { NodeCard } from '@/components/infrastructure/node-card';
import { INFRA_NODES } from '@/data/infrastructure';

export default function InfrastructurePage() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="relative min-h-[500px] overflow-hidden rounded-2xl border border-border bg-[#0a0f1a] p-6">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, #1e293b 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="relative z-[1]">
        <h2 className="mb-2 text-center text-base font-bold text-slate-200">
          3-Tier Hybrid Architecture
        </h2>
        <p className="mb-8 text-center text-xs text-muted">
          Klik op een node voor details
        </p>

        <div className="relative h-[440px]">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line
              x1="50"
              y1="12"
              x2="50"
              y2="28"
              stroke="#f97316"
              strokeWidth="0.3"
              strokeDasharray="1,1"
              opacity="0.6"
            />
            <line
              x1="42"
              y1="42"
              x2="22"
              y2="58"
              stroke="#8b5cf6"
              strokeWidth="0.2"
              strokeDasharray="1,1"
              opacity="0.4"
            />
            <line
              x1="58"
              y1="42"
              x2="78"
              y2="58"
              stroke="#10b981"
              strokeWidth="0.2"
              strokeDasharray="1,1"
              opacity="0.4"
            />
            <line
              x1="32"
              y1="68"
              x2="68"
              y2="68"
              stroke="#64748b"
              strokeWidth="0.15"
              strokeDasharray="1,1"
              opacity="0.3"
            />
          </svg>

          {INFRA_NODES.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              isHovered={hoveredNode === node.id}
              onToggle={() =>
                setHoveredNode(hoveredNode === node.id ? null : node.id)
              }
            />
          ))}

          <div className="absolute left-[52%] top-[19%] font-mono text-[9px] text-orange-500 opacity-60">
            HTTPS ↓
          </div>
          <div className="absolute left-[26%] top-[49%] -rotate-30 font-mono text-[9px] text-purple-500 opacity-60">
            Tunnel
          </div>
          <div className="absolute left-[723px] top-[227px] rotate-30 font-mono text-[9px] text-emerald-500 opacity-60">
            Tunnel
          </div>
          <div className="absolute left-[46%] top-[72%] font-mono text-[9px] text-slate-500 opacity-50">
            CF Tunnel / Tailscale
          </div>
        </div>
      </div>
    </div>
  );
}
