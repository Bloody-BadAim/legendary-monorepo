import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
  className?: string;
  delay?: number;
  mounted?: boolean;
}

export function StatCard({
  label,
  value,
  color,
  subtitle,
  className,
  delay = 0,
  mounted = true,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card p-3 transition-all duration-300 sm:p-5',
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className
      )}
      style={{
        borderColor: `${color}33`,
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div
        className="font-mono text-xl font-bold sm:text-2xl"
        style={{ color }}
      >
        {value}
      </div>
      {subtitle && <div className="mt-0.5 text-xs text-muted">{subtitle}</div>}
    </div>
  );
}
