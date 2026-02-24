import { NextResponse } from 'next/server';
import { getNotion, hasNotionConfig } from '@/lib/notion';
import { PROJECTS } from '@/data/projects';
import type { ProjectItem } from '@/types/project';

export const dynamic = 'force-dynamic';

function toNotionStatus(status: ProjectItem['status']): string {
  if (status === 'in-progress') return 'In progress';
  if (status === 'live') return 'Done';
  return 'Not started';
}

export async function POST() {
  if (!hasNotionConfig()) {
    return NextResponse.json(
      { error: 'Notion not configured' },
      { status: 400 }
    );
  }
  const notion = getNotion();
  const dbId = process.env.NOTION_PROJECTS_DB;
  if (!notion || !dbId) {
    return NextResponse.json(
      { error: 'Notion client or database ID missing' },
      { status: 500 }
    );
  }
  try {
    const created: string[] = [];
    for (const proj of PROJECTS) {
      const statusName = toNotionStatus(proj.status);
      const withStatus = {
        Name: { title: [{ text: { content: proj.name } }] },
        Status: { status: { name: statusName } },
      };
      try {
        await notion.pages.create({
          parent: { database_id: dbId },
          properties: withStatus,
        });
      } catch (createErr) {
        const msg = createErr instanceof Error ? createErr.message : '';
        if (msg.includes('Status is expected to be status')) {
          await notion.pages.create({
            parent: { database_id: dbId },
            properties: {
              Name: { title: [{ text: { content: proj.name } }] },
            },
          });
        } else {
          throw createErr;
        }
      }
      created.push(proj.name);
    }
    return NextResponse.json({
      ok: true,
      message: 'Synced ' + created.length + ' projecten naar Notion',
      created,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Notion API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
