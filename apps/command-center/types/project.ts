export type ProjectStatus = 'live' | 'in-progress' | 'todo' | 'planned';
export type ProjectPriority = 'critical' | 'high' | 'medium' | 'low';

export interface ProjectLink {
  label: string;
  url: string;
}

export interface ProjectItem {
  name: string;
  slug: string;
  status: ProjectStatus;
  progress: number;
  description: string;
  tech: string[];
  revenue: string;
  priority: ProjectPriority;
  location: string;
  port?: number;
  links?: ProjectLink[];
}
