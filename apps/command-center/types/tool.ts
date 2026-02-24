export type ToolStatus = 'active' | 'setup' | 'unused';

export interface ToolItem {
  id: number;
  name: string;
  status: ToolStatus;
  description: string;
  link: string;
  category: string;
}

export interface ToolCategory {
  name: string;
  icon: string;
  color: string;
  tools: ToolItem[];
}
