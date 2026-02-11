import { NextResponse } from 'next/server';
import { z } from 'zod';
import { callLiteLLM } from '@/lib/litellm';
import { prisma } from '@/lib/db';
import type { AIResponse } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(2),
  questionType: z.string().min(1),
  description: z.string().min(10),
});

type FormPayload = z.infer<typeof formSchema>;

const DEFAULT_AI_RESPONSE: AIResponse = {
  category: 'other',
  urgency: 5,
  summary: '',
};

/**
 * Extract JSON from AI response (may be wrapped in markdown code block).
 */
function parseAIResponse(raw: string): AIResponse {
  let jsonStr = raw.trim();

  const codeBlock = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock?.[1]) {
    jsonStr = codeBlock[1].trim();
  }

  const parsed = JSON.parse(jsonStr) as Record<string, unknown> | null;

  if (parsed && typeof parsed === 'object' && 'category' in parsed) {
    const category = String(parsed.category);
    const validCategory =
      category === 'automation' ||
      category === 'ai-integration' ||
      category === 'consulting' ||
      category === 'other'
        ? category
        : 'other';
    const urgency =
      typeof parsed.urgency === 'number' &&
      parsed.urgency >= 0 &&
      parsed.urgency <= 10
        ? Math.round(parsed.urgency)
        : 5;
    const summary = typeof parsed.summary === 'string' ? parsed.summary : '';

    return { category: validCategory, urgency, summary };
  }

  return DEFAULT_AI_RESPONSE;
}

function buildPrompt(data: FormPayload): string {
  return `Je bent een business analyst. Categoriseer deze klant vraag en geef een urgency score (0-10).

Klant: ${data.name}
Bedrijf: ${data.company}
Type: ${data.questionType}
Vraag: ${data.description}

Geef alleen geldige JSON terug, geen andere tekst:
{
  "category": "automation" | "ai-integration" | "consulting" | "other",
  "urgency": 0-10,
  "summary": "korte samenvatting in 1 zin"
}`;
}

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = formSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.flatten().formErrors?.[0] ?? 'Validation failed';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    let aiResult = DEFAULT_AI_RESPONSE;

    try {
      const prompt = buildPrompt(data);
      const rawResponse = await callLiteLLM(prompt);
      aiResult = parseAIResponse(rawResponse);
    } catch (err) {
      console.error('LiteLLM error (form still accepted):', err);
      // Form accepted; use defaults.
    }

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        questionType: data.questionType,
        description: data.description,
        category: aiResult.category,
        urgency: aiResult.urgency,
        aiSummary: aiResult.summary || null,
        status: 'new',
      },
    });

    const webhookUrl =
      process.env.N8N_WEBHOOK_URL ?? 'https://n8n.matmat.me/webhook/intake';
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          category: lead.category ?? 'other',
          urgency: lead.urgency ?? 5,
        }),
      });
      if (!res.ok) {
        console.warn(
          'n8n webhook non-OK response:',
          res.status,
          await res.text()
        );
      }
    } catch (err) {
      console.error('n8n webhook error (lead already saved):', err);
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      category: aiResult.category,
      urgency: aiResult.urgency,
      summary: aiResult.summary || undefined,
    });
  } catch (err) {
    console.error('Submit API error:', err);
    const message = err instanceof Error ? err.message : 'Submission failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
