import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: { commentId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const likes = await prisma.commentLike.findMany({
    where: { commentId: params.commentId },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ users: likes.map((l) => toPostAuthor(l.user)) });
}
