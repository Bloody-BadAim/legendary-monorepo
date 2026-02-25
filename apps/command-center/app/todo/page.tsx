'use client';

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { TodoIslandPage } from '@/components/todo-3d/TodoIslandPage';
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

/** Areas die we niet tonen als eilanden of in filters */
const EXCLUDED_AREA_NAMES = [
  'Gezondheid & Welzijn',
  'Work',
  'Personal',
  'Health',
];

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
  const areas = useMemo(
    () =>
      (areasData?.areas ?? []).filter(
        (a) => !EXCLUDED_AREA_NAMES.includes(a.name)
      ),
    [areasData?.areas]
  );
  const allTasks = useMemo(() => tasksData?.tasks ?? [], [tasksData?.tasks]);
  const tasksError =
    tasksData?.error ?? (tasksData?.source === 'error' ? 'Notion fout' : null);
  const isLoading = !tasksData && !tasksError;

  const filteredTasks = useMemo(() => {
    let out = allTasks;
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
    allTasks,
    projectsData,
    selectedAreaId,
    selectedProjectId,
    selectedPriority,
    selectedStatus,
  ]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter((t) => t.status === 'Done').length;
    const inProgress = filteredTasks.filter(
      (t) => t.status === 'In progress'
    ).length;
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
    return { total, done, inProgress, overdue };
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
    <div className="relative">
      {tasksError && (
        <div
          className="relative z-30 mx-4 mt-4 rounded-lg border border-accent-red/50 bg-accent-red/10 px-4 py-3 text-sm text-accent-red"
          role="alert"
        >
          {tasksError}
        </div>
      )}
      <TodoIslandPage
        areas={areas}
        tasks={filteredTasks}
        allTasks={allTasks}
        projects={projects}
        isLoading={isLoading}
        totalTasks={stats.total}
        doneTasks={stats.done}
        inProgressTasks={stats.inProgress}
        overdueCount={stats.overdue}
        selectedAreaId={selectedAreaId}
        setSelectedAreaId={setSelectedAreaId}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        selectedPriority={selectedPriority}
        setSelectedPriority={setSelectedPriority}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onStatusChange={handleStatusChange}
        onTaskAdded={() => mutateTasks()}
      />
    </div>
  );
}
