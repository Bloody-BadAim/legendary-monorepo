/**
 * Notion API response types for Command Center.
 * Set NOTION_API_KEY, NOTION_TASKS_DB, NOTION_PROJECTS_DB in .env.local
 */

export interface NotionTaskItem {
  id: string;
  task: string;
  done: boolean;
  dueDate: string | null;
  status: string;
  priority: string | null;
}

export interface NotionProjectItem {
  id: string;
  name: string;
  status: string;
  progress: number;
}
