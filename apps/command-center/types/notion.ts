/**
 * Notion API response types for Command Center.
 * Set NOTION_API_KEY, NOTION_TASKS_DB, NOTION_PROJECTS_DB, NOTION_AREAS_DB in .env.local
 */

export interface NotionTaskItem {
  id: string;
  task: string;
  done: boolean;
  dueDate: string | null;
  status: string;
  priority: string | null;
  projectIds: string[];
}

export interface NotionProjectItem {
  id: string;
  name: string;
  status: string;
  progress: number;
  areaIds: string[];
}

export interface NotionAreaItem {
  id: string;
  name: string;
}
