export interface RevenueEntry {
  id: string;
  client: string;
  service: string;
  amount: number;
  date: string; // ISO date
  status: 'paid' | 'invoiced' | 'pending';
}

export const REVENUE_TARGET = 1000;
export const REVENUE_PERIOD = '30 dagen';

// Vul later met echte data, start met lege array
export const REVENUE_ENTRIES: RevenueEntry[] = [
  // { id: '1', client: 'Voorbeeld BV', service: 'Automation Audit', amount: 300, date: '2026-02-20', status: 'paid' },
];
