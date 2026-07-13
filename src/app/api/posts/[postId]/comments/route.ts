import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { createCommentSchema, paginationQuerySchema } from '@/lib/validation';
import { commentInclude, toCommentDTO } from '@/lib/dto';
import { canViewPost } from '@/lib/social';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || !(await canViewPost(post, userId))) return errorResponse(404, 'Post not found');

  const { searchParams } = request.nextUrl;
  const parsed = paginationQuerySchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) return errorResponse(400, 'Invalid pagination params');
  const { cursor, limit } = parsed.data;

  const comments = await prisma.comment.findMany({
    where: { postId: params.postId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: commentInclude(userId),
  });

  const hasMore = comments.length > limit;
  const sliced = hasMore ? comments.slice(0, -1) : comments;
  const items = sliced.map((c) => toCommentDTO(c, userId));
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor });
}

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || !(await canViewPost(post, userId))) return errorResponse(404, 'Post not found');

  const body = await request.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');

  const comment = await prisma.comment.create({
    data: { content: parsed.data.content, userId, postId: params.postId },
    include: commentInclude(userId),
  });

  await createNotification({
    userId: post.userId,
    actorId: userId,
    type: 'COMMENT',
    postId: post.id,
    commentId: comment.id,
  });

  return NextResponse.json({ comment: toCommentDTO(comment, userId) }, { status: 201 });
}
