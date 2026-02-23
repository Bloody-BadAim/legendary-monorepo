'use client';

import useSWR from 'swr';
import type { NotionTaskItem } from '@/types/notion';

interface NotionTasksResponse {
  tasks: NotionTaskItem[];
  source: 'notion' | 'none' | 'error';
  error?: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<NotionTasksResponse>);

export function useNotionTasks() {
  const { data, error, isLoading, mutate } = useSWR<NotionTasksResponse>(
    '/api/notion/tasks',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );

  const tasks = data?.tasks ?? [];
  const source = data?.source ?? 'none';
  const fromNotion = source === 'notion';

  return {
    tasks,
    fromNotion,
    isLoading,
    error: error ?? data?.error,
    mutate,
  };
}
