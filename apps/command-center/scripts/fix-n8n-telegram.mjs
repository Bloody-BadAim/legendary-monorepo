#!/usr/bin/env node
/**
 * Fix Telegram workflows: replace $vars / $env TELEGRAM_CHAT_ID with hardcoded value,
 * create Telegram credential, attach to nodes, send test message.
 * Run: node scripts/fix-n8n-telegram.mjs (from apps/command-center)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
const COMMAND_CENTER_PUBLIC_URL = env.COMMAND_CENTER_PUBLIC_URL || process.env.COMMAND_CENTER_PUBLIC_URL;

if (!API_KEY) {
  console.error('Missing N8N_API_KEY in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-N8N-API-KEY': API_KEY,
};

const apiBase = `${N8N_BASE}/api/v1`;

const WORKFLOW_NAMES = ['daily-briefing', 'weekly-review', 'telegram-commands'];

async function getWorkflowsByName() {
  const res = await fetch(`${apiBase}/workflows`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  const list = data.data || [];
  return WORKFLOW_NAMES.map((name) => {
    const w = list.find((x) => x.name === name);
    return w ? { id: w.id, name } : null;
  }).filter(Boolean);
}

function replaceChatIdInObject(obj) {
  if (typeof obj !== 'object' || obj === null) return;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === 'string' && (v.includes('TELEGRAM_CHAT_ID') || v.includes('$env.TELEGRAM') || v.includes('$vars.TELEGRAM'))) {
      obj[key] = TELEGRAM_CHAT_ID;
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      replaceChatIdInObject(v);
    }
  }
}

function replaceChatIdInNode(node) {
  if (node.parameters) replaceChatIdInObject(node.parameters);
}

async function getWorkflow(id) {
  const res = await fetch(`${apiBase}/workflows/${id}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

async function putWorkflow(id, body) {
  const res = await fetch(`${apiBase}/workflows/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return res;
}

async function ensureTelegramCredential() {
  const listRes = await fetch(`${apiBase}/credentials`, { headers });
  if (!listRes.ok) {
    if (listRes.status === 405 || listRes.status === 403) {
      console.warn('Credentials API not available on this n8n instance. Add Telegram credential manually in n8n UI.');
    }
    return null;
  }
  const list = await listRes.json();
  const existing = (list.data || []).find((c) => c.type === 'telegramApi' && (c.name === 'Telegram Bot' || c.name === 'Telegram'));
  if (existing) {
    console.log('Telegram credential already exists:', existing.id);
    return existing.id;
  }

  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set; skip credential creation. Set in .env.local and run again.');
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
    console.warn('Could not create Telegram credential via API. Add it manually in n8n (Settings → Credentials).');
    return null;
  }
  const data = await createRes.json();
  const credId = data.id ?? data.data?.id;
  console.log('Created Telegram credential:', credId);
  return credId;
}

function attachCredentialToWorkflowNodes(nodes, credentialId) {
  for (const node of nodes) {
    if (node.type === 'n8n-nodes-base.telegram' || node.type === 'n8n-nodes-base.telegramTrigger') {
      node.credentials = node.credentials || {};
      node.credentials.telegramApi = { id: credentialId, name: 'Telegram Bot' };
    }
  }
}

async function main() {
  let credentialId = await ensureTelegramCredential();

  const workflowList = await getWorkflowsByName();
  if (workflowList.length === 0) {
    console.warn('No workflows found with names:', WORKFLOW_NAMES.join(', '), '- Create them first (e.g. create-n8n-workflows.mjs + update-n8n-telegram.mjs)');
  }

  for (const { id, name } of workflowList) {
    const w = await getWorkflow(id);
    if (!w) {
      console.warn('Workflow not found:', name, id);
      continue;
    }

    const nodes = w.nodes || [];
    let changed = false;
    for (const node of nodes) {
      const before = JSON.stringify(node.parameters);
      replaceChatIdInNode(node);
      // Special-case fixes for telegram-commands workflow
      if (name === 'telegram-commands') {
        // Fix /taken HTTP node: use Notion API instead of localhost
        // Briefing: aanroepen van command-center API (bereikbaar voor n8n) i.p.v. n8n webhook
        if (
          node.type === 'n8n-nodes-base.httpRequest' &&
          node.name === 'Call Daily Briefing' &&
          COMMAND_CENTER_PUBLIC_URL
        ) {
          node.parameters = {
            method: 'POST',
            url: `${String(COMMAND_CENTER_PUBLIC_URL).replace(/\/$/, '')}/api/ai/briefing`,
            sendBody: true,
            specifyBody: 'json',
            jsonBody: '{}',
          };
        }
        if (
          node.type === 'n8n-nodes-base.httpRequest' &&
          node.name === 'Get Notion Tasks'
        ) {
          // Replace parameters with direct Notion query
          node.parameters = {
            method: 'POST',
            url: 'https://api.notion.com/v1/databases/30dbe6ed-c1a9-815b-8109-c155c4345b4a/query',
            sendHeaders: true,
            headerParameters: {
              parameters: [
                {
                  name: 'Authorization',
                  value: 'Bearer ' + (env.NOTION_API_KEY || process.env.NOTION_API_KEY || ''),
                },
                {
                  name: 'Notion-Version',
                  value: '2022-06-28',
                },
                {
                  name: 'Content-Type',
                  value: 'application/json',
                },
              ],
            },
            sendBody: true,
            specifyBody: 'json',
            jsonBody:
              '{"filter":{"property":"Status","status":{"does_not_equal":"Done"}},"sorts":[{"property":"Priority ","direction":"ascending"}],"page_size":20}',
          };
        }
        // Update Format & Send node to handle Notion tasks for /taken
        if (
          node.type === 'n8n-nodes-base.code' &&
          node.name === 'Format & Send'
        ) {
          node.parameters = node.parameters || {};
          node.parameters.mode = 'runOnceForAllItems';
          node.parameters.jsCode =
            "const item = $input.first().json;\n" +
            "const trigger = $('Telegram Trigger').first().json;\n" +
            "const chatId = (trigger && trigger.message && trigger.message.chat && trigger.message.chat.id) ? trigger.message.chat.id : '" +
            TELEGRAM_CHAT_ID +
            "';\n" +
            "\n" +
            "// /taken: Notion response with pages\n" +
            "if (Array.isArray(item.results)) {\n" +
            "  const pages = item.results;\n" +
            "  const lines = pages.map((page) => {\n" +
            "    const props = page.properties || {};\n" +
            "    const name = props['Name']?.title?.[0]?.plain_text ?? '(geen naam)';\n" +
            "    const status = props['Status']?.status?.name ?? '?';\n" +
            "    const priority = props['Priority ']?.select?.name ?? '';\n" +
            "    const emoji = status === 'In progress'\n" +
            "      ? '🔵'\n" +
            "      : priority?.includes('Critical') ? '🔴'\n" +
            "      : priority?.includes('High') ? '🟠'\n" +
            "      : priority?.includes('Medium') ? '🟡'\n" +
            "      : '⚪';\n" +
            "    return `${emoji} ${name}`;\n" +
            "  });\n" +
            "  const text = lines.length > 0\n" +
            "    ? `📋 *Open taken (${lines.length}):*\\n\\n${lines.slice(0, 15).join('\\n')}`\n" +
            "    : '✅ Geen open taken!';\n" +
            "  return [{ json: { chatId, text } }];\n" +
            "}\n" +
            "\n" +
            "// Fallbacks voor andere commando's (briefing / breakdown / review)\n" +
            "let text = '';\n" +
            "if (item.briefing) text = '🌅 *Briefing*\\n\\n' + item.briefing;\n" +
            "else if (item.error && !item.briefing) text = '⚠️ ' + (item.error || 'Fout') + '\\n\\nTip: zet COMMAND_CENTER_PUBLIC_URL in .env.local (bijv. ngrok URL) en run: node scripts/fix-n8n-telegram.mjs';\n" +
            "else if (item.tasks) text = '📋 *Subtaken*\\n\\n' + (item.tasks || []).map(t => '• ' + (t.task || t)).join('\\n');\n" +
            "else if (item.review) text = '📊 *Week Review*\\n\\n' + item.review;\n" +
            "else if (Array.isArray(item.tasks)) text = '✅ *Open taken*\\n\\n' + item.tasks.filter(t => !t.done).slice(0, 15).map(t => '• ' + t.task).join('\\n');\n" +
            "else text = (item.message || item.error) ? String(item.message || item.error) : JSON.stringify(item).slice(0, 800);\n" +
            "return [{ json: { chatId, text } }];\n";
        }
      }
      if (credentialId && (node.type === 'n8n-nodes-base.telegram' || node.type === 'n8n-nodes-base.telegramTrigger')) {
        node.credentials = node.credentials || {};
        node.credentials.telegramApi = { id: credentialId, name: 'Telegram Bot' };
        changed = true;
      }
      if (JSON.stringify(node.parameters) !== before) changed = true;
    }

    const putRes = await putWorkflow(id, {
      name: w.name,
      nodes,
      connections: w.connections || {},
      settings: w.settings || { executionOrder: 'v1' },
    });

    if (!putRes.ok) {
      console.error('Failed to PUT', name, putRes.status, await putRes.text());
      continue;
    }
    console.log('Updated workflow:', name);
  }

  if (TELEGRAM_BOT_TOKEN) {
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
  } else {
    console.log('Skip test bericht (TELEGRAM_BOT_TOKEN niet gezet)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
