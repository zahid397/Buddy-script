import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { getFriendshipInfo, isFollowing } from '@/lib/social';
import type { ProfileDTO } from '@/types';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) return errorResponse(404, 'User not found');

  const [friendCount, followerCount, followingCount, friendshipInfo, followed] = await Promise.all([
    prisma.friendship.count({ where: { userId: user.id } }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    getFriendshipInfo(userId, user.id),
    isFollowing(userId, user.id),
  ]);

  const profile: ProfileDTO = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    coverImageUrl: user.coverImageUrl,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
    friendCount,
    followerCount,
    followingCount,
    isMe: userId === user.id,
    friendshipStatus: friendshipInfo.status,
    friendRequestId: friendshipInfo.requestId,
    isFollowedByMe: followed,
  };

  return NextResponse.json({ profile });
}
