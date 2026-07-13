import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';

export async function DELETE(request: NextRequest, { params }: { params: { replyId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const reply = await prisma.reply.findUnique({ where: { id: params.replyId } });
  if (!reply) return errorResponse(404, 'Reply not found');
  if (reply.userId !== userId) return errorResponse(403, 'You can only delete your own replies');

  await prisma.reply.delete({ where: { id: params.replyId } });
  return NextResponse.json({ success: true });
}
