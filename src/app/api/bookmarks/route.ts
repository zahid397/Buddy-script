import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { paginationQuerySchema } from '@/lib/validation';
import { postInclude, toPostDTO } from '@/lib/dto';

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

  const saves = await prisma.savedPost.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { post: { include: postInclude(userId) } },
  });

  const hasMore = saves.length > limit;
  const sliced = hasMore ? saves.slice(0, -1) : saves;
  const items = sliced.map((s) => ({
    id: s.id,
    savedAt: s.createdAt.toISOString(),
    post: toPostDTO(s.post, userId),
  }));
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}
