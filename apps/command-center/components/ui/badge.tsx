import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-slate-700 text-slate-200',
        active: 'border-transparent bg-emerald-500/20 text-emerald-400',
        setup: 'border-transparent bg-orange-500/20 text-orange-400',
        unused: 'border-transparent bg-slate-600/50 text-slate-400',
        'in-progress': 'border-transparent bg-blue-500/20 text-blue-400',
        live: 'border-transparent bg-emerald-500/20 text-emerald-400',
        todo: 'border-transparent bg-slate-600/50 text-slate-400',
        done: 'border-transparent bg-emerald-500/20 text-emerald-400',
        current: 'border-transparent bg-blue-500/20 text-blue-400',
        upcoming: 'border-transparent bg-slate-600/50 text-slate-400',
        pending: 'border-transparent bg-orange-500/20 text-orange-400',
        high: 'border-transparent bg-red-500/20 text-red-400',
        medium: 'border-transparent bg-orange-500/20 text-orange-400',
        low: 'border-transparent bg-slate-600/50 text-slate-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
