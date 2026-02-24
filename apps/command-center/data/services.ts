export interface Service {
  name: string;
  price: string;
  timeline: string;
  target: string;
  description: string;
}

export const SERVICES: Service[] = [
  {
    name: 'Automation Audit',
    price: '€300',
    timeline: '3 dagen',
    target: 'MKB zonder automation',
    description:
      'Analyse van bedrijfsprocessen + rapport met automation kansen',
  },
  {
    name: 'n8n Implementation',
    price: '€750',
    timeline: '1 week',
    target: 'Bedrijven met repetitive tasks',
    description: 'Workflows bouwen en deployen in n8n',
  },
  {
    name: 'AI Integration',
    price: '€1500',
    timeline: '2 weken',
    target: 'Bedrijven die AI willen',
    description: 'AI chatbot, intake systeem, of automatisering met LLMs',
  },
  {
    name: 'Managed Automation',
    price: '€200/maand',
    timeline: 'Doorlopend',
    target: 'Passief inkomen',
    description: 'Onderhoud, monitoring, en updates van automation workflows',
  },
];

export type ProductStatus = 'live' | 'todo' | 'planned';

export interface Product {
  name: string;
  price: string;
  platform: string;
  status: ProductStatus;
}

export const PRODUCTS: Product[] = [
  {
    name: 'n8n Workflow Pack (10x)',
    price: '€29',
    platform: 'Gumroad',
    status: 'todo',
  },
  {
    name: 'SaaS Starter Template',
    price: '€49',
    platform: 'Gumroad',
    status: 'todo',
  },
  {
    name: 'AI Agent Boilerplate',
    price: '€79',
    platform: 'Gumroad',
    status: 'planned',
  },
  {
    name: 'Full Monorepo Access',
    price: '€149',
    platform: 'GitHub Sponsors',
    status: 'planned',
  },
];
