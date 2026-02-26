/**
 * Shared AI helper – supports OpenAI (preferred) and Ollama (local dev).
 *
 * Priority:
 *   1. OPENAI_API_KEY → OpenAI API (gpt-4o-mini)
 *   2. OLLAMA_BASE_URL → Ollama API (local)
 *   3. Neither set    → error
 */

export type AIMessage = { role: string; content: string };
export type AIProvider = 'openai' | 'ollama';

const DEFAULT_MODEL_OPENAI = 'gpt-4o-mini';
const DEFAULT_MODEL_OLLAMA = 'qwen3:4b';

/** Returns true if at least one AI provider is configured. */
export function isAIConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.OLLAMA_BASE_URL);
}

/**
 * Non-streaming AI call.
 * Returns { content, provider }.
 */
export async function aiChat(
  messages: AIMessage[],
  options?: { model?: string; timeoutMs?: number }
): Promise<{ content: string; provider: AIProvider }> {
  const timeoutMs = options?.timeoutMs ?? 45_000;

  if (process.env.OPENAI_API_KEY) {
    const model = options?.model ?? DEFAULT_MODEL_OPENAI;
    return openaiChat(messages, model, timeoutMs);
  }

  if (process.env.OLLAMA_BASE_URL) {
    const model = options?.model ?? DEFAULT_MODEL_OLLAMA;
    return ollamaChat(messages, model, timeoutMs);
  }

  throw new AINotConfiguredError();
}

/**
 * Streaming AI call.
 * Returns { stream: ReadableStream, provider }.
 * The stream format matches the upstream provider (Ollama NDJSON or OpenAI SSE).
 */
export async function aiChatStream(
  messages: AIMessage[],
  options?: { model?: string; timeoutMs?: number }
): Promise<{ stream: ReadableStream; provider: AIProvider }> {
  const timeoutMs = options?.timeoutMs ?? 55_000;

  if (process.env.OPENAI_API_KEY) {
    const model = options?.model ?? DEFAULT_MODEL_OPENAI;
    return openaiChatStream(messages, model, timeoutMs);
  }

  if (process.env.OLLAMA_BASE_URL) {
    const model = options?.model ?? DEFAULT_MODEL_OLLAMA;
    return ollamaChatStream(messages, model, timeoutMs);
  }

  throw new AINotConfiguredError();
}

export class AINotConfiguredError extends Error {
  constructor() {
    super(
      'AI niet geconfigureerd (stel OPENAI_API_KEY of OLLAMA_BASE_URL in)'
    );
    this.name = 'AINotConfiguredError';
  }
}

// ---------------------------------------------------------------------------
// OpenAI
// ---------------------------------------------------------------------------

async function openaiChat(
  messages: AIMessage[],
  model: string,
  timeoutMs: number
): Promise<{ content: string; provider: AIProvider }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model, messages, stream: false }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';
    return { content, provider: 'openai' };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function openaiChatStream(
  messages: AIMessage[],
  model: string,
  timeoutMs: number
): Promise<{ stream: ReadableStream; provider: AIProvider }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(
      `OpenAI error ${res.status}: ${text.slice(0, 200)}`
    );
  }

  // OpenAI SSE → transform to Ollama-compatible NDJSON so the chat route
  // client-side parser keeps working unchanged.
  const stream = transformOpenAIStreamToOllama(res.body);
  return { stream, provider: 'openai' };
}

/**
 * Transforms an OpenAI SSE stream into Ollama-compatible NDJSON.
 *
 * OpenAI SSE line format:
 *   data: {"choices":[{"delta":{"content":"hello"},"finish_reason":null}]}
 *   data: [DONE]
 *
 * Ollama NDJSON format:
 *   {"message":{"content":"hello"},"done":false}
 *   {"message":{"content":""},"done":true}
 */
function transformOpenAIStreamToOllama(body: ReadableStream): ReadableStream {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const reader = body.getReader();

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Flush remaining buffer
          if (buffer.trim()) {
            processBuffer(buffer, controller, encoder);
          }
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          processSSELine(line.trim(), controller, encoder);
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

function processBuffer(
  buf: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  for (const line of buf.split('\n')) {
    processSSELine(line.trim(), controller, encoder);
  }
}

function processSSELine(
  line: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  if (!line.startsWith('data: ')) return;
  const payload = line.slice(6).trim();
  if (payload === '[DONE]') {
    const ollamaFinal = JSON.stringify({ message: { content: '' }, done: true });
    controller.enqueue(encoder.encode(ollamaFinal + '\n'));
    return;
  }
  try {
    const parsed = JSON.parse(payload) as {
      choices?: Array<{
        delta?: { content?: string };
        finish_reason?: string | null;
      }>;
    };
    const content = parsed.choices?.[0]?.delta?.content ?? '';
    const isDone = parsed.choices?.[0]?.finish_reason === 'stop';
    const ollamaChunk = JSON.stringify({
      message: { content },
      done: isDone,
    });
    controller.enqueue(encoder.encode(ollamaChunk + '\n'));
  } catch {
    // ignore malformed SSE lines
  }
}

// ---------------------------------------------------------------------------
// Ollama
// ---------------------------------------------------------------------------

async function ollamaChat(
  messages: AIMessage[],
  model: string,
  timeoutMs: number
): Promise<{ content: string; provider: AIProvider }> {
  const baseUrl = process.env.OLLAMA_BASE_URL!;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const content = data.message?.content?.trim() ?? '';
    return { content, provider: 'ollama' };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function ollamaChatStream(
  messages: AIMessage[],
  model: string,
  timeoutMs: number
): Promise<{ stream: ReadableStream; provider: AIProvider }> {
  const baseUrl = process.env.OLLAMA_BASE_URL!;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(
      `Ollama error ${res.status}: ${text.slice(0, 200)}`
    );
  }

  return { stream: res.body, provider: 'ollama' };
}
