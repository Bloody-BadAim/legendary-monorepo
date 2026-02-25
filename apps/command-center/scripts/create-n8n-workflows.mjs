#!/usr/bin/env node
/**
 * Creates the 4 Command Center n8n workflows via REST API.
 * Run from repo root: node apps/command-center/scripts/create-n8n-workflows.mjs
 * Requires N8N_API_KEY and N8N_WEBHOOK_BASE_URL in .env.local (or env).
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

function loadEnv() {
  try {
    const content = readFileSync(envPath, 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const N8N_BASE = (env.N8N_WEBHOOK_BASE_URL || process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.matmat.me').replace(/\/$/, '');
const API_KEY = env.N8N_API_KEY || process.env.N8N_API_KEY;
const CC_URL = (env.COMMAND_CENTER_PUBLIC_URL || process.env.COMMAND_CENTER_PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');

if (!API_KEY) {
  console.error('Missing N8N_API_KEY in .env.local or env');
  process.exit(1);
}
if (!env.COMMAND_CENTER_PUBLIC_URL && !process.env.COMMAND_CENTER_PUBLIC_URL) {
  console.warn('COMMAND_CENTER_PUBLIC_URL not set; using http://localhost:3000 (n8n on remote cannot call this)');
}

const headers = {
  'Content-Type': 'application/json',
  'X-N8N-API-KEY': API_KEY,
};

function node(id, name, type, typeVersion, position, parameters, extra = {}) {
  return { id, name, type, typeVersion, position, parameters, ...extra };
}

function conn(from, to) {
  return { [from]: { main: [[{ node: to, type: 'main', index: 0 }]] } };
}

function mergeConnections(...maps) {
  const out = {};
  for (const m of maps) {
    for (const [k, v] of Object.entries(m)) out[k] = v;
  }
  return out;
}

// --- Workflow 1: task-breakdown ---
function workflowTaskBreakdown() {
  const a = randomUUID(), b = randomUUID(), c = randomUUID(), d = randomUUID(), e = randomUUID();
  return {
    name: 'task-breakdown',
    nodes: [
      node(a, 'Webhook', 'n8n-nodes-base.webhook', 2, [240, 300], {
        httpMethod: 'POST',
        path: 'task-breakdown',
        responseMode: 'responseNode',
        options: {},
      }, { webhookId: 'task-breakdown' }),
      node(b, 'Parse Input', 'n8n-nodes-base.code', 2, [460, 300], {
        mode: 'runOnceForAllItems',
        jsCode: `const goal = $input.first().json.body?.goal ?? $input.first().json.goal ?? 'geen doel opgegeven';
return [{ json: { goal } }];`,
      }),
      node(c, 'Command Center Breakdown', 'n8n-nodes-base.httpRequest', 4.2, [680, 300], {
        method: 'POST',
        url: `${CC_URL}/api/ai/breakdown`,
        sendHeaders: true,
        headerParameters: {
          parameters: [{ name: 'Content-Type', value: 'application/json' }],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '{"goal": "={{ $json.goal }}"}',
      }),
      node(d, 'Parse AI Response', 'n8n-nodes-base.code', 2, [900, 300], {
        mode: 'runOnceForAllItems',
        jsCode: `const data = $input.first().json;
const tasks = Array.isArray(data.tasks) ? data.tasks : (data.error ? [] : [{ task: 'Geen taken', priority: 'Medium', estimatedMinutes: 30 }]);
return [{ json: { tasks, count: tasks.length } }];`,
      }),
      node(e, 'Respond to Webhook', 'n8n-nodes-base.respondToWebhook', 1.1, [1120, 300], {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify($json) }}',
      }),
    ],
    connections: mergeConnections(
      conn('Webhook', 'Parse Input'),
      conn('Parse Input', 'Command Center Breakdown'),
      conn('Command Center Breakdown', 'Parse AI Response'),
      conn('Parse AI Response', 'Respond to Webhook')
    ),
    settings: { executionOrder: 'v1' },
  };
}

// --- Workflow 2: daily-briefing ---
function workflowDailyBriefing() {
  const a = randomUUID(), b = randomUUID(), c = randomUUID(), d = randomUUID();
  return {
    name: 'daily-briefing',
    nodes: [
      node(a, 'Webhook', 'n8n-nodes-base.webhook', 2, [240, 300], {
        httpMethod: 'POST',
        path: 'daily-briefing',
        responseMode: 'responseNode',
        options: {},
      }, { webhookId: 'daily-briefing' }),
      node(b, 'Get Briefing', 'n8n-nodes-base.httpRequest', 4.2, [460, 300], {
        method: 'POST',
        url: `${CC_URL}/api/ai/briefing`,
        sendHeaders: true,
        headerParameters: {
          parameters: [{ name: 'Content-Type', value: 'application/json' }],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '{}',
      }),
      node(c, 'Extract Content', 'n8n-nodes-base.code', 2, [680, 300], {
        mode: 'runOnceForAllItems',
        jsCode: `const data = $input.first().json;
const briefing = data.briefing ?? data.error ?? 'Geen briefing beschikbaar';
return [{ json: { briefing, generatedAt: new Date().toISOString() } }];`,
      }),
      node(d, 'Respond to Webhook', 'n8n-nodes-base.respondToWebhook', 1.1, [900, 300], {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify($json) }}',
      }),
    ],
    connections: mergeConnections(
      conn('Webhook', 'Get Briefing'),
      conn('Get Briefing', 'Extract Content'),
      conn('Extract Content', 'Respond to Webhook')
    ),
    settings: { executionOrder: 'v1' },
  };
}

// --- Workflow 3: idea-to-project ---
function workflowIdeaToProject() {
  const a = randomUUID(), b = randomUUID(), c = randomUUID(), d = randomUUID(), e = randomUUID();
  return {
    name: 'idea-to-project',
    nodes: [
      node(a, 'Webhook', 'n8n-nodes-base.webhook', 2, [240, 300], {
        httpMethod: 'POST',
        path: 'idea-to-project',
        responseMode: 'responseNode',
        options: {},
      }, { webhookId: 'idea-to-project' }),
      node(b, 'Command Center Idea', 'n8n-nodes-base.httpRequest', 4.2, [460, 300], {
        method: 'POST',
        url: `${CC_URL}/api/ai/idea-to-project`,
        sendHeaders: true,
        headerParameters: {
          parameters: [{ name: 'Content-Type', value: 'application/json' }],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '{"idea": "={{ $json.body?.idea ?? $json.idea ?? \\"\\" }}"}' ,
      }),
      node(c, 'Parse Project', 'n8n-nodes-base.code', 2, [680, 300], {
        mode: 'runOnceForAllItems',
        jsCode: `const data = $input.first().json;
const project = {
  projectName: data.projectName ?? 'Nieuw Project',
  description: data.description ?? '',
  tasks: Array.isArray(data.tasks) ? data.tasks : [],
};
return [{ json: project }];`,
      }),
      node(d, 'Respond to Webhook', 'n8n-nodes-base.respondToWebhook', 1.1, [900, 300], {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify({ projectName: $json.projectName, tasksCreated: ($json.tasks || []).length }) }}',
      }),
    ],
    connections: mergeConnections(
      conn('Webhook', 'Command Center Idea'),
      conn('Command Center Idea', 'Parse Project'),
      conn('Parse Project', 'Respond to Webhook')
    ),
    settings: { executionOrder: 'v1' },
  };
}

// --- Workflow 4: weekly-review ---
function workflowWeeklyReview() {
  const a = randomUUID(), b = randomUUID(), c = randomUUID(), d = randomUUID(), e = randomUUID(), f = randomUUID();
  return {
    name: 'weekly-review',
    nodes: [
      node(a, 'Webhook', 'n8n-nodes-base.webhook', 2, [240, 300], {
        httpMethod: 'POST',
        path: 'weekly-review',
        responseMode: 'responseNode',
        options: {},
      }, { webhookId: 'weekly-review' }),
      node(b, 'Get Notion Tasks', 'n8n-nodes-base.httpRequest', 4.2, [460, 300], {
        method: 'GET',
        url: `${CC_URL}/api/notion/tasks`,
      }),
      node(c, 'Filter Done', 'n8n-nodes-base.code', 2, [680, 300], {
        mode: 'runOnceForAllItems',
        jsCode: `const tasks = $input.first().json.tasks ?? [];
const done = tasks
  .filter(t => t.status === 'Done')
  .map(t => \`- \${t.task}\`)
  .join('\\n');
const open = tasks.filter(t => t.status !== 'Done').length;
const doneCount = tasks.filter(t => t.status === 'Done').length;
return [{ json: { doneTasks: done, openCount: open, doneCount } }];`,
      }),
      node(d, 'Command Center Review', 'n8n-nodes-base.httpRequest', 4.2, [900, 300], {
        method: 'POST',
        url: `${CC_URL}/api/ai/weekly-review`,
        sendHeaders: true,
        headerParameters: {
          parameters: [{ name: 'Content-Type', value: 'application/json' }],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '{"doneTasks": "={{ $json.doneTasks }}", "openCount": {{ $json.openCount }}, "doneCount": {{ $json.doneCount }}}',
      }),
      node(e, 'Extract Review', 'n8n-nodes-base.code', 2, [1120, 300], {
        mode: 'runOnceForAllItems',
        jsCode: `const data = $input.first().json;
const review = data.review ?? data.error ?? '';
return [{ json: { review, generatedAt: new Date().toISOString() } }];`,
      }),
      node(f, 'Respond to Webhook', 'n8n-nodes-base.respondToWebhook', 1.1, [1340, 300], {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify($json) }}',
      }),
    ],
    connections: mergeConnections(
      conn('Webhook', 'Get Notion Tasks'),
      conn('Get Notion Tasks', 'Filter Done'),
      conn('Filter Done', 'Command Center Review'),
      conn('Command Center Review', 'Extract Review'),
      conn('Extract Review', 'Respond to Webhook')
    ),
    settings: { executionOrder: 'v1' },
  };
}

async function main() {
  const base = N8N_BASE.replace(/\/$/, '');
  const apiBase = `${base}/api/v1`;

  // List existing
  let existing = [];
  try {
    const r = await fetch(`${apiBase}/workflows`, { headers });
    const data = await r.json();
    existing = data.data || [];
  } catch (e) {
    console.error('Failed to list workflows:', e.message);
    process.exit(1);
  }

  const names = new Set(existing.map((w) => w.name));
  const toCreate = [
    { name: 'task-breakdown', fn: workflowTaskBreakdown },
    { name: 'daily-briefing', fn: workflowDailyBriefing },
    { name: 'idea-to-project', fn: workflowIdeaToProject },
    { name: 'weekly-review', fn: workflowWeeklyReview },
  ].filter((w) => !names.has(w.name));

  if (toCreate.length === 0) {
    console.log('All 4 workflows already exist. Exiting.');
    process.exit(0);
  }

  for (const { name, fn } of toCreate) {
    const body = fn();
    try {
      const res = await fetch(`${apiBase}/workflows`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(`Failed to create ${name}:`, res.status, data);
        continue;
      }
      const id = data.id ?? data.data?.id;
      console.log(`Created workflow: ${name} (id: ${id})`);
      if (id) {
        const act = await fetch(`${apiBase}/workflows/${id}/activate`, { method: 'POST', headers });
        if (act.ok) console.log(`  Activated ${name}`);
        else console.warn(`  Activate failed: ${act.status}`);
      }
    } catch (e) {
      console.error(`Error creating ${name}:`, e.message);
    }
  }
}

main();
