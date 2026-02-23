'use client';

import useSWR from 'swr';
import type { NotionProjectItem } from '@/types/notion';

interface NotionProjectsResponse {
  projects: NotionProjectItem[];
  source: 'notion' | 'none' | 'error';
  error?: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<NotionProjectsResponse>);

export function useNotionProjects() {
  const { data, error, isLoading, mutate } = useSWR<NotionProjectsResponse>(
    '/api/notion/projects',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );

  const projects = data?.projects ?? [];
  const source = data?.source ?? 'none';
  const fromNotion = source === 'notion';

  return {
    projects,
    fromNotion,
    isLoading,
    error: error ?? data?.error,
    mutate,
  };
}
