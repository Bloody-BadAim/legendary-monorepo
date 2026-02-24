import { NextResponse } from 'next/server';
import { getNotion, hasNotionConfig } from '@/lib/notion';
import type { NotionTaskItem } from '@/types/notion';

export const dynamic = 'force-dynamic';
export type { NotionTaskItem };

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

function parseDate(prop: unknown): string | null {
  if (!prop || typeof prop !== 'object') return null;
  const p = prop as { date?: { start?: string } };
  return p.date?.start ?? null;
}

function parseSelect(prop: unknown): string | null {
  if (!prop || typeof prop !== 'object') return null;
  const p = prop as { select?: { name?: string } };
  return p.select?.name ?? null;
}

function parseRelationIds(prop: unknown): string[] {
  if (!prop || typeof prop !== 'object') return [];
  const p = prop as { relation?: Array<{ id?: string }> };
  const rel = p.relation;
  if (!Array.isArray(rel)) return [];
  return rel.map((r) => r.id).filter(Boolean) as string[];
}

export async function GET() {
  if (!hasNotionConfig()) {
    return NextResponse.json({ tasks: [], source: 'none' });
  }

  const notion = getNotion();
  const dbId = process.env.NOTION_TASKS_DB!;
  if (!notion) {
    return NextResponse.json(
      { error: 'Notion client not configured' },
      { status: 500 }
    );
  }

  try {
    const { results } = await notion.databases.query({
      database_id: dbId,
      sorts: [
        { property: 'Priority ', direction: 'ascending' },
        { property: 'Due Date ', direction: 'ascending' },
      ],
    });

    const tasks: NotionTaskItem[] = results.map((page) => {
      if ('properties' in page === false) {
        return {
          id: page.id,
          task: '',
          done: false,
          dueDate: null,
          status: '',
          priority: null,
          projectIds: [],
        };
      }
      const props = (page as { properties: Record<string, unknown> })
        .properties;
      const nameProp = props['Name'];
      const statusProp = props['Status'];
      const dueProp = props['Due Date '];
      const priorityProp = props['Priority '];
      const projectProp = props['Project '];
      const task = parseTitle(nameProp);
      const status = parseStatus(statusProp);
      const done = status === 'Done';
      return {
        id: page.id,
        task,
        done,
        dueDate: parseDate(dueProp),
        status,
        priority: parseSelect(priorityProp),
        projectIds: parseRelationIds(projectProp),
      };
    });

    return NextResponse.json({ tasks, source: 'notion' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Notion API error';
    return NextResponse.json(
      { error: message, tasks: [], source: 'error' },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  if (!hasNotionConfig()) {
    return NextResponse.json(
      { error: 'Notion niet geconfigureerd' },
      { status: 400 }
    );
  }

  const notion = getNotion();
  const dbId = process.env.NOTION_TASKS_DB!;
  if (!notion || !dbId) {
    return NextResponse.json(
      { error: 'Notion client or tasks DB not configured' },
      { status: 500 }
    );
  }

  let body: { task: string; priority?: string; projectId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON body' }, { status: 400 });
  }

  const taskName = typeof body.task === 'string' ? body.task.trim() : '';
  if (!taskName) {
    return NextResponse.json(
      { error: 'Veld "task" (naam) is verplicht' },
      { status: 400 }
    );
  }

  const priority =
    body.priority === 'High Priority' ||
    body.priority === 'Medium Priority' ||
    body.priority === 'Low Priority'
      ? body.priority
      : 'Medium Priority';

  const properties: Record<string, unknown> = {
    Name: {
      type: 'title',
      title: [{ type: 'text', text: { content: taskName } }],
    },
    Status: { status: { name: 'Not started' } },
    'Priority ': { select: { name: priority } },
  };

  if (body.projectId && typeof body.projectId === 'string') {
    properties['Project '] = {
      relation: [{ id: body.projectId }],
    };
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: dbId },
      properties: properties as Parameters<
        typeof notion.pages.create
      >[0]['properties'],
    });
    return NextResponse.json({ ok: true, id: page.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Notion API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
