import { prisma } from './prisma';
import type { FriendshipStatus } from '@/types';

export async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await prisma.friendship.findMany({ where: { userId }, select: { friendId: true } });
  return rows.map((r) => r.friendId);
}

export async function areFriends(userIdA: string, userIdB: string): Promise<boolean> {
  if (userIdA === userIdB) return true;
  const friendship = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: userIdA, friendId: userIdB } },
  });
  return Boolean(friendship);
}

/** Removes both directions of a friendship, if present. */
export async function deleteFriendshipPair(userIdA: string, userIdB: string) {
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { userId: userIdA, friendId: userIdB },
        { userId: userIdB, friendId: userIdA },
      ],
    },
  });
}

export async function getFriendshipInfo(
  viewerId: string,
  otherUserId: string
): Promise<{ status: FriendshipStatus; requestId: string | null }> {
  if (viewerId === otherUserId) return { status: 'NONE', requestId: null };

  const friendship = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: viewerId, friendId: otherUserId } },
  });
  if (friendship) return { status: 'FRIENDS', requestId: null };

  const sentRequest = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: viewerId, receiverId: otherUserId } },
  });
  if (sentRequest?.status === 'PENDING') return { status: 'REQUEST_SENT', requestId: sentRequest.id };

  const receivedRequest = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: otherUserId, receiverId: viewerId } },
  });
  if (receivedRequest?.status === 'PENDING') return { status: 'REQUEST_RECEIVED', requestId: receivedRequest.id };

  return { status: 'NONE', requestId: null };
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return Boolean(follow);
}

/** True if either user has blocked the other. */
export async function isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  return Boolean(block);
}

export async function canViewPost(
  post: { userId: string; visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' },
  viewerId: string
): Promise<boolean> {
  if (post.userId === viewerId) return true;
  if (post.visibility === 'PUBLIC') return true;
  if (post.visibility === 'PRIVATE') return false;
  return areFriends(viewerId, post.userId);
}
