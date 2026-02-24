'use client';

import type { InfraConnection } from '@/types/infrastructure';

/** Logical positions (0–100) for connection SVG, matching grid layout. */
export const NODE_VIEWBOX_POSITIONS: Record<string, { x: number; y: number }> =
  {
    cloudflare: { x: 50, y: 12 },
    matmat: { x: 50, y: 50 },
    powerhouse: { x: 22, y: 82 },
    local: { x: 78, y: 82 },
  };

const CONNECTION_COLORS: Record<string, string> = {
  https: '#f97316',
  tunnel: '#8b5cf6',
  internal: '#64748b',
};

interface InfrastructureConnectionsProps {
  connections: InfraConnection[];
  hoveredNode: string | null;
}

export function InfrastructureConnections({
  connections,
  hoveredNode,
}: InfrastructureConnectionsProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker
          id="arrow-https"
          markerWidth="4"
          markerHeight="4"
          refX="3"
          refY="2"
          orient="auto"
        >
          <path d="M0,0 L4,2 L0,4 Z" fill="#f97316" />
        </marker>
        <marker
          id="arrow-tunnel"
          markerWidth="4"
          markerHeight="4"
          refX="3"
          refY="2"
          orient="auto"
        >
          <path d="M0,0 L4,2 L0,4 Z" fill="#8b5cf6" />
        </marker>
        <marker
          id="arrow-internal"
          markerWidth="4"
          markerHeight="4"
          refX="3"
          refY="2"
          orient="auto"
        >
          <path d="M0,0 L4,2 L0,4 Z" fill="#64748b" />
        </marker>
      </defs>
      {connections.map((conn, i) => {
        const fromPos = NODE_VIEWBOX_POSITIONS[conn.from];
        const toPos = NODE_VIEWBOX_POSITIONS[conn.to];
        if (!fromPos || !toPos) return null;

        const color =
          CONNECTION_COLORS[conn.type] ?? CONNECTION_COLORS.internal;
        const markerId = `arrow-${conn.type}`;
        const isHighlight =
          hoveredNode === conn.from || hoveredNode === conn.to;
        const opacity = hoveredNode
          ? isHighlight
            ? 1
            : 0.2
          : conn.type === 'https'
            ? 0.7
            : 0.5;

        return (
          <line
            key={`${conn.from}-${conn.to}-${i}`}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={color}
            strokeWidth="0.4"
            strokeDasharray="2 1.5"
            strokeLinecap="round"
            opacity={opacity}
            markerEnd={`url(#${markerId})`}
            className="infra-line transition-opacity duration-200"
            style={{ animation: 'infra-dash 1.2s linear infinite' }}
          />
        );
      })}
    </svg>
  );
}
