import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';

export async function POST(request: NextRequest, { params }: { params: { notificationId: string } }) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const notification = await prisma.notification.findUnique({ where: { id: params.notificationId } });
  if (!notification || notification.userId !== userId) return errorResponse(404, 'Notification not found');

  await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
  return NextResponse.json({ success: true });
}
