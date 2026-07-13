import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';
import { getFriendIds, getFriendshipInfo, isFollowing } from '@/lib/social';
import type { SuggestedUserDTO } from '@/types';

const RECENT_ACTIVITY_DAYS = 7;

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const type = request.nextUrl.searchParams.get('type') === 'follow' ? 'follow' : 'friends';
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 5), 20);

  const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { location: true, interests: true } });
  const friendIds = await getFriendIds(userId);

  const [blocks, dismissed] = await Promise.all([
    prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    }),
    prisma.dismissedSuggestion.findMany({ where: { userId }, select: { dismissedId: true } }),
  ]);
  const blockedIds = blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
  const dismissedIds = dismissed.map((d) => d.dismissedId);

  let excludeIds = [userId, ...friendIds, ...blockedIds, ...dismissedIds];
  if (type === 'follow') {
    const following = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    excludeIds = [userId, ...following.map((f) => f.followingId), ...blockedIds, ...dismissedIds];
  }

  // Cast a wider net than `limit` so ranking has something to work with,
  // then trim to `limit` after scoring.
  const candidates = await prisma.user.findMany({
    where: { id: { notIn: excludeIds } },
    take: limit * 4,
    orderBy: { createdAt: 'desc' },
  });

  if (candidates.length === 0) return NextResponse.json({ items: [] });

  const candidateIds = candidates.map((c) => c.id);
  const recentActivityCutoff = new Date(Date.now() - RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000);

  const [candidateFriendships, recentPosts, recentLikes, recentComments] = await Promise.all([
    prisma.friendship.findMany({ where: { userId: { in: candidateIds } }, select: { userId: true, friendId: true } }),
    prisma.post.findMany({ where: { userId: { in: candidateIds }, createdAt: { gte: recentActivityCutoff } }, select: { userId: true } }),
    prisma.like.findMany({ where: { userId: { in: candidateIds }, createdAt: { gte: recentActivityCutoff } }, select: { userId: true } }),
    prisma.comment.findMany({ where: { userId: { in: candidateIds }, createdAt: { gte: recentActivityCutoff } }, select: { userId: true } }),
  ]);

  const friendIdSet = new Set(friendIds);
  const candidateFriendMap = new Map<string, Set<string>>();
  for (const f of candidateFriendships) {
    if (!candidateFriendMap.has(f.userId)) candidateFriendMap.set(f.userId, new Set());
    candidateFriendMap.get(f.userId)!.add(f.friendId);
  }
  const recentActiveIds = new Set([...recentPosts, ...recentLikes, ...recentComments].map((r) => r.userId));

  const viewerInterests = new Set(viewer?.interests ?? []);

  const scored = candidates.map((candidate) => {
    const candidateFriends = candidateFriendMap.get(candidate.id) ?? new Set<string>();
    let mutualFriendCount = 0;
    for (const id of candidateFriends) {
      if (friendIdSet.has(id)) mutualFriendCount++;
    }

    const sharedInterests = candidate.interests.filter((i) => viewerInterests.has(i)).length;
    const sameLocation = Boolean(viewer?.location) && candidate.location === viewer?.location ? 1 : 0;
    const recentlyActive = recentActiveIds.has(candidate.id) ? 1 : 0;

    const score = mutualFriendCount * 3 + sharedInterests * 2 + sameLocation * 2 + recentlyActive * 1;

    return { candidate, mutualFriendCount, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  const items: SuggestedUserDTO[] = await Promise.all(
    top.map(async ({ candidate, mutualFriendCount }) => {
      const [friendshipInfo, followed] = await Promise.all([
        getFriendshipInfo(userId, candidate.id),
        isFollowing(userId, candidate.id),
      ]);
      return {
        ...toPostAuthor(candidate),
        bio: candidate.bio,
        mutualFriendCount,
        friendshipStatus: friendshipInfo.status,
        friendRequestId: friendshipInfo.requestId,
        isFollowedByMe: followed,
      };
    })
  );

  return NextResponse.json({ items });
}
