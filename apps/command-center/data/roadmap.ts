import type { RoadmapWeek } from '@/types/roadmap';

export const ROADMAP: RoadmapWeek[] = [
  {
    week: 1,
    title: 'Infrastructure',
    status: 'done',
    tasks: [
      { task: 'Proxy server setup (Caddy + Docker)', done: true },
      { task: 'Cloudflare DNS configuratie', done: true },
      { task: 'Local AI stack (Ollama + LiteLLM)', done: true },
      { task: 'PostgreSQL + n8n lokaal', done: true },
      { task: 'Email setup (matin@matin.email)', done: true },
      { task: 'Sentry monitoring', done: true },
    ],
  },
  {
    week: 2,
    title: 'Development Setup',
    status: 'current',
    tasks: [
      { task: 'Cursor + 6 MCPs configuratie', done: true },
      { task: 'Monorepo structure (Turbo + pnpm)', done: true },
      { task: 'Context files (.config/workbench/)', done: false },
      { task: 'GitHub Actions CI/CD', done: false },
      { task: 'Powerhouse server toegang', done: false },
      { task: 'Cloudflare Tunnels setup', done: false },
    ],
  },
  {
    week: 3,
    title: 'First Products',
    status: 'upcoming',
    tasks: [
      { task: 'AI Intake Agent afmaken', done: false },
      { task: 'Landing page deployen', done: false },
      { task: 'n8n workflow (form > AI > email > Notion)', done: false },
      { task: 'Admin dashboard bouwen', done: false },
      { task: 'Demo video (2 min)', done: false },
      { task: 'Pilot bij ICT vereniging', done: false },
    ],
  },
  {
    week: 4,
    title: 'Market & Sell',
    status: 'upcoming',
    tasks: [
      { task: 'LinkedIn posts (3x/week)', done: false },
      { task: 'Case study van pilot schrijven', done: false },
      { task: "20 potentiele klanten DM'en", done: false },
      { task: 'SaaS Template op Gumroad zetten', done: false },
      { task: 'Eerste betalende klant (€500-1000)', done: false },
      { task: 'Workflow Pack op Gumroad', done: false },
    ],
  },
];
