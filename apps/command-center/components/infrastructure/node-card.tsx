'use client';

import { cn } from '@/lib/utils';
import type { InfraNode } from '@/types/infrastructure';

interface NodeCardProps {
  node: InfraNode;
  isHovered: boolean;
  onToggle: () => void;
}

export function NodeCard({ node, isHovered, onToggle }: NodeCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      className={cn(
        'absolute cursor-pointer rounded-xl border-2 p-3.5 transition-all duration-300',
        'min-w-[200px]',
        node.id === 'cloud' && 'min-w-[300px]',
        isHovered ? 'z-10' : 'z-[1]'
      )}
      style={{
        left: node.xPx != null ? `${node.xPx}px` : `${node.x}%`,
        top: node.yPx != null ? `${node.yPx}px` : `${node.y}%`,
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
          <div className="text-[11px] text-slate-400">{node.sub}</div>
        </div>
        {node.status === 'pending' && (
          <span className="ml-auto rounded bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-orange-400">
            PENDING
          </span>
        )}
      </div>

      {node.domains && node.domains.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {node.domains.map((d, i) => (
            <span
              key={i}
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

      {isHovered && node.services && (
        <div
          className="mt-2.5 border-t pt-2"
          style={{ borderColor: `${node.color}22` }}
        >
          {node.specs && (
            <div className="mb-1.5 text-[10px] text-slate-400">
              {node.specs}
            </div>
          )}
          {node.services.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 py-0.5 text-[11px] text-slate-300"
            >
              <div
                className="h-1 w-1 rounded-full"
                style={{ background: node.color }}
              />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
