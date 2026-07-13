'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { FriendRequestDTO, PostAuthor } from '@/types';

export function useFriends(userId?: string) {
  return useQuery({
    queryKey: ['friends', userId ?? 'me'],
    queryFn: () => apiFetch<{ items: PostAuthor[] }>(`/api/friends${userId ? `?userId=${userId}` : ''}`),
  });
}

export function useIncomingFriendRequests() {
  return useQuery({
    queryKey: ['friend-requests', 'incoming'],
    queryFn: () => apiFetch<{ items: FriendRequestDTO[] }>('/api/friend-requests?type=incoming'),
    refetchInterval: 10000,
  });
}

export function useOutgoingFriendRequests() {
  return useQuery({
    queryKey: ['friend-requests', 'outgoing'],
    queryFn: () => apiFetch<{ items: FriendRequestDTO[] }>('/api/friend-requests?type=outgoing'),
  });
}

function invalidateFriendQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
  queryClient.invalidateQueries({ queryKey: ['friends'] });
  queryClient.invalidateQueries({ queryKey: ['user-suggestions'] });
  queryClient.invalidateQueries({ queryKey: ['profile'] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (receiverId: string) =>
      apiFetch<{ id?: string; status: string }>('/api/friend-requests', {
        method: 'POST',
        body: JSON.stringify({ receiverId }),
      }),
    onSuccess: () => invalidateFriendQueries(queryClient),
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => apiFetch(`/api/friend-requests/${requestId}/accept`, { method: 'POST' }),
    onSuccess: () => invalidateFriendQueries(queryClient),
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => apiFetch(`/api/friend-requests/${requestId}/reject`, { method: 'POST' }),
    onSuccess: () => invalidateFriendQueries(queryClient),
  });
}

export function useUnfriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (friendId: string) => apiFetch(`/api/friends/${friendId}`, { method: 'DELETE' }),
    onSuccess: () => invalidateFriendQueries(queryClient),
  });
}
