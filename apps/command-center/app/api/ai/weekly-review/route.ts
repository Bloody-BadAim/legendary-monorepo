import { NextResponse } from 'next/server';
import { aiChat, isAIConfigured, AINotConfiguredError } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const AI_TIMEOUT_MS = 40_000;

export async function POST(req: Request) {
  if (!isAIConfigured()) {
    return NextResponse.json(
      {
        error: 'AI niet geconfigureerd (stel OPENAI_API_KEY of OLLAMA_BASE_URL in)',
        review: '',
      },
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
  const model = typeof body.model === 'string' ? body.model : undefined;

  const userContent = `Afgeronde taken:\n${doneTasks || 'Geen'}\n\nNog open: ${openCount} taken. Afgerond deze week: ${doneCount} taken.`;

  try {
    const { content } = await aiChat(
      [
        {
          role: 'system',
          content:
            'Schrijf een positieve week review in het Nederlands. Structuur: 1) Wat is er bereikt, 2) Trots moment, 3) Focus voor volgende week. Max 200 woorden.',
        },
        { role: 'user', content: userContent },
      ],
      { model, timeoutMs: AI_TIMEOUT_MS }
    );

    return NextResponse.json({ review: content });
  } catch (err) {
    if (err instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: err.message, review: '' },
        { status: 503 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg, review: '' }, { status: 503 });
  }
}
