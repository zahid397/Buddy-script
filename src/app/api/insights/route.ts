import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { postInclude, toPostDTO } from '@/lib/dto';
import type { InsightsDTO } from '@/types';

const ACTIVITY_DAYS = 7;

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const since = new Date();
  since.setDate(since.getDate() - (ACTIVITY_DAYS - 1));
  since.setHours(0, 0, 0, 0);

  const [
    user,
    totalPosts,
    totalLikesReceived,
    totalCommentsReceived,
    friendsCount,
    followersCount,
    followingCount,
    messagesSent,
    unreadNotifications,
    eventsJoined,
    savedPostsCount,
    recentPosts,
    recentLikes,
    recentComments,
    topPostRow,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.post.count({ where: { userId } }),
    prisma.like.count({ where: { post: { userId } } }),
    prisma.comment.count({ where: { post: { userId } } }),
    prisma.friendship.count({ where: { userId } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.message.count({ where: { senderId: userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.eventAttendee.count({ where: { userId } }),
    prisma.savedPost.count({ where: { userId } }),
    prisma.post.findMany({ where: { userId, createdAt: { gte: since } }, select: { id: true, createdAt: true } }),
    prisma.like.findMany({ where: { post: { userId }, createdAt: { gte: since } }, select: { id: true, createdAt: true } }),
    prisma.comment.findMany({ where: { post: { userId }, createdAt: { gte: since } }, select: { id: true, createdAt: true } }),
    prisma.post.findFirst({
      where: { userId },
      orderBy: [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }],
      include: postInclude(userId),
    }),
  ]);

  if (!user) return errorResponse(404, 'User not found');

  const weeklyActivity: InsightsDTO['weeklyActivity'] = [];
  for (let i = 0; i < ACTIVITY_DAYS; i++) {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    const dayKey = day.toISOString().slice(0, 10);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const inDay = (d: Date) => d >= day && d < nextDay;
    weeklyActivity.push({
      date: dayKey,
      posts: recentPosts.filter((p) => inDay(p.createdAt)).length,
      likes: recentLikes.filter((l) => inDay(l.createdAt)).length,
      comments: recentComments.filter((c) => inDay(c.createdAt)).length,
    });
  }

  const profileFields = [user.bio, user.location, user.avatarUrl, user.coverImageUrl, user.interests.length > 0 ? 'x' : null];
  const profileCompletionPercent = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  const insights: InsightsDTO = {
    totalPosts,
    totalLikesReceived,
    totalCommentsReceived,
    friendsCount,
    followersCount,
    followingCount,
    messagesSent,
    unreadNotifications,
    eventsJoined,
    savedPostsCount,
    profileCompletionPercent,
    weeklyActivity,
    topPost: topPostRow ? toPostDTO(topPostRow, userId) : null,
  };

  return NextResponse.json(insights);
}
