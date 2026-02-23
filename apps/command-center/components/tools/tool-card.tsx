import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  name: string;
  status: string;
  use: string;
  className?: string;
}

const statusVariant = (
  s: string
): 'active' | 'setup' | 'unused' | 'default' => {
  if (s === 'active') return 'active';
  if (s === 'setup') return 'setup';
  if (s === 'unused') return 'unused';
  return 'default';
};

export function ToolCard({ name, status, use, className }: ToolCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-2.5 transition-colors hover:border-slate-600',
        'border-slate-700/50 bg-slate-900/30',
        className
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-200">{name}</span>
        <Badge variant={statusVariant(status)}>{status}</Badge>
      </div>
      <div className="text-[11px] text-slate-400">{use}</div>
    </div>
  );
}
