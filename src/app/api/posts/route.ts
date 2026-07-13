import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { createPostSchema, paginationQuerySchema } from '@/lib/validation';
import { postInclude, toPostDTO } from '@/lib/dto';
import { getFriendIds } from '@/lib/social';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const { searchParams } = request.nextUrl;
  const parsed = paginationQuerySchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return errorResponse(400, 'Invalid pagination params');
  const { cursor, limit } = parsed.data;

  const friendIds = await getFriendIds(userId);

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { visibility: 'PUBLIC' },
        { userId },
        { visibility: 'FRIENDS', userId: { in: friendIds } },
      ],
    },
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

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const body = await request.json().catch(() => null);
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');

  const post = await prisma.post.create({
    data: {
      content: parsed.data.content,
      imageUrl: parsed.data.imageUrl ?? null,
      imageBlurHash: parsed.data.imageBlurHash ?? null,
      visibility: parsed.data.visibility,
      userId,
    },
    include: postInclude(userId),
  });

  return NextResponse.json({ post: toPostDTO(post, userId) }, { status: 201 });
}
