'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { TaskStats } from '@/components/todo/task-stats';
import { TaskFilters } from '@/components/todo/task-filters';
import { TaskList } from '@/components/todo/task-list';
import { TaskQuickAdd } from '@/components/todo/task-quick-add';
import { Goals2026 } from '@/components/todo/goals-2026';
import type { NotionTaskItem } from '@/types/notion';
import type { NotionProjectItem } from '@/types/notion';
import type { NotionAreaItem } from '@/types/notion';

const tasksFetcher = (url: string) =>
  fetch(url).then(
    (r) =>
      r.json() as Promise<{
        tasks: NotionTaskItem[];
        source: string;
        error?: string;
      }>
  );
const projectsFetcher = (url: string) =>
  fetch(url).then(
    (r) =>
      r.json() as Promise<{
        projects: NotionProjectItem[];
        source: string;
        error?: string;
      }>
  );
const areasFetcher = (url: string) =>
  fetch(url).then(
    (r) =>
      r.json() as Promise<{
        areas: NotionAreaItem[];
        source: string;
        error?: string;
      }>
  );

export default function TodoPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data: tasksData, mutate: mutateTasks } = useSWR(
    '/api/notion/tasks',
    tasksFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );
  const { data: projectsData } = useSWR(
    '/api/notion/projects',
    projectsFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const { data: areasData } = useSWR('/api/notion/areas', areasFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const projects = projectsData?.projects ?? [];
  const areas = areasData?.areas ?? [];
  const tasksError =
    tasksData?.error ?? (tasksData?.source === 'error' ? 'Notion fout' : null);
  const isLoading = !tasksData && !tasksError;

  const filteredTasks = useMemo(() => {
    let out = tasksData?.tasks ?? [];
    const projs = projectsData?.projects ?? [];
    if (selectedAreaId) {
      const projectIdsInArea = new Set(
        projs.filter((p) => p.areaIds.includes(selectedAreaId)).map((p) => p.id)
      );
      out = out.filter(
        (t) =>
          t.projectIds.length === 0 ||
          t.projectIds.some((pid) => projectIdsInArea.has(pid))
      );
    }
    if (selectedProjectId) {
      out = out.filter(
        (t) =>
          t.projectIds.length === 0 || t.projectIds.includes(selectedProjectId)
      );
    }
    if (selectedPriority) {
      out = out.filter((t) => t.priority === selectedPriority);
    }
    if (selectedStatus) {
      out = out.filter((t) => t.status === selectedStatus);
    }
    return out;
  }, [
    tasksData,
    projectsData,
    selectedAreaId,
    selectedProjectId,
    selectedPriority,
    selectedStatus,
  ]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((t) => t.status === 'Done').length;
    const overdue = filteredTasks.filter((t) => {
      if (!t.dueDate) return false;
      try {
        const d = new Date(t.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d < today && t.status !== 'Done';
      } catch {
        return false;
      }
    }).length;
    return { total, done, overdue };
  }, [filteredTasks]);

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: string) => {
      const res = await fetch(`/api/notion/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Update mislukt');
      }
      await mutateTasks();
    },
    [mutateTasks]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold text-slate-200">
          Todo – Notion Tasks
        </h2>
        <p className="text-sm text-muted">
          Taken uit Notion Tasks-database. Wijzigingen worden direct
          gesynchroniseerd.
        </p>
      </div>

      {tasksError && (
        <div
          className="rounded-lg border border-accent-red/50 bg-accent-red/10 px-4 py-3 text-sm text-accent-red"
          role="alert"
        >
          {tasksError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted">
          Taken laden…
        </div>
      )}

      {!isLoading && !tasksError && (
        <>
          <TaskStats
            total={stats.total}
            done={stats.done}
            overdue={stats.overdue}
          />
          <TaskFilters
            areas={areas}
            projects={projects}
            selectedAreaId={selectedAreaId}
            selectedProjectId={selectedProjectId}
            selectedPriority={selectedPriority}
            selectedStatus={selectedStatus}
            onAreaChange={setSelectedAreaId}
            onProjectChange={setSelectedProjectId}
            onPriorityChange={setSelectedPriority}
            onStatusChange={setSelectedStatus}
          />
          <TaskQuickAdd projects={projects} onAdded={() => mutateTasks()} />
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-200">
              Taken per project
            </h3>
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-muted">
                Geen taken (of geen resultaten voor gekozen filters).
              </p>
            ) : (
              <TaskList
                tasks={filteredTasks}
                projects={projects}
                groupByProject
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        </>
      )}

      <Goals2026 />
    </div>
  );
}
