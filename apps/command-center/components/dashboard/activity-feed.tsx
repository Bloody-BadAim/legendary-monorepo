'use client';

import { useState, useEffect, useCallback } from 'react';

type ActivityItem =
  | { type: 'commit'; message: string; date: string; sha: string }
  | { type: 'task'; message: string; date: string; status: string };

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (day >= 1) return day === 1 ? 'gisteren' : `${day} dagen geleden`;
  if (hour >= 1) return `${hour} uur geleden`;
  if (min >= 1) return `${min} min geleden`;
  return 'zojuist';
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trim() + '…';
}

function getIcon(item: ActivityItem): string {
  if (item.type === 'commit') return '🔨';
  if (item.type === 'task') {
    return item.status === 'Done' ? '✅' : '📝';
  }
  return '•';
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/activity');
      if (!res.ok) return;
      const data = (await res.json()) as { items: ActivityItem[] };
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    if (!fetchActivity) return;
    const interval = setInterval(fetchActivity, 60_000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="text-lg">📰</span> Recent Activity
      </h2>

      {loading && (
        <ul className="space-y-0">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="border-b border-border py-2 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-slate-700/50" />
              <div className="mt-1 h-3 w-16 rounded bg-slate-700/30" />
            </li>
          ))}
        </ul>
      )}

      {!loading && items !== null && items.length === 0 && (
        <p className="py-4 text-sm text-muted">Nog geen activiteit gevonden</p>
      )}

      {!loading && items !== null && items.length > 0 && (
        <ul className="space-y-0">
          {items.map((item, i) => (
            <li
              key={
                item.type === 'commit' ? item.sha + item.date : item.date + i
              }
              className="border-b border-border py-2 text-sm"
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-base" aria-hidden>
                  {getIcon(item)}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-slate-200">
                    {truncate(item.message || '—', 60)}
                  </span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-muted">
                      {timeAgo(item.date)}
                    </span>
                    {item.type === 'commit' && (
                      <span className="font-mono text-[10px] text-slate-500">
                        {item.sha}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
