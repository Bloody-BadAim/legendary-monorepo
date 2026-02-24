/**
 * One-off: import tasks from the user's todo list into Notion Tasks DB.
 * Run: node scripts/import-tasks-from-prompt.mjs
 * Requires NOTION_API_KEY and NOTION_TASKS_DB, NOTION_PROJECTS_DB in .env.local (load with dotenv or export).
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load .env.local
try {
  const envPath = resolve(root, '.env.local');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch (e) {
  console.warn('No .env.local:', e.message);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const TASKS_DB = process.env.NOTION_TASKS_DB;
const PROJECTS_DB = process.env.NOTION_PROJECTS_DB;

if (!TASKS_DB || !PROJECTS_DB) {
  console.error('Set NOTION_TASKS_DB and NOTION_PROJECTS_DB in .env.local');
  process.exit(1);
}

// Project name (as in list) -> Notion project page ID (we created these via MCP)
const PROJECT_IDS = {
  'Smart Cities (Schoolproject)': '311be6ed-c1a9-8192-9013-c5061afff7c1',
  'Wiskunde': '311be6ed-c1a9-81c6-9571-f15c9a2986d5',
  'SIT Zichtbaarheid & AI': '311be6ed-c1a9-81fd-aeec-f7f53b409b84',
  'Website & Content': '311be6ed-c1a9-8130-9bbc-dbb7a5d49520',
  'Partnerships': '311be6ed-c1a9-8181-a86c-f20a92fddda9',
  'Betalingen Bijhouden': '311be6ed-c1a9-8115-ab7d-f48f2f7b4bc0',
  'AI Intake Agent': '311be6ed-c1a9-81a0-a968-efa03b575334',
  'SaaS Template (Gumroad)': '311be6ed-c1a9-8198-87cb-c6ba1b3d1772',
  'Command Center Dashboard': '311be6ed-c1a9-8161-bce4-f68007cd4f1a',
  'Portfolio Website': '311be6ed-c1a9-81ac-b200-c2dc7c0b8edc',
  'AI Workflows & Agents': '311be6ed-c1a9-810f-9b27-c81b34577ed8',
  'School Pilot (Vereniging Onboarding)': '311be6ed-c1a9-81bc-807e-e91f6723f0b9',
  'Honda Reparatie': '311be6ed-c1a9-81e7-be70-f0bfae286af9',
  'Admin & Acuut': '311be6ed-c1a9-8169-8943-dbd3510749f8',
  'AI & ML Courses': '311be6ed-c1a9-8163-adcc-d6c9b6101430',
  'Passive Income Research': '311be6ed-c1a9-81f0-833a-f7580bb03a4a',
  'Boeken': '311be6ed-c1a9-8106-91c7-db3550a75410',
};

// Flat list: [ projectName, taskName, priority, status, dueDate? ]
const TASKS = [
  ['Smart Cities (Schoolproject)', 'System architecture', 'High Priority', 'Not started', null],
  ['Smart Cities (Schoolproject)', 'Dev git readme - communication, git pull, locatie, werkmomenten', 'Medium Priority', 'Not started', null],
  ['Smart Cities (Schoolproject)', 'Backend config', 'High Priority', 'Not started', null],
  ['Smart Cities (Schoolproject)', 'Prepare juf Aimee', 'Medium Priority', 'Not started', null],
  ['Smart Cities (Schoolproject)', 'Epic with small functions (4)', 'Medium Priority', 'Not started', null],
  ['Smart Cities (Schoolproject)', 'New project en backlog user stories', 'High Priority', 'Not started', null],
  ['Smart Cities (Schoolproject)', 'Contact client', 'High Priority', 'Not started', null],
  ['Wiskunde', 'Wiskunde leren', 'High Priority', 'Not started', '2025-10-27'],
  ['Wiskunde', 'Log boek wiskunde voorbereiden', 'High Priority', 'Not started', '2025-10-27'],
  ['SIT Zichtbaarheid & AI', 'Opleiding zichtbaarheid', 'Medium Priority', 'Not started', null],
  ['SIT Zichtbaarheid & AI', 'SharePoint opzetten', 'Low Priority', 'Not started', null],
  ['SIT Zichtbaarheid & AI', 'Roy mening AI gebruikers form', 'Medium Priority', 'Not started', null],
  ['SIT Zichtbaarheid & AI', 'Sponsor hackathon', 'High Priority', 'Not started', null],
  ['SIT Zichtbaarheid & AI', 'AI commissie opzetten', 'High Priority', 'Not started', null],
  ['Website & Content', 'Bache ha baparvande bi parvande research', 'Medium Priority', 'Not started', null],
  ['Website & Content', 'Bache 19 sale', 'High Priority', 'Not started', null],
  ['Website & Content', 'Website all the info', 'High Priority', 'Not started', null],
  ['Website & Content', 'Partnership Duitsland', 'Medium Priority', 'Not started', null],
  ['Website & Content', 'Lo appen', 'Low Priority', 'Not started', null],
  ['Betalingen Bijhouden', '64 gemeente', 'High Priority', 'Not started', null],
  ['Betalingen Bijhouden', 'Nour 6 x 200', 'Medium Priority', 'Not started', null],
  ['Betalingen Bijhouden', 'Parking 40', 'Low Priority', 'Not started', null],
  ['Betalingen Bijhouden', 'Samane 300', 'Medium Priority', 'Not started', null],
  ['AI Intake Agent', 'Cloudflare Tunnel setup', 'High Priority', 'In progress', null],
  ['AI Intake Agent', 'Deploy naar intake.matmat.me', 'High Priority', 'Not started', null],
  ['AI Intake Agent', 'End-to-end productie test', 'High Priority', 'Not started', null],
  ['AI Intake Agent', 'Demo video opnemen (2 min)', 'Medium Priority', 'Not started', null],
  ['AI Intake Agent', 'Pilot offer naar ICT vereniging', 'Medium Priority', 'Not started', null],
  ['AI Intake Agent', 'LinkedIn post + 5-10 MKB outreach', 'High Priority', 'Not started', null],
  ['SaaS Template (Gumroad)', 'Auth (NextAuth.js)', 'High Priority', 'Not started', null],
  ['SaaS Template (Gumroad)', 'Payments (Stripe)', 'High Priority', 'Not started', null],
  ['SaaS Template (Gumroad)', 'Database (Prisma)', 'High Priority', 'Not started', null],
  ['SaaS Template (Gumroad)', 'UI (shadcn)', 'Medium Priority', 'Not started', null],
  ['SaaS Template (Gumroad)', 'Admin panel', 'Medium Priority', 'Not started', null],
  ['SaaS Template (Gumroad)', 'Docs & setup guide', 'Medium Priority', 'Not started', null],
  ['SaaS Template (Gumroad)', 'Gumroad listing', 'High Priority', 'Not started', null],
  ['Portfolio Website', 'Minder font, meer laten ademen', 'Medium Priority', 'Not started', null],
  ['Portfolio Website', 'Minder chaotisch maken', 'High Priority', 'Not started', null],
  ['Portfolio Website', 'Max 2 fonten', 'Medium Priority', 'Not started', null],
  ['Portfolio Website', 'AI4HVA meer laten zien', 'Medium Priority', 'Not started', null],
  ['Portfolio Website', 'Klikbaar stage website', 'Low Priority', 'Not started', null],
  ['Portfolio Website', 'Taal toevoegen', 'Low Priority', 'Not started', null],
  ['Portfolio Website', 'Skills figuur', 'Medium Priority', 'Not started', null],
  ['Portfolio Website', '3 projects scroll links-rechts', 'Medium Priority', 'Not started', null],
  ['Portfolio Website', 'Persoonlijk maken', 'High Priority', 'Not started', null],
  ['AI Workflows & Agents', 'Kapper maman mail', 'Medium Priority', 'Not started', null],
  ['AI Workflows & Agents', 'Factuur systeem', 'High Priority', 'Not started', null],
  ['AI Workflows & Agents', 'YouTube kinderprogramma', 'Low Priority', 'Not started', null],
  ['AI Workflows & Agents', 'Belasting en BTW aangifte', 'High Priority', 'Not started', null],
  ['Command Center Dashboard', 'Notion API koppeling', 'High Priority', 'In progress', null],
  ['Command Center Dashboard', 'Todo pagina toevoegen', 'High Priority', 'Not started', null],
  ['Command Center Dashboard', 'Real-time sync met Notion', 'Medium Priority', 'Not started', null],
  ['Command Center Dashboard', 'Deploy dashboard', 'Medium Priority', 'Not started', null],
  ['Admin & Acuut', 'KLM inleveren ZSM', 'High Priority', 'Not started', null],
  ['Admin & Acuut', 'DUO uitwonend fixen', 'High Priority', 'Not started', null],
  ['Admin & Acuut', 'Bloed onderzoek', 'Medium Priority', 'Not started', null],
  ['Admin & Acuut', 'La corix', 'Low Priority', 'Not started', null],
  ['Honda Reparatie', 'Voor lamp', 'Medium Priority', 'Not started', null],
  ['Honda Reparatie', 'Achter rem blok', 'High Priority', 'Not started', null],
  ['Honda Reparatie', 'Accu', 'Medium Priority', 'Not started', null],
  ['Honda Reparatie', 'Verf spuit', 'Low Priority', 'Not started', null],
  ['Honda Reparatie', 'Speakers', 'Low Priority', 'Not started', null],
  ['AI & ML Courses', 'MIT AI Course (ML, AI, Computer Vision, NLP)', 'Medium Priority', 'Not started', null],
  ['AI & ML Courses', 'AI agentic onderzoek', 'Medium Priority', 'Not started', null],
  ['AI & ML Courses', 'LLM onderzoek', 'Medium Priority', 'Not started', null],
  ['AI & ML Courses', 'Microsoft AI course', 'Low Priority', 'Not started', null],
  ['AI & ML Courses', 'N8n automatisation leren', 'Medium Priority', 'Not started', null],
  ['Passive Income Research', 'High yield online savings', 'Medium Priority', 'Not started', null],
  ['Passive Income Research', 'Amazon KDP', 'Low Priority', 'Not started', null],
  ['Passive Income Research', 'Digital products', 'Medium Priority', 'Not started', null],
  ['Passive Income Research', 'Online cursussen', 'Medium Priority', 'Not started', null],
  ['Passive Income Research', 'YouTube channel', 'Low Priority', 'Not started', null],
  ['Boeken', '48 Laws of Power', 'Low Priority', 'Not started', null],
  ['Boeken', 'Art of Love - Eric Fromm', 'Low Priority', 'Not started', null],
  ['Boeken', 'The Body Keeps the Score', 'Low Priority', 'Not started', null],
];

function buildTaskProps([_projectName, taskName, priority, status, dueDate], projectId) {
  const props = {
    Name: { title: [{ text: { content: taskName } }] },
    Status: { status: { name: status } },
    'Priority ': { select: { name: priority } },
  };
  if (projectId) {
    props['Project '] = { relation: [{ id: projectId }] };
  }
  if (dueDate) {
    props['Due Date '] = { date: { start: dueDate } };
  }
  return props;
}

async function main() {
  console.log('Fetching existing projects to match names...');
  const { results } = await notion.databases.query({ database_id: PROJECTS_DB });
  const nameToId = {};
  for (const p of results) {
    if (p.properties?.Name?.title?.[0]?.plain_text) {
      nameToId[p.properties.Name.title[0].plain_text] = p.id;
    }
  }
  console.log('Projects in Notion:', Object.keys(nameToId).length);

  let created = 0;
  let skipped = 0;
  const BATCH = 50;
  for (let i = 0; i < TASKS.length; i += BATCH) {
    const batch = TASKS.slice(i, i + BATCH);
    for (const row of batch) {
      const [projectName, taskName] = row;
      const projectId = nameToId[projectName] || PROJECT_IDS[projectName];
      const props = buildTaskProps(row, projectId);
      try {
        await notion.pages.create({
          parent: { database_id: TASKS_DB },
          properties: props,
        });
        created++;
        if (created % 20 === 0) console.log('Created', created);
      } catch (e) {
        if (e.code === 'validation_error' && e.message?.includes('duplicate')) {
          skipped++;
        } else {
          console.error('Fail:', taskName, e.message);
        }
      }
    }
    if (i + BATCH < TASKS.length) await new Promise((r) => setTimeout(r, 400));
  }
  console.log('Done. Created:', created, 'Skipped:', skipped);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
