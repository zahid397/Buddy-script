'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ConversationDTO, MessageDTO, PaginatedResponse } from '@/types';

type ThreadData = InfiniteData<PaginatedResponse<MessageDTO>>;

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiFetch<{ items: ConversationDTO[] }>('/api/conversations'),
    refetchInterval: 8000,
  });
}

export function useUnreadMessageCount() {
  return useQuery({
    queryKey: ['messages-unread-count'],
    queryFn: () => apiFetch<{ count: number }>('/api/messages/unread-count'),
    refetchInterval: 5000,
  });
}

export function useMessageThread(otherUserId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', otherUserId],
    queryFn: ({ pageParam }: { pageParam?: string }) => {
      const url = pageParam
        ? `/api/messages/${otherUserId}?cursor=${encodeURIComponent(pageParam)}`
        : `/api/messages/${otherUserId}`;
      return apiFetch<PaginatedResponse<MessageDTO>>(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: 3000,
  });
}

export function useSendMessage(otherUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<{ message: MessageDTO }>(`/api/messages/${otherUserId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: (res) => {
      queryClient.setQueryData<ThreadData>(['messages', otherUserId], (old) => {
        if (!old) return old;
        const [first, ...rest] = old.pages;
        return { ...old, pages: [{ ...first, items: [res.message, ...first.items] }, ...rest] };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkThreadRead(otherUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/api/messages/${otherUserId}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages-unread-count'] });
    },
  });
}

export function useTypingIndicator(otherUserId: string) {
  return useQuery({
    queryKey: ['typing', otherUserId],
    queryFn: () => apiFetch<{ isTyping: boolean }>(`/api/messages/${otherUserId}/typing`),
    refetchInterval: 2000,
  });
}

export function usePingTyping(otherUserId: string) {
  return useMutation({
    mutationFn: () => apiFetch(`/api/messages/${otherUserId}/typing`, { method: 'POST' }),
  });
}
