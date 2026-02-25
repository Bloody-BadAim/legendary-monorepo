import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const N8N_TIMEOUT_MS = 30_000;

export async function POST(req: Request) {
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: 'N8N_WEBHOOK_BASE_URL niet geconfigureerd' },
      { status: 503 }
    );
  }

  let body: { workflowId: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Ongeldige JSON body' },
      { status: 400 }
    );
  }

  const workflowId =
    typeof body.workflowId === 'string' ? body.workflowId.trim() : '';
  if (!workflowId) {
    return NextResponse.json(
      { ok: false, error: 'workflowId is verplicht' },
      { status: 400 }
    );
  }

  const payload =
    body.payload && typeof body.payload === 'object' ? body.payload : {};
  const url = `${baseUrl.replace(/\/$/, '')}/webhook/${workflowId}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let data: unknown;
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error:
          typeof data === 'object' && data && 'message' in (data as object)
            ? String((data as { message: unknown }).message)
            : `n8n request failed (${res.status})`,
      });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      ok: false,
      error: message.includes('abort') ? 'Timeout (30s)' : message,
    });
  }
}
