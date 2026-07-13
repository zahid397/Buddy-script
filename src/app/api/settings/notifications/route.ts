import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { updateNotificationPrefsSchema } from '@/lib/validation';

export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const body = await request.json().catch(() => null);
  const parsed = updateNotificationPrefsSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message ?? 'Invalid input');

  const user = await prisma.user.update({ where: { id: userId }, data: parsed.data });

  return NextResponse.json({
    notifyOnMessage: user.notifyOnMessage,
    notifyOnFriendRequest: user.notifyOnFriendRequest,
    notifyOnComment: user.notifyOnComment,
    notifyOnGroupActivity: user.notifyOnGroupActivity,
    notifyOnEvent: user.notifyOnEvent,
  });
}
