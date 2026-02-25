'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BreakdownTask } from '@/app/api/ai/breakdown/route';

type ModelKey = 'qwen3:4b';

const MODELS: { value: ModelKey; label: string }[] = [
  { value: 'qwen3:4b', label: 'qwen3:4b' },
];

function priorityToNotion(p: string): string {
  const lower = p.toLowerCase();
  if (lower === 'high') return 'High Priority';
  if (lower === 'low') return 'Low Priority';
  return 'Medium Priority';
}

export function AiAssistant() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelKey>('qwen3:4b');
  const [breakdownTasks, setBreakdownTasks] = useState<BreakdownTask[] | null>(
    null
  );
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [addToNotionLoading, setAddToNotionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOffline, setAiOffline] = useState(false);
  const [aiOfflineDetails, setAiOfflineDetails] = useState<string | null>(null);

  const clearAiOffline = useCallback(() => {
    setAiOffline(false);
    setAiOfflineDetails(null);
    setError(null);
  }, []);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;

    setIsStreaming(true);
    setResponse('');
    setError(null);
    setAiOffline(false);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, model: selectedModel }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: string;
        };
        const isOffline = res.status === 502 || res.status === 503;
        if (isOffline) {
          setAiOffline(true);
          setAiOfflineDetails(data.details ?? data.error ?? null);
        }
        setError(data.error ?? 'Chat niet beschikbaar');
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError('Geen stream');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) {
          streamDone = true;
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line) as {
              message?: { content?: string };
            };
            if (data.message?.content) {
              setResponse((prev) => prev + data.message!.content);
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch {
      setAiOffline(true);
      setAiOfflineDetails('Netwerkfout');
      setError('Netwerkfout of AI offline');
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, selectedModel]);

  const handleBreakdown = useCallback(async () => {
    const goal = input.trim();
    if (!goal || breakdownLoading) return;

    setBreakdownLoading(true);
    setBreakdownTasks(null);
    setError(null);
    setAiOffline(false);

    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, model: selectedModel }),
      });
      const data = (await res.json()) as {
        tasks?: BreakdownTask[];
        error?: string;
        details?: string;
      };

      const isOffline = res.status === 502 || res.status === 503;
      if (isOffline) {
        setAiOffline(true);
        setAiOfflineDetails(data.details ?? data.error ?? null);
      }

      if (data.tasks?.length) {
        setBreakdownTasks(data.tasks);
      } else {
        setBreakdownTasks([]);
      }
      if (data.error) setError(data.error);
    } catch {
      setAiOffline(true);
      setAiOfflineDetails('Netwerkfout');
      setError('AI offline of netwerkfout');
      setBreakdownTasks([]);
    } finally {
      setBreakdownLoading(false);
    }
  }, [input, breakdownLoading, selectedModel]);

  const handleAddAllToNotion = useCallback(async () => {
    if (!breakdownTasks?.length || addToNotionLoading) return;

    setAddToNotionLoading(true);
    setError(null);

    try {
      for (const t of breakdownTasks) {
        const res = await fetch('/api/notion/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: t.task,
            priority: priorityToNotion(t.priority),
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError((d as { error?: string }).error ?? 'Notion fout');
          break;
        }
      }
      setBreakdownTasks(null);
    } catch {
      setError('Netwerkfout');
    } finally {
      setAddToNotionLoading(false);
    }
  }, [breakdownTasks, addToNotionLoading]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="text-lg">🤖</span> AI Assistent
        </h2>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 focus:border-accent-blue focus:outline-none"
        >
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-3 text-xs text-slate-500">Snel acties:</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleBreakdown}
          disabled={breakdownLoading || !input.trim()}
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
        >
          {breakdownLoading ? '…' : '📋'} Splits doel op
        </button>
        <button
          type="button"
          onClick={() => {
            setInput(
              'Geef een korte week review: wat ging goed, wat kan beter.'
            );
            setResponse('');
          }}
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
        >
          📊 Week review
        </button>
        <button
          type="button"
          onClick={() => {
            setInput('Ik heb een idee voor een project: ');
            setResponse('');
          }}
          className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
        >
          💡 Idee
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-700/50 pb-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Typ je vraag of doel..."
          className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isStreaming ? '…' : '→'} Sturen
        </button>
      </div>

      {aiOffline && (
        <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-sm font-medium text-amber-200">AI offline</p>
          {aiOfflineDetails && (
            <p className="mt-1 text-xs text-amber-200/80">{aiOfflineDetails}</p>
          )}
          <button
            type="button"
            onClick={clearAiOffline}
            className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
          >
            Opnieuw proberen
          </button>
        </div>
      )}

      {error && !aiOffline && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}

      <AnimatePresence>
        {breakdownTasks !== null && breakdownTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <p className="text-xs font-medium text-slate-400">Subtaken:</p>
            <ul className="space-y-1.5">
              {breakdownTasks.map((t, i) => (
                <motion.li
                  key={`${t.task}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-300"
                >
                  <span>{t.task}</span>
                  <span className="text-xs text-slate-500">
                    {t.priority} · {t.estimatedMinutes} min
                  </span>
                </motion.li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleAddAllToNotion}
              disabled={addToNotionLoading}
              className="mt-2 rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {addToNotionLoading ? 'Bezig…' : 'Voeg alle taken toe aan Notion'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {(response || isStreaming) && (
        <div className="mt-4 rounded-lg border border-slate-700/50 bg-slate-900/50 p-3">
          <p className="font-mono text-sm text-slate-300 whitespace-pre-wrap">
            {response}
            {isStreaming && (
              <span
                className="inline-block animate-pulse text-slate-400"
                aria-hidden
              >
                ▋
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
