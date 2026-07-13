import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const follows = await prisma.follow.findMany({
    where: { followingId: params.userId },
    include: { follower: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items: follows.map((f) => toPostAuthor(f.follower)) });
}
