#!/usr/bin/env node
/**
 * Adds Schedule Trigger + Telegram nodes to daily-briefing and weekly-review,
 * and creates the telegram-commands workflow.
 * Uses hardcoded TELEGRAM_CHAT_ID (no n8n Variables/Pro).
 * Run: node scripts/update-n8n-telegram.mjs (from apps/command-center)
 * Requires: N8N_API_KEY, TELEGRAM_BOT_TOKEN in .env.local (for credential + test message)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const envPath = join(root, '.env.local');

const TELEGRAM_CHAT_ID = '469664360';

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
const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

if (!API_KEY) {
  console.error('Missing N8N_API_KEY in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-N8N-API-KEY': API_KEY,
};

const apiBase = `${N8N_BASE}/api/v1`;

async function getWorkflowIdByName(name) {
  const res = await fetch(`${apiBase}/workflows`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  const list = data.data || [];
  const w = list.find((x) => x.name === name);
  return w ? w.id : null;
}

function node(id, name, type, typeVersion, position, parameters, extra = {}) {
  return { id, name, type, typeVersion, position, parameters, ...extra };
}

// --- daily-briefing: add Schedule Trigger (Mon–Fri 09:00) + Telegram ---
async function updateDailyBriefing() {
  const id = await getWorkflowIdByName('daily-briefing');
  if (!id) {
    console.warn('Workflow daily-briefing not found. Run create-n8n-workflows.mjs first.');
    return;
  }
  const res = await fetch(`${apiBase}/workflows/${id}`, { headers });
  if (!res.ok) {
    console.error('Failed to GET daily-briefing:', res.status);
    return;
  }
  const w = await res.json();
  const nodes = w.nodes || [];
  const connections = w.connections || {};

  const hasSchedule = nodes.some((n) => n.type === 'n8n-nodes-base.scheduleTrigger');
  const hasTelegram = nodes.some((n) => n.type === 'n8n-nodes-base.telegram');
  if (hasSchedule && hasTelegram) {
    console.log('daily-briefing: Schedule + Telegram already present');
    return;
  }

  const maxX = Math.max(...nodes.map((n) => n.position?.[0] ?? 0), 0);
  const scheduleId = randomUUID();
  const telegramId = randomUUID();

  if (!hasSchedule) {
    nodes.push(node(scheduleId, 'Schedule Trigger', 'n8n-nodes-base.scheduleTrigger', 1.2, [240, 480], {
      rule: {
        interval: [
          {
            field: 'cronExpression',
            expression: '0 9 * * 1-5',
          },
        ],
      },
    }));
    connections['Schedule Trigger'] = { main: [[{ node: 'Get Notion Tasks', type: 'main', index: 0 }]] };
  }

  if (!hasTelegram) {
    nodes.push(node(telegramId, 'Telegram', 'n8n-nodes-base.telegram', 1.2, [maxX + 220, 480], {
      operation: 'sendMessage',
      chatId: TELEGRAM_CHAT_ID,
      text: '🌅 *Dagelijkse Briefing*\n\n{{ $json.briefing }}\n\n📊 _Gegenereerd door Ollama mistral_',
      additionalFields: { parse_mode: 'Markdown', disable_web_page_preview: true },
    }));
    if (!connections['Extract Content']) connections['Extract Content'] = { main: [[]] };
    const extractMain = connections['Extract Content'].main || [[], []];
    if (!extractMain[0]) extractMain[0] = [];
    extractMain[0].push({ node: 'Telegram', type: 'main', index: 0 });
    connections['Extract Content'].main = extractMain;
  }

  const putRes = await fetch(`${apiBase}/workflows/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: w.name, nodes, connections, settings: w.settings || { executionOrder: 'v1' } }),
  });
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    console.error('Failed to PUT daily-briefing:', putRes.status, err);
    return;
  }
  console.log('Updated daily-briefing: Schedule Trigger (0 9 * * 1-5) + Telegram node');
}

// --- weekly-review: add Schedule Trigger (Fri 17:00) + Telegram ---
async function updateWeeklyReview() {
  const id = await getWorkflowIdByName('weekly-review');
  if (!id) {
    console.warn('Workflow weekly-review not found. Run create-n8n-workflows.mjs first.');
    return;
  }
  const res = await fetch(`${apiBase}/workflows/${id}`, { headers });
  if (!res.ok) {
    console.error('Failed to GET weekly-review:', res.status);
    return;
  }
  const w = await res.json();
  const nodes = w.nodes || [];
  const connections = w.connections || {};

  const hasSchedule = nodes.some((n) => n.type === 'n8n-nodes-base.scheduleTrigger');
  const hasTelegram = nodes.some((n) => n.type === 'n8n-nodes-base.telegram');
  if (hasSchedule && hasTelegram) {
    console.log('weekly-review: Schedule + Telegram already present');
    return;
  }

  const maxX = Math.max(...nodes.map((n) => n.position?.[0] ?? 0), 0);
  const scheduleId = randomUUID();
  const telegramId = randomUUID();

  if (!hasSchedule) {
    nodes.push(node(scheduleId, 'Schedule Trigger', 'n8n-nodes-base.scheduleTrigger', 1.2, [240, 480], {
      rule: {
        interval: [
          {
            field: 'cronExpression',
            expression: '0 17 * * 5',
          },
        ],
      },
    }));
    connections['Schedule Trigger'] = { main: [[{ node: 'Get Notion Tasks', type: 'main', index: 0 }]] };
  }

  if (!hasTelegram) {
    nodes.push(node(telegramId, 'Telegram', 'n8n-nodes-base.telegram', 1.2, [maxX + 220, 480], {
      operation: 'sendMessage',
      chatId: TELEGRAM_CHAT_ID,
      text: '📊 *Week Review*\n\n{{ $json.review }}\n\n_ Gegenereerd {{ $json.generatedAt }}_',
      additionalFields: { parse_mode: 'Markdown' },
    }));
    if (!connections['Extract Review']) connections['Extract Review'] = { main: [[]] };
    const extractMain = connections['Extract Review'].main || [[], []];
    if (!extractMain[0]) extractMain[0] = [];
    extractMain[0].push({ node: 'Telegram', type: 'main', index: 0 });
    connections['Extract Review'].main = extractMain;
  }

  const putRes = await fetch(`${apiBase}/workflows/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: w.name, nodes, connections, settings: w.settings || { executionOrder: 'v1' } }),
  });
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    console.error('Failed to PUT weekly-review:', putRes.status, err);
    return;
  }
  console.log('Updated weekly-review: Schedule Trigger (0 17 * * 5) + Telegram node');
}

// --- Create telegram-commands workflow ---
const N8N_WEBHOOK = N8N_BASE;

async function createTelegramCommands() {
  const listRes = await fetch(`${apiBase}/workflows`, { headers });
  const listData = await listRes.json();
  const existing = (listData.data || []).find((w) => w.name === 'telegram-commands');
  if (existing) {
    console.log('telegram-commands workflow already exists (id:', existing.id, ')');
    return;
  }

  const a = randomUUID();
  const b = randomUUID();
  const c = randomUUID();
  const d = randomUUID();
  const e = randomUUID();
  const f = randomUUID();
  const g = randomUUID();
  const h = randomUUID();

  const workflow = {
    name: 'telegram-commands',
    nodes: [
      node(a, 'Telegram Trigger', 'n8n-nodes-base.telegramTrigger', 1.2, [240, 300], {
        updates: ['message'],
      }),
      node(b, 'Switch Command', 'n8n-nodes-base.switch', 3.2, [460, 300], {
        rules: {
          rules: [
            { value: '={{ $json.message.text?.startsWith("/briefing") }}', outputKey: 'briefing' },
            { value: '={{ $json.message.text?.startsWith("/breakdown") }}', outputKey: 'breakdown' },
            { value: '={{ $json.message.text?.startsWith("/review") }}', outputKey: 'review' },
            { value: '={{ $json.message.text?.startsWith("/taken") }}', outputKey: 'taken' },
          ],
        },
        options: { fallbackOutput: 'extra' },
      }),
      node(c, 'Call Daily Briefing', 'n8n-nodes-base.httpRequest', 4.2, [680, 180], {
        method: 'POST',
        url: `${N8N_WEBHOOK}/webhook/daily-briefing`,
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '{}',
      }),
      node(d, 'Call Task Breakdown', 'n8n-nodes-base.httpRequest', 4.2, [680, 300], {
        method: 'POST',
        url: `${N8N_WEBHOOK}/webhook/task-breakdown`,
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={"goal": "{{ $json.message.text?.replace(/^\\/breakdown\\s*/, "") || "geen doel" }}" }',
      }),
      node(e, 'Call Weekly Review', 'n8n-nodes-base.httpRequest', 4.2, [680, 420], {
        method: 'POST',
        url: `${N8N_WEBHOOK}/webhook/weekly-review`,
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '{}',
      }),
      node(f, 'Get Notion Tasks', 'n8n-nodes-base.httpRequest', 4.2, [680, 540], {
        method: 'GET',
        url: 'http://localhost:3000/api/notion/tasks',
      }),
      node(g, 'Format & Send', 'n8n-nodes-base.code', 2, [900, 300], {
        mode: 'runOnceForAllItems',
        jsCode: `const item = $input.first().json;
const chatId = $('Telegram Trigger').first().json.message.chat.id;
let text = '';
if (item.briefing) text = '🌅 *Briefing*\\n\\n' + item.briefing;
else if (item.tasks) text = '📋 *Subtaken*\\n\\n' + (item.tasks || []).map(t => '• ' + (t.task || t)).join('\\n');
else if (item.review) text = '📊 *Week Review*\\n\\n' + item.review;
else if (Array.isArray(item.tasks)) text = '✅ *Open taken*\\n\\n' + item.tasks.filter(t => !t.done).slice(0, 15).map(t => '• ' + t.task).join('\\n');
else text = JSON.stringify(item).slice(0, 1000);
return [{ json: { chatId, text } }];`,
      }),
      node(h, 'Telegram Send', 'n8n-nodes-base.telegram', 1.2, [1120, 300], {
        operation: 'sendMessage',
        chatId: '={{ $json.chatId }}',
        text: '={{ $json.text }}',
        additionalFields: { parse_mode: 'Markdown' },
      }),
    ],
    connections: {
      'Telegram Trigger': { main: [[{ node: 'Switch Command', type: 'main', index: 0 }]] },
      'Switch Command': {
        main: [
          [{ node: 'Call Daily Briefing', type: 'main', index: 0 }],
          [{ node: 'Call Task Breakdown', type: 'main', index: 0 }],
          [{ node: 'Call Weekly Review', type: 'main', index: 0 }],
          [{ node: 'Get Notion Tasks', type: 'main', index: 0 }],
        ],
      },
      'Call Daily Briefing': { main: [[{ node: 'Format & Send', type: 'main', index: 0 }]] },
      'Call Task Breakdown': { main: [[{ node: 'Format & Send', type: 'main', index: 0 }]] },
      'Call Weekly Review': { main: [[{ node: 'Format & Send', type: 'main', index: 0 }]] },
      'Get Notion Tasks': { main: [[{ node: 'Format & Send', type: 'main', index: 0 }]] },
      'Format & Send': { main: [[{ node: 'Telegram Send', type: 'main', index: 0 }]] },
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
    return;
  }
  const data = await createRes.json();
  const id = data.id ?? data.data?.id;
  console.log('Created workflow: telegram-commands (id:', id, ')');
  const actRes = await fetch(`${apiBase}/workflows/${id}/activate`, { method: 'POST', headers });
  if (actRes.ok) console.log('  Activated telegram-commands');
  else console.warn('  Activate skipped (set Telegram credentials in n8n first)');
}

