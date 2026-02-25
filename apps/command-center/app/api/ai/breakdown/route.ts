import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const OLLAMA_TIMEOUT_MS = 28_000;

export interface BreakdownTask {
  task: string;
  priority: string;
  estimatedMinutes: number;
}

const FALLBACK_TASKS: BreakdownTask[] = [
  {
    task: 'Doel opsplitsen (handmatig)',
    priority: 'Medium',
    estimatedMinutes: 15,
  },
];

export async function POST(req: Request) {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      {
        error: 'AI offline',
        details: 'Ollama niet geconfigureerd (OLLAMA_BASE_URL)',
        tasks: FALLBACK_TASKS,
      },
      { status: 503 }
    );
  }

  let body: { goal: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Ongeldige JSON body', tasks: FALLBACK_TASKS },
      { status: 400 }
    );
  }

  const goal = typeof body.goal === 'string' ? body.goal.trim() : '';
  if (!goal) {
    return NextResponse.json(
      { error: 'Veld "goal" is verplicht', tasks: FALLBACK_TASKS },
      { status: 400 }
    );
  }

  const model = typeof body.model === 'string' ? body.model : 'qwen3:4b';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `Je bent een productiviteitsassistent. Splits doelen op in concrete, actiegerichte subtaken. Geef altijd een JSON array terug met taken.
Format: [{"task": "...", "priority": "High|Medium|Low", "estimatedMinutes": 30}]
Max 5 subtaken. Antwoord ALLEEN met de JSON array, geen uitleg.`,
          },
          { role: 'user', content: goal },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        {
          error: 'AI offline',
          details: text || `Ollama returned ${response.status}`,
          tasks: FALLBACK_TASKS,
        },
        { status: 503 }
      );
    }

    const data = (await response.json()) as { message?: { content?: string } };
    const content = data.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ tasks: FALLBACK_TASKS });
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const parsed = JSON.parse(jsonStr) as unknown;

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ tasks: FALLBACK_TASKS });
    }

    const tasks: BreakdownTask[] = parsed.slice(0, 5).map((item) => {
      const o = item as Record<string, unknown>;
      return {
        task: typeof o.task === 'string' ? o.task : String(o.task ?? ''),
        priority: typeof o.priority === 'string' ? o.priority : 'Medium',
        estimatedMinutes:
          typeof o.estimatedMinutes === 'number' && o.estimatedMinutes > 0
            ? o.estimatedMinutes
            : 30,
      };
    });

    return NextResponse.json({ tasks });
  } catch (err) {
    clearTimeout(timeout);
    const details = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'AI offline',
        details,
        tasks: FALLBACK_TASKS,
      },
      { status: 503 }
    );
  }
}
