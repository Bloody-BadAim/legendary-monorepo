import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const OLLAMA_TIMEOUT_MS = 40_000;

export async function POST(req: Request) {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Ollama niet geconfigureerd', review: '' },
      { status: 503 }
    );
  }

  let body: {
    doneTasks?: string;
    openCount?: number;
    doneCount?: number;
    model?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Ongeldige JSON body', review: '' },
      { status: 400 }
    );
  }

  const doneTasks = typeof body.doneTasks === 'string' ? body.doneTasks : '';
  const openCount = typeof body.openCount === 'number' ? body.openCount : 0;
  const doneCount = typeof body.doneCount === 'number' ? body.doneCount : 0;
  const model = typeof body.model === 'string' ? body.model : 'qwen3:4b';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  const userContent = `Afgeronde taken:\n${doneTasks || 'Geen'}\n\nNog open: ${openCount} taken. Afgerond deze week: ${doneCount} taken.`;

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Schrijf een positieve week review in het Nederlands. Structuur: 1) Wat is er bereikt, 2) Trots moment, 3) Focus voor volgende week. Max 200 woorden.',
          },
          { role: 'user', content: userContent },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || 'Ollama fout', review: '' },
        { status: 503 }
      );
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const review = data.message?.content?.trim() ?? '';

    return NextResponse.json({ review });
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg, review: '' }, { status: 503 });
  }
}
