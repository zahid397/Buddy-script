import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { shareSchema } from '@/lib/validation';
import { postInclude, toPostDTO } from '@/lib/dto';
import { canViewPost } from '@/lib/social';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const original = await prisma.post.findUnique({ where: { id: params.postId } });
  if (!original || !(await canViewPost(original, userId))) return errorResponse(404, 'Post not found');

  const body = await request.json().catch(() => ({}));
  const parsed = shareSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, 'Invalid input');

  // Sharing a share re-points at the original post, so the chain never nests.
  const rootId = original.sharedFromId ?? original.id;

  const post = await prisma.post.create({
    data: {
      content: parsed.data.content,
      visibility: 'PUBLIC',
      userId,
      sharedFromId: rootId,
    },
    include: postInclude(userId),
  });

  await createNotification({ userId: original.userId, actorId: userId, type: 'SHARE', postId: rootId });

  return NextResponse.json({ post: toPostDTO(post, userId) }, { status: 201 });
}
