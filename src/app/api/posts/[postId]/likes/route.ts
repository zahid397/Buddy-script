import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';
import { canViewPost } from '@/lib/social';

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || !(await canViewPost(post, userId))) return errorResponse(404, 'Post not found');

  const likes = await prisma.like.findMany({
    where: { postId: params.postId },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ users: likes.map((l) => toPostAuthor(l.user)) });
}
