'use client';

import { useState, useEffect } from 'react';
import {
  Workflow,
  Zap,
  BookOpen,
  Github,
  Globe,
  Brain,
  Cpu,
  Triangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const QUICK_ACTIONS = [
  {
    label: 'n8n',
    href: 'https://n8n.matmat.me',
    icon: Workflow,
    color: '#ea580c',
  },
  {
    label: 'n8n Local',
    href: 'http://localhost:5678',
    icon: Zap,
    color: '#f97316',
  },
  {
    label: 'Notion',
    href: 'https://notion.so',
    icon: BookOpen,
    color: '#ffffff',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/Bloody-BadAim',
    icon: Github,
    color: '#e2e8f0',
  },
  {
    label: 'matmat.me',
    href: 'https://matmat.me',
    icon: Globe,
    color: '#06b6d4',
  },
  {
    label: 'LiteLLM',
    href: 'http://localhost:4000/ui',
    icon: Brain,
    color: '#8b5cf6',
  },
  {
    label: 'Ollama',
    href: 'http://localhost:11434',
    icon: Cpu,
    color: '#10b981',
  },
  {
    label: 'Vercel',
    href: 'https://vercel.com/dashboard',
    icon: Triangle,
    color: '#ffffff',
  },
] as const satisfies ReadonlyArray<{
  label: string;
  href: string;
  icon: LucideIcon;
  color: string;
}>;

export function QuickActions() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex gap-2 pb-2">
        <div className="h-[4.5rem] min-w-[4.5rem] rounded-xl bg-slate-800/50 animate-pulse" />
        <div className="h-[4.5rem] min-w-[4.5rem] rounded-xl bg-slate-800/50 animate-pulse" />
        <div className="h-[4.5rem] min-w-[4.5rem] rounded-xl bg-slate-800/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 scroll-smooth scrollbar-thin md:flex-wrap md:snap-none md:overflow-visible">
      {QUICK_ACTIONS.map(({ label, href, icon: Icon, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-[4.5rem] snap-center flex-shrink-0 flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-3 transition-[border-color,box-shadow] hover:border-[var(--quick-action-color)] hover:shadow-[0_0_12px_var(--quick-action-glow)] md:min-w-0"
          style={
            {
              ['--quick-action-color']: color,
              ['--quick-action-glow']: `${color}40`,
            } as React.CSSProperties
          }
          aria-label={label}
        >
          <Icon
            size={20}
            className="text-slate-300"
            style={{ color }}
            aria-hidden
          />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
            {label}
          </span>
        </a>
      ))}
    </div>
  );
}
