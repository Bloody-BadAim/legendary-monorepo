'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

const AI_INTAKE_WORKFLOW_ID = 'intake';

type IntakePayload = {
  leadId: string;
  name: string;
  email: string;
  company: string;
  category: string;
  urgency: number;
  summary: string;
  questionType: string;
  description: string;
};

const CATEGORY_OPTIONS = [
  'Partnership',
  'Support',
  'Sales',
  'Demo',
  'Anders',
] as const;

const QUESTION_TYPE_OPTIONS = [
  'technisch',
  'commercieel',
  'offerte',
  'anders',
] as const;

function generateLeadId(): string {
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ResultCards({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return null;
  }
  const obj =
    typeof data === 'object' && data !== null ? data : { result: data };
  const entries = Object.entries(obj);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-slate-600"
        >
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {key}
          </div>
          <div className="text-sm text-slate-200">
            {typeof value === 'object' && value !== null ? (
              <pre className="overflow-auto text-xs">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              String(value)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function IntakePage() {
  const [payload, setPayload] = useState<IntakePayload>({
    leadId: '',
    name: '',
    email: '',
    company: '',
    category: '',
    urgency: 5,
    summary: '',
    questionType: 'anders',
    description: '',
  });
  const [rawIntake, setRawIntake] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const fillFromRaw = useCallback(() => {
    if (!rawIntake.trim()) return;
    setPayload((prev) => ({
      ...prev,
      leadId: prev.leadId || generateLeadId(),
      summary: rawIntake.trim().slice(0, 2000),
      description: rawIntake.trim(),
    }));
  }, [rawIntake]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const toSend: IntakePayload = {
      ...payload,
      leadId: payload.leadId || generateLeadId(),
      summary: payload.summary || 'Geen samenvatting',
      questionType: payload.questionType || 'anders',
      description: payload.description || '',
    };

    try {
      const res = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: AI_INTAKE_WORKFLOW_ID,
          payload: { body: toSend },
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        data?: unknown;
        error?: string;
      };
      if (data.ok && data.data !== undefined) {
        setResult(data.data);
      } else {
        setError(data.error ?? 'Fout bij verwerken');
      }
    } catch {
      setError('Netwerkfout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-200">
          🧠 AI Intake Agent
        </h2>
        <p className="text-sm text-muted">
          Vul de velden in of plak ruwe intake-tekst. Verstuur naar de n8n
          workflow &quot;AI Intake Agent - Complete&quot;.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Groot tekstveld voor ruwe intake */}
        <div className="space-y-2">
          <label
            htmlFor="rawIntake"
            className="block text-xs font-medium text-slate-400"
          >
            Ruwe intake (optioneel – plak hier tekst om summary/beschrijving te
            vullen)
          </label>
          <textarea
            id="rawIntake"
            value={rawIntake}
            onChange={(e) => setRawIntake(e.target.value)}
            placeholder="Plak hier vrije intake-tekst..."
            rows={4}
            className="w-full resize-y rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
          />
          <button
            type="button"
            onClick={fillFromRaw}
            disabled={!rawIntake.trim()}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          >
            Gebruik als summary + beschrijving
          </button>
        </div>

        {/* Gestructureerde velden (zoals verwacht door de workflow) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-slate-400"
            >
              Naam
            </label>
            <input
              id="name"
              type="text"
              value={payload.name}
              onChange={(e) =>
                setPayload((p) => ({ ...p, name: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
              placeholder="Naam"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={payload.email}
              onChange={(e) =>
                setPayload((p) => ({ ...p, email: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
              placeholder="email@voorbeeld.nl"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="company"
              className="block text-xs font-medium text-slate-400"
            >
              Bedrijf
            </label>
            <input
              id="company"
              type="text"
              value={payload.company}
              onChange={(e) =>
                setPayload((p) => ({ ...p, company: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
              placeholder="Bedrijfsnaam"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="category"
              className="block text-xs font-medium text-slate-400"
            >
              Categorie
            </label>
            <select
              id="category"
              value={payload.category}
              onChange={(e) =>
                setPayload((p) => ({ ...p, category: e.target.value }))
              }
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-accent-blue focus:outline-none"
            >
              <option value="">Kies...</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="urgency"
              className="block text-xs font-medium text-slate-400"
            >
              Urgentie (1–10)
            </label>
            <input
              id="urgency"
              type="number"
              min={1}
              max={10}
              value={payload.urgency}
              onChange={(e) =>
                setPayload((p) => ({
                  ...p,
                  urgency: Math.min(
                    10,
                    Math.max(1, Number(e.target.value) || 1)
                  ),
                }))
              }
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-accent-blue focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="questionType"
              className="block text-xs font-medium text-slate-400"
            >
              Vraag type
            </label>
            <select
              id="questionType"
              value={payload.questionType}
              onChange={(e) =>
                setPayload((p) => ({ ...p, questionType: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-accent-blue focus:outline-none"
            >
              {QUESTION_TYPE_OPTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="summary"
            className="block text-xs font-medium text-slate-400"
          >
            Samenvatting
          </label>
          <textarea
            id="summary"
            value={payload.summary}
            onChange={(e) =>
              setPayload((p) => ({ ...p, summary: e.target.value }))
            }
            rows={2}
            className="w-full resize-y rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
            placeholder="Korte samenvatting"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-xs font-medium text-slate-400"
          >
            Beschrijving
          </label>
          <textarea
            id="description"
            value={payload.description}
            onChange={(e) =>
              setPayload((p) => ({ ...p, description: e.target.value }))
            }
            rows={4}
            className="w-full resize-y rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
            placeholder="Uitgebreide beschrijving"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'rounded-xl bg-accent-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50',
              loading && 'pointer-events-none'
            )}
          >
            {loading ? 'Bezig…' : 'Verwerk'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPayload((p) => ({ ...p, leadId: generateLeadId() }));
            }}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Nieuwe Lead ID
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {result !== null && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Resultaat</h3>
          {typeof result === 'object' &&
          result !== null &&
          !Array.isArray(result) &&
          Object.keys(result).length > 0 ? (
            <ResultCards data={result} />
          ) : (
            <pre className="overflow-auto rounded-xl border border-border bg-card p-4 text-xs text-slate-400">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
