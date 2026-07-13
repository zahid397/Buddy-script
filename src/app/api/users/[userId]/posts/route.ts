import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { paginationQuerySchema } from '@/lib/validation';
import { postInclude, toPostDTO } from '@/lib/dto';
import { areFriends } from '@/lib/social';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const { searchParams } = request.nextUrl;
  const parsed = paginationQuerySchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return errorResponse(400, 'Invalid pagination params');
  const { cursor, limit } = parsed.data;

  const isSelf = userId === params.userId;
  const canSeeFriendsOnly = isSelf || (await areFriends(userId, params.userId));

  const where = isSelf
    ? { userId: params.userId }
    : {
        userId: params.userId,
        OR: [{ visibility: 'PUBLIC' as const }, ...(canSeeFriendsOnly ? [{ visibility: 'FRIENDS' as const }] : [])],
      };

  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: postInclude(userId),
  });

  const hasMore = posts.length > limit;
  const sliced = hasMore ? posts.slice(0, -1) : posts;
  const items = sliced.map((p) => toPostDTO(p, userId));
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
