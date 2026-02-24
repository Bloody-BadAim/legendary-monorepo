'use client';

import { TaskCard } from './task-card';
import type { NotionTaskItem } from '@/types/notion';
import type { NotionProjectItem } from '@/types/notion';

interface TaskListProps {
  tasks: NotionTaskItem[];
  projects: NotionProjectItem[];
  groupByProject: boolean;
  onStatusChange: (_taskId: string, _newStatus: string) => Promise<void>;
}

export function TaskList({
  tasks,
  projects,
  groupByProject,
  onStatusChange,
}: TaskListProps) {
  if (groupByProject) {
    const byProject = new Map<string, NotionTaskItem[]>();
    for (const t of tasks) {
      if (t.projectIds.length === 0) {
        const unassigned = byProject.get('') ?? [];
        unassigned.push(t);
        byProject.set('', unassigned);
      } else {
        for (const pid of t.projectIds) {
          const list = byProject.get(pid) ?? [];
          list.push(t);
          byProject.set(pid, list);
        }
      }
    }
    const projectOrder = projects.map((p) => p.id);
    const unassigned = byProject.get('') ?? [];
    const projectNames = new Map(projects.map((p) => [p.id, p.name]));

    return (
      <div className="space-y-6">
        {unassigned.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Zonder project
            </h3>
            <ul className="space-y-2">
              {unassigned.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                />
              ))}
            </ul>
          </section>
        )}
        {projectOrder.map((pid) => {
          const list = byProject.get(pid) ?? [];
          if (list.length === 0) return null;
          const name = projectNames.get(pid) ?? '(onbekend project)';
          return (
            <section key={pid}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                {name}
              </h3>
              <ul className="space-y-2">
                {list.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
      ))}
    </ul>
  );
}
