import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';
import { paginationQuerySchema } from '@/lib/validation';
import type { NotificationDTO } from '@/types';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const { searchParams } = request.nextUrl;
  const parsed = paginationQuerySchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return errorResponse(400, 'Invalid pagination params');
  const { cursor, limit } = parsed.data;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { actor: true },
  });

  const hasMore = notifications.length > limit;
  const sliced = hasMore ? notifications.slice(0, -1) : notifications;
  const items: NotificationDTO[] = sliced.map((n) => ({
    id: n.id,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    actor: n.actor ? toPostAuthor(n.actor) : null,
    postId: n.postId,
    commentId: n.commentId,
    replyId: n.replyId,
    eventId: n.eventId,
    groupId: n.groupId,
  }));
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
