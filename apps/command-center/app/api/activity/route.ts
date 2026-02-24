import { NextResponse } from 'next/server';
import { getNotion, hasNotionConfig } from '@/lib/notion';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const GITHUB_COMMITS_URL =
  'https://api.github.com/repos/Bloody-BadAim/legendary-monorepo/commits?per_page=5';

export type ActivityItem =
  | { type: 'commit'; message: string; date: string; sha: string }
  | { type: 'task'; message: string; date: string; status: string };

function parseTitle(prop: unknown): string {
  if (!prop || typeof prop !== 'object') return '';
  const p = prop as { title?: Array<{ plain_text?: string }> };
  const arr = p.title;
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return (arr[0]?.plain_text ?? '').trim();
}

function parseStatus(prop: unknown): string {
  if (!prop || typeof prop !== 'object') return '';
  const p = prop as { status?: { name?: string } };
  return p.status?.name ?? '';
}

async function fetchGitHubCommits(): Promise<ActivityItem[]> {
  try {
    const res = await fetch(GITHUB_COMMITS_URL, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      commit?: { message?: string };
      sha?: string;
      commit?: { author?: { date?: string } };
    }>;
    return (data ?? []).map((c) => ({
      type: 'commit' as const,
      message: (c.commit?.message ?? '').replace(/\n.*/s, '').trim(),
      date: c.commit?.author?.date ?? new Date().toISOString(),
      sha: (c.sha ?? '').slice(0, 7),
    }));
  } catch {
    return [];
  }
}

async function fetchNotionRecentTasks(): Promise<ActivityItem[]> {
  if (!hasNotionConfig()) return [];
  const notion = getNotion();
  const dbId = process.env.NOTION_TASKS_DB;
  if (!notion || !dbId) return [];

  try {
    const { results } = await notion.databases.query({
      database_id: dbId,
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
      page_size: 5,
    });

    return results.map((page) => {
      const lastEdited =
        'last_edited_time' in page && typeof page.last_edited_time === 'string'
          ? page.last_edited_time
          : new Date().toISOString();
      if (!('properties' in page)) {
        return {
          type: 'task' as const,
          message: '',
          date: lastEdited,
          status: '',
        };
      }
      const props = (page as { properties: Record<string, unknown> })
        .properties;
      const nameProp = props['Name'];
      const statusProp = props['Status'];
      return {
        type: 'task' as const,
        message: parseTitle(nameProp),
        date: lastEdited,
        status: parseStatus(statusProp),
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  const [commits, tasks] = await Promise.all([
    fetchGitHubCommits(),
    fetchNotionRecentTasks(),
  ]);

  const merged: ActivityItem[] = [...commits, ...tasks].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const items = merged.slice(0, 8);
  return NextResponse.json({ items });
}
