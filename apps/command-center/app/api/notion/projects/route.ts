import { NextResponse } from 'next/server';
import { getNotion, hasNotionConfig } from '@/lib/notion';
import type { NotionProjectItem } from '@/types/notion';

export const dynamic = 'force-dynamic';
export type { NotionProjectItem };

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

function parseFormulaNumber(prop: unknown): number {
  if (!prop || typeof prop !== 'object') return 0;
  const p = prop as { formula?: { type?: string; number?: number | null } };
  if (p.formula?.type === 'number' && typeof p.formula.number === 'number') {
    return Math.round(p.formula.number);
  }
  return 0;
}

export async function GET() {
  if (!hasNotionConfig()) {
    return NextResponse.json({ projects: [], source: 'none' });
  }

  const notion = getNotion();
  const dbId = process.env.NOTION_PROJECTS_DB!;
  if (!notion) {
    return NextResponse.json(
      { error: 'Notion client not configured' },
      { status: 500 }
    );
  }

  try {
    const { results } = await notion.databases.query({
      database_id: dbId,
    });

    const projects: NotionProjectItem[] = results.map((page) => {
      if ('properties' in page === false) {
        return {
          id: page.id,
          name: '',
          status: '',
          progress: 0,
        };
      }
      const props = (page as { properties: Record<string, unknown> })
        .properties;
      const name = parseTitle(props['Name']);
      const status = parseStatus(props['Status']);
      const progress = parseFormulaNumber(props['Progress ']);
      return {
        id: page.id,
        name,
        status,
        progress,
      };
    });

    return NextResponse.json({ projects, source: 'notion' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Notion API error';
    return NextResponse.json(
      { error: message, projects: [], source: 'error' },
      { status: 502 }
    );
  }
}
