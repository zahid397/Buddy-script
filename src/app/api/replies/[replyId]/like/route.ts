import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: { replyId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const reply = await prisma.reply.findUnique({ where: { id: params.replyId } });
  if (!reply) return errorResponse(404, 'Reply not found');

  await prisma.replyLike.upsert({
    where: { userId_replyId: { userId, replyId: params.replyId } },
    create: { userId, replyId: params.replyId },
    update: {},
  });

  await createNotification({ userId: reply.userId, actorId: userId, type: 'LIKE', replyId: reply.id });

  const likeCount = await prisma.replyLike.count({ where: { replyId: params.replyId } });
  return NextResponse.json({ likeCount, likedByMe: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { replyId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.replyLike.deleteMany({ where: { userId, replyId: params.replyId } });

  const likeCount = await prisma.replyLike.count({ where: { replyId: params.replyId } });
  return NextResponse.json({ likeCount, likedByMe: false });
}
