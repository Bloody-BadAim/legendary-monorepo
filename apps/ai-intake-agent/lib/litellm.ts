const LITELLM_URL = process.env.LITELLM_URL ?? 'http://localhost:4000';
const LITELLM_MODEL = process.env.LITELLM_MODEL ?? 'gpt-3.5-turbo';

export interface LiteLLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LiteLLMChatRequest {
  model: string;
  messages: LiteLLMMessage[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * Calls LiteLLM (OpenAI-compatible) chat completions endpoint.
 * Returns the assistant reply text. No auth key needed for local.
 */
export async function callLiteLLM(prompt: string): Promise<string> {
  const url = `${LITELLM_URL}/v1/chat/completions`;

  const body: LiteLLMChatRequest = {
    model: LITELLM_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LiteLLM error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const content = data.choices?.[0]?.message?.content;
  if (content == null || content === '') {
    throw new Error('Empty response from LiteLLM');
  }

  return content.trim();
}
