'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { useHealthCheck } from '@/hooks/use-health-check';
import { cn } from '@/lib/utils';

interface ModelsResponse {
  models: { name: string; size?: number; modified_at?: string }[];
}

const fetcher = (url: string) =>
  fetch(url).then((r) =>
    r.ok ? r.json() : Promise.reject(new Error('Models unavailable'))
  ) as Promise<ModelsResponse>;

type TestState = 'idle' | 'running' | 'success' | 'error';

export function AiStatusPanel() {
  const health = useHealthCheck();
  const { data: modelsData, error: modelsError } = useSWR<ModelsResponse>(
    '/api/ai/models',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60_000,
    }
  );

  const [ollamaTest, setOllamaTest] = useState<{
    state: TestState;
    latency?: number;
    preview?: string;
    error?: string;
  }>({ state: 'idle' });
  const [n8nTest, setN8nTest] = useState<{
    state: TestState;
    latency?: number;
    error?: string;
  }>({ state: 'idle' });

  const ollamaStatus = health.get('ollama');
  const n8nStatus = health.get('n8n-remote') ?? health.get('n8n-local');

  const models = modelsData?.models ?? [];
  const modelNames = models.map((m) => m.name).filter(Boolean);

  const runOllamaTest = useCallback(async () => {
    setOllamaTest({ state: 'running' });
    const start = Date.now();
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Say "OK" in one word.',
          model: modelNames[0] ?? 'qwen3:4b',
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setOllamaTest({
          state: 'error',
          error: data.error ?? `HTTP ${res.status}`,
        });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setOllamaTest({ state: 'error', error: 'Geen stream' });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

      while (content.length < 50) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6)) as {
                message?: { content?: string };
              };
              const part = json.message?.content ?? '';
              content += part;
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      const latency = Date.now() - start;
      const preview = content.slice(0, 50).trim() || '(geen tekst)';
      setOllamaTest({
        state: 'success',
        latency,
        preview,
      });
    } catch (err) {
      setOllamaTest({
        state: 'error',
        error: err instanceof Error ? err.message : 'Netwerkfout',
      });
    }
  }, [modelNames]);

  const runN8nTest = useCallback(async () => {
    setN8nTest({ state: 'running' });
    const start = Date.now();
    try {
      const res = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: 'task-breakdown',
          payload: { goal: 'test' },
        }),
      });
      const latency = Date.now() - start;
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (data.ok) {
        setN8nTest({ state: 'success', latency });
      } else {
        setN8nTest({
          state: 'error',
          latency,
          error: data.error ?? `HTTP ${res.status}`,
        });
      }
    } catch (err) {
      setN8nTest({
        state: 'error',
        error: err instanceof Error ? err.message : 'Netwerkfout',
      });
    }
  }, []);

  const statusDot = (status: 'online' | 'offline' | 'checking' | undefined) => {
    if (!status || status === 'checking')
      return (
        <span
          className="inline-block h-2 w-2 rounded-full bg-amber-400"
          title="Checken..."
        />
      );
    if (status === 'online')
      return (
        <span
          className="inline-block h-2 w-2 rounded-full bg-emerald-500"
          title="Online"
        />
      );
    return (
      <span
        className="inline-block h-2 w-2 rounded-full bg-red-500"
        title="Offline"
      />
    );
  };

  const latencyStr = (latency: number) => (latency >= 0 ? `${latency}ms` : '—');

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:col-span-2">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="text-lg">🤖</span> AI Ecosystem Status
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="mb-1 flex items-center gap-2">
            {statusDot(ollamaStatus?.status)}
            <span className="text-xs font-semibold text-slate-200">Ollama</span>
          </div>
          <div className="text-[11px] text-muted">
            {ollamaStatus?.status === 'online'
              ? `${modelNames.length} modellen`
              : 'Offline'}
          </div>
          <div className="font-mono text-xs text-slate-400">
            {latencyStr(ollamaStatus?.latency ?? -1)}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="mb-1 flex items-center gap-2">
            {statusDot(n8nStatus?.status)}
            <span className="text-xs font-semibold text-slate-200">n8n</span>
          </div>
          <div className="text-[11px] text-muted">
            {n8nStatus?.status === 'online' ? 'Webhook ready' : 'Offline'}
          </div>
          <div className="font-mono text-xs text-slate-400">
            {latencyStr(n8nStatus?.latency ?? -1)}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border/60 pt-4">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Modellen
        </div>
        <div className="flex flex-wrap gap-1.5">
          {modelsError || (!modelsData && !modelNames.length) ? (
            <span className="text-xs text-muted">
              Geen modellen of Ollama offline
            </span>
          ) : (
            modelNames.map((name) => (
              <span
                key={name}
                className="rounded bg-slate-700/60 px-2 py-0.5 font-mono text-xs text-slate-300"
              >
                {name}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-[11px] text-muted">Snel testen:</span>
        <button
          type="button"
          onClick={runOllamaTest}
          disabled={ollamaTest.state === 'running'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            ollamaTest.state === 'success'
              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
              : ollamaTest.state === 'error'
                ? 'border-red-500/50 bg-red-500/20 text-red-400'
                : 'border-border bg-muted/50 text-slate-300 hover:bg-muted'
          )}
        >
          {ollamaTest.state === 'running' && (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          )}
          {ollamaTest.state === 'success' && (
            <span className="text-emerald-400" title="Succes">
              ✓
            </span>
          )}
          🧪 Test Ollama
          {ollamaTest.state === 'success' && ollamaTest.latency != null && (
            <span className="text-[10px] opacity-80">
              {ollamaTest.latency}ms
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={runN8nTest}
          disabled={n8nTest.state === 'running'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            n8nTest.state === 'success'
              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
              : n8nTest.state === 'error'
                ? 'border-red-500/50 bg-red-500/20 text-red-400'
                : 'border-border bg-muted/50 text-slate-300 hover:bg-muted'
          )}
        >
          {n8nTest.state === 'running' && (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          )}
          {n8nTest.state === 'success' && (
            <span className="text-emerald-400" title="Succes">
              ✓
            </span>
          )}
          🧪 Test n8n
          {n8nTest.state === 'success' && n8nTest.latency != null && (
            <span className="text-[10px] opacity-80">{n8nTest.latency}ms</span>
          )}
        </button>
      </div>

      {ollamaTest.state === 'success' && ollamaTest.preview && (
        <div className="mt-2 text-[10px] text-muted">
          Ollama preview: &quot;{ollamaTest.preview}&quot;
        </div>
      )}
      {ollamaTest.state === 'error' && ollamaTest.error && (
        <div className="mt-2 text-[10px] text-red-400">
          Ollama: {ollamaTest.error}
        </div>
      )}
      {n8nTest.state === 'error' && n8nTest.error && (
        <div className="mt-2 text-[10px] text-red-400">
          n8n: {n8nTest.error}
        </div>
      )}
    </div>
  );
}
