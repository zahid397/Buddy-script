'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse, SavedPostDTO } from '@/types';

export const BOOKMARKS_KEY = ['bookmarks'];

export function useSavedPosts() {
  return useInfiniteQuery({
    queryKey: BOOKMARKS_KEY,
    queryFn: ({ pageParam }: { pageParam?: string }) => {
      const url = pageParam ? `/api/bookmarks?cursor=${encodeURIComponent(pageParam)}` : '/api/bookmarks';
      return apiFetch<PaginatedResponse<SavedPostDTO>>(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useSavePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, saved }: { postId: string; saved: boolean }) =>
      apiFetch<{ savedByMe: boolean }>(`/api/posts/${postId}/save`, { method: saved ? 'DELETE' : 'POST' }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARKS_KEY });
    },
  });
}

export function useRemoveBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiFetch(`/api/posts/${postId}/save`, { method: 'DELETE' }),
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: BOOKMARKS_KEY });
      const previous = queryClient.getQueryData(BOOKMARKS_KEY);
      queryClient.setQueryData<{ pages: PaginatedResponse<SavedPostDTO>[]; pageParams: unknown[] }>(BOOKMARKS_KEY, (old) => {
        if (!old) return old;
        return { ...old, pages: old.pages.map((p) => ({ ...p, items: p.items.filter((s) => s.post.id !== postId) })) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(BOOKMARKS_KEY, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BOOKMARKS_KEY });
    },
  });
}
