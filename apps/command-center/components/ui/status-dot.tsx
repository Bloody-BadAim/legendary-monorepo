'use client';

import { cn } from '@/lib/utils';

export type StatusDotStatus = 'online' | 'offline' | 'checking';

interface StatusDotProps {
  status: StatusDotStatus;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'h-2 w-2 shrink-0 rounded-full',
        status === 'online' && 'bg-emerald-500 animate-pulse',
        status === 'offline' && 'bg-red-500',
        status === 'checking' && 'bg-yellow-500 animate-pulse',
        className
      )}
      aria-label={status}
    />
  );
}
