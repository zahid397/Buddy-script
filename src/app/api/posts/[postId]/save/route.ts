import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { canViewPost } from '@/lib/social';

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post || !(await canViewPost(post, userId))) return errorResponse(404, 'Post not found');

  await prisma.savedPost.upsert({
    where: { userId_postId: { userId, postId: params.postId } },
    create: { userId, postId: params.postId },
    update: {},
  });

  return NextResponse.json({ savedByMe: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  await prisma.savedPost.deleteMany({ where: { userId, postId: params.postId } });

  return NextResponse.json({ savedByMe: false });
}
