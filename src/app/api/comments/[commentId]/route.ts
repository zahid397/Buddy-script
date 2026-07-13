import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';

export async function DELETE(request: NextRequest, { params }: { params: { commentId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
  if (!comment) return errorResponse(404, 'Comment not found');
  if (comment.userId !== userId) return errorResponse(403, 'You can only delete your own comments');

  await prisma.comment.delete({ where: { id: params.commentId } });
  return NextResponse.json({ success: true });
}
