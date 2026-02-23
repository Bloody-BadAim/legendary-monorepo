import 'server-only';
import { Client } from '@notionhq/client';

function getNotionClient(): Client | null {
  const token = process.env.NOTION_API_KEY;
  if (!token) return null;
  return new Client({ auth: token });
}

export function getNotion(): Client | null {
  return getNotionClient();
}

export function hasNotionConfig(): boolean {
  return Boolean(
    process.env.NOTION_API_KEY &&
    process.env.NOTION_TASKS_DB &&
    process.env.NOTION_PROJECTS_DB
  );
}
