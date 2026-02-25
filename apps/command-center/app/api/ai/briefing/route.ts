import { NextResponse } from 'next/server';
import { getNotion, hasNotionConfig } from '@/lib/notion';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const OLLAMA_TIMEOUT_MS = 45_000;

function parseTitle(prop: unknown): string {
  if (!prop || typeof prop !== 'object') return '';
  const p = prop as { title?: Array<{ plain_text?: string }> };
  const arr = p.title;
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return (arr[0]?.plain_text ?? '').trim();
}

function parseStatus(prop: unknown): string {
  if (!prop || typeof prop !== 'object') return '';
  const p = prop as { status?: { name?: string } };
  return p.status?.name ?? '';
}

function parseSelect(prop: unknown): string | null {
  if (!prop || typeof prop !== 'object') return null;
  const p = prop as { select?: { name?: string } };
  return p.select?.name ?? null;
}

/** GET/POST: returns { briefing } for Telegram/n8n. Uses Notion tasks + Ollama. */
export async function GET() {
  return runBriefing();
}

export async function POST() {
  return runBriefing();
}

async function runBriefing() {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'Ollama niet geconfigureerd', briefing: 'AI niet beschikbaar.' },
      { status: 503 }
    );
  }

  let taskList = 'Geen taken gevonden.';
  if (hasNotionConfig()) {
    const notion = getNotion();
    const dbId = process.env.NOTION_TASKS_DB;
    if (notion && dbId) {
      try {
        const { results } = await notion.databases.query({
          database_id: dbId,
          sorts: [
            { property: 'Priority ', direction: 'ascending' },
            { property: 'Due Date ', direction: 'ascending' },
          ],
        });
        const open = results
          .filter((page) => {
            if (!('properties' in page)) return false;
            const props = (page as { properties: Record<string, unknown> })
              .properties;
            const status = parseStatus(props['Status']);
            return status !== 'Done';
          })
          .slice(0, 20)
          .map((page) => {
            const props = (page as { properties: Record<string, unknown> })
              .properties;
            const task = parseTitle(props['Name']);
            const status = parseStatus(props['Status']);
            const priority = parseSelect(props['Priority ']) ?? 'geen prio';
            return `- [${priority}] ${task} (${status})`;
          })
          .join('\n');
        taskList = open || 'Geen open taken.';
      } catch {
        taskList = 'Kon taken niet ophalen.';
      }
    }
  }

  const model = process.env.OLLAMA_BRIEFING_MODEL ?? 'qwen3:4b';
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
            content:
              'Je bent een productiviteitscoach. Maak een motiverende dagelijkse briefing op basis van de taken. Geef: 1) Top 3 prioriteiten voor vandaag, 2) Een korte motiverende zin. Max 150 woorden. Schrijf in het Nederlands.',
          },
          {
            role: 'user',
            content: `Mijn open taken:\n${taskList}`,
          },
        ],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        briefing: 'Briefing kon niet worden gegenereerd (Ollama fout).',
        error: errText?.slice(0, 200),
      });
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const briefing =
      data.message?.content?.trim() ?? 'Geen briefing beschikbaar.';

    return NextResponse.json({ briefing });
  } catch (e) {
    clearTimeout(timeout);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({
      briefing: msg.includes('abort')
        ? 'Timeout: AI reageert niet.'
        : 'Briefing mislukt.',
      error: msg,
    });
  }
}