async function ensureTelegramCredential() {
  const listRes = await fetch(`${apiBase}/credentials`, { headers });
  if (!listRes.ok) return null;
  const list = await listRes.json();
  const existing = (list.data || []).find((c) => c.type === 'telegramApi');
  if (existing) {
    console.log('Telegram credential exists:', existing.id);
    return existing.id;
  }
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set; run scripts/fix-n8n-telegram.mjs after setting it to create credential.');
    return null;
  }
  const createRes = await fetch(`${apiBase}/credentials`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Telegram Bot',
      type: 'telegramApi',
      data: { botToken: TELEGRAM_BOT_TOKEN },
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    console.warn('Could not create Telegram credential:', err.message || createRes.status);
    return null;
  }
  const data = await createRes.json();
  const credId = data.id ?? data.data?.id;
  console.log('Created Telegram credential:', credId);
  return credId;
}

async function sendTestMessage() {
  if (!TELEGRAM_BOT_TOKEN) return;
  const testRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: '✅ n8n Telegram setup compleet! Stuur /briefing om te testen.',
        parse_mode: 'Markdown',
      }),
    }
  );
  const testData = await testRes.json();
  console.log('Test bericht:', testRes.ok ? 'verstuurd' : testData);
}

async function main() {
  const credentialId = await ensureTelegramCredential();
  await updateDailyBriefing();
  await updateWeeklyReview();
  await createTelegramCommands();
  await sendTestMessage();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
