#!/usr/bin/env node
/**
 * Fix telegram-commands workflow in n8n:
 * 1. Delete any broken workflows named "telegram-commands" or "My workflow 2"
 * 2. Create a new telegram-commands workflow with Switch in EXPRESSION mode
 *    (so routing works: message.text → output index 0–3 for /briefing, /breakdown, /review, /taken)
 * 3. Activate the workflow.
 *
 * Run: node scripts/fix-telegram-commands-workflow.mjs (from apps/command-center)
 * Requires: N8N_API_KEY in .env.local
 * n8n base URL: N8N_WEBHOOK_BASE_URL or https://n8n.matmat.me
 *
 * After running: open the workflow in n8n UI and test with /briefing, /breakdown,
 * /review, /taken to confirm the Switch node routes to the correct branch.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

const TELEGRAM_CRED_ID = 'OEh6OZFx8e8bUGKH';

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
const CC_URL = (env.COMMAND_CENTER_PUBLIC_URL || process.env.COMMAND_CENTER_PUBLIC_URL || 'https://command-center.matmat.me').replace(/\/$/, '');

if (!API_KEY) {
  console.error('Missing N8N_API_KEY in .env.local');
  process.exit(1);
}

const apiBase = `${N8N_BASE}/api/v1`;
const headers = { 'Content-Type': 'application/json', 'X-N8N-API-KEY': API_KEY };

async function listWorkflows() {
  const res = await fetch(`${apiBase}/workflows`, { headers });
  if (!res.ok) {
    console.error('Failed to list workflows:', res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return data.data || [];
}

async function deleteWorkflowsToRemove() {
  const list = await listWorkflows();
  const toDelete = list.filter((w) => w.name === 'telegram-commands' || w.name === 'My workflow 2');
  for (const w of toDelete) {
    console.log('Deleting workflow:', w.name, '(id:', w.id, ')');
    const del = await fetch(`${apiBase}/workflows/${w.id}`, { method: 'DELETE', headers });
    if (!del.ok) console.error('  Delete failed:', del.status);
    else console.log('  Deleted');
  }
  return toDelete.length;
}

async function createAndActivate() {
  const ids = Array.from({ length: 8 }, () => randomUUID());
  const cred = { telegramApi: { id: TELEGRAM_CRED_ID, name: 'Telegram Bot' } };

  // Expression: 0=/briefing, 1=/breakdown, 2=/review, 3=/taken. No match → 0 (briefing).
  const switchExpression =
    "={{ $json.message?.text?.startsWith('/briefing') ? 0 : $json.message?.text?.startsWith('/breakdown') ? 1 : $json.message?.text?.startsWith('/review') ? 2 : $json.message?.text?.startsWith('/taken') ? 3 : 0 }}";

  const formatReplyCode = `const item = $input.first().json;
const chatId = $('Telegram Trigger').first().json.message.chat.id;
let text = '';
if (item.briefing) text = '🌅 *Briefing*\\n\\n' + item.briefing;
else if (item.tasks && Array.isArray(item.tasks)) text = '📋 *Subtaken*\\n\\n' + item.tasks.map(t => '• ' + (t.task || t)).join('\\n');
else if (item.review) text = '📊 *Week Review*\\n\\n' + item.review;
else if (Array.isArray(item.results)) {
  const lines = (item.results || []).slice(0, 15).map(p => {
    const name = p?.properties?.Name?.title?.[0]?.plain_text || '(naam onbekend)';
    return '• ' + name;
  });
  text = '✅ *Open taken*\\n\\n' + (lines.length ? lines.join('\\n') : 'Geen open taken.');
} else text = (item.message || item.error) ? String(item.message || item.error) : JSON.stringify(item).slice(0, 800);
return [{ json: { chatId, text } }];`;

  const workflow = {
    name: 'telegram-commands',
    nodes: [
      {
        id: ids[0],
        name: 'Telegram Trigger',
        type: 'n8n-nodes-base.telegramTrigger',
        typeVersion: 1.2,
        position: [240, 300],
        parameters: { updates: ['message'] },
        credentials: cred,
      },
      {
        id: ids[1],
        name: 'Switch Command',
        type: 'n8n-nodes-base.switch',
        typeVersion: 3.4,
        position: [460, 300],
        parameters: {
          mode: 'expression',
          numberOutputs: 4,
          output: switchExpression,
        },
      },
      {
        id: ids[2],
        name: 'Call Briefing',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [680, 180],
        parameters: {
          method: 'POST',
          url: `${CC_URL}/api/ai/briefing`,
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '{}',
        },
      },
      {
        id: ids[3],
        name: 'Call Breakdown',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [680, 300],
        parameters: {
          method: 'POST',
          url: `${CC_URL}/api/ai/breakdown`,
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '{}',
        },
      },
      {
        id: ids[4],
        name: 'Call Review',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [680, 420],
        parameters: {
          method: 'POST',
          url: `${CC_URL}/api/ai/weekly-review`,
          sendBody: true,
          specifyBody: 'json',
          jsonBody: '{}',
        },
      },
      {
        id: ids[5],
        name: 'Get Tasks',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [680, 540],
        parameters: { method: 'GET', url: `${CC_URL}/api/notion/tasks` },
      },
      {
        id: ids[6],
        name: 'Format Reply',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 300],
        parameters: { mode: 'runOnceForAllItems', jsCode: formatReplyCode },
      },
      {
        id: ids[7],
        name: 'Telegram Send Message',
        type: 'n8n-nodes-base.telegram',
        typeVersion: 1.2,
        position: [1120, 300],
        parameters: {
          operation: 'sendMessage',
          chatId: '={{ $json.chatId }}',
          text: '={{ $json.text }}',
          additionalFields: { parse_mode: 'Markdown' },
        },
        credentials: cred,
      },
    ],
    connections: {
      'Telegram Trigger': { main: [[{ node: 'Switch Command', type: 'main', index: 0 }]] },
      'Switch Command': {
        main: [
          [{ node: 'Call Briefing', type: 'main', index: 0 }],
          [{ node: 'Call Breakdown', type: 'main', index: 0 }],
          [{ node: 'Call Review', type: 'main', index: 0 }],
          [{ node: 'Get Tasks', type: 'main', index: 0 }],
        ],
      },
      'Call Briefing': { main: [[{ node: 'Format Reply', type: 'main', index: 0 }]] },
      'Call Breakdown': { main: [[{ node: 'Format Reply', type: 'main', index: 0 }]] },
      'Call Review': { main: [[{ node: 'Format Reply', type: 'main', index: 0 }]] },
      'Get Tasks': { main: [[{ node: 'Format Reply', type: 'main', index: 0 }]] },
      'Format Reply': { main: [[{ node: 'Telegram Send Message', type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1' },
  };

  const createRes = await fetch(`${apiBase}/workflows`, {
    method: 'POST',
    headers,
    body: JSON.stringify(workflow),
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    console.error('Failed to create telegram-commands:', createRes.status, err);
    process.exit(1);
  }
  const data = await createRes.json();
  const id = data.id ?? data.data?.id;
  console.log('Created workflow: telegram-commands (id:', id, ')');

  const actRes = await fetch(`${apiBase}/workflows/${id}/activate`, { method: 'POST', headers });
  if (actRes.ok) {
    console.log('Activated telegram-commands.');
  } else {
    console.warn('Activate failed (' + actRes.status + '). Activate manually in n8n UI.');
  }

  console.log('\nNext: Open', N8N_BASE, '→ telegram-commands → run a test (e.g. /briefing) to confirm Switch routes correctly.');
}

async function main() {
  const deleted = await deleteWorkflowsToRemove();
  console.log(deleted ? 'Removed ' + deleted + ' workflow(s).' : 'No workflows to delete.');
  await createAndActivate();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
