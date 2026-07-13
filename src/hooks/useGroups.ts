'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { GroupDTO, GroupPostDTO, PaginatedResponse } from '@/types';

export function useGroups(filter: 'discover' | 'joined') {
  return useQuery({
    queryKey: ['groups', filter],
    queryFn: () => apiFetch<{ items: GroupDTO[] }>(`/api/groups?filter=${filter}`),
  });
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => apiFetch<{ group: GroupDTO }>(`/api/groups/${groupId}`),
    enabled: Boolean(groupId),
  });
}

export function useGroupPosts(groupId: string) {
  return useInfiniteQuery({
    queryKey: ['group-posts', groupId],
    queryFn: ({ pageParam }: { pageParam?: string }) => {
      const url = pageParam
        ? `/api/groups/${groupId}/posts?cursor=${encodeURIComponent(pageParam)}`
        : `/api/groups/${groupId}/posts`;
      return apiFetch<PaginatedResponse<GroupPostDTO>>(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(groupId),
  });
}

function invalidateGroupQueries(queryClient: ReturnType<typeof useQueryClient>, groupId: string) {
  queryClient.invalidateQueries({ queryKey: ['groups'] });
  queryClient.invalidateQueries({ queryKey: ['group', groupId] });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => apiFetch<{ isMember: boolean; memberCount: number }>(`/api/groups/${groupId}/join`, { method: 'POST' }),
    onSuccess: (_res, groupId) => invalidateGroupQueries(queryClient, groupId),
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      apiFetch<{ isMember: boolean; memberCount: number }>(`/api/groups/${groupId}/join`, { method: 'DELETE' }),
    onSuccess: (_res, groupId) => invalidateGroupQueries(queryClient, groupId),
  });
}

export function useCreateGroupPost(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<{ post: GroupPostDTO }>(`/api/groups/${groupId}/posts`, { method: 'POST', body: JSON.stringify({ content }) }),
    onSuccess: (res) => {
      queryClient.setQueryData<{ pages: PaginatedResponse<GroupPostDTO>[]; pageParams: unknown[] }>(
        ['group-posts', groupId],
        (old) => {
          if (!old) return old;
          const [first, ...rest] = old.pages;
          return { ...old, pages: [{ ...first, items: [res.post, ...first.items] }, ...rest] };
        }
      );
    },
  });
}
