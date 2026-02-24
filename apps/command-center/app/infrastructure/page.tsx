'use client';

import { useState, useMemo, useEffect } from 'react';
import { NodeCard } from '@/components/infrastructure/node-card';
import { InfrastructureConnections } from '@/components/infrastructure/infra-connections';
import { INFRA_NODES, INFRA_CONNECTIONS } from '@/data/infrastructure';
import { useHealthCheck } from '@/hooks/use-health-check';
import type { HealthStatus } from '@/hooks/use-health-check';

function getNodeHealthStatus(
  nodeId: string,
  healthMap: Map<string, { status: HealthStatus; latency: number }>
): HealthStatus | null {
  const idsByNode: Record<string, string[]> = {
    cloudflare: [],
    matmat: ['matmat-web'],
    powerhouse: [],
    local: ['ollama', 'litellm', 'postgres', 'n8n-local', 'command-center'],
  };
  const ids = idsByNode[nodeId];
  if (!ids?.length) return null;
  let hasOnline = false;
  let hasChecking = false;
  for (const id of ids) {
    const h = healthMap.get(id);
    if (!h) continue;
    if (h.status === 'online') hasOnline = true;
    if (h.status === 'checking') hasChecking = true;
  }
  if (hasOnline) return 'online';
  if (hasChecking) return 'checking';
  return 'offline';
}

function getConnectedNodeIds(nodeId: string): Set<string> {
  const set = new Set<string>([nodeId]);
  for (const c of INFRA_CONNECTIONS) {
    if (c.from === nodeId) set.add(c.to);
    if (c.to === nodeId) set.add(c.from);
  }
  return set;
}

export default function InfrastructurePage() {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const healthMap = useHealthCheck();

  useEffect(() => setMounted(true), []);

  const highlightNode = hoveredNode ?? expandedNode;
  const connectedIds = useMemo(
    () => (highlightNode ? getConnectedNodeIds(highlightNode) : null),
    [highlightNode]
  );

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
        <p className="mb-6 text-center text-xs text-muted md:mb-8">
          Klik op een node voor details · Hover voor verbindingen
        </p>

        <div className="relative min-h-[360px] md:min-h-[440px]">
          {/* SVG only after mount to avoid hydration mismatch (defs/marker/path) */}
          {mounted && (
            <div className="absolute inset-0 hidden md:block">
              <InfrastructureConnections
                connections={INFRA_CONNECTIONS}
                hoveredNode={highlightNode}
              />
            </div>
          )}

          {/* Grid of node cards */}
          <div className="infra-grid relative grid w-full gap-4 px-2 md:gap-6 md:px-4">
            {INFRA_NODES.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-center"
                style={{ gridArea: node.id }}
              >
                <NodeCard
                  node={node}
                  isHovered={
                    hoveredNode === node.id || expandedNode === node.id
                  }
                  isDimmed={
                    highlightNode != null &&
                    connectedIds !== null &&
                    !connectedIds.has(node.id)
                  }
                  onToggle={() =>
                    setExpandedNode(expandedNode === node.id ? null : node.id)
                  }
                  onHover={(hover) => setHoveredNode(hover ? node.id : null)}
                  healthMap={healthMap}
                  nodeStatus={getNodeHealthStatus(node.id, healthMap)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
