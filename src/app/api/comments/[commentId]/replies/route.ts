import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { createReplySchema } from '@/lib/validation';
import { replyInclude, toReplyDTO } from '@/lib/dto';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest, { params }: { params: { commentId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const replies = await prisma.reply.findMany({
    where: { commentId: params.commentId },
    orderBy: { createdAt: 'asc' },
    include: replyInclude(userId),
  });

  return NextResponse.json({ items: replies.map((r) => toReplyDTO(r, userId)) });
}

export async function POST(request: NextRequest, { params }: { params: { commentId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const comment = await prisma.comment.findUnique({ where: { id: params.commentId } });
  if (!comment) return errorResponse(404, 'Comment not found');

  const body = await request.json().catch(() => null);
  const parsed = createReplySchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');

  const reply = await prisma.reply.create({
    data: { content: parsed.data.content, userId, commentId: params.commentId },
    include: replyInclude(userId),
  });

  await createNotification({
    userId: comment.userId,
    actorId: userId,
    type: 'REPLY',
    commentId: comment.id,
    replyId: reply.id,
    postId: comment.postId,
  });

  return NextResponse.json({ reply: toReplyDTO(reply, userId) }, { status: 201 });
}
