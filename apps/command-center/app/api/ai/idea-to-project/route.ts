import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const OLLAMA_TIMEOUT_MS = 40_000;

export async function POST(req: Request) {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      {
        error: 'Ollama niet geconfigureerd',
        projectName: '',
        description: '',
        tasks: [],
      },
      { status: 503 }
    );
  }

  let body: { idea?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: 'Ongeldige JSON body',
        projectName: '',
        description: '',
        tasks: [],
      },
      { status: 400 }
    );
  }

  const idea = typeof body.idea === 'string' ? body.idea.trim() : '';
  const model = typeof body.model === 'string' ? body.model : 'qwen3:4b';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `Converteer een idee naar een project structuur. Geef ALLEEN geldige JSON terug, geen andere tekst:
{"projectName": "...", "description": "...", "tasks": [{"task": "...", "priority": "High|Medium|Low"}]}
Max 5 taken. Gebruik alleen de genoemde velden.`,
          },
          { role: 'user', content: idea || 'Geen idee opgegeven.' },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          error: text || 'Ollama fout',
          projectName: '',
          description: '',
          tasks: [],
        },
        { status: 503 }
      );
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content?.trim() ?? '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const projectName =
      typeof parsed.projectName === 'string'
        ? parsed.projectName
        : 'Nieuw Project';
    const description =
      typeof parsed.description === 'string' ? parsed.description : '';
    const tasks = Array.isArray(parsed.tasks)
      ? parsed.tasks.slice(0, 5).map((t: unknown) => {
          const o = (t as Record<string, unknown>) ?? {};
          return {
            task: typeof o.task === 'string' ? o.task : String(o.task ?? ''),
            priority: typeof o.priority === 'string' ? o.priority : 'Medium',
          };
        })
      : [];

    return NextResponse.json({ projectName, description, tasks });
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: msg, projectName: '', description: '', tasks: [] },
      { status: 503 }
    );
  }
}
