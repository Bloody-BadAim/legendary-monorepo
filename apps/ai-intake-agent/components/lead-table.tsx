'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  questionType: string;
  description: string;
  category: string | null;
  urgency: number | null;
  aiSummary: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nieuw' },
  { value: 'contacted', label: 'Gecontacteerd' },
  { value: 'closed', label: 'Afgesloten' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Alle categorieën' },
  { value: 'automation', label: 'Automatisering' },
  { value: 'ai-integration', label: 'AI Integratie' },
  { value: 'consulting', label: 'Advies' },
  { value: 'other', label: 'Anders' },
];

export function LeadTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    try {
      const res = await fetch(`/api/leads?${params}`);
      if (res.status === 401) {
        setLeads([]);
        setLoading(false);
        window.location.reload();
        return;
      }
      if (!res.ok) {
        setLeads([]);
        setLoading(false);
        return;
      }
      const text = await res.text();
      let data: unknown = [];
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = [];
        }
      }
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (res.ok) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-sm">
          Status:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Alle</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Categorie:
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Naam</th>
              <th className="text-left p-3 font-medium">Bedrijf</th>
              <th className="text-left p-3 font-medium">Categorie</th>
              <th className="text-left p-3 font-medium">Urgentie</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Datum</th>
              <th className="text-left p-3 font-medium">Acties</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-muted-foreground"
                >
                  Geen leads gevonden.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="p-3">
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {lead.email}
                    </div>
                  </td>
                  <td className="p-3">{lead.company}</td>
                  <td className="p-3">{lead.category ?? '–'}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'font-medium',
                        (lead.urgency ?? 0) >= 7 && 'text-destructive',
                        (lead.urgency ?? 0) >= 4 &&
                          (lead.urgency ?? 0) < 7 &&
                          'text-amber-600'
                      )}
                    >
                      {lead.urgency ?? '–'}
                    </span>
                  </td>
                  <td className="p-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      disabled={updatingId === lead.id}
                      className="rounded border border-input bg-background px-2 py-1 text-xs"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(lead.createdAt)}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDetailId(detailId === lead.id ? null : lead.id)
                      }
                    >
                      {detailId === lead.id ? 'Sluiten' : 'Details'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail row */}
      {detailId && (
        <div className="rounded-md border bg-muted/20 p-4 space-y-2">
          {(() => {
            const lead = leads.find((l) => l.id === detailId);
            if (!lead) return null;
            return (
              <>
                <p>
                  <span className="font-medium">Omschrijving:</span>{' '}
                  {lead.description}
                </p>
                {lead.aiSummary && (
                  <p>
                    <span className="font-medium">AI-samenvatting:</span>{' '}
                    {lead.aiSummary}
                  </p>
                )}
                <p className="text-muted-foreground text-sm">
                  Type vraag: {lead.questionType}
                </p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
