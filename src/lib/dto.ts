import type { Post, User, Comment, Reply, Event } from '@prisma/client';
import { toPostAuthor } from './utils';
import type { PostDTO, CommentDTO, ReplyDTO, EventDTO } from '@/types';

type SharedFromWithRelations = Post & { user: User };

type PostWithRelations = Post & {
  user: User;
  _count: { likes: number; comments: number; shares: number };
  likes: { id: string }[];
  saves: { id: string }[];
  sharedFrom: SharedFromWithRelations | null;
};

export function toPostDTO(post: PostWithRelations, viewerId: string): PostDTO {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    imageBlurHash: post.imageBlurHash,
    visibility: post.visibility,
    createdAt: post.createdAt.toISOString(),
    author: toPostAuthor(post.user),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    shareCount: post._count.shares,
    likedByMe: post.likes.length > 0,
    savedByMe: post.saves.length > 0,
    isMine: post.userId === viewerId,
    sharedFrom: post.sharedFrom
      ? {
          id: post.sharedFrom.id,
          content: post.sharedFrom.content,
          imageUrl: post.sharedFrom.imageUrl,
          imageBlurHash: post.sharedFrom.imageBlurHash,
          createdAt: post.sharedFrom.createdAt.toISOString(),
          author: toPostAuthor(post.sharedFrom.user),
        }
      : null,
  };
}

type CommentWithRelations = Comment & {
  user: User;
  _count: { likes: number; replies: number };
  likes: { id: string }[];
};

export function toCommentDTO(comment: CommentWithRelations, viewerId: string): CommentDTO {
  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: toPostAuthor(comment.user),
    likeCount: comment._count.likes,
    likedByMe: comment.likes.length > 0,
    isMine: comment.userId === viewerId,
    replyCount: comment._count.replies,
  };
}

type ReplyWithRelations = Reply & {
  user: User;
  _count: { likes: number };
  likes: { id: string }[];
};

export function toReplyDTO(reply: ReplyWithRelations, viewerId: string): ReplyDTO {
  return {
    id: reply.id,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
    author: toPostAuthor(reply.user),
    likeCount: reply._count.likes,
    likedByMe: reply.likes.length > 0,
    isMine: reply.userId === viewerId,
  };
}

type EventWithRelations = Event & {
  createdBy: User;
  _count: { attendees: number };
  attendees: { id: string }[];
};

export function toEventDTO(event: EventWithRelations): EventDTO {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    coverImageUrl: event.coverImageUrl,
    location: event.location,
    eventDate: event.eventDate.toISOString(),
    createdBy: toPostAuthor(event.createdBy),
    attendeeCount: event._count.attendees,
    isGoing: event.attendees.length > 0,
  };
}

export const eventInclude = (viewerId: string) => ({
  createdBy: true,
  _count: { select: { attendees: true } },
  attendees: { where: { userId: viewerId }, select: { id: true } },
});

export const postInclude = (viewerId: string) => ({
  user: true,
  _count: { select: { likes: true, comments: true, shares: true } },
  likes: { where: { userId: viewerId }, select: { id: true } },
  saves: { where: { userId: viewerId }, select: { id: true } },
  sharedFrom: { include: { user: true } },
});

export const commentInclude = (viewerId: string) => ({
  user: true,
  _count: { select: { likes: true, replies: true } },
  likes: { where: { userId: viewerId }, select: { id: true } },
});

export const replyInclude = (viewerId: string) => ({
  user: true,
  _count: { select: { likes: true } },
  likes: { where: { userId: viewerId }, select: { id: true } },
});
