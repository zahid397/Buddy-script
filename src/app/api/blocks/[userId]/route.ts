import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { deleteFriendshipPair } from '@/lib/social';

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');
  if (userId === params.userId) return errorResponse(400, "You can't block yourself");

  const target = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!target) return errorResponse(404, 'User not found');

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: params.userId } },
    create: { blockerId: userId, blockedId: params.userId },
    update: {},
  });

  // Blocking severs any existing relationship in both directions.
  await deleteFriendshipPair(userId, params.userId);
  await prisma.friendRequest.deleteMany({
    where: {
      OR: [
        { senderId: userId, receiverId: params.userId },
        { senderId: params.userId, receiverId: userId },
      ],
    },
  });
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: userId, followingId: params.userId },
        { followerId: params.userId, followingId: userId },
      ],
    },
  });

  return NextResponse.json({ blocked: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.block.deleteMany({ where: { blockerId: userId, blockedId: params.userId } });

  return NextResponse.json({ blocked: false });
}
