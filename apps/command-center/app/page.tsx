'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { StatCard } from '@/components/dashboard/stat-card';
import { RevenueTracker } from '@/components/dashboard/revenue-tracker';
import { TaskList } from '@/components/dashboard/task-list';
import { ProjectCardMini } from '@/components/dashboard/project-card-mini';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { useNotionTasks } from '@/hooks/use-notion-tasks';
import { useNotionProjects } from '@/hooks/use-notion-projects';
import { TOOL_CATEGORIES } from '@/data/tools';
import { PROJECTS } from '@/data/projects';
import { ROADMAP } from '@/data/roadmap';
import type { ProjectItem } from '@/types/project';

function notionStatusToProjectStatus(s: string): ProjectItem['status'] {
  if (s === 'In progress') return 'in-progress';
  if (s === 'Done') return 'live';
  return 'todo';
}

/** Static projecten + Notion overlay; Notion-only projecten erachter. */
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

export default function CommandCenterPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { tasks: notionTasks, fromNotion: tasksFromNotion } = useNotionTasks();
  const { projects: notionProjects, fromNotion: projectsFromNotion } =
    useNotionProjects();

  const totalTools = TOOL_CATEGORIES.reduce((a, c) => a + c.tools.length, 0);
  const activeTools = TOOL_CATEGORIES.reduce(
    (a, c) => a + c.tools.filter((t) => t.status === 'active').length,
    0
  );
  const unusedTools = TOOL_CATEGORIES.reduce(
    (a, c) => a + c.tools.filter((t) => t.status === 'unused').length,
    0
  );
  const totalTasks = ROADMAP.reduce((a, w) => a + w.tasks.length, 0);
  const doneTasks = ROADMAP.reduce(
    (a, w) => a + w.tasks.filter((t) => t.done).length,
    0
  );
  const currentWeek = ROADMAP.find((w) => w.status === 'current');
  const staticFocusTasks = currentWeek?.tasks.filter((t) => !t.done) ?? [];
  const focusTasks = tasksFromNotion
    ? notionTasks
        .filter((t) => !t.done)
        .slice(0, 5)
        .map((t) => ({ task: t.task, done: t.done }))
    : staticFocusTasks;

  const allProjects = projectsFromNotion
    ? mergeNotionWithStatic(notionProjects)
    : PROJECTS;
  const inProgressProjects = allProjects.filter(
    (p) => p.status === 'in-progress'
  );
  const projectCount = inProgressProjects.length;

  const stats = [
    {
      label: 'Tools Actief',
      value: `${activeTools}/${totalTools}`,
      color: '#10b981',
      sub: `${unusedTools} ongebruikt`,
    },
    {
      label: 'Projecten',
      value: projectCount,
      color: '#3b82f6',
      sub: 'in progress',
    },
    {
      label: 'Taken Done',
      value: `${doneTasks}/${totalTasks}`,
      color: '#8b5cf6',
      sub: `${totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0}% compleet`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <QuickActions />

      <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-3">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            subtitle={stat.sub}
            delay={i * 100}
            mounted={mounted}
          />
        ))}
      </div>

      <RevenueTracker />

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="text-lg">⚡</span> Vandaag Focus
          {tasksFromNotion && (
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              Notion
            </span>
          )}
        </h2>
        <TaskList tasks={focusTasks} maxItems={5} mounted={mounted} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="text-lg">🔥</span> Actieve Projecten
          {projectsFromNotion && (
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              Notion
            </span>
          )}
        </h2>
        <div className="space-y-3.5">
          {inProgressProjects.map((proj) => (
            <ProjectCardMini key={proj.name} project={proj} mounted={mounted} />
          ))}
        </div>
      </div>

      <ActivityFeed />

      <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="text-lg">🧰</span> Tools per Categorie
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {TOOL_CATEGORIES.map((cat) => {
            const active = cat.tools.filter(
              (t) => t.status === 'active'
            ).length;
            const total = cat.tools.length;
            return (
              <Link
                key={cat.name}
                href="/tools"
                className="rounded-lg border p-3 transition-all hover:scale-[1.02] hover:border-opacity-60"
                style={{
                  borderColor: `${cat.color}22`,
                  background: `${cat.color}0a`,
                }}
              >
                <div className="mb-1.5 text-xl">{cat.icon}</div>
                <div className="mb-0.5 text-xs font-semibold text-slate-200">
                  {cat.name}
                </div>
                <div
                  className="font-mono text-lg font-bold"
                  style={{ color: cat.color }}
                >
                  {active}
                  <span className="text-xs text-muted">/{total}</span>
                </div>
                <div className="text-[11px] text-muted">actief</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
