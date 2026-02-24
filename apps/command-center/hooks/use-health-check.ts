'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

export type HealthStatus = 'online' | 'offline' | 'checking';

interface HealthApiResponse {
  results: { id: string; status: 'online' | 'offline'; latency: number }[];
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<HealthApiResponse>);

export function useHealthCheck(): Map<
  string,
  { status: HealthStatus; latency: number }
> {
  const { data, error, isValidating } = useSWR<HealthApiResponse>(
    '/api/health',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 30_000 }
  );

  return useMemo(() => {
    const map = new Map<string, { status: HealthStatus; latency: number }>();
    if (error) return map;
    if (!data?.results) return map;
    for (const r of data.results) {
      map.set(r.id, {
        status: isValidating ? 'checking' : r.status,
        latency: r.latency,
      });
    }
    return map;
  }, [data, error, isValidating]);
}
