'use client';

import { cn } from '@/lib/utils';
import type { InfraNode } from '@/types/infrastructure';

interface NodeCardProps {
  node: InfraNode;
  isHovered: boolean;
  onToggle: () => void;
}

const STATUS_LABELS: Record<string, { text: string; bg: string; fg: string }> =
  {
    pending: { text: 'PENDING', bg: 'bg-orange-500/20', fg: 'text-orange-400' },
    dev: { text: 'DEV', bg: 'bg-emerald-500/20', fg: 'text-emerald-400' },
  };

const NODE_POSITIONS: Record<string, { x: string; y: string }> = {
  cloudflare: { x: '594px', y: '-21px' },
  matmat: { x: '584px', y: '135px' },
  powerhouse: { x: '15%', y: '58%' },
  local: { x: '85%', y: '58%' },
};

export function NodeCard({ node, isHovered, onToggle }: NodeCardProps) {
  const pos = NODE_POSITIONS[node.id] ?? { x: '50%', y: '50%' };
  const badge = STATUS_LABELS[node.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      className={cn(
        'absolute cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-300',
        'min-w-[200px]',
        node.id === 'cloudflare' && 'min-w-[300px]',
        isHovered ? 'z-10' : 'z-[1]'
      )}
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, 0)',
        background: isHovered ? `${node.color}15` : 'rgba(15,23,42,0.9)',
        borderColor: isHovered ? node.color : `${node.color}44`,
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xl">{node.icon}</span>
        <div>
          <div
            className="font-mono text-[13px] font-bold"
            style={{ color: node.color }}
          >
            {node.label}
          </div>
          <div className="text-[11px] text-slate-400">{node.subtitle}</div>
        </div>
        {badge && (
          <span
            className={cn(
              'ml-auto rounded px-1.5 py-0.5 text-[9px] font-semibold',
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
          {node.services.map((s) => (
            <div
              key={s}
              className="flex items-center gap-1.5 py-0.5 text-[11px] text-slate-300"
            >
              <div
                className="h-1 w-1 rounded-full"
                style={{ background: node.color }}
              />
              {s}
            </div>
          ))}
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
