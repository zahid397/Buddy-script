import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';
import { getFriendIds, getFriendshipInfo, isFollowing } from '@/lib/social';
import type { SuggestedUserDTO } from '@/types';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const type = request.nextUrl.searchParams.get('type') === 'follow' ? 'follow' : 'friends';
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 5), 20);

  const friendIds = await getFriendIds(userId);
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  const blockedIds = blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));

  let excludeIds = [userId, ...friendIds, ...blockedIds];
  if (type === 'follow') {
    const following = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    excludeIds = [userId, ...following.map((f) => f.followingId), ...blockedIds];
  }

  const users = await prisma.user.findMany({
    where: { id: { notIn: excludeIds } },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const items: SuggestedUserDTO[] = await Promise.all(
    users.map(async (u) => {
      const [friendshipInfo, followed] = await Promise.all([
        getFriendshipInfo(userId, u.id),
        isFollowing(userId, u.id),
      ]);
      return {
        ...toPostAuthor(u),
        friendshipStatus: friendshipInfo.status,
        friendRequestId: friendshipInfo.requestId,
        isFollowedByMe: followed,
      };
    })
  );

  return NextResponse.json({ items });
}
