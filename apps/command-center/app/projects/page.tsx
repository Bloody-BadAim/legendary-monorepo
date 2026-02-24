'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProjectCard } from '@/components/dashboard/project-card';
import { useNotionProjects } from '@/hooks/use-notion-projects';
import { PROJECTS } from '@/data/projects';
import { Button } from '@/components/ui/button';
import type { ProjectItem } from '@/types/project';

function notionStatusToProjectStatus(s: string): ProjectItem['status'] {
  if (s === 'In progress') return 'in-progress';
  if (s === 'Done') return 'live';
  return 'todo';
}

/** Static projecten eerst (met Notion status/progress waar naam matcht), daarna Notion-only. */
function mergeNotionWithStatic(
  notionProjects: {
    id: string;
    name: string;
    status: string;
    progress: number;
  }[]
): ProjectItem[] {
  const notionByName = new Map(
    notionProjects.map((np) => [np.name.toLowerCase(), np])
  );
  const staticWithOverlay: ProjectItem[] = PROJECTS.map((sp) => {
    const np = notionByName.get(sp.name.toLowerCase());
    if (!np) return sp;
    return {
      ...sp,
      status: notionStatusToProjectStatus(np.status),
      progress: np.progress,
    };
  });
  const notionOnly = notionProjects.filter(
    (np) =>
      !PROJECTS.some((s) => s.name.toLowerCase() === np.name.toLowerCase())
  );
  const notionOnlyItems: ProjectItem[] = notionOnly.map((np) => ({
    name: np.name,
    slug: np.name.toLowerCase().replace(/\s+/g, '-'),
    status: notionStatusToProjectStatus(np.status),
    progress: np.progress,
    description: '',
    tech: [],
    revenue: '—',
    priority: 'medium' as const,
    location: '',
  }));
  return [...staticWithOverlay, ...notionOnlyItems];
}

type SyncStatus = 'idle' | 'loading' | 'ok' | 'error';

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  useEffect(() => setMounted(true), []);

  const { projects: notionProjects, fromNotion, mutate } = useNotionProjects();
  const projects: ProjectItem[] = fromNotion
    ? mergeNotionWithStatic(notionProjects)
    : PROJECTS;

  const syncToNotion = useCallback(async () => {
    setSyncStatus('loading');
    setSyncMessage('');
    try {
      const res = await fetch('/api/notion/sync-projects', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setSyncStatus('error');
        setSyncMessage(data.error ?? 'Sync mislukt');
        return;
      }
      setSyncStatus('ok');
      setSyncMessage(data.message ?? 'Gesynced');
      void mutate();
    } catch (e) {
      setSyncStatus('error');
      setSyncMessage(e instanceof Error ? e.message : 'Sync mislukt');
    }
  }, [mutate]);

  return (
    <div className="flex flex-col gap-3.5">
      {fromNotion && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          Live data from Notion • Projecten uit je Second Brain database
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={syncToNotion}
          disabled={syncStatus === 'loading'}
        >
          {syncStatus === 'loading' ? 'Bezig…' : 'Sync projecten naar Notion'}
        </Button>
        {syncStatus === 'ok' && (
          <span className="text-xs text-emerald-400">{syncMessage}</span>
        )}
        {syncStatus === 'error' && (
          <span className="text-xs text-red-400">{syncMessage}</span>
        )}
      </div>
      {projects.map((proj) => (
        <ProjectCard key={proj.name} project={proj} mounted={mounted} />
      ))}
    </div>
  );
}
