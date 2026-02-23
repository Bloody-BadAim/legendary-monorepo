const STATUS_COLORS = {
  active: '#10b981',
  setup: '#f97316',
  unused: '#64748b',
  'in-progress': '#3b82f6',
  live: '#10b981',
  todo: '#64748b',
  done: '#10b981',
  current: '#3b82f6',
  upcoming: '#64748b',
  pending: '#f97316',
} as const;

type StatusKey = keyof typeof STATUS_COLORS;

export function getStatusColor(s: string): string {
  return s in STATUS_COLORS ? STATUS_COLORS[s as StatusKey] : '#64748b';
}

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#64748b',
  done: '#10b981',
} as const;

type PriorityKey = keyof typeof PRIORITY_COLORS;

export function getPriorityColor(p: string): string {
  return p in PRIORITY_COLORS ? PRIORITY_COLORS[p as PriorityKey] : '#64748b';
}

export const NAV_TABS = [
  { label: 'Command Center', href: '/' },
  { label: 'Infrastructure', href: '/infrastructure' },
  { label: 'Tools', href: '/tools' },
  { label: 'Projects', href: '/projects' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Pomodoro', href: '/pomodoro' },
  { label: 'MCPs', href: '/mcps' },
  { label: 'Prompts', href: '/prompts' },
] as const;
