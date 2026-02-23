'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_TABS } from '@/lib/constants';

export function TabNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 rounded-lg bg-white/5 p-1"
      aria-label="Command Center sections"
    >
      {NAV_TABS.map(({ label, href }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors',
              isActive
                ? 'bg-accent-blue text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
