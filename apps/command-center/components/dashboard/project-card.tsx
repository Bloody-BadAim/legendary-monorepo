import { ProgressBar } from './progress-bar';
import { Badge } from '@/components/ui/badge';
import { getPriorityColor } from '@/lib/constants';
import type { ProjectItem } from '@/types/project';

interface ProjectCardProps {
  project: ProjectItem;
  className?: string;
  mounted?: boolean;
}

const statusVariant = (
  s: string
): 'in-progress' | 'live' | 'todo' | 'default' => {
  if (s === 'in-progress') return 'in-progress';
  if (s === 'live') return 'live';
  if (s === 'todo') return 'todo';
  return 'default';
};

export function ProjectCard({
  project,
  className,
  mounted = true,
}: ProjectCardProps) {
  const priorityColor = getPriorityColor(project.priority);

  return (
    <div
      className={`rounded-xl border border-border bg-card p-5 transition-all duration-300 ${
        mounted ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
      } ${className ?? ''}`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: priorityColor,
      }}
    >
      <div className="mb-2.5 flex justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-200">
            {project.name}
          </h3>
          <p className="text-xs text-slate-400">{project.desc}</p>
        </div>
        <div className="text-right">
          <Badge variant={statusVariant(project.status)}>
            {project.status}
          </Badge>
          <div className="mt-1 font-mono text-sm font-semibold text-orange-500">
            {project.revenue}
          </div>
        </div>
      </div>

      <ProgressBar
        value={mounted ? project.progress : 0}
        color={priorityColor}
        className="mb-2.5 h-2"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {project.tech.map((t) => (
            <span
              key={t}
              className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-400"
            >
              {t}
            </span>
          ))}
        </div>
        <span className="font-mono text-xs text-muted">
          {project.progress}%
        </span>
      </div>
    </div>
  );
}
