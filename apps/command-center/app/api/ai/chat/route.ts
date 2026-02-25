import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const OLLAMA_TIMEOUT_MS = 55_000;

export async function POST(req: Request) {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      {
        error: 'AI offline',
        details: 'Ollama niet geconfigureerd (OLLAMA_BASE_URL)',
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

  const model = typeof body.model === 'string' ? body.model : 'qwen3:4b';
  const context = typeof body.context === 'string' ? body.context : undefined;

  const messages: Array<{ role: string; content: string }> = [];
  if (context) messages.push({ role: 'system', content: context });
  messages.push({ role: 'user', content: message });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const ollamaRes = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!ollamaRes.ok || !ollamaRes.body) {
      const text = await ollamaRes.text();
      const details = text || `Ollama returned ${ollamaRes.status}`;
      return NextResponse.json(
        { error: 'AI offline', details },
        { status: 503 }
      );
    }

    return new Response(ollamaRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    clearTimeout(timeout);
    const details = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'AI offline',
        details: details.includes('abort')
          ? 'Timeout. Ollama reageert niet.'
          : details,
      },
      { status: 503 }
    );
  }
}
