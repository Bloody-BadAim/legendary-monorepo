'use client';

import { useState } from 'react';
import type { RevenueEntry } from '@/data/revenue';

export interface RevenueEntryFormProps {
  onSubmitted?: () => void;
}

const STATUS_OPTIONS: { value: RevenueEntry['status']; label: string }[] = [
  { value: 'pending', label: 'Openstaand' },
  { value: 'invoiced', label: 'Gefactureerd' },
  { value: 'paid', label: 'Betaald' },
];

export function RevenueEntryForm({ onSubmitted }: RevenueEntryFormProps) {
  const [client, setClient] = useState('');
  const [service, setService] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<RevenueEntry['status']>('pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount.replace(',', '.'));
    if (!client.trim() || !service.trim() || Number.isNaN(num) || num < 0)
      return;

    const entry: RevenueEntry = {
      id: crypto.randomUUID?.() ?? `rev-${Date.now()}`,
      client: client.trim(),
      service: service.trim(),
      amount: Math.round(num * 100) / 100,
      date: new Date().toISOString().slice(0, 10),
      status,
    };

    const key = 'command-center-revenue-entries';
    const raw =
      typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    const list: RevenueEntry[] = raw ? JSON.parse(raw) : [];
    list.push(entry);
    localStorage.setItem(key, JSON.stringify(list));

    setClient('');
    setService('');
    setAmount('');
    setStatus('pending');
    onSubmitted?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4"
    >
      <input
        type="text"
        placeholder="Client"
        value={client}
        onChange={(e) => setClient(e.target.value)}
        className="rounded-lg border border-border bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
      />
      <input
        type="text"
        placeholder="Dienst"
        value={service}
        onChange={(e) => setService(e.target.value)}
        className="rounded-lg border border-border bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
      />
      <input
        type="text"
        inputMode="decimal"
        placeholder="Bedrag"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="rounded-lg border border-border bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent-blue focus:outline-none"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as RevenueEntry['status'])}
        className="rounded-lg border border-border bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-accent-blue focus:outline-none"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="col-span-2 rounded-lg bg-accent-blue px-3 py-2 text-sm font-medium text-white hover:opacity-90 sm:col-span-4"
      >
        Toevoegen
      </button>
    </form>
  );
}
