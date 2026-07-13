import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { postInclude, toPostDTO } from '@/lib/dto';
import { canViewPost } from '@/lib/social';

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    include: postInclude(userId),
  });

  if (!post || !(await canViewPost(post, userId))) {
    return errorResponse(404, 'Post not found');
  }

  return NextResponse.json({ post: toPostDTO(post, userId) });
}

export async function DELETE(request: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const post = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!post) return errorResponse(404, 'Post not found');
  if (post.userId !== userId) return errorResponse(403, 'You can only delete your own posts');

  await prisma.post.delete({ where: { id: params.postId } });
  return NextResponse.json({ success: true });
}
