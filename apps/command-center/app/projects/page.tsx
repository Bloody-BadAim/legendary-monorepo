'use client';

import { useState, useEffect } from 'react';
import { ProjectCard } from '@/components/dashboard/project-card';
import { useNotionProjects } from '@/hooks/use-notion-projects';
import { PROJECTS } from '@/data/projects';
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
    status: notionStatusToProjectStatus(np.status),
    progress: np.progress,
    desc: '',
    tech: [],
    revenue: '—',
    priority: 'medium' as const,
  }));
  return [...staticWithOverlay, ...notionOnlyItems];
}

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { projects: notionProjects, fromNotion } = useNotionProjects();
  const projects: ProjectItem[] = fromNotion
    ? mergeNotionWithStatic(notionProjects)
    : PROJECTS;

  return (
    <div className="flex flex-col gap-3.5">
      {fromNotion && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          Live data from Notion • Projecten uit je Second Brain database
        </p>
      )}
      {projects.map((proj) => (
        <ProjectCard key={proj.name} project={proj} mounted={mounted} />
      ))}
    </div>
  );
}
