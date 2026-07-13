import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse, toPostAuthor } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';
import { isBlockedEitherWay } from '@/lib/social';

const sendRequestSchema = z.object({ receiverId: z.string().min(1) });

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const type = request.nextUrl.searchParams.get('type') === 'outgoing' ? 'outgoing' : 'incoming';

  const requests = await prisma.friendRequest.findMany({
    where:
      type === 'incoming'
        ? { receiverId: userId, status: 'PENDING' }
        : { senderId: userId, status: 'PENDING' },
    include: { sender: true, receiver: true },
    orderBy: { createdAt: 'desc' },
  });

  const items = requests.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    user: toPostAuthor(type === 'incoming' ? r.sender : r.receiver),
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const body = await request.json().catch(() => null);
  const parsed = sendRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, 'A receiverId is required');

  const { receiverId } = parsed.data;
  if (receiverId === userId) return errorResponse(400, "You can't send yourself a friend request");

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) return errorResponse(404, 'User not found');

  if (await isBlockedEitherWay(userId, receiverId)) {
    return errorResponse(403, "You can't send a friend request to this user");
  }

  const existingFriendship = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId, friendId: receiverId } },
  });
  if (existingFriendship) return errorResponse(409, 'You are already friends');

  // If they already sent us a request, accept it instead of creating a duplicate.
  const reverseRequest = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: receiverId, receiverId: userId } },
  });
  if (reverseRequest && reverseRequest.status === 'PENDING') {
    await prisma.$transaction([
      prisma.friendRequest.update({ where: { id: reverseRequest.id }, data: { status: 'ACCEPTED' } }),
      prisma.friendship.create({ data: { userId, friendId: receiverId } }),
      prisma.friendship.create({ data: { userId: receiverId, friendId: userId } }),
    ]);
    await createNotification({ userId: receiverId, actorId: userId, type: 'FRIEND_ACCEPTED' });
    return NextResponse.json({ status: 'FRIENDS' }, { status: 200 });
  }

  const existingRequest = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId: userId, receiverId } },
  });
  if (existingRequest && existingRequest.status === 'PENDING') {
    return errorResponse(409, 'Friend request already sent');
  }

  const friendRequest = existingRequest
    ? await prisma.friendRequest.update({ where: { id: existingRequest.id }, data: { status: 'PENDING' } })
    : await prisma.friendRequest.create({ data: { senderId: userId, receiverId } });

  await createNotification({ userId: receiverId, actorId: userId, type: 'FRIEND_REQUEST' });

  return NextResponse.json({ id: friendRequest.id, status: 'PENDING' }, { status: 201 });
}
