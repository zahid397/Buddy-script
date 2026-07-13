import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: { commentId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
  if (!comment) return errorResponse(404, 'Comment not found');

  await prisma.commentLike.upsert({
    where: { userId_commentId: { userId, commentId: params.commentId } },
    create: { userId, commentId: params.commentId },
    update: {},
  });

  await createNotification({ userId: comment.userId, actorId: userId, type: 'LIKE', commentId: comment.id, postId: comment.postId });

  const likeCount = await prisma.commentLike.count({ where: { commentId: params.commentId } });
  return NextResponse.json({ likeCount, likedByMe: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { commentId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.commentLike.deleteMany({ where: { userId, commentId: params.commentId } });

  const likeCount = await prisma.commentLike.count({ where: { commentId: params.commentId } });
  return NextResponse.json({ likeCount, likedByMe: false });
}
