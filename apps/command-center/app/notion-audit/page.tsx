'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { StatCard } from '@/components/dashboard/stat-card';
import { cn } from '@/lib/utils';
import type { AuditResult, AuditIssue } from '@/app/api/notion/audit/route';

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<AuditResult>);

const SEVERITY_FILTER = ['all', 'error', 'warning', 'info'] as const;
const DB_FILTER = ['all', 'tasks', 'projects', 'areas'] as const;

function notionUrl(pageId: string): string {
  return `https://notion.so/${pageId.replace(/-/g, '')}`;
}

function severityStyles(severity: AuditIssue['severity']) {
  switch (severity) {
    case 'error':
      return 'border-red-500/30 bg-red-500/10 text-red-400';
    case 'warning':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    case 'info':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    default:
      return 'border-border bg-card text-slate-300';
  }
}

function dbLabel(db: AuditIssue['database']) {
  switch (db) {
    case 'tasks':
      return 'TAKEN';
    case 'projects':
      return 'PROJECTEN';
    case 'areas':
      return 'AREAS';
    default:
      return db;
  }
}

function relativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'zojuist';
    if (diffMin < 60) return `${diffMin} minuten geleden`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} uur geleden`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} dagen geleden`;
  } catch {
    return iso;
  }
}

export default function NotionAuditPage() {
  const [severityFilter, setSeverityFilter] =
    useState<(typeof SEVERITY_FILTER)[number]>('all');
  const [dbFilter, setDbFilter] = useState<(typeof DB_FILTER)[number]>('all');

  const { data, error, isLoading, mutate } = useSWR<AuditResult>(
    '/api/notion/audit',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 0 }
  );

  const filteredIssues = useMemo(() => {
    if (!data?.issues) return [];
    let list = [...data.issues];
    if (severityFilter !== 'all') {
      list = list.filter((i) => i.severity === severityFilter);
    }
    if (dbFilter !== 'all') {
      list = list.filter((i) => i.database === dbFilter);
    }
    const order = { error: 0, warning: 1, info: 2 };
    list.sort((a, b) => order[a.severity] - order[b.severity]);
    return list;
  }, [data?.issues, severityFilter, dbFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">
            🔍 Notion Second Brain Audit
          </h2>
          <p className="text-sm text-muted">
            {data?.runAt
              ? `Laatste check: ${relativeTime(data.runAt)}`
              : 'Klik op Run om de audit te starten'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => mutate()}
          disabled={isLoading}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          {isLoading ? 'Bezig…' : 'Run'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error.message ?? 'Audit kon niet worden geladen'}
        </div>
      )}

      {data && !error && (
        <>
          <div className="flex flex-wrap gap-3">
            <StatCard
              label="Errors"
              value={data.errors}
              color="#ef4444"
              subtitle={`${data.summary.tasks.issues} taken, ${data.summary.projects.issues} projecten, ${data.summary.areas.issues} areas`}
            />
            <StatCard label="Warnings" value={data.warnings} color="#f59e0b" />
            <StatCard label="Info" value={data.info} color="#3b82f6" />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Filter severity:</span>
            {SEVERITY_FILTER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverityFilter(s)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium',
                  severityFilter === s
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                )}
              >
                {s === 'all' ? 'Alle' : s}
              </button>
            ))}
            <span className="ml-2 text-xs text-slate-500">Database:</span>
            {DB_FILTER.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDbFilter(d)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium',
                  dbFilter === d
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
                )}
              >
                {d === 'all' ? 'Alle' : d}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-200">
              Issues ({filteredIssues.length})
            </h3>
            {filteredIssues.length === 0 ? (
              <p className="text-sm text-muted">
                Geen issues
                {severityFilter !== 'all' || dbFilter !== 'all'
                  ? ' voor dit filter'
                  : ''}
                .
              </p>
            ) : (
              <ul className="space-y-3">
                {filteredIssues.map((issue, idx) => (
                  <li
                    key={`${issue.pageId}-${issue.type}-${idx}`}
                    className={cn(
                      'rounded-lg border p-3',
                      severityStyles(issue.severity)
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs opacity-80">
                          {dbLabel(issue.database)} › &quot;{issue.pageName}
                          &quot;
                        </span>
                        <p className="mt-1 text-sm font-medium">
                          {issue.type}: {issue.message}
                        </p>
                        {issue.details && (
                          <p className="mt-0.5 text-xs opacity-90">
                            {issue.details}
                          </p>
                        )}
                      </div>
                      <a
                        href={notionUrl(issue.pageId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                      >
                        Open in Notion →
                      </a>
                    </div>
                    <p className="mt-1 font-mono text-[10px] opacity-60">
                      Page ID: {issue.pageId}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {!data && !error && !isLoading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted">
          Geen auditresultaat. Klik op Run om de Notion Second Brain te
          controleren.
        </div>
      )}
    </div>
  );
}
