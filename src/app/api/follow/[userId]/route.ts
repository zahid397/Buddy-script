import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');
  if (userId === params.userId) return errorResponse(400, "You can't follow yourself");

  const target = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!target) return errorResponse(404, 'User not found');

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: userId, followingId: params.userId } },
    create: { followerId: userId, followingId: params.userId },
    update: {},
  });

  await createNotification({ userId: params.userId, actorId: userId, type: 'FOLLOW' });

  const followerCount = await prisma.follow.count({ where: { followingId: params.userId } });
  return NextResponse.json({ isFollowing: true, followerCount });
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.follow.deleteMany({ where: { followerId: userId, followingId: params.userId } });

  const followerCount = await prisma.follow.count({ where: { followingId: params.userId } });
  return NextResponse.json({ isFollowing: false, followerCount });
}
