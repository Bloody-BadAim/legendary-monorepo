export type McpStatus = 'connected' | 'error' | 'disabled';

export interface McpServer {
  name: string;
  status: McpStatus;
  description: string;
  use: string;
}

export const MCPS: McpServer[] = [
  {
    name: 'GitHub',
    status: 'connected',
    description: 'Repo management, PRs, issues vanuit Cursor',
    use: 'Code pushen, issues aanmaken, PRs reviewen',
  },
  {
    name: 'Filesystem',
    status: 'connected',
    description: 'Toegang tot /home/matin/projects',
    use: 'Bestanden lezen/schrijven vanuit AI chat',
  },
  {
    name: 'Memory',
    status: 'connected',
    description: 'Persistent context tussen Cursor sessions',
    use: 'AI onthoudt eerdere gesprekken en beslissingen',
  },
  {
    name: 'PostgreSQL',
    status: 'connected',
    description: 'Direct database queries in Cursor',
    use: 'DB schema bekijken, queries runnen, data checken',
  },
  {
    name: 'n8n',
    status: 'connected',
    description: 'Workflow management via n8n.matmat.me',
    use: 'Workflows aanmaken, triggeren, debuggen',
  },
  {
    name: 'Docker',
    status: 'connected',
    description: 'Container management via Docker socket',
    use: 'Containers starten/stoppen, logs bekijken',
  },
  {
    name: 'DevCycle',
    status: 'connected',
    description: 'Feature flag management',
    use: 'Flags aan/uit zetten, A/B tests beheren',
  },
];
