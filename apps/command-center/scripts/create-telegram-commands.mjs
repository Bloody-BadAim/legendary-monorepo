#!/usr/bin/env node
/**
 * Creates telegram-commands workflow in n8n with Telegram credentials already attached.
 * Run: node scripts/create-telegram-commands.mjs
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
const API_KEY = env.N8N_API_KEY || process.env.N8N_API_KEY;
const N8N_BASE = (env.N8N_WEBHOOK_BASE_URL || 'https://n8n.matmat.me').replace(/\/$/, '');
const CC_URL = (env.COMMAND_CENTER_PUBLIC_URL || 'https://command-center.matmat.me').replace(/\/$/, '');
const CRED_ID = 'OEh6OZFx8e8bUGKH';
const CHAT_ID = '469664360';

if (!API_KEY) {
  console.error('Missing N8N_API_KEY in .env.local');
  process.exit(1);
}

const apiBase = N8N_BASE + '/api/v1';
const headers = { 'Content-Type': 'application/json', 'X-N8N-API-KEY': API_KEY };

async function deleteExisting() {
  const res = await fetch(apiBase + '/workflows', { headers });
  if (!res.ok) return;
  const raw = await res.text();
  const data = JSON.parse(raw);
  const list = data.data || [];
  const existing = list.find(w => w.name === 'telegram-commands');
  if (existing) {
    console.log('Deleting old telegram-commands:', existing.id);
    await fetch(apiBase + '/workflows/' + existing.id, { method: 'DELETE', headers });
    console.log('Deleted');
  }
}

async function create() {
  const ids = Array.from({ length: 8 }, () => randomUUID());
  const cred = { telegramApi: { id: CRED_ID, name: 'Telegram Bot' } };

  const jsCode = "const item = $input.first().json;\n" +
    "const chatId = $('Telegram Trigger').first().json.message.chat.id;\n" +
    "let text = '';\n" +
    "if (item.briefing) text = 'Briefing:\n\n' + item.briefing;\n" +
    "else if (item.tasks && Array.isArray(item.tasks)) text = 'Subtaken:\n\n' + item.tasks.map(t => '- ' + (t.task || t)).join('\n');\n" +
    "else if (item.review) text = 'Week Review:\n\n' + item.review;\n" +
    "else text = JSON.stringify(item).slice(0, 800);\n" +
    "return [{ json: { chatId, text } }];";

  const workflow = {
    name: 'telegram-commands',
    nodes: [
      {
        id: ids[0], name: 'Telegram Trigger', type: 'n8n-nodes-base.telegramTrigger',
        typeVersion: 1, position: [240, 300],
        parameters: { updates: ['message'] },
        credentials: cred
      },
      {
        id: ids[1], name: 'Switch Command', type: 'n8n-nodes-base.switch',
        typeVersion: 3.2, position: [460, 300],
        parameters: {
          mode: 'rules',
          // Switch V3 API expects rules.values (not rules.rules); otherwise all branches stay empty
          rules: {
            values: [
              {
                conditions: {
                  options: { caseSensitive: true, leftValue: '' },
                  conditions: [
                    { leftValue: '={{ $json.message.text }}', rightValue: '/briefing', operator: { type: 'string', operation: 'startsWith' } }
                  ],
                  combinator: 'and'
                },
                renameOutput: true,
                outputKey: 'briefing'
              },
              {
                conditions: {
                  options: { caseSensitive: true, leftValue: '' },
                  conditions: [
                    { leftValue: '={{ $json.message.text }}', rightValue: '/breakdown', operator: { type: 'string', operation: 'startsWith' } }
                  ],
                  combinator: 'and'
                },
                renameOutput: true,
                outputKey: 'breakdown'
              },
              {
                conditions: {
                  options: { caseSensitive: true, leftValue: '' },
                  conditions: [
                    { leftValue: '={{ $json.message.text }}', rightValue: '/review', operator: { type: 'string', operation: 'startsWith' } }
                  ],
                  combinator: 'and'
                },
                renameOutput: true,
                outputKey: 'review'
              },
              {
                conditions: {
                  options: { caseSensitive: true, leftValue: '' },
                  conditions: [
                    { leftValue: '={{ $json.message.text }}', rightValue: '/taken', operator: { type: 'string', operation: 'startsWith' } }
                  ],
                  combinator: 'and'
                },
                renameOutput: true,
                outputKey: 'taken'
              }
            ]
          },
          options: { fallbackOutput: 'extra' }
        }
      },
      {
        id: ids[2], name: 'Call Briefing', type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2, position: [680, 180],
        parameters: { method: 'POST', url: CC_URL + '/api/ai/briefing', sendBody: true, specifyBody: 'json', jsonBody: '{}' }
      },
      {
        id: ids[3], name: 'Call Breakdown', type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2, position: [680, 300],
        parameters: { method: 'POST', url: CC_URL + '/api/ai/breakdown', sendBody: true, specifyBody: 'json', jsonBody: '{}' }
      },
      {
        id: ids[4], name: 'Call Review', type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2, position: [680, 420],
        parameters: { method: 'POST', url: CC_URL + '/api/ai/weekly-review', sendBody: true, specifyBody: 'json', jsonBody: '{}' }
      },
      {
        id: ids[5], name: 'Get Tasks', type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2, position: [680, 540],
        parameters: { method: 'GET', url: CC_URL + '/api/notion/tasks' }
      },
      {
        id: ids[6], name: 'Format Reply', type: 'n8n-nodes-base.code',
        typeVersion: 2, position: [900, 300],
        parameters: { mode: 'runOnceForAllItems', jsCode: jsCode }
      },
      {
        id: ids[7], name: 'Send Telegram', type: 'n8n-nodes-base.telegram',
        typeVersion: 1.2, position: [1120, 300],
        parameters: { operation: 'sendMessage', chatId: '={{ $json.chatId }}', text: '={{ $json.text }}', additionalFields: {} },
        credentials: cred
      },
    ],
    connections: {
      'Telegram Trigger': { main: [[{ node: 'Switch Command', type: 'main', index: 0 }]] },
      'Switch Command': { main: [
        [{ node: 'Call Briefing', type: 'main', index: 0 }],
        [{ node: 'Call Breakdown', type: 'main', index: 0 }],
        [{ node: 'Call Review', type: 'main', index: 0 }],
        [{ node: 'Get Tasks', type: 'main', index: 0 }],
      ]},
      'Call Briefing': { main: [[{ node: 'Format Reply', type: 'main', index: 0 }]] },
      'Call Breakdown': { main: [[{ node: 'Format Reply', type: 'main', index: 0 }]] },
      'Call Review': { main: [[{ node: 'Format Reply', type: 'main', index: 0 }]] },
      'Get Tasks': { main: [[{ node: 'Format Reply', type: 'main', index: 0 }]] },
      'Format Reply': { main: [[{ node: 'Send Telegram', type: 'main', index: 0 }]] },
    },
    settings: { executionOrder: 'v1' },
  };

  const res = await fetch(apiBase + '/workflows', {
    method: 'POST', headers, body: JSON.stringify(workflow)
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('FAILED:', res.status, JSON.stringify(data, null, 2));
    process.exit(1);
  }
  const id = data.id || (data.data && data.data.id);
  console.log('Created telegram-commands:', id);

  const act = await fetch(apiBase + '/workflows/' + id + '/activate', { method: 'POST', headers });
  if (act.ok) {
    console.log('Activated: YES');
  } else {
    console.log('Activate failed (', act.status, ') - activate manually in n8n UI');
  }
}

async function main() {
  await deleteExisting();
  await create();
  console.log('Done! Open n8n.matmat.me and check telegram-commands');
}

main().catch(e => { console.error(e); process.exit(1); });
