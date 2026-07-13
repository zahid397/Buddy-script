import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';
import { searchQuerySchema } from '@/lib/validation';
import { postInclude, toPostDTO, eventInclude, toEventDTO } from '@/lib/dto';
import { getFriendIds } from '@/lib/social';
import type { SearchResultsDTO } from '@/types';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const parsed = searchQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q') ?? undefined,
    type: request.nextUrl.searchParams.get('type') ?? undefined,
  });
  if (!parsed.success) return errorResponse(400, 'A search query is required');
  const { q, type } = parsed.data;

  const friendIds = await getFriendIds(userId);
  const wantUsers = type === 'all' || type === 'users';
  const wantPosts = type === 'all' || type === 'posts';
  const wantEvents = type === 'all' || type === 'events';

  const [users, posts, events] = await Promise.all([
    wantUsers
      ? prisma.user.findMany({
          where: {
            id: { not: userId },
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 10,
        })
      : Promise.resolve([]),
    wantPosts
      ? prisma.post.findMany({
          where: {
            content: { contains: q, mode: 'insensitive' },
            OR: [{ visibility: 'PUBLIC' }, { userId }, { visibility: 'FRIENDS', userId: { in: friendIds } }],
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: postInclude(userId),
        })
      : Promise.resolve([]),
    wantEvents
      ? prisma.event.findMany({
          where: {
            OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }],
          },
          take: 10,
          include: eventInclude(userId),
        })
      : Promise.resolve([]),
  ]);

  const results: SearchResultsDTO = {
    users: users.map(toPostAuthor),
    posts: posts.map((p) => toPostDTO(p, userId)),
    events: events.map(toEventDTO),
  };

  return NextResponse.json(results);
}
