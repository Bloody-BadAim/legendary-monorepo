import { NextResponse } from 'next/server';
import { getNotion, hasNotionConfig } from '@/lib/notion';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['Not started', 'In progress', 'Done'] as const;

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasNotionConfig()) {
    return NextResponse.json(
      { error: 'Notion niet geconfigureerd' },
      { status: 400 }
    );
  }

  const notion = getNotion();
  if (!notion) {
    return NextResponse.json(
      { error: 'Notion client not configured' },
      { status: 500 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Task ID ontbreekt' }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await _req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON body' }, { status: 400 });
  }

  const status = body.status;
  if (
    typeof status !== 'string' ||
    !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
  ) {
    return NextResponse.json(
      { error: 'Status moet een van: Not started, In progress, Done zijn' },
      { status: 400 }
    );
  }

  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        Status: { status: { name: status } },
      },
    });
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Notion API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
