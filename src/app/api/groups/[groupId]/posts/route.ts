import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';
import { createGroupPostSchema, paginationQuerySchema } from '@/lib/validation';
import { createNotification } from '@/lib/notifications';
import type { GroupPostDTO } from '@/types';

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const { searchParams } = request.nextUrl;
  const parsed = paginationQuerySchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return errorResponse(400, 'Invalid pagination params');
  const { cursor, limit } = parsed.data;

  const posts = await prisma.groupPost.findMany({
    where: { groupId: params.groupId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { user: true },
  });

  const hasMore = posts.length > limit;
  const sliced = hasMore ? posts.slice(0, -1) : posts;
  const items: GroupPostDTO[] = sliced.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    author: toPostAuthor(p.user),
  }));
  const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.groupId, userId } },
  });
  if (!membership) return errorResponse(403, 'Join this group to post in it');

  const body = await request.json().catch(() => null);
  const parsed = createGroupPostSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');

  const post = await prisma.groupPost.create({
    data: { groupId: params.groupId, userId, content: parsed.data.content },
    include: { user: true },
  });

  const otherMembers = await prisma.groupMember.findMany({
    where: { groupId: params.groupId, userId: { not: userId } },
    select: { userId: true },
  });
  await Promise.all(
    otherMembers.map((m) =>
      createNotification({ userId: m.userId, actorId: userId, type: 'GROUP_POST', groupId: params.groupId })
    )
  );

  const dto: GroupPostDTO = {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    author: toPostAuthor(post.user),
  };

  return NextResponse.json({ post: dto }, { status: 201 });
}
