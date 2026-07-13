import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest, { params }: { params: { requestId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const friendRequest = await prisma.friendRequest.findUnique({ where: { id: params.requestId } });
  if (!friendRequest || friendRequest.receiverId !== userId) {
    return errorResponse(404, 'Friend request not found');
  }
  if (friendRequest.status !== 'PENDING') {
    return errorResponse(409, 'This request has already been handled');
  }

  await prisma.$transaction([
    prisma.friendRequest.update({ where: { id: friendRequest.id }, data: { status: 'ACCEPTED' } }),
    prisma.friendship.create({ data: { userId: friendRequest.senderId, friendId: friendRequest.receiverId } }),
    prisma.friendship.create({ data: { userId: friendRequest.receiverId, friendId: friendRequest.senderId } }),
  ]);

  await createNotification({ userId: friendRequest.senderId, actorId: userId, type: 'FRIEND_ACCEPTED' });

  return NextResponse.json({ success: true });
}
