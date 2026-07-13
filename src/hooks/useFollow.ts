'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PostAuthor } from '@/types';

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => apiFetch<{ items: PostAuthor[] }>(`/api/users/${userId}/followers`),
  });
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => apiFetch<{ items: PostAuthor[] }>(`/api/users/${userId}/following`),
  });
}

function invalidateFollowQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['followers'] });
  queryClient.invalidateQueries({ queryKey: ['following'] });
  queryClient.invalidateQueries({ queryKey: ['user-suggestions'] });
  queryClient.invalidateQueries({ queryKey: ['profile'] });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<{ isFollowing: boolean; followerCount: number }>(`/api/follow/${userId}`, { method: 'POST' }),
    onSuccess: () => invalidateFollowQueries(queryClient),
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch<{ isFollowing: boolean; followerCount: number }>(`/api/follow/${userId}`, { method: 'DELETE' }),
    onSuccess: () => invalidateFollowQueries(queryClient),
  });
}

export function useUserSuggestions(type: 'friends' | 'follow', limit = 5) {
  return useQuery({
    queryKey: ['user-suggestions', type, limit],
    queryFn: () =>
      apiFetch<{ items: import('@/types').SuggestedUserDTO[] }>(`/api/users/suggestions?type=${type}&limit=${limit}`),
  });
}
