import { NextResponse } from 'next/server';
import { getNotion, hasNotionConfig } from '@/lib/notion';
import { PROJECTS } from '@/data/projects';
import { TOOL_CATEGORIES } from '@/data/tools';
import { MCPS } from '@/data/mcps';
import { ROADMAP } from '@/data/roadmap';

export const dynamic = 'force-dynamic';

function toNotionStatus(s: string): 'Not started' | 'In progress' | 'Done' {
  if (s === 'in-progress') return 'In progress';
  if (s === 'live') return 'Done';
  return 'Not started';
}

function toolStatusToNotion(s: string): 'Not started' | 'In progress' | 'Done' {
  if (s === 'active') return 'Done';
  if (s === 'setup') return 'In progress';
  return 'Not started';
}

function isStatusValidationError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('Status is expected to be status');
}

async function syncProjects(
  notion: ReturnType<typeof getNotion>,
  dbId: string
) {
  if (!notion) return [];
  const created: string[] = [];
  for (const proj of PROJECTS) {
    const baseProps = {
      Name: {
        type: 'title' as const,
        title: [{ type: 'text' as const, text: { content: proj.name } }],
      },
    };
    try {
      await notion.pages.create({
        parent: { database_id: dbId },
        properties: {
          ...baseProps,
          Status: { status: { name: toNotionStatus(proj.status) } },
        },
      });
    } catch (e) {
      if (isStatusValidationError(e)) {
        await notion.pages.create({
          parent: { database_id: dbId },
          properties: baseProps,
        });
      } else throw e;
    }
    created.push(proj.name);
  }
  return created;
}

async function syncTasks(notion: ReturnType<typeof getNotion>, dbId: string) {
  if (!notion) return [];
  const created: string[] = [];
  for (const week of ROADMAP) {
    for (const task of week.tasks) {
      const baseProps = {
        Name: {
          type: 'title' as const,
          title: [{ type: 'text' as const, text: { content: task.task } }],
        },
      };
      try {
        await notion.pages.create({
          parent: { database_id: dbId },
          properties: {
            ...baseProps,
            Status: { status: { name: task.done ? 'Done' : 'Not started' } },
          },
        });
      } catch (e) {
        if (isStatusValidationError(e)) {
          await notion.pages.create({
            parent: { database_id: dbId },
            properties: baseProps,
          });
        } else throw e;
      }
      created.push(task.task);
    }
  }
  return created;
}

async function syncTools(notion: ReturnType<typeof getNotion>, dbId: string) {
  if (!notion) return [];
  const created: string[] = [];
  for (const cat of TOOL_CATEGORIES) {
    for (const tool of cat.tools) {
      const baseProps = {
        Name: {
          type: 'title' as const,
          title: [{ type: 'text' as const, text: { content: tool.name } }],
        },
        Category: { type: 'select' as const, select: { name: cat.name } },
        Description: {
          type: 'rich_text' as const,
          rich_text: [
            { type: 'text' as const, text: { content: tool.description } },
          ],
        },
      };
      try {
        await notion.pages.create({
          parent: { database_id: dbId },
          properties: {
            ...baseProps,
            Status: { status: { name: toolStatusToNotion(tool.status) } },
          },
        });
      } catch (e) {
        if (isStatusValidationError(e)) {
          await notion.pages.create({
            parent: { database_id: dbId },
            properties: baseProps,
          });
        } else throw e;
      }
      created.push(tool.name);
    }
  }
  return created;
}

async function syncMcps(notion: ReturnType<typeof getNotion>, dbId: string) {
  if (!notion) return [];
  const created: string[] = [];
  for (const mcp of MCPS) {
    await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        Name: {
          type: 'title' as const,
          title: [{ type: 'text' as const, text: { content: mcp.name } }],
        },
        Description: {
          type: 'rich_text' as const,
          rich_text: [
            { type: 'text' as const, text: { content: mcp.description } },
          ],
        },
        'Use Case': {
          type: 'rich_text' as const,
          rich_text: [{ type: 'text' as const, text: { content: mcp.use } }],
        },
      },
    });
    created.push(mcp.name);
  }
  return created;
}

export async function POST() {
  if (!hasNotionConfig()) {
    return NextResponse.json(
      { error: 'Notion niet geconfigureerd' },
      { status: 400 }
    );
  }
  const notion = getNotion();
  if (!notion) {
    return NextResponse.json({ error: 'Notion client fout' }, { status: 500 });
  }

  const results: Record<string, string[]> = {};
  const errors: string[] = [];

  const projectsDb = process.env.NOTION_PROJECTS_DB;
  const tasksDb = process.env.NOTION_TASKS_DB;
  const toolsDb = process.env.NOTION_TOOLS_DB;
  const mcpsDb = process.env.NOTION_MCPS_DB;

  if (projectsDb) {
    try {
      results.projects = await syncProjects(notion, projectsDb);
    } catch (e) {
      errors.push(`Projects: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (tasksDb) {
    try {
      results.tasks = await syncTasks(notion, tasksDb);
    } catch (e) {
      errors.push(`Tasks: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (toolsDb) {
    try {
      results.tools = await syncTools(notion, toolsDb);
    } catch (e) {
      errors.push(`Tools: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (mcpsDb) {
    try {
      results.mcps = await syncMcps(notion, mcpsDb);
    } catch (e) {
      errors.push(`MCPs: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    synced: results,
    errors: errors.length ? errors : undefined,
  });
}
