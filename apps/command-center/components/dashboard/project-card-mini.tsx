import { ProgressBar } from './progress-bar';
import { getPriorityColor } from '@/lib/constants';
import type { ProjectItem } from '@/types/project';

interface ProjectCardMiniProps {
  project: ProjectItem;
  className?: string;
  mounted?: boolean;
}

export function ProjectCardMini({
  project,
  className,
  mounted = true,
}: ProjectCardMiniProps) {
  const color = getPriorityColor(project.priority);

  return (
    <div
      className={`transition-all duration-300 ${mounted ? 'opacity-100' : 'opacity-0'} ${className ?? ''}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">
          {project.name}
        </span>
        <span className="text-xs font-semibold uppercase" style={{ color }}>
          {project.priority}
        </span>
      </div>
      <ProgressBar value={mounted ? project.progress : 0} color={color} />
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{project.progress}%</span>
        <span>{project.revenue}</span>
      </div>
    </div>
  );
}
