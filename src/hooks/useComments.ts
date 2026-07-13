'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { CommentDTO, PaginatedResponse, ReplyDTO } from '@/types';
import { POSTS_KEY } from './usePosts';

type CommentsData = InfiniteData<PaginatedResponse<CommentDTO>>;

export const commentsKey = (postId: string) => ['comments', postId];
export const repliesKey = (commentId: string) => ['replies', commentId];

function bumpPostCommentCount(queryClient: ReturnType<typeof useQueryClient>, postId: string, delta: number) {
  queryClient.setQueryData(POSTS_KEY, (old: unknown) => {
    const data = old as InfiniteData<PaginatedResponse<{ id: string; commentCount: number }>> | undefined;
    if (!data) return old;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((post) =>
          post.id === postId ? { ...post, commentCount: post.commentCount + delta } : post
        ),
      })),
    };
  });
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: commentsKey(postId),
    queryFn: ({ pageParam }: { pageParam?: string }) => {
      const url = pageParam
        ? `/api/posts/${postId}/comments?cursor=${encodeURIComponent(pageParam)}`
        : `/api/posts/${postId}/comments`;
      return apiFetch<PaginatedResponse<CommentDTO>>(url);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<{ comment: CommentDTO }>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: (res) => {
      queryClient.setQueryData<CommentsData>(commentsKey(postId), (old) => {
        if (!old) return old;
        const [first, ...rest] = old.pages;
        return { ...old, pages: [{ ...first, items: [res.comment, ...first.items] }, ...rest] };
      });
      bumpPostCommentCount(queryClient, postId, 1);
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<CommentsData>(commentsKey(postId), (old) => {
        if (!old) return old;
        return { ...old, pages: old.pages.map((p) => ({ ...p, items: p.items.filter((c) => c.id !== commentId) })) };
      });
      bumpPostCommentCount(queryClient, postId, -1);
    },
  });
}

export function useLikeComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, liked }: { commentId: string; liked: boolean }) =>
      apiFetch<{ likeCount: number; likedByMe: boolean }>(`/api/comments/${commentId}/like`, {
        method: liked ? 'DELETE' : 'POST',
      }),
    onMutate: async ({ commentId, liked }) => {
      await queryClient.cancelQueries({ queryKey: commentsKey(postId) });
      const previous = queryClient.getQueryData<CommentsData>(commentsKey(postId));
      queryClient.setQueryData<CommentsData>(commentsKey(postId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            items: p.items.map((c) =>
              c.id === commentId ? { ...c, likedByMe: !liked, likeCount: c.likeCount + (liked ? -1 : 1) } : c
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(commentsKey(postId), context.previous);
    },
  });
}

export function useReplies(commentId: string, enabled: boolean) {
  return useQuery({
    queryKey: repliesKey(commentId),
    queryFn: () => apiFetch<{ items: ReplyDTO[] }>(`/api/comments/${commentId}/replies`),
    enabled,
  });
}

export function useCreateReply(commentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<{ reply: ReplyDTO }>(`/api/comments/${commentId}/replies`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: (res) => {
      queryClient.setQueryData<{ items: ReplyDTO[] }>(repliesKey(commentId), (old) => ({
        items: [...(old?.items ?? []), res.reply],
      }));
    },
  });
}

export function useDeleteReply(commentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replyId: string) => apiFetch(`/api/replies/${replyId}`, { method: 'DELETE' }),
    onSuccess: (_data, replyId) => {
      queryClient.setQueryData<{ items: ReplyDTO[] }>(repliesKey(commentId), (old) => ({
        items: (old?.items ?? []).filter((r) => r.id !== replyId),
      }));
    },
  });
}

export function useLikeReply(commentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ replyId, liked }: { replyId: string; liked: boolean }) =>
      apiFetch<{ likeCount: number; likedByMe: boolean }>(`/api/replies/${replyId}/like`, {
        method: liked ? 'DELETE' : 'POST',
      }),
    onMutate: async ({ replyId, liked }) => {
      await queryClient.cancelQueries({ queryKey: repliesKey(commentId) });
      const previous = queryClient.getQueryData<{ items: ReplyDTO[] }>(repliesKey(commentId));
      queryClient.setQueryData<{ items: ReplyDTO[] }>(repliesKey(commentId), (old) => ({
        items: (old?.items ?? []).map((r) =>
          r.id === replyId ? { ...r, likedByMe: !liked, likeCount: r.likeCount + (liked ? -1 : 1) } : r
        ),
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(repliesKey(commentId), context.previous);
    },
  });
}
