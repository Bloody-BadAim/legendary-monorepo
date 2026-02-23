import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  color: string;
  className?: string;
  animate?: boolean;
}

export function ProgressBar({
  value,
  color,
  className,
  animate = true,
}: ProgressBarProps) {
  return (
    <div
      className={cn('h-2 overflow-hidden rounded-md bg-slate-800', className)}
    >
      <div
        className={cn(
          'h-full rounded-md transition-[width]',
          animate ? 'duration-1000 ease-out' : ''
        )}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
        }}
      />
    </div>
  );
}
