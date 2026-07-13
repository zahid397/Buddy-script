'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { SearchResultsDTO } from '@/types';

export function useSearch(query: string, type: 'all' | 'users' | 'posts' | 'events' = 'all') {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['search', trimmed, type],
    queryFn: () => apiFetch<SearchResultsDTO>(`/api/search?q=${encodeURIComponent(trimmed)}&type=${type}`),
    enabled: trimmed.length > 0,
  });
}
