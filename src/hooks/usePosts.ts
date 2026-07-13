'use client';

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PaginatedResponse, PostDTO } from '@/types';
import type { CreatePostInput } from '@/lib/validation';

export const POSTS_KEY = ['posts'];
type PostsData = InfiniteData<PaginatedResponse<PostDTO>>;

export function usePosts() {
  return useInfiniteQuery({
    queryKey: POSTS_KEY,
    queryFn: ({ pageParam }: { pageParam?: string }) => {
      const url = pageParam ? `/api/posts?cursor=${encodeURIComponent(pageParam)}` : '/api/posts';
      return apiFetch<PaginatedResponse<PostDTO>>(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

function mapPosts(data: PostsData | undefined, fn: (post: PostDTO) => PostDTO): PostsData | undefined {
  if (!data) return data;
  return { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map(fn) })) };
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => apiFetch<{ post: PostDTO }>('/api/posts', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (res) => {
      queryClient.setQueryData<PostsData>(POSTS_KEY, (old) => {
        if (!old) return old;
        const [first, ...rest] = old.pages;
        return { ...old, pages: [{ ...first, items: [res.post, ...first.items] }, ...rest] };
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiFetch(`/api/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: (_data, postId) => {
      queryClient.setQueryData<PostsData>(POSTS_KEY, (old) => {
        if (!old) return old;
        return { ...old, pages: old.pages.map((p) => ({ ...p, items: p.items.filter((post) => post.id !== postId) })) };
      });
    },
  });
}

export function useSharePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content?: string }) =>
      apiFetch<{ post: PostDTO }>(`/api/posts/${postId}/share`, {
        method: 'POST',
        body: JSON.stringify({ content: content ?? '' }),
      }),
    onSuccess: (res) => {
      queryClient.setQueryData<PostsData>(POSTS_KEY, (old) => {
        if (!old) return old;
        const [first, ...rest] = old.pages;
        return { ...old, pages: [{ ...first, items: [res.post, ...first.items] }, ...rest] };
      });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      apiFetch<{ likeCount: number; likedByMe: boolean }>(`/api/posts/${postId}/like`, {
        method: liked ? 'DELETE' : 'POST',
      }),
    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey: POSTS_KEY });
      const previous = queryClient.getQueryData<PostsData>(POSTS_KEY);
      queryClient.setQueryData<PostsData>(POSTS_KEY, (old) =>
        mapPosts(old, (post) =>
          post.id === postId ? { ...post, likedByMe: !liked, likeCount: post.likeCount + (liked ? -1 : 1) } : post
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(POSTS_KEY, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: POSTS_KEY });
    },
  });
}
