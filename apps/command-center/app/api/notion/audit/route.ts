import { NextResponse } from 'next/server';
import type { Client } from '@notionhq/client';
import { getNotion, hasNotionConfig } from '@/lib/notion';
import type { NotionTaskItem } from '@/types/notion';
import type { NotionProjectItem } from '@/types/notion';
import type { NotionAreaItem } from '@/types/notion';

export const dynamic = 'force-dynamic';

export interface AuditIssue {
  database: 'tasks' | 'projects' | 'areas';
  pageId: string;
  pageName: string;
  severity: 'error' | 'warning' | 'info';
  type:
    | 'empty_name'
    | 'missing_relation'
    | 'broken_relation'
    | 'duplicate_name'
    | 'missing_status'
    | 'missing_priority'
    | 'orphaned_task'
    | 'empty_project'
    | 'empty_area'
    | 'project_no_area';
  message: string;
  details?: string;
}

export interface AuditResult {
  runAt: string;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  issues: AuditIssue[];
  summary: {
    tasks: { total: number; issues: number };
    projects: { total: number; issues: number };
    areas: { total: number; issues: number };
  };
}

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

function parseRelationIds(prop: unknown): string[] {
  if (!prop || typeof prop !== 'object') return [];
  const p = prop as { relation?: Array<{ id?: string }> };
  const rel = p.relation;
  if (!Array.isArray(rel)) return [];
  return rel.map((r) => r.id).filter(Boolean) as string[];
}

function parseDate(prop: unknown): string | null {
  if (!prop || typeof prop !== 'object') return null;
  const p = prop as { date?: { start?: string } };
  return p.date?.start ?? null;
}

function parseFormulaNumber(prop: unknown): number {
  if (!prop || typeof prop !== 'object') return 0;
  const p = prop as { formula?: { type?: string; number?: number | null } };
  if (p.formula?.type === 'number' && typeof p.formula.number === 'number') {
    return Math.round(p.formula.number);
  }
  return 0;
}

async function fetchAllPages(
  notion: Client,
  databaseId: string,
  sorts?: { property: string; direction: 'ascending' | 'descending' }[]
): Promise<Array<{ id: string; properties: Record<string, unknown> }>> {
  const pages: Array<{ id: string; properties: Record<string, unknown> }> = [];
  let cursor: string | undefined;
  do {
    const resp = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
      sorts: sorts ?? [],
    });
    for (const page of resp.results) {
      if ('properties' in page) {
        pages.push({
          id: page.id,
          properties: (page as { properties: Record<string, unknown> })
            .properties,
        });
      }
    }
    cursor = resp.next_cursor ?? undefined;
  } while (cursor);
  return pages;
}

async function fetchAllTasks(notion: Client): Promise<NotionTaskItem[]> {
  const dbId = process.env.NOTION_TASKS_DB!;
  const pages = await fetchAllPages(notion, dbId, [
    { property: 'Priority ', direction: 'ascending' },
    { property: 'Due Date ', direction: 'ascending' },
  ]);
  return pages.map((page) => {
    const p = page.properties;
    const task = parseTitle(p['Name']);
    const status = parseStatus(p['Status']);
    return {
      id: page.id,
      task,
      done: status === 'Done',
      dueDate: parseDate(p['Due Date ']),
      status,
      priority: parseSelect(p['Priority ']),
      projectIds: parseRelationIds(p['Project ']),
    };
  });
}

async function fetchAllProjects(notion: Client): Promise<NotionProjectItem[]> {
  const dbId = process.env.NOTION_PROJECTS_DB!;
  const pages = await fetchAllPages(notion, dbId);
  return pages.map((page) => {
    const p = page.properties;
    return {
      id: page.id,
      name: parseTitle(p['Name']),
      status: parseStatus(p['Status']),
      progress: parseFormulaNumber(p['Progress ']),
      areaIds: parseRelationIds(p['Areas']),
    };
  });
}

async function fetchAllAreas(notion: Client): Promise<NotionAreaItem[]> {
  const dbId = process.env.NOTION_AREAS_DB!;
  const pages = await fetchAllPages(notion, dbId);
  return pages.map((page) => ({
    id: page.id,
    name: parseTitle(page.properties['Name']),
  }));
}

function checkTasks(
  tasks: NotionTaskItem[],
  projectMap: Map<string, NotionProjectItem>
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  for (const t of tasks) {
    const name = t.task.trim();
    const pageName = name || '(geen naam)';
    if (!name) {
      issues.push({
        database: 'tasks',
        pageId: t.id,
        pageName: '(leeg)',
        severity: 'error',
        type: 'empty_name',
        message: 'Taak heeft geen naam',
      });
    }
    if (!t.status || t.status.trim() === '') {
      issues.push({
        database: 'tasks',
        pageId: t.id,
        pageName,
        severity: 'warning',
        type: 'missing_status',
        message: 'Status ontbreekt of is leeg',
      });
    }
    if (t.priority == null || t.priority.trim() === '') {
      issues.push({
        database: 'tasks',
        pageId: t.id,
        pageName,
        severity: 'info',
        type: 'missing_priority',
        message: 'Priority ontbreekt',
      });
    }
    if (t.projectIds.length > 0) {
      for (const pid of t.projectIds) {
        if (!projectMap.has(pid)) {
          issues.push({
            database: 'tasks',
            pageId: t.id,
            pageName,
            severity: 'warning',
            type: 'orphaned_task',
            message: 'Taak koppelt aan een project dat niet bestaat',
            details: `Project ID: ${pid}`,
          });
        }
      }
    }
  }
  return issues;
}

