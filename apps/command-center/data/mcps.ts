export interface McpItem {
  name: string;
  description: string;
  use: string;
  icon: string;
  color: string;
}

export const MCPS: McpItem[] = [
  {
    name: 'Notion',
    icon: '📋',
    color: '#f97316',
    description: 'Notion Workspace MCP – Search, databases, pages en tasks',
    use: 'Second Brain koppeling. Taken, projecten en resources syncen met het Command Center.',
  },
  {
    name: 'GitHub',
    icon: '🐙',
    color: '#8b5cf6',
    description: 'GitHub MCP – Repos, issues, PRs en acties',
    use: 'Monorepo beheer, CI/CD triggers, code search, PR reviews vanuit Cursor.',
  },
  {
    name: 'Cloudflare',
    icon: '☁️',
    color: '#06b6d4',
    description: 'Cloudflare Docs, Builds & Observability',
    use: 'DNS beheer, Workers deploys, KV/D1/R2 bindings, logs en observability.',
  },
  {
    name: 'Figma',
    icon: '🎨',
    color: '#ec4899',
    description: 'Figma MCP – Designs, screenshots, code connect',
    use: 'Design-to-code: designs ophalen, component mapping, variabelen exporteren.',
  },
  {
    name: 'Prisma',
    icon: '🗄️',
    color: '#10b981',
    description: 'Prisma Local + Remote – Schema, migrations, databases',
    use: 'Database schema beheer, migrations draaien, Prisma Studio, query uitvoeren.',
  },
  {
    name: 'n8n',
    icon: '⚡',
    color: '#eab308',
    description: 'n8n MCP – Workflow automation',
    use: 'Workflows zoeken, uitvoeren en debuggen. AI Intake Agent en automation flows.',
  },
];
