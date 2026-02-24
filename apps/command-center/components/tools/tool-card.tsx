import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  name: string;
  status: string;
  description: string;
  link?: string;
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

export function ToolCard({
  name,
  status,
  description,
  link,
  className,
}: ToolCardProps) {
  const isExternal = link && link !== 'local' && link.startsWith('http');

  const content = (
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
      <div className="text-[11px] text-slate-400">{description}</div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return content;
}
