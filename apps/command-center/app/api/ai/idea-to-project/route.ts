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
  const model = typeof body.model === 'string' ? body.model : undefined;

  try {
    const { content: raw } = await aiChat(
      [
        {
          role: 'system',
          content: `Converteer een idee naar een project structuur. Geef ALLEEN geldige JSON terug, geen andere tekst:
{"projectName": "...", "description": "...", "tasks": [{"task": "...", "priority": "High|Medium|Low"}]}
Max 5 taken. Gebruik alleen de genoemde velden.`,
        },
        { role: 'user', content: idea || 'Geen idee opgegeven.' },
      ],
      { model, timeoutMs: AI_TIMEOUT_MS }
    );

    const content = raw ?? '{}';
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
    if (err instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: err.message, projectName: '', description: '', tasks: [] },
        { status: 503 }
      );
    }
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: msg, projectName: '', description: '', tasks: [] },
      { status: 503 }
    );
  }
}
