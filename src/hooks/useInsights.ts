'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { InsightsDTO } from '@/types';

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: () => apiFetch<InsightsDTO>('/api/insights'),
  });
}
