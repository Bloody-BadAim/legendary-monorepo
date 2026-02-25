'use client';

import { useState, useMemo } from 'react';
import { useHealthCheck } from '@/hooks/use-health-check';
import { cn } from '@/lib/utils';

interface WorkflowCard {
  id: string;
  title: string;
  description: string;
  model: string;
  type: 'input' | 'trigger';
  icon: string;
  color: string;
}

const WORKFLOWS: WorkflowCard[] = [
  {
    id: 'task-breakdown',
    title: 'Taak Breakdown',
    description: 'AI splitst je doel in subtaken',
    model: 'qwen3:4b',
    type: 'input',
    icon: '📋',
    color: '#3b82f6',
  },
  {
    id: 'daily-briefing',
    title: 'Daily Briefing',
    description: 'Elke dag 09:00 via Ollama',
    model: 'qwen3:4b',
    type: 'trigger',
    icon: '🌅',
    color: '#f59e0b',
  },
  {
    id: 'idea-to-project',
    title: 'Idee → Project',
    description: 'Typt idee → Notion project auto',
    model: 'qwen3:4b',
    type: 'input',
    icon: '💡',
    color: '#8b5cf6',
  },
  {
    id: 'weekly-review',
    title: 'Week Review',
    description: 'Vrijdag 17:00, Notion pagina',
    model: 'qwen3:4b',
    type: 'trigger',
    icon: '📊',
    color: '#10b981',
  },
];

function WorkflowCardRow({
  workflow,
  isN8nOnline,
}: {
  workflow: WorkflowCard;
  isN8nOnline: boolean;
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleRun = async () => {
    if (!isN8nOnline || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.id,
          payload:
            workflow.type === 'input' && input.trim()
              ? { goal: input.trim(), input: input.trim() }
              : {},
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        data?: unknown;
        error?: string;
      };
      if (data.ok && data.data !== undefined) {
        setResult(data.data);
        setExpanded(true);
      } else {
        setError(data.error ?? 'Fout bij uitvoeren');
      }
    } catch {
      setError('Netwerkfout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-all',
        isN8nOnline ? 'border-border' : 'border-slate-700/50 opacity-60'
      )}
      style={
        isN8nOnline
          ? { borderLeftWidth: 4, borderLeftColor: workflow.color }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-200">
            <span>{workflow.icon}</span>
            {workflow.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {workflow.description}
          </p>
          <p className="mt-1 text-[10px] text-slate-600">
            Model: {workflow.model}
          </p>
        </div>
      </div>

      {workflow.type === 'input' && (
        <div className="mt-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Input..."
            disabled={!isN8nOnline}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none disabled:opacity-50"
          />
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={!isN8nOnline || loading}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
        >
          {loading ? '…' : '▶'}{' '}
          {workflow.type === 'input' ? 'Uitvoeren' : 'Run Nu'}
        </button>
        {result !== null && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
          >
            {expanded ? 'Verberg' : 'Toon'} resultaat
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      {expanded && result !== null && (
        <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-[10px] text-slate-400">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function WorkflowsPage() {
  const healthMap = useHealthCheck();

  const isN8nOnline = useMemo(() => {
    const local = healthMap.get('n8n-local')?.status === 'online';
    const remote = healthMap.get('n8n-remote')?.status === 'online';
    return local || remote;
  }, [healthMap]);

  const n8nUrl = 'https://n8n.matmat.me';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">
            ⚡ n8n Workflows
          </h2>
          <p className="text-sm text-muted">
            {n8nUrl}{' '}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                isN8nOnline
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-600 text-slate-400'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isN8nOnline ? 'bg-emerald-400' : 'bg-slate-500'
                )}
              />
              {isN8nOnline ? 'Online' : 'Offline'}
            </span>
          </p>
        </div>
      </div>

      {!isN8nOnline && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          n8n is offline. Start n8n lokaal of controleer {n8nUrl}.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {WORKFLOWS.map((w) => (
          <WorkflowCardRow key={w.id} workflow={w} isN8nOnline={isN8nOnline} />
        ))}
      </div>
    </div>
  );
}
