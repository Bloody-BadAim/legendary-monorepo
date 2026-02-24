'use client';

import { cn } from '@/lib/utils';
import { StatusDot } from '@/components/ui/status-dot';
import type { InfraNode } from '@/types/infrastructure';
import type { HealthStatus } from '@/hooks/use-health-check';

interface NodeCardProps {
  node: InfraNode;
  isHovered: boolean;
  isDimmed: boolean;
  onToggle: () => void;
  onHover: (hover: boolean) => void;
  healthMap?: Map<string, { status: HealthStatus; latency: number }>;
  nodeStatus?: HealthStatus | null;
}

function getHealthIdForService(
  nodeId: string,
  serviceLabel: string
): string | null {
  const s = serviceLabel.toLowerCase();
  if (s.includes('ollama')) return 'ollama';
  if (s.includes('litellm')) return 'litellm';
  if (s.includes('postgresql')) return 'postgres';
  if (
    s.includes('next.js') ||
    s.includes('command center') ||
    s.includes('dev servers')
  )
    return 'command-center';
  if (s.includes('n8n')) return nodeId === 'local' ? 'n8n-local' : 'n8n-remote';
  if (s.includes('caddy') || s.includes('matmat.me') || s.includes('static'))
    return 'matmat-web';
  return null;
}

const STATUS_LABELS: Record<string, { text: string; bg: string; fg: string }> =
  {
    pending: { text: 'PENDING', bg: 'bg-orange-500/20', fg: 'text-orange-400' },
    dev: { text: 'DEV', bg: 'bg-emerald-500/20', fg: 'text-emerald-400' },
  };

export function NodeCard({
  node,
  isHovered,
  isDimmed,
  onToggle,
  onHover,
  healthMap,
  nodeStatus,
}: NodeCardProps) {
  const badge = STATUS_LABELS[node.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn(
        'cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-300',
        'min-w-0',
        isHovered && 'z-10',
        isDimmed && 'opacity-30',
        node.id === 'cloudflare' && 'min-w-[200px] md:min-w-[280px]'
      )}
      style={{
        background: isHovered ? `${node.color}15` : 'rgba(15,23,42,0.9)',
        borderColor: isHovered ? node.color : `${node.color}44`,
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xl">{node.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[13px] font-bold"
              style={{ color: node.color }}
            >
              {node.label}
            </span>
            {nodeStatus != null && (
              <StatusDot status={nodeStatus} className="shrink-0" />
            )}
          </div>
          <div className="text-[11px] text-slate-400">{node.subtitle}</div>
        </div>
        {badge && (
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold',
              badge.bg,
              badge.fg
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {node.domains && node.domains.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {node.domains.map((d) => (
            <span
              key={d}
              className="rounded px-2 py-0.5 font-mono text-[10px]"
              style={{
                background: `${node.color}15`,
                color: node.color,
              }}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {isHovered && (
        <div
          className="mt-2.5 border-t pt-2"
          style={{ borderColor: `${node.color}22` }}
        >
          {node.specs && (
            <div className="mb-1.5 text-[10px] text-slate-400">
              {node.specs}
            </div>
          )}
          {node.ip && (
            <div className="mb-1.5 font-mono text-[10px] text-slate-500">
              {node.ip}
            </div>
          )}
          {node.services.map((s) => {
            const healthId = getHealthIdForService(node.id, s);
            const health = healthId && healthMap?.get(healthId);
            return (
              <div
                key={s}
                className="flex items-center gap-1.5 py-0.5 text-[11px] text-slate-300"
              >
                {health ? (
                  <StatusDot status={health.status} />
                ) : (
                  <div
                    className="h-1 w-1 shrink-0 rounded-full"
                    style={{ background: node.color }}
                  />
                )}
                {s}
              </div>
            );
          })}
          {node.ports && node.ports.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {node.ports.map((p) => (
                <span
                  key={p}
                  className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-slate-500"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
