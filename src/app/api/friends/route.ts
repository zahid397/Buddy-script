import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const targetUserId = request.nextUrl.searchParams.get('userId') || userId;

  const friendships = await prisma.friendship.findMany({
    where: { userId: targetUserId },
    include: { friend: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items: friendships.map((f) => toPostAuthor(f.friend)) });
}