function checkProjects(
  projects: NotionProjectItem[],
  areaMap: Map<string, NotionAreaItem>,
  tasks: NotionTaskItem[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const projectIdsWithTasks = new Set<string>();
  for (const t of tasks) {
    for (const pid of t.projectIds) projectIdsWithTasks.add(pid);
  }
  const nameCount = new Map<string, number>();
  for (const p of projects) {
    const n = (nameCount.get(p.name) ?? 0) + 1;
    nameCount.set(p.name, n);
  }
  for (const p of projects) {
    const pageName = p.name.trim() || '(geen naam)';
    if (!p.name.trim()) {
      issues.push({
        database: 'projects',
        pageId: p.id,
        pageName: '(leeg)',
        severity: 'error',
        type: 'empty_name',
        message: 'Project heeft geen naam',
      });
    }
    if (p.areaIds.length === 0) {
      issues.push({
        database: 'projects',
        pageId: p.id,
        pageName,
        severity: 'warning',
        type: 'project_no_area',
        message: 'Geen area gekoppeld',
      });
    }
    if (!p.status || p.status.trim() === '') {
      issues.push({
        database: 'projects',
        pageId: p.id,
        pageName,
        severity: 'warning',
        type: 'missing_status',
        message: 'Status ontbreekt of is leeg',
      });
    }
    if (areaMap.size > 0) {
      for (const aid of p.areaIds) {
        if (!areaMap.has(aid)) {
          issues.push({
            database: 'projects',
            pageId: p.id,
            pageName,
            severity: 'error',
            type: 'broken_relation',
            message: 'Areas-relation bevat een ID die niet bestaat',
            details: `Area ID: ${aid}`,
          });
        }
      }
    }
    if (!projectIdsWithTasks.has(p.id)) {
      issues.push({
        database: 'projects',
        pageId: p.id,
        pageName,
        severity: 'info',
        type: 'empty_project',
        message: 'Geen taken gekoppeld aan dit project',
      });
    }
    if (nameCount.get(p.name) !== undefined && nameCount.get(p.name)! > 1) {
      issues.push({
        database: 'projects',
        pageId: p.id,
        pageName,
        severity: 'warning',
        type: 'duplicate_name',
        message: `Meerdere projecten met dezelfde naam: "${p.name}"`,
      });
    }
  }
  return issues;
}

function checkAreas(
  areas: NotionAreaItem[],
  projects: NotionProjectItem[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const areaIdsUsed = new Set<string>();
  for (const p of projects) {
    for (const aid of p.areaIds) areaIdsUsed.add(aid);
  }
  const nameCount = new Map<string, number>();
  for (const a of areas) {
    const n = (nameCount.get(a.name) ?? 0) + 1;
    nameCount.set(a.name, n);
  }
  for (const a of areas) {
    const pageName = a.name.trim() || '(geen naam)';
    if (!a.name.trim()) {
      issues.push({
        database: 'areas',
        pageId: a.id,
        pageName: '(leeg)',
        severity: 'error',
        type: 'empty_name',
        message: 'Area heeft geen naam',
      });
    }
    if (!areaIdsUsed.has(a.id)) {
      issues.push({
        database: 'areas',
        pageId: a.id,
        pageName,
        severity: 'info',
        type: 'empty_area',
        message: 'Geen projecten gekoppeld aan deze area',
      });
    }
    if (nameCount.get(a.name) !== undefined && nameCount.get(a.name)! > 1) {
      issues.push({
        database: 'areas',
        pageId: a.id,
        pageName,
        severity: 'warning',
        type: 'duplicate_name',
        message: `Meerdere areas met dezelfde naam: "${a.name}"`,
      });
    }
  }
  return issues;
}

function countByDb(issues: AuditIssue[]): {
  tasks: number;
  projects: number;
  areas: number;
} {
  let tasks = 0;
  let projects = 0;
  let areas = 0;
  for (const i of issues) {
    if (i.database === 'tasks') tasks++;
    else if (i.database === 'projects') projects++;
    else areas++;
  }
  return { tasks, projects, areas };
}

export async function GET() {
  if (!hasNotionConfig()) {
    return NextResponse.json(
      { error: 'Notion niet geconfigureerd (NOTION_API_KEY / DB IDs)' },
      { status: 400 }
    );
  }

  const notion = getNotion();
  const tasksDb = process.env.NOTION_TASKS_DB;
  const projectsDb = process.env.NOTION_PROJECTS_DB;
  const areasDb = process.env.NOTION_AREAS_DB;

  if (!notion || !tasksDb || !projectsDb) {
    return NextResponse.json(
      { error: 'Notion client of databases niet geconfigureerd' },
      { status: 500 }
    );
  }

  try {
    const [tasks, projects, areas] = await Promise.all([
      fetchAllTasks(notion),
      fetchAllProjects(notion),
      areasDb ? fetchAllAreas(notion) : Promise.resolve([] as NotionAreaItem[]),
    ]);

    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const areaMap = new Map(areas.map((a) => [a.id, a]));

    const issues: AuditIssue[] = [
      ...checkTasks(tasks, projectMap),
      ...checkProjects(projects, areaMap, tasks),
      ...checkAreas(areas, projects),
    ];

    const errors = issues.filter((i) => i.severity === 'error').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;
    const info = issues.filter((i) => i.severity === 'info').length;

    const byDb = countByDb(issues);

    const result: AuditResult = {
      runAt: new Date().toISOString(),
      totalIssues: issues.length,
      errors,
      warnings,
      info,
      issues,
      summary: {
        tasks: { total: tasks.length, issues: byDb.tasks },
        projects: { total: projects.length, issues: byDb.projects },
        areas: { total: areas.length, issues: byDb.areas },
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Notion API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
