export type ToolStatus = 'active' | 'setup' | 'unused';

export interface ToolItem {
  name: string;
  status: ToolStatus;
  use: string;
  link: string;
}

export interface ToolCategory {
  name: string;
  color: string;
  icon: string;
  tools: ToolItem[];
}
