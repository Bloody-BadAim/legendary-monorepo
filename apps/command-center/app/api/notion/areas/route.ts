import { NextResponse } from 'next/server';
import { getNotion, hasNotionAreasConfig } from '@/lib/notion';
import type { NotionAreaItem } from '@/types/notion';

export const dynamic = 'force-dynamic';
export type { NotionAreaItem };

function parseTitle(prop: unknown): string {
  if (!prop || typeof prop !== 'object') return '';
  const p = prop as { title?: Array<{ plain_text?: string }> };
  const arr = p.title;
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return (arr[0]?.plain_text ?? '').trim();
}

export async function GET() {
  if (!hasNotionAreasConfig()) {
    return NextResponse.json({ areas: [], source: 'none' });
  }

  const notion = getNotion();
  const dbId = process.env.NOTION_AREAS_DB!;
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

    const areas: NotionAreaItem[] = results.map((page) => {
      if ('properties' in page === false) {
        return { id: page.id, name: '' };
      }
      const props = (page as { properties: Record<string, unknown> })
        .properties;
      return {
        id: page.id,
        name: parseTitle(props['Name']),
      };
    });

    return NextResponse.json({ areas, source: 'notion' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Notion API error';
    return NextResponse.json(
      { error: message, areas: [], source: 'error' },
      { status: 502 }
    );
  }
}
