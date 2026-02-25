import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const OLLAMA_TIMEOUT_MS = 5000;

export async function GET() {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  const url = `${baseUrl.replace(/\/$/, '')}/api/tags`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          error: 'Ollama niet bereikbaar',
          details: text || `Status ${res.status}`,
        },
        { status: 503 }
      );
    }

    const data = (await res.json()) as {
      models?: Array<{ name?: string; size?: number; modified_at?: string }>;
    };
    const models = (data.models ?? []).map((m) => ({
      name: typeof m.name === 'string' ? m.name : '',
      size: typeof m.size === 'number' ? m.size : 0,
      modified_at:
        typeof m.modified_at === 'string' ? m.modified_at : undefined,
    }));

    return NextResponse.json({ models });
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Ollama niet bereikbaar',
        details: message.includes('abort') ? 'Timeout' : message,
      },
      { status: 503 }
    );
  }
}
