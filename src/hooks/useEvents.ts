'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { EventDTO, PostAuthor } from '@/types';

export const EVENTS_KEY = ['events'];

export function useEvents(limit = 20) {
  return useQuery({
    queryKey: [...EVENTS_KEY, limit],
    queryFn: () => apiFetch<{ items: EventDTO[] }>(`/api/events?limit=${limit}`),
  });
}

export function useEventAttendees(eventId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: () => apiFetch<{ items: PostAuthor[] }>(`/api/events/${eventId}/attendees`),
    enabled,
  });
}

export function useAttendEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, going }: { eventId: string; going: boolean }) =>
      apiFetch<{ isGoing: boolean; attendeeCount: number }>(`/api/events/${eventId}/attend`, {
        method: going ? 'DELETE' : 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['event-attendees'] });
    },
  });
}
