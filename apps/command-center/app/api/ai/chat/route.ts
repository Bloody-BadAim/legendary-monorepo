import { NextResponse } from 'next/server';
import { aiChatStream, isAIConfigured, AINotConfiguredError } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AI_TIMEOUT_MS = 55_000;

export async function POST(req: Request) {
  if (!isAIConfigured()) {
    return NextResponse.json(
      {
        error: 'AI offline',
        details: 'AI niet geconfigureerd (stel OPENAI_API_KEY of OLLAMA_BASE_URL in)',
      },
      { status: 503 }
    );
  }

  let body: { message: string; model?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON body' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json(
      { error: 'Veld "message" is verplicht' },
      { status: 400 }
    );
  }

  const model = typeof body.model === 'string' ? body.model : undefined;
  const context = typeof body.context === 'string' ? body.context : undefined;

  const messages: Array<{ role: string; content: string }> = [];
  if (context) messages.push({ role: 'system', content: context });
  messages.push({ role: 'user', content: message });

  try {
    const { stream } = await aiChatStream(messages, {
      model,
      timeoutMs: AI_TIMEOUT_MS,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    if (err instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: 'AI offline', details: err.message },
        { status: 503 }
      );
    }
    const details = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'AI offline',
        details: details.includes('abort')
          ? 'Timeout. AI reageert niet.'
          : details,
      },
      { status: 503 }
    );
  }
}
