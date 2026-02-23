export type ProjectStatus = 'in-progress' | 'live' | 'todo';
export type ProjectPriority = 'high' | 'medium' | 'low' | 'done';

export interface ProjectItem {
  name: string;
  status: ProjectStatus;
  progress: number;
  desc: string;
  tech: string[];
  revenue: string;
  priority: ProjectPriority;
}
