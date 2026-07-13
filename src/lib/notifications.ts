import { prisma } from './prisma';
import type { NotificationType } from '@prisma/client';

/** Creates a notification for `userId`, skipping self-notifications
 * (e.g. liking your own post never notifies you). Used by every route that
 * represents a social action another user should hear about. */
export async function createNotification(params: {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  replyId?: string | null;
  eventId?: string | null;
}) {
  if (params.actorId && params.actorId === params.userId) return null;
  return prisma.notification.create({
    data: {
      userId: params.userId,
      actorId: params.actorId ?? null,
      type: params.type,
      postId: params.postId ?? null,
      commentId: params.commentId ?? null,
      replyId: params.replyId ?? null,
      eventId: params.eventId ?? null,
    },
  });
}
