import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { paginationQuerySchema, sendMessageSchema } from '@/lib/validation';
import { createNotification } from '@/lib/notifications';
import { isBlockedEitherWay } from '@/lib/social';
import type { MessageDTO } from '@/types';

function toMessageDTO(m: { id: string; content: string; senderId: string; receiverId: string; createdAt: Date; readAt: Date | null }): MessageDTO {
  return {
    id: m.id,
    content: m.content,
    senderId: m.senderId,
    receiverId: m.receiverId,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt?.toISOString() ?? null,
  };
}

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const { searchParams } = request.nextUrl;
  const parsed = paginationQuerySchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return errorResponse(400, 'Invalid pagination params');
  const { cursor, limit } = parsed.data;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: params.userId },
        { senderId: params.userId, receiverId: userId },
      ],
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > limit;
  const sliced = hasMore ? messages.slice(0, -1) : messages;
  const items = sliced.map(toMessageDTO);
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');
  if (userId === params.userId) return errorResponse(400, "You can't message yourself");

  const receiver = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!receiver) return errorResponse(404, 'User not found');

  if (await isBlockedEitherWay(userId, params.userId)) {
    return errorResponse(403, "You can't message this user");
  }

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');

  const message = await prisma.message.create({
    data: { senderId: userId, receiverId: params.userId, content: parsed.data.content },
  });

  await createNotification({ userId: params.userId, actorId: userId, type: 'MESSAGE' });

  return NextResponse.json({ message: toMessageDTO(message) }, { status: 201 });
}
