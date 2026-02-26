import { NextResponse } from 'next/server';
import { aiChat, isAIConfigured, AINotConfiguredError } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const AI_TIMEOUT_MS = 28_000;

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
  if (!isAIConfigured()) {
    return NextResponse.json(
      {
        error: 'AI offline',
        details: 'AI niet geconfigureerd (stel OPENAI_API_KEY of OLLAMA_BASE_URL in)',
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

  const model = typeof body.model === 'string' ? body.model : undefined;

  try {
    const { content } = await aiChat(
      [
        {
          role: 'system',
          content: `Je bent een productiviteitsassistent. Splits doelen op in concrete, actiegerichte subtaken. Geef altijd een JSON array terug met taken.
Format: [{"task": "...", "priority": "High|Medium|Low", "estimatedMinutes": 30}]
Max 5 subtaken. Antwoord ALLEEN met de JSON array, geen uitleg.`,
        },
        { role: 'user', content: goal },
      ],
      { model, timeoutMs: AI_TIMEOUT_MS }
    );

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
    if (err instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: err.message, tasks: FALLBACK_TASKS },
        { status: 503 }
      );
    }
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
