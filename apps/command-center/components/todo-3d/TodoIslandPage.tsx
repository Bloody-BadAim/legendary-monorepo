'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { TaskStats } from '@/components/todo/task-stats';
import { TaskFilters } from '@/components/todo/task-filters';
import { TaskList } from '@/components/todo/task-list';
import { TaskQuickAdd } from '@/components/todo/task-quick-add';
import { Goals2026 } from '@/components/todo/goals-2026';
import { getAreaColor } from '@/lib/island-colors';
import type { NotionAreaItem } from '@/types/notion';
import type { NotionTaskItem } from '@/types/notion';
import type { NotionProjectItem } from '@/types/notion';

const IslandUniverse = dynamic(
  () => import('./IslandUniverse').then((m) => ({ default: m.IslandUniverse })),
  { ssr: false }
);

interface TodoIslandPageProps {
  areas: NotionAreaItem[];
  /** Filtered tasks for 2D list and stats */
  tasks: NotionTaskItem[];
  /** All tasks (unfiltered) for 3D islands and sidebar */
  allTasks: NotionTaskItem[];
  projects: NotionProjectItem[];
  isLoading: boolean;
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueCount: number;
  selectedAreaId: string | null;
  setSelectedAreaId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedPriority: string | null;
  setSelectedPriority: (p: string | null) => void;
  selectedStatus: string | null;
  setSelectedStatus: (s: string | null) => void;
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  onTaskAdded: () => void;
}

function getTasksForArea(
  areaId: string,
  allTasks: NotionTaskItem[],
  projects: NotionProjectItem[]
): NotionTaskItem[] {
  const projectIdsInArea = new Set(
    projects.filter((p) => p.areaIds.includes(areaId)).map((p) => p.id)
  );

  if (projectIdsInArea.size === 0) {
    return [];
  }

  return allTasks.filter(
    (t) =>
      t.projectIds.length > 0 &&
      t.projectIds.some((pid) => projectIdsInArea.has(pid))
  );
}

export function TodoIslandPage({
  areas,
  tasks,
  allTasks,
  projects,
  isLoading,
  totalTasks,
  doneTasks,
  inProgressTasks,
  overdueCount,
  selectedAreaId,
  setSelectedAreaId,
  selectedProjectId,
  setSelectedProjectId,
  selectedPriority,
  setSelectedPriority,
  selectedStatus,
  setSelectedStatus,
  onStatusChange,
  onTaskAdded,
}: TodoIslandPageProps) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  useEffect(() => setMounted(true), []);

  const sidebarTasks = useMemo(() => {
    if (!selectedAreaId) return [];
    return getTasksForArea(selectedAreaId, allTasks, projects);
  }, [selectedAreaId, allTasks, projects]);

  const selectedArea = useMemo(
    () => areas.find((a) => a.id === selectedAreaId) ?? null,
    [areas, selectedAreaId]
  );

  if (!mounted) {
    return (
      <div className="min-h-[600px] w-full rounded-2xl bg-[#0a0f1a] animate-pulse" />
    );
  }

  // TIJDELIJK — delete na debug
  console.log('🏝️ areas:', areas.length, areas);
  console.log('📋 tasks:', tasks.length);

  return (
    <div className="relative min-h-screen">
      {/* 3D Canvas */}
      <div className="h-[60vh] w-full md:h-screen min-h-[600px]">
        <IslandUniverse
          areas={areas}
          tasks={allTasks}
          projects={projects.map((p) => ({ id: p.id, areaIds: p.areaIds }))}
          selectedAreaId={selectedAreaId}
          onSelectArea={setSelectedAreaId}
        />
      </div>

      {/* Overlay UI */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Top bar */}
        <div className="pointer-events-auto fixed left-0 right-0 top-0 z-20 border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span>
                Totaal: <strong className="text-white">{totalTasks}</strong>
              </span>
              <span>
                Done: <strong className="text-emerald-400">{doneTasks}</strong>
              </span>
              <span>
                Bezig:{' '}
                <strong className="text-cyan-400">{inProgressTasks}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === '3d' ? '2d' : '3d'))}
              className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700/80"
            >
              {viewMode === '3d' ? '2D' : '3D'}
            </button>
          </div>
        </div>

        {/* Sidebar (desktop) */}
        <AnimatePresence>
          {selectedAreaId && selectedArea && viewMode === '3d' && (
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="pointer-events-auto fixed left-0 top-[52px] bottom-0 z-10 hidden w-80 overflow-y-auto border-r border-slate-700/50 bg-slate-900/90 backdrop-blur-xl md:block"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/95 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getAreaColor(selectedArea.name) }}
                  />
                  <h3 className="font-semibold text-slate-200">
                    {selectedArea.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAreaId(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  aria-label="Sluiten"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <TaskList
                  tasks={sidebarTasks}
                  projects={projects}
                  groupByProject={false}
                  onStatusChange={onStatusChange}
                />
                <div className="mt-6">
                  <TaskQuickAdd projects={projects} onAdded={onTaskAdded} />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile bottom sheet */}
        <AnimatePresence>
          {selectedAreaId && selectedArea && viewMode === '3d' && (
            <motion.aside
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="pointer-events-auto fixed inset-x-0 bottom-0 z-10 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-slate-700/50 bg-slate-900/90 backdrop-blur-xl md:hidden"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700/50 bg-slate-900/95 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getAreaColor(selectedArea.name) }}
                  />
                  <h3 className="font-semibold text-slate-200">
                    {selectedArea.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAreaId(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  aria-label="Sluiten"
                >
                  ×
                </button>
              </div>
              <div className="p-4 pb-8">
                <TaskList
                  tasks={sidebarTasks}
                  projects={projects}
                  groupByProject={false}
                  onStatusChange={onStatusChange}
                />
                <TaskQuickAdd projects={projects} onAdded={onTaskAdded} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* 3D hint */}
        {viewMode === '3d' && !selectedAreaId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-xl bg-slate-900/60 px-4 py-2 backdrop-blur-sm"
          >
            <p className="text-center text-sm font-medium text-slate-200">
              🏝️ Selecteer een eiland
            </p>
            <p className="text-center text-xs text-slate-400">
              Klik op een eiland om je taken te zien
            </p>
          </motion.div>
        )}
      </div>

      {/* 2D fallback view */}
      <AnimatePresence>
        {viewMode === '2d' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-auto absolute inset-0 z-0 space-y-6 overflow-y-auto bg-[var(--background)] p-6 pt-20"
          >
            <div>
              <h2 className="mb-1 text-lg font-semibold text-slate-200">
                Todo – Notion Tasks
              </h2>
              <p className="text-sm text-muted">
                Taken uit Notion. Wijzigingen worden gesynchroniseerd.
              </p>
            </div>
            {isLoading ? (
              <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted">
                Taken laden…
              </div>
            ) : (
              <>
                <TaskStats
                  total={totalTasks}
                  done={doneTasks}
                  overdue={overdueCount}
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
                <TaskQuickAdd projects={projects} onAdded={onTaskAdded} />
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-4 text-sm font-semibold text-slate-200">
                    Taken per project
                  </h3>
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted">Geen taken.</p>
                  ) : (
                    <TaskList
                      tasks={tasks}
                      projects={projects}
                      groupByProject
                      onStatusChange={onStatusChange}
                    />
                  )}
                </div>
                <Goals2026 />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
